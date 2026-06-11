import type { Type } from "arktype"
import type { TObject } from "typebox"
import type { $ZodObject as ZodObject, infer as $Infer } from "zod/v4/core"
import type { ObjectSchema } from "valibot"
import type { RouterError } from "@/error.ts"
import type { HeadersBuilder } from "@/headers.ts"
import type { HTTPMethod } from "@/@types/http.ts"
import type { InferValibotSchema, SupportedSchema } from "@/@types/schemas.ts"

/**
 * Utility type that represents a value that can be either synchronous or a Promise.
 */
export type Awaitable<T> = T | Promise<T>

/**
 * Route pattern must start with a slash and can contain parameters prefixed with a colon.
 * @example
 * const getUser:RoutePattern = "/users/:userId"
 * const getPostsComments:RoutePattern = "/posts/:postId/comments/:commentId"
 */
export type RoutePattern = `/${string}`

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
    body?: SupportedSchema
    searchParams?: SupportedSchema
    params?: SupportedSchema
}

/**
 * Global context type that can be extended when creating the router. It allows passing
 * additional data to all route handlers and middlewares. For a type-inference use module
 * augmentation to extend the GlobalContext interface.
 */
export interface GlobalContext {}

/**
 * Base context available at the earliest hook stage (`onRequest`), before route matching.
 */
export interface RequestHookContext {
    request: Request
    context: GlobalContext
    json: <T>(data: T, init?: ResponseInit) => JsonResponse<T>
}

/**
 * Context available after a route has been matched (`onMatch`, `onParams`, `onSearchParams`, `onBody`).
 * Extends `RequestHookContext` with the resolved route and method.
 */
export interface MatchHookContext<Route extends RoutePattern> extends RequestHookContext {
    route: Route
    method: HTTPMethod
}

/**
 * Fires when a raw request arrives, before global middlewares and route matching.
 * Returning `void` is a pass-through. Returning a `Response` short-circuits the pipeline.
 */
export type OnRequestHook = (ctx: RequestHookContext) => Awaitable<void | RequestHookContext | Response>

/**
 * Fires after a route has been matched, before params/body extraction.
 * Returning `void` is a pass-through. Returning a `Response` short-circuits the pipeline.
 */
export type OnMatchHook<Route extends RoutePattern> = (
    ctx: MatchHookContext<Route>
) => Awaitable<void | MatchHookContext<Route> | Response>

/**
 * Replaces `getRouteParams()`. Receives raw trie-matched params (no schema validation).
 * Returning `void` uses the raw params as-is. Returning a `Response` short-circuits.
 */
export interface ParamsHookContext<Params, Route extends RoutePattern> extends MatchHookContext<Route> {
    params: Params
}

export type OnParamsHook<Params, Route extends RoutePattern> = (
    ctx: ParamsHookContext<Params, Route>
) => Awaitable<void | Params | Response>

/**
 * Replaces `getSearchParams()`. Receives raw `URLSearchParams` (no schema validation).
 * Returning `void` uses the raw URLSearchParams as-is. Returning a `Response` short-circuits.
 */
export interface SearchParamsHookContext<Route extends RoutePattern> extends MatchHookContext<Route> {
    searchParams: URLSearchParams
}
export type OnSearchParamsHook<Route extends RoutePattern> = (
    ctx: SearchParamsHookContext<Route>
) => Awaitable<void | Record<string, unknown> | URLSearchParams | Response>

/**
 * Replaces schema validation in `getBody()`. Receives the content-type-parsed body (no schema validation).
 * Returning `void` uses the raw parsed body as-is. Returning a `Response` short-circuits.
 */
export interface BodyHookContext<Route extends RoutePattern> extends MatchHookContext<Route> {
    body: unknown
}

export type OnBodyHook<Route extends RoutePattern> = (ctx: BodyHookContext<Route>) => Awaitable<void | unknown | Response>

/**
 * Fires just before the route handler is called, after all middlewares.
 * Returning `void` is a pass-through. Returning a `Response` short-circuits.
 */
export type OnHandlerHook<Meta extends EndpointMeta<any, any, any>> = (
    ctx: RequestContext<Meta>
) => Awaitable<void | RequestContext<Meta> | Response>

/**
 * Fires after the handler returns a response. Always receives and must return a `Response`.
 * Also receives the full request context for context-aware response transformations.
 */
