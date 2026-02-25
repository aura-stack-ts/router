import type { ZodObject, z } from "zod"
import type { RouterError } from "./error.ts"
import type { HeadersBuilder } from "./headers.ts"

/**
 * Route pattern must start with a slash and can contain parameters prefixed with a colon.
 * @example
 * const getUser:RoutePattern = "/users/:userId"
 * const getPostsComments:RoutePattern = "/posts/:postId/comments/:commentId"
 */
export type RoutePattern = `/${string}` | `/${string}/:${string}`

/**
 * HTTP methods defined in HTTP/1.1 specification.
 * @see https://datatracker.ietf.org/doc/html/rfc7231#section-4.3
 */
export type HTTPMethod = "GET" | "POST" | "DELETE" | "PUT" | "PATCH" | "OPTIONS" | "HEAD" | "TRACE" | "CONNECT"

/**
 * Content types supported by the router.
 */
export type ContentType =
    | "application/json"
    | "application/x-www-form-urlencoded"
    | "text/plain"
    | "multipart/form-data"
    | "application/xml"
    | "application/octet-stream"
    | `text/${string}`
    | `image/${string}`
    | `video/${string}`
    | `audio/${string}`
    | "application/pdf"

export type Prettify<Obj extends object> = {
    [Key in keyof Obj]: Obj[Key]
} & {}

/**
 * Extracts route parameters from a given route pattern through colon-prefixed segments.
 * Returns an object type where keys are parameter names and values are strings.
 * If no parameters are found, returns an empty object type.
 *
 * @example
 * // Expected: { userId: string }
 * type UserParams = Params<"/users/:userId">;
 *
 * // Expected: { postId: string; commentId: string }
 * type PostCommentParams = Params<"/posts/:postId/comments/:commentId">;
 *
 * // Expected: {}
 * type NoParams = Params<"/about">;
 */
export type GetRouteParams<Route extends RoutePattern> = Route extends `/${string}/:${infer Param}/${infer Str}`
    ? Prettify<{ [K in Param]: string } & GetRouteParams<`/${Str}`>>
    : Route extends `/${string}/:${infer Param}`
      ? Prettify<{ [K in Param]: string }>
      : Route extends `/:${infer Param}`
        ? Prettify<{ [K in Param]: string }>
        : {}

/**
 * Available schemas validation for an endpoint. It can include body and searchParams schemas.
 */
export interface EndpointSchemas {
    body?: ZodObject<any>
    searchParams?: ZodObject<any>
    params?: ZodObject<any>
}

/**
 * Global context type that can be extended when creating the router. It allows passing
 * additional data to all route handlers and middlewares. For a type-inference use module
 * augmentation to extend the GlobalContext interface.
 */
export interface GlobalContext {}

/**
 * Configuration for an endpoint, including optional schemas for request validation and middlewares.
 */
export type EndpointConfig<
    RouteParams extends RoutePattern = RoutePattern,
    Schemas extends EndpointSchemas = EndpointSchemas,
> = Prettify<{
    schemas?: Schemas
    use?: MiddlewareFunction<GetRouteParams<RouteParams>, { schemas: Schemas }>[]
}>

/**
 * Infer the type of search parameters from the provided value in the `EndpointConfig`.
 */
export type ContextSearchParams<Schemas extends EndpointConfig["schemas"]> = Schemas extends { searchParams: ZodObject }
    ? { searchParams: z.infer<Schemas["searchParams"]> }
    : { searchParams: URLSearchParams }

/**
 * Infer the type of body from the provided value in the `EndpointConfig`.
 */
export type ContextBody<Schemas extends EndpointConfig["schemas"]> = Schemas extends { body: ZodObject }
    ? { body: z.infer<Schemas["body"]> }
    : { body: undefined }

/**
 * Infer the type of route parameters from the provided value in the `EndpointConfig`.
 */
