import { AuraRouterError } from "@/error.ts"
import type { RouteEndpoint, HTTPMethod } from "@/@types/index.ts"

export class TrieNode {
    public param?: { name: string; node: TrieNode } | undefined
    public statics: Map<string, TrieNode> = new Map()
    public endpoints: Map<HTTPMethod, RouteEndpoint<any, any, any, any>> = new Map()
}

export type TrieMatchReturn =
    | { success: true; endpoint: RouteEndpoint<any, any, any, any>; params: Record<string, string> }
    | { success: false; code: "NOT_FOUND" }
    | { success: false; code: "METHOD_NOT_ALLOWED"; allowedMethods: HTTPMethod[] }

export class TrieRouter {
    private root: TrieNode
    private statics: Map<string, RouteEndpoint<any, any, any, any>>
    private methods: Set<HTTPMethod>

    constructor() {
        this.statics = new Map()
        this.methods = new Set()
        this.root = new TrieNode()
    }

    add(endpoint: RouteEndpoint<any, any, any, any>) {
        const isDynamic = endpoint.route.includes(":")
        const methods = Array.isArray(endpoint.method) ? endpoint.method : [endpoint.method]
        if (!isDynamic) {
            for (const method of methods) {
                this.statics.set(`${method} ${endpoint.route}`, endpoint)
            }
        } else {
            let node = this.root
            const route = endpoint.route
            const routeLength = route.length
            const params = new Set<string>()
            let prev = 0
            while (prev < routeLength) {
                const curr = route.indexOf("/", prev)
                const end = curr === -1 ? routeLength : curr

                if (end > prev) {
                    const segment = route.slice(prev, end)
                    if (segment[0] === ":") {
                        const name = segment.slice(1)
                        let param = node.param
                        if (!param) {
                            if (params.has(name)) {
                                throw new AuraRouterError({
                                    code: "CONFLICTING_DYNAMIC_SEGMENT",
                                    message: `Duplicate parameter '${name}' found in route '${route}'. Route parameters must have unique names.`,
                                })
                            }
                            param = { name, node: new TrieNode() }
                            node.param = param
                        } else if (param.name !== name) {
                            throw new AuraRouterError({
                                code: "CONFLICTING_DYNAMIC_SEGMENT",
                                message: `Conflicting dynamic segments discovered in route "${endpoint.route}". Existing param "${param.name}" conflicts with incoming param "${name}".`,
                            })
                        }
                        params.add(name)
                        node = param.node
                    } else {
                        let child = node.statics.get(segment)
                        if (!child) {
                            child = new TrieNode()
                            node.statics.set(segment, child)
                        }
                        node = child
                    }
                }
                if (curr === -1) {
                    break
                }
                prev = curr + 1
            }
            for (const method of methods) {
                node.endpoints.set(method, endpoint)
            }
        }
        for (const method of methods) {
            this.methods.add(method)
        }
    }

    private safeDecode(segment: string): string | null {
        try {
            return decodeURIComponent(segment)
        } catch {
            throw new AuraRouterError({ code: "BAD_REQUEST" })
        }
    }

    private walk(
        node: TrieNode,
        path: string,
        start: number,
        method: HTTPMethod,
        params: Record<string, string>,
        allowed: Set<HTTPMethod>
    ): RouteEndpoint<any, any, any, any> | null {
        const length = path.length

        while (start < length && path.codePointAt(start) === 47) {
            start++
        }

        if (start >= length) {
            const endpoint = node.endpoints.get(method)
            if (endpoint) return endpoint
            for (const m of node.endpoints.keys()) allowed.add(m)
            return null
        }

        const slash = path.indexOf("/", start)
        const end = slash === -1 ? length : slash
        const next = slash === -1 ? length : slash + 1
        const segment = path.slice(start, end)

        const staticNode = node.statics.get(segment)
        if (staticNode) {
            const found = this.walk(staticNode, path, next, method, params, allowed)
            if (found) return found
        }

        const param = node.param
        if (param) {
            const value = this.safeDecode(segment)
            if (value === null) return null
            params[param.name] = value
            const found = this.walk(param.node, path, next, method, params, allowed)
            if (found) return found
            delete params[param.name]
        }

        return null
    }

    match(method: HTTPMethod, pathname: string): TrieMatchReturn {
        const staticEndpoint = this.statics.get(`${method} ${pathname}`)
        if (staticEndpoint) {
            return { success: true, endpoint: staticEndpoint, params: {} as Record<string, string> }
        }
        const allowed = new Set<HTTPMethod>()
        const params: Record<string, string> = {}
        const endpoint = this.walk(this.root, pathname, 0, method, params, allowed)
        if (endpoint) {
            return { success: true, endpoint, params }
        }
        for (const m of this.methods) {
            if (this.statics.has(`${m} ${pathname}`)) allowed.add(m)
        }
        if (allowed.size === 0) {
            return { success: false, code: "NOT_FOUND" }
        }
        return { success: false, code: "METHOD_NOT_ALLOWED", allowedMethods: [...allowed] }
    }
}
