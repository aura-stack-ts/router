import { RouterError } from "@/error.ts"
import type { RouteEndpoint, HTTPMethod } from "@/types.ts"

export class TrieNode {
    public param?: { name: string; node: TrieNode } | undefined
    public statics: Map<string, TrieNode> = new Map()
    public endpoints: Map<HTTPMethod, RouteEndpoint> = new Map()
}

export class TrieRouter {
    private root: TrieNode
    private statics: Map<string, RouteEndpoint>
    private methods: Set<HTTPMethod>

    constructor() {
        this.statics = new Map()
        this.methods = new Set()
        this.root = new TrieNode()
    }

    add(endpoint: RouteEndpoint) {
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
                            param = { name: name, node: new TrieNode() }
                            node.param = param
                        } else if (param.name !== name) {
                            throw new RouterError(
                                "BAD_REQUEST",
                                `Conflicting in the route by the dynamic segment "${param.name}" and "${name}"`
                            )
                        }
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

    match(method: HTTPMethod, pathname: string) {
        const staticEndpoint = this.statics.get(`${method} ${pathname}`)
        if (staticEndpoint) {
            return { endpoint: staticEndpoint, params: {} }
        }
        let node = this.root
        const params = {} as Record<string, string>
        const pathLength = pathname.length
        let prev = 0
        while (prev < pathLength) {
            const curr = pathname.indexOf("/", prev)
            const end = curr === -1 ? pathLength : curr
            if (end > prev) {
                const segment = pathname.slice(prev, end)
                const staticNode = node.statics.get(segment)
                if (staticNode) {
                    node = staticNode
                } else {
                    const param = node.param
                    if (!param) {
                        return null
                    }
                    params[param.name] = decodeURIComponent(segment)
                    node = param.node
                }
            }
            if (curr === -1) {
                break
            }
            prev = curr + 1
        }
        const endpoint = node.endpoints.get(method)
        if (!endpoint) {
            return null
        }
        return { endpoint, params }
    }
}
