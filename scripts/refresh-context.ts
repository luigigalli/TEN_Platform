import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';
import jiraSync from './jira/jira-sync';
import atlassianIntegration from './jira/atlassian-integration';

interface FileContext {
  path: string;
  lastModified: Date;
  content: string;
  category: string;
}

class ContextManager {
  private projectRoot: string;
  private contextCache: Map<string, FileContext>;
  private lastRefreshTime: Date;
  private logDir: string;
  private logFile: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.contextCache = new Map();
    this.lastRefreshTime = new Date(0);
    this.logDir = path.join(projectRoot, 'logs');
    this.logFile = path.join(this.logDir, 'context-refresh.log');
    
    // Ensure directories exist
    [this.logDir, path.join(projectRoot, 'templates')].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  private log(message: string, category?: string) {
    const timestamp = new Date().toISOString();
    const categoryStr = category ? ` [${category}]` : '';
    const logEntry = `[${timestamp}]${categoryStr} ${message}\n`;
    fs.appendFileSync(this.logFile, logEntry);
    logger.info(message);
  }

  private getWorkLogs(): string[] {
    const workLogsDir = path.join(this.projectRoot, 'task_work_logs');
    if (!fs.existsSync(workLogsDir)) return [];
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return fs.readdirSync(workLogsDir)
      .filter(file => {
        if (!file.endsWith('.md')) return false;
        
        // Check file modification time
        const stats = fs.statSync(path.join(workLogsDir, file));
        return stats.mtime >= thirtyDaysAgo;
      })
      .map(file => path.join('task_work_logs', file));
  }

  private getTemplates(): string[] {
    const templatesDir = path.join(this.projectRoot, 'templates');
    if (!fs.existsSync(templatesDir)) return [];
    
    return fs.readdirSync(templatesDir)
      .filter(file => file.endsWith('.md'))
      .map(file => path.join('templates', file));
  }

  private getCriticalFiles(): { path: string, category: string }[] {
    return [
      // Project-Level Context
      { path: 'project-reference.md', category: 'Project' },
      { path: 'PROJECT_BRIEF.md', category: 'Project' },
      
      // Documentation
      { path: 'docs/workflow.md', category: 'Documentation' },
      { path: 'docs/database.md', category: 'Documentation' },
      { path: 'docs/environment-guide.md', category: 'Documentation' },
      
      // Work Logs
      { path: 'WORK_LOG.md', category: 'WorkLog' },
      ...this.getWorkLogs().map(path => ({ path, category: 'TaskLog' })),
      
      // Templates
      ...this.getTemplates().map(path => ({ path, category: 'Template' }))
    ];
  }

  private loadContext() {
    const criticalFiles = this.getCriticalFiles();

    criticalFiles.forEach(({ path: filePath, category }) => {
      const fullPath = path.join(this.projectRoot, filePath);
      try {
        const stats = fs.statSync(fullPath);
        const content = fs.readFileSync(fullPath, 'utf-8');
        this.contextCache.set(filePath, {
          path: filePath,
          lastModified: stats.mtime,
          content,
          category
        });
        this.log(`Loaded context from ${filePath}`, category);
      } catch (error) {
        this.log(`Could not load context file: ${filePath} - ${error}`, category);
      }
    });
  }

  private async syncJira() {
    try {
      // Use both integrations during transition
      await Promise.all([
        jiraSync.syncCurrentTask(),
        atlassianIntegration.syncCurrentTask()
      ]);
      this.log('Jira sync completed successfully', 'Jira');
    } catch (error) {
      this.log(`Jira sync failed: ${error}`, 'Jira');
    }
  }

  private updateLastRefreshTime() {
    const timestamp = new Date().toISOString();
    fs.writeFileSync(
      path.join(this.projectRoot, '.last-refresh'),
      timestamp
    );
    this.lastRefreshTime = new Date();
  }

  private generateContextSummary(): string {
    const summary = ['Context Refresh Summary:'];
    const categories = new Map<string, number>();

    this.contextCache.forEach(context => {
      const count = categories.get(context.category) || 0;
      categories.set(context.category, count + 1);
    });

    categories.forEach((count, category) => {
      summary.push(`- ${category}: ${count} files`);
    });

    return summary.join('\n');
  }

  async refresh() {
    this.log('Starting context refresh...', 'System');
    
    // Load all critical files
    this.loadContext();
    
    // Sync with Jira
    await this.syncJira();
    
    // Update refresh timestamp
    this.updateLastRefreshTime();
    
    // Log summary
    const summary = this.generateContextSummary();
    this.log(summary, 'Summary');
    
    this.log('Context refresh complete', 'System');
  }

  async refreshIfNeeded() {
    const now = new Date();
    const timeSinceLastRefresh = now.getTime() - this.lastRefreshTime.getTime();
    const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

    if (timeSinceLastRefresh > REFRESH_INTERVAL) {
      await this.refresh();
    }
  }
}

// Create and export the singleton instance
const contextManager = new ContextManager(process.cwd());
export default contextManager;

// If run directly, perform a refresh
if (import.meta.url === `file://${process.argv[1]}`) {
  contextManager.refresh()
    .then(() => process.exit(0))
    .catch(error => {
      logger.error('Error refreshing context:', error);
      process.exit(1);
    });
}
