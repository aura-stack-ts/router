import { TrieRouter } from "./trie.ts"
import { onError } from "./on-error.ts"
import { RouterError } from "./error.ts"
import { HeadersBuilder } from "./headers.ts"
import { isSupportedMethod } from "./assert.ts"
import { getBody, getRouteParams, getSearchParams } from "./context.ts"
import { executeGlobalMiddlewares, executeMiddlewares } from "./middlewares.ts"
import type { GetHttpHandlers, GlobalContext, HTTPMethod, RouteEndpoint, RoutePattern, RouterConfig, Router } from "./types.ts"

const handleRequest = async (method: HTTPMethod, request: Request, config: RouterConfig, router: TrieRouter) => {
    try {
        if (!isSupportedMethod(request.method)) {
            throw new RouterError("METHOD_NOT_ALLOWED", `The HTTP method '${request.method}' is not supported`)
        }
        const globalContext = { request, context: config.context ?? ({} as GlobalContext) }
        const globalRequestContext = await executeGlobalMiddlewares(globalContext, config.use)

        if (globalRequestContext instanceof Response) return globalRequestContext

        const url = new URL(globalRequestContext.request.url)
        const pathnameWithBase = url.pathname
        if (globalRequestContext.request.method !== method) {
            throw new RouterError("METHOD_NOT_ALLOWED", `The HTTP method '${globalRequestContext.request.method}' is not allowed`)
        }
        const node = router.match(method, pathnameWithBase)
        if (!node) {
            throw new RouterError("NOT_FOUND", `No route found for path: ${pathnameWithBase}`)
        }
        const { endpoint, params } = node
        const dynamicParams = getRouteParams(params, endpoint.config)
        const body = await getBody(globalRequestContext.request, endpoint.config)
        const searchParams = getSearchParams(globalRequestContext.request.url, endpoint.config)
        const headers = new HeadersBuilder(globalRequestContext.request.headers)
        let context = {
            params: dynamicParams,
            searchParams,
            headers,
            body,
            request: globalRequestContext.request,
            url,
            method: globalRequestContext.request.method,
            route: endpoint.route,
            context: config.context ?? ({} as GlobalContext),
        }
        context = await executeMiddlewares(context, endpoint.config.use)
        const response = await endpoint.handler(context)
        return response
    } catch (error) {
        return onError(error, request, config)
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
export const createRouter = <const Endpoints extends RouteEndpoint[]>(
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
    return server
}
