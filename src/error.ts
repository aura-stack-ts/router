/**
 * The HTTP status codes used in AuraStack Router.
 */
export const statusCode = {
    OK: 200,
    CREATED: 201,
    ACCEPTED: 202,
    NO_CONTENT: 204,
    MULTIPLE_CHOICES: 300,
    MOVED_PERMANENTLY: 301,
    FOUND: 302,
    SEE_OTHER: 303,
    NOT_MODIFIED: 304,
    TEMPORARY_REDIRECT: 307,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    PAYMENT_REQUIRED: 402,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    METHOD_NOT_ALLOWED: 405,
    NOT_ACCEPTABLE: 406,
    PROXY_AUTHENTICATION_REQUIRED: 407,
    UNPROCESSABLE_ENTITY: 422,
    INTERNAL_SERVER_ERROR: 500,
    NOT_IMPLEMENTED: 501,
    BAD_GATEWAY: 502,
    SERVICE_UNAVAILABLE: 503,
    HTTP_VERSION_NOT_SUPPORTED: 505,
}

type StatusCode = keyof typeof statusCode

/**
 * Reverse mapping of status codes to their corresponding status text.
 */
export const statusText = Object.keys(statusCode).reduce(
    (previous, status) => {
        return { ...previous, [status]: status }
    },
    {} as Record<StatusCode, StatusCode>
)

/**
 * Defines the errors used in AuraStack Router. Includes HTTP status code and
 * status text.
 * @deprecated Use RouterError instead
 */
export class AuraStackRouterError extends Error {
    /**
     * The HTTP status code associated with the error.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status
     * @example
     * NOT_FOUND: 404
     * METHOD_NOT_ALLOWED: 405
     * INTERNAL_SERVER_ERROR: 500
     */
    public readonly status: number

    /**
     * The HTTP status text associated with the status code of the error.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status
     * @example
     * NOT_FOUND: NOT_FOUND
     * METHOD_NOT_ALLOWED: METHOD_NOT_ALLOWED
     * INTERNAL_SERVER_ERROR: INTERNAL_SERVER_ERROR
     */
    public readonly statusText: StatusCode

    constructor(type: StatusCode, message: string, name?: string) {
        super(message)
        this.name = name ?? "RouterError"
        this.status = statusCode[type]
        this.statusText = statusText[type]
    }
}

export class RouterError extends AuraStackRouterError {
    constructor(type: StatusCode, message: string, name?: string) {
        super(type, message, name)
        this.name = name ?? "RouterError"
    }
}

export class InvalidZodSchemaError {
    
    public readonly status: number
    public readonly statusText: StatusCode
    public readonly errors: Record<string, string>

    constructor(type: StatusCode, errors: Record<string, string>) {
        this.status = statusCode[type]
        this.statusText = statusText[type]
        this.errors = errors
    }
}
