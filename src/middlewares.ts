import { RouterError } from "./error.js"
import type { EndpointConfig, MiddlewareFunction, RequestContext, RouterConfig } from "./types.js"

/**
 * Executes the middlewares in sequence, passing the request to each middleware.
 *
 * @param request - Original request made from the client
 * @param middlewares - Array of global middleware functions to be executed
 * @returns - The modified request after all middlewares have been executed
 */
export const executeGlobalMiddlewares = async (request: Request, middlewares: RouterConfig["middlewares"]) => {
    if (!middlewares) return request
    for (const middleware of middlewares) {
        if (typeof middleware !== "function") {
            throw new RouterError("BAD_REQUEST", "Global middlewares must be functions")
        }
        const executed = await middleware(request)
        if (executed instanceof Response) {
            return executed
        }
        request = executed
    }
    if (!request || !(request instanceof Request)) {
        throw new RouterError("BAD_REQUEST", "Global middleware must return a Request or Response object")
    }
    return request
}

/**
 * Executes middlewares in sequence, passing the request and context to each middleware.
 *
 * @param request - Original request made from the client
 * @param context - Context object of the endpoint functionality
 * @param middlewares - Array of middleware functions to be executed
 * @returns The modified context after all middlewares have been executed
 */
export const executeMiddlewares = async <const RouteParams extends Record<string, string>, const Config extends EndpointConfig>(
    context: RequestContext<RouteParams, Config>,
    middlewares: MiddlewareFunction<RouteParams, Config>[] = []
): Promise<RequestContext<RouteParams, Config>> => {
    try {
        let ctx = context
        for (const middleware of middlewares) {
            if (typeof middleware !== "function") {
                throw new RouterError("BAD_REQUEST", "Middleware must be a function")
            }
            ctx = (await middleware(ctx)) as RequestContext<RouteParams, Config>
        }
        return ctx
    } catch {
        throw new RouterError("BAD_REQUEST", "Handler threw an error")
    }
}
