import { IsObject } from "typebox"
import { safeParse } from "valibot"
import { Value } from "typebox/value"
import { AuraRouterError } from "@/error.ts"
import { isValibotSchema, isZodSchema, isArkType } from "@/assert.ts"
import type { SchemaAdapter, ValidationResult } from "@/@types/types.ts"
import { formatArkTypeError, formatTypeBoxError, formatValibotError, formatZodError } from "./formatter.ts"
import type { ArkErrors } from "arktype"

export type { SchemaAdapter, ValidationResult }

/**
 * Universal wrapper for Zod, Valibot, ArkType, etc.
 */
export const createValidator = <T>(schema: any): SchemaAdapter<T> => {
    if (!isZodSchema(schema) && !isValibotSchema(schema) && !isArkType(schema) && !IsObject(schema)) {
        throw new AuraRouterError({ code: "UNSUPPORTED_SCHEMA_VALIDATOR" })
    }
    return {
        validate: (data: unknown): ValidationResult<T> => {
            try {
                if (isZodSchema(schema)) {
                    const parsed = schema.safeParse(data)
                    return parsed.success
                        ? { success: true, data: parsed.data as T, error: null }
                        : { success: false, data: null, error: formatZodError(parsed.error) }
                }
                if (isValibotSchema(schema)) {
                    const parsed = safeParse(schema, data)
                    return parsed.success
                        ? { success: true, data: parsed.output, error: null }
                        : { success: false, data: null, error: formatValibotError(parsed.issues) }
                }
                if (isArkType(schema)) {
                    const parsed = schema(data)
                    const isError = !schema.allows(data)
                    return isError
                        ? { success: false, data: null, error: formatArkTypeError(parsed as ArkErrors) }
                        : { success: true, data: parsed as T, error: null }
                }
                if (IsObject(schema)) {
                    let dataToValidate = data
                    if ((schema as any).strip) {
                        dataToValidate = Value.Clean(schema, Value.Clone(data))
                    }
                    const isValid = Value.Check(schema, dataToValidate)
                    return isValid
                        ? { success: true, data: dataToValidate as T, error: null }
                        : { success: false, data: null, error: formatTypeBoxError([...Value.Errors(schema, dataToValidate)]) }
                }
                throw new AuraRouterError({ code: "UNSUPPORTED_SCHEMA_VALIDATOR" })
            } catch (e) {
                return { success: false, data: null, error: e }
            }
        },
    }
}