export type ContextParams<Schemas extends EndpointConfig["schemas"], Default = Record<string, string>> = Schemas extends {
    params: ZodObject
}
    ? { params: z.infer<Schemas["params"]> }
    : { params: Default }

/**
 * Context object passed to route handlers and middlewares defined in the
 * `createEndpoint/createEndpointConfig` function or globally in the `createRouter` function.
 */
export interface RequestContext<RouteParams = Record<string, string>, Config extends EndpointConfig = EndpointConfig> {
    params: ContextParams<Config["schemas"], RouteParams>["params"]
    headers: HeadersBuilder
    body: ContextBody<Config["schemas"]>["body"]
    searchParams: ContextSearchParams<Config["schemas"]>["searchParams"]
    request: Request
    url: URL
    method: HTTPMethod
    route: RoutePattern
    context: GlobalContext
}

export interface GlobalMiddlewareContext {
    request: Request
    context: GlobalContext
}

/**
 * Global middleware function type that represent a function that runs before the route matching.
 */
export type GlobalMiddleware = (
    ctx: GlobalMiddlewareContext
) => Response | GlobalMiddlewareContext | Promise<Response | GlobalMiddlewareContext>

/**
 * Middleware function type that represent a function that runs before the route handler
 * defined in the `createEndpoint/createEndpointConfig` function or globally in the `createRouter` function.
 */
export type MiddlewareFunction<RouteParams = Record<string, string>, Config extends EndpointConfig = EndpointConfig> = (
    ctx: Prettify<RequestContext<RouteParams, Config>>
) => Response | RequestContext<RouteParams, Config> | Promise<Response | RequestContext<RouteParams, Config>>

/**
 * Defines a route handler function that processes an incoming request and returns a response.
 * The handler receives the request object and a context containing route parameters, headers,
 * and optionally validated body and search parameters based on the endpoint configuration.
 */
export type RouteHandler<Route extends RoutePattern, Config extends EndpointConfig> = (
    ctx: Prettify<RequestContext<GetRouteParams<Route>, Config>>
) => Response | Promise<Response>

/**
 * Represents a route endpoint definition, specifying the HTTP method, route pattern,
 * handler function with inferred context types, and associated configuration.
 */
export interface RouteEndpoint<
    Method extends HTTPMethod | HTTPMethod[] = HTTPMethod | HTTPMethod[],
    Route extends RoutePattern = RoutePattern,
    Config extends EndpointConfig = EndpointConfig,
> {
    method: Method
    route: Route
    handler: RouteHandler<Route, Config>
    config: Config
}

/**
 * Infer the HTTP methods defined in the provided array of route endpoints.
 */
export type InferMethod<Endpoints extends RouteEndpoint[]> = Endpoints extends (infer Endpoint)[]
    ? Endpoint extends RouteEndpoint<infer Method, infer _, infer __>
        ? Method extends HTTPMethod[]
            ? Method[number]
            : Method
        : never
    : never

/**
 * Generates an object with HTTP methods available by the router from `createRouter` function.
 * Each method is a function that takes a request and context, returning a promise of a response.
 */
export type GetHttpHandlers<Endpoints extends RouteEndpoint[]> = {
    [Method in InferMethod<Endpoints>]: (req: Request) => Response | Promise<Response>
}

export type GlobalCtx = keyof GlobalContext extends never ? { context?: GlobalContext } : { context: GlobalContext }

/**
 * Configuration options for `createRouter` function.
 */
