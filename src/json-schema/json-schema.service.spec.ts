import { ValidationError, JsonSchemaService } from './json-schema.service';
import { JSONSchema7 } from 'json-schema';

describe('ValidationError', () => {
    const errorObj : any = {};
    let error : ValidationError;

    beforeEach(() => {
        try {
            throw new ValidationError([errorObj]);
        } catch(e) {
            error = e;
        }
    });

    describe('constructor', () => {
        it('should be instance of Error', () => {
            expect(error instanceof Error).toBeTruthy();
        });

        it('should be instance of ValidationError', () => {
            expect(error instanceof ValidationError).toBeTruthy();
        });
    });

    describe('stack', () => {
        it('should have stack', () => {
            expect(error.stack).toBeTruthy();
            expect(error.stack!.startsWith('ValidationError: Validation failed')).toBeTruthy();
        });
    });

    describe('errors', () => {
        it('should have errors', () => {
            expect(Array.isArray(error.errors)).toBeTruthy();
            expect(error.errors[0]).toEqual(errorObj);
        })
    })
});

describe('JsonSchemaService', () => {
    let service : JsonSchemaService;
    const schema : JSONSchema7 = {
        type: 'object',
        properties: {
            foo: { type: 'number' },
            bar: { type: 'string' }
        },
        required: [ 'foo', 'bar' ]
    }

    beforeEach(() => {
        service = new JsonSchemaService();
    });

    describe('getValidator', () => {
        it('should return a function', () => {
            expect(service.getValidator(schema) instanceof Function).toBeTruthy();
        });

        it('should return same function for same schema', () => {
            expect(service.getValidator(schema) === service.getValidator(schema)).toBeTruthy();
        });
    });

    describe('validate', () => {
        it('should validate valid value', () => {
            expect(service.validate(schema, { foo: 1, bar: 'bar' }).valid).toBeTruthy();
        });

        it('should NOT validate invalid value', () => {
            const result = service.validate(schema, { foo: '123' });

            expect(result.valid).toBeFalsy();
            expect(Array.isArray(result.errors)).toBeTruthy();
            expect(result.errors!.length).toEqual(1);
        });
    });

    describe('validateOrThrow', () => {
        it('should validate valid value', () => {
            expect(service.validateOrThrow(schema, { foo: 1, bar: 'bar' })).toBeTruthy();
        });

        it('should throw on invalid value', () => {
            expect(() => service.validateOrThrow(schema, { foo: '123' })).toThrowError(ValidationError);
        });
    })
})
