import logger from '../config/logger';

export class LoggingService {
    private static instance: LoggingService;
    private context: string;

    private constructor(context: string = 'App') {
        this.context = context;
    }

    static getInstance(context?: string): LoggingService {
        if (!LoggingService.instance) {
            LoggingService.instance = new LoggingService(context);
        }
        return LoggingService.instance;
    }

    setContext(context: string) {
        this.context = context;
    }

    private formatMessage(message: string): string {
        return `[${this.context}] ${message}`;
    }

    private formatError(error: Error): any {
        return {
            name: error.name,
            message: error.message,
            stack: error.stack,
            ...(error as any),
        };
    }

    debug(message: string, meta: any = {}) {
        logger.debug(this.formatMessage(message), { ...meta, context: this.context });
    }

    info(message: string, meta: any = {}) {
        logger.info(this.formatMessage(message), { ...meta, context: this.context });
    }

    warn(message: string, meta: any = {}) {
        logger.warn(this.formatMessage(message), { ...meta, context: this.context });
    }

    error(message: string, error?: Error, meta: any = {}) {
        logger.error(this.formatMessage(message), {
            ...meta,
            context: this.context,
            error: error ? this.formatError(error) : undefined,
        });
    }

    http(message: string, meta: any = {}) {
        logger.http(this.formatMessage(message), { ...meta, context: this.context });
    }
}
