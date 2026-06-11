import { createClient, createEndpoint, createRouter } from "../src/index.ts"
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
    Prettify,
    GlobalContext,
    JsonResponse,
    InferEndpoints,
    RouteHandlerReturn,
    ContextParams,
    EndpointMeta,
    HTTPMethod,
} from "@/@types/index.ts"
import { ZodEnum, type ZodObject, type ZodString } from "zod"
import type { EnumSchema, ObjectSchema, StringSchema } from "valibot"
import type { TObject, TString, TEnum } from "typebox"

type RoutePath = "/auth/:oauth"
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
    expectTypeOf<GetRouteParams<"/users">>().toEqualTypeOf<{}>()
    expectTypeOf<GetRouteParams<"/:id/:userId">>().toEqualTypeOf<{
        id: string
        userId: string
    }>()
    expectTypeOf<GetRouteParams<"/:id/:userId/books">>().toEqualTypeOf<{
        id: string
        userId: string
    }>()
    expectTypeOf<GetRouteParams<"/:userId/books/path">>().toEqualTypeOf<{
        userId: string
    }>()
    expectTypeOf<GetRouteParams<"/users/:userId">>().toEqualTypeOf<{
        userId: string
    }>()
    expectTypeOf<GetRouteParams<"/users/:userId/books/:bookId">>().toEqualTypeOf<{
        userId: string
        bookId: string
    }>()
    expectTypeOf<GetRouteParams<"/users/:userId/:bookId">>().toEqualTypeOf<{
        userId: string
        bookId: string
    }>()
})

describe("RequestContext", () => {
    type Context<T extends Record<string, unknown>> = Prettify<
        {
            headers: HeadersBuilder
            request: Request
            url: URL
            context: GlobalContext
            json: <T>(data: T, init?: ResponseInit) => JsonResponse<T>
        } & T
    >
    expectTypeOf<RequestContext<EndpointMeta<"/", "GET", {}>>>().toEqualTypeOf<
        Context<{
            method: "GET"
            route: "/"
            params: {}
            body: undefined
            searchParams: URLSearchParams
        }>
    >()

    expectTypeOf<RequestContext<EndpointMeta<RoutePath, "GET", {}>>>().toEqualTypeOf<
        Context<{
            method: "GET"
            route: "/auth/:oauth"
            params: { oauth: string }
            body: undefined
            searchParams: URLSearchParams
        }>
    >()

    expectTypeOf<RequestContext<EndpointMeta<"/:oauth/:provider", "GET", {}>>>().toEqualTypeOf<
        Context<{
            method: "GET"
            route: "/:oauth/:provider"
            params: { oauth: string; provider: string }
            body: undefined
            searchParams: URLSearchParams
        }>
    >()

    expectTypeOf<
        RequestContext<EndpointMeta<RoutePath, "GET", { body: ZodObject<{ username: ZodString; password: ZodString }> }>>
    >().toEqualTypeOf<
        Context<{
            method: "GET"
            route: "/auth/:oauth"
            params: { oauth: string }
            body: { username: string; password: string }
            searchParams: URLSearchParams
        }>
    >()

    expectTypeOf<
        RequestContext<EndpointMeta<RoutePath, "GET", { searchParams: ZodObject<{ code: ZodString; state: ZodString }> }>>
    >().toEqualTypeOf<
        Context<{
            method: "GET"
            route: "/auth/:oauth"
            params: { oauth: string }
            body: undefined
            searchParams: { code: string; state: string }
        }>
    >()

    expectTypeOf<
        RequestContext<
            EndpointMeta<
                RoutePath,
                "GET",
                {
                    body: ZodObject<{ username: ZodString; password: ZodString }>
                    searchParams: ZodObject<{ code: ZodString; state: ZodString }>
                }
            >
        >
    >().toEqualTypeOf<
        Context<{
            route: "/auth/:oauth"
            method: "GET"
            params: { oauth: string }
            body: { username: string; password: string }
            searchParams: { code: string; state: string }
        }>
    >()

    expectTypeOf<
        RequestContext<
            EndpointMeta<
                RoutePath,
                "GET",
                {
                    body: ZodObject<{ username: ZodString; password: ZodString }>
                    searchParams: ZodObject<{ code: ZodString; state: ZodString }>
                }
            >
        >
    >().toEqualTypeOf<
        Context<{
            method: "GET"
            route: "/auth/:oauth"
            params: { oauth: string }
            body: { username: string; password: string }
            searchParams: { code: string; state: string }
        }>
    >()
})

