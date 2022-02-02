import { HRBAC, StaticPermissionManager, StaticResourceManager, StaticRoleManager } from '@neoskop/hrbac';
import {
    CanActivate,
    ExecutionContext,
    Inject,
    Injectable,
    SetMetadata,
    UnauthorizedException,
    UseGuards
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Request } from 'express';
import { HRBACModuleOptions, HRBAC_OPTIONS } from './hrbac.module';
import { ApiResource } from './resource';
import { ApiRole } from './role';





export function ACL(resource: string, privilege?: string | null): MethodDecorator {
    return (target: Object, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<any>) => {
        SetMetadata('ACL:resource', resource)(target, propertyKey, descriptor);
        SetMetadata('ACL:privilege', privilege === undefined ? propertyKey : privilege)(target, propertyKey, descriptor);
        UseGuards(AclGuard)(target, propertyKey as string, descriptor);
    }
}


@Injectable()
export class AclGuard implements CanActivate {

    constructor(protected readonly hrbac: HRBAC<StaticRoleManager, StaticResourceManager, StaticPermissionManager>,
        @Inject(HRBAC_OPTIONS) protected readonly hrbacModuleOptions: HRBACModuleOptions,
        protected readonly reflector: Reflector) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = this.getRequest(context);
        const role = this.hrbacModuleOptions.resolveUserIdForRequest(request) || this.hrbacModuleOptions.defaultRole;
        if (role !== this.hrbacModuleOptions.defaultRole) {
            this.hrbac.getRoleManager().setParents(role, this.hrbacModuleOptions.resolveUserRolesForRequest(request));
        }

        const resource = this.reflector.get<string | undefined>('ACL:resource', context.getHandler());
        const privilege = this.reflector.get<string | undefined>('ACL:privilege', context.getHandler());


        if (resource && !await this.hrbac.isAllowed(new ApiRole(role, this.hrbacModuleOptions.resolveUserForRequest(request)), new ApiResource(resource, context, request), privilege)) {
            if (role === 'guest') {
                throw new UnauthorizedException();
            }
            return false;
        }

        return true
    }

    protected getRequest(context: ExecutionContext): Request {
        const res = context.switchToHttp().getRequest();

        if (res && res.header) {
            return res;
        }

        return GqlExecutionContext.create(context).getContext().req;
    }
}

