import { z } from "zod/v4"
import { describe, expectTypeOf, test } from "vitest"
import { createNode, insert, search } from "../src/router.js"
import { getRouteParams, getSearchParams, getBody } from "../src/context.js"
import { HeadersBuilder } from "../src/headers.js"
import type { RouteEndpoint } from "../src/types.js"

describe("getRouteParams", () => {
    const root = createNode()
    const handler = async () => Response.json({})

    const endpoints: RouteEndpoint[] = [
        { method: "GET", route: "/books", handler, config: {} },
        { method: "GET", route: "/users/:userId/books", handler, config: {} },
        { method: "GET", route: "/users/:userId/books/:bookId", handler, config: {} },
        { method: "GET", route: "/search/:query", handler, config: {} },
        { method: "GET", route: "/items/:itemId", handler, config: {} },
        { method: "GET", route: "/resources/:resourceId", handler, config: {} },
        { method: "GET", route: "/dynamic/:invalidType", handler, config: {} },
    ]

    for (const endpoint of endpoints) {
        insert(root, endpoint)
    }

    describe("With valid route and path without params schema", () => {
        const testCases = [
            {
                description: "Extracts only userId from the path",
                path: "/users/123/books",
                expected: {
                    userId: "123",
                },
            },
            {
                description: "Extracts userId and bookId from the path",
                path: "/users/123/books/456",
                expected: {
                    userId: "123",
                    bookId: "456",
                },
            },
            {
                description: "No parameters in the route",
                path: "/books",
                expected: {},
            },
            {
                description: "Parameters with special characters",
                path: "/search/hello%20world",
                expected: {
                    query: "hello world",
                },
            },
        ]

        for (const { description, path, expected } of testCases) {
            test.concurrent(description, ({ expect }) => {
                const params = search("GET", root, path).params
                expect(params).toEqual(expected)
            })
        }
    })

    describe("With valid route and path with params schema", () => {
        const testCases = [
            {
                description: "Extracts and validates userId as string",
                path: "/users/123/books",
                schema: z.object({ userId: z.string() }),
                expected: {
                    userId: "123",
                },
            },
            {
                description: "Extracts and validates bookId as string",
                path: "/users/123/books/456",
                schema: z.object({ userId: z.coerce.number(), bookId: z.coerce.number() }),
                expected: {
                    userId: 123,
                    bookId: 456,
                },
            },
            {
                description: "Extracts and validates alphanumeric id",
                path: "/items/abc123",
                schema: z.object({ itemId: z.string().regex(/^[a-zA-Z0-9]+$/) }),
                expected: {
                    itemId: "abc123",
                },
            },
            {
                description: "Extracts and validates UUID",
                path: "/resources/550e8400-e29b-41d4-a716-446655440000",
                schema: z.object({ resourceId: z.uuid() }),
                expected: {
                    resourceId: "550e8400-e29b-41d4-a716-446655440000",
                },
            },
        ]

        for (const { description, path, schema, expected } of testCases) {
            test.concurrent(description, ({ expect }) => {
                const params = search("GET", root, path).params
                const dynamic = getRouteParams(params, { schemas: { params: schema } })
                expect(dynamic).toEqual(expected)
            })
        }
    })

    describe("With invalid params schema", () => {
        const testCases = [
            {
                description: "userId is not a number",
                path: "/users/abc/books",
                schema: z.object({
                    userId: z.number(),
                }),
            },
            {
                description: "type is not in enum",
                path: "/dynamic/invalidType",
                schema: z.object({
                    type: z.enum(["type", "category", "tag"]),
                }),
            },
            {
                description: "itemId does not match regex",
                path: "/items/invalid-item-id!",
                schema: z.object({
                    itemId: z.string().regex(/^[a-zA-Z0-9]+$/),
                }),
            },
            {
                description: "resourceId is not a valid UUID",
                path: "/resources/invalidUUID",
                schema: z.object({
                    resourceId: z.uuid(),
                }),
            },
            {
                description: "multiple invalid params",
                path: "/users/abc/books/def",
                schema: z.object({
                    userId: z.number("userId must be a number"),
                    bookId: z.number(),
                }),
            },
        ]

        for (const { description, path, schema } of testCases) {
            test.concurrent(description, ({ expect }) => {
                const params = search("GET", root, path).params
                expect(() => getRouteParams(params, { schemas: { params: schema } })).toThrowError()
            })
        }
    })

    describe("With invalid route or path", () => {
        const testCases = [
            {
                description: "Path does not match the route pattern",
                path: "/users/123/movies",
                expected: /No route found for path: \/users\/123\/movies/,
            },
            {
                description: "Path with missing parameters",
                path: "/users/123/books/456/extra",
            },
            {
                description: "Non-existent path",
                path: "/me",
            },
            {
                description: "Similar but non-matching path",
                path: "/users/123/book/456",
            },
        ]

        for (const { description, path } of testCases) {
            test.concurrent(description, ({ expect }) => {
                expect(() => search("GET", root, path)).toThrowError(new RegExp(`No route found for path: ${path}`))
            })
        }
    })
})

