import { ModuleMetadata, Type } from '@nestjs/common/interfaces';

export interface CryptoEasOptions {
    algorithm?: string;
    password: string;
    salt: string;
}

export class CryptoModuleOptions {
    eas?: CryptoEasOptions;
}

export interface CryptoAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
    useExisting?: Type<CryptoOptionsFactory>;
    useClass?: Type<CryptoOptionsFactory>;
    useFactory?: (...args: any[]) => Promise<CryptoModuleOptions> | CryptoModuleOptions;
    inject?: any[];
}

export interface CryptoOptionsFactory {
    createCryptoOptions(): Promise<CryptoModuleOptions> | CryptoModuleOptions;
}
