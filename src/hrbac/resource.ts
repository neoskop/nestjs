import { Resource } from '@neoskop/hrbac';
import { GraphQLExecutionContext } from '@nestjs/graphql';
import { Request } from 'express';

export class ApiResource extends Resource {
    constructor(resourceId: string,
        public readonly context: GraphQLExecutionContext,
        public readonly request: Request) {
        super(resourceId);
    }
}