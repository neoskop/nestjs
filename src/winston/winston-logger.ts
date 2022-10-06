import { Logger, LoggerService as NestLoggerService } from '@nestjs/common';
import chalk, { Chalk } from 'chalk';
import { Logger as _WinstonLogger } from 'winston';
import { fletcher } from '../utils/fletcher';

const contextToColor = new Map<string, Chalk>();

export function getContextColor(context: string): Chalk {
    if (!contextToColor.has(context)) {
        const cs = fletcher(context);
        const h = (((cs & 255) / 255) * 360) | 0;
        const s = (cs >> 8) & 15;
        const v = (cs >> 12) & 15;
        contextToColor.set(context, chalk.hsv(h, s >= 8 ? 100 : 75, v >= 8 ? 100 : 75));
    }

    return contextToColor.get(context)!;
}

export function getLevelColor(level: 'log' | 'error' | 'warn' | 'debug' | 'verbose' | string): Chalk {
    switch (level) {
        case 'error':
            return chalk.redBright;
        case 'warn':
            return chalk.yellowBright;
        case 'debug':
            return chalk.cyanBright;
        case 'verbose':
            return chalk.magentaBright;
        default:
            return chalk;
    }
}

export type AdditionalMeta = [...object[], string, string] | [...object[], string] | object[];

type Message =
    | string
    | {
          message: string;
      };

function stringToMeta(meta: AdditionalMeta, index: number, key: string) {
    if (typeof meta[index] === 'string') {
        meta[index] = { [key]: meta[index] };
    }
}

export class WinstonLogger implements NestLoggerService {
    protected readonly logger: _WinstonLogger;

    static getInstance(): WinstonLogger {
        const logger = Logger as unknown as { staticInstanceRef?: WinstonLogger; instance: WinstonLogger };
        return logger.staticInstanceRef ?? logger.instance;
    }

    static getChild(context: string) {
        return this.getInstance().child(context);
    }

    constructor(loggerOrFactory: _WinstonLogger | (() => _WinstonLogger)) {
        if (typeof loggerOrFactory === 'function') {
            this.logger = (loggerOrFactory as Function)();
        } else {
            this.logger = loggerOrFactory;
        }
    }

    getWinston() {
        return this.logger;
    }

    protected _parseMessage(message: Message): { message: string; meta: object } {
        if (typeof message === 'object') {
            const { message: msg, ...meta } = message;
            return { message: String(msg), meta };
        } else {
            return { message: String(message), meta: {} };
        }
    }

    protected _parseMeta(meta: object, additional: AdditionalMeta) {
        stringToMeta(additional, additional.length - 1, 'context');

        return (additional as object[]).reduce((t, c) => ({ ...t, ...c }), meta);
    }

    protected _log(
        level: 'info' | 'error' | 'warn' | 'debug' | 'verbose',
        msg: string | { message: string },
        ...additional: AdditionalMeta
    ) {
        let { message, meta } = this._parseMessage(msg);
        meta = this._parseMeta(meta, additional);

        this.logger[level](message, meta);
    }

    info(message: Message, ...additional: AdditionalMeta): void {
        this._log('info', message, ...additional);
    }

    log = this.info;

    error(message: Message, ...additional: AdditionalMeta): void {
        stringToMeta(additional, additional.length - 2, 'stack');
        this._log('error', message, ...additional);
    }

    warn(message: Message, ...additional: AdditionalMeta): void {
        this._log('warn', message, ...additional);
    }

    debug(message: Message, ...additional: AdditionalMeta): void {
        this._log('debug', message, ...additional);
    }

    verbose(message: Message, ...additional: AdditionalMeta): void {
        this._log('verbose', message, ...additional);
    }

    http(message: string, meta: object) {
        this.logger.http(message, meta);
    }

    child(context: string) {
        return this.logger.child({ context });
    }
}