describe("getSearchParams", () => {
    describe("Without schema validation", () => {
        const testCases = [
            {
                description: "No search parameters",
                url: "http://example.com",
                config: {},
                expected: {},
            },
            {
                description: "Single search parameter",
                url: "http://example.com?name=John",
                config: {},
                expected: { name: "John" },
            },
            {
                description: "Multiple search parameters",
                url: "http://example.com?name=John&age=30",
                config: {},
                expected: { name: "John", age: "30" },
            },
            {
                description: "Encoded search parameters",
                url: "http://example.com?query=hello%20world",
                config: {},
                expected: { query: "hello world" },
            },
        ]

        for (const { description, url, config, expected } of testCases) {
            test.concurrent(description, ({ expect }) => {
                const searchParams = getSearchParams(url, config)
                expect(searchParams instanceof URLSearchParams).toBe(true)
                expect(searchParams).toBeDefined()
                expect(searchParams).toBeInstanceOf(URLSearchParams)
                expect(searchParams).toEqual(new URLSearchParams(expected as Record<string, string>))
                expect(searchParams).not.toEqual(expected)
            })
        }

        test("Check return type is URLSearchParams", () => {
            const withoutParams = {
                url: "http://example.com",
                config: { schemas: {} },
            }
            expectTypeOf(getSearchParams(withoutParams.url, withoutParams.config)).toEqualTypeOf<URLSearchParams>()
        })
    })

    describe("With schema validation", () => {
        const testCases = [
            {
                description: "No search parameters",
                url: "http://example.com",
                schema: z.object({}),
                expected: {},
            },
            {
                description: "Single search parameter",
                url: "http://example.com?name=John",
                schema: z.object({
                    name: z.string(),
                }),
                expected: {
                    name: "John",
                },
            },
            {
                description: "Multiple search parameters",
                url: "http://example.com?name=John&age=30",
                schema: z.object({
                    name: z.string(),
                    age: z.string(),
                }),

                expected: {
                    name: "John",
                    age: "30",
                },
            },
            {
                description: "Encoded search parameters",
                url: "http://example.com?query=hello%20world",
                schema: z.object({
                    query: z.string(),
                }),
                expected: {
                    query: "hello world",
                },
            },
            {
                description: "Extra unexpected search parameter",
                url: "http://example.com?name=John&age=30",
                schema: z.object({
                    name: z.string(),
                }),

                expected: {
                    name: "John",
                },
            },
            {
                description: "Without schema definition",
                url: "http://example.com?name=John",
                schema: z.object({}),
                expected: {},
            },
        ]
        for (const { description, url, schema, expected } of testCases) {
            test.concurrent(description, ({ expect }) => {
                const searchParams = getSearchParams(url, { schemas: { searchParams: schema } })
                expect(searchParams instanceof Object).toBe(true)
                expect(searchParams).toBeDefined()
                expect(searchParams).toBeInstanceOf(Object)
                expect(searchParams).toEqual(expected)
                expect(searchParams).not.toBeInstanceOf(URLSearchParams)
            })
        }
    })

    describe("With invalid parameters", () => {
        const testCases = [
            {
                description: "Invalid search parameters",
                url: "http://example.com?age=thirty",
                config: {
                    schemas: {
                        searchParams: z.object({
                            age: z.number(),
                        }),
                    },
                },
            },
            {
                description: "Missing required search parameter",
                url: "http://example.com",
                config: {
                    schemas: {
                        searchParams: z.object({
                            name: z.string(),
                        }),
                    },
                },
            },
            {
                description: "Invalid type for search parameter",
                url: "http://example.com?isAdmin=notABoolean",
                config: {
                    schemas: {
                        searchParams: z.object({
                            isAdmin: z.boolean(),
                        }),
                    },
                },
            },
        ]

        for (const { description, url, config } of testCases) {
            test.concurrent(description, ({ expect }) => {
                expect(() => getSearchParams(url, config)).toThrowError()
            })
        }

        describe("Check return type is Object", () => {
            test("No search params", () => {
                const withoutParams = {
                    url: "http://example.com?name=John",
                    config: {
                        schemas: {
                            searchParams: z.object({
                                name: z.string(),
                            }),
                        },
                    },
                }
                expectTypeOf(getSearchParams(withoutParams.url, withoutParams.config)).toEqualTypeOf<{
                    name: string
                }>()
            })

            test("No search params", () => {
                const withParams = {
                    url: "http://example.com?name=John",
                    config: {
                        schemas: {
                            searchParams: z.object({
                                name: z.string(),
                            }),
                        },
                    },
                }
                expectTypeOf(getSearchParams(withParams.url, withParams.config)).toEqualTypeOf<{
                    name: string
                }>()
            })

            test("Without schema definition", () => {
                const withoutSchema = {
                    url: "http://example.com?name=John",
                    config: {
                        schemas: {
                            searchParams: z.object({}),
                        },
                    },
                }
                expectTypeOf(getSearchParams(withoutSchema.url, withoutSchema.config)).not.toEqualTypeOf<URLSearchParams>()
                expectTypeOf(getSearchParams(withoutSchema.url, withoutSchema.config)).toEqualTypeOf<Record<string, never>>()
            })
        })
    })

    describe("Infer types", () => {
        test("Infer types from zod schema", () => {
            const config = {
                schemas: {
                    searchParams: z.object({
                        name: z.string(),
                    }),
                },
            }
            const searchParams = getSearchParams("http://example.com?name=John", config)
            expectTypeOf(searchParams).toEqualTypeOf<{ name: string }>()
            expectTypeOf(searchParams.name).toBeString()
        })
    })
})