export interface ResponseHookContext<Meta extends EndpointMeta<any, any, any>> extends RequestContext<Meta> {
    response: Response
}
export type OnResponseHook<Meta extends EndpointMeta<any, any, any>> = (ctx: ResponseHookContext<Meta>) => Awaitable<Response>

/**
 * Fires when any error is thrown during the request pipeline.
 * The `ctx` union reflects which stage the error occurred at.
 * Must return a `Response`.
 */
export type ErrorHookContext<Route extends RoutePattern> = { error: Error | RouterError } & (
    | RequestHookContext
    | MatchHookContext<Route>
    | RequestContext<EndpointMeta<any, any, any>>
)
export type OnErrorHook<Route extends RoutePattern> = (ctx: ErrorHookContext<Route>) => Awaitable<Response>

/**
 * All lifecycle hooks available on a per-endpoint basis via `EndpointConfig.hooks`.
 */

export interface EndpointHooks<
    Route extends RoutePattern,
    Method extends HTTPMethod | HTTPMethod[],
    Schemas extends EndpointSchemas,
> {
    /**
     * Fires at the earliest stage of the lyfecycle. It receives the raw request
     * and context before route matching.
     */
    onRequest?: OnRequestHook
    /**
     * Executes after a route is matched but before params/body extraction. It receives the
     */
    onMatch?: OnMatchHook<Route>
    /**
     * Replaces `getRouteParams()`. It receives the raw trie-matched params (no schema validation).
     * Returning `void` uses the raw params as-is. Returning a `Response` short-circuits the pipeline.
     */
    onParams?: OnParamsHook<GetRouteParams<Route>, Route>
    /**
     * Replaces `getSearchParams()`. It receives the raw `URLSearchParams` (no schema validation).
     * Returning `void` uses the raw URLSearchParams as-is. Returning a `Response` short-circuits the pipeline.
     */
    onSearchParams?: OnSearchParamsHook<Route>
    /**
     * Replaces schema validation in `getBody()`. It receives the content-type-parsed body (no schema validation).
     * Returning `void` uses the raw parsed body as-is. Returning a `Response` short-circuits the pipeline.
     */
    onBody?: OnBodyHook<Route>
    /**
     * Fires just before the route handler is called, after all middlewares. It receives the full request context
     */
    onHandler?: OnHandlerHook<EndpointMeta<Route, Method, Schemas>>
    onResponse?: OnResponseHook<EndpointMeta<Route, Method, Schemas>>
    onError?: OnErrorHook<Route>
}

/**
 * Global lifecycle hooks available on `RouterConfig.hooks`.
 * Only hooks that make sense across all routes are included.
 */
export interface RouterHooks {
    onRequest?: OnRequestHook
    onResponse?: OnResponseHook<EndpointMeta<any, any, any>>
    onError?: OnErrorHook<any>
}

/**
 * Configuration for an endpoint, including optional schemas for request validation and middlewares.
 */
export type EndpointConfig<
    Route extends RoutePattern,
    Method extends HTTPMethod | HTTPMethod[],
    Schemas extends EndpointSchemas,
> = {
    schemas?: Schemas
    use?: MiddlewareFunction<Route, Method, Schemas>[]
    hooks?: EndpointHooks<Route, Method, Schemas>
}

export type UnwrapSchema<S, Fallback> = [S] extends [ZodObject<any>]
    ? $Infer<S>
    : [S] extends [ObjectSchema<any, undefined>]
      ? InferValibotSchema<S>
      : [S] extends [Type<infer T>]
        ? T
        : [S] extends [TObject]
          ? S
          : Fallback

/**
 * Infer the type of search parameters from the provided value in the `EndpointConfig`.
 */
export type ContextSearchParams<Schemas extends EndpointSchemas> = UnwrapSchema<Schemas["searchParams"], URLSearchParams>

/**
 * Infer the type of body from the provided value in the `EndpointConfig`.
 */
export type ContextBody<Schemas extends EndpointSchemas> = UnwrapSchema<Schemas["body"], undefined>

export type ContextParams<
    Schemas extends EndpointSchemas,
    Default extends Record<string, string> = Record<string, string>,
> = UnwrapSchema<Schemas["params"], Default>

declare const jsonResponseBrand: unique symbol

export type JsonResponse<T> = Omit<Response, "json"> & {
    readonly [jsonResponseBrand]: T
    json(): Promise<T>
}