describe("MiddlewareFunction", () => {
    type ReturnCtx<
        Route extends RoutePattern = RoutePattern,
        Method extends HTTPMethod | HTTPMethod[] = HTTPMethod | HTTPMethod[],
        Schemas extends EndpointSchemas = EndpointSchemas,
    > = ReturnType<MiddlewareFunction<Route, Method, Schemas>>

    type Body = ZodObject<{ username: ZodString; password: ZodString }>
    type SearchParams = ZodObject<{ code: ZodString; state: ZodString }>

    expectTypeOf<
        MiddlewareFunction<
            RoutePath,
            "GET",
            {
                body: Body
            }
        >
    >().toEqualTypeOf<
        (ctx: RequestContext<EndpointMeta<RoutePath, "GET", { body: Body }>>) => ReturnCtx<
            RoutePath,
            "GET",
            {
                body: Body
            }
        >
    >()

    expectTypeOf<
        MiddlewareFunction<
            RoutePath,
            "GET",
            {
                searchParams: SearchParams
            }
        >
    >().toEqualTypeOf<
        (
            ctx: RequestContext<
                EndpointMeta<
                    RoutePath,
                    "GET",
                    {
                        searchParams: SearchParams
                    }
                >
            >
        ) => ReturnCtx<
            RoutePath,
            "GET",
            {
                searchParams: SearchParams
            }
        >
    >()

    expectTypeOf<
        MiddlewareFunction<
            RoutePath,
            "GET",
            {
                body: Body
                searchParams: SearchParams
            }
        >
    >().toEqualTypeOf<
        (
            ctx: RequestContext<
                EndpointMeta<
                    RoutePath,
                    "GET",
                    {
                        body: Body
                        searchParams: SearchParams
                    }
                >
            >
        ) => ReturnCtx<
            RoutePath,
            "GET",
            {
                body: Body
                searchParams: SearchParams
            }
        >
    >()

    expectTypeOf<MiddlewareFunction<RoutePath, "GET", {}>>().toEqualTypeOf<
        (ctx: RequestContext<EndpointMeta<RoutePath, "GET", {}>>) => ReturnCtx<RoutePath, "GET", {}>
    >()

    expectTypeOf<
        MiddlewareFunction<
            RoutePath,
            "GET",
            {
                searchParams: ZodObject<{ state: ZodString }>
            }
        >
    >().toEqualTypeOf<
        (
            ctx: RequestContext<EndpointMeta<RoutePath, "GET", { searchParams: ZodObject<{ state: ZodString }> }>>
        ) => ReturnCtx<RoutePath, "GET", { searchParams: ZodObject<{ state: ZodString }> }>
    >()
})

describe("ContextSearchParams", () => {
    describe("URLSearchParams instance", () => {
        expectTypeOf<ContextSearchParams<{}>>().toEqualTypeOf<URLSearchParams>()
    })

    describe("ZodObject instance", () => {
        expectTypeOf<
            ContextSearchParams<{
                searchParams: ZodObject<{
                    code: ZodString
                }>
            }>
        >().toEqualTypeOf<{ code: string }>()

        expectTypeOf<
            ContextSearchParams<{
                searchParams: ZodObject<{
                    code: ZodString
                    state: ZodString
                }>
            }>
        >().toEqualTypeOf<{ code: string; state: string }>()
    })

    describe("ObjectSchema instance", () => {
        expectTypeOf<
            ContextSearchParams<{
                searchParams: ObjectSchema<
                    {
                        code: StringSchema<undefined>
                    },
                    undefined
                >
            }>
        >().toEqualTypeOf<{ code: string }>()

        expectTypeOf<
            ContextSearchParams<{
                searchParams: ObjectSchema<
                    {
                        code: StringSchema<undefined>
                        state: StringSchema<undefined>
                    },
                    undefined
                >
            }>
        >().toEqualTypeOf<{ code: string; state: string }>()
    })

    describe("Typebox instance", () => {
        expectTypeOf<
            ContextSearchParams<{
                searchParams: TObject<{
                    code: TString
                }>
            }>
        >().toEqualTypeOf<TObject<{ code: TString }>>()

        expectTypeOf<
            ContextSearchParams<{
                searchParams: TObject<{
                    code: TString
                    state: TString
                }>
            }>
        >().toEqualTypeOf<TObject<{ code: TString; state: TString }>>()
    })
})

