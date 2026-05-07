import { safeParse } from "valibot"
import { isValibotSchema, isZodSchema } from "@/assert.ts"

export type ValidationResult<T> = { success: true; data: T; error: null } | { success: false; data: null; error: any }

export interface SchemaAdapter<T> {
    validate: (data: unknown) => ValidationResult<T>
}

/**
 * Universal wrapper for Zod, Valibot, ArkType, etc.
 */
export const createValidator = <T>(schema: any): SchemaAdapter<T> => {
    if (!isZodSchema(schema) && !isValibotSchema(schema)) {
        throw new Error("Unsupported schema type")
    }
    return {
        validate: (data: unknown): ValidationResult<T> => {
            try {
                if (isZodSchema(schema)) {
                    const result = schema.safeParse(data)
                    return result.success
                        ? { success: true, data: result.data as T, error: null }
                        : { success: false, data: null, error: result.error }
                }
                if (isValibotSchema(schema)) {
                    const result = safeParse(schema, data)
                    return result.success
                        ? { success: true, data: result.output, error: null }
                        : { success: false, data: null, error: result.issues }
                }
                return { success: false, data: null, error: new Error("Unsupported schema type") }
            } catch (e) {
                return { success: false, data: null, error: e }
            }
        },
    }
}
