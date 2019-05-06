import { DynamicModule, Global, Module, Provider, Type } from '@nestjs/common';
import { ModuleOptions, OAuthClient, create } from 'simple-oauth2';
import { ModuleMetadata } from '@nestjs/common/interfaces';
import { ICloudinaryConfig } from 'cloudinary';
import cloudinary from 'cloudinary';


export interface CloudinaryAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
    useExisting?: Type<CloudinaryOptionsFactory>;
    useClass?: Type<CloudinaryOptionsFactory>;
    useFactory?: (...args : any[]) => Promise<ICloudinaryConfig> | ICloudinaryConfig,
    inject?: any[];
}

export interface CloudinaryOptionsFactory {
    createCloudinaryOptions() : Promise<ICloudinaryConfig> | ICloudinaryConfig;
}

export const CloudinaryOptions = 'CLOUDINARY_OPTIONS' as any as Type<ICloudinaryConfig>;
export type CloudinaryOptions = ICloudinaryConfig;

export const CloudinaryClient = 'CLOUDINARY_CLIENT' as any as Type<typeof cloudinary>;
export type CloudinaryClient = typeof cloudinary;


@Global()
@Module({
    providers: [ {
        provide: CloudinaryClient,
        useFactory: options => {
            cloudinary.config(options);
            return cloudinary;
        },
        inject: [ CloudinaryOptions ]
    } ],
    exports: [ CloudinaryClient ]
})
export class CloudinaryModule {
    static forRoot(options : ModuleOptions) : DynamicModule {
        return {
            module: CloudinaryModule,
            providers: [
                {
                    provide: CloudinaryOptions,
                    useValue: options
                }
            ]
        }
    }

    static forRootAsync(options: CloudinaryAsyncOptions) : DynamicModule {
        return {
            module: CloudinaryModule,
            imports: options.imports,
            providers: [
                ...this.createAsyncProviders(options)
            ]
        }
    }

    protected static createAsyncProviders(options : CloudinaryAsyncOptions) : Provider[] {
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

    protected static createAsyncOptionsProvider(options : CloudinaryAsyncOptions) : Provider {
        if(options.useFactory) {
            return {
                provide: CloudinaryOptions,
                useFactory: options.useFactory,
                inject: options.inject
            }
        }

        return {
            provide: CloudinaryOptions,
            useFactory: async (optionsFactory : CloudinaryOptionsFactory) => await optionsFactory.createCloudinaryOptions(),
            inject: [ options.useExisting || options.useClass ]
        }
    }
}
