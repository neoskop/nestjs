import 'zone.js';
import 'zone.js/dist/zone-node';

import { Controller, Inject } from '@nestjs/common';

import { AngularController } from './angular.controller';
import { ANGULAR_OPTIONS, AngularOptions } from './tokens';


@Controller('/')
export class AngularRootController extends AngularController<AngularOptions> {


    constructor(@Inject(ANGULAR_OPTIONS) options : AngularOptions) {
        super(options.mode, options, options.nonceFactory);
    }

    protected init() {
        for(const [ path, options ] of this.options.apps) {
            const controller = new AngularController(this.options.mode, options, this.options.nonceFactory);

            this.router.use(path, controller.handle.bind(controller));
        }

        super.init();
    }
}

