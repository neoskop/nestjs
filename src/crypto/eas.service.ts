import { createCipheriv, scryptSync, randomBytes, createDecipheriv } from 'crypto';
import { Injectable } from '@nestjs/common';
import { CryptoModuleOptions } from './types';

@Injectable()
export class CryptoEasService {
    static readonly ALGORITHM = 'aes-256-cbc';

    constructor(protected readonly options: CryptoModuleOptions) {}

    encryptRaw(key: Buffer, iv: Buffer, content: Buffer, algorithm: string = CryptoEasService.ALGORITHM): Buffer {
        const cipher = createCipheriv(algorithm, key, iv);

        return Buffer.concat([cipher.update(content), cipher.final()]);
    }

    decryptRaw(key: Buffer, iv: Buffer, content: Buffer, algorithm: string = CryptoEasService.ALGORITHM): Buffer {
        const cipher = createDecipheriv(algorithm, key, iv);

        return Buffer.concat([cipher.update(content), cipher.final()]);
    }

    encrypt(content: Buffer): string {
        if(!this.options.eas) {
            throw new Error('EAS Options required');
        }

        const key = scryptSync(this.options.eas.password, this.options.eas.salt, 24);
        const iv = randomBytes(16);
        const encrypted = this.encryptRaw(key, iv, content, this.options.eas.algorithm);

        return `${encrypted.toString('hex')}${iv.toString('hex')}`;
    }

    decrypt(content: string): Buffer {
        if(!this.options.eas) {
            throw new Error('EAS Options required');
        }

        const key = scryptSync(this.options.eas.password, this.options.eas.salt, 24);
        const [ encrypted, iv ] = content.split(/,/).map(t => Buffer.from(t, 'hex'));

        return this.decryptRaw(key, iv, encrypted, this.options.eas.algorithm);
    }
}
