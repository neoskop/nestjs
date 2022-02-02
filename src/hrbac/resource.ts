import { Resource } from '@neoskop/hrbac';
import { ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export class ApiResource<R extends Resource = Resource> extends Resource {
    public readonly resource?: R;
    constructor(resource: string | R,
        public readonly context: ExecutionContext,
        public readonly request: Request) {
        super(typeof resource === 'string' ? resource : resource.resourceId);
        if(typeof resource !== 'string') {
            this.resource = resource;
        }
    }
}