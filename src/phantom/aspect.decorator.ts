import { SetMetadata } from "@nestjs/common";
import { createExplorableDecorator } from '../explorer';

export const ASPECT = 'Phantom:ASPECT';

// export function Aspect() : ClassDecorator {
//     return (target : Function) => {
//         SetMetadata(ASPECT, target.name)(target);
//     }
// }

export const Aspect = createExplorableDecorator(ASPECT);
