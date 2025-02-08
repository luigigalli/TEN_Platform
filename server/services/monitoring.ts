import { env } from "../config/environment";
import { emailQueue } from "./email-queue";

interface MetricPoint {
  timestamp: Date;
  value: number;
}

interface EmailMetrics {
  failedAttempts: MetricPoint[];
  successRate: MetricPoint[];
  averageLatency: MetricPoint[];
}

class MonitoringService {
  private static instance: MonitoringService;
  private metrics: Map<string, EmailMetrics>;
  private readonly MAX_HISTORY_POINTS = 100;

  private constructor() {
    this.metrics = new Map();
    this.startMetricsCollection();
  }

  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  private startMetricsCollection() {
    // Collect metrics every minute in development, every 5 minutes in production
    const interval = env.NODE_ENV === "production" ? 5 * 60 * 1000 : 60 * 1000;
    
    setInterval(async () => {
      await this.collectMetrics();
    }, interval);
  }

  private async collectMetrics() {
    try {
      const queueMetrics = await emailQueue.getQueueMetrics();
      const timestamp = new Date();

      // Calculate success rate
      const totalAttempts = queueMetrics.completed + queueMetrics.failed;
      const successRate = totalAttempts > 0
        ? (queueMetrics.completed / totalAttempts) * 100
        : 100;

      this.addMetricPoint("email", {
        failedAttempts: queueMetrics.failed,
        successRate,
        averageLatency: 0 // TODO: Implement latency tracking
      });

      // Alert if success rate drops below threshold
      if (successRate < 95) {
        this.triggerAlert("email_success_rate", {
          message: `Email success rate dropped to ${successRate.toFixed(2)}%`,
          level: "warning",
          metrics: queueMetrics
        });
      }

      // Alert if there are too many failed attempts
      if (queueMetrics.failed > 10) {
        this.triggerAlert("email_failed_attempts", {
          message: `High number of failed email attempts: ${queueMetrics.failed}`,
          level: "error",
          metrics: queueMetrics
        });
      }
    } catch (error) {
      console.error("Failed to collect metrics:", error);
    }
  }

  private addMetricPoint(service: string, metrics: {
    failedAttempts: number;
    successRate: number;
    averageLatency: number;
  }) {
    if (!this.metrics.has(service)) {
      this.metrics.set(service, {
        failedAttempts: [],
        successRate: [],
        averageLatency: []
      });
    }

    const serviceMetrics = this.metrics.get(service)!;
    const timestamp = new Date();

    // Add new metric points
    serviceMetrics.failedAttempts.push({ timestamp, value: metrics.failedAttempts });
    serviceMetrics.successRate.push({ timestamp, value: metrics.successRate });
    serviceMetrics.averageLatency.push({ timestamp, value: metrics.averageLatency });

    // Trim old points if necessary
    if (serviceMetrics.failedAttempts.length > this.MAX_HISTORY_POINTS) {
      serviceMetrics.failedAttempts = serviceMetrics.failedAttempts.slice(-this.MAX_HISTORY_POINTS);
      serviceMetrics.successRate = serviceMetrics.successRate.slice(-this.MAX_HISTORY_POINTS);
      serviceMetrics.averageLatency = serviceMetrics.averageLatency.slice(-this.MAX_HISTORY_POINTS);
    }
  }

  private async triggerAlert(type: string, alert: {
    message: string;
    level: "info" | "warning" | "error";
    metrics: any;
  }) {
    // Log the alert
    console[alert.level](`[ALERT] ${type}:`, alert.message, alert.metrics);

    // In production, you might want to send these alerts to a monitoring service
    if (env.NODE_ENV === "production") {
      // TODO: Integrate with monitoring service (e.g., Sentry, DataDog)
    }
  }

  getMetrics(service: string): EmailMetrics | undefined {
    return this.metrics.get(service);
  }

  async getHealthCheck() {
    const queueMetrics = await emailQueue.getQueueMetrics();
    const emailMetrics = this.getMetrics("email");

    return {
      status: "healthy",
      timestamp: new Date(),
      services: {
        email: {
          queue: queueMetrics,
          metrics: emailMetrics
        }
      }
    };
  }
}

export const monitoringService = MonitoringService.getInstance();
