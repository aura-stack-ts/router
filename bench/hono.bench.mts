import type { HTTPMethod, RouteEndpoint } from "@/types.ts"
import { TrieRouter } from "@/trie.ts"
import { createRouter } from "@/router.ts"
import { run, bench, summary } from "mitata"

export const routes: Pick<RouteEndpoint, "method" | "route">[] = [
    { method: "GET", route: "/user" },
    { method: "GET", route: "/user/comments" },
    { method: "GET", route: "/user/avatar" },
    { method: "GET", route: "/user/lookup/username/:username" },
    { method: "GET", route: "/user/lookup/email/:address" },
    { method: "GET", route: "/event/:id" },
    { method: "GET", route: "/event/:id/comments" },
    { method: "POST", route: "/event/:id/comment" },
    { method: "GET", route: "/map/:location/events" },
    { method: "GET", route: "/status" },
    { method: "GET", route: "/very/deeply/nested/route/hello/there" },
]

export const requests: (Pick<RouteEndpoint, "method" | "route"> & { name: string })[] = [
    {
        name: "short static",
        method: "GET",
        route: "/user",
    },
    {
        name: "static with same radix",
        method: "GET",
        route: "/user/comments",
    },
    {
        name: "dynamic route",
        method: "GET",
        route: "/user/lookup/username/hey",
    },
    {
        name: "mixed static dynamic",
        method: "GET",
        route: "/event/abcd1234/comments",
    },
    {
        name: "post",
        method: "POST",
        route: "/event/abcd1234/comment",
    },
    {
        name: "long static",
        method: "GET",
        route: "/very/deeply/nested/route/hello/there",
    },
    {
        name: "wildcard",
        method: "GET",
        route: "/static/index.html",
    },
]
const trieRouter = new TrieRouter()

summary(() => {
    bench("createRouter insert", () => {
        createRouter(routes as RouteEndpoint[])
    })

    bench("TrieRouter insert", () => {
        routes.forEach((route) => trieRouter.add({ method: route.method, route: route.route } as RouteEndpoint))
    })
})

summary(() => {
    bench("createRouter match", () => {
        const basicRouter = createRouter(routes as RouteEndpoint[])
        requests.forEach((route) => {
            if (route.method === "GET") {
                basicRouter.GET(new Request(`http://localhost:3000/${route.route}`))
            } else if (route.method === "POST") {
                basicRouter.POST(new Request(`http://localhost:3000/${route.route}`))
            }
        })
    })

    bench("TrieRouter match", () => {
        requests.forEach((route) => {
            trieRouter.match(route.method as HTTPMethod, route.route)
        })
    })
})

await run()
