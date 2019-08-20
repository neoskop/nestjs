import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';
import { WinstonLogger } from './winston-logger';


@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware<Request, Response> {
    readonly logger = WinstonLogger.getInstance();

    static toString() {
        return `class ${this.constructor.name}`;
    }

    use(req?: Request, res?: Response, next?: Function) {
        const end = res!.end;
        const start = Date.now();

        res!.end = (...args: any[]) => {
            (end as any).apply(res, args);
            let contentType = res!.getHeader('Content-Type');
            this.logger.http('response', { path: req!.originalUrl, method: req!.method, contentType, statusCode: res!.statusCode, runtime: Date.now() - start });
        }

        next!();
    }
}
