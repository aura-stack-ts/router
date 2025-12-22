import { RouterError, statusText } from "./error.js"
import { isInvalidZodSchemaError, isRouterError, isSupportedMethod } from "./assert.js"
import { executeGlobalMiddlewares, executeMiddlewares } from "./middlewares.js"
import { getBody, getHeaders, getRouteParams, getSearchParams } from "./context.js"
import type { GetHttpHandlers, GlobalContext, HTTPMethod, RouteEndpoint, RoutePattern, RouterConfig } from "./types.js"

interface TrieNode {
    statics: Map<string, TrieNode>
    param?: { name: string; node: TrieNode }
    endpoints: Map<HTTPMethod, RouteEndpoint>
}

export const createNode = (): TrieNode => ({
    statics: new Map(),
    endpoints: new Map(),
})

export const insert = (root: TrieNode, endpoint: RouteEndpoint) => {
    if (!root || !endpoint) return
    let node = root
    const segments = endpoint.route === "/" ? [] : endpoint.route.split("/").filter(Boolean)
    for (const segment of segments) {
        if (segment.startsWith(":")) {
            const name = segment.slice(1)
            if (!node.param) {
                node.param = { name, node: createNode() }
            } else if (node.param.name !== name) {
                throw new RouterError(
                    "BAD_REQUEST",
                    `Conflicting in the route by the dynamic segment "${node.param.name}" and "${name}"`
                )
            }
            node = node.param.node
        } else {
            if (!node.statics.has(segment)) {
                node.statics.set(segment, createNode())
            }
            node = node.statics.get(segment)!
        }
    }
    if (node.endpoints.has(endpoint.method)) {
        throw new RouterError("BAD_REQUEST", `Duplicate endpoint for ${endpoint?.method} ${endpoint?.route}`)
    }
    node.endpoints.set(endpoint.method, endpoint)
}

export const search = (method: HTTPMethod, root: TrieNode, pathname: string) => {
    let node = root
    const params = {} as Record<string, string>
    const segments = pathname === "/" ? [] : pathname.split("/").filter(Boolean)
    for (const segment of segments) {
        if (node?.statics.has(segment)) {
            node = node.statics.get(segment)!
        } else if (node?.param) {
            params[node.param.name] = decodeURIComponent(segment)
            node = node.param.node
        } else {
            throw new RouterError("NOT_FOUND", `No route found for path: ${pathname}`)
        }
    }
    if (!node.endpoints.has(method)) {
        throw new RouterError("NOT_FOUND", `No route found for path: ${pathname}`)
    }
    return { endpoint: node.endpoints.get(method)!, params }
}

const handleError = async (error: unknown, request: Request, config: RouterConfig) => {
    if (config.onError) {
        try {
            const response = await config.onError(error as Error | RouterError, request)
            return response
        } catch {
            return Response.json(
                { message: "A critical failure occurred during error handling" },
                { status: 500, statusText: statusText.INTERNAL_SERVER_ERROR }
            )
        }
    }
    if (isInvalidZodSchemaError(error)) {
        const { errors, status, statusText } = error
        return Response.json(
            {
                message: "Invalid request data",
                error: "validation_error",
                details: errors,
            },
            { status, statusText }
        )
    }
    if (isRouterError(error)) {
        const { message, status, statusText } = error
        return Response.json({ message }, { status, statusText })
    }
    return Response.json({ message: "Internal Server Error" }, { status: 500, statusText: statusText.INTERNAL_SERVER_ERROR })
}

const handleRequest = async (method: HTTPMethod, request: Request, config: RouterConfig, root: TrieNode) => {
    try {
        if (!isSupportedMethod(request.method)) {
            throw new RouterError("METHOD_NOT_ALLOWED", `The HTTP method '${request.method}' is not supported`)
        }
        const globalContext = { request, context: config.context ?? ({} as GlobalContext) }
        const globalRequestContext = await executeGlobalMiddlewares(globalContext, config.middlewares)

        if (globalRequestContext instanceof Response) return globalRequestContext

        const url = new URL(globalRequestContext.request.url)
        const pathnameWithBase = url.pathname
        if (globalRequestContext.request.method !== method) {
            throw new RouterError("METHOD_NOT_ALLOWED", `The HTTP method '${globalRequestContext.request.method}' is not allowed`)
        }
        const { endpoint, params } = search(method, root, pathnameWithBase)
        if (endpoint.method !== globalRequestContext.request.method) {
            throw new RouterError("METHOD_NOT_ALLOWED", `The HTTP method '${globalRequestContext.request.method}' is not allowed`)
        }
        const dynamicParams = getRouteParams(params, endpoint.config)
        const body = await getBody(globalRequestContext.request, endpoint.config)
        const searchParams = getSearchParams(globalRequestContext.request.url, endpoint.config)
        const headers = getHeaders(globalRequestContext.request)
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
        context = await executeMiddlewares(context, endpoint.config.middlewares)
        const response = await endpoint.handler(context)
        return response
    } catch (error) {
        return handleError(error, request, config)
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
): GetHttpHandlers<Endpoints> => {
    const root = createNode()
    const server = {} as GetHttpHandlers<Endpoints>
    const methods = new Set<HTTPMethod>()
    for (const endpoint of endpoints) {
        const withBasePath = config.basePath ? `${config.basePath}${endpoint.route}` : endpoint.route
        insert(root, { ...endpoint, route: withBasePath as RoutePattern })
        methods.add(endpoint.method)
    }
    for (const method of methods) {
        server[method as keyof typeof server] = (request: Request) => handleRequest(method, request, config, root)
    }
    return server
}
