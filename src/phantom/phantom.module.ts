import { AopManager } from '@neoskop/phantom';
import { DynamicModule, Module, Provider, Logger } from '@nestjs/common';
import { ModuleMetadata, OnModuleInit, Type } from '@nestjs/common/interfaces';
import { AspectExplorerService } from './aspect-explorer.service';
import { AsyncOptions, createAsyncProviders } from '../utils/providers';
import { ExplorerService } from '../explorer';
import { Aspect } from './aspect.decorator';


export interface PhantomModuleOptions {
}

export const PHANTOM_OPTIONS = 'PHANTOM:options';

@Module({
    providers: [
        AopManager
    ],
    exports: [
        AopManager
    ]
})
export class PhantomModule implements OnModuleInit {
    protected readonly log = new Logger('AspectsResolver');

    constructor(protected readonly explorerService : ExplorerService,
                protected readonly aopManager : AopManager) {}

    static forRoot(options : PhantomModuleOptions) : DynamicModule {
        return {
            module: PhantomModule,
            providers: [
                { provide: PHANTOM_OPTIONS, useValue: options }
            ]
        }
    }

    static forRootAsync(options: AsyncOptions<PhantomModuleOptions>) : DynamicModule {
        return {
            module: PhantomModule,
            imports: options.imports,
            providers: [
                ...createAsyncProviders(options, PHANTOM_OPTIONS)
            ]
        }
    }

    onModuleInit() {
        const aspects = this.explorerService.explore<{}>(Aspect);

        for(const aspect of aspects) {
            this.log.log(`registered ${aspect.constructor.name}`);
        }

        this.aopManager.install(aspects);
    }
}
