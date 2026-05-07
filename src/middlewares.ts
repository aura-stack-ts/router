import { RouterError } from "./error.ts"
import type {
    EndpointConfig,
    GlobalMiddlewareContext,
    MiddlewareFunction,
    RequestContext,
    RoutePattern,
    RouterConfig,
} from "./types.ts"

/**
 * Executes the middlewares in sequence, passing the request to each middleware.
 *
 * @param request - Original request made from the client
 * @param middlewares - Array of global middleware functions to be executed
 * @returns - The modified context after all middlewares have been executed
 */
export const executeGlobalMiddlewares = async (context: GlobalMiddlewareContext, use: RouterConfig["use"]) => {
    if (!use) return context
    for (const middleware of use) {
        if (typeof middleware !== "function") {
            throw new RouterError("BAD_REQUEST", "Global middlewares must be functions")
        }
        const executed = await middleware(context)
        if (executed instanceof Response) {
            return executed
        }
        context = executed
    }
    if (!context || !(context.request instanceof Request)) {
        throw new RouterError("BAD_REQUEST", "Global middleware must return a Request or Response object")
    }
    return context
}

/**
 * Executes middlewares in sequence, passing the request and context to each middleware.
 *
 * @param request - Original request made from the client
 * @param context - Context object of the endpoint functionality
 * @param middlewares - Array of middleware functions to be executed
 * @returns The modified context after all middlewares have been executed
 */
//export const executeMiddlewares = async <const RouteParams extends Record<string, string>, const Config extends EndpointConfig>(
export const executeMiddlewares = async <
    Route extends RoutePattern,
    const Config extends EndpointConfig<Route, any> = EndpointConfig<Route, any>,
>(
    context: RequestContext<Route, { schemas: Config["schemas"] }>,
    use: MiddlewareFunction<Route, { schemas: Config["schemas"] }>[] = []
): Promise<RequestContext<Route, { schemas: Config["schemas"] }>> => {
    try {
        let ctx = context
        for (const middleware of use) {
            if (typeof middleware !== "function") {
                throw new RouterError("BAD_REQUEST", "Middleware must be a function")
            }
            try {
                ctx = (await middleware(ctx)) as RequestContext<Route, { schemas: Config["schemas"] }>
            } catch (error) {
                if (error instanceof RouterError) throw error
                throw new RouterError("BAD_REQUEST", "Handler threw an error", "MiddlewareError")
            }
        }
        return ctx
    } catch {
        throw new RouterError("BAD_REQUEST", "Handler threw an error")
    }
}
