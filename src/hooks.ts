import type {
    EndpointMeta,
    MatchHookContext,
    OnBodyHook,
    OnErrorHook,
    OnHandlerHook,
    OnMatchHook,
    OnParamsHook,
    OnRequestHook,
    OnResponseHook,
    OnSearchParamsHook,
    RequestContext,
    RequestHookContext,
} from "@/@types/index.ts"
import type { RouterError } from "@/error.ts"

/**
 * Runs a hook if it is defined. The hook can:
 * - Return `void` or `undefined` → pass-through (returns the provided fallback)
 * - Return a `Response`          → short-circuit signal (caller must check with isResponse())
 * - Return a new value           → replaces the current value
 */
const runHook = async <T>(hook: ((...args: any[]) => any) | undefined, args: unknown[], fallback: T): Promise<T | Response> => {
    if (!hook) return fallback
    const result = await hook(...args)
    if (result === undefined || result === null) return fallback
    return result as T | Response
}

/**
 * Runs the `onRequest` hook. Fires when a raw request arrives, before global
 * middlewares and route matching.
 *
 * @returns The (possibly modified) `RequestHookContext`, or a `Response` to short-circuit.
 */
export const runOnRequest = async (
    hook: OnRequestHook | undefined,
    ctx: RequestHookContext
): Promise<RequestHookContext | Response> => {
    return runHook(hook, [ctx], ctx)
}

/**
 * Runs the `onMatch` hook. Fires after a route has been matched, before
 * params/body extraction.
 *
 * @returns The (possibly modified) `MatchHookContext`, or a `Response` to short-circuit.
 */
export const runOnMatch = async (
    hook: OnMatchHook<any> | undefined,
    ctx: MatchHookContext<any>
): Promise<MatchHookContext<any> | Response> => {
    return runHook(hook, [ctx], ctx)
}

/**
 * Runs the `onParams` hook, which **replaces** `getRouteParams()`.
 * Receives the raw trie-matched params (no schema validation).
 *
 * @returns The (possibly modified) params record, or a `Response` to short-circuit.
 *          If the hook returns `void`, the raw params are used as-is.
 */
export const runOnParams = async (
    hook: OnParamsHook<any, any> | undefined,
    params: Record<string, string>,
    ctx: MatchHookContext<any>
): Promise<Record<string, unknown> | Response> => {
    return runHook(hook, [{ ...ctx, params }], params)
}

/**
 * Runs the `onSearchParams` hook, which **replaces** `getSearchParams()`.
 * Receives raw `URLSearchParams` (no schema validation).
 *
 * @returns The (possibly modified) search params (object or URLSearchParams),
 *          or a `Response` to short-circuit.
 *          If the hook returns `void`, the raw URLSearchParams are used as-is.
 */
export const runOnSearchParams = async (
    hook: OnSearchParamsHook<any> | undefined,
    searchParams: URLSearchParams,
    ctx: MatchHookContext<any>
): Promise<Record<string, unknown> | URLSearchParams | Response> => {
    return runHook(hook, [{ ...ctx, searchParams }], searchParams)
}

/**
 * Runs the `onBody` hook, which **replaces** schema validation in `getBody()`.
 * Receives the content-type-parsed body without schema validation.
 *
 * @returns The (possibly modified) body value, or a `Response` to short-circuit.
 *          If the hook returns `void`, the raw parsed body is used as-is.
 */
export const runOnBody = async (
    hook: OnBodyHook<any> | undefined,
    body: unknown,
    ctx: MatchHookContext<any>
): Promise<unknown | Response> => {
    return runHook(hook, [{ ...ctx, body }], body)
}

/**
 * Runs the `onHandler` hook. Fires just before the route handler is called,
 * after all middlewares have run.
 *
 * @returns The (possibly modified) `RequestContext`, or a `Response` to short-circuit.
 *          If the hook returns `void`, the context is passed through unchanged.
 */
export const runOnHandler = async <Meta extends EndpointMeta<any, any, any>>(
    hook: OnHandlerHook<Meta> | undefined,
    ctx: RequestContext<Meta>
): Promise<RequestContext<Meta> | Response> => {
    return runHook(hook, [ctx], ctx)
}

/**
 * Runs the `onResponse` hook. Fires after the handler returns a response.
 * Always receives and must return a `Response`.
 *
 * @returns The (possibly transformed) `Response`.
 */
export const runOnResponse = async <Meta extends EndpointMeta<any, any, any>>(
    hook: OnResponseHook<Meta> | undefined,
    response: Response,
    ctx: RequestContext<Meta>
): Promise<Response> => {
    if (!hook) return response
    const result = await hook({ ...ctx, response })
    return result ?? response
}

/**
 * Runs the `onError` hook. Fires when any error is thrown during the request pipeline.
 *
 * @returns A `Response` if the hook handled the error, or `null` if no hook was defined.
 */
export const runOnError = async (
    hook: OnErrorHook<any> | undefined,
    error: Error | RouterError,
    ctx: RequestHookContext | MatchHookContext<any> | RequestContext<EndpointMeta<any, any, any>>
): Promise<Response | null> => {
    if (!hook) return null
    return hook({ ...ctx, error })
}
