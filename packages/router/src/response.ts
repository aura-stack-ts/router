import type { JsonResponse } from "@/@types/index.ts"

export class AuraResponse extends Response {
    static json<T>(data: T, init?: ResponseInit): JsonResponse<T> {
        const body = JSON.stringify(data)
        const headers = new Headers(init?.headers)
        if (!headers.has("content-type")) headers.set("content-type", "application/json")
        return new AuraResponse(body, { ...init, headers }) as unknown as JsonResponse<T>
    }
}
