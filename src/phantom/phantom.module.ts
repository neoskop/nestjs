import { AopManager } from '@neoskop/phantom';
import { DynamicModule, Module, Provider, Logger } from '@nestjs/common';
import { ModuleMetadata, OnModuleInit, Type } from '@nestjs/common/interfaces';
import { AspectExplorerService } from './aspect-explorer.service';


export interface PhantomModuleOptions {
}

export interface PhantomAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
    useExisting?: Type<PhantomOptionsFactory>;
    useClass?: Type<PhantomOptionsFactory>;
    useFactory?: (...args : any[]) => Promise<PhantomModuleOptions> | PhantomModuleOptions,
    inject?: any[];
}


export interface PhantomOptionsFactory {
    createPhantomOptions() : Promise<PhantomModuleOptions> | PhantomModuleOptions;
}

export const PHANTOM_OPTIONS = 'PHANTOM:options';

@Module({
    providers: [
        AopManager,
        AspectExplorerService
    ],
    exports: [
        AopManager
    ]
})
export class PhantomModule implements OnModuleInit {
    protected readonly log = new Logger('AspectsResolver');

    constructor(protected readonly aspectExplorer : AspectExplorerService,
                protected readonly aopManager : AopManager) {}

    static forRoot(options : PhantomModuleOptions) : DynamicModule {
        return {
            module: PhantomModule,
            providers: [
                { provide: PHANTOM_OPTIONS, useValue: options }
            ]
        }
    }

    static forRootAsync(options: PhantomAsyncOptions) : DynamicModule {
        return {
            module: PhantomModule,
            imports: options.imports,
            providers: [
                ...this.createAsyncProviders(options)
            ]
        }
    }

    protected static createAsyncProviders(options : PhantomAsyncOptions) : Provider[] {
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

    protected static createAsyncOptionsProvider(options : PhantomAsyncOptions) : Provider {
        if(options.useFactory) {
            return {
                provide: PHANTOM_OPTIONS,
                useFactory: options.useFactory,
                inject: options.inject
            }
        }

        return {
            provide: PHANTOM_OPTIONS,
            useFactory: async (optionsFactory : PhantomOptionsFactory) => await optionsFactory.createPhantomOptions(),
            inject: [ options.useExisting || options.useClass ]
        }
    }

    onModuleInit() {
        const aspects = this.aspectExplorer.explore();

        for(const aspect of aspects) {
            this.log.log(`registered ${aspect.constructor.name}`);
        }

        this.aopManager.install(aspects);
    }
}
