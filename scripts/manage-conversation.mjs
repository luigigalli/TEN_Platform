import { promises as fs } from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class ConversationManager {
  constructor(projectRoot) {
    this.windsurfDir = path.join(projectRoot, '.windsurf');
  }

  async createNewConversation(title) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const dirName = `${timestamp}_${title.replace(/[^a-zA-Z0-9-_]/g, '_')}`;
    const conversationDir = path.join(this.windsurfDir, 'conversations', dirName);
    
    // Create directory structure
    await Promise.all(['context_cache', 'logs'].map(async dir => {
      await fs.mkdir(path.join(conversationDir, dir), { recursive: true });
    }));

    // Initialize state
    const state = {
      id: dirName,
      title: title,
      timestamp: timestamp,
      startTime: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      contextFiles: []
    };

    await fs.writeFile(
      path.join(conversationDir, 'state.json'),
      JSON.stringify(state, null, 2)
    );

    // Only output the directory name for shell script
    if (command === 'create') {
      console.log(dirName);
    } else {
      console.log(`Created new conversation: ${title} (${dirName})`);
    }
    return dirName;
  }

  async updateConversationState(conversationId, updates) {
    const statePath = path.join(this.windsurfDir, 'conversations', conversationId, 'state.json');
    const currentState = JSON.parse(await fs.readFile(statePath, 'utf-8'));
    const newState = { ...currentState, ...updates, lastActive: new Date().toISOString() };
    await fs.writeFile(statePath, JSON.stringify(newState, null, 2));
  }

  async listConversations() {
    const conversationsDir = path.join(this.windsurfDir, 'conversations');
    try {
      const stats = await fs.stat(conversationsDir);
      if (!stats.isDirectory()) return [];
      
      const dirs = await fs.readdir(conversationsDir);
      const conversations = await Promise.all(
        dirs.map(async dir => {
          const statePath = path.join(conversationsDir, dir, 'state.json');
          try {
            const content = await fs.readFile(statePath, 'utf-8');
            return JSON.parse(content);
          } catch (error) {
            console.error(`Error reading state for conversation ${dir}:`, error);
            return null;
          }
        })
      );
      
      return conversations.filter(c => c !== null);
    } catch (error) {
      console.error('Error listing conversations:', error);
      return [];
    }
  }
}

// Create and export singleton instance
const conversationManager = new ConversationManager(process.cwd());

// Handle command line arguments
const [,, command, ...args] = process.argv;

async function main() {
  switch (command) {
    case 'create':
      const title = args[0] || 'New Conversation';
      const id = await conversationManager.createNewConversation(title);
      console.log(id);
      break;
    case 'list':
      const conversations = await conversationManager.listConversations();
      console.log(JSON.stringify(conversations, null, 2));
      break;
    default:
      console.error('Unknown command:', command);
      process.exit(1);
  }
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