export interface RouterConfig extends GlobalCtx {
    /**
     * Prefix path for all routes/endpoints defined in the router.
     *
     * @example
     * basePath: "/api/v1"
     *
     * // will match the "/users" endpoint.
     * new Request("https://example.com/api/v1/users")
     *
     * // will NOT match the "/users" endpoint.
     * new Request("https://example.com/users")
     */
    basePath?: RoutePattern
    /**
     * Global middlewares that run before route matching for all endpoints in the router.
     * You can use this to modify the request or return a response early.
     *
     * @example
     * use: [
     *   async (request) => {
     *     if(request.headers.get("Authorization")?.startsWith("Bearer ")) {
     *       return Response.json({ message: "Unauthorized" }, { status: 401 })
     *     }
     *     return request
     *   }
     * ]
     */
    use?: GlobalMiddleware[]
    /**
     * Error handler function that runs when an error is thrown in a router handler or middleware.
     * It can be used to customize the default error response provided by the router. If is an internal
     * error the error is from the `RouterError` class, otherwise the error is a generic
     * `Error` instance which was caused by a handler or middleware, for how to distinguish them you can use
     * the `isRouterError` function from the `assert` module.
     *
     * @param error - The error thrown in the router
     * @param request - The original request that caused the error
     * @returns A response to be sent back to the client
     * @example
     * onError: (error, request) => {
     *   if(isRouterError(error)) {
     *     return Response.json({ message: error.message }, { status: error.statusCode })
     *   }
     *   return Response.json({ message: "Internal Server Error" }, { status: 500 })
     * }
     */
    onError?: (error: Error | RouterError, request: Request) => Response | Promise<Response>
}

/**
 * @experimental
 */
export type ExtractEndpoint<T> = T extends RouteEndpoint<infer M, infer P, infer C> ? { method: M; path: P; config: C } : never

type MethodIncludes<Method, Met extends HTTPMethod> = Method extends readonly HTTPMethod[]
    ? Met extends Method[number]
        ? true
        : false
    : Method extends HTTPMethod
      ? Method extends Met
          ? true
          : false
      : false

/**
 * @experimental
 */
export type RoutesByMethod<Defs extends readonly RouteEndpoint[], Met extends HTTPMethod> =
    ExtractEndpoint<Defs[number]> extends infer E
        ? E extends { method: infer M; path: infer P }
            ? MethodIncludes<M, Met> extends true
                ? P
                : never
            : never
        : never

export type ExtractRoutesByMethod<Defs extends RouteEndpoint[], Met extends HTTPMethod> = Defs extends unknown[]
    ? Defs extends [infer First, ...infer Rest]
        ? First extends RouteEndpoint<infer M, infer R>
            ? MethodIncludes<M, Met> extends true
                ? R | ExtractRoutesByMethod<Rest extends RouteEndpoint[] ? Rest : [], Met>
                : ExtractRoutesByMethod<Rest extends RouteEndpoint[] ? Rest : [], Met>
            : ExtractRoutesByMethod<Rest extends RouteEndpoint[] ? Rest : [], Met>
        : never
    : false

export type InferZod<T> = T extends z.ZodTypeAny ? z.infer<T> : T

export type ToInferZod<T> = {
    [K in keyof T]: InferZod<T[K]>
}

export type RemoveUndefined<T> = {
    [K in keyof T as undefined extends T[K] ? never : K]: T[K]
}

export type Find<Defs extends RouteEndpoint[], Met extends HTTPMethod, Path extends string> = Defs extends unknown[]
    ? Defs extends [infer First, ...infer Rest]
        ? First extends RouteEndpoint<infer M, infer R, infer C>
            ? MethodIncludes<M, Met> extends true
                ? R extends Path
                    ? RemoveUndefined<ToInferZod<NonNullable<C["schemas"]>>>
                    : Find<Rest extends RouteEndpoint[] ? Rest : [], Met, Path>
                : Find<Rest extends RouteEndpoint[] ? Rest : [], Met, Path>
            : Find<Rest extends RouteEndpoint[] ? Rest : [], Met, Path>
        : never
    : never

