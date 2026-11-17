import { AuraRouterError } from "@/error.ts"
import { isValidMethod, SUPPORTED_BODY_METHODS, SUPPORTED_HTTP_METHODS } from "@/assert.ts"
import type { HTTPMethod } from "@/@types/types.ts"

export const getAllowedMethods = (allowedMethods: string[] = []) => {
    for (const method of allowedMethods) {
        if (!isValidMethod(method)) {
            throw new AuraRouterError({
                code: "INVALID_METHOD_DEFINITION",
                message: `Invalid HTTP method "${method}" in "allowedMethods". Methods must be RFC 9110 tokens.`,
            })
        }
    }
    return new Set<HTTPMethod>([...SUPPORTED_HTTP_METHODS, ...allowedMethods])
}

export const getAlllowedMethodsWithBody = (allowedMethods: string[] = []) => {
    return new Set<HTTPMethod>([...SUPPORTED_BODY_METHODS, ...allowedMethods])
}
