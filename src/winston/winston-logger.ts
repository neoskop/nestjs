import { LoggerService as NestLoggerService, Logger } from '@nestjs/common';
import chalk, { Chalk } from 'chalk';
import { fletcher } from '../utils/fletcher';
import { LeveledLogMethod, Logger as _WinstonLogger } from 'winston';

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

export type AdditionalMeta = [...object[], string] | object[];
export type Message = string | {
    message: string;
};
export type LogFn = (message: Message, ...additional: AdditionalMeta) => void;

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

    protected _parseMessage(message: Message): { message: string, meta: object } {
        if(typeof message === 'object') {
            const { message: msg, ...meta } = message;
            return { message: String(msg), meta };
        } else {
            return { message: String(message), meta: {} };
        }
    }

    protected _parseMeta(meta: object, additional: AdditionalMeta) {
        if(additional.length > 0 && typeof additional[additional.length - 1] === 'string') {
            additional.push({ context: additional.pop() });
        }

        return (additional as object[]).reduce((t, c) => ({ ...t, ...c }), meta);
    }

    protected _log(level: Extract<keyof _WinstonLogger, 'log' | 'error' | 'warn' | 'debug' | 'verbose'>, msg: string|{ message: string }, ...additional: AdditionalMeta) {
        let { message, meta } = this._parseMessage(msg);
        meta = this._parseMeta(meta, additional);

        (this.logger[level] as LeveledLogMethod)(message, meta);
    }

    log: LogFn = this._log.bind(this, 'log');
    error: LogFn = this._log.bind(this, 'error');
    warn: LogFn = this._log.bind(this, 'warn');
    debug: LogFn = this._log.bind(this, 'debug');
    verbose: LogFn = this._log.bind(this, 'verbose');

    http(message: string, meta: object) {
        this.logger.http(message, meta);
    }

    child(context: string) {
        return this.logger.child({ context });
    }
}
