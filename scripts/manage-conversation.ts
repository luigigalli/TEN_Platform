import { promises as fs } from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { logger } from '../utils/logger';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface ConversationState {
  id: string;
  title: string;
  timestamp: string;
  startTime: string;
  lastActive: string;
  contextFiles: string[];
}

class ConversationManager {
  private windsurfDir: string;

  constructor(projectRoot: string) {
    this.windsurfDir = path.join(projectRoot, '.windsurf');
  }

  async createNewConversation(title: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const dirName = `${timestamp}_${title.replace(/[^a-zA-Z0-9-_]/g, '_')}`;
    const conversationDir = path.join(this.windsurfDir, 'conversations', dirName);
    
    // Create directory structure
    await Promise.all(['context_cache', 'logs'].map(async dir => {
      await fs.mkdir(path.join(conversationDir, dir), { recursive: true });
    }));

    // Initialize state
    const state: ConversationState = {
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

    logger.info(`Created new conversation: ${title} (${dirName})`);
    return dirName;
  }

  async updateConversationState(conversationId: string, updates: Partial<ConversationState>) {
    const statePath = path.join(this.windsurfDir, 'conversations', conversationId, 'state.json');
    const currentState = JSON.parse(await fs.readFile(statePath, 'utf-8'));
    const newState = { ...currentState, ...updates, lastActive: new Date().toISOString() };
    await fs.writeFile(statePath, JSON.stringify(newState, null, 2));
  }

  async listConversations(): Promise<ConversationState[]> {
    const conversationsDir = path.join(this.windsurfDir, 'conversations');
    if (!(await fs.stat(conversationsDir)).isDirectory()) return [];
    
    return (await fs.readdir(conversationsDir))
      .filter(async dir => (await fs.stat(path.join(conversationsDir, dir))).isDirectory())
      .map(async dir => {
        const statePath = path.join(conversationsDir, dir, 'state.json');
        return JSON.parse(await fs.readFile(statePath, 'utf-8'));
      });
  }
}

// Create and export singleton instance
const conversationManager = new ConversationManager(__dirname);
export default conversationManager;