describe("ContextBody", () => {
    describe("undefined body", () => {
        expectTypeOf<ContextBody<{}>>().toEqualTypeOf<undefined>()
    })

    describe("ZodObject instance", () => {
        expectTypeOf<
            ContextBody<{
                body: ZodObject<{
                    username: ZodString
                    password: ZodString
                }>
            }>
        >().toEqualTypeOf<{ username: string; password: string }>()

        expectTypeOf<
            ContextBody<{
                body: ZodObject<{
                    oauth: ZodString
                }>
            }>
        >().toEqualTypeOf<{ oauth: string }>()
    })

    describe("ObjectSchema instance", () => {
        expectTypeOf<
            ContextBody<{
                body: ObjectSchema<
                    {
                        username: StringSchema<undefined>
                        password: StringSchema<undefined>
                    },
                    undefined
                >
            }>
        >().toEqualTypeOf<{ username: string; password: string }>()

        expectTypeOf<
            ContextBody<{
                body: ObjectSchema<
                    {
                        oauth: StringSchema<undefined>
                    },
                    undefined
                >
            }>
        >().toEqualTypeOf<{ oauth: string }>()
    })

    describe("Typebox instance", () => {
        expectTypeOf<
            ContextBody<{
                body: TObject<{
                    username: TString
                    password: TString
                }>
            }>
        >().toEqualTypeOf<TObject<{ username: TString; password: TString }>>()

        expectTypeOf<
            ContextBody<{
                body: TObject<{
                    oauth: TString
                }>
            }>
        >().toEqualTypeOf<TObject<{ oauth: TString }>>()
    })
})

describe("ContextParams", () => {
    describe("No route params", () => {
        expectTypeOf<ContextParams<{}, {}>>().toEqualTypeOf<{}>()
        expectTypeOf<ContextParams<{}>>().toEqualTypeOf<Record<string, string>>()
    })

    describe("With route params", () => {
        expectTypeOf<ContextParams<{}, GetRouteParams<RoutePath>>>().toEqualTypeOf<{ oauth: string }>()
        expectTypeOf<ContextParams<EndpointSchemas, GetRouteParams<RoutePath>>>().toEqualTypeOf<{
            oauth: string
        }>()
    })

    describe("With route params and schemas", () => {
        expectTypeOf<
            ContextParams<
                {
                    params: ZodObject<{
                        oauth: ZodString
                    }>
                },
                GetRouteParams<RoutePath>
            >
        >().toEqualTypeOf<{ oauth: string }>()
        expectTypeOf<
            ContextParams<
                {
                    params: ObjectSchema<
                        {
                            oauth: StringSchema<undefined>
                        },
                        undefined
                    >
                },
                GetRouteParams<RoutePath>
            >
        >().toEqualTypeOf<{ oauth: string }>()
        expectTypeOf<
            ContextParams<
                {
                    params: TObject<{
                        oauth: TString
                    }>
                },
                GetRouteParams<RoutePath>
            >
        >().toEqualTypeOf<TObject<{ oauth: TString }>>()

        expectTypeOf<
            ContextParams<{
                params: ZodObject<{
                    role: ZodEnum<{ admin: "admin"; user: "user"; guest: "guest" }>
                }>
            }>
        >().toEqualTypeOf<{ role: "admin" | "user" | "guest" }>()
        expectTypeOf<
            ContextParams<{
                params: ObjectSchema<
                    {
                        oauth: EnumSchema<{ admin: "admin"; user: "user"; guest: "guest" }, undefined>
                    },
                    undefined
                >
            }>
        >().toEqualTypeOf<{ oauth: "admin" | "user" | "guest" }>()
        expectTypeOf<
            ContextParams<{
                params: TObject<{
                    role: TEnum<["admin", "user", "guest"]>
                }>
            }>
        >().toEqualTypeOf<TObject<{ role: TEnum<["admin", "user", "guest"]> }>>()

        expectTypeOf<
            ContextParams<
                {
                    params: ZodObject<{
                        userId: ZodString
                        itemId: ZodString
                    }>
                },
                GetRouteParams<RoutePath>
            >
        >().toEqualTypeOf<{ userId: string; itemId: string }>()
        expectTypeOf<
            ContextParams<
                {
                    params: ObjectSchema<
                        {
                            userId: StringSchema<undefined>
                            itemId: StringSchema<undefined>
                        },
                        undefined
                    >
                },
                GetRouteParams<RoutePath>
            >
        >().toEqualTypeOf<{ userId: string; itemId: string }>()
        expectTypeOf<
            ContextParams<
                {
                    params: TObject<{
                        userId: TString
                        itemId: TString
                    }>
                },
                GetRouteParams<RoutePath>
            >
        >().toEqualTypeOf<TObject<{ userId: TString; itemId: TString }>>()

        expectTypeOf<
            ContextParams<{
                params: ZodObject<{
                    userId: ZodString
                    itemId: ZodString
                }>
            }>
        >().toEqualTypeOf<{ userId: string; itemId: string }>()
        expectTypeOf<
            ContextParams<{
                params: ObjectSchema<
                    {
                        userId: StringSchema<undefined>
                        itemId: StringSchema<undefined>
                    },
                    undefined
                >
            }>
        >().toEqualTypeOf<{ userId: string; itemId: string }>()
        expectTypeOf<
            ContextParams<{
                params: TObject<{
                    userId: TString
                    itemId: TString
                }>
            }>
        >().toEqualTypeOf<TObject<{ userId: TString; itemId: TString }>>()
    })
})

