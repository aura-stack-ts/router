import { isSupportedBodyMethod } from "@/assert.ts"
import { InvalidZodSchemaError, RouterError } from "@/error.ts"
import { createValidator } from "@/validator/registry.ts"
import type { ZodError } from "zod"
import type { BaseIssue } from "valibot"
import type { EndpointConfig, ContextSearchParams, ContentType, JsonResponse } from "@/types.ts"

/**
 * @experimental
 * @param error ZodError instance
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

export const formatValibotError = (issues: BaseIssue<unknown>[]) => {
    if (!issues || issues.length === 0) return {}
    return issues.reduce((prev, issue) => {
        const key = issue.path?.map((p) => p.key).join(".") ?? ""
        return { ...prev, [key]: { kind: issue.kind, message: issue.message } }
    }, {})
}

/**
 * Extracts route parameters from a given path using the specified route pattern.
 *
 * This function matches the provided path against the route pattern
 * (e.g., "/users/:userId/posts/:postId") and returns an object mapping parameter
 * names to their decoded values.
 *
 * @param params - The extracted route parameters as key-value pairs.
 * @param config - The endpoint configuration which may include schemas for validation.
 * @returns An object containing the extracted and validated route parameters.
 *
 * @example
 * const route = "/users/:userId/posts/:postId";
 * const path = "/users/123/posts/456";
 *
 * // Expected: { userId: "123", postId: "456" }
 * const params = getRouteParams(route, path);
 */
export const getRouteParams = (params: Record<string, string>, config: EndpointConfig) => {
    if (config.schemas?.params) {
        const validator = createValidator(config.schemas.params)
        const parsed = validator.validate(params)
        if (!parsed.success) {
            throw new InvalidZodSchemaError(
                "UNPROCESSABLE_ENTITY",
                Array.isArray(parsed.error) ? formatValibotError(parsed.error) : formatZodError(parsed.error)
            )
        }
        return parsed.data
    }
    return params
}

/**
 * Extracts and validates search parameters from a given URL from the request.
 *
 * If a schema is provided in the endpoint configuration, the search parameters
 * are validated against it using Zod and returned the parsed data. If validation
 * fails, an error is thrown. Otherwise, a URLSearchParams object is returned.
 *
 * @param url - The actual request URL to extract search parameters from.
 * @param config - Configuration object that may include a schema for validation.
 * @returns Either a URLSearchParams object or a parsed object based on the provided schema.
 * @example
 * // With schema
 * const url = "https://example.com/api?search=test&page=2";
 * const config: EndpointConfig = {
 *   schemas: {
 *     searchParams: z.object({
 *       search: z.string(),
 *       page: z.number().optional(),
 *     }),
 *   },
 * }
 *
 * // Expected: { search: "test", page: 2 }
 * const searchParams = getSearchParams(url, config);
 *
 * // Without schema
 * const url2 = "https://example.com/api?query=example";
 *
 * // Expected: URLSearchParams { 'query' => 'example' }
 * const searchParams2 = getSearchParams(url2, {} as EndpointConfig);
 */
export const getSearchParams = <Config extends EndpointConfig>(
    url: string,
    config: Config
): ContextSearchParams<NonNullable<Config["schemas"]>> => {
    const route = new URL(url)
    if (config.schemas?.searchParams) {
        const validator = createValidator(config.schemas.searchParams)
        const parsed = validator.validate(Object.fromEntries(route.searchParams.entries()))
        if (!parsed.success) {
            throw new InvalidZodSchemaError(
                "UNPROCESSABLE_ENTITY",
                Array.isArray(parsed.error) ? formatValibotError(parsed.error) : formatZodError(parsed.error)
            )
        }
        return parsed.data as ContextSearchParams<NonNullable<Config["schemas"]>>
    }
    return new URLSearchParams(route.searchParams.toString()) as ContextSearchParams<NonNullable<Config["schemas"]>>
}

/**
 * Extracts and parses the body of a Request object based on its Content-Type header.
 *
 * If a schema is provided in the endpoint configuration, the body is validated against
 * it using Zod and returned the parsed data. If validation fails, an error is thrown.
 *
 * In some cases, the browser includes text/plain;charset=UTF-8 as the default Content-Type
 *
 * @param request - The Request object from which to extract the body.
 * @param config - Configuration object that may include a schema for validation.
 * @returns The parsed body of the request or an error if validation fails.
 */
export const getBody = async <Config extends EndpointConfig>(request: Request, config: Config) => {
    if (!isSupportedBodyMethod(request.method)) {
        return null
    }
    const clone = request.clone()
    const contentType = clone.headers.get("Content-Type") ?? ("" as ContentType)
    if (contentType.includes("application/json") || config.schemas?.body) {
        const json = await clone.json()
        if (config.schemas?.body) {
            const validator = createValidator(config.schemas.body)
            const parsed = validator.validate(json)
            if (!parsed.success) {
                throw new InvalidZodSchemaError(
                    "UNPROCESSABLE_ENTITY",
                    Array.isArray(parsed.error) ? formatValibotError(parsed.error) : formatZodError(parsed.error)
                )
            }
            return parsed.data
        }
        return json
    }
    try {
        if (createContentTypeRegex(["application/x-www-form-urlencoded", "multipart/form-data"], contentType)) {
            return await clone.formData()
        }
        if (createContentTypeRegex(["text/", "application/xml"], contentType)) {
            return await clone.text()
        }
        if (createContentTypeRegex(["application/octet-stream"], contentType)) {
            return await clone.arrayBuffer()
        }
        if (createContentTypeRegex(["image/", "video/", "audio/", "application/pdf"], contentType)) {
            return await clone.blob()
        }
        return null
    } catch {
        throw new RouterError("UNPROCESSABLE_ENTITY", "Invalid request body, the content-type does not match the body format")
    }
}

const createContentTypeRegex = (contentTypes: ContentType[], contenType: string): boolean => {
    const regex = new RegExp(`${contentTypes.join("|")}`)
    return regex.test(contenType)
}

export const json = <T>(data: T, init?: ResponseInit): JsonResponse<T> => {
    return Response.json(data, init) as JsonResponse<T>
}
