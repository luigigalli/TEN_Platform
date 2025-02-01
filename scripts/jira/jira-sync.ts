import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { logger } from '../../utils/logger';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface TaskInfo {
  id: string;
  summary: string;
  status: string;
  lastUpdate: Date;
}

class JiraSync {
  private taskCachePath: string;
  private taskCache: Map<string, TaskInfo>;
  private pythonScriptPath: string;

  constructor() {
    this.taskCachePath = path.join(__dirname, '.task-cache.json');
    this.pythonScriptPath = path.join(__dirname, 'task_workflow.py');
    this.taskCache = new Map();
    this.loadCache();
  }

  private loadCache() {
    try {
      if (fs.existsSync(this.taskCachePath)) {
        const cache = JSON.parse(fs.readFileSync(this.taskCachePath, 'utf-8'));
        Object.entries(cache).forEach(([id, info]) => {
          this.taskCache.set(id, {
            ...info as TaskInfo,
            lastUpdate: new Date((info as TaskInfo).lastUpdate)
          });
        });
      }
    } catch (error) {
      logger.warn('Failed to load Jira task cache', { error });
    }
  }

  private saveCache() {
    try {
      const cache = Object.fromEntries(this.taskCache.entries());
      fs.writeFileSync(this.taskCachePath, JSON.stringify(cache, null, 2));
    } catch (error) {
      logger.warn('Failed to save Jira task cache', { error });
    }
  }

  private getCurrentTaskId(): string | null {
    try {
      // Get current git branch
      const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
      
      // Extract task ID from branch name (e.g., feature/TENP-123-description)
      const match = branch.match(/(?:^|\/)(?:TENP|tenp)-(\d+)(?:-|$)/i);
      return match ? `TENP-${match[1]}` : null;
    } catch (error) {
      logger.warn('Failed to get current task ID from git branch', { error });
      return null;
    }
  }

  private async updateTaskStatus(taskId: string) {
    try {
      // Run Python script to update task status
      execSync(`python3 "${this.pythonScriptPath}" ${taskId}`, {
        encoding: 'utf-8',
        stdio: 'inherit'
      });

      // Update cache
      const workLogPath = path.join(__dirname, '..', '..', 'task_work_logs', `${taskId}_work_log.md`);
      if (fs.existsSync(workLogPath)) {
        const content = fs.readFileSync(workLogPath, 'utf-8');
        const statusMatch = content.match(/\*\*Status\*\*:\s*(.+)/);
        const summaryMatch = content.match(/^##\s*(.+)/m);

        this.taskCache.set(taskId, {
          id: taskId,
          summary: summaryMatch?.[1] || 'Unknown',
          status: statusMatch?.[1] || 'Unknown',
          lastUpdate: new Date()
        });
        this.saveCache();
      }
    } catch (error) {
      logger.error('Failed to update task status', { taskId, error });
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

    if (!cached || Date.now() - cached.lastUpdate.getTime() > CACHE_TTL) {
      logger.info('Syncing Jira task status', { taskId });
      await this.updateTaskStatus(taskId);
    } else {
      logger.debug('Using cached task status', { 
        taskId,
        status: cached.status,
        lastUpdate: cached.lastUpdate
      });
    }
  }
}

// Create and export singleton instance
const jiraSync = new JiraSync();
export default jiraSync;

// If run directly, perform a sync
if (import.meta.url === `file://${process.argv[1]}`) {
  jiraSync.syncCurrentTask()
    .then(() => process.exit(0))
    .catch(error => {
      logger.error('Error syncing Jira task:', error);
      process.exit(1);
    });
}
