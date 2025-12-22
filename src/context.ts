import { type ZodError } from "zod"
import { isSupportedBodyMethod } from "./assert.js"
import { InvalidZodSchemaError, RouterError } from "./error.js"
import type { EndpointConfig, ContextSearchParams, ContentType } from "./types.js"
import { SerializeOptions } from "cookie"

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
        const parsed = config.schemas.params.safeParse(params)
        if (!parsed.success) {
            throw new InvalidZodSchemaError("UNPROCESSABLE_ENTITY", formatZodError(parsed.error))
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
): ContextSearchParams<Config["schemas"]>["searchParams"] => {
    const route = new URL(url)
    if (config.schemas?.searchParams) {
        const parsed = config.schemas.searchParams.safeParse(Object.fromEntries(route.searchParams.entries()))
        if (!parsed.success) {
            throw new InvalidZodSchemaError("UNPROCESSABLE_ENTITY", formatZodError(parsed.error))
        }
        return parsed.data
    }
    return new URLSearchParams(route.searchParams.toString())
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
            const parsed = config.schemas.body.safeParse(json)
            if (!parsed.success) {
                throw new InvalidZodSchemaError("UNPROCESSABLE_ENTITY", formatZodError(parsed.error))
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
