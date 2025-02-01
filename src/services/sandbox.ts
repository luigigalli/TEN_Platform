import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

export interface SandboxOptions {
  timeoutMs?: number;
  memoryLimitMb?: number;
  allowedModules?: string[];
  environment?: Record<string, string>;
}

export interface SandboxResult {
  success: boolean;
  output: string;
  error?: string;
  executionTimeMs: number;
  memoryUsageMb: number;
}

export class SandboxService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async createSandbox(options: SandboxOptions = {}): Promise<string> {
    const sandboxId = uuidv4();
    const {
      timeoutMs = 5000,
      memoryLimitMb = 512,
      allowedModules = [],
      environment = {}
    } = options;

    await this.prisma.sandbox.create({
      data: {
        id: sandboxId,
        timeoutMs,
        memoryLimitMb,
        allowedModules,
        environment: environment as any,
        status: 'CREATED'
      }
    });

    return sandboxId;
  }

  async executeSandbox(sandboxId: string, code: string): Promise<SandboxResult> {
    const sandbox = await this.prisma.sandbox.findUnique({
      where: { id: sandboxId }
    });

    if (!sandbox) {
      throw new Error(`Sandbox ${sandboxId} not found`);
    }

    const startTime = Date.now();
    let success = false;
    let output = '';
    let error: string | undefined;

    try {
      // Create an isolated VM context
      const vm = await import('vm');
      const context = vm.createContext({
        console: {
          log: (...args: any[]) => {
            output += args.map(arg => String(arg)).join(' ') + '\n';
          },
          error: (...args: any[]) => {
            output += args.map(arg => String(arg)).join(' ') + '\n';
          }
        },
        process: {
          env: sandbox.environment
        }
      });

      // Execute the code in the sandbox
      const script = new vm.Script(code);
      script.runInContext(context, {
        timeout: sandbox.timeoutMs,
        displayErrors: true
      });

      success = true;
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
      success = false;
    }

    const executionTimeMs = Date.now() - startTime;
    const memoryUsageMb = process.memoryUsage().heapUsed / 1024 / 1024;

    // Update sandbox status
    await this.prisma.sandbox.update({
      where: { id: sandboxId },
      data: {
        status: success ? 'COMPLETED' : 'FAILED',
        lastExecutionTime: new Date(),
        lastExecutionDurationMs: executionTimeMs
      }
    });

    return {
      success,
      output: output.trim(),
      error,
      executionTimeMs,
      memoryUsageMb
    };
  }

  async deleteSandbox(sandboxId: string): Promise<void> {
    await this.prisma.sandbox.delete({
      where: { id: sandboxId }
    });
  }
}