export type RouteHandlerReturn = Response | JsonResponse<unknown>

export interface EndpointMeta<
    Route extends RoutePattern,
    Method extends HTTPMethod | HTTPMethod[],
    Schemas extends EndpointSchemas,
> {
    route: Route
    method: Method
    body: ContextBody<NonNullable<Schemas>>
    searchParams: ContextSearchParams<NonNullable<Schemas>>
    params: ContextParams<NonNullable<Schemas>, GetRouteParams<Route>>
}

/**
 * Context object passed to route handlers and middlewares defined in the
 * `createEndpoint/createEndpointConfig` function or globally in the `createRouter` function.
 */
export type RequestContext<Meta extends EndpointMeta<any, any, any>> = {
    route: Meta["route"]
    method: Meta["method"]
    body: Meta["body"]
    params: Meta["params"]
    searchParams: Meta["searchParams"]
    headers: HeadersBuilder
    request: Request
    url: URL
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
export type GlobalMiddleware = (ctx: GlobalMiddlewareContext) => Awaitable<Response | GlobalMiddlewareContext>

/**
 * Middleware function type that represent a function that runs before the route handler
 * defined in the `createEndpoint/createEndpointConfig` function or globally in the `createRouter` function.
 */
export type MiddlewareFunction<
    Route extends RoutePattern,
    Method extends HTTPMethod | HTTPMethod[],
    Schemas extends EndpointSchemas,
> = (
    ctx: RequestContext<EndpointMeta<Route, Method, Schemas>>
) => Awaitable<Response | RequestContext<EndpointMeta<Route, Method, Schemas>>>

/**
 * Defines a route handler function that processes an incoming request and returns a response.
 * The handler receives the request object and a context containing route parameters, headers,
 * and optionally validated body and search parameters based on the endpoint configuration.
 */
export type RouteHandler<
    Route extends RoutePattern,
    Method extends HTTPMethod | HTTPMethod[],
    Config extends EndpointConfig<Route, Method, any>,
    Return extends RouteHandlerReturn = RouteHandlerReturn,
> = (ctx: RequestContext<EndpointMeta<Route, Method, NonNullable<Config["schemas"]>>>) => Awaitable<Return>

/**
 * Represents a route endpoint definition, specifying the HTTP method, route pattern,
 * handler function with inferred context types, and associated configuration.
 */
export interface RouteEndpoint<
    Route extends RoutePattern,
    Method extends HTTPMethod | HTTPMethod[],
    Config extends EndpointConfig<Route, Method, any>,
    Handler extends RouteHandler<Route, Method, Config, RouteHandlerReturn> = RouteHandler<
        Route,
        Method,
        Config,
        RouteHandlerReturn
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
export type InferMethod<Endpoints extends readonly RouteEndpoint<any, any, any, any>[]> =
    Endpoints extends readonly (infer Endpoint)[]
        ? Endpoint extends RouteEndpoint<infer _, infer Method, infer __>
            ? Method extends HTTPMethod[]
                ? Method[number]
                : Method
            : never
        : never

/**
 * Generates an object with HTTP methods available by the router from `createRouter` function.
 * Each method is a function that takes a request and context, returning a promise of a response.
 */
export type GetHttpHandlers<Endpoints extends readonly RouteEndpoint<any, any, any, any>[]> = {
    [Method in InferMethod<Endpoints>]: (req: Request) => Awaitable<Response>
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
     * Global lifecycle hooks that apply to all routes in the router.
     * Per-endpoint hooks in `EndpointConfig.hooks` run alongside these (endpoint hooks run first).
     */
    hooks?: RouterHooks
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
     * @deprecated use `onError` hook instead for better error context and handling. This will be removed in a future version.
     * @example
     * onError: (error, request) => {
     *   if(isRouterError(error)) {
     *     return Response.json({ message: error.message }, { status: error.statusCode })
     *   }
     *   return Response.json({ message: "Internal Server Error" }, { status: 500 })
     * }
     */
    onError?: (error: Error | RouterError, request: Request) => Awaitable<Response>
}

export declare const endpointsSymbol: unique symbol

export type Router<Endpoints extends RouteEndpoint<any, any, any, any>[]> = {
    readonly __endpoints: Endpoints
} & GetHttpHandlers<Endpoints>

export type InferEndpoints<T> = T extends Router<infer E> ? E : never