describe("EndpointConfig", () => {
    expectTypeOf<EndpointConfig<"/", "GET", {}>>().toMatchTypeOf<{
        schemas?: {}
        use?: MiddlewareFunction<"/", "GET", {}>[]
    }>()

    expectTypeOf<
        EndpointConfig<
            "/",
            "GET",
            {
                body: ZodObject<{ username: ZodString; password: ZodString }>
            }
        >
    >().toMatchTypeOf<{
        schemas?: { body: ZodObject<{ username: ZodString; password: ZodString }> }
        use?: MiddlewareFunction<
            "/",
            "GET",
            {
                body: ZodObject<{ username: ZodString; password: ZodString }>
            }
        >[]
    }>()
})

describe("RouteHandler", () => {
    expectTypeOf<RouteHandler<"/auth/:oauth", "GET", {}>>().toBeFunction()
    expectTypeOf<RouteHandler<"/auth/session", "GET", {}>>().toBeFunction()
    expectTypeOf<
        RouteHandler<
            "/auth/:oauth",
            "GET",
            EndpointConfig<"/auth/:oauth", "GET", { searchParams: ZodObject<{ state: ZodString }> }>
        >
    >().toBeFunction()
})

describe("RouteEndpoint", () => {
    expectTypeOf<RouteEndpoint<"/auth/:oauth", "GET", EndpointConfig<"/auth/:oauth", "GET", {}>>>().toEqualTypeOf<
        RouteEndpoint<
            "/auth/:oauth",
            "GET",
            EndpointConfig<"/auth/:oauth", "GET", {}>,
            RouteHandler<"/auth/:oauth", "GET", EndpointConfig<"/auth/:oauth", "GET", {}>, RouteHandlerReturn>
        >
    >()

    expectTypeOf<
        RouteEndpoint<
            "/auth/:oauth",
            "GET",
            EndpointConfig<"/auth/:oauth", "GET", { searchParams: ZodObject<{ state: ZodString }> }>
        >
    >().toEqualTypeOf<
        RouteEndpoint<
            "/auth/:oauth",
            "GET",
            EndpointConfig<"/auth/:oauth", "GET", { searchParams: ZodObject<{ state: ZodString }> }>,
            RouteHandler<
                "/auth/:oauth",
                "GET",
                EndpointConfig<"/auth/:oauth", "GET", { searchParams: ZodObject<{ state: ZodString }> }>,
                RouteHandlerReturn
            >
        >
    >()
})

describe("InferMethod", () => {
    expectTypeOf<InferMethod<[RouteEndpoint<"/auth/:oauth", "GET", EmptyObject>]>>().toEqualTypeOf<"GET">()
    expectTypeOf<
        InferMethod<[RouteEndpoint<"/auth/:oauth", "GET", EmptyObject>, RouteEndpoint<"/auth/session", "GET", EmptyObject>]>
    >().toEqualTypeOf<"GET">()
    expectTypeOf<
        InferMethod<[RouteEndpoint<"/auth/:oauth", "GET", EmptyObject>, RouteEndpoint<"/auth/signOut", "POST", EmptyObject>]>
    >().toEqualTypeOf<"GET" | "POST">()
    expectTypeOf<
        InferMethod<
            [
                RouteEndpoint<"/auth/:oauth", "GET", EmptyObject>,
                RouteEndpoint<"/auth/signOut", "POST", EmptyObject>,
                RouteEndpoint<"/auth/session", "PUT", EmptyObject>,
            ]
        >
    >().toEqualTypeOf<"GET" | "POST" | "PUT">()
})

describe("RouteEndpoint response inference from ctx.json", async () => {
    const endpoint = createEndpoint("GET", "/test", (ctx) => ctx.json({ id: 1 }))

    expectTypeOf<ReturnType<typeof endpoint.handler>>().toEqualTypeOf<JsonResponse<{ id: number }>>()

    const router = createRouter([endpoint])
    expectTypeOf<InferEndpoints<typeof router>>().toEqualTypeOf<[typeof endpoint]>()

    const client = createClient<typeof router>({
        baseURL: "https://api.example.com",
    })
    const response = await client.get("/test")
    expectTypeOf<typeof response>().toEqualTypeOf<JsonResponse<{ id: number }>>()
})
