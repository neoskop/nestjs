import 'zone.js';
import 'zone.js/dist/zone-node';

import { DynamicModule, Module, Provider, Type, NestModule } from '@nestjs/common';
import { MiddlewareConsumer, ModuleMetadata } from '@nestjs/common/interfaces';
import cookieParser from 'cookie-parser';

import { AngularRootController } from './angular-root.controller';
import { ANGULAR_OPTIONS, AngularOptions } from './tokens';
import { enableProdMode } from '@angular/core';

enableProdMode();

export interface AngularOptionsFactory {
    createAngularOptions() : Promise<AngularOptions> | AngularOptions;
}

export interface AngularAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
    useExisting?: Type<AngularOptionsFactory>;
    useClass?: Type<AngularOptionsFactory>;
    useFactory?: (...args : any[]) => Promise<AngularOptions> | AngularOptions,
    inject?: any[];
}

@Module({
    controllers: [
        AngularRootController
    ]
})
export class AngularModule implements NestModule {
    static forRoot(options : AngularOptions) : DynamicModule {
        return {
            module: AngularModule,
            providers: [
                { provide: ANGULAR_OPTIONS, useValue: options }
            ],
            exports: [ ANGULAR_OPTIONS ]
        }
    }

    static forRootAsync(options : AngularAsyncOptions) : DynamicModule {
        return {
            module: AngularModule,
            providers: [
                ...this.createAsyncProviders(options, ANGULAR_OPTIONS),
            ],
            exports: [ ANGULAR_OPTIONS ]
        };
    }

    protected static createAsyncProviders(options: AngularAsyncOptions, token : any) {
        if(options.useExisting || options.useFactory) {
            return [ this.createAsyncOptionsProvider(options, token) ];
        }

        return [
            this.createAsyncOptionsProvider(options, token),
            {
                provide: options.useClass!,
                useClass: options.useClass!
            }
        ];
    }

    protected static createAsyncOptionsProvider(options : AngularAsyncOptions, token : any) : Provider {
        if(options.useFactory) {
            return {
                provide: token,
                useFactory: options.useFactory,
                inject: options.inject
            };
        }

        return {
            provide: token,
            useFactory: async (factory : AngularOptionsFactory) => await factory.createAngularOptions(),
            inject: [ options.useExisting || options.useClass ]
        };
    }

    configure(consumer : MiddlewareConsumer) {
        consumer.apply(cookieParser()).forRoutes('/');
    }
}
