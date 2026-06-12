import { safeParse } from "valibot"
import { isValibotSchema, isZodSchema, isArkType } from "@/assert.ts"
import { IsObject } from "typebox"
import Value, { Check } from "typebox/value"

export type ValidationResult<T> = { success: true; data: T; error: null } | { success: false; data: null; error: any }

export interface SchemaAdapter<T> {
    validate: (data: unknown) => ValidationResult<T>
}

/**
 * Universal wrapper for Zod, Valibot, ArkType, etc.
 */
export const createValidator = <T>(schema: any): SchemaAdapter<T> => {
    if (!isZodSchema(schema) && !isValibotSchema(schema) && !isArkType(schema) && !IsObject(schema)) {
        throw new Error("Unsupported schema type")
    }
    return {
        validate: (data: unknown): ValidationResult<T> => {
            try {
                if (isZodSchema(schema)) {
                    const parsed = schema.safeParse(data)
                    return parsed.success
                        ? { success: true, data: parsed.data as T, error: null }
                        : { success: false, data: null, error: parsed.error }
                }
                if (isValibotSchema(schema)) {
                    const parsed = safeParse(schema, data)
                    return parsed.success
                        ? { success: true, data: parsed.output, error: null }
                        : { success: false, data: null, error: parsed.issues }
                }
                if (isArkType(schema)) {
                    const parsed = schema(data)
                    const isError = !schema.allows(data)
                    return isError
                        ? { success: false, data: null, error: parsed }
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
                        : { success: false, data: null, error: [...Value.Errors(schema, dataToValidate)] }
                }
                return { success: false, data: null, error: new Error("Unsupported schema type") }
            } catch (e) {
                return { success: false, data: null, error: e }
            }
        },
    }
}
