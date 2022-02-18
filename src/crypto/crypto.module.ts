import { DynamicModule, Module, Provider } from '@nestjs/common';

import { CryptoEasService } from './eas.service';
import { CryptoAsyncOptions, CryptoModuleOptions, CryptoOptionsFactory } from './types';

@Module({})
export class CryptoModule {
    static forRoot(options: CryptoModuleOptions): DynamicModule {
        return {
            module: CryptoModule,
            providers: [{ provide: CryptoModuleOptions, useValue: options }, CryptoEasService],
            exports: [CryptoEasService]
        };
    }

    static forRootAsync(options: CryptoAsyncOptions): DynamicModule {
        return {
            module: CryptoModule,
            imports: options.imports,
            providers: [...this.createAsyncProviders(options), CryptoEasService],
            exports: [CryptoEasService]
        };
    }

    protected static createAsyncProviders(options: CryptoAsyncOptions): Provider[] {
        if (options.useExisting || options.useFactory) {
            return [this.createAsyncOptionsProvider(options)];
        }

        return [
            this.createAsyncOptionsProvider(options),
            {
                provide: options.useClass!,
                useClass: options.useClass!
            }
        ];
    }

    protected static createAsyncOptionsProvider(options: CryptoAsyncOptions): Provider {
        if (options.useFactory) {
            return {
                provide: CryptoModuleOptions,
                useFactory: options.useFactory,
                inject: options.inject
            };
        }

        return {
            provide: CryptoModuleOptions,
            useFactory: async (optionsFactory: CryptoOptionsFactory) => await optionsFactory.createCryptoOptions(),
            inject: [options.useExisting || options.useClass!]
        };
    }
}