describe("HeadersBuilder", () => {
    const testCases = [
        {
            description: "No headers",
            request: new Request("http://example.com"),
            expected: new HeadersBuilder({}),
        },
        {
            description: "Single header",
            request: new Request("http://example.com", {
                headers: { Authorization: "Bearer token" },
            }),
            expected: new HeadersBuilder({ Authorization: "Bearer token" }),
        },
        {
            description: "Multiple headers",
            request: new Request("http://example.com", {
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
            }),
            expected: new HeadersBuilder({
                "Content-Type": "application/json",
                Accept: "application/json",
            }),
        },
        {
            description: "",
            request: new Request("http://example.com", {
                headers: new HeadersBuilder({
                    "Content-Type": "application/json",
                })
                    .setCookie("sessionId", "abc123", { httpOnly: true, secure: true })
                    .toHeaders(),
            }),
            expected: new HeadersBuilder({
                "Content-Type": "application/json",
            }).setCookie("sessionId", "abc123", { httpOnly: true, secure: true }),
        },
    ]
    for (const { description, request, expected } of testCases) {
        test.concurrent(description, ({ expect }) => {
            const headers = new HeadersBuilder(request.headers)
            expect(headers instanceof HeadersBuilder).toBe(true)
            expect(headers).toBeDefined()
            expect(headers).toBeInstanceOf(HeadersBuilder)
            expect(headers).toEqual(expected)
        })
    }
})

