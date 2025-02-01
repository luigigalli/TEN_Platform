import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';

interface TaskLogSection {
  name: string;
  required: boolean;
  validator: (content: string) => boolean;
}

interface ValidationResult {
  filePath: string;
  issues: string[];
}

class TaskLogManager {
  private workLogsDir: string;

  private sections: TaskLogSection[] = [
    {
      name: 'Task Information',
      required: true,
      validator: (content: string) => {
        return content.includes('**Status**: In Progress') &&
               content.includes('**Priority**: Medium') &&
               content.includes('**Assignee**:');
      }
    },
    {
      name: 'Work Log',
      required: true,
      validator: (content: string) => {
        return content.includes('**Time spent**: 1h') &&
               content.includes('**Date**:') &&
               content.includes('**Comment**: Initial work log entry') &&
               content.includes('**Type**: Development');
      }
    },
    {
      name: 'Implementation Notes',
      required: false,
      validator: (content: string) => {
        return content.includes('Technical Decisions') ||
               content.includes('Code Changes');
      }
    }
  ];

  constructor() {
    this.workLogsDir = path.join(__dirname, '..', 'task_work_logs');
  }

  private extractSection(content: string, sectionName: string): string {
    const lines = content.split('\n');
    let sectionContent = '';
    let inSection = false;
    let headerLevel = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const headerMatch = line.match(/^(#{2,3})\s*(.+)$/);

      if (headerMatch) {
        const level = headerMatch[1].length;
        const title = headerMatch[2].trim();

        if (title === sectionName || title.startsWith(sectionName + ' ')) {
          inSection = true;
          headerLevel = level;
          continue;
        } else if (inSection && level <= headerLevel) {
          break;
        }
      }

      if (inSection) {
        sectionContent += line + '\n';
      }
    }

    return sectionContent.trim();
  }

  private hasSection(content: string, sectionName: string): boolean {
    const lines = content.split('\n');
    for (const line of lines) {
      const headerMatch = line.match(/^#{2,3}\s*(.+)$/);
      if (headerMatch && (headerMatch[1].trim() === sectionName || headerMatch[1].trim().startsWith(sectionName + ' '))) {
        return true;
      }
    }
    return false;
  }

  private validateWorkLog(filePath: string, content: string): ValidationResult {
    const issues: string[] = [];
    
    // Check for required sections
    for (const section of this.sections) {
      if (section.required) {
        if (!this.hasSection(content, section.name)) {
          issues.push(`Missing required section: ${section.name}`);
          continue;
        }
        
        const sectionContent = this.extractSection(content, section.name);
        if (!section.validator(sectionContent)) {
          issues.push(`Invalid content in section: ${section.name}`);
        }
      }
    }

    return {
      filePath,
      issues
    };
  }

  public async validateWorkLogs(): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];
    const files = fs.readdirSync(this.workLogsDir)
      .filter(file => file.endsWith('_work_log.md') && !file.includes('backup_'));

    for (const file of files) {
      const filePath = path.join(this.workLogsDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const result = this.validateWorkLog(filePath, content);
      
      if (result.issues.length > 0) {
        logger.warn(`Validation issues in ${file}:`, result.issues);
      }
      
      results.push(result);
    }

    // Create a backup before any potential changes
    const backupDir = path.join(this.workLogsDir, `backup_${Date.now()}`);
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }
    
    for (const file of files) {
      const filePath = path.join(this.workLogsDir, file);
      const backupPath = path.join(backupDir, file);
      fs.copyFileSync(filePath, backupPath);
    }

    logger.info(`Backup created at ${backupDir}`);
    logger.info('Work log conversion completed');

    return results;
  }
}

export const taskLogManager = new TaskLogManager();

// If run directly, convert all work logs
if (require.main === module) {
  taskLogManager.validateWorkLogs()
    .then(() => process.exit(0))
    .catch(error => {
      logger.error('Error validating work logs:', error);
      process.exit(1);
    });
}
