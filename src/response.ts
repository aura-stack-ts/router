import { json as builtInJson } from "@/context.ts"
import type { JsonResponse } from "@/types.ts"

export class AuraResponse extends Response {
    static json<T>(data: T, init?: ResponseInit): JsonResponse<T> {
        return builtInJson(data, init)
    }
}
