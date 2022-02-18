import { DynamicModule, MiddlewareConsumer, Module, NestModule, Provider } from '@nestjs/common';

import { RequestLoggerMiddleware } from './request-logger.middleware';
import { WinstonAsyncOptions, WinstonModuleOptions, WinstonOptionsFactory } from './types';



@Module({})
export class WinstonModule implements NestModule {

    static forRoot(options : WinstonModuleOptions) : DynamicModule {
        return {
            module: WinstonModule,
            providers: [
                { provide: WinstonModuleOptions, useValue: options }
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
                provide: WinstonModuleOptions,
                useFactory: options.useFactory,
                inject: options.inject
            }
        }

        return {
            provide: WinstonModuleOptions,
            useFactory: async (optionsFactory : WinstonOptionsFactory) => await optionsFactory.createWinstonOptions(),
            inject: [ options.useExisting || options.useClass! ]
        }
    }

    constructor(protected readonly winstonOptions: WinstonModuleOptions) {}

    configure(consumer: MiddlewareConsumer): void {
        if(this.winstonOptions.logRequests) {
            consumer.apply(RequestLoggerMiddleware).forRoutes(...(true === this.winstonOptions.logRequests ? ['/'] : this.winstonOptions.logRequests));
        }
        
    }
}
