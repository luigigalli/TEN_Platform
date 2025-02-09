import Bull from "bull";
import { env } from "../config/environment";
import { emailService } from "./email.service";
import { EmailPreviewService } from "./email-preview";

interface EmailJob {
  to: string;
  subject: string;
  html: string;
  attempts?: number;
}

class EmailQueue {
  private queue: Bull.Queue<EmailJob>;

  constructor() {
    this.queue = new Bull("email-queue", {
      redis: env.REDIS_URL,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 1000 // 1 second
        },
        removeOnComplete: true,
        removeOnFail: false
      }
    });

    this.setupProcessor();
    this.setupEventHandlers();
  }

  private setupProcessor() {
    this.queue.process(async (job) => {
      const { to, subject, html } = job.data;

      try {
        // Send email
        await emailService.sendEmail({ to, subject, html });

        // Save preview in development
        if (env.NODE_ENV === "development") {
          await EmailPreviewService.savePreview({ to, subject, html });
        }

        return { success: true };
      } catch (error) {
        console.error(`Failed to send email to ${to}:`, error);
        throw error; // This will trigger a retry if attempts remain
      }
    });
  }

  private setupEventHandlers() {
    // Log failed jobs
    this.queue.on("failed", (job, error) => {
      console.error(
        `Email job failed after ${job.attemptsMade} attempts:`,
        {
          to: job.data.to,
          subject: job.data.subject,
          error: error.message
        }
      );
    });

    // Monitor queue health
    this.queue.on("error", (error) => {
      console.error("Email queue error:", error);
    });

    if (env.NODE_ENV === "development") {
      this.queue.on("completed", (job) => {
        console.log(
          `Email sent successfully to ${job.data.to}:`,
          job.data.subject
        );
      });
    }
  }

  async add(emailJob: EmailJob) {
    return this.queue.add(emailJob);
  }

  async getQueueMetrics() {
    const [
      waiting,
      active,
      completed,
      failed,
      delayed
    ] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getCompletedCount(),
      this.queue.getFailedCount(),
      this.queue.getDelayedCount()
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      timestamp: new Date()
    };
  }

  async clearFailed() {
    await this.queue.clean(0, "failed");
  }

  async retryFailed() {
    const failed = await this.queue.getFailed();
    return Promise.all(failed.map(job => job.retry()));
  }
}

export const emailQueue = new EmailQueue();
