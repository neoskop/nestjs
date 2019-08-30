import { ModuleMetadata, Type, Provider } from '@nestjs/common/interfaces';

export interface Factory<T> {
    createOptions(): T | Promise<T>;
}

export interface AsyncOptions<OPTIONS, FACTORY extends Factory<OPTIONS> = Factory<OPTIONS>> extends Pick<ModuleMetadata, 'imports'> {
    useExisting?: Type<FACTORY>;
    useClass?: Type<FACTORY>;
    useFactory?: (...args : any[]) => Promise<OPTIONS> | OPTIONS,
    inject?: any[];
}

export function createAsyncProviders<T>(options: AsyncOptions<T>, token : any) {
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

export function createAsyncOptionsProvider<T>(options : AsyncOptions<T>, token : any) : Provider {
    if(options.useFactory) {
        return {
            provide: token,
            useFactory: options.useFactory,
            inject: options.inject
        };
    }

    return {
        provide: token,
        useFactory: async (factory : Factory<T>) => await factory.createOptions(),
        inject: [ options.useExisting || options.useClass! ]
    };
}