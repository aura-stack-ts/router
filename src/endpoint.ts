import { RouterError } from "./error.js"
import { isSupportedMethod, isValidHandler, isValidRoute } from "./assert.js"
import type { EndpointConfig, EndpointSchemas, HTTPMethod, RouteEndpoint, RouteHandler, RoutePattern } from "./types.js"
import { ZodObject } from "zod"

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
    const Method extends Uppercase<HTTPMethod>,
    const Route extends RoutePattern,
    const Schemas extends EndpointSchemas,
>(
    method: Method,
    route: Route,
    handler: RouteHandler<Route, { schemas: Schemas }>,
    config: EndpointConfig<Route, Schemas> = {} as EndpointConfig<Route, Schemas>
): RouteEndpoint<Method, Route, { schemas?: Schemas }> => {
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
 *   middlewares: [myMiddleware],
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
 *   middlewares: [myMiddleware],
 * })
 *
 * const getUser = createEndpoint("GET", "/users/:userId", async (request, ctx) => {
 *   return new Response("User details");
 * }, config);
 */
export function createEndpointConfig<Schemas extends EndpointSchemas>(
    config: EndpointConfig<RoutePattern, Schemas>
): EndpointConfig<RoutePattern, Schemas>

export function createEndpointConfig<Route extends RoutePattern, Schemas extends EndpointSchemas>(
    route: Route,
    config: EndpointConfig<Route, Schemas>
): EndpointConfig<Route, Schemas>

export function createEndpointConfig(...args: unknown[]) {
    if (typeof args[0] === "string") return args[1]
    return args[0]
}
