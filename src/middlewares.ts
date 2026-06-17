import { AuraRouterError } from "@/error.ts"
import type {
    EndpointMeta,
    EndpointSchemas,
    GlobalMiddlewareContext,
    HTTPMethod,
    MiddlewareFunction,
    RequestContext,
    RoutePattern,
    RouterConfig,
} from "@/@types/index.ts"
import { isAuraRouterError } from "./assert.ts"

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
            throw new AuraRouterError({ code: "INVALID_GLOBAL_MIDDLEWARE_DEFINITION" })
        }
        const executed = await middleware(context)
        if (executed instanceof Response) {
            return executed
        }
        context = executed
    }
    if (!context || !(context.request instanceof Request)) {
        throw new AuraRouterError({ code: "INVALID_GLOBAL_MIDDLEWARE_DEFINITION" })
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
export const executeMiddlewares = async <
    Route extends RoutePattern,
    Method extends HTTPMethod | HTTPMethod[],
    Config extends EndpointSchemas = EndpointSchemas,
>(
    context: RequestContext<EndpointMeta<Route, Method, Config>>,
    use: MiddlewareFunction<Route, Method, Config>[] = []
) => {
    try {
        let ctx = context
        for (const middleware of use) {
            if (typeof middleware !== "function") {
                throw new AuraRouterError({ code: "INVALID_ENDPOINT_MIDDLEWARE_DEFINITION" })
            }
            try {
                ctx = (await middleware(ctx)) as RequestContext<EndpointMeta<Route, Method, Config>>
            } catch (error) {
                if (isAuraRouterError(error)) throw error
                throw new AuraRouterError({ code: "INVALID_ENDPOINT_MIDDLEWARE_DEFINITION", cause: error })
            }
        }
        return ctx
    } catch (error) {
        if (isAuraRouterError(error)) throw error
        throw new AuraRouterError({ code: "INVALID_HANDLER_DEFINITION", cause: error })
    }
}
