import type { HTTPMethod, RouterConfig } from "./types.js"

export const createClientHandler = (method: HTTPMethod, config: RouterConfig) => {
    return async (path: string, ctx?: Record<string, any>) => {
        const searchParams = new URLSearchParams({ ...ctx?.searchParams })
        for (const [key, value] of Object.entries(ctx?.params ?? {})) {
            path = path.replace(`:${key}`, encodeURIComponent(String(value)))
        }
        const url = config.baseURL ? `${config.baseURL}${config.basePath ?? ""}${path}` : path
        const urlWithParams = searchParams.toString() ? `${url}?${searchParams.toString()}` : url
        return await fetch(urlWithParams, {
            ...ctx,
            method,
            body: ctx?.body ? (ctx.body instanceof FormData ? ctx.body : JSON.stringify(ctx.body)) : undefined,
        })
    }
}
