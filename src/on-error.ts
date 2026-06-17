import { isAuraRouterError, isAuraRouterValidationError } from "./assert.ts"
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
import { AuraRouterError, AuraRouterValidationError, statusText } from "@/error.ts"

/**
 * Handles errors thrown during request processing by routing through:
 * 1. Endpoint-level `onError` hook (if defined)
 * 2. Global `RouterConfig.hooks.onError` hook (if defined)
 * 3. Legacy `RouterConfig.onError` callback (backward-compat, if defined)
 * 4. Default built-in error responses
 */
export const onError = async (
    error: Error | AuraRouterError | AuraRouterValidationError,
    request: Request,
    config: RouterConfig,
    endpointOnError?: OnErrorHook<any>,
    ctx?: RequestHookContext | MatchHookContext<any> | RequestContext<EndpointMeta<any, any, any>>
): Promise<Response> => {
    const errorCtx = ctx ?? ({ request, context: config.context ?? {}, json } satisfies RequestHookContext)

    if (endpointOnError) {
        try {
            return (await runOnError(endpointOnError, error, errorCtx)) ?? handleDefaultError(error, request, config)
        } catch {
            return criticalFailure()
        }
    }

    if (config.hooks?.onError) {
        try {
            return (await runOnError(config.hooks.onError, error, errorCtx)) ?? handleDefaultError(error, request, config)
        } catch {
            return criticalFailure()
        }
    }

    // Legacy config.onError (backward-compatible)
    if (config.onError) {
        try {
            return await config.onError(error, request)
        } catch {
            return criticalFailure()
        }
    }

    return handleDefaultError(error, request, config)
}

const handleDefaultError = (error: unknown, _request: Request, _config: RouterConfig): Response => {
    if (isAuraRouterValidationError(error)) {
        return error.toResponse()
    }
    if (isAuraRouterError(error)) {
        return error.toResponse()
    }
    return criticalFailure()
}

const criticalFailure = (): Response =>
    Response.json(
        {
            type: "INTERNAL_SERVER_ERROR",
            code: "INTERNAL_SERVER_ERROR",
            message: "A critical failure occurred during error handling",
        },
        { status: 500, statusText: statusText.INTERNAL_SERVER_ERROR }
    )
