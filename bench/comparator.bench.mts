import type { RouteEndpoint } from "@/types.ts"
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

export const calls: (Pick<RouteEndpoint, "method" | "route"> & { name: string })[] = [
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
]

const benchEndpoints: RouteEndpoint[] = routes.map((route) => ({
    ...route,
    handler: () => new Response(null, { status: 204 }),
    config: {},
}))

summary(() => {
    bench("createRouter insert", () => {
        createRouter(benchEndpoints)
    })
})

const basicRouter = createRouter(benchEndpoints)

summary(() => {
    bench("createRouter match", async () => {
        for (const route of calls) {
            if (route.method === "GET") {
                await basicRouter.GET(new Request(`http://localhost:3000${route.route}`))
            } else if (route.method === "POST") {
                await basicRouter.POST(new Request(`http://localhost:3000${route.route}`))
            }
        }
    })
})

await run()
