import type { ZodObject, z } from "zod"
import type { RouterError } from "./error.ts"
import type { HeadersBuilder } from "./headers.ts"

/**
 * Route pattern must start with a slash and can contain parameters prefixed with a colon.
 * @example
 * const getUser:RoutePattern = "/users/:userId"
 * const getPostsComments:RoutePattern = "/posts/:postId/comments/:commentId"
 */
export type RoutePattern = `/${string}`

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

type GetParam<Route extends string> = Route extends `:${infer Param}` ? { [K in Param]: string } : {}
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
export type GetRouteParams<Route extends RoutePattern> = Route extends `/${infer Path}/${infer Str}`
    ? Prettify<GetParam<Path> & GetRouteParams<`/${Str}`>>
    : Route extends `/${infer Path}`
      ? GetParam<Path>
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
    Route extends RoutePattern = RoutePattern,
    Schemas extends EndpointSchemas = EndpointSchemas,
> = Prettify<{
    schemas?: Schemas
    use?: MiddlewareFunction<Route, EndpointConfig<Route, Schemas>>[]
}>

/**
 * Infer the type of search parameters from the provided value in the `EndpointConfig`.
 */
export type ContextSearchParams<Schemas extends EndpointConfig<any, any>["schemas"]> = Schemas extends { searchParams: ZodObject }
    ? { searchParams: z.infer<Schemas["searchParams"]> }
    : { searchParams: URLSearchParams }

/**
 * Infer the type of body from the provided value in the `EndpointConfig`.
 */
export type ContextBody<Schemas extends EndpointConfig<any, any>["schemas"]> = Schemas extends { body: ZodObject }
    ? { body: z.infer<Schemas["body"]> }
    : { body: undefined }

type IsAny<T> = 0 extends 1 & T ? true : false

type Equals<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? true : false

export type ContextParams<Schemas, Default extends Record<string, string> = Record<string, string>> = [Schemas] extends [
    EndpointConfig<infer _, infer Schemas>,
]
    ? [IsAny<Schemas>] extends [true]
        ? { params: Default }
        : [Equals<Schemas, EndpointSchemas>] extends [true]
          ? { params: Default }
          : [{ params: ZodObject<any> }] extends [Schemas]
            ? { params: z.infer<Schemas["params"]> }
            : { params: Default }
    : { params: Default }

export type unstable__ContextParams<
    Schemas extends EndpointConfig<any, any>["schemas"],
    Default extends Record<string, string> = Record<string, string>,
> = Schemas extends { params: ZodObject<any> } ? z.infer<Schemas["params"]> : Default

declare const jsonResponseBrand: unique symbol

export type JsonResponse<T> = Omit<Response, "json"> & {
    readonly [jsonResponseBrand]: T
    json(): Promise<T>
}

export type RouteHandlerReturn = Response | JsonResponse<unknown> | Promise<Response> | Promise<JsonResponse<unknown>>

/**
 * Context object passed to route handlers and middlewares defined in the
 * `createEndpoint/createEndpointConfig` function or globally in the `createRouter` function.
 */
export type RequestContext<
    Route extends RoutePattern = RoutePattern,
    Config extends EndpointConfig = EndpointConfig,
    Method extends HTTPMethod | HTTPMethod[] = HTTPMethod | HTTPMethod[],
