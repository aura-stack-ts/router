import { RouterError } from "@/error.ts"
import { isSupportedMethod, isValidHandler, isValidRoute } from "@/assert.ts"
import type {
    EndpointConfig,
    EndpointSchemas,
    HTTPMethod,
    RouteEndpoint,
    RouteHandler,
    RouteHandlerReturn,
    RoutePattern,
} from "@/@types/index.ts"

/**
 * Defines an API endpoint for the router by specifying the HTTP method, route pattern,
 * handler function, and optional configuration such as validation schemas or middlewares.
 * Validates all parameters for correctness. The resulting endpoint should be passed
 * to the `createRouter` function.
 *
 * @param method - The HTTP method (e.g., GET, POST, PUT, DELETE, PATCH)
 * @param route - The route pattern to associate with the endpoint (supports dynamic params)
 * @param handler - The function to handle requests matching the method and route
 * @param config - Optional configuration including validation schemas, middlewares, etc.
 * @returns An object representing the configured endpoint
 * @example
 * const signIn = createEndpoint("POST", "/auth/signin", async (req, ctx) => {
 *   return new Response("Signed in");
 * });
 */

export const createEndpoint = <
    const Method extends Uppercase<HTTPMethod> | Uppercase<HTTPMethod>[],
    const Route extends RoutePattern,
    Schemas extends EndpointSchemas,
    Handler extends RouteHandler<Route, Method, { schemas?: Schemas }, RouteHandlerReturn>,
>(
    method: Method,
    route: Route,
    handler: Handler,
    config: EndpointConfig<Route, Method, Schemas> = {} as EndpointConfig<Route, Method, Schemas>
): RouteEndpoint<Route, Method, { schemas?: Schemas }, Handler> => {
    if (!isSupportedMethod(method)) {
        throw new RouterError("METHOD_NOT_ALLOWED", `Unsupported HTTP method: ${method}`)
    }
    if (!isValidRoute(route)) {
        throw new RouterError("BAD_REQUEST", `Invalid route format: ${route}`)
    }
    if (!isValidHandler(handler)) {
        throw new RouterError("BAD_REQUEST", "Handler must be a function")
    }
    return { method, route, handler, config }
}

/**
 * Create an endpoint configuration to be passed to the `createEndpoint` function.
 * This function is primarily for type inference and does not perform any runtime checks.
 *
 * This overload is recommended when the route pattern does not need to be specified explicitly,
 * otherwise use the overload that accepts the route pattern as the first argument.
 *
 * @param config - The endpoint configuration object
 * @returns The same configuration object, typed as EndpointConfig
 * @example
 * // Without route pattern
 * const config = createEndpointConfig({
 *   use: [myMiddleware],
 *   schemas: {
 *     searchParams: z.object({
 *       q: z.string().min(3),
 *     })
 *   }
 * })
 *
 * const search = createEndpoint("GET", "/search", async (request, ctx) => {
 *   return new Response("Search results");
 * }, config);
 *
 * // Overload with route pattern
 * const config = createEndpointConfig("/users/:userId", {
 *   use: [myMiddleware],
 * })
 *
 * const getUser = createEndpoint("GET", "/users/:userId", async (request, ctx) => {
 *   return new Response("User details");
 * }, config);
 */
export function createEndpointConfig<Schemas extends EndpointSchemas>(
    config: EndpointConfig<RoutePattern, HTTPMethod | HTTPMethod[], Schemas>
): EndpointConfig<RoutePattern, HTTPMethod | HTTPMethod[], Schemas>

export function createEndpointConfig<Route extends RoutePattern, Schemas extends EndpointSchemas>(
    route: Route,
    config: EndpointConfig<Route, HTTPMethod | HTTPMethod[], Schemas>
): EndpointConfig<Route, HTTPMethod | HTTPMethod[], Schemas>

export function createEndpointConfig(...args: unknown[]) {
    if (typeof args[0] === "string") return args[1]
    return args[0]
}
