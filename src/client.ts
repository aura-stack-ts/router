import type { Router, InferEndpoints, Client, HTTPMethod, ClientOptions } from "./types.js"

export function createClient<InferRouter extends Router<any>>(options: ClientOptions): Client<InferEndpoints<InferRouter>> {
    const { baseURL, headers: defaultHeaders } = options
    return new Proxy(
        {},
        {
            get(_, prop) {
                const method = prop.toString().toUpperCase() as HTTPMethod
                return async (path: string, ctx?: any) => {
                    const searchParams = new URLSearchParams(ctx?.searchParams)
                    let interpolatedPath = path
                    for (const [key, value] of Object.entries(ctx?.params ?? {})) {
                        interpolatedPath = interpolatedPath.replace(`:${key}`, String(value))
                    }

                    const url = new URL(interpolatedPath, baseURL)
                    if (searchParams.size > 0) {
                        url.search = searchParams.toString()
                    }

                    const { params: _p, searchParams: _s, ...requestInit } = ctx ?? {}
                    const response = await fetch(url.toString(), {
                        ...requestInit,
                        method,
                        headers: {
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
