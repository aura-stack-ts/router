import z from "zod"
import { createEndpoint } from "./endpoint.js"
import { createRouter } from "./router.js"
import { Router, InferEndpoints, Client, HTTPMethod } from "./types.js"

export type ClientOptions = {
    baseURL: string
    headers?: Record<string, string>
}

export function createClient<T extends Router<any>>(options: ClientOptions): Client<InferEndpoints<T>> {
    const { baseURL, headers: defaultHeaders } = options
    return new Proxy({} as any, {
        get(_, prop) {
            const method = prop.toString().toUpperCase() as HTTPMethod
            return async (path: string, ctx?: any) => {
                let finalPath = path
                if (ctx?.params) {
                    for (const [key, value] of Object.entries(ctx.params)) {
                        finalPath = finalPath.replace(`:${key}`, String(value))
                    }
                }
                const url = new URL(finalPath, baseURL)
                if (ctx?.searchParams) {
                    for (const [key, value] of Object.entries(ctx.searchParams)) {
                        if (value !== undefined) url.searchParams.append(key, String(value))
                    }
                }
                const response = await fetch(url.toString(), {
                    method,
                    headers: {
                        ...(ctx?.body && !(ctx.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
                        ...defaultHeaders,
                        ...ctx?.headers,
                    },
                    body: ctx?.body ? (ctx.body instanceof FormData ? ctx.body : JSON.stringify(ctx.body)) : undefined,
                })
                if (!response.ok) {
                    throw new Error(`Request failed with status ${response.status}`)
                }
                return response.json()
            }
        },
    }) as Client<InferEndpoints<T>>
}
