import { describe, expectTypeOf } from "vitest"
import type {
    RoutePattern,
    GetRouteParams,
    MiddlewareFunction,
    RequestContext,
    EndpointConfig,
    ContextSearchParams,
    ContextBody,
    RouteHandler,
    RouteEndpoint,
    InferMethod,
    EndpointSchemas,
    HTTPMethod,
    Prettify,
    GlobalContext,
} from "../src/types.js"
import type { ZodObject, ZodString } from "zod"

describe("RoutePattern", () => {
    expectTypeOf<"/users/:userId/books/:bookId">().toExtend<RoutePattern>()
    expectTypeOf<"/users/:userId/:bookId">().toExtend<RoutePattern>()
    // @ts-expect-error
    expectTypeOf<"-users/:userId/books/:bookId">().toExtend<RoutePattern>()
    // @ts-expect-error
    expectTypeOf<"users/:userId/books/:bookId">().toExtend<RoutePattern>()
})

describe("GetRouteParams", () => {
    expectTypeOf<GetRouteParams<"/users/:userId/books/:bookId">>().toEqualTypeOf<{
        userId: string
        bookId: string
    }>()
    expectTypeOf<GetRouteParams<"/users/:userId/:bookId">>().toEqualTypeOf<{
        userId: string
        bookId: string
    }>()
})

describe("MiddlewareFunction", () => {
    type ReturnCtx<R = Record<string, string>, C extends EndpointConfig = EndpointConfig> =
        | Response
        | RequestContext<R, C>
        | Promise<Response | RequestContext<R, C>>

    expectTypeOf<MiddlewareFunction>().toEqualTypeOf<
        (ctx: RequestContext) => Response | RequestContext | Promise<Response | RequestContext>
    >()

    expectTypeOf<MiddlewareFunction<{ oauth: string }>>().toEqualTypeOf<
        (ctx: RequestContext<{ oauth: string }>) => ReturnCtx<{ oauth: string }>
    >()

    expectTypeOf<MiddlewareFunction<{ oauth: string; provider: string }>>().toEqualTypeOf<
        (ctx: RequestContext<{ oauth: string; provider: string }>) => ReturnCtx<{ oauth: string; provider: string }>
    >()

    type Body = ZodObject<{ username: ZodString; password: ZodString }>
    type SearchParams = ZodObject<{ code: ZodString; state: ZodString }>
    expectTypeOf<
        MiddlewareFunction<
            {},
            {
                schemas: {
                    body: Body
                }
            }
        >
    >().toEqualTypeOf<
        (
            ctx: RequestContext<
                {},
                {
                    schemas: {
                        body: Body
                    }
                }
            >
        ) => ReturnCtx<
            {},
            {
                schemas: {
                    body: Body
                }
            }
        >
    >()

    expectTypeOf<
        MiddlewareFunction<
            {},
            {
                schemas: {
                    searchParams: SearchParams
                }
            }
        >
    >().toEqualTypeOf<
        (
            ctx: RequestContext<
                {},
                {
                    schemas: {
                        searchParams: SearchParams
                    }
                }
            >
        ) => ReturnCtx<
            {},
            {
                schemas: {
                    searchParams: SearchParams
                }
            }
        >
    >()

    expectTypeOf<
        MiddlewareFunction<
            {},
            {
                schemas: {
                    body: Body
                    searchParams: SearchParams
                }
            }
        >
    >().toEqualTypeOf<
        (
            ctx: RequestContext<
                {},
                {
                    schemas: {
                        body: Body
                        searchParams: SearchParams
                    }
                }
            >
        ) => ReturnCtx<
            {},
            {
                schemas: {
                    body: Body
                    searchParams: SearchParams
                }
            }
        >
    >()

    expectTypeOf<
        MiddlewareFunction<
            {},
            {
                middlewares: []
            }
        >
    >().toEqualTypeOf<(ctx: RequestContext<{}, { middlewares: [] }>) => ReturnCtx<{}, { middlewares: [] }>>()

    expectTypeOf<
        MiddlewareFunction<
            {},
            {
                middlewares: [(ctx: RequestContext) => Promise<RequestContext<{}, { middlewares: [] }>>]
            }
        >
    >().toEqualTypeOf<(ctx: RequestContext<{}, { middlewares: [] }>) => ReturnCtx<{}, { middlewares: [] }>>()

    expectTypeOf<MiddlewareFunction<GetRouteParams<"/auth/:oauth">>>().toEqualTypeOf<
        (ctx: RequestContext<{ oauth: string }, { middlewares: [] }>) => ReturnCtx<{ oauth: string }, { middlewares: [] }>
    >()

    expectTypeOf<
        MiddlewareFunction<
            GetRouteParams<"/auth/:oauth">,
            {
                schemas: { searchParams: ZodObject<{ state: ZodString }> }
                middlewares: []
            }
        >
    >().toEqualTypeOf<
        (
            ctx: RequestContext<GetRouteParams<"/auth/:oauth">, { schemas: { searchParams: ZodObject<{ state: ZodString }> } }>
        ) => ReturnCtx<GetRouteParams<"/auth/:oauth">, { schemas: { searchParams: ZodObject<{ state: ZodString }> } }>
    >()
})

