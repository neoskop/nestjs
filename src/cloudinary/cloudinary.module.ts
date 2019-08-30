import { DynamicModule, Global, Module, Type } from '@nestjs/common';
import cloudinary, { ICloudinaryConfig } from 'cloudinary';
import { ModuleOptions } from 'simple-oauth2';

import { AsyncOptions, createAsyncProviders } from '../utils/providers';

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

    static forRootAsync(options: AsyncOptions<ModuleOptions>) : DynamicModule {
        return {
            module: CloudinaryModule,
            imports: options.imports,
            providers: [
                ...createAsyncProviders(options, CloudinaryOptions)
            ]
        }
    }
}
