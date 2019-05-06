import { Role } from '@neoskop/hrbac';

export class ApiRole<T> extends Role {
    constructor(roleId: string,
        public readonly user : T) {
        super(roleId);
    }
}