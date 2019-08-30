import 'zone.js';
import 'zone.js/dist/zone-node';

import { DynamicModule, Module, Provider, Type, NestModule } from '@nestjs/common';
import { MiddlewareConsumer, ModuleMetadata } from '@nestjs/common/interfaces';
import cookieParser from 'cookie-parser';

import { AngularRootController } from './angular-root.controller';
import { ANGULAR_OPTIONS, AngularOptions, AngularLocaleOptions, ANGULAR_LOCALE_OPTIONS } from './tokens';
import { enableProdMode } from '@angular/core';
import { AngularLocaleController } from './angular-locale.controller';

enableProdMode();

export interface AngularOptionsFactory {
    createAngularOptions() : Promise<AngularOptions> | AngularOptions;
}
export interface AngularLocaleOptionsFactory {
    createAngularOptions() : Promise<AngularLocaleOptions> | AngularLocaleOptions;
}

export interface AngularAsyncOptions<F = AngularOptionsFactory, T = AngularOptions> extends Pick<ModuleMetadata, 'imports'> {
    useExisting?: Type<F>;
    useClass?: Type<F>;
    useFactory?: (...args : any[]) => Promise<T> | T,
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
                ...createAsyncProviders(options, ANGULAR_OPTIONS),
            ],
            exports: [ ANGULAR_OPTIONS ]
        };
    }    

    configure(consumer : MiddlewareConsumer) {
        consumer.apply(cookieParser()).forRoutes('/');
    }
}

@Module({
    controllers: [
        AngularLocaleController
    ]
})
export class AngularLocaleModule implements NestModule {
    static forRoot(options : AngularLocaleOptions) : DynamicModule {
        return {
            module: AngularLocaleModule,
            providers: [
                { provide: ANGULAR_LOCALE_OPTIONS, useValue: options }
            ],
            exports: [ ANGULAR_LOCALE_OPTIONS ]
        }
    }

    static forRootAsync(options : AngularAsyncOptions<AngularLocaleOptionsFactory, AngularLocaleOptions>) : DynamicModule {
        return {
            module: AngularLocaleModule,
            providers: [
                ...createAsyncProviders(options, ANGULAR_LOCALE_OPTIONS),
            ],
            exports: [ ANGULAR_LOCALE_OPTIONS ]
        };
    }    

    configure(consumer : MiddlewareConsumer) {
        consumer.apply(cookieParser()).forRoutes('/');
    }
}

function createAsyncProviders<F, T>(options: AngularAsyncOptions<F, T>, token : any) {
    if(options.useExisting || options.useFactory) {
        return [ createAsyncOptionsProvider(options, token) ];
    }

    return [
        createAsyncOptionsProvider(options, token),
        {
            provide: options.useClass!,
            useClass: options.useClass!
        }
    ];
}

function createAsyncOptionsProvider<F, T>(options : AngularAsyncOptions<F, T>, token : any) : Provider {
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
        inject: [ options.useExisting || options.useClass! ]
    };
}
