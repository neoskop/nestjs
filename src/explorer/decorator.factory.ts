import { SetMetadata } from '@nestjs/common';

export interface ExplorableClassDecorator<T extends string> extends ClassDecorator {
    key: string;
}

export function createExplorableDecorator<T extends string>(key: T) : ExplorableClassDecorator<T> {
    return Object.assign(SetMetadata(key, true), { key });
}