import { Injectable } from '@nestjs/common';
import Ajv, { ErrorObject } from 'ajv';
import { JSONSchema4, JSONSchema6, JSONSchema7 } from 'json-schema';

export type ValidationResult = { valid: true, errors?: ErrorObject[] } | { valid: false, errors: ErrorObject[] }
export type Validator = (value : any) => ValidationResult;

@Injectable()
export class JsonSchemaService {
    protected readonly ajv = new Ajv();
    protected readonly validators = new Map<JSONSchema4 | JSONSchema6 | JSONSchema7, Validator>();

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
        if(!this.validators.has(schema)) {
            const validator = this.ajv.compile(schema);
            this.validators.set(schema, (value : any) => {
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

        return this.validators.get(schema)!;
    }
}

export class ValidationError extends Error {
    constructor(public readonly errors : ErrorObject[]) {
        super('Validation failed');
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}
