import { DynamicModule, Global, Module, Provider, Type } from '@nestjs/common';
import { ModuleOptions, OAuthClient, create } from 'simple-oauth2';
import { ModuleMetadata } from '@nestjs/common/interfaces';

export interface SimpleOauth2AsyncOptions extends Pick<ModuleMetadata, 'imports'> {
    useExisting?: Type<Oauth2OptionsFactory>;
    useClass?: Type<Oauth2OptionsFactory>;
    useFactory?: (...args : any[]) => Promise<ModuleOptions> | ModuleOptions,
    inject?: any[];
}

export interface Oauth2OptionsFactory {
    createOauth2Options() : Promise<ModuleOptions> | ModuleOptions;
}

export const Oauth2Options = 'OAUTH2_OPTIONS' as any as Type<ModuleOptions>;
export type Oauth2Options = ModuleOptions;

export const Oauth2Client = 'OAUTH2_CLIENT' as any as Type<OAuthClient>;
export type Oauth2Client = OAuthClient;

@Global()
@Module({
    providers: [ {
        provide: Oauth2Client,
        useFactory: create,
        inject: [ Oauth2Options ]
    } ],
    exports: [ Oauth2Client ]
})
export class SimpleOauth2Module {
    static forRoot(options : ModuleOptions) : DynamicModule {
        return {
            module: SimpleOauth2Module,
            providers: [
                {
                    provide: Oauth2Options,
                    useValue: options
                }
            ]
        }
    }

    static forRootAsync(options: SimpleOauth2AsyncOptions) : DynamicModule {
        return {
            module: SimpleOauth2Module,
            imports: options.imports,
            providers: [
                ...this.createAsyncProviders(options)
            ]
        }
    }

    protected static createAsyncProviders(options : SimpleOauth2AsyncOptions) : Provider[] {
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

    protected static createAsyncOptionsProvider(options : SimpleOauth2AsyncOptions) : Provider {
        if(options.useFactory) {
            return {
                provide: Oauth2Options,
                useFactory: options.useFactory,
                inject: options.inject
            }
        }

        return {
            provide: Oauth2Options,
            useFactory: async (optionsFactory : Oauth2OptionsFactory) => await optionsFactory.createOauth2Options(),
            inject: [ options.useExisting || options.useClass ]
        }
    }
}
