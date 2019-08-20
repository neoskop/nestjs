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
        return (Logger as any).instance;
    }

    constructor(loggerOrFactory : _WinstonLogger|(() => _WinstonLogger)) { 
        if(typeof loggerOrFactory === 'function') {
            this.logger = (loggerOrFactory as Function)();
        } else {
            this.logger = loggerOrFactory;
        }
    }

    /*protected print(color: Chalk, message: any, context?: string, trace?: string) {
        let output = ''

        if (this.options.enableTimestamp) {
            output += new Date().toLocaleString(undefined, {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: 'numeric',
                minute: 'numeric',
                second: 'numeric'
            }) + ' ';
        }

        if (context) {
            output += getContextColor(context)(`[${context}]`) + ' ';
        }

        if (message && typeof message === 'object') {
            output += color(inspect(message));
        } else {
            output += color(message);
        }

        if (trace) {
            output += '\n' + trace;
        }

        output += '\n';

        process.stdout.write(output);
    }*/

    log(message: any, context?: string): void {
        this.logger.info(message && typeof message === 'object' ? inspect(message) : String(message), { context });
        // this.print(getLevelColor('log'), message, context);
    }

    error(message: any, trace?: string, context?: string): void {
        this.logger.error(message && typeof message === 'object' ? inspect(message) : String(message), { trace, context });
        // this.print(getLevelColor('error'), message, context, trace);
    }

    warn(message: any, context?: string): void {
        this.logger.warn(message && typeof message === 'object' ? inspect(message) : String(message), { context });
        // this.print(getLevelColor('warn'), message, context);
    }

    debug(message: any, context?: string): void {
        this.logger.debug(message && typeof message === 'object' ? inspect(message) : String(message), { context });
        // this.print(getLevelColor('debug'), message, context);
    }

    verbose(message: any, context?: string): void {
        this.logger.verbose(message && typeof message === 'object' ? inspect(message) : String(message), { context });
        // this.print(getLevelColor('verbose'), message, context);
    }

    http(message: string, meta: object) {
        this.logger.http(message, meta);
    }
}
