import {
    HRBAC,
    PermissionManager,
    PermissionTransfer,
    RoleManager,
    StaticPermissionManager,
    StaticRoleManager,
} from '@neoskop/hrbac';
import { IRoles } from '@neoskop/hrbac/ng';
import { DynamicModule, Module } from '@nestjs/common';
import { Request } from 'express';

import { AsyncOptions, createAsyncProviders } from '../utils/providers';


export interface HRBACModuleOptions {
    resolveUserIdForRequest(request: Request): string | null;
    resolveUserRolesForRequest(request: Request): string[];
    resolveUserForRequest(request: Request): any;
    defaultRole: string;
    roles: IRoles;
    permissions: PermissionTransfer;
}

function isInjectionToken(token: any): token is string | symbol {
    return typeof token === 'string' || typeof token === 'symbol';
}

function roleManagerFactory(roleManager: StaticRoleManager, options: HRBACModuleOptions) {
    roleManager.import(options.roles);

    return roleManager;
}

function permissionManagerFactory(permissionManager: StaticPermissionManager, options: HRBACModuleOptions) {
    permissionManager.import(options.permissions);

    return permissionManager;
}

export const HRBAC_OPTIONS = 'HRBAC:options';

@Module({
    providers: [
        StaticRoleManager,
        StaticPermissionManager,
        { provide: RoleManager, useFactory: roleManagerFactory, inject: [StaticRoleManager, HRBAC_OPTIONS] },
        { provide: PermissionManager, useFactory: permissionManagerFactory, inject: [StaticPermissionManager, HRBAC_OPTIONS] },

        StaticRoleManager,
        StaticPermissionManager,
        { provide: RoleManager, useFactory: roleManagerFactory, inject: [StaticRoleManager, HRBAC_OPTIONS] },
        { provide: PermissionManager, useFactory: permissionManagerFactory, inject: [StaticPermissionManager, HRBAC_OPTIONS] },
        {
            provide: HRBAC, useFactory(roleManager: RoleManager, permissionManager: PermissionManager) {
                return new HRBAC(roleManager, permissionManager);
            }, inject: [RoleManager, PermissionManager]
        }
    ],
    exports: [
        HRBAC,
        RoleManager,
        PermissionManager
    ]
})
export class HrbacModule {
    static forRoot(options: HRBACModuleOptions): DynamicModule {
        return {
            module: HrbacModule,
            providers: [
                { provide: HRBAC_OPTIONS, useValue: options }
            ], exports: [
                HRBAC_OPTIONS
            ]
        }
    }

    static forRootAsync(options: AsyncOptions<HRBACModuleOptions>): DynamicModule {
        return {
            module: HrbacModule,
            imports: options.imports,
            providers: [
                ...createAsyncProviders(options, HRBAC_OPTIONS)
            ], exports: [
                HRBAC_OPTIONS
            ]
        }
    }
}
