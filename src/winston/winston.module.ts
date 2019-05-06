import { DynamicModule, Module, Provider } from '@nestjs/common';
import { ModuleMetadata, Type } from '@nestjs/common/interfaces';
import { createLogger, Logger as WinstonLogger, LoggerOptions } from 'winston';


export interface WinstonModuleOptions extends LoggerOptions {
}

export interface WinstonAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
    useExisting?: Type<WinstonOptionsFactory>;
    useClass?: Type<WinstonOptionsFactory>;
    useFactory?: (...args : any[]) => Promise<WinstonModuleOptions> | WinstonModuleOptions,
    inject?: any[];
}


export interface WinstonOptionsFactory {
    createWinstonOptions() : Promise<WinstonModuleOptions> | WinstonModuleOptions;
}

export const WINSTON_OPTIONS = 'Winston:options';

export const Logger = 'Winston:logger' as unknown as WinstonLogger;
export type Logger = WinstonLogger;

@Module({
    providers: [
        {
            provide: Logger,
            useFactory(options : LoggerOptions) {
                return createLogger(options);
            },
            inject: [ WINSTON_OPTIONS ]
        }
    ],
    exports: [ Logger ]
})
export class WinstonModule {

    static forRoot(options : WinstonModuleOptions) : DynamicModule {
        return {
            module: WinstonModule,
            providers: [
                { provide: WINSTON_OPTIONS, useValue: options }
            ]
        }
    }

    static forRootAsync(options: WinstonAsyncOptions) : DynamicModule {
        return {
            module: WinstonModule,
            imports: options.imports,
            providers: [
                ...this.createAsyncProviders(options)
            ]
        }
    }

    protected static createAsyncProviders(options : WinstonAsyncOptions) : Provider[] {
        if(options.useExisting || options.useFactory) {
            return [ this.createAsyncOptionsProvider(options) ];
        }

        return [
            this.createAsyncOptionsProvider(options),
            {
                provide: options.useClass!,
                useClass: options.useClass!
            }
        ]
    }

    protected static createAsyncOptionsProvider(options : WinstonAsyncOptions) : Provider {
        if(options.useFactory) {
            return {
                provide: WINSTON_OPTIONS,
                useFactory: options.useFactory,
                inject: options.inject
            }
        }

        return {
            provide: WINSTON_OPTIONS,
            useFactory: async (optionsFactory : WinstonOptionsFactory) => await optionsFactory.createWinstonOptions(),
            inject: [ options.useExisting || options.useClass ]
        }
    }
}
