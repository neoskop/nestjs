import { SetMetadata } from "@nestjs/common";

export const ASPECT = 'Phantom:ASPECT';

export function Aspect() : ClassDecorator {
    return (target : Function) => {
        SetMetadata(ASPECT, target.name)(target);
    }
}
