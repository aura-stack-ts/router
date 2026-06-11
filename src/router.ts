import { TrieRouter } from "@/trie.ts"
import { onError } from "@/on-error.ts"
import { RouterError } from "@/error.ts"
import { HeadersBuilder } from "@/headers.ts"
import { isSupportedMethod } from "@/assert.ts"
import { getBody, getRouteParams, getSearchParams, json, parseBodyRaw } from "@/context.ts"
import { executeGlobalMiddlewares, executeMiddlewares } from "@/middlewares.ts"
import { runOnRequest, runOnMatch, runOnParams, runOnSearchParams, runOnBody, runOnHandler, runOnResponse } from "@/hooks.ts"
import type {
    GetHttpHandlers,
    GlobalContext,
    HTTPMethod,
    MatchHookContext,
    RequestHookContext,
    RouteEndpoint,
    RoutePattern,
    RouterConfig,
    Router,
} from "@/@types/index.ts"

const inferHandlerResponse = (result: unknown): Response => {
    if (result instanceof Response) return result
    if (result === undefined) return new Response(null, { status: 204 })
    if (typeof result === "string") {
        return new Response(result, {
            headers: { "Content-Type": "text/plain; charset=utf-8" },
        })
    }
    if (
        result instanceof ArrayBuffer ||
        ArrayBuffer.isView(result) ||
        result instanceof Blob ||
        result instanceof FormData ||
        result instanceof URLSearchParams ||
        result instanceof ReadableStream
    ) {
        return new Response(result as BodyInit)
    }
    return Response.json(result)
}

