import z, { Infer, ZodObject, ZodString } from "zod"
import {
    EndpointConfig,
    EndpointSchemas,
    InferEndpoints,
    JsonResponse,
    Prettify,
    RouteEndpoint,
    RouteHandler,
    Router,
} from "./types.ts"
import { createEndpoint } from "./endpoint.ts"
import { createRouter } from "./router.ts"
import { createClient } from "./client.ts"

type UnionToIntersection<U> = (U extends unknown ? (x: U) => void : never) extends (x: infer I) => void ? I : never

type EndpointMethod<E> = E extends RouteEndpoint<infer Method, any, any, any> ? Lowercase<Method & string> : never

type FilterByMethod<Endpoints, Method extends string> =
    Endpoints extends RouteEndpoint<infer M, any, any, any> ? (Lowercase<M & string> extends Method ? Endpoints : never) : never

export type InferZod<T> = T extends z.ZodTypeAny ? z.infer<T> : T

export type ToInferZod<T> = {
    [K in keyof T]: InferZod<T[K]>
}

export type RemoveUndefined<T> = {
    [K in keyof T as undefined extends T[K] ? never : K]: T[K]
}

type HasSchemas<C> =
    C extends EndpointConfig<any, infer Schemas> ? (Schemas[keyof Schemas] extends ZodObject<any> ? true : false) : false

type EndpointToOverload<E> =
    E extends RouteEndpoint<infer Method, infer Route, infer Config, infer Handler>
        ? HasSchemas<Config> extends true
            ? (
                  path: Route,
                  ctx: Prettify<Omit<RequestInit, "body"> & RemoveUndefined<ToInferZod<NonNullable<Config["schemas"]>>>>
              ) => ReturnType<Handler> | Promise<ReturnType<Handler>>
            : (path: Route, ctx?: RequestInit) => ReturnType<Handler> | Promise<ReturnType<Handler>>
        : never

export type unstable__Client__rc<Endpoints extends RouteEndpoint<any, any, any, any>[]> = {
    [Method in EndpointMethod<Endpoints[number]>]: UnionToIntersection<
        EndpointToOverload<FilterByMethod<Endpoints[number], Method>>
    >
}

type Endpoint1 = RouteEndpoint<
    "GET",
    "/users/:userId",
    { schemas: { params: ZodObject<{ userId: ZodString }> } },
    RouteHandler<"/users/:userId", any, JsonResponse<{ userId: string }>>
>
type Endpoint2 = RouteEndpoint<"GET", "/users", {}, RouteHandler<"/users", any, JsonResponse<{ users: { id: string }[] }>>>
type Endpoint3 = RouteEndpoint<"POST", "/users", {}, RouteHandler<"/users", any, JsonResponse<{ success: boolean }>>>

const client = <InferRouter extends Router<any>>() => {
    type Client = unstable__Client__rc<InferEndpoints<InferRouter>>
    return {} as Client
}

const singleMethod = createEndpoint(
    "GET",
    "/items/:itemId",
    (ctx) => {
        return ctx.json({ method: ctx.method })
    },
    {
        schemas: {
            body: z.object({
                name: z.string(),
            }),
        },
    }
)

const usersEndpoint = createEndpoint("GET", "/users/:userId", (ctx) => {
    return ctx.json({ userId: ctx.params.userId })
})

const multipleMethods = createEndpoint("POST", "/multi", (ctx) => {
    return ctx.json({ method: ctx.method })
})

type IsRouterReturn<T> = T extends Router<infer E> ? E[number]["config"] : false

const router = createRouter([singleMethod, multipleMethods, usersEndpoint])

type Nose = InferEndpoints<typeof router>["0"]

type See<T extends RouteEndpoint<any, any, any, any>> =
    T extends RouteEndpoint<infer Method, infer Route, infer Config, infer Handler> ? Handler : false

type ClientCase = unstable__Client__rc<InferEndpoints<typeof router>>

const nose = createClient<typeof router>({
    baseURL: "http://localhost:3000/api",
})

const { json } = await nose.get("/items/:itemId", {
    body: {
        name: "",
    },
})

const { method } = await json()

nose.post("/multi", {})
