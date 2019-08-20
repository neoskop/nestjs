import { ModuleMetadata, Type } from '@nestjs/common/interfaces';
import { Logger as WinstonLogger, LoggerOptions } from 'winston';

export class WinstonModuleOptions {
    /**
     * `true` for every request
     * or
     * array of paths to log
     */
    logRequests?: boolean|string[];
}

export interface WinstonAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
    useExisting?: Type<WinstonOptionsFactory>;
    useClass?: Type<WinstonOptionsFactory>;
    useFactory?: (...args: any[]) => Promise<WinstonModuleOptions> | WinstonModuleOptions,
    inject?: any[];
}


export interface WinstonOptionsFactory {
    createWinstonOptions(): Promise<WinstonModuleOptions> | WinstonModuleOptions;
}

// export const Logger = 'Winston:logger' as unknown as WinstonLogger;
// export type Logger = WinstonLogger;