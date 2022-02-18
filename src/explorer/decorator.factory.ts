import { SetMetadata } from '@nestjs/common';

export type ExplorableClassDecoratorFactory<C, P> = Function & { _c: C, key: string } & (P extends {} ? { (arg: P): ClassDecorator } : { (): ClassDecorator })
export type ExplorableClassDecoratorType<T> = T extends ExplorableClassDecoratorFactory<any, infer I> ? I : never; 
export type ExplorableClassDecoratorClass<T> = T extends ExplorableClassDecoratorFactory<infer C, any> ? C : never; 

export function createExplorableDecorator<C, P extends {}|null = null>(key: string) : ExplorableClassDecoratorFactory<C, P> {
    return Object.assign((arg?: P) => SetMetadata(key, arg || {}), { key }) as unknown as ExplorableClassDecoratorFactory<C, P>;
}