import { promises as fs } from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class ContextRefresher {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.windsurfDir = path.join(projectRoot, '.windsurf');
    this.apiEndpoint = process.env.WINDSURF_API_ENDPOINT || 'http://localhost:3000';
  }

  getCriticalFiles() {
    return [
      { path: 'package.json', category: 'Dependencies' },
      { path: 'tsconfig.json', category: 'Configuration' },
      { path: 'README.md', category: 'Documentation' },
      { path: '.env', category: 'Configuration' },
      { path: '.gitignore', category: 'Configuration' },
      { path: 'scripts/shell/manage-conversation.sh', category: 'Scripts' },
      { path: 'scripts/manage-conversation.mjs', category: 'Scripts' },
      { path: 'scripts/refresh-context.mjs', category: 'Scripts' },
      { path: 'project-reference.md', category: 'Documentation' },
      { path: 'docs/context-management.md', category: 'Documentation' },
      { path: 'docs/workflow.md', category: 'Documentation' },
      { path: 'WORK_LOG.md', category: 'WorkLog' }
    ];
  }

  async loadContext() {
    const criticalFiles = this.getCriticalFiles();
    const contextCache = new Map();

    await Promise.all(criticalFiles.map(async ({ path: filePath, category }) => {
      const fullPath = path.join(this.projectRoot, filePath);
      const cachePath = path.join(this.windsurfDir, 'shared', 'cache', filePath);
      
      try {
        const stats = await fs.stat(fullPath);
        const content = await fs.readFile(fullPath, 'utf-8');
        
        // Create cache directory if it doesn't exist
        await fs.mkdir(path.dirname(cachePath), { recursive: true });
        
        // Cache the content
        await fs.writeFile(cachePath, content);
        
        contextCache.set(filePath, {
          path: filePath,
          lastModified: stats.mtime,
          content,
          category
        });
        console.log(`Loaded context from ${filePath}`);
      } catch (error) {
        if (error.code !== 'ENOENT') {
          console.error(`Could not load context file: ${filePath} - ${error}`);
        }
      }
    }));

    return contextCache;
  }

  async syncJira() {
    try {
      const jiraSync = await import('./jira/jira-sync.js');
      const atlassianIntegration = await import('./jira/atlassian-integration.js');
      
      await Promise.all([
        jiraSync.default.syncCurrentTask(),
        atlassianIntegration.default.syncCurrentTask()
      ]);
      console.log('Jira sync completed successfully');
    } catch (error) {
      console.error('Jira sync failed:', error);
    }
  }

  async sendContextToAssistant(conversationId, context) {
    try {
      const response = await fetch(`${this.apiEndpoint}/api/conversations/${conversationId}/context`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          context: Array.from(context.values()),
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to send context: ${response.statusText}`);
      }

      console.log('Context sent to AI assistant successfully');
    } catch (error) {
      console.error('Failed to send context to AI assistant:', error);
      throw error;
    }
  }

  async refreshContext(conversationId) {
    console.log('Starting context refresh...');
    
    // Load all critical files
    const context = await this.loadContext();
    
    // Sync with Jira
    await this.syncJira();
    
    // Send context to AI assistant
    await this.sendContextToAssistant(conversationId, context);
    
    // Update last refresh time
    const timestamp = new Date().toISOString();
    await fs.writeFile(
      path.join(this.windsurfDir, '.last-refresh'),
      timestamp
    );
    
    console.log('Context refresh complete');
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const conversationArg = args.find(arg => arg.startsWith('--conversation'));

if (!conversationArg) {
  console.error('Missing required argument: --conversation');
  process.exit(1);
}

const conversationId = conversationArg.split('=')[1];

if (!conversationId) {
  console.error('Invalid conversation ID');
  process.exit(1);
}

// Create and run refresher
const refresher = new ContextRefresher(process.cwd());
refresher.refreshContext(conversationId).catch(error => {
  console.error('Error refreshing context:', error);
  process.exit(1);
});
