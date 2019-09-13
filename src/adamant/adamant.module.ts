import { Injector } from '@angular/core';
import {
    ADAMANT_CONNECTION_FACTORY,
    ADAMANT_EQUAL_CHECKER,
    ADAMANT_ID,
    ADAMANT_INJECTOR,
    ADAMANT_INJECTOR_FACTORY,
    AdamantConnectionManager,
    adamantIdFactory,
    ConnectionFactory,
    createAngularInjector,
    equalCheckerFactory,
    DesignDocMetadataCollection,
} from '@neoskop/adamant';
import { DynamicModule, Global, Module, Provider, Type, Inject } from '@nestjs/common';
import { ModuleMetadata } from '@nestjs/common/interfaces';
import { AdamantHealthIndicator } from './adamant.health';


export interface AdamantOptions {
    factory: ConnectionFactory;
    designDocs?: Type<any>[];
    providers?: any[];
}

export interface AdamantAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
    providers?: any[];
    designDocs?: Type<any>[];
    useExisting?: Type<AdamantConnectionFactoryFactory>;
    useClass?: Type<AdamantConnectionFactoryFactory>;
    useFactory?: (...args : any[]) => Promise<ConnectionFactory> | ConnectionFactory,
    inject?: any[];
}

export interface AdamantConnectionFactoryFactory {
    createAdamantConnection() : Promise<ConnectionFactory> | ConnectionFactory;
}

export const ADAMANT_PROVIDERS = 'ADAMANT_PROVIDERS';
export const ADAMANT_DESIGN_DOCS = 'ADAMANT_DESIGN_DOCS';
export const ADAMANT_PROVIDER_VALUES = 'ADAMANT_PROVIDER_VALUES';

export async function designDocFactory(...designDocs : any[]) {
    return designDocs;
}

@Global()
@Module({
    providers: [
        {
            provide: AdamantConnectionManager,
            async useFactory(factory: ConnectionFactory, providers : any[], designDocs : any[], deps : any[]) {
                const injector = Injector.create({
                    providers: [
                        { provide: ADAMANT_ID, useFactory: adamantIdFactory, deps: [] },
                        { provide: ADAMANT_CONNECTION_FACTORY, useValue: factory },
                        { provide: ADAMANT_EQUAL_CHECKER, useFactory: equalCheckerFactory, deps: [] },
                        { provide: ADAMANT_INJECTOR, useExisting: Injector },
                        { provide: ADAMANT_INJECTOR_FACTORY, useValue: createAngularInjector },
                        ...providers.map((provide, index) => ({ provide, useValue: deps[index] }))
                    ]
                });
                const manager = new AdamantConnectionManager(factory, injector.get(ADAMANT_ID), injector, createAngularInjector);
                try {
                    for(const designDoc of designDocs) {
                        const metadata = DesignDocMetadataCollection.create(designDoc.constructor as any);
                        await manager.getRepository(metadata.entity).persistDesignDoc(designDoc);

                        for(const view of metadata.views) {
                            await manager.getRepository(metadata.entity).view(designDoc.constructor as any, view, { depth: 0 });
                        }
                    }
                } catch(e) {
                    console.log(e.trace || e);
                }

                return manager;
            },
            inject: [ ADAMANT_CONNECTION_FACTORY, ADAMANT_PROVIDERS, ADAMANT_DESIGN_DOCS, ADAMANT_PROVIDER_VALUES ] as (string|Type<any>)[]
        },
        AdamantHealthIndicator
    ],
    exports: [ AdamantConnectionManager, AdamantHealthIndicator ]
})
export class AdamantModule {

    static forRoot(options: AdamantOptions): DynamicModule {
        return {
            module: AdamantModule,
            providers: [
                { provide: ADAMANT_CONNECTION_FACTORY as any, useValue: options.factory },
                { provide: ADAMANT_PROVIDERS, useValue: options.providers || [] },
                { provide: ADAMANT_PROVIDER_VALUES, useFactory: (...deps: any[]) => deps, inject: options.providers || [] },
                {
                    provide: ADAMANT_DESIGN_DOCS,
                    useFactory: designDocFactory,
                    inject: options.designDocs || []
                },
                ...(options.designDocs || [])
            ],
        };
    }

    static forRootAsync(options : AdamantAsyncOptions): DynamicModule {
        return {
            module: AdamantModule,
            providers: [
                ...this.createAsyncProviders(options),
                { provide: ADAMANT_PROVIDERS, useValue: options.providers || [] },
                { provide: ADAMANT_PROVIDER_VALUES, useFactory: (...deps: any[]) => deps, inject: options.providers || [] },
                {
                    provide: ADAMANT_DESIGN_DOCS,
                    useFactory: designDocFactory,
                    inject: options.designDocs || []
                },
                ...(options.designDocs || [])
            ]
        }
    }

    protected static createAsyncProviders(options: AdamantAsyncOptions) {
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

    protected static createAsyncOptionsProvider(options : AdamantAsyncOptions) : Provider {
        if(options.useFactory) {
            return {
                provide: ADAMANT_CONNECTION_FACTORY as any,
                useFactory: options.useFactory,
                inject: options.inject
            }
        }

        return {
            provide: ADAMANT_CONNECTION_FACTORY as any,
            useFactory: async (factory : AdamantConnectionFactoryFactory) => await factory.createAdamantConnection(),
            inject: [ options.useExisting || options.useClass! ]
        }
    }
}
