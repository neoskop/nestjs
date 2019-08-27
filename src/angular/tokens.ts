import { Request, Response } from 'express';

export const ANGULAR_OPTIONS = 'ANGULAR_OPTIONS';
export const ANGULAR_LOCALE_OPTIONS = 'ANGULAR_LOCALE_OPTIONS';

export interface IAngularAppOptions {
    www: string;
    main: string;
    target: string;
    skip?: (req : Request) => boolean;
}

export interface AngularBaseOptions {
    mode: 'ssr' | 'proxy';
    nonceFactory?(request : Request, response : Response) : string;
}

export interface AngularOptions extends IAngularAppOptions, AngularBaseOptions {
    apps: [ string|RegExp, IAngularAppOptions ][];
}

export interface AngularLocaleOptions extends AngularBaseOptions {
    apps: [ string|RegExp, IAngularAppOptions ][];
    skip?: (req : Request) => boolean;
    locales: string[];
    defaultLocale: string;
}