export type Client<Defs extends RouteEndpoint[]> = {
    [M in InferMethod<Defs> as Lowercase<M>]: <T extends ExtractRoutesByMethod<Defs, M>, Config extends Find<Defs, M, T>>(
        ...args: Config extends EndpointSchemas
            ? [path: T, ctx?: RequestInit]
            : [path: T, ctx: Prettify<Omit<RequestInit, "body"> & Config>]
    ) => Promise<Response>
}

declare const endpointsSymbol: unique symbol

export type Router<Endpoints extends RouteEndpoint[]> = GetHttpHandlers<Endpoints> & {
    readonly [endpointsSymbol]?: Endpoints
}

export type InferEndpoints<T> = T extends Router<infer E> ? E : never

export type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

export interface ClientOptions extends Pick<RequestInit, "cache" | "credentials" | "mode"> {
    /**
     * Base URL for the router client to make requests to the server.
     * This is useful when the server is hosted on a different origin.
     *
     * baseURL: "https://api.example.com"
     */
    baseURL: string
    /**
     * Optional base path to prepend to all request paths made by the client.
     */
    basePath?: RoutePattern
    /**
     * Default headers to include in every request made by the client.
     */
    headers?: RequestHeaders | (() => RequestHeaders | Promise<RequestHeaders>)
    /**
     * Custom fetch function to be used by the client instead of the global fetch.
     */
    fetch?: FetchLike
}

export interface RequestHeaders extends Record<string, number | string | string[] | undefined> {
    accept?: string | undefined
    "accept-encoding"?: string | undefined
    "accept-language"?: string | undefined
    "accept-patch"?: string | undefined
    "accept-ranges"?: string | undefined
    "access-control-allow-credentials"?: string | undefined
    "access-control-allow-headers"?: string | undefined
    "access-control-allow-methods"?: string | undefined
    "access-control-allow-origin"?: string | undefined
    "access-control-expose-headers"?: string | undefined
    "access-control-max-age"?: string | undefined
    "access-control-request-headers"?: string | undefined
    "access-control-request-method"?: string | undefined
    age?: string | undefined
    allow?: string | undefined
    "alt-svc"?: string | undefined
    authorization?: string | undefined
    "cache-control"?: string | undefined
    connection?: string | undefined
    "content-disposition"?: string | undefined
    "content-encoding"?: string | undefined
    "content-language"?: string | undefined
    "content-length"?: string | undefined
    "content-location"?: string | undefined
    "content-range"?: string | undefined
    "content-type"?: string | undefined
    cookie?: string | undefined
    date?: string | undefined
    etag?: string | undefined
    expect?: string | undefined
    expires?: string | undefined
    forwarded?: string | undefined
    from?: string | undefined
    host?: string | undefined
    "if-match"?: string | undefined
    "if-modified-since"?: string | undefined
    "if-none-match"?: string | undefined
    "if-unmodified-since"?: string | undefined
    "last-modified"?: string | undefined
    location?: string | undefined
    origin?: string | undefined
    pragma?: string | undefined
    "proxy-authenticate"?: string | undefined
    "proxy-authorization"?: string | undefined
    "public-key-pins"?: string | undefined
    range?: string | undefined
    referer?: string | undefined
    "retry-after"?: string | undefined
    "sec-fetch-site"?: string | undefined
    "sec-fetch-mode"?: string | undefined
    "sec-fetch-user"?: string | undefined
    "sec-fetch-dest"?: string | undefined
    "sec-websocket-accept"?: string | undefined
    "sec-websocket-extensions"?: string | undefined
    "sec-websocket-key"?: string | undefined
    "sec-websocket-protocol"?: string | undefined
    "sec-websocket-version"?: string | undefined
    "set-cookie"?: string[] | undefined
    "strict-transport-security"?: string | undefined
    tk?: string | undefined
    trailer?: string | undefined
    "transfer-encoding"?: string | undefined
    upgrade?: string | undefined
    "user-agent"?: string | undefined
    vary?: string | undefined
    via?: string | undefined
    warning?: string | undefined
    "www-authenticate"?: string | undefined
}
