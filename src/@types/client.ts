import type { Type } from "arktype"
import type { ObjectSchema } from "valibot"
import type { HTTPMethod, RequestHeaders } from "@/@types/http.ts"
import type { infer as Infer } from "zod/v4/core"
import type { InferValibotSchema, SchemaKind, SupportedSchemas } from "@/@types/schemas.ts"
import type { RoutePattern, EndpointConfig, Prettify, RouteEndpoint, Awaitable, GetRouteParams } from "@/@types/types.ts"

export type InferSchema<T, Kind = SchemaKind<T>> = Kind extends "zod"
    ? Infer<T>
    : Kind extends "valibot"
      ? InferValibotSchema<T & ObjectSchema<any, undefined>>
      : Kind extends "typebox"
        ? {}
        : [T] extends [Type<infer U>]
          ? U
          : T

export type ToInferSchema<T> = {
    [K in keyof T]: InferSchema<T[K]>
}

export type RemoveUndefined<T> = {
    [K in keyof T as undefined extends T[K] ? never : K]: T[K]
}

export type SchemaValues<T> = T[keyof T]

type HasSchemas<C> =
    C extends EndpointConfig<any, any, infer Schemas>
        ? [SchemaValues<Omit<Schemas, "response">>] extends [never]
            ? false
            : [SchemaValues<Omit<Schemas, "response">>] extends [SupportedSchemas]
              ? true
              : false
        : false

type ComplementaryParams<T, Route extends RoutePattern> = T extends { params: any }
    ? T
    : keyof GetRouteParams<Route> extends never
      ? T
      : T & { params: GetRouteParams<Route> }

type ComplementaryHeaders<T> = T extends { headers: any } ? T : T & { headers?: HeadersInit }

export type InferContent<Config extends EndpointConfig<any, any, any>, Route extends RoutePattern> =
    Config extends EndpointConfig<any, any, infer Schemas>
        ? [SchemaValues<Schemas>] extends [never]
            ? unknown
            : [SchemaValues<Schemas>] extends [SupportedSchemas]
              ? Prettify<ComplementaryHeaders<ComplementaryParams<RemoveUndefined<ToInferSchema<Schemas>>, Route>>>
              : unknown
        : unknown

/**
 * Generates a client type based on the provided route endpoints. Each endpoint's method and route are
 * used to create a corresponding function to access the endpoint.
 * @example
 * type MyClient = Client<[
 *   RouteEndpoint<"GET", "/users/:id", EndpointConfig, Handler>,
 *   RouteEndpoint<"POST", "/users", EndpointConfig, Handler>
 * ]>
 */
export type Client<Endpoints extends readonly RouteEndpoint<any, any, any, any>[]> = Endpoints extends readonly unknown[]
    ? Endpoints extends readonly [infer First, ...infer Rest]
        ? First extends RouteEndpoint<infer Route, infer Method, infer Config, infer Handler>
            ? Method extends HTTPMethod | HTTPMethod[]
                ? {
                      [K in Lowercase<Method extends HTTPMethod ? Method : Method[number]>]: HasSchemas<Config> extends false
                          ? (path: Route, ctx?: ComplementaryParams<RequestInit, Route>) => Awaitable<ReturnType<Handler>>
                          : (
                                path: Route,
                                ctx: Omit<RequestInit, "body" | "headers"> &
                                    Prettify<Omit<InferContent<Config, Route>, "response">>
                            ) => Awaitable<ReturnType<Handler>>
                  } & Client<Rest extends readonly RouteEndpoint<any, any, any, any>[] ? Rest : []>
                : {}
            : {}
        : {}
    : {}

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
    headers?: RequestHeaders | (() => Awaitable<RequestHeaders>)
    /**
     * @experimental
     * Custom fetch function to be used by the client instead of the global fetch.
     */
    fetch?: FetchLike
}
