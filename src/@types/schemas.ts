import type { Type } from "arktype"
import type { TObject } from "typebox"
import type { ObjectSchema } from "valibot"
import type { $ZodType, $ZodObject } from "zod/v4/core"

/**
 * Utility type to infer the output type of a Valibot ObjectSchema. This utility is used instead
 * of `InferOutput` directly to avoid performance issues caused by deeply nested conditional types.
 *
 * Note: relies on Valibot's internal `~types` field. Verify compatibility on every Valibot major/minor bump.
 */
export type InferValibotSchema<S extends ObjectSchema<any, undefined>> = NonNullable<S["~types"]>["output"]

export type SupportedSchema = $ZodObject<any> | ObjectSchema<any, undefined> | Type<{}> | TObject<{}>

/**
 * Infer the schema kind (Zod, Valibot, TypeBox, Arktype) based on the provided schema type.
 */
export type SchemaKind<T> = [T] extends [$ZodType]
    ? "zod"
    : [T] extends [ObjectSchema<any, undefined>]
      ? "valibot"
      : [T] extends [TObject]
        ? "typebox"
        : [T] extends [Type<any>]
          ? "arktype"
          : "unknown"