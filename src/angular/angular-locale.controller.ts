import 'zone.js';
import 'zone.js/dist/zone-node';

import { Controller, Get, Inject, Next, Request, Response } from '@nestjs/common';
import express from 'express';

import { AngularController } from './angular.controller';
import { ANGULAR_LOCALE_OPTIONS, AngularLocaleOptions } from './tokens';


@Controller('/')
export class AngularLocaleController {

    protected readonly router = express.Router();

    constructor(@Inject(ANGULAR_LOCALE_OPTIONS) protected readonly options : AngularLocaleOptions) {
        this.init();
    }

    protected init() {
        for(const [ path, options ] of this.options.apps) {
            const controller = new AngularController(this.options.mode, options, this.options.nonceFactory);

            this.router.use(path, controller.handle.bind(controller));
        }

        this.router.get('*', (req: express.Request, res: express.Response, next: express.NextFunction) => {
            const requestedLocale = req.path.replace(/^\/([a-z]{2,3}).*/, '$1').toLowerCase();
            if(this.options.locales.includes(requestedLocale)) {
                return next();
            }
            for(const locale in parseAcceptLanguageHeader(req.get('accept-language') || '')) {
                if(this.options.locales.includes(locale)) {
                    return res.redirect(`/${locale}`);
                }
            }
            res.redirect(`/${this.options.defaultLocale}`);
        })
    }

    @Get('*')
    handle(@Request() req: express.Request, @Response() res: express.Response, @Next() next: express.NextFunction) {
        if(this.options.skip && this.options.skip(req)) {
            return next();
        }
        this.router(req, res, next);
    }
}

function parseAcceptLanguageHeader(value: string) : string[] {
    const result : { locale: string, quality: number }[] = [];

    for(const part of value.trim().split(/\s*,\s*/)) {
        const [ _ = null, locale = null, quality = null ] = /([^;]+)(?:;q=((?:\d+\.)\d+))?/.exec(part) || [];
        if(!_ || locale === '*') continue;
        result.push({
            locale: locale!.split(/[-_]/).shift()!.toLowerCase(),
            quality: quality ? +quality : 1
        })
    }

    return result
        .sort((a, b) => b.quality - a.quality)
        .map(({ locale }) => locale)
        .filter((c, i, a) => a.indexOf(c) === i);
}

