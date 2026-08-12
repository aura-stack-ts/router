import z from "zod"
import * as valibot from "valibot"
import * as typebox from "typebox"
import { type } from "arktype"
import { describe, test } from "vitest"
import { createRouter } from "@/router.ts"
import { createEndpoint, createEndpointConfig } from "@/endpoint.ts"
import type { HTTPMethod, RoutePattern } from "@/@types/index.ts"

describe("createEndpoint", () => {
    describe("With valid configuration", () => {
        const testCases = [
            {
                description: "Create GET endpoint with route",
                method: "GET",
                route: "/users/:userId",
                expected: {
                    method: "GET",
                    route: "/users/:userId",
                    config: {},
                },
            },
            {
                description: "Create POST endpoint with route",
                method: "POST",
                route: "/users",
                expected: {
                    method: "POST",
                    route: "/users",
                    config: {},
                },
            },
            {
                description: "Create DELETE endpoint with route",
                method: "DELETE",
                route: "/users/:userId",
                expected: {
                    method: "DELETE",
                    route: "/users/:userId",
                    config: {},
                },
            },
        ]

        for (const { description, method, route, expected } of testCases) {
            test.concurrent(description, ({ expect }) => {
                const handler: any = () => {}
                const endpoint = createEndpoint(method as HTTPMethod, route as Lowercase<RoutePattern>, handler)
                expect(endpoint).toEqual({ ...expected, handler })
            })
        }
    })

    describe("With invalid configuration", () => {
        const testCases = [
            {
                description: "Throws error for unsupported HTTP method",
                method: "FETCH",
                route: "/users",
                expected:
                    /An endpoint registration was attempted with an invalid or poorly formatted HTTP verb string. Ensure uppercase standard types are used./,
            },
            {
                description: "Throws error for invalid route format",
                method: "GET",
                route: "invalid-route",
                expected:
                    /The designated URL pattern string parsing layout failed regex format checks. Verify base formatting patterns/,
            },
        ]

        for (const { description, method, route, expected } of testCases) {
            test.concurrent(description, ({ expect }) => {
                const handler: any = () => {}
                expect(() => createEndpoint(method as HTTPMethod, route as Lowercase<RoutePattern>, handler, {})).toThrowError(
                    expected
                )
            })
        }
    })

    describe("With schemas", () => {
        describe("With body", () => {
            describe("Zod body schema", () => {
                const endpoint = createEndpoint(
                    "POST",
                    "/auth/credentials",
                    (ctx) => {
                        return Response.json({ body: ctx.body })
                    },
                    {
                        schemas: {
                            body: z.object({
                                username: z.string(),
                                password: z.string(),
                            }),
                        },
                    }
                )
                const { POST } = createRouter([endpoint])

                test("With valid body", async ({ expect }) => {
                    const post = await POST(
                        new Request("https://example.com/auth/credentials", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ username: "John", password: "secret" }),
                        })
                    )
                    expect(post.ok).toBe(true)
                    expect(await post.json()).toEqual({
                        body: { username: "John", password: "secret" },
                    })
                })

                test("With invalid body", async ({ expect }) => {
                    const post = await POST(
                        new Request("https://example.com/auth/credentials", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ username: "John" }),
                        })
                    )
                    expect(post.status).toBe(422)
                    expect(await post.json()).toEqual({
                        type: "VALIDATION",
                        code: "UNPROCESSABLE_ENTITY",
                        message: "The request body or parameter schema layout contains input format errors.",
                        details: {
                            password: {
                                code: "invalid_type",
                                message: "Invalid input: expected string, received undefined",
                            },
                        },
                    })
                    expect(post.statusText).toBe("UNPROCESSABLE_ENTITY")
                })
            })

            describe("Valibot body schema", () => {
                const endpoint = createEndpoint(
                    "POST",
                    "/auth/credentials",
                    (ctx) => {
                        return Response.json({ body: ctx.body })
                    },
                    {
                        schemas: {
                            body: valibot.object({
                                username: valibot.string(),
                                password: valibot.string(),
                            }),
                        },
                    }
                )
                const { POST } = createRouter([endpoint])

                test("With valid body", async ({ expect }) => {
                    const post = await POST(
                        new Request("https://example.com/auth/credentials", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ username: "John", password: "secret" }),
                        })
                    )
                    expect(post.ok).toBe(true)
                    expect(await post.json()).toEqual({
                        body: { username: "John", password: "secret" },
                    })
                })

                test("With invalid body", async ({ expect }) => {
                    const post = await POST(
                        new Request("https://example.com/auth/credentials", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ username: "John" }),
                        })
                    )
                    expect(post.status).toBe(422)
                    expect(await post.json()).toEqual({
                        type: "VALIDATION",
                        code: "UNPROCESSABLE_ENTITY",
                        message: "The request body or parameter schema layout contains input format errors.",
                        details: {
                            password: {
                                code: "schema",
                                message: 'Invalid key: Expected "password" but received undefined',
                            },
                        },
                    })
                    expect(post.statusText).toBe("UNPROCESSABLE_ENTITY")
                })
            })

            describe("Arktype body schema", () => {
                const endpoint = createEndpoint(
                    "POST",
                    "/auth/credentials",
                    (ctx) => {
                        return Response.json({ body: ctx.body })
                    },
                    {
                        schemas: {
                            body: type({
                                username: "string",
                                password: "string",
                            }),
                        },
                    }
                )
                const { POST } = createRouter([endpoint])

                test("With valid body", async ({ expect }) => {
                    const post = await POST(
                        new Request("https://example.com/auth/credentials", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ username: "John", password: "secret" }),
                        })
                    )
                    expect(post.ok).toBe(true)
                    expect(await post.json()).toEqual({
                        body: { username: "John", password: "secret" },
                    })
                })

                test("With invalid body", async ({ expect }) => {
                    const post = await POST(
                        new Request("https://example.com/auth/credentials", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ username: "John" }),
                        })
                    )
                    expect(post.status).toBe(422)
                    expect(await post.json()).toEqual({
                        type: "VALIDATION",
                        code: "UNPROCESSABLE_ENTITY",
                        message: "The request body or parameter schema layout contains input format errors.",
                        details: {
                            password: {
                                code: "required",
                                message: "password must be a string (was missing)",
                            },
                        },
                    })
                    expect(post.statusText).toBe("UNPROCESSABLE_ENTITY")
                })
            })

            describe("Typebox body schema", () => {
                const endpoint = createEndpoint(
                    "POST",
                    "/auth/credentials",
                    (ctx) => {
                        return Response.json({ body: ctx.body })
                    },
                    {
                        schemas: {
                            body: typebox.Object({
                                username: typebox.String(),
                                password: typebox.String(),
                            }),
                        },
                    }
                )
                const { POST } = createRouter([endpoint])

                test("With valid body", async ({ expect }) => {
                    const post = await POST(
                        new Request("https://example.com/auth/credentials", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ username: "John", password: "secret" }),
                        })
                    )
                    expect(post.ok).toBe(true)
                    expect(await post.json()).toEqual({
                        body: { username: "John", password: "secret" },
                    })
                })

                test("With invalid body", async ({ expect }) => {
                    const post = await POST(
                        new Request("https://example.com/auth/credentials", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ username: "John" }),
                        })
                    )
                    expect(post.status).toBe(422)
                    expect(await post.json()).toEqual({
                        type: "VALIDATION",
                        code: "UNPROCESSABLE_ENTITY",
                        message: "The request body or parameter schema layout contains input format errors.",
                        details: {
                            "": {
                                code: "required",
                                message: "must have required properties password",
                            },
                        },
                    })
                    expect(post.statusText).toBe("UNPROCESSABLE_ENTITY")
                })
            })
        })

        describe("With searchParams", () => {
            describe("Zod searchParams schema", () => {
                const endpoint = createEndpoint(
                    "GET",
                    "/auth/:oauth",
                    (ctx) => {
                        return Response.json({ searchParams: ctx.searchParams })
                    },
                    {
                        schemas: {
                            searchParams: z.object({
                                state: z.string(),
                                code: z.string(),
                            }),
                        },
                    }
                )

                const { GET } = createRouter([endpoint])

                test("With valid searchParams", async ({ expect }) => {
                    const get = await GET(new Request("https://example.com/auth/google?state=123abc&code=123"))
                    expect(get.ok).toBe(true)
                    expect(await get.json()).toEqual({
                        searchParams: { state: "123abc", code: "123" },
                    })
                })

                test("With invalid searchParams", async ({ expect }) => {
                    const get = await GET(new Request("https://example.com/auth/google?state=123abc", { method: "GET" }))
                    expect(await get.json()).toEqual({
                        type: "VALIDATION",
                        code: "UNPROCESSABLE_ENTITY",
                        message: "The request body or parameter schema layout contains input format errors.",
                        details: {
                            code: {
                                code: "invalid_type",
                                message: "Invalid input: expected string, received undefined",
                            },
                        },
                    })
                    expect(get.status).toBe(422)
                    expect(get.statusText).toBe("UNPROCESSABLE_ENTITY")
                })
            })

            describe("Valibot searchParams schema", () => {
                const endpoint = createEndpoint(
                    "GET",
                    "/auth/:oauth",
                    (ctx) => {
                        return Response.json({ searchParams: ctx.searchParams })
                    },
                    {
                        schemas: {
                            searchParams: valibot.object({
                                state: valibot.string(),
                                code: valibot.string(),
                            }),
                        },
                    }
                )

                const { GET } = createRouter([endpoint])

                test("With valid searchParams", async ({ expect }) => {
                    const get = await GET(new Request("https://example.com/auth/google?state=123abc&code=123"))
                    expect(get.ok).toBe(true)
                    expect(await get.json()).toEqual({
                        searchParams: { state: "123abc", code: "123" },
                    })
                })

                test("With invalid searchParams", async ({ expect }) => {
                    const get = await GET(new Request("https://example.com/auth/google?state=123abc", { method: "GET" }))
                    expect(await get.json()).toEqual({
                        type: "VALIDATION",
                        code: "UNPROCESSABLE_ENTITY",
                        message: "The request body or parameter schema layout contains input format errors.",
                        details: {
                            code: {
                                code: "schema",
                                message: 'Invalid key: Expected "code" but received undefined',
                            },
                        },
                    })
                    expect(get.status).toBe(422)
                    expect(get.statusText).toBe("UNPROCESSABLE_ENTITY")
                })
            })

            describe("Arktype searchParams schema", () => {
                const endpoint = createEndpoint(
                    "GET",
                    "/auth/:oauth",
                    (ctx) => {
                        return Response.json({ searchParams: ctx.searchParams })
                    },
                    {
                        schemas: {
                            searchParams: type({
                                state: "string",
                                code: "string",
                            }),
                        },
                    }
                )

                const { GET } = createRouter([endpoint])

                test("With valid searchParams", async ({ expect }) => {
                    const get = await GET(new Request("https://example.com/auth/google?state=123abc&code=123"))
                    expect(get.ok).toBe(true)
                    expect(await get.json()).toEqual({
                        searchParams: { state: "123abc", code: "123" },
                    })
                })

                test("With invalid searchParams", async ({ expect }) => {
                    const get = await GET(new Request("https://example.com/auth/google?state=123abc", { method: "GET" }))
                    expect(await get.json()).toEqual({
                        type: "VALIDATION",
                        code: "UNPROCESSABLE_ENTITY",
                        message: "The request body or parameter schema layout contains input format errors.",
                        details: {
                            code: {
                                code: "required",
                                message: "code must be a string (was missing)",
                            },
                        },
                    })
                    expect(get.status).toBe(422)
                    expect(get.statusText).toBe("UNPROCESSABLE_ENTITY")
                })
            })

            describe("Typebox searchParams schema", () => {
                const endpoint = createEndpoint(
                    "GET",
                    "/auth/:oauth",
                    (ctx) => {
                        return Response.json({ searchParams: ctx.searchParams })
                    },
                    {
                        schemas: {
                            searchParams: typebox.Object({
                                state: typebox.String(),
                                code: typebox.String(),
                            }),
                        },
                    }
                )

                const { GET } = createRouter([endpoint])

                test("With valid searchParams", async ({ expect }) => {
                    const get = await GET(new Request("https://example.com/auth/google?state=123abc&code=123"))
                    expect(get.ok).toBe(true)
                    expect(await get.json()).toEqual({
                        searchParams: { state: "123abc", code: "123" },
                    })
                })

                test("With invalid searchParams", async ({ expect }) => {
                    const get = await GET(new Request("https://example.com/auth/google?state=123abc", { method: "GET" }))
                    expect(await get.json()).toEqual({
                        type: "VALIDATION",
                        code: "UNPROCESSABLE_ENTITY",
                        message: "The request body or parameter schema layout contains input format errors.",
                        details: {
                            "": {
                                code: "required",
                                message: "must have required properties code",
                            },
                        },
                    })
                    expect(get.status).toBe(422)
                    expect(get.statusText).toBe("UNPROCESSABLE_ENTITY")
                })
            })
        })

        describe("With params", () => {
            describe("Zod params schema", () => {
                const config = createEndpointConfig("/signIn/:oauth", {
                    schemas: {
                        params: z.object({
                            oauth: z.enum(["google", "github"]),
                        }),
                    },
                })

                const inferConfig = createEndpointConfig("/type/:typeId", {
                    schemas: {
                        params: z.object({
                            typeId: z.enum(["token", "code"]),
                        }),
                    },
                })

                const endpoint = createEndpoint(
                    "GET",
                    "/signIn/:oauth",
                    (ctx) => {
                        const oauth = ctx.params.oauth
                        return Response.json({ oauth })
                    },
                    config
                )

                const inferEndpoint = createEndpoint(
                    "GET",
                    "/type/:typeId",
                    (ctx) => {
                        return Response.json({ typeId: ctx.params.typeId })
                    },
                    inferConfig
                )

                const { GET } = createRouter([endpoint, inferEndpoint])

                test("With valid params", async ({ expect }) => {
                    const get = await GET(new Request("https://example.com/signIn/google"))
                    expect(get.ok).toBe(true)
                    expect(await get.json()).toEqual({ oauth: "google" })
                })

                test("With invalid params", async ({ expect }) => {
                    const get = await GET(new Request("https://example.com/signIn/facebook"))
                    expect(get.status).toBe(422)
                    expect(get.statusText).toBe("UNPROCESSABLE_ENTITY")
                    expect(await get.json()).toEqual({
                        type: "VALIDATION",
                        code: "UNPROCESSABLE_ENTITY",
                        message: "The request body or parameter schema layout contains input format errors.",
                        details: {
                            oauth: {
                                code: "invalid_value",
                                message: 'Invalid option: expected one of "google"|"github"',
                            },
                        },
                    })
                })

                test("With inferred params", async ({ expect }) => {
                    const get = await GET(new Request("https://example.com/type/token"))
                    expect(get.ok).toBe(true)
                    expect(await get.json()).toEqual({ typeId: "token" })
                })

                test("With invalid inferred params", async ({ expect }) => {
                    const get = await GET(new Request("https://example.com/type/invalid"))
                    expect(get.status).toBe(422)
                    expect(get.statusText).toBe("UNPROCESSABLE_ENTITY")
                    expect(await get.json()).toEqual({
                        type: "VALIDATION",
                        code: "UNPROCESSABLE_ENTITY",
                        message: "The request body or parameter schema layout contains input format errors.",
                        details: {
                            typeId: {
                                code: "invalid_value",
                                message: 'Invalid option: expected one of "token"|"code"',
                            },
                        },
                    })
                })
            })

            describe("Valibot params schema", () => {
                const config = createEndpointConfig("/signIn/:oauth", {
                    schemas: {
                        params: valibot.object({
                            oauth: valibot.enum({ google: "google", github: "github" }),
                        }),
                    },
                })

                const inferConfig = createEndpointConfig("/type/:typeId", {
                    schemas: {
                        params: valibot.object({
                            typeId: valibot.enum({ token: "token", code: "code" }),
                        }),
                    },
                })

                const endpoint = createEndpoint(
                    "GET",
                    "/signIn/:oauth",
                    (ctx) => {
                        const oauth = ctx.params.oauth
                        return Response.json({ oauth })
                    },
                    config
                )

                const inferEndpoint = createEndpoint(
                    "GET",
                    "/type/:typeId",
                    (ctx) => {
                        return Response.json({ typeId: ctx.params.typeId })
                    },
                    inferConfig
                )

                const { GET } = createRouter([endpoint, inferEndpoint])

                test("With valid params", async ({ expect }) => {
                    const get = await GET(new Request("https://example.com/signIn/google"))
                    expect(get.ok).toBe(true)
                    expect(await get.json()).toEqual({ oauth: "google" })
                })

                test("With invalid params", async ({ expect }) => {
                    const get = await GET(new Request("https://example.com/signIn/facebook"))
                    expect(get.status).toBe(422)
                    expect(get.statusText).toBe("UNPROCESSABLE_ENTITY")
                    expect(await get.json()).toEqual({
                        type: "VALIDATION",
                        code: "UNPROCESSABLE_ENTITY",
                        message: "The request body or parameter schema layout contains input format errors.",
                        details: {
                            oauth: {
                                code: "schema",
                                message: 'Invalid type: Expected ("google" | "github") but received "facebook"',
                            },
                        },
                    })
                })

                test("With inferred params", async ({ expect }) => {
                    const get = await GET(new Request("https://example.com/type/token"))
                    expect(get.ok).toBe(true)
                    expect(await get.json()).toEqual({ typeId: "token" })
                })

                test("With invalid inferred params", async ({ expect }) => {
                    const get = await GET(new Request("https://example.com/type/invalid"))
                    expect(get.status).toBe(422)
                    expect(get.statusText).toBe("UNPROCESSABLE_ENTITY")
                    expect(await get.json()).toEqual({
                        type: "VALIDATION",
                        code: "UNPROCESSABLE_ENTITY",
                        message: "The request body or parameter schema layout contains input format errors.",
                        details: {
                            typeId: {
                                code: "schema",
                                message: 'Invalid type: Expected ("token" | "code") but received "invalid"',
                            },
                        },
                    })
                })
            })

            describe("Arktype params schema", () => {
                const config = createEndpointConfig("/signIn/:oauth", {
                    schemas: {
                        params: type({
                            oauth: type.enumerated("google", "github"),
                        }),
                    },
                })

                const inferConfig = createEndpointConfig("/type/:typeId", {
                    schemas: {
                        params: type({
                            typeId: type.enumerated("token", "code"),
                        }),
                    },
                })

                const endpoint = createEndpoint(
                    "GET",
                    "/signIn/:oauth",
                    (ctx) => {
                        const oauth = ctx.params.oauth
                        return Response.json({ oauth })
                    },
                    config
                )

                const inferEndpoint = createEndpoint(
                    "GET",
                    "/type/:typeId",
                    (ctx) => {
                        return Response.json({ typeId: ctx.params.typeId })
                    },
                    inferConfig
                )

                const { GET } = createRouter([endpoint, inferEndpoint])

                test("With valid params", async ({ expect }) => {
                    const get = await GET(new Request("https://example.com/signIn/google"))
                    expect(get.ok).toBe(true)
                    expect(await get.json()).toEqual({ oauth: "google" })
                })

                test("With invalid params", async ({ expect }) => {
                    const get = await GET(new Request("https://example.com/signIn/facebook"))
                    expect(get.status).toBe(422)
                    expect(get.statusText).toBe("UNPROCESSABLE_ENTITY")
                    expect(await get.json()).toEqual({
                        type: "VALIDATION",
                        code: "UNPROCESSABLE_ENTITY",
                        message: "The request body or parameter schema layout contains input format errors.",
                        details: {
                            oauth: {
                                code: "union",
                                message: 'oauth must be "github" or "google" (was "facebook")',
                            },
                        },
                    })
                })

                test("With inferred params", async ({ expect }) => {
                    const get = await GET(new Request("https://example.com/type/token"))
                    expect(get.ok).toBe(true)
                    expect(await get.json()).toEqual({ typeId: "token" })
                })

                test("With invalid inferred params", async ({ expect }) => {
                    const get = await GET(new Request("https://example.com/type/invalid"))
                    expect(get.status).toBe(422)
                    expect(get.statusText).toBe("UNPROCESSABLE_ENTITY")
                    expect(await get.json()).toEqual({
                        type: "VALIDATION",
                        code: "UNPROCESSABLE_ENTITY",
                        message: "The request body or parameter schema layout contains input format errors.",
                        details: {
                            typeId: {
                                code: "union",
                                message: 'typeId must be "code" or "token" (was "invalid")',
                            },
                        },
                    })
                })
            })

            describe("Typebox params schema", () => {
                const config = createEndpointConfig("/signIn/:oauth", {
                    schemas: {
                        params: typebox.Object({
                            oauth: typebox.Enum(["google", "github"]),
                        }),
                    },
                })

                const inferConfig = createEndpointConfig("/type/:typeId", {
                    schemas: {
                        params: typebox.Object({
                            typeId: typebox.Enum(["token", "code"]),
                        }),
                    },
                })

                const endpoint = createEndpoint(
                    "GET",
                    "/signIn/:oauth",
                    (ctx) => {
                        type Params = typebox.Static<typeof ctx.params>
                        const params = ctx.params as unknown as Params
                        return Response.json({ oauth: params.oauth })
                    },
                    config
                )

                const inferEndpoint = createEndpoint(
                    "GET",
                    "/type/:typeId",
                    (ctx) => {
                        type Params = typebox.Static<typeof ctx.params>
                        const params = ctx.params as unknown as Params
                        return Response.json({ typeId: params.typeId })
                    },
                    inferConfig
                )

                const { GET } = createRouter([endpoint, inferEndpoint])

                test("With valid params", async ({ expect }) => {
                    const get = await GET(new Request("https://example.com/signIn/google"))
                    expect(get.ok).toBe(true)
                    expect(await get.json()).toEqual({ oauth: "google" })
                })

                test("With invalid params", async ({ expect }) => {
                    const get = await GET(new Request("https://example.com/signIn/facebook"))
                    expect(get.status).toBe(422)
                    expect(get.statusText).toBe("UNPROCESSABLE_ENTITY")
                    expect(await get.json()).toEqual({
                        type: "VALIDATION",
                        code: "UNPROCESSABLE_ENTITY",
                        message: "The request body or parameter schema layout contains input format errors.",
                        details: {
                            oauth: {
                                code: "enum",
                                message: "must be equal to one of the allowed values",
                            },
                        },
                    })
                })

                test("With inferred params", async ({ expect }) => {
                    const get = await GET(new Request("https://example.com/type/token"))
                    expect(get.ok).toBe(true)
                    expect(await get.json()).toEqual({ typeId: "token" })
                })

                test("With invalid inferred params", async ({ expect }) => {
                    const get = await GET(new Request("https://example.com/type/invalid"))
                    expect(get.status).toBe(422)
                    expect(get.statusText).toBe("UNPROCESSABLE_ENTITY")
                    expect(await get.json()).toEqual({
                        type: "VALIDATION",
                        code: "UNPROCESSABLE_ENTITY",
                        message: "The request body or parameter schema layout contains input format errors.",
                        details: {
                            typeId: {
                                code: "enum",
                                message: "must be equal to one of the allowed values",
                            },
                        },
                    })
                })
            })
        })

        describe("With headers", () => {
            describe("Zod headers schema", () => {
                const config = createEndpointConfig({
                    schemas: {
                        headers: z.object({
                            authorization: z.string(),
                            "x-csrf-token": z.string(),
                        }),
                    },
                })

                const endpoint = createEndpoint(
                    "GET",
                    "/headers",
                    (ctx) => {
                        return ctx.json({ headers: ctx.headers })
                    },
                    config
                )
                const { GET } = createRouter([endpoint])

                test("With valid headers", async ({ expect }) => {
                    const get = await GET(
                        new Request("https://example.com/headers", {
                            method: "GET",
                            headers: {
                                authorization: "Bearer token",
                                "x-csrf-token": "123abc",
                            },
                        })
                    )
                    expect(get.ok).toBe(true)
                    expect(await get.json()).toEqual({
                        headers: {
                            authorization: "Bearer token",
                            "x-csrf-token": "123abc",
                        },
                    })
                })

                test("with invalid headers", async ({ expect }) => {
                    const get = await GET(
                        new Request("https://example.com/headers", {
                            method: "GET",
                            headers: {
                                authorization: "Bearer token",
                            },
                        })
                    )
                    expect(get.status).toBe(422)
                    expect(await get.json()).toEqual({
                        type: "VALIDATION",
                        code: "UNPROCESSABLE_ENTITY",
                        message: "The request body or parameter schema layout contains input format errors.",
                        details: {
                            "x-csrf-token": {
                                code: "invalid_type",
                                message: "Invalid input: expected string, received undefined",
                            },
                        },
                    })
                })
            })

            describe("Typebox headers schema", () => {
                const config = createEndpointConfig({
                    schemas: {
                        headers: typebox.Object({
                            authorization: typebox.String(),
                            "x-csrf-token": typebox.String(),
                        }),
                    },
                })

                const endpoint = createEndpoint(
                    "GET",
                    "/headers",
                    (ctx) => {
                        return ctx.json({ headers: ctx.headers })
                    },
                    config
                )
                const { GET } = createRouter([endpoint])

                test("With valid headers", async ({ expect }) => {
                    const get = await GET(
                        new Request("https://example.com/headers", {
                            method: "GET",
                            headers: {
                                authorization: "Bearer token",
                                "x-csrf-token": "123abc",
                            },
                        })
                    )
                    expect(get.ok).toBe(true)
                    expect(await get.json()).toEqual({
                        headers: {
                            authorization: "Bearer token",
                            "x-csrf-token": "123abc",
                        },
                    })
                })

                test("with invalid headers", async ({ expect }) => {
                    const get = await GET(
                        new Request("https://example.com/headers", {
                            method: "GET",
                            headers: {
                                authorization: "Bearer token",
                            },
                        })
                    )
                    expect(get.status).toBe(422)
                    expect(await get.json()).toEqual({
                        type: "VALIDATION",
                        code: "UNPROCESSABLE_ENTITY",
                        message: "The request body or parameter schema layout contains input format errors.",
                        details: {
                            "": {
                                code: "required",
                                message: "must have required properties x-csrf-token",
                            },
                        },
                    })
                })
            })

            describe("Arktype headers schema", () => {
                const config = createEndpointConfig({
                    schemas: {
                        headers: type({
                            authorization: "string",
                            "x-csrf-token": "string",
                        }),
                    },
                })

                const endpoint = createEndpoint(
                    "GET",
                    "/headers",
                    (ctx) => {
                        return ctx.json({ headers: ctx.headers })
                    },
                    config
                )
                const { GET } = createRouter([endpoint])

                test("With valid headers", async ({ expect }) => {
                    const get = await GET(
                        new Request("https://example.com/headers", {
                            method: "GET",
                            headers: {
                                authorization: "Bearer token",
                                "x-csrf-token": "123abc",
                            },
                        })
                    )
                    expect(get.ok).toBe(true)
                    expect(await get.json()).toEqual({
                        headers: {
                            authorization: "Bearer token",
                            "x-csrf-token": "123abc",
                        },
                    })
                })

                test("with invalid headers", async ({ expect }) => {
                    const get = await GET(
                        new Request("https://example.com/headers", {
                            method: "GET",
                            headers: {
                                authorization: "Bearer token",
                            },
                        })
                    )
                    expect(get.status).toBe(422)
                    expect(await get.json()).toEqual({
                        type: "VALIDATION",
                        code: "UNPROCESSABLE_ENTITY",
                        message: "The request body or parameter schema layout contains input format errors.",
                        details: {
                            "x-csrf-token": {
                                code: "required",
                                message: 'value at ["x-csrf-token"] must be a string (was missing)',
                            },
                        },
                    })
                })
            })

            describe("Valibot headers schema", () => {
                const config = createEndpointConfig({
                    schemas: {
                        headers: valibot.object({
                            authorization: valibot.string(),
                            "x-csrf-token": valibot.string(),
                        }),
                    },
                })

                const endpoint = createEndpoint(
                    "GET",
                    "/headers",
                    (ctx) => {
                        return ctx.json({ headers: ctx.headers })
                    },
                    config
                )
                const { GET } = createRouter([endpoint])

                test("With valid headers", async ({ expect }) => {
                    const get = await GET(
                        new Request("https://example.com/headers", {
                            method: "GET",
                            headers: {
                                authorization: "Bearer token",
                                "x-csrf-token": "123abc",
                            },
                        })
                    )
                    expect(get.ok).toBe(true)
                    expect(await get.json()).toEqual({
                        headers: {
                            authorization: "Bearer token",
                            "x-csrf-token": "123abc",
                        },
                    })
                })

                test("with invalid headers", async ({ expect }) => {
                    const get = await GET(
                        new Request("https://example.com/headers", {
                            method: "GET",
                            headers: {
                                authorization: "Bearer token",
                            },
                        })
                    )
                    expect(get.status).toBe(422)
                    expect(await get.json()).toEqual({
                        type: "VALIDATION",
                        code: "UNPROCESSABLE_ENTITY",
                        message: "The request body or parameter schema layout contains input format errors.",
                        details: {
                            "x-csrf-token": {
                                code: "schema",
                                message: 'Invalid key: Expected "x-csrf-token" but received undefined',
                            },
                        },
                    })
                })
            })
        })
    })

    describe("With middlewares", () => {
        test("Update params context in middleware", async ({ expect }) => {
            const endpoint = createEndpoint(
                "GET",
                "/auth/:oauth",
                (ctx) => {
                    const oauth = ctx.params.oauth
                    return Response.json({ oauth })
                },
                {
                    use: [
                        (ctx) => {
                            ctx.params = { oauth: "google" }
                            return ctx
                        },
                    ],
                }
            )
            const { GET } = createRouter([endpoint])
            const get = await GET(new Request("https://example.com/auth/github"))
            expect(get.ok).toBe(true)
            expect(await get.json()).toEqual({ oauth: "google" })
        })

        test("Update searchParams context in middleware", async ({ expect }) => {
            const endpoint = createEndpoint(
                "GET",
                "/auth/google",
                (ctx) => {
                    const searchParams = Object.fromEntries(ctx.searchParams.entries())
                    return Response.json({ searchParams })
                },
                {
                    use: [
                        (ctx) => {
                            ctx.searchParams.set("state", "123abc")
                            ctx.searchParams.set("code", "123")
                            return ctx
                        },
                    ],
                }
            )
            const { GET } = createRouter([endpoint])
            const get = await GET(new Request("https://example.com/auth/google"))
            expect(get.ok).toBe(true)
            expect(await get.json()).toEqual({
                searchParams: { state: "123abc", code: "123" },
            })
        })

        test("Update headers context in middleware", async ({ expect }) => {
            const endpoint = createEndpoint(
                "GET",
                "/headers",
                (ctx) => {
                    const headers = Object.fromEntries(ctx.headers.toHeaders().entries())
                    return Response.json({ headers })
                },
                {
                    use: [
                        (ctx) => {
                            ctx.headers.setHeader("Authorization", "Bearer token")
                            return ctx
                        },
                    ],
                }
            )
            const { GET } = createRouter([endpoint])
            const get = await GET(new Request("https://example.com/headers"))
            expect(get.ok).toBe(true)
            expect(await get.json()).toEqual({
                headers: { authorization: "Bearer token" },
            })
        })
    })

    describe("With schemas and middlewares", () => {
        test("Override body in middleware", async ({ expect }) => {
            const endpoint = createEndpoint(
                "POST",
                "/auth/credentials",
                (ctx) => {
                    return Response.json({ body: ctx.body })
                },
                {
                    schemas: {
                        body: z.object({
                            username: z.string(),
                            password: z.string(),
                        }),
                    },
                    use: [
                        (ctx) => {
                            ctx.body.username = "John Doe"
                            return ctx
                        },
                    ],
                }
            )
            const { POST } = createRouter([endpoint])

            const post = await POST(
                new Request("https://example.com/auth/credentials", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username: "John", password: "secret" }),
                })
            )
            expect(post.ok).toBe(true)
            expect(await post.json()).toEqual({
                body: { username: "John Doe", password: "secret" },
            })
        })

        test("Override searchParams in middleware", async ({ expect }) => {
            const endpoint = createEndpoint(
                "GET",
                "/auth/google",
                (ctx) => {
                    return Response.json({ searchParams: ctx.searchParams })
                },
                {
                    schemas: {
                        searchParams: z.object({
                            redirect_uri: z.string(),
                        }),
                    },
                    use: [
                        (ctx) => {
                            const searchParams = ctx.searchParams as Record<string, string>
                            searchParams.state = "123abc"
                            searchParams.code = "123"
                            return ctx
                        },
                    ],
                }
            )
            const { GET } = createRouter([endpoint])
            const get = await GET(new Request("https://example.com/auth/google?redirect_uri=https://app.com/callback"))
            expect(get.ok).toBe(true)
            expect(await get.json()).toEqual({
                searchParams: {
                    state: "123abc",
                    code: "123",
                    redirect_uri: "https://app.com/callback",
                },
            })
        })

        test("Override params in middleware", async ({ expect }) => {
            const endpoint = createEndpoint(
                "GET",
                "/auth/:oauth",
                (ctx) => {
                    return Response.json({ params: ctx.params })
                },
                {
                    schemas: {
                        params: z.object({
                            oauth: z.enum(["google", "github"]),
                        }),
                    },
                    use: [
                        (ctx) => {
                            ctx.params.oauth = "google"
                            return ctx
                        },
                    ],
                }
            )

            const { GET } = createRouter([endpoint])
            const get = await GET(new Request("https://example.com/auth/github"))
            expect(get.ok).toBe(true)
            expect(await get.json()).toEqual({
                params: { oauth: "google" },
            })
        })
    })

    describe("With method, route, and url", () => {
        const endpoint = createEndpoint("GET", "/users", (ctx) => {
            return Response.json({ method: ctx.method, route: ctx.route, url: ctx.url })
        })

        const { GET } = createRouter([endpoint])

        test("Access method, route, and url from context", async ({ expect }) => {
            const get = await GET(new Request("https://example.com/users?id=123"))
            expect(get.ok).toBe(true)
            expect(await get.json()).toEqual({
                method: "GET",
                route: "/users",
                url: "https://example.com/users?id=123",
            })
        })
    })

    describe("with multiple HTTP methods", () => {
        const endpoint = createEndpoint(["GET", "POST"], "/items", (ctx) => {
            return Response.json({ method: ctx.method, route: ctx.route })
        })
        const deleteEndpoint = createEndpoint("DELETE", "/items/:id", (ctx) => {
            return Response.json({ method: ctx.method, route: ctx.route, id: ctx.params.id })
        })
        const router = createRouter([endpoint, deleteEndpoint])

        test("Handle GET request", async ({ expect }) => {
            const get = await router.GET(new Request("https://example.com/items"))
            expect(get.ok).toBe(true)
            expect(await get.json()).toEqual({
                method: "GET",
                route: "/items",
            })
        })

        test("Handle POST request", async ({ expect }) => {
            const post = await router.POST(new Request("https://example.com/items", { method: "POST" }))
            expect(post.ok).toBe(true)
            expect(await post.json()).toEqual({
                method: "POST",
                route: "/items",
            })
        })

        test("Handle DELETE request with params", async ({ expect }) => {
            const del = await router.DELETE(new Request("https://example.com/items/123", { method: "DELETE" }))
            expect(del.ok).toBe(true)
            expect(await del.json()).toEqual({
                method: "DELETE",
                route: "/items/:id",
                id: "123",
            })
        })
    })
})
