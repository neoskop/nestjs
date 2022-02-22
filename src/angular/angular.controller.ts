import 'zone.js';
import 'zone.js/dist/zone-node';

import type { Type } from '@angular/core';
// const requireEsm = require('esm')(module);
// const { APP_BASE_HREF } = requireEsm('@angular/common') as typeof import('@angular/common');
import { renderModule, INITIAL_CONFIG } from '@angular/platform-server';
import { Controller, Get, Next, Request, Response } from '@nestjs/common';
import express from 'express';
import fs from 'fs';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import importFresh from 'import-fresh';

import { IAngularAppOptions } from './tokens';
import { IncomingMessage } from 'http';
import { requireEsm } from '../utils/require-esm';

export interface IHooks {
    pre?(request: express.Request, response: express.Response): void | Promise<void>;
    post?(body: string, request: express.Request, response: express.Response): void | string | Promise<void | string>;
    zoneProperties?(request: express.Request, response: express.Response): void | Record<string, unknown> | Promise< | Record<string, unknown>>;
    onProxyRes?(proxyRes: IncomingMessage, request: express.Request, response: express.Response): void | Record<string, unknown> | Promise< | Record<string, unknown>>;
    proxyPathRewrite?: Record<string, string> | ((path: string, req: express.Request) => string) | ((path: string, req: express.Request) => Promise<string>);
}

@Controller()
export class AngularController<T extends IAngularAppOptions = IAngularAppOptions> {
    protected readonly _static =
        this.mode === 'ssr' && this.options.www ? express.static(path.resolve(this.options.www), { index: false }) : null;
    protected readonly _template =
        this.mode === 'ssr' && this.options.www ? fs.readFileSync(path.join(this.options.www, 'index.html'), 'utf-8') : null;
    protected readonly _proxy =
        this.mode === 'proxy' && this.options.target ? createProxyMiddleware({ 
            target: this.options.target, 
            changeOrigin: true, 
            ws: true,
            onProxyRes: this.hooks?.onProxyRes,
            pathRewrite: this.hooks?.proxyPathRewrite
        }) : null;

    protected readonly router = express.Router();

    constructor(
        protected readonly mode: 'ssr' | 'proxy',
        protected readonly options: T,
        protected readonly nonceFactory?: (request: express.Request, response: express.Response) => string,
        protected readonly hooks?: IHooks
    ) {
        this.init();
    }

    protected init() {
        if ((this._static && this._template) || this._proxy) {
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

    protected async _ssr(request: express.Request, response: express.Response, next: express.NextFunction) {
        
        Zone.current
            .fork({
                name: 'angular-ssr',
                properties: { 
                    request, 
                    response,
                    ...((await this.hooks?.zoneProperties?.(request, response)) || {})
                }
            })
            .run(async () => {
                try {
                    if(!this.options.main) {
                        throw new Error('main missing');
                    }
                    await this.hooks?.pre?.(request, response);
                    const bundle = loadBundle(this.options.main);

                    let html = await bundle.renderModule('Module' in bundle ? bundle.Module : await bundle.ModuleFactory(), {
                        document: this._template!,
                        url: `${request.protocol}://${request.get('host')}${request.url}`,
                        extraProviders: [
                            ...(this.options.providers || []),
                            { provide: 'REQUEST', useValue: request },
                            { provide: 'RESPONSE', useValue: response },
                            { provide: (await requireEsm<typeof import('@angular/common')>('@angular/common')).APP_BASE_HREF, useValue: request.baseUrl },
                            {
                                provide: INITIAL_CONFIG,
                                useValue: {
                                    doc: this._template!,
                                    url: `${request.protocol}://${request.get('host')}${request.url}`
                                }
                            }
                        ]
                    });

                    response.header('Content-Type', 'text/html');
                    html = (await this.hooks?.post?.(html, request, response)) || html;
                    if (this.nonceFactory) {
                        response.end(
                            html.replace(/<script(?: type="text\/javascript")?/g, `$& nonce="${this.nonceFactory(request, response)}"`)
                        );
                    } else {
                        response.end(html);
                    }
                } catch (err) {
                    next(err);
                }
            });
    }

    getAngular(req: express.Request, res: express.Response, next: express.NextFunction) {
        if (this.checkSkip(req)) {
            next();
        } else if (this.mode === 'ssr') {
            this._ssr(req, res, next).catch(next);
        } else {
            this._proxy!(req, res, next);
        }
    }

    @Get('*')
    handle(@Request() req: express.Request, @Response() res: express.Response, @Next() next: express.NextFunction) {
        this.router(req, res, next);
    }
}

function loadBundle(src: string): { Module: Type<any>, renderModule: typeof renderModule } | { ModuleFactory: () => Promise<Type<unknown>>, renderModule: typeof renderModule } {
    const bundle = importFresh<any>(path.resolve(src));

    if('ModuleFactory' in bundle) {
        return {
            ModuleFactory: bundle.ModuleFactory,
            renderModule: bundle.renderModule
        }
    }

    const moduleKey = Object.keys(bundle).find(k => k.endsWith('Module'));

    if (!moduleKey) {
        throw new Error(`Cannot find module in "${src}"`);
    }

    return {
        Module: bundle[moduleKey],
        renderModule: bundle.renderModule
    };
}
