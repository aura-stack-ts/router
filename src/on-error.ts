import { isInvalidZodSchemaError, isRouterError } from "./assert.ts"
import { runOnError } from "@/hooks.ts"
import { json } from "@/context.ts"
import type {
    RouterConfig,
    RequestHookContext,
    MatchHookContext,
    RequestContext,
    EndpointMeta,
    OnErrorHook,
} from "@/@types/index.ts"
import { type RouterError, statusText } from "@/error.ts"

/**
 * Handles errors thrown during request processing by routing through:
 * 1. Endpoint-level `onError` hook (if defined)
 * 2. Global `RouterConfig.hooks.onError` hook (if defined)
 * 3. Legacy `RouterConfig.onError` callback (backward-compat, if defined)
 * 4. Default built-in error responses
 */
export const onError = async (
    error: unknown,
    request: Request,
    config: RouterConfig,
    endpointOnError?: OnErrorHook<any>,
    ctx?: RequestHookContext | MatchHookContext<any> | RequestContext<EndpointMeta<any, any, any>>
): Promise<Response> => {
    const errorCtx = ctx ?? ({ request, context: config.context ?? {}, json } satisfies RequestHookContext)
    const normalizedError = error instanceof Error ? error : new Error(String(error))

    if (endpointOnError) {
        try {
            return (
                (await runOnError(endpointOnError, normalizedError as Error | RouterError, errorCtx)) ??
                handleDefaultError(error, request, config)
            )
        } catch {
            return criticalFailure()
        }
    }

    if (config.hooks?.onError) {
        try {
            return (
                (await runOnError(config.hooks.onError, normalizedError as Error | RouterError, errorCtx)) ??
                handleDefaultError(error, request, config)
            )
        } catch {
            return criticalFailure()
        }
    }

    // Legacy config.onError (backward-compatible)
    if (config.onError) {
        try {
            return await config.onError(normalizedError as Error | RouterError, request)
        } catch {
            return criticalFailure()
        }
    }

    return handleDefaultError(error, request, config)
}

const handleDefaultError = (error: unknown, _request: Request, _config: RouterConfig): Response => {
    if (isInvalidZodSchemaError(error)) {
        const { errors, status, statusText: st } = error
        return Response.json(
            { message: "Invalid request data", error: "validation_error", details: errors },
            { status, statusText: st }
        )
    }
    if (isRouterError(error)) {
        const { message, status, statusText: st } = error
        return Response.json({ message }, { status, statusText: st })
    }
    return Response.json({ message: "Internal Server Error" }, { status: 500, statusText: statusText.INTERNAL_SERVER_ERROR })
}

const criticalFailure = (): Response =>
    Response.json(
        { message: "A critical failure occurred during error handling" },
        { status: 500, statusText: statusText.INTERNAL_SERVER_ERROR }
    )