describe("ContextSearchParams", () => {
    describe("URLSearchParams instance", () => {
        expectTypeOf<ContextSearchParams<undefined>>().toEqualTypeOf<{
            searchParams: URLSearchParams
        }>()
        expectTypeOf<ContextSearchParams<{}>>().toEqualTypeOf<{
            searchParams: URLSearchParams
        }>()
    })

    describe("ZodObject instance", () => {
        expectTypeOf<
            ContextSearchParams<{
                searchParams: ZodObject<{
                    code: ZodString
                }>
            }>
        >().toEqualTypeOf<{ searchParams: { code: string } }>()

        expectTypeOf<
            ContextSearchParams<{
                searchParams: ZodObject<{
                    code: ZodString
                    state: ZodString
                }>
            }>
        >().toEqualTypeOf<{ searchParams: { code: string; state: string } }>()
    })
})

describe("ContextBody", () => {
    describe("undefined body", () => {
        expectTypeOf<ContextBody<undefined>>().toEqualTypeOf<{ body: undefined }>()
        expectTypeOf<ContextBody<{}>>().toEqualTypeOf<{ body: undefined }>()
    })

    describe("ZodObject instance", () => {
        expectTypeOf<
            ContextBody<{
                body: ZodObject<{
                    username: ZodString
                    password: ZodString
                }>
            }>
        >().toEqualTypeOf<{ body: { username: string; password: string } }>()

        expectTypeOf<
            ContextBody<{
                body: ZodObject<{
                    oauth: ZodString
                }>
            }>
        >().toEqualTypeOf<{ body: { oauth: string } }>()
    })
})

describe("RequestContext", () => {
    type Context<T extends Record<string, unknown>> = Prettify<
        {
            headers: Headers
            request: Request
            url: URL
            method: HTTPMethod
            route: RoutePattern
            context: GlobalContext
        } & T
    >

    expectTypeOf<RequestContext>().toEqualTypeOf<
        Context<{
            params: Record<string, string>
            body: undefined
            searchParams: URLSearchParams
        }>
    >()

    expectTypeOf<RequestContext<{ oauth: string }>>().toEqualTypeOf<
        Context<{
            params: { oauth: string }
            body: undefined
            searchParams: URLSearchParams
        }>
    >()

    expectTypeOf<RequestContext<{ oauth: string; provider: string }>>().toEqualTypeOf<
        Context<{
            params: { oauth: string; provider: string }
            body: undefined
            searchParams: URLSearchParams
        }>
    >()

    expectTypeOf<
        RequestContext<
            {},
            {
                schemas: {
                    body: ZodObject<{ username: ZodString; password: ZodString }>
                }
            }
        >
    >().toEqualTypeOf<
        Context<{
            params: {}
            body: { username: string; password: string }
            searchParams: URLSearchParams
        }>
    >()

    expectTypeOf<
        RequestContext<
            {},
            {
                schemas: {
                    searchParams: ZodObject<{ code: ZodString; state: ZodString }>
                }
            }
        >
    >().toEqualTypeOf<
        Context<{
            params: {}
            body: undefined
            searchParams: { code: string; state: string }
        }>
    >()

    expectTypeOf<
        RequestContext<
            {},
            {
                schemas: {
                    body: ZodObject<{ username: ZodString; password: ZodString }>
                    searchParams: ZodObject<{ code: ZodString; state: ZodString }>
                }
            }
        >
    >().toEqualTypeOf<
        Context<{
            params: {}
            body: { username: string; password: string }
            searchParams: { code: string; state: string }
        }>
    >()

    expectTypeOf<
        RequestContext<
            { oauth: string },
            {
                schemas: {
                    body: ZodObject<{ username: ZodString; password: ZodString }>
                    searchParams: ZodObject<{ code: ZodString; state: ZodString }>
                }
            }
        >
    >().toEqualTypeOf<
        Context<{
            params: { oauth: string }
            body: { username: string; password: string }
            searchParams: { code: string; state: string }
        }>
    >()
})

describe("EndpointConfig", () => {
    expectTypeOf<EndpointConfig<"/">>().toEqualTypeOf<{
        schemas?: EndpointSchemas
        middlewares?: MiddlewareFunction<
            GetRouteParams<"/">,
            {
                schemas: EndpointSchemas
            }
        >[]
    }>()

    expectTypeOf<
        EndpointConfig<
            "/",
            {
                body: ZodObject<{ username: ZodString; password: ZodString }>
            }
        >
    >().toEqualTypeOf<{
        schemas?: { body: ZodObject<{ username: ZodString; password: ZodString }> }
        middlewares?: MiddlewareFunction<
            GetRouteParams<"/">,
            {
                schemas: {
                    body: ZodObject<{ username: ZodString; password: ZodString }>
                }
            }
        >[]
    }>()
})

describe("RouteHandler", () => {
    expectTypeOf<RouteHandler<"/auth/:oauth", {}>>().toEqualTypeOf<
        (ctx: RequestContext<GetRouteParams<"/auth/:oauth">, {}>) => Response | Promise<Response>
    >()
    expectTypeOf<RouteHandler<"/auth/session", {}>>().toEqualTypeOf<
        (ctx: RequestContext<GetRouteParams<"/auth/session">, {}>) => Response | Promise<Response>
    >()
    expectTypeOf<
        RouteHandler<
            "/auth/:oauth",
            {
                schemas: {
                    searchParams: ZodObject<{ state: ZodString }>
                }
            }
        >
    >().toEqualTypeOf<
        (
            ctx: RequestContext<
                GetRouteParams<"/auth/:oauth">,
                {
                    schemas: {
                        searchParams: ZodObject<{ state: ZodString }>
                    }
                }
            >
        ) => Response | Promise<Response>
    >()
})

describe("RouteEndpoint", () => {
    expectTypeOf<RouteEndpoint<"GET", "/auth/:oauth", {}>>().toEqualTypeOf<{
        method: "GET"
        route: "/auth/:oauth"
        config: {}
        handler: RouteHandler<"/auth/:oauth", {}>
    }>()

    // @ts-expect-error
    expectTypeOf<RouteEndpoint<"GET", "auth/:oauth", {}>>().toEqualTypeOf<{
        method: "GET"
        route: "/auth/:oauth"
        config: {}
        handler: RouteHandler<"/auth/:oauth", {}>
    }>()

    expectTypeOf<
        RouteEndpoint<
            "GET",
            "/auth/:oauth",
            {
                schemas: {
                    searchParams: ZodObject<{ state: ZodString }>
                }
            }
        >
    >().toEqualTypeOf<{
        method: "GET"
        route: "/auth/:oauth"
        config: {
            schemas: { searchParams: ZodObject<{ state: ZodString }> }
        }
        handler: RouteHandler<
            "/auth/:oauth",
            {
                schemas: {
                    searchParams: ZodObject<{ state: ZodString }>
                }
            }
        >
    }>()
})

describe("InferMethod", () => {
    expectTypeOf<InferMethod<[RouteEndpoint<"GET", "/auth/:oauth", {}>]>>().toEqualTypeOf<"GET">()
    expectTypeOf<
        InferMethod<[RouteEndpoint<"GET", "/auth/:oauth", {}>, RouteEndpoint<"GET", "/auth/session", {}>]>
    >().toEqualTypeOf<"GET">()
    expectTypeOf<
        InferMethod<[RouteEndpoint<"GET", "/auth/:oauth", {}>, RouteEndpoint<"POST", "/auth/signOut", {}>]>
    >().toEqualTypeOf<"GET" | "POST">()
    expectTypeOf<
        InferMethod<
            [
                RouteEndpoint<"GET", "/auth/:oauth", {}>,
                RouteEndpoint<"POST", "/auth/signOut", {}>,
                RouteEndpoint<"PUT", "/auth/session", {}>,
            ]
        >
    >().toEqualTypeOf<"GET" | "POST" | "PUT">()
})