describe("getBody", () => {
    describe("Valid body", () => {
        const jsonBody = {
            username: "John",
            password: "secret",
        }

        const testCases = [
            {
                description: "Text body",
                request: new Request("http://example.com/echo", {
                    method: "POST",
                    headers: { "Content-Type": "text/plain" },
                    body: "Hello, World!",
                }),
                config: {},
                expected: "Hello, World!",
            },
            {
                description: "JSON body with content-type missing",
                request: new Request("http://example.com/auth/credentials", {
                    method: "POST",
                    body: JSON.stringify(jsonBody),
                }),
                config: {},
                expected: JSON.stringify(jsonBody),
            },
            {
                description: "JSON body without schema",
                request: new Request("http://example.com/auth/credentials", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(jsonBody),
                }),
                config: {},
                expected: jsonBody,
            },
            {
                description: "JSON body with schema",
                request: new Request("http://example.com/auth/credentials", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(jsonBody),
                }),
                config: {
                    schemas: {
                        body: z.object({
                            password: z.string(),
                            username: z.string(),
                        }),
                    },
                },
                expected: jsonBody,
            },
            {
                description: "JSON body without content-type and with schema",
                request: new Request("http://example.com/auth/credentials", {
                    method: "POST",
                    body: JSON.stringify({
                        username: "John",
                        password: "secret",
                    }),
                }),
                config: {
                    schemas: {
                        body: z.object({
                            username: z.string(),
                            password: z.string(),
                        }),
                    },
                },
                expected: jsonBody,
            },
            {
                description: "Valid complex JSON body with nested schema",
                request: new Request("http://example.com/api/v1/users", {
                    method: "POST",
                    body: JSON.stringify({
                        name: "Alice",
                        email: "alice@example.com",
                        address: {
                            street: "123 Main St",
                            city: "Wonderland",
                            zipCode: "12345",
                            location: {
                                lat: 12.3456,
                                lng: 65.4321,
                            },
                        },
                    }),
                    headers: { "Content-Type": "application/json" },
                }),
                config: {
                    schemas: {
                        body: z.object({
                            name: z.string(),
                            email: z.email(),
                            address: z.object({
                                street: z.string(),
                                city: z.string(),
                                zipCode: z.string(),
                                location: z.object({
                                    lat: z.number(),
                                    lng: z.number(),
                                }),
                            }),
                        }),
                    },
                },
                expected: {
                    name: "Alice",
                    email: "alice@example.com",
                    address: {
                        street: "123 Main St",
                        city: "Wonderland",
                        zipCode: "12345",
                        location: {
                            lat: 12.3456,
                            lng: 65.4321,
                        },
                    },
                },
            },
        ]

        for (const { description, request, config, expected } of testCases) {
            test.concurrent(description, async ({ expect }) => {
                const body = await getBody(request, config)
                expect(body).toBeDefined()
                expect(body).toEqual(expected)
            })
        }
    })

    describe("Invalid body", () => {
        const testCases = [
            {
                description: "Invalid JSON body with schema",
                request: new Request("http://example.com/auth/credentials", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        username: "John",
                        password: 123,
                    }),
                }),
                schema: z.object({
                    username: z.string(),
                    password: z.string(),
                }),

                expected: /Invalid request body/,
            },
            {
                description: "Invalid JSON body missing required field",
                request: new Request("http://example.com/auth/credentials", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        username: "John",
                    }),
                }),
                schema: z.object({
                    username: z.string(),
                    password: z.string(),
                }),
                expected: {
                    password: {
                        code: "invalid_type",
                        message: "Invalid input: expected string, received undefined",
                    },
                },
            },
            {
                description: "Invalid JSON body with nested schema",
                request: new Request("http://example.com/api/v1/users", {
                    method: "POST",
                    body: JSON.stringify({
                        name: "Alice",
                        email: "alice@example.com",
                        address: {
                            street: "123 Main St",
                            city: "Wonderland",
                            zipCode: "12345",
                            location: {
                                lat: 12.3456,
                                lng: 65.4321,
                            },
                        },
                    }),
                    headers: { "Content-Type": "application/json" },
                }),
                schema: z.object({
                    name: z.string(),
                    email: z.email(),
                    address: z.object({
                        street: z.string(),
                        city: z.string(),
                        zipCode: z.number(),
                        location: z.object({
                            lat: z.string(),
                            lng: z.string(),
                        }),
                    }),
                }),
            },
        ]

        for (const { description, request, schema } of testCases) {
            test.concurrent(description, async ({ expect }) => {
                await expect(getBody(request, { schemas: { body: schema } })).rejects.toThrowError()
            })
        }
    })
})
