import type { Router, InferEndpoints, Client, HTTPMethod, ClientOptions } from "./types.js"

export function createClient<InferRouter extends Router<any>>(options: ClientOptions): Client<InferEndpoints<InferRouter>> {
    const { baseURL, headers: defaultHeaders } = options
    return new Proxy(
        {},
        {
            get(_, prop) {
                const method = prop.toString().toUpperCase() as HTTPMethod
                return async (path: string, ctx?: any) => {
                    const searchParams = new URLSearchParams({ ...ctx?.searchParams })
                    for (const [key, value] of Object.entries(ctx?.params ?? {})) {
                        path = path.replace(`:${key}`, String(value))
                    }
                    const url = new URL(path, baseURL)
                    url.searchParams.append(searchParams.toString(), "")
                    const response = await fetch(url.toString(), {
                        ...ctx,
                        method,
                        headers: {
                            ...(ctx?.body && !(ctx.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
                            ...defaultHeaders,
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
