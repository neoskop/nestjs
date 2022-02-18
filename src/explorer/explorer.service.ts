import { Injectable } from '@nestjs/common';
import { ModulesContainer } from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { Module } from '@nestjs/core/injector/module';

import { ExplorableClassDecoratorFactory, ExplorableClassDecoratorType, ExplorableClassDecoratorClass } from './decorator.factory';

@Injectable()
export class ExplorerService {

    constructor(protected readonly modulesContainer: ModulesContainer) {}

    explore<T extends ExplorableClassDecoratorFactory<any, any>>(decorator: T): ExplorableClassDecoratorClass<T>[];
    explore<C>(key: string): C[];
    explore<C>(decoratorOrKey: ExplorableClassDecoratorFactory<any, any> | string): C[] {
        return this.exploreWithMetadata<C>(decoratorOrKey as any).map(([ instance ]) => instance);
    }

    exploreWithMetadata<T extends ExplorableClassDecoratorFactory<any, any>>(decorator: T): [ ExplorableClassDecoratorClass<T>, ExplorableClassDecoratorType<T> ][];
    exploreWithMetadata<C = any, T = any>(key: string): [ C, T ][];
    exploreWithMetadata<C = any, T = any>(decoratorOrKey: ExplorableClassDecoratorFactory<C, T> | string): [ C, T ][] {
        const modules = this.getModules();

        const aspects = this.map(modules, (instance, module) => this.filterAspects<T>(typeof decoratorOrKey === 'string' ? decoratorOrKey : decoratorOrKey.key, instance, module));

        return aspects;
    }

    protected filterAspects<T>(key: string, wrapper: InstanceWrapper, _module: Module) {
        const { instance } = wrapper;
        if (!instance) {
            return null;
        }

        const proto = Object.getPrototypeOf(instance);
        const meta = Reflect.getMetadata(key, proto.constructor) as T | null;

        if (meta) {
            return [ instance, meta ] as [ any, T ];
        }

        return null;
    }

    protected getModules(): Module[] {
        return [...this.modulesContainer.values()];
    }

    protected map<T = any>(modules: Module[], fn: (instance: InstanceWrapper, module: Module) => T | null): T[] {
        return modules.map(module => {
            return [...module.providers.values()].map(instance => fn(instance, module));
        }).reduce((t, c) => t.concat(c)).filter(Boolean) as T[];
    }
}

