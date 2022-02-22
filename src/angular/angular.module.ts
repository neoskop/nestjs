import 'zone.js';
import 'zone.js/dist/zone-node';

import { DynamicModule, Module, NestModule } from '@nestjs/common';
import { MiddlewareConsumer } from '@nestjs/common/interfaces';
import cookieParser from 'cookie-parser';

import { AsyncOptions, createAsyncProviders } from '../utils/providers';
import { AngularLocaleController } from './angular-locale.controller';
import { AngularRootController } from './angular-root.controller';
import { ANGULAR_LOCALE_OPTIONS, ANGULAR_OPTIONS, AngularLocaleOptions, AngularOptions } from './tokens';
import { requireEsm } from '../utils/require-esm';

requireEsm<typeof import('@angular/core')>('@angular/core').then(mod => mod.enableProdMode());

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

    static forRootAsync(options : AsyncOptions<AngularOptions>) : DynamicModule {
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

    static forRootAsync(options : AsyncOptions<AngularLocaleOptions>) : DynamicModule {
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