> = {
    //params: unstable__ContextParams<NonNullable<Config["schemas"]>, GetRouteParams<Route>>
    params: ContextParams<Config["schemas"], GetRouteParams<Route>>["params"]
    headers: HeadersBuilder
    body: ContextBody<NonNullable<Config["schemas"]>>["body"]
    searchParams: ContextSearchParams<NonNullable<Config["schemas"]>>["searchParams"]
    request: Request
    url: URL
    method: Method
    route: Route
    context: GlobalContext
    json: <T>(data: T, init?: ResponseInit) => JsonResponse<T>
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
export type MiddlewareFunction<
    Route extends RoutePattern = RoutePattern,
    Config extends EndpointConfig<Route, {}> = EndpointConfig<Route, {}>,
> = (
    ctx: Prettify<RequestContext<Route, { schemas: Config["schemas"] }>>
) =>
    | Response
    | RequestContext<Route, { schemas: Config["schemas"] }>
    | Promise<Response | RequestContext<Route, { schemas: Config["schemas"] }>>

/**
 * Defines a route handler function that processes an incoming request and returns a response.
 * The handler receives the request object and a context containing route parameters, headers,
 * and optionally validated body and search parameters based on the endpoint configuration.
 */
export type RouteHandler<
    Route extends RoutePattern,
    Config extends EndpointConfig<Route, any>,
    /**
     * No removal of the `ReturnType` utility type here, as it is used to infer the return type of the handler function.
     */
    Return extends RouteHandlerReturn = RouteHandlerReturn,
    Method extends HTTPMethod | HTTPMethod[] = HTTPMethod | HTTPMethod[],
> = (
    ctx: Prettify<RequestContext<Route, { schemas: NonNullable<Config["schemas"]> }, Method>>
) => Response | Promise<Response> | JsonResponse<unknown>

/**
 * Represents a route endpoint definition, specifying the HTTP method, route pattern,
 * handler function with inferred context types, and associated configuration.
 */
export interface RouteEndpoint<
    Method extends HTTPMethod | HTTPMethod[],
    Route extends RoutePattern,
    Config extends EndpointConfig<Route, any>,
    Handler extends RouteHandler<Route, Config, RouteHandlerReturn, Method> = RouteHandler<
        Route,
        Config,
        RouteHandlerReturn,
        Method
    >,
> {
    method: Method
    route: Route
    handler: Handler
    config: Config
}

/**
 * Infer the HTTP methods defined in the provided array of route endpoints.
 */
export type InferMethod<Endpoints extends readonly RouteEndpoint<any, any, any>[]> = Endpoints extends (infer Endpoint)[]
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
export type GetHttpHandlers<Endpoints extends readonly RouteEndpoint<any, any, any>[]> = {
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

export type InferZod<T> = T extends z.ZodTypeAny ? z.infer<T> : T

export type ToInferZod<T> = {
    [K in keyof T]: InferZod<T[K]>
}

export type RemoveUndefined<T> = {
    [K in keyof T as undefined extends T[K] ? never : K]: T[K]
}

type HasSchemas<C> =
    C extends EndpointConfig<any, infer Schemas> ? (Schemas[keyof Schemas] extends ZodObject<any> ? true : false) : false

export type Client<Endpoints extends readonly RouteEndpoint<any, any, any, any>[]> = Endpoints extends unknown[]
    ? Endpoints extends [infer First, ...infer Rest]
        ? First extends RouteEndpoint<infer Method, infer Route, infer Config, infer Handler>
            ? Prettify<
                  {
                      [K in Lowercase<Method & string>]: HasSchemas<Config> extends false
                          ? (path: Route, ctx?: RequestInit) => ReturnType<Handler> | Promise<ReturnType<Handler>>
                          : (
                                path: Route,
                                ctx: Omit<RequestInit, "body"> & RemoveUndefined<ToInferZod<NonNullable<Config["schemas"]>>>
                            ) => ReturnType<Handler> | Promise<ReturnType<Handler>>
                  } & Client<Rest extends readonly RouteEndpoint<any, any, any, any>[] ? Rest : []>
              >
            : {}
        : {}
    : {}

export declare const endpointsSymbol: unique symbol

export type Router<Endpoints extends RouteEndpoint<any, any, any, any>[]> = {
    readonly __endpoints: Endpoints
} & GetHttpHandlers<Endpoints>

export type InferEndpoints<T> = T extends Router<infer E> ? E : never

/** @experimental */
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
     * @experimental
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
