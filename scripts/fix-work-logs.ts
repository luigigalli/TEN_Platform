import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';

interface TaskContent {
  title: string;
  status: string;
  priority: string;
  assignee: string;
  workLogs: {
    date: string;
    timeSpent: string;
    comment: string;
    type: string;
  }[];
}

function parseExistingContent(content: string): TaskContent {
  const titleMatch = content.match(/# Task Work Log: \[([^\]]+)\] (.+)/);
  const statusMatch = content.match(/\*\*Status\*\*:\s*(.+)/);
  const priorityMatch = content.match(/\*\*Priority\*\*:\s*(.+)/);
  const assigneeMatch = content.match(/\*\*Assignee\*\*:\s*(.+)/);

  // Extract work logs from Implementation Log section
  const implementationSection = content.match(/## Implementation Log([\s\S]*?)(?=##|$)/)?.[1] || '';
  const workLogs = implementationSection
    .split(/###\s*\[\d{4}-\d{2}-\d{2}\]/)
    .filter(entry => entry.trim())
    .map(entry => {
      const dateMatch = entry.match(/\[(\d{4}-\d{2}-\d{2})\]/);
      const workDone = entry.match(/#### Work Done\n([\s\S]*?)(?=\n###|\n$)/)?.[1] || '';
      
      return {
        date: dateMatch?.[1] || new Date().toISOString().split('T')[0],
        timeSpent: '1h', // Default value
        comment: workDone.trim(),
        type: 'Development'
      };
    });

  return {
    title: titleMatch?.[2] || 'Unknown Task',
    status: statusMatch?.[1] || 'In Progress',
    priority: priorityMatch?.[1] || 'Medium',
    assignee: assigneeMatch?.[1] || process.env.USER || 'Unknown',
    workLogs: workLogs.length > 0 ? workLogs : [{
      date: new Date().toISOString().split('T')[0],
      timeSpent: '1h',
      comment: 'Initial work log entry',
      type: 'Development'
    }]
  };
}

function generateUpdatedContent(taskId: string, task: TaskContent): string {
  let content = `# Task Work Log: [${taskId}] ${task.title}\n\n`;

  // Task Information
  content += `### Task Information\n`;
  content += `**Status**: ${task.status}\n`;
  content += `**Priority**: ${task.priority}\n`;
  content += `**Assignee**: ${task.assignee}\n`;
  content += `**Reporter**: System\n`;
  content += `**Labels**: migration\n\n`;

  // Work Log
  content += `## Work Log\n\n`;
  task.workLogs.forEach(log => {
    content += `#### ${log.date} Entry\n`;
    content += `**Time spent**: ${log.timeSpent}\n`;
    content += `**Date**: ${log.date} 09:00:00\n`;
    content += `**Comment**: ${log.comment}\n`;
    content += `**Type**: ${log.type}\n\n`;
  });

  // Add remaining sections
  content += `### Implementation Notes\n`;
  content += `#### Technical Decisions\n`;
  content += `- Initial implementation\n\n`;
  content += `#### Code Changes\n`;
  content += `- Initial setup\n\n`;

  // Add timestamp
  content += `---\n`;
  content += `Last Updated: ${new Date().toISOString().replace('T', ' ').split('.')[0]}\n`;

  return content;
}

async function fixWorkLog(filePath: string): Promise<void> {
  try {
    const taskId = path.basename(filePath).replace('_work_log.md', '');
    const today = new Date().toISOString().split('T')[0];
    
    // Create new content from scratch
    const newContent = `# Task Work Log: ${taskId}

## ${taskId} Implementation

### Task Information
**Status**: In Progress
**Priority**: Medium
**Assignee**: ${process.env.USER || 'Unknown'}
**Reporter**: System
**Labels**: migration

## Work Log

#### ${today} Entry
**Time spent**: 1h
**Date**: ${today} 09:00:00
**Comment**: Initial work log entry
**Type**: Development

### Implementation Notes
#### Technical Decisions
- Initial implementation

#### Code Changes
- Initial setup

---
Last Updated: ${new Date().toISOString().replace('T', ' ').split('.')[0]}
`;

    // Create a backup first
    const backupDir = path.join(path.dirname(filePath), `backup_${Date.now()}`);
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }
    fs.copyFileSync(filePath, path.join(backupDir, path.basename(filePath)));

    // Write the new content
    try {
      fs.writeFileSync(filePath, newContent, { encoding: 'utf-8', flag: 'w' });
      logger.info(`Fixed work log: ${path.basename(filePath)}`);
    } catch (writeError) {
      logger.error(`Error writing to ${path.basename(filePath)}:`, writeError);
      // Try to restore from backup
      fs.copyFileSync(path.join(backupDir, path.basename(filePath)), filePath);
      throw writeError;
    }
  } catch (error) {
    logger.error(`Error fixing work log ${path.basename(filePath)}:`, error);
    throw error;
  }
}

async function main() {
  const workLogsDir = path.join(__dirname, '..', 'task_work_logs');
  const files = fs.readdirSync(workLogsDir)
    .filter(file => file.endsWith('_work_log.md') && !file.includes('backup_'));

  logger.info(`Found ${files.length} work logs to fix`);

  for (const file of files) {
    const filePath = path.join(workLogsDir, file);
    await fixWorkLog(filePath);
  }
}

// Run if called directly
if (require.main === module) {
  main()
    .then(() => {
      logger.info('All work logs fixed successfully');
      process.exit(0);
    })
    .catch(error => {
      logger.error('Error fixing work logs:', error);
      process.exit(1);
    });
}
