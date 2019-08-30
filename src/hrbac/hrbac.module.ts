import { Module, DynamicModule, Provider } from "@nestjs/common";
import { HRBAC, PermissionTransfer, StaticRoleManager, StaticPermissionManager, RoleManager, PermissionManager } from '@neoskop/hrbac'
import { IRoles } from '@neoskop/hrbac/ng'
import { ModuleMetadata, Type } from "@nestjs/common/interfaces";
import { Request } from 'express';


export interface HRBACModuleOptions {
    resolveUserIdForRequest(request : Request) : string|null;
    resolveUserRolesForRequest(request : Request) : string[];
    resolveUserForRequest(request : Request) : any;
    defaultRole: string;
    roles: IRoles;
    permissions: PermissionTransfer;
}

export interface HRBACAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
    useExisting?: Type<HRBACOptionsFactory>;
    useClass?: Type<HRBACOptionsFactory>;
    useFactory?: (...args : any[]) => Promise<HRBACModuleOptions> | HRBACModuleOptions,
    inject?: any[];
}


export interface HRBACOptionsFactory {
    createHRBACOptions() : Promise<HRBACModuleOptions> | HRBACModuleOptions;
}

function isInjectionToken(token : any) : token is string | symbol {
    return typeof token === 'string' || typeof token === 'symbol';
}

function roleManagerFactory (roleManager : StaticRoleManager, options : HRBACModuleOptions) {
    roleManager.import(options.roles);

    return roleManager;
}

function permissionManagerFactory (permissionManager : StaticPermissionManager, options : HRBACModuleOptions) {
    permissionManager.import(options.permissions);

    return permissionManager;
}

export const HRBAC_OPTIONS = 'HRBAC:options';

@Module({
    providers: [
        { provide: HRBAC, useFactory(roleManager : RoleManager, permissionManager : PermissionManager) {
            return new HRBAC(roleManager, permissionManager);
        }, inject: [ RoleManager, PermissionManager ]}
    ],
    exports: [
        HRBAC
    ]
})
export class HrbacModule {
    static forRoot(options : HRBACModuleOptions) : DynamicModule {
        return {
            module: HrbacModule,
            providers: [
                StaticRoleManager,
                StaticPermissionManager,
                { provide: HRBAC_OPTIONS, useValue: options },
                { provide: RoleManager, useFactory: roleManagerFactory, inject: [ StaticRoleManager, HRBAC_OPTIONS ] },
                { provide: PermissionManager, useFactory: permissionManagerFactory, inject: [ StaticPermissionManager, HRBAC_OPTIONS ] }
            ], exports: [
                RoleManager,
                PermissionManager,
                HRBAC_OPTIONS
            ]
        }
    }

    static forRootAsync(options: HRBACAsyncOptions) : DynamicModule {
        return {
            module: HrbacModule,
            imports: options.imports,
            providers: [
                StaticRoleManager,
                StaticPermissionManager,
                { provide: RoleManager, useFactory: roleManagerFactory, inject: [ StaticRoleManager, HRBAC_OPTIONS ] },
                { provide: PermissionManager, useFactory: permissionManagerFactory, inject: [ StaticPermissionManager, HRBAC_OPTIONS ] },
                ...this.createAsyncProviders(options)
            ], exports: [
                RoleManager,
                PermissionManager,
                HRBAC_OPTIONS
            ]
        }
    }

    protected static createAsyncProviders(options : HRBACAsyncOptions) : Provider[] {
        if(options.useExisting || options.useFactory) {
            return [ this.createAsyncOptionsProvider(options) ];
        }

        return [
            this.createAsyncOptionsProvider(options),
            {
                provide: options.useClass!,
                useClass: options.useClass!
            }
        ]
    }

    protected static createAsyncOptionsProvider(options : HRBACAsyncOptions) : Provider {
        if(options.useFactory) {
            return {
                provide: HRBAC_OPTIONS,
                useFactory: options.useFactory,
                inject: options.inject
            }
        }

        return {
            provide: HRBAC_OPTIONS,
            useFactory: async (optionsFactory : HRBACOptionsFactory) => await optionsFactory.createHRBACOptions(),
            inject: [ options.useExisting || options.useClass! ]
        }
    }
}
