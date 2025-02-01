import { execSync } from 'child_process';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { logger } from '../../utils/logger';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface TaskInfo {
  id: string;
  summary: string;
  status: string;
  description?: string;
  assignee?: string;
  reporter?: string;
  priority?: string;
  labels?: string[];
  lastUpdate: Date;
}

interface WorkLogEntry {
  timeSpent: string;
  comment: string;
  started: Date;
}

class AtlassianIntegration {
  private taskCachePath: string;
  private taskCache: Map<string, TaskInfo>;
  private workLogCache: Map<string, WorkLogEntry[]>;

  constructor() {
    this.taskCachePath = path.join(__dirname, '.atlassian-task-cache.json');
    this.taskCache = new Map();
    this.workLogCache = new Map();
    this.loadCache();
  }

  private loadCache() {
    try {
      if (fs.existsSync(this.taskCachePath)) {
        const cache = JSON.parse(fs.readFileSync(this.taskCachePath, 'utf-8'));
        
        // Load task cache
        if (cache.tasks) {
          Object.entries(cache.tasks).forEach(([id, info]) => {
            this.taskCache.set(id, {
              ...info as TaskInfo,
              lastUpdate: new Date((info as TaskInfo).lastUpdate)
            });
          });
        }

        // Load worklog cache
        if (cache.workLogs) {
          Object.entries(cache.workLogs).forEach(([id, entries]) => {
            this.workLogCache.set(id, (entries as WorkLogEntry[]).map(entry => ({
              ...entry,
              started: new Date(entry.started)
            })));
          });
        }
      }
    } catch (error) {
      logger.warn('Failed to load Atlassian task cache', { error });
    }
  }

  private saveCache() {
    try {
      const cache = {
        tasks: Object.fromEntries(this.taskCache.entries()),
        workLogs: Object.fromEntries(this.workLogCache.entries())
      };
      fs.writeFileSync(this.taskCachePath, JSON.stringify(cache, null, 2));
    } catch (error) {
      logger.warn('Failed to save Atlassian task cache', { error });
    }
  }

  private getCurrentTaskId(): string | null {
    try {
      const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
      const match = branch.match(/(?:^|\/)(?:TENP|tenp)-(\d+)(?:-|$)/i);
      return match ? `TENP-${match[1]}` : null;
    } catch (error) {
      logger.warn('Failed to get current task ID from git branch', { error });
      return null;
    }
  }

  private async updateWorkLog(taskId: string, workLogPath: string) {
    try {
      const content = fs.readFileSync(workLogPath, 'utf-8');
      
      // Extract work log entries from the markdown file
      const workLogSection = content.match(/## Work Log\n([\s\S]*?)(?:\n##|$)/)?.[1] || '';
      const entries = workLogSection.split('\n\n').filter(Boolean).map(entry => {
        const timeMatch = entry.match(/Time spent: (.+)/);
        const commentMatch = entry.match(/Comment: (.+)/);
        const dateMatch = entry.match(/Date: (.+)/);

        return {
          timeSpent: timeMatch?.[1] || '0h',
          comment: commentMatch?.[1] || 'No comment provided',
          started: dateMatch?.[1] ? new Date(dateMatch[1]) : new Date()
        };
      });

      this.workLogCache.set(taskId, entries);
      this.saveCache();
    } catch (error) {
      logger.error('Failed to update work log', { taskId, error });
    }
  }

  private async updateTaskInfo(taskId: string, workLogPath: string) {
    try {
      const content = fs.readFileSync(workLogPath, 'utf-8');
      
      // Extract task information from the markdown file
      const summaryMatch = content.match(/^##\s*(.+)/m);
      const statusMatch = content.match(/\*\*Status\*\*:\s*(.+)/);
      const descriptionMatch = content.match(/\*\*Description\*\*:\s*(.+)/);
      const assigneeMatch = content.match(/\*\*Assignee\*\*:\s*(.+)/);
      const reporterMatch = content.match(/\*\*Reporter\*\*:\s*(.+)/);
      const priorityMatch = content.match(/\*\*Priority\*\*:\s*(.+)/);
      const labelsMatch = content.match(/\*\*Labels\*\*:\s*(.+)/);

      this.taskCache.set(taskId, {
        id: taskId,
        summary: summaryMatch?.[1] || 'Unknown',
        status: statusMatch?.[1] || 'Unknown',
        description: descriptionMatch?.[1],
        assignee: assigneeMatch?.[1],
        reporter: reporterMatch?.[1],
        priority: priorityMatch?.[1],
        labels: labelsMatch?.[1]?.split(',').map(l => l.trim()),
        lastUpdate: new Date()
      });

      this.saveCache();
    } catch (error) {
      logger.error('Failed to update task info', { taskId, error });
    }
  }

  async syncCurrentTask() {
    const taskId = this.getCurrentTaskId();
    if (!taskId) {
      logger.info('No task ID found in current branch name');
      return;
    }

    const cached = this.taskCache.get(taskId);
    const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

    if (cached && (new Date().getTime() - cached.lastUpdate.getTime()) < CACHE_TTL) {
      logger.info('Using cached task info', { taskId });
      return;
    }

    const workLogPath = path.join(__dirname, '..', '..', 'task_work_logs', `${taskId}_work_log.md`);
    
    if (fs.existsSync(workLogPath)) {
      await this.updateTaskInfo(taskId, workLogPath);
      await this.updateWorkLog(taskId, workLogPath);
      logger.info('Task info and work log updated', { taskId });
    } else {
      logger.warn('Work log file not found', { taskId, path: workLogPath });
    }
  }

  getTaskInfo(taskId: string): TaskInfo | undefined {
    return this.taskCache.get(taskId);
  }

  getWorkLog(taskId: string): WorkLogEntry[] {
    return this.workLogCache.get(taskId) || [];
  }
}

// Create and export singleton instance
const atlassianIntegration = new AtlassianIntegration();
export default atlassianIntegration;
