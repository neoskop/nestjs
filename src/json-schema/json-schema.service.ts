import { Injectable } from '@nestjs/common';
import Ajv, { ErrorObject, KeywordDefinition, FormatDefinition, FormatValidator } from 'ajv';
import { JSONSchema4, JSONSchema6, JSONSchema7 } from 'json-schema';

export type ValidationResult = { valid: true, errors?: ErrorObject[] } | { valid: false, errors: ErrorObject[] }
export type Validator = (value : any) => ValidationResult;

@Injectable()
export class JsonSchemaService {
    protected readonly ajv = new Ajv();
    protected readonly validators = new Map<string, Validator>();

    registerKeyword(keyword: string, definition: KeywordDefinition) {
        this.ajv.addKeyword(keyword, definition);
    }
    
    registerFormat(name: string, definition: FormatDefinition) {
        this.ajv.addFormat(name, definition);
    }

    validate(schema : JSONSchema4 | JSONSchema6 | JSONSchema7, value : any) : ValidationResult {
        return this.getValidator(schema)(value);
    }

    validateOrThrow(schema : JSONSchema4 | JSONSchema6 | JSONSchema7, value : any) : true {
        const result = this.getValidator(schema)(value);

        if(!result.valid) {
            throw new ValidationError(result.errors);
        }

        return true;
    }

    getValidator(schema : JSONSchema4 | JSONSchema6 | JSONSchema7) : Validator {
        const strSchema = JSON.stringify(schema);
        if(!this.validators.has(strSchema)) {
            const validator = this.ajv.compile(schema);
            this.validators.set(strSchema, (value : any) => {
                if(validator(value)) {
                    return { valid: true }
                } else {
                    return {
                        valid: false,
                        errors: validator.errors!
                    }
                }
            });
        }

        return this.validators.get(strSchema)!;
    }
}

export class ValidationError extends Error {
    constructor(public readonly errors : ErrorObject[]) {
        super('Validation failed');
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}
