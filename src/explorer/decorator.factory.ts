import { SetMetadata } from '@nestjs/common';


export interface ExplorableClassDecoratorFactory<T extends string> {
    key: string;
    (): ClassDecorator;
}

export function createExplorableDecorator<T extends string>(key: T) : ExplorableClassDecoratorFactory<T> {
    return Object.assign(() => SetMetadata(key, true), { key });
}