import { KeywordDefinition, FormatDefinition } from 'ajv';

import { createExplorableDecorator } from '../explorer';

export const JsonSchemaKeyword = createExplorableDecorator<KeywordDefinition, { name: string }>('json-schema:keyword');
export const JsonSchemaFormat = createExplorableDecorator<FormatDefinition, { name: string }>('json-schema:format');