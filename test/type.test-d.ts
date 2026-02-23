import { describe, expectTypeOf } from "vitest"
import type { HeadersBuilder } from "@/headers.ts"
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
} from "../src/types.ts"
import type { ZodObject, ZodString } from "zod"

type EmptyObject = Record<PropertyKey, never>

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
            EmptyObject,
            {
                schemas: {
                    body: Body
                }
            }
        >
    >().toEqualTypeOf<
        (
            ctx: RequestContext<
                EmptyObject,
                {
                    schemas: {
                        body: Body
                    }
                }
            >
        ) => ReturnCtx<
            EmptyObject,
            {
                schemas: {
                    body: Body
                }
            }
        >
    >()

    expectTypeOf<
        MiddlewareFunction<
            EmptyObject,
            {
                schemas: {
                    searchParams: SearchParams
                }
            }
        >
    >().toEqualTypeOf<
        (
            ctx: RequestContext<
                EmptyObject,
                {
                    schemas: {
                        searchParams: SearchParams
                    }
                }
            >
        ) => ReturnCtx<
            EmptyObject,
            {
                schemas: {
                    searchParams: SearchParams
                }
            }
        >
    >()

    expectTypeOf<
        MiddlewareFunction<
            EmptyObject,
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
                EmptyObject,
                {
                    schemas: {
                        body: Body
                        searchParams: SearchParams
                    }
                }
            >
        ) => ReturnCtx<
            EmptyObject,
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
            EmptyObject,
            {
                middlewares: []
            }
        >
    >().toEqualTypeOf<(ctx: RequestContext<EmptyObject, { middlewares: [] }>) => ReturnCtx<EmptyObject, { middlewares: [] }>>()

    expectTypeOf<
        MiddlewareFunction<
            EmptyObject,
            {
                middlewares: [(ctx: RequestContext) => Promise<RequestContext<EmptyObject, { middlewares: [] }>>]
            }
        >
    >().toEqualTypeOf<(ctx: RequestContext<EmptyObject, { middlewares: [] }>) => ReturnCtx<EmptyObject, { middlewares: [] }>>()

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
        expectTypeOf<ContextSearchParams<EmptyObject>>().toEqualTypeOf<{
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
        expectTypeOf<ContextBody<EmptyObject>>().toEqualTypeOf<{ body: undefined }>()
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
            headers: HeadersBuilder
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
            EmptyObject,
            {
                schemas: {
                    body: ZodObject<{ username: ZodString; password: ZodString }>
                }
            }
        >
    >().toEqualTypeOf<
        Context<{
            params: EmptyObject
            body: { username: string; password: string }
            searchParams: URLSearchParams
        }>
    >()

    expectTypeOf<
        RequestContext<
            EmptyObject,
            {
                schemas: {
                    searchParams: ZodObject<{ code: ZodString; state: ZodString }>
                }
            }
        >
    >().toEqualTypeOf<
        Context<{
            params: EmptyObject
            body: undefined
            searchParams: { code: string; state: string }
        }>
    >()

    expectTypeOf<
        RequestContext<
            EmptyObject,
            {
                schemas: {
                    body: ZodObject<{ username: ZodString; password: ZodString }>
                    searchParams: ZodObject<{ code: ZodString; state: ZodString }>
                }
            }
        >
    >().toEqualTypeOf<
        Context<{
            params: EmptyObject
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
    expectTypeOf<RouteHandler<"/auth/:oauth", EmptyObject>>().toEqualTypeOf<
        (ctx: RequestContext<GetRouteParams<"/auth/:oauth">, EmptyObject>) => Response | Promise<Response>
    >()
    expectTypeOf<RouteHandler<"/auth/session", EmptyObject>>().toEqualTypeOf<
        (ctx: RequestContext<GetRouteParams<"/auth/session">, EmptyObject>) => Response | Promise<Response>
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
    expectTypeOf<RouteEndpoint<"GET", "/auth/:oauth", EmptyObject>>().toEqualTypeOf<{
        method: "GET"
        route: "/auth/:oauth"
        config: EmptyObject
        handler: RouteHandler<"/auth/:oauth", EmptyObject>
    }>()

    expectTypeOf<RouteEndpoint<"GET", "/auth/:oauth", EmptyObject>>().toEqualTypeOf<{
        method: "GET"
        route: "/auth/:oauth"
        config: EmptyObject
        handler: RouteHandler<"/auth/:oauth", EmptyObject>
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
    expectTypeOf<InferMethod<[RouteEndpoint<"GET", "/auth/:oauth", EmptyObject>]>>().toEqualTypeOf<"GET">()
    expectTypeOf<
        InferMethod<[RouteEndpoint<"GET", "/auth/:oauth", EmptyObject>, RouteEndpoint<"GET", "/auth/session", EmptyObject>]>
    >().toEqualTypeOf<"GET">()
    expectTypeOf<
        InferMethod<[RouteEndpoint<"GET", "/auth/:oauth", EmptyObject>, RouteEndpoint<"POST", "/auth/signOut", EmptyObject>]>
    >().toEqualTypeOf<"GET" | "POST">()
    expectTypeOf<
        InferMethod<
            [
                RouteEndpoint<"GET", "/auth/:oauth", EmptyObject>,
                RouteEndpoint<"POST", "/auth/signOut", EmptyObject>,
                RouteEndpoint<"PUT", "/auth/session", EmptyObject>,
            ]
        >
    >().toEqualTypeOf<"GET" | "POST" | "PUT">()
})
