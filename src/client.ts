import type { Router, InferEndpoints, Client, HTTPMethod, ClientOptions } from "./types.ts"

/**
 * Creates a client API for making requests to the specified router. It provides type-safe methods
 * based on the router's endpoints.
 *
 * @param options - Configuration options for the client, including baseURL and default headers.
 * @returns A client object with methods corresponding to HTTP methods (GET, POST, etc.).
 * @example
 * import { createClient } from "aura-stack/router/client";
 * import { appRouter } from "./server";
 *
 * const client = createClient<typeof appRouter>({
 *   baseURL: "http://localhost:3000/api",
 * })
 *
 * client.get("/users")
 */
export function createClient<InferRouter extends Router<any>>(options: ClientOptions): Client<InferEndpoints<InferRouter>> {
    const { baseURL, basePath, headers: defaultHeaders, fetch: customFetch, ...clientOptions } = options
    const fetchFn = customFetch ?? globalThis.fetch.bind(globalThis)

    return new Proxy(
        {},
        {
            get(_, prop) {
                const method = prop.toString().toUpperCase() as HTTPMethod
                return async (path: string, ctx?: any) => {
                    const searchParams = new URLSearchParams(ctx?.searchParams)

                    let resolvedPath = `${basePath ?? ""}${path}`
                    for (const [key, value] of Object.entries(ctx?.params ?? {})) {
                        resolvedPath = resolvedPath.replace(`:${key}`, String(value))
                    }

                    const url = new URL(resolvedPath, baseURL)
                    if (searchParams.size > 0) {
                        url.search = searchParams.toString()
                    }

                    const { params: _p, searchParams: _s, ...requestInit } = ctx ?? {}
                    const headers = typeof defaultHeaders === "function" ? await defaultHeaders() : defaultHeaders
                    const response = await fetchFn(url.toString(), {
                        ...clientOptions,
                        ...requestInit,
                        method,
                        headers: {
                            ...headers,
                            ...ctx?.headers,
                        },
                        body: ctx?.body ? (ctx.body instanceof FormData ? ctx.body : JSON.stringify(ctx.body)) : undefined,
                    })
                    return response
                }
            },
        }
    ) as Client<InferEndpoints<InferRouter>>
}
