import { DynamicModule, Global, Module, Type } from '@nestjs/common';
import { create, ModuleOptions, OAuthClient } from 'simple-oauth2';

import { AsyncOptions, createAsyncProviders } from '../utils/providers';


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

    static forRootAsync(options: AsyncOptions<ModuleOptions>) : DynamicModule {
        return {
            module: SimpleOauth2Module,
            imports: options.imports,
            providers: [
                ...createAsyncProviders(options, Oauth2Options)
            ]
        }
    }
}
