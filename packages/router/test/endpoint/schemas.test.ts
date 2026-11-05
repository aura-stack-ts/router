import { describe, test } from "vitest"
import z from "zod"
import * as valibot from "valibot"
import * as typebox from "typebox"
import { type } from "arktype"
import { createRouter } from "@/router.ts"
import { createEndpoint, createEndpointConfig } from "@/endpoint.ts"

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

    describe("With response", () => {
        describe("Zod response schema", () => {
            const config = createEndpointConfig({
                schemas: {
                    response: z.object({
                        name: z.string(),
                        age: z.number(),
                    }),
                },
            })

            const configWithStatusCode = createEndpointConfig({
                schemas: {
                    response: {
                        200: z.object({
                            name: z.string(),
                            age: z.number(),
                        }),
                        404: z.object({
                            code: z.string(),
                            message: z.string(),
                        }),
                    },
                },
            })

            test("With valid response", async ({ expect }) => {
                const endpoint = createEndpoint(
                    "GET",
                    "/user/:userId",
                    (ctx) => {
                        return ctx.json({ name: "John Doe", age: 30 })
                    },
                    config
                )

                const { GET } = createRouter([endpoint])
                const get = await GET(new Request("https://example.com/user/123"))
                expect(get.ok).toBe(true)
                expect(await get.json()).toEqual({ name: "John Doe", age: 30 })
            })

            test("With valid response and extra fields", async ({ expect }) => {
                const endpoint = createEndpoint(
                    "GET",
                    "/user/:userId",
                    (ctx) => {
                        return ctx.json({ name: "John Doe", age: 30, lastName: "Doe" })
                    },
                    config
                )

                const { GET } = createRouter([endpoint])
                const get = await GET(new Request("https://example.com/user/123"))
                expect(get.ok).toBe(true)
                expect(await get.json()).toEqual({ name: "John Doe", age: 30 })
            })

            test("With invalid response", async ({ expect }) => {
                const endpoint = createEndpoint(
                    "GET",
                    "/user/:userId",
                    (ctx) => {
                        return ctx.json({ name: "John Doe" })
                    },
                    config
                )

                const { GET } = createRouter([endpoint])
                const get = await GET(new Request("https://example.com/user/123"))
                expect(get.ok).toBe(false)
                expect(get.status).toBe(422)
                expect(await get.json()).toEqual({
                    type: "VALIDATION",
                    code: "UNPROCESSABLE_ENTITY",
                    message: "The response body or parameter schema layout contains output format errors.",
                    details: {
                        age: {
                            code: "invalid_type",
                            message: "Invalid input: expected number, received undefined",
                        },
                    },
                })
            })

            test("with valid response and default status code", async ({ expect }) => {
                const endpoint = createEndpoint(
                    "GET",
                    "/user/:userId",
                    (ctx) => {
                        return ctx.json({ name: "John Doe", age: 30 })
                    },
                    configWithStatusCode
                )

                const { GET } = createRouter([endpoint])
                const get = await GET(new Request("https://example.com/user/123"))
                expect(get.ok).toBe(true)
                expect(await get.json()).toEqual({ name: "John Doe", age: 30 })
            })

            test("with valid response and 200 status code", async ({ expect }) => {
                const endpoint = createEndpoint(
                    "GET",
                    "/user/:userId",
                    (ctx) => {
                        return ctx.json({ name: "John Doe", age: 30 }, { status: 200 })
                    },
                    configWithStatusCode
                )

                const { GET } = createRouter([endpoint])
                const get = await GET(new Request("https://example.com/user/123"))
                expect(get.ok).toBe(true)
                expect(await get.json()).toEqual({ name: "John Doe", age: 30 })
            })

            test("with invalid response and 200 status code", async ({ expect }) => {
                const endpoint = createEndpoint(
                    "GET",
                    "/user/:userId",
                    (ctx) => {
                        return ctx.json({ message: "Not Found", code: "NOT_FOUND" }, { status: 200 })
                    },
                    configWithStatusCode
                )

                const { GET } = createRouter([endpoint])
                const get = await GET(new Request("https://example.com/user/123"))
                expect(get.ok).toBe(false)
                expect(get.status).toBe(422)
                expect(await get.json()).toEqual({
                    type: "VALIDATION",
                    code: "UNPROCESSABLE_ENTITY",
                    message: "The response body or parameter schema layout contains output format errors.",
                    details: {
                        name: {
                            code: "invalid_type",
                            message: "Invalid input: expected string, received undefined",
                        },
                        age: {
                            code: "invalid_type",
                            message: "Invalid input: expected number, received undefined",
                        },
                    },
                })
            })

            test("with valid response and 404 status code", async ({ expect }) => {
                const endpoint = createEndpoint(
                    "GET",
                    "/user/:userId",
                    (ctx) => {
                        return ctx.json({ message: "Not Found", code: "NOT_FOUND" }, { status: 404 })
                    },
                    configWithStatusCode
                )

                const { GET } = createRouter([endpoint])
                const get = await GET(new Request("https://example.com/user/123"))
                expect(get.ok).toBe(false)
                expect(get.status).toBe(404)
                expect(await get.json()).toEqual({ message: "Not Found", code: "NOT_FOUND" })
            })

            test("with invalid response and 404 status code", async ({ expect }) => {
                const endpoint = createEndpoint(
                    "GET",
                    "/user/:userId",
                    (ctx) => {
                        return ctx.json({ unknown: "field" }, { status: 404 })
                    },
                    configWithStatusCode
                )

                const { GET } = createRouter([endpoint])
                const get = await GET(new Request("https://example.com/user/123"))
                expect(get.ok).toBe(false)
                expect(get.status).toBe(422)
                expect(await get.json()).toEqual({
                    type: "VALIDATION",
                    code: "UNPROCESSABLE_ENTITY",
                    message: "The response body or parameter schema layout contains output format errors.",
                    details: {
                        message: {
                            code: "invalid_type",
                            message: "Invalid input: expected string, received undefined",
                        },
                        code: {
                            code: "invalid_type",
                            message: "Invalid input: expected string, received undefined",
                        },
                    },
                })
            })

            test("with unknown status code", async ({ expect }) => {
                const endpoint = createEndpoint(
                    "GET",
                    "/user/:userId",
                    (ctx) => {
                        return ctx.json({ name: "John Doe", age: 30 }, { status: 300 })
                    },
                    configWithStatusCode
                )

                const { GET } = createRouter([endpoint])
                const get = await GET(new Request("https://example.com/user/123"))
                expect(get.ok).toBe(false)
                expect(await get.json()).toEqual({ name: "John Doe", age: 30 })
            })
        })

        describe("Valibot response schema", () => {
            const config = createEndpointConfig({
                schemas: {
                    response: valibot.object({
                        name: valibot.string(),
                        age: valibot.number(),
                    }),
                },
            })

            const configWithStatusCode = createEndpointConfig({
                schemas: {
                    response: {
                        200: valibot.object({
                            name: valibot.string(),
                            age: valibot.number(),
                        }),
                        404: valibot.object({
                            code: valibot.string(),
                            message: valibot.string(),
                        }),
                    },
                },
            })

            test("With valid response", async ({ expect }) => {
                const endpoint = createEndpoint(
                    "GET",
                    "/user/:userId",
                    (ctx) => {
                        return ctx.json({ name: "John Doe", age: 30 })
                    },
                    config
                )

                const { GET } = createRouter([endpoint])
                const get = await GET(new Request("https://example.com/user/123"))
                expect(get.ok).toBe(true)
                expect(await get.json()).toEqual({ name: "John Doe", age: 30 })
            })

            test("With valid response and extra fields", async ({ expect }) => {
                const endpoint = createEndpoint(
                    "GET",
                    "/user/:userId",
                    (ctx) => {
                        return ctx.json({ name: "John Doe", age: 30, lastName: "Doe" })
                    },
                    config
                )

                const { GET } = createRouter([endpoint])
                const get = await GET(new Request("https://example.com/user/123"))
                expect(get.ok).toBe(true)
                expect(await get.json()).toEqual({ name: "John Doe", age: 30 })
            })

            test("With invalid response", async ({ expect }) => {
                const endpoint = createEndpoint(
                    "GET",
                    "/user/:userId",
                    (ctx) => {
                        return ctx.json({ name: "John Doe" })
                    },
                    config
                )

                const { GET } = createRouter([endpoint])
                const get = await GET(new Request("https://example.com/user/123"))
                expect(get.ok).toBe(false)
                expect(get.status).toBe(422)
                expect(await get.json()).toEqual({
                    type: "VALIDATION",
                    code: "UNPROCESSABLE_ENTITY",
                    message: "The response body or parameter schema layout contains output format errors.",
                    details: {
                        age: {
                            code: "schema",
                            message: 'Invalid key: Expected "age" but received undefined',
                        },
                    },
                })
            })

            test("with valid response and default status code", async ({ expect }) => {
                const endpoint = createEndpoint(
                    "GET",
                    "/user/:userId",
                    (ctx) => {
                        return ctx.json({ name: "John Doe", age: 30 })
                    },
                    configWithStatusCode
                )

                const { GET } = createRouter([endpoint])
                const get = await GET(new Request("https://example.com/user/123"))
                expect(get.ok).toBe(true)
                expect(await get.json()).toEqual({ name: "John Doe", age: 30 })
            })

            test("with valid response and 200 status code", async ({ expect }) => {
                const endpoint = createEndpoint(
                    "GET",
                    "/user/:userId",
                    (ctx) => {
                        return ctx.json({ name: "John Doe", age: 30 }, { status: 200 })
                    },
                    configWithStatusCode
                )

                const { GET } = createRouter([endpoint])
                const get = await GET(new Request("https://example.com/user/123"))
                expect(get.ok).toBe(true)
                expect(await get.json()).toEqual({ name: "John Doe", age: 30 })
            })

            test("with invalid response and 200 status code", async ({ expect }) => {
                const endpoint = createEndpoint(
                    "GET",
                    "/user/:userId",
                    (ctx) => {
                        return ctx.json({ message: "Not Found", code: "NOT_FOUND" }, { status: 200 })
                    },
                    configWithStatusCode
                )

                const { GET } = createRouter([endpoint])
                const get = await GET(new Request("https://example.com/user/123"))
                expect(get.ok).toBe(false)
                expect(get.status).toBe(422)
                expect(await get.json()).toEqual({
                    type: "VALIDATION",
                    code: "UNPROCESSABLE_ENTITY",
                    message: "The response body or parameter schema layout contains output format errors.",
                    details: {
                        name: {
                            code: "schema",
                            message: 'Invalid key: Expected "name" but received undefined',
                        },
                        age: {
                            code: "schema",
                            message: 'Invalid key: Expected "age" but received undefined',
                        },
                    },
                })
            })

            test("with valid response and 404 status code", async ({ expect }) => {
                const endpoint = createEndpoint(
                    "GET",
                    "/user/:userId",
                    (ctx) => {
                        return ctx.json({ message: "Not Found", code: "NOT_FOUND" }, { status: 404 })
                    },
                    configWithStatusCode
                )

                const { GET } = createRouter([endpoint])
                const get = await GET(new Request("https://example.com/user/123"))
                expect(get.ok).toBe(false)
                expect(get.status).toBe(404)
                expect(await get.json()).toEqual({ message: "Not Found", code: "NOT_FOUND" })
            })

            test("with invalid response and 404 status code", async ({ expect }) => {
                const endpoint = createEndpoint(
                    "GET",
                    "/user/:userId",
                    (ctx) => {
                        return ctx.json({ unknown: "field" }, { status: 404 })
                    },
                    configWithStatusCode
                )

                const { GET } = createRouter([endpoint])
                const get = await GET(new Request("https://example.com/user/123"))
                expect(get.ok).toBe(false)
                expect(get.status).toBe(422)
                expect(await get.json()).toEqual({
                    type: "VALIDATION",
                    code: "UNPROCESSABLE_ENTITY",
                    message: "The response body or parameter schema layout contains output format errors.",
                    details: {
                        message: {
                            code: "schema",
                            message: 'Invalid key: Expected "message" but received undefined',
                        },
                        code: {
                            code: "schema",
                            message: 'Invalid key: Expected "code" but received undefined',
                        },
                    },
                })
            })

            test("with unknown status code", async ({ expect }) => {
                const endpoint = createEndpoint(
                    "GET",
                    "/user/:userId",
                    (ctx) => {
                        return ctx.json({ name: "John Doe", age: 30 }, { status: 300 })
                    },
                    configWithStatusCode
                )

                const { GET } = createRouter([endpoint])
                const get = await GET(new Request("https://example.com/user/123"))
                expect(get.ok).toBe(false)
                expect(await get.json()).toEqual({ name: "John Doe", age: 30 })
            })
        })

        describe("Arktype response schema", () => {
            const config = createEndpointConfig({
                schemas: {
                    response: type({
                        name: "string",
                        age: "number",
                    }),
                },
            })

            const configWithStatusCode = createEndpointConfig({
                schemas: {
                    response: {
                        200: type({
                            name: "string",
                            age: "number",
                        }),
                        404: type({
                            code: "string",
                            message: "string",
                        }),
                    },
                },
            })

            test("With valid response", async ({ expect }) => {
                const endpoint = createEndpoint(
                    "GET",
                    "/user/:userId",
                    (ctx) => {
                        return ctx.json({ name: "John Doe", age: 30 })
                    },
                    config
                )

                const { GET } = createRouter([endpoint])
                const get = await GET(new Request("https://example.com/user/123"))
                expect(get.ok).toBe(true)
                expect(await get.json()).toEqual({ name: "John Doe", age: 30 })
            })

            test("With valid response and extra fields", async ({ expect }) => {
                const endpoint = createEndpoint(
                    "GET",
                    "/user/:userId",
                    (ctx) => {
                        return ctx.json({ name: "John Doe", age: 30, lastName: "Doe" })
                    },
                    config
                )

                const { GET } = createRouter([endpoint])
                const get = await GET(new Request("https://example.com/user/123"))
                expect(get.ok).toBe(true)
                // Arktype allows extra fields in the response, so the response should include lastName as well
                expect(await get.json()).toEqual({ name: "John Doe", age: 30, lastName: "Doe" })
            })

            test("With invalid response", async ({ expect }) => {
                const endpoint = createEndpoint(
                    "GET",
                    "/user/:userId",
                    (ctx) => {
                        return ctx.json({ name: "John Doe" })
                    },
                    config
                )

                const { GET } = createRouter([endpoint])
                const get = await GET(new Request("https://example.com/user/123"))
                expect(get.ok).toBe(false)
                expect(get.status).toBe(422)
                expect(await get.json()).toEqual({
                    type: "VALIDATION",
                    code: "UNPROCESSABLE_ENTITY",
                    message: "The response body or parameter schema layout contains output format errors.",
                    details: {
                        age: {
                            code: "required",
                            message: "age must be a number (was missing)",
                        },
                    },
                })
            })

            test("with valid response and default status code", async ({ expect }) => {
                const endpoint = createEndpoint(
                    "GET",
                    "/user/:userId",
                    (ctx) => {
                        return ctx.json({ name: "John Doe", age: 30 })
                    },
                    configWithStatusCode
                )

                const { GET } = createRouter([endpoint])
                const get = await GET(new Request("https://example.com/user/123"))
                expect(get.ok).toBe(true)
                expect(await get.json()).toEqual({ name: "John Doe", age: 30 })
            })

            test("with valid response and 200 status code", async ({ expect }) => {
                const endpoint = createEndpoint(
                    "GET",
                    "/user/:userId",
                    (ctx) => {
                        return ctx.json({ name: "John Doe", age: 30 }, { status: 200 })
                    },
                    configWithStatusCode
                )

                const { GET } = createRouter([endpoint])
                const get = await GET(new Request("https://example.com/user/123"))
                expect(get.ok).toBe(true)
                expect(await get.json()).toEqual({ name: "John Doe", age: 30 })
            })

            test("with invalid response and 200 status code", async ({ expect }) => {
                const endpoint = createEndpoint(
                    "GET",
                    "/user/:userId",
                    (ctx) => {
                        return ctx.json({ message: "Not Found", code: "NOT_FOUND" }, { status: 200 })
                    },
                    configWithStatusCode
                )

                const { GET } = createRouter([endpoint])
                const get = await GET(new Request("https://example.com/user/123"))
                expect(get.ok).toBe(false)
                expect(get.status).toBe(422)
                expect(await get.json()).toEqual({
                    type: "VALIDATION",
                    code: "UNPROCESSABLE_ENTITY",
                    message: "The response body or parameter schema layout contains output format errors.",
                    details: {
                        name: {
                            code: "required",
                            message: "name must be a string (was missing)",
                        },
                        age: {
                            code: "required",
                            message: "age must be a number (was missing)",
                        },
                    },
                })
            })

            test("with valid response and 404 status code", async ({ expect }) => {
                const endpoint = createEndpoint(
                    "GET",
                    "/user/:userId",
                    (ctx) => {
                        return ctx.json({ message: "Not Found", code: "NOT_FOUND" }, { status: 404 })
                    },
                    configWithStatusCode
                )

                const { GET } = createRouter([endpoint])
                const get = await GET(new Request("https://example.com/user/123"))
                expect(get.ok).toBe(false)
                expect(get.status).toBe(404)
                expect(await get.json()).toEqual({ message: "Not Found", code: "NOT_FOUND" })
            })

            test("with invalid response and 404 status code", async ({ expect }) => {
                const endpoint = createEndpoint(
                    "GET",
                    "/user/:userId",
                    (ctx) => {
                        return ctx.json({ unknown: "field" }, { status: 404 })
                    },
                    configWithStatusCode
                )

                const { GET } = createRouter([endpoint])
                const get = await GET(new Request("https://example.com/user/123"))
                expect(get.ok).toBe(false)
                expect(get.status).toBe(422)
                expect(await get.json()).toEqual({
                    type: "VALIDATION",
                    code: "UNPROCESSABLE_ENTITY",
                    message: "The response body or parameter schema layout contains output format errors.",
                    details: {
                        message: {
                            code: "required",
                            message: "message must be a string (was missing)",
                        },
                        code: {
                            code: "required",
                            message: "code must be a string (was missing)",
                        },
                    },
                })
            })

            test("with unknown status code", async ({ expect }) => {
                const endpoint = createEndpoint(
                    "GET",
                    "/user/:userId",
                    (ctx) => {
                        return ctx.json({ name: "John Doe", age: 30 }, { status: 300 })
                    },
                    configWithStatusCode
                )

                const { GET } = createRouter([endpoint])
                const get = await GET(new Request("https://example.com/user/123"))
                expect(get.ok).toBe(false)
                expect(await get.json()).toEqual({ name: "John Doe", age: 30 })
            })
        })

        describe("Typebox response schema", () => {
            const config = createEndpointConfig({
                schemas: {
                    response: typebox.Object({
                        name: typebox.String(),
                        age: typebox.Number(),
                    }),
                },
            })

            const configWithStatusCode = createEndpointConfig({
                schemas: {
                    response: {
                        200: typebox.Object({
                            name: typebox.String(),
                            age: typebox.Number(),
                        }),
                        404: typebox.Object({
                            code: typebox.String(),
                            message: typebox.String(),
                        }),
                    },
                },
            })

            test("With valid response", async ({ expect }) => {
                const endpoint = createEndpoint(
                    "GET",
                    "/user/:userId",
                    (ctx) => {
                        return ctx.json({ name: "John Doe", age: 30 })
                    },
                    config
                )

                const { GET } = createRouter([endpoint])
                const get = await GET(new Request("https://example.com/user/123"))
                expect(get.ok).toBe(true)
                expect(await get.json()).toEqual({ name: "John Doe", age: 30 })
            })

            test("With valid response and extra fields", async ({ expect }) => {
                const endpoint = createEndpoint(
                    "GET",
                    "/user/:userId",
                    (ctx) => {
                        return ctx.json({ name: "John Doe", age: 30, lastName: "Doe" })
                    },
                    config
                )

                const { GET } = createRouter([endpoint])
                const get = await GET(new Request("https://example.com/user/123"))
                expect(get.ok).toBe(true)
                // Typebox allows extra fields in the response, so the response should include lastName as well
                expect(await get.json()).toEqual({ name: "John Doe", age: 30, lastName: "Doe" })
            })

            test("With invalid response", async ({ expect }) => {
                const endpoint = createEndpoint(
                    "GET",
                    "/user/:userId",
                    (ctx) => {
                        return ctx.json({ name: "John Doe" })
                    },
                    config
                )

                const { GET } = createRouter([endpoint])
                const get = await GET(new Request("https://example.com/user/123"))
                expect(get.ok).toBe(false)
                expect(get.status).toBe(422)
                expect(await get.json()).toEqual({
                    type: "VALIDATION",
                    code: "UNPROCESSABLE_ENTITY",
                    message: "The response body or parameter schema layout contains output format errors.",
                    details: {
                        "": {
                            code: "required",
                            message: "must have required properties age",
                        },
                    },
                })
            })

            test("with valid response and default status code", async ({ expect }) => {
                const endpoint = createEndpoint(
                    "GET",
                    "/user/:userId",
                    (ctx) => {
                        return ctx.json({ name: "John Doe", age: 30 })
                    },
                    configWithStatusCode
                )

                const { GET } = createRouter([endpoint])
                const get = await GET(new Request("https://example.com/user/123"))
                expect(get.ok).toBe(true)
                expect(await get.json()).toEqual({ name: "John Doe", age: 30 })
            })

            test("with valid response and 200 status code", async ({ expect }) => {
                const endpoint = createEndpoint(
                    "GET",
                    "/user/:userId",
                    (ctx) => {
                        return ctx.json({ name: "John Doe", age: 30 }, { status: 200 })
                    },
                    configWithStatusCode
                )

                const { GET } = createRouter([endpoint])
                const get = await GET(new Request("https://example.com/user/123"))
                expect(get.ok).toBe(true)
                expect(await get.json()).toEqual({ name: "John Doe", age: 30 })
            })

            test("with invalid response and 200 status code", async ({ expect }) => {
                const endpoint = createEndpoint(
                    "GET",
                    "/user/:userId",
                    (ctx) => {
                        return ctx.json({ message: "Not Found", code: "NOT_FOUND" }, { status: 200 })
                    },
                    configWithStatusCode
                )

                const { GET } = createRouter([endpoint])
                const get = await GET(new Request("https://example.com/user/123"))
                expect(get.ok).toBe(false)
                expect(get.status).toBe(422)
                expect(await get.json()).toEqual({
                    type: "VALIDATION",
                    code: "UNPROCESSABLE_ENTITY",
                    message: "The response body or parameter schema layout contains output format errors.",
                    details: {
                        "": {
                            code: "required",
                            message: "must have required properties name, age",
                        },
                    },
                })
            })

            test("with valid response and 404 status code", async ({ expect }) => {
                const endpoint = createEndpoint(
                    "GET",
                    "/user/:userId",
                    (ctx) => {
                        return ctx.json({ message: "Not Found", code: "NOT_FOUND" }, { status: 404 })
                    },
                    configWithStatusCode
                )

                const { GET } = createRouter([endpoint])
                const get = await GET(new Request("https://example.com/user/123"))
                expect(get.ok).toBe(false)
                expect(get.status).toBe(404)
                expect(await get.json()).toEqual({ message: "Not Found", code: "NOT_FOUND" })
            })

            test("with invalid response and 404 status code", async ({ expect }) => {
                const endpoint = createEndpoint(
                    "GET",
                    "/user/:userId",
                    (ctx) => {
                        return ctx.json({ unknown: "field" }, { status: 404 })
                    },
                    configWithStatusCode
                )

                const { GET } = createRouter([endpoint])
                const get = await GET(new Request("https://example.com/user/123"))
                expect(get.ok).toBe(false)
                expect(get.status).toBe(422)
                expect(await get.json()).toEqual({
                    type: "VALIDATION",
                    code: "UNPROCESSABLE_ENTITY",
                    message: "The response body or parameter schema layout contains output format errors.",
                    details: {
                        "": {
                            code: "required",
                            message: "must have required properties code, message",
                        },
                    },
                })
            })

            test("with unknown status code", async ({ expect }) => {
                const endpoint = createEndpoint(
                    "GET",
                    "/user/:userId",
                    (ctx) => {
                        return ctx.json({ name: "John Doe", age: 30 }, { status: 300 })
                    },
                    configWithStatusCode
                )

                const { GET } = createRouter([endpoint])
                const get = await GET(new Request("https://example.com/user/123"))
                expect(get.ok).toBe(false)
                expect(await get.json()).toEqual({ name: "John Doe", age: 30 })
            })
        })
    })
})
