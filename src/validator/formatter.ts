import type { $ZodError as ZodError } from "zod/v4/core"
import type { BaseIssue } from "valibot"
import type { ArkErrors } from "arktype"
import type { TLocalizedValidationError } from "typebox/error"

/**
 * Transforms an error object from Zod into a more readable format,
 * where each key corresponds to the path of the error in the original object,
 * and the value contains the error code and message.
 *
 * @param error - The Zod error object to be formatted.
 * @returns An object mapping error paths to their respective codes and messages.
 */
export const formatZodError = (error: ZodError<Record<string, unknown>>) => {
    if (!error.issues || error.issues.length === 0) {
        return {}
    }
    return error.issues.reduce((previous, issue) => {
        const key = issue.path.join(".")
        return {
            ...previous,
            [key]: {
                code: issue.code,
                message: issue.message,
            },
        }
    }, {})
}

/**
 * Transforms an array of Valibot issues into a more readable format,
 * where each key corresponds to the path of the error in the original object,
 * and the value contains the error code and message.
 *
 * @param issues - An array of Valibot issues to be formatted.
 * @returns An object mapping error paths to their respective codes and messages.
 */
export const formatValibotError = (issues: BaseIssue<unknown>[]) => {
    if (!issues || issues.length === 0) return {}
    return issues.reduce((prev, issue) => {
        const key = issue.path?.map((p) => p.key).join(".") ?? ""
        return { ...prev, [key]: { code: issue.kind, message: issue.message } }
    }, {})
}

/**
 * Transforms an array of ArkType errors into a more readable format,
 * where each key corresponds to the path of the error in the original object,
 * and the value contains the error code and message.
 */
export const formatArkTypeError = (errors: ArkErrors) => {
    if (!errors?.length) {
        return {}
    }

    return [...errors].reduce<Record<string, { code: string; message: string }>>((acc, error) => {
        const key = error.path?.join(".") ?? ""

        acc[key] = {
            code: error.code,
            message: error.message,
        }

        return acc
    }, {})
}

/**
 * Transforms an array of TypeBox validation errors into a more readable format,
 * where each key corresponds to the path of the error in the original object,
 * and the value contains the error code and message.
 */
export const formatTypeBoxError = (errors: TLocalizedValidationError[]) => {
    if (errors.length === 0) {
        return {}
    }

    return errors.reduce<
        Record<
            string,
            {
                code: string
                message: string
            }
        >
    >((previous, error) => {
        const key = error.instancePath.replace(/^\//, "").replace(/\//g, ".")

        return {
            ...previous,
            [key]: {
                code: error.keyword,
                message: error.message,
            },
        }
    }, {})
}
