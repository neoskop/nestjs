import { LoggerService as NestLoggerService, Logger } from '@nestjs/common';
import chalk, { Chalk } from 'chalk';
import { inspect } from 'util';
import { fletcher } from '../utils/fletcher';
import { Logger as _WinstonLogger } from 'winston';

const contextToColor = new Map<string, Chalk>();

export function getContextColor(context: string) : Chalk {
    if (!contextToColor.has(context)) {
        const cs = fletcher(context);
        const h = (cs & 255) / 255 * 360 | 0;
        const s = cs >> 8 & 15;
        const v = cs >> 12 & 15;
        contextToColor.set(context, chalk.hsv(h, s >= 8 ? 100 : 75, v >= 8 ? 100 : 75));
    }

    return contextToColor.get(context)!;
}

export function getLevelColor(level : 'log' | 'error' | 'warn' | 'debug' | 'verbose' | string) : Chalk {
    switch(level) {
        case 'error': return chalk.redBright;
        case 'warn': return chalk.yellowBright;
        case 'debug': return chalk.cyanBright;
        case 'verbose': return chalk.magentaBright;
        default: return chalk;
    }
}

export class WinstonLogger implements NestLoggerService {
    protected readonly logger : _WinstonLogger;


    static getInstance() : WinstonLogger {
        const logger = (Logger as unknown as { staticInstanceRef?: WinstonLogger, instance: WinstonLogger })
        return logger.staticInstanceRef ?? logger.instance;
    }

    static getChild(context : string) {
        return this.getInstance().child(context);
    }

    constructor(loggerOrFactory : _WinstonLogger|(() => _WinstonLogger)) { 
        if(typeof loggerOrFactory === 'function') {
            this.logger = (loggerOrFactory as Function)();
        } else {
            this.logger = loggerOrFactory;
        }
    }

    getWinston() {
        return this.logger;
    }

    log(message: any, context?: string): void {
        if(typeof message === 'object') {
            const { message: msg, ...rest } = message;
            this.logger.info(String(msg), { context, ...rest });
        } else {
            this.logger.info(String(message), { context });
        }
    }

    error(message: any, trace?: string, context?: string): void {
        if(typeof message === 'object') {
            const { message: msg, ...rest } = message;
            this.logger.error(String(msg), { trace, context, ...rest });
        } else {
            this.logger.error(String(message), { trace, context });
        }
    }

    warn(message: any, context?: string): void {
        if(typeof message === 'object') {
            const { message: msg, ...rest } = message;
            this.logger.warn(String(msg), { context, ...rest });
        } else {
            this.logger.warn(String(message), { context });
        }
    }

    debug(message: any, context?: string): void {
        if(typeof message === 'object') {
            const { message: msg, ...rest } = message;
            this.logger.debug(String(msg), { context, ...rest });
        } else {
            this.logger.debug(String(message), { context });
        }
    }

    verbose(message: any, context?: string): void {
        if(typeof message === 'object') {
            const { message: msg, ...rest } = message;
            this.logger.verbose(String(msg), { context, ...rest });
        } else {
            this.logger.verbose(String(message), { context });
        }
    }

    http(message: string, meta: object) {
        this.logger.http(message, meta);
    }

    child(context: string) {
        return this.logger.child({ context });
    }
}
