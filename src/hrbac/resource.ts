import { Resource } from '@neoskop/hrbac';
import { ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export class ApiResource extends Resource {
    constructor(resourceId: string,
        public readonly context: ExecutionContext,
        public readonly request: Request) {
        super(resourceId);
    }
}