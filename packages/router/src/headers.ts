import { serialize, parse, parseSetCookie, type SerializeOptions, type Cookies } from "cookie"

/**
 * A builder class for constructing and manipulating HTTP headers.
 * It includes methods to set, delete, and retrieve headers, as well as
 * manage cookies within the headers.
 */
export class HeadersBuilder {
    private headers: Headers

    constructor(initialHeaders?: HeadersInit) {
        this.headers = new Headers(initialHeaders)
    }

    setHeader(name: string, value: string): HeadersBuilder {
        this.headers.set(name, value)
        return this
    }

    setCookie(name: string, value: string, options?: SerializeOptions): HeadersBuilder {
        this.headers.append("Set-Cookie", serialize(name, value, options))
        return this
    }

    getHeader(name: string): string | null {
        return this.headers.get(name)
    }

    getCookie(name: string): string | undefined {
        const cookies = parse(this.headers.get("cookie") ?? "")
        return cookies[name]
    }

    getSetCookie(name: string): string | undefined {
        const cookies = this.headers.getSetCookie()
        const cookie = cookies.find((cookie) => cookie.startsWith(name + "="))
        return cookie ? parseSetCookie(cookie).value : undefined
    }

    delete(name: string): HeadersBuilder {
        this.headers.delete(name)
        return this
    }

    append(name: string, value: string): HeadersBuilder {
        this.headers.append(name, value)
        return this
    }

    has(name: string): boolean {
        return this.headers.has(name)
    }

    hasCookie(name: string): boolean {
        const cookies = parse(this.headers.get("cookie") ?? "")
        return name in cookies
    }

    toHeaders(): Headers {
        return new Headers(this.headers)
    }

    toCookies(): Cookies {
        return parse(this.headers.get("cookie") ?? "")
    }
}
