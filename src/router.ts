import { TrieRouter } from "@/trie.ts"
import { onError } from "@/on-error.ts"
import { AuraRouterError } from "@/error.ts"
import { HeadersBuilder } from "@/headers.ts"
import { isSupportedMethod } from "@/assert.ts"
import { executeGlobalMiddlewares, executeMiddlewares } from "@/middlewares.ts"
import { getBody, getHeaders, getRouteParams, getSearchParams, json, parseBodyRaw } from "@/context.ts"
import {
    runOnRequest,
    runOnMatch,
    runOnParams,
    runOnSearchParams,
    runOnBody,
    runOnHandler,
    runOnResponse,
    runOnHeaders,
} from "@/hooks.ts"
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
    EndpointMeta,
    RequestContext,
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
    let errorCtx: RequestHookContext | MatchHookContext<any> | RequestContext<EndpointMeta<any, any, any>> = {
        request,
        context: config.context ?? ({} as GlobalContext),
        json,
        phase: "onRequest",
    }
    let endpoint: RouteEndpoint<any, any, any, any> | undefined
    try {
        if (!isSupportedMethod(request.method)) {
            throw new AuraRouterError({ code: "METHOD_NOT_ALLOWED" })
        }

        /** onRequest hook */
        let requestCtx: RequestHookContext = {
            request,
            context: config.context ?? ({} as GlobalContext),
            json,
            phase: "onRequest",
        }

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

        requestCtx = { request: globalRequestContext.request, context: globalRequestContext.context, json, phase: "onRequest" }
        errorCtx = requestCtx

        const url = new URL(requestCtx.request.url)
        const pathnameWithBase = url.pathname

        if (requestCtx.request.method !== method) {
            throw new AuraRouterError({ code: "METHOD_NOT_ALLOWED" })
        }

        const node = router.match(method, pathnameWithBase)
        if (!node) {
            throw new AuraRouterError({ code: "NOT_FOUND" })
        }
        const { params } = node
        endpoint = node.endpoint

        let matchCtx = {
            request: requestCtx.request,
            context: requestCtx.context,
            route: endpoint.route,
            method: requestCtx.request.method as HTTPMethod,
            json,
            phase: "onMatch",
        } as MatchHookContext<any>
        errorCtx = matchCtx

        const endpointOnRequestCtx = { ...matchCtx, phase: "onRequest" as const }
        errorCtx = endpointOnRequestCtx
        const endpointOnRequestResult = await runOnRequest(endpoint.config.hooks?.onRequest, endpointOnRequestCtx)
        if (endpointOnRequestResult instanceof Response) return endpointOnRequestResult
        if (endpointOnRequestResult !== endpointOnRequestCtx) {
            matchCtx = { ...matchCtx, ...endpointOnRequestResult }
            errorCtx = matchCtx
        }

        /** onMatch hook */
        matchCtx.phase = "onMatch"
        errorCtx = matchCtx
        const onMatchResult = await runOnMatch(endpoint.config.hooks?.onMatch, matchCtx)
        if (onMatchResult instanceof Response) return onMatchResult
        if (onMatchResult !== matchCtx) {
            matchCtx = { ...matchCtx, ...onMatchResult }
            errorCtx = matchCtx
        }

        /** onHeaders hook */
        const headersCtx = { ...matchCtx, phase: "onHeaders" as const }
        errorCtx = headersCtx
        let headers: any = await runOnHeaders(
            endpoint.config.hooks?.onHeaders,
            new HeadersBuilder(requestCtx.request.headers),
            headersCtx
        )
        if (headers instanceof Response) return headers
        headers = getHeaders(headers, endpoint.config)

        /** onParams hook */
        const paramsCtx = { ...matchCtx, phase: "onParams" as const }
        errorCtx = paramsCtx
        let dynamicParams: any = await runOnParams(endpoint.config.hooks?.onParams, params, paramsCtx)
        if (dynamicParams instanceof Response) return dynamicParams
        dynamicParams = getRouteParams(dynamicParams, endpoint.config)

        /** onSearchParams hook */
        const searchParamsCtx = { ...matchCtx, phase: "onSearchParams" as const }
        errorCtx = searchParamsCtx
        let searchParams: any = await runOnSearchParams(
            endpoint.config.hooks?.onSearchParams,
            new URLSearchParams(url.searchParams.toString()),
            searchParamsCtx
        )
        if (searchParams instanceof Response) return searchParams
        searchParams = getSearchParams(searchParams, endpoint.config)

        /** onBody hook */
        const rawBody = await parseBodyRaw(requestCtx.request)
        const bodyCtx = { ...matchCtx, phase: "onBody" as const }
        errorCtx = bodyCtx
        let body: unknown = await runOnBody(endpoint.config.hooks?.onBody, rawBody, bodyCtx)
        if (body instanceof Response) return body
        body = await getBody(body, endpoint.config)

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
            phase: "onBody",
        }
        errorCtx = context as RequestContext<EndpointMeta<any, any, any>>

        /** Endpoint middlewares (use[]) */
        context = await executeMiddlewares(context, endpoint.config.use)
        errorCtx = context as RequestContext<EndpointMeta<any, any, any>>

        /** onHandler hook */
        context.phase = "onHandler"
        errorCtx = context as RequestContext<EndpointMeta<any, any, any>>
        const onHandlerResult = await runOnHandler(endpoint.config.hooks?.onHandler, context)
        if (onHandlerResult instanceof Response) return onHandlerResult
        context = onHandlerResult
        errorCtx = context as RequestContext<EndpointMeta<any, any, any>>

        /** Route handler */
        const handlerResult = await endpoint.handler(context)
        let response = inferHandlerResponse(handlerResult)

        /** onResponse hook */
        context.phase = "onResponse"
        errorCtx = context as RequestContext<EndpointMeta<any, any, any>>
        response = await runOnResponse(endpoint.config.hooks?.onResponse, response, context)
        response = await runOnResponse(config.hooks?.onResponse as any, response, context)

        return response
    } catch (error) {
        return onError(error as Error, request, config, endpoint?.config?.hooks?.onError, errorCtx)
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
