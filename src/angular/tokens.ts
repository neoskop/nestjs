import { Request, Response } from 'express';

export const ANGULAR_OPTIONS = 'ANGULAR_OPTIONS';

export interface IAngularAppOptions {
    www: string;
    main: string;
    target: string;
    skip?: (req : Request) => boolean;
}

export interface AngularOptions extends IAngularAppOptions {
    mode: 'ssr' | 'proxy';
    apps: [ string|RegExp, IAngularAppOptions ][];
    nonceFactory?(request : Request, response : Response) : string;
}
