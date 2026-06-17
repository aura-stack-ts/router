import type {
    AuraRouterErrorCode,
    AuraRouterErrorOptions,
    AuraRouterErrorType,
    AuraRouterValidationErrorOptions,
    RouterCatalogEntry,
    ValidationIssueDetail,
} from "@/@types/types.ts"

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
export const statusText: Record<StatusCode, StatusCode> = Object.keys(statusCode).reduce(
    (previous, status) => {
        return { ...previous, [status]: status }
    },
    {} as Record<StatusCode, StatusCode>
)

export const AURA_ERROR_CODES = {
    UNSUPPORTED_SCHEMA_VALIDATOR: "UNSUPPORTED_SCHEMA_VALIDATOR",
    INVALID_METHOD_DEFINITION: "INVALID_METHOD_DEFINITION",
    INVALID_ROUTE_DEFINITION: "INVALID_ROUTE_DEFINITION",
    INVALID_HANDLER_DEFINITION: "INVALID_HANDLER_DEFINITION",
    INVALID_GLOBAL_MIDDLEWARE_DEFINITION: "INVALID_GLOBAL_MIDDLEWARE_DEFINITION",
    INVALID_ENDPOINT_MIDDLEWARE_DEFINITION: "INVALID_ENDPOINT_MIDDLEWARE_DEFINITION",

    UNPROCESSABLE_ENTITY: "UNPROCESSABLE_ENTITY",
    UNPROCESSABLE_BODY_ENTITY: "UNPROCESSABLE_BODY_ENTITY",
    MIDDLEWARE_EXECUTION_FAILED: "MIDDLEWARE_EXECUTION_FAILED",
    ROUTER_PIPELINE_ERROR: "ROUTER_PIPELINE_ERROR",
    METHOD_NOT_ALLOWED: "METHOD_NOT_ALLOWED",
    NOT_FOUND: "NOT_FOUND",

    CONFLICTING_DYNAMIC_SEGMENT: "CONFLICTING_DYNAMIC_SEGMENT",
    UNKNOWN_SCHEMA_ERROR: "UNKNOWN_SCHEMA_ERROR",
} as const

export const ROUTER_ERROR_CATALOG: Record<AuraRouterErrorCode, RouterCatalogEntry> = {
    UNSUPPORTED_SCHEMA_VALIDATOR: {
        type: "ROUTER_INIT",
        statusCode: 500,
        name: "RouterInitError",
        message:
            "The application definition assigned an unrecognized schema engine contract. The system explicitly supports: Arktype, Zod, Valibot, and Typebox.",
        userMessage: "An internal initialization error occurred. Schema parsing engine is unsupported.",
    },
    INVALID_METHOD_DEFINITION: {
        type: "ROUTER_INIT",
        statusCode: 500,
        name: "RouterInitError",
        message:
            "An endpoint registration was attempted with an invalid or poorly formatted HTTP verb string. Ensure uppercase standard types are used.",
        userMessage: "Internal configuration failure. The route declaration defines an invalid HTTP method option.",
    },
    INVALID_ROUTE_DEFINITION: {
        type: "ROUTER_INIT",
        statusCode: 500,
        name: "RouterInitError",
        message: "The designated URL pattern string parsing layout failed regex format checks. Verify base formatting patterns.",
        userMessage: "Internal configuration failure. The route declaration schema contains an unparseable pattern format.",
    },
    INVALID_HANDLER_DEFINITION: {
        type: "ROUTER_INIT",
        statusCode: 500,
        name: "RouterInitError",
        message:
            "The registration chain was rejected because the execution callback parameter is completely missing or is not a callable JavaScript function.",
        userMessage: "Internal configuration failure. The target endpoint callback executor is missing or invalid.",
    },
    INVALID_GLOBAL_MIDDLEWARE_DEFINITION: {
        type: "ROUTER_INIT",
        statusCode: 500,
        name: "RouterInitError",
        message:
            "An element inside the global middleware array passed to the router constructor instance is not a callable function execution unit.",
        userMessage: "Internal configuration failure. One or more global middleware elements are improperly structured.",
    },
    INVALID_ENDPOINT_MIDDLEWARE_DEFINITION: {
        type: "ROUTER_INIT",
        statusCode: 500,
        name: "RouterInitError",
        message:
            "The array mapping setup for route-specific interceptors contains data nodes that are not standard framework handler methods.",
        userMessage: "Internal configuration failure. Local endpoint tracking middleware chains hold invalid types.",
    },
    UNPROCESSABLE_ENTITY: {
        type: "VALIDATION",
        statusCode: 422,
        name: "ValidationError",
        message:
            "The structural validation layer caught explicit context mapping errors against user parameter, query, or body validation configurations.",
        userMessage: "The request body or parameter schema layout contains input format errors.",
    },
    UNPROCESSABLE_BODY_ENTITY: {
        type: "VALIDATION",
        statusCode: 400,
        name: "ValidationError",
        message:
            "The stream deserialization hook crashed. The incoming content-type transport headers do not align with raw request payload structures.",
        userMessage: "Invalid request body structure. The message content format could not be parsed cleanly.",
    },
    MIDDLEWARE_EXECUTION_FAILED: {
        type: "ROUTER_FLOW",
        statusCode: 500,
        name: "RouterExecutionError",
        message:
            "An error was thrown during the processing pipeline inside a route-specific execution hook before reaching primary request handlers.",
        userMessage: "An internal pipeline error occurred during intermediate request step processing workflows.",
    },
    ROUTER_PIPELINE_ERROR: {
        type: "ROUTER_FLOW",
        statusCode: 500,
        name: "RouterExecutionError",
        message:
            "A structural lifecycle step exception escaped global core handler catch blocks. Re-thrown aggregation state from internal tracking layers.",
        userMessage: "An unexpected error occurred while executing the server endpoint route pipeline operations.",
    },
    METHOD_NOT_ALLOWED: {
        type: "ROUTER_FLOW",
        statusCode: 405,
        name: "RouterFlowError",
        message:
            "The target pathname matching route logic successfully located path structures, but the incoming client HTTP method has no active listener rules mapped.",
        userMessage: "The requested resource does not support the submitted HTTP execution method request verb.",
    },
    NOT_FOUND: {
        type: "ROUTER_FLOW",
        statusCode: 404,
        name: "RouterFlowError",
        message:
            "The structural trie routing node search completed cleanly but returned zero valid path leaves matching the requested request path string location.",
        userMessage: "The requested route address cannot be found or is unavailable on this application endpoint server context.",
    },

    CONFLICTING_DYNAMIC_SEGMENT: {
        type: "ROUTER_INIT",
        statusCode: 500,
        name: "RouterInitError",
        message:
            "The application routing configuration failed compile steps. A designated path declaration attempts to define multiple dynamic parameter segments using duplicate names, which prevents safe runtime context parsing.",
        userMessage: "Internal configuration failure. The route structure contains conflicting dynamic param segment keys.",
    },
    UNKNOWN_SCHEMA_ERROR: {
        type: "VALIDATION",
        statusCode: 500,
        name: "ValidationError",
        message:
            "An unhandled exception or critical system failure occurred inside the structural validation compilation pipeline while executing schema evaluation matching checks.",
        userMessage: "An unexpected internal processing error occurred during incoming request schema validation verification.",
    },
}

