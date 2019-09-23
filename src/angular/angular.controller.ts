import 'zone.js';
import 'zone.js/dist/zone-node';

import { NgModuleFactory } from '@angular/core';
import { renderModuleFactory } from '@angular/platform-server';
import { Controller, Get, Next, Request, Response } from '@nestjs/common';
import { provideModuleMap } from '@nguniversal/module-map-ngfactory-loader';
import { ModuleMap } from '@nguniversal/module-map-ngfactory-loader/src/module-map';
import express from 'express';
import fs from 'fs';
import proxy from 'http-proxy-middleware';
import path from 'path';

import { IAngularAppOptions } from './tokens';

@Controller()
export class AngularController<T extends IAngularAppOptions = IAngularAppOptions> {
    protected readonly _static = this.mode === 'ssr' && this.options.www ? express.static(path.resolve(this.options.www), { index: false }) : null;
    protected readonly _template = this.mode === 'ssr' && this.options.www ? fs.readFileSync(path.join(this.options.www, 'index.html'), 'utf-8') : null;
    protected readonly _bundle = this.mode === 'ssr' && this.options.main ? loadBundle(this.options.main) : null;
    protected readonly _proxy = this.mode === 'proxy' && this.options.target ? proxy({ target: this.options.target, changeOrigin: true, ws: true }) : null;

    protected readonly router = express.Router();

    constructor(protected readonly mode: 'ssr' | 'proxy',
        protected readonly options: T,
        protected readonly nonceFactory?: (request : express.Request, response : express.Response) => string) {
        this.init();
    }

    protected init() {
        if((this._static && this._template && this._bundle) || this._proxy) {
            this.router.get('*.*', this.getStaticAssets.bind(this));
            this.router.get('*', this.getAngular.bind(this));
        }
    }

    protected checkSkip(req: express.Request) {
        return !!this.options.skip && this.options.skip(req);
    }

    getStaticAssets(req: express.Request, res: express.Response, next: express.NextFunction) {
        if (this.mode === 'ssr' && !this.checkSkip(req)) {
            this._static!(req, res, next);
        } else {
            next();
        }
    }

    protected _ssr(request: express.Request, response: express.Response, next: express.NextFunction) {
        Zone.current.fork({
            name: 'angular-ssr',
            properties: { request, response }
        }).run(async () => {
            try {
                const html = await renderModuleFactory(this._bundle!.ModuleNgFactory, {
                    document: this._template!,
                    url: `${request.protocol}://${request.get('host')}${request.url}`,
                    extraProviders: [
                        provideModuleMap(this._bundle!.LAZY_MODULE_MAP),
                        { provide: 'REQUEST', useValue: request },
                        { provide: 'RESPONSE', useValue: response },
                        ...(this.options.providers || [])
                    ]
                });

                response.header('Content-Type', 'text/html');
                if(this.nonceFactory) {
                    response.end(html.replace(/<script(?: type="text\/javascript")?/g, `$& nonce="${this.nonceFactory(request, response)}"`));
                } else {
                    response.end(html);
                }
            } catch (err) {
                next(err);
            }
        });
    };

    getAngular(req: express.Request, res: express.Response, next: express.NextFunction) {
        if (this.checkSkip(req)) {
            next();
        } else if (this.mode === 'ssr') {
            this._ssr(req, res, next);
        } else {
            this._proxy!(req, res, next);
        }
    }

    @Get('*')
    handle(@Request() req: express.Request, @Response() res: express.Response, @Next() next: express.NextFunction) {
        this.router(req, res, next);
    }
}


function loadBundle(src: string): { ModuleNgFactory: NgModuleFactory<any>, LAZY_MODULE_MAP: ModuleMap } {
    const bundle = require(path.resolve(src));

    const moduleFactoryKey = Object.keys(bundle).find(k => k.endsWith('NgFactory'));

    if (!moduleFactoryKey) {
        throw new Error(`Cannot find module factory in "${src}"`);
    }

    return {
        ModuleNgFactory: bundle[moduleFactoryKey],
        LAZY_MODULE_MAP: bundle.LAZY_MODULE_MAP
    };
}