const handleRequest = async (
    method: HTTPMethod,
    request: Request,
    config: RouterConfig,
    router: TrieRouter
): Promise<Response> => {
    let errorCtx: RequestHookContext | MatchHookContext<any> = {
        request,
        context: config.context ?? ({} as GlobalContext),
        json,
    }
    let endpoint: RouteEndpoint<any, any, any, any> | undefined
    try {
        if (!isSupportedMethod(request.method)) {
            throw new RouterError("METHOD_NOT_ALLOWED", `The HTTP method '${request.method}' is not supported`)
        }

        /** onRequest hook */
        let requestCtx: RequestHookContext = { request, context: config.context ?? ({} as GlobalContext), json }

        const globalOnRequestResult = await runOnRequest(config.hooks?.onRequest, requestCtx)
        if (globalOnRequestResult instanceof Response) return globalOnRequestResult
        requestCtx = globalOnRequestResult
        errorCtx = requestCtx

        /** Global middlewares (use[]) */
        const globalRequestContext = await executeGlobalMiddlewares(
            { request: requestCtx.request, context: requestCtx.context },
            config.use
        )
        if (globalRequestContext instanceof Response) return globalRequestContext

        requestCtx = { request: globalRequestContext.request, context: globalRequestContext.context, json }
        errorCtx = requestCtx

        const url = new URL(requestCtx.request.url)
        const pathnameWithBase = url.pathname

        if (requestCtx.request.method !== method) {
            throw new RouterError("METHOD_NOT_ALLOWED", `The HTTP method '${requestCtx.request.method}' is not allowed`)
        }

        const node = router.match(method, pathnameWithBase)
        if (!node) {
            throw new RouterError("NOT_FOUND", `No route found for path: ${pathnameWithBase}`)
        }
        const { params } = node
        endpoint = node.endpoint

        let matchCtx: MatchHookContext<any> = {
            request: requestCtx.request,
            context: requestCtx.context,
            route: endpoint.route,
            method: requestCtx.request.method as HTTPMethod,
            json,
        }
        errorCtx = matchCtx

        const endpointOnRequestResult = await runOnRequest(endpoint.config.hooks?.onRequest, matchCtx)
        if (endpointOnRequestResult instanceof Response) return endpointOnRequestResult
        if (endpointOnRequestResult !== matchCtx) {
            matchCtx = { ...matchCtx, ...endpointOnRequestResult }
            errorCtx = matchCtx
        }

        /** onMatch hook */
        const onMatchResult = await runOnMatch(endpoint.config.hooks?.onMatch, matchCtx)
        if (onMatchResult instanceof Response) return onMatchResult
        if (onMatchResult !== matchCtx) {
            matchCtx = onMatchResult
            errorCtx = matchCtx
        }

        /** onParams hook */
        let dynamicParams: Record<string, unknown> | unknown
        if (endpoint.config.hooks?.onParams) {
            const onParamsResult = await runOnParams(endpoint.config.hooks.onParams, params, matchCtx)
            if (onParamsResult instanceof Response) return onParamsResult
            dynamicParams = onParamsResult
        } else {
            dynamicParams = getRouteParams(params, endpoint.config)
        }

        /** onSearchParams hook */
        let searchParams: Record<string, unknown> | URLSearchParams
        if (endpoint.config.hooks?.onSearchParams) {
            const rawSearchParams = new URLSearchParams(url.searchParams.toString())
            const onSearchParamsResult = await runOnSearchParams(endpoint.config.hooks.onSearchParams, rawSearchParams, matchCtx)
            if (onSearchParamsResult instanceof Response) return onSearchParamsResult
            searchParams = onSearchParamsResult
        } else {
            // @ts-ignore Skip type checking here because there's overlapping types
            searchParams = getSearchParams(requestCtx.request.url, endpoint.config)
        }

        /** onBody hook */
        let body: unknown
        if (endpoint.config.hooks?.onBody) {
            const rawBody = await parseBodyRaw(requestCtx.request)
            const onBodyResult = await runOnBody(endpoint.config.hooks.onBody, rawBody, matchCtx)
            if (onBodyResult instanceof Response) return onBodyResult
            body = onBodyResult
        } else {
            body = await getBody(requestCtx.request, endpoint.config)
        }

        const headers = new HeadersBuilder(requestCtx.request.headers)
        let context: any = {
            params: dynamicParams,
            searchParams,
            headers,
            body,
            request: requestCtx.request,
            url,
            method: requestCtx.request.method,
            route: endpoint.route,
            context: requestCtx.context ?? ({} as GlobalContext),
            json,
        }

        /** Endpoint middlewares (use[]) */
        context = await executeMiddlewares(context, endpoint.config.use)

        /** onHandler hook */
        const onHandlerResult = await runOnHandler(endpoint.config.hooks?.onHandler, context)
        if (onHandlerResult instanceof Response) return onHandlerResult
        context = onHandlerResult

        /** Route handler */
        const handlerResult = await endpoint.handler(context)
        let response = inferHandlerResponse(handlerResult)

        /** onResponse hook */
        response = await runOnResponse(endpoint.config.hooks?.onResponse, response, context)
        response = await runOnResponse(config.hooks?.onResponse as any, response, context)

        return response
    } catch (error) {
        return onError(error, request, config, endpoint?.config?.hooks?.onError, errorCtx)
    }
}

/**
 * Creates the entry point for the server, handling the endpoints defined in the router.
 * It groups endpoints by HTTP method and matches incoming requests to the appropriate endpoint.
 * It accepts an optional configuration object to set a base path and middlewares for all endpoints.
 *
 * @param endpoints - Array of route endpoints to be handled by the router
 * @param config - Optional configuration object for the router
 * @returns An object with methods corresponding to HTTP methods, each handling requests for that method
 */
export const createRouter = <const Endpoints extends RouteEndpoint<any, any, any, any>[]>(
    endpoints: Endpoints,
    config: RouterConfig = {}
): Router<Endpoints> => {
    const router = new TrieRouter()
    const server = {} as GetHttpHandlers<Endpoints>
    const methods = new Set<HTTPMethod>()
    for (const endpoint of endpoints) {
        const withBasePath = config.basePath ? `${config.basePath}${endpoint.route}` : endpoint.route
        router.add({ ...endpoint, route: withBasePath as RoutePattern })
        const endpointMethods = Array.isArray(endpoint.method) ? endpoint.method : [endpoint.method]
        for (const method of endpointMethods) {
            methods.add(method)
        }
    }
    for (const method of methods) {
        server[method as keyof typeof server] = (request: Request) => handleRequest(method, request, config, router)
    }
    return server as Router<Endpoints>
}