interface V8ErrorConstructor extends ErrorConstructor {
    captureStackTrace(targetObject: object, constructorOpt?: Function): void
}

/**
 * Type guard to check if the current runtime environment
 * supports Error.captureStackTrace.
 */
export const hasCaptureStackTrace = (errorConstructor: ErrorConstructor): errorConstructor is V8ErrorConstructor => {
    return "captureStackTrace" in errorConstructor && typeof (errorConstructor as any).captureStackTrace === "function"
}

export class AuraRouterError extends Error {
    readonly code: AuraRouterErrorCode
    readonly type: AuraRouterErrorType
    readonly userMessage: string
    readonly statusCode: number
    readonly isAuraRouterError = true as const

    constructor({ code, message, cause, statusCode, userMessage }: AuraRouterErrorOptions) {
        const entry = ROUTER_ERROR_CATALOG[code]
        const finalInternalMessage = message ?? entry.message

        super(finalInternalMessage, { cause })

        this.name = entry.name
        this.code = code
        this.type = entry.type
        this.statusCode = statusCode ?? entry.statusCode
        this.userMessage = userMessage ?? entry.userMessage

        Object.setPrototypeOf(this, new.target.prototype)
        if (hasCaptureStackTrace(Error)) {
            Error.captureStackTrace(this, new.target)
        }
    }

    toResponse() {
        return Response.json(
            {
                type: this.type,
                code: this.code,
                message: this.userMessage,
            },
            { status: this.statusCode, statusText: this.code }
        )
    }
}

export class AuraRouterValidationError extends AuraRouterError {
    readonly details: Record<string, ValidationIssueDetail>
    readonly isAuraRouterValidationError = true as const

    constructor(options: AuraRouterValidationErrorOptions) {
        super({ ...options, code: "UNPROCESSABLE_ENTITY" })
        this.name = "ValidationError"
        this.details = options.details
    }

    toResponse() {
        return Response.json(
            {
                type: this.type,
                code: this.code,
                message: this.userMessage,
                details: this.details,
            },
            { status: this.statusCode, statusText: this.code }
        )
    }
}

/**
 * Defines the errors used in AuraStack Router. Includes HTTP status code and
 * status text.
 * @deprecated Use AuraRouterError instead
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

/**
 * @deprecated Use AuraRouterError instead
 */
export class RouterError extends AuraStackRouterError {
    constructor(type: StatusCode, message: string, name?: string) {
        super(type, message, name)
        this.name = name ?? "RouterError"
    }
}

/**
 * @deprecated Use AuraRouterError instead
 */
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
