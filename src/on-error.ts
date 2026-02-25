import { isInvalidZodSchemaError, isRouterError } from "./assert.ts"
import type { RouterConfig } from "@/types.ts"
import { type RouterError, statusText } from "@/error.ts"

export const onError = async (error: unknown, request: Request, config: RouterConfig) => {
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
