import { Module, OnModuleInit } from '@nestjs/common';

import { ExplorerModule, ExplorerService } from '../explorer';
import { JsonSchemaFormat, JsonSchemaKeyword } from './decorator';
import { JsonSchemaService } from './json-schema.service';

@Module({
    imports: [ExplorerModule],
    providers: [JsonSchemaService],
    exports: [JsonSchemaService]
})
export class JsonSchemaModule implements OnModuleInit {
    constructor(protected readonly explorerService: ExplorerService,
        protected readonly jsonSchemaService: JsonSchemaService) { }

    onModuleInit() {
        for (const [definition, { name }] of this.explorerService.exploreWithMetadata(JsonSchemaKeyword)) {
            this.jsonSchemaService.registerKeyword(name, definition);
        }

        for (const [definition, { name }] of this.explorerService.exploreWithMetadata(JsonSchemaFormat)) {
            this.jsonSchemaService.registerFormat(name, definition);
        }
    }
}
