import { Injectable } from '@nestjs/common';
import { ModulesContainer } from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { Module } from '@nestjs/core/injector/module';

import { ASPECT } from './aspect.decorator';

@Injectable()
export class AspectExplorerService {


    constructor(protected readonly modulesContainer : ModulesContainer) {

    }

    explore() {
        const modules = this.getModules();

        const aspects = this.map(modules, (instance, module) => this.filterAspects(instance, module));

        return aspects;
    }

    protected filterAspects(wrapper : InstanceWrapper, _module : Module) {
        const { instance } = wrapper;
        if(!instance) {
            return null;
        }

        const proto = Object.getPrototypeOf(instance);
        const meta = Reflect.getMetadata(ASPECT, proto.constructor);

        if(meta) {
            return instance;
        }

        return null;
    }

    protected getModules() : Module[] {
        return [ ...this.modulesContainer.values() ];
    }

    protected map<T = any>(modules : Module[], fn : (instance: InstanceWrapper, module: Module) => T|null) : T[] {
        return modules.map(module => {
            return [ ...module.providers.values() ].map(instance => fn(instance, module));
        }).reduce((t, c) => t.concat(c)).filter(Boolean) as T[];
    }
}
