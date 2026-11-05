/**
 * HTTP methods defined in HTTP/1.1 specification.
 * @see https://datatracker.ietf.org/doc/html/rfc7231#section-4.3
 */
export type HTTPMethod = "GET" | "POST" | "DELETE" | "PUT" | "PATCH" | "OPTIONS" | "HEAD" | "TRACE" | "CONNECT"

/**
 * Content types supported by the router.
 */
export type ContentType =
    | "application/json"
    | "application/x-www-form-urlencoded"
    | "text/plain"
    | "multipart/form-data"
    | "application/xml"
    | "application/octet-stream"
    | `text/${string}`
    | `image/${string}`
    | `video/${string}`
    | `audio/${string}`
    | "application/pdf"

/**
 * Basic and standard HTTP headers to be used in requests and responses.
 */
export interface RequestHeaders extends Record<string, number | string | string[] | undefined> {
    accept?: string | undefined
    "accept-encoding"?: string | undefined
    "accept-language"?: string | undefined
    "accept-patch"?: string | undefined
    "accept-ranges"?: string | undefined
    "access-control-allow-credentials"?: string | undefined
    "access-control-allow-headers"?: string | undefined
    "access-control-allow-methods"?: string | undefined
    "access-control-allow-origin"?: string | undefined
    "access-control-expose-headers"?: string | undefined
    "access-control-max-age"?: string | undefined
    "access-control-request-headers"?: string | undefined
    "access-control-request-method"?: string | undefined
    age?: string | undefined
    allow?: string | undefined
    "alt-svc"?: string | undefined
    authorization?: string | undefined
    "cache-control"?: string | undefined
    connection?: string | undefined
    "content-disposition"?: string | undefined
    "content-encoding"?: string | undefined
    "content-language"?: string | undefined
    "content-length"?: string | undefined
    "content-location"?: string | undefined
    "content-range"?: string | undefined
    "content-type"?: string | undefined
    cookie?: string | undefined
    date?: string | undefined
    etag?: string | undefined
    expect?: string | undefined
    expires?: string | undefined
    forwarded?: string | undefined
    from?: string | undefined
    host?: string | undefined
    "if-match"?: string | undefined
    "if-modified-since"?: string | undefined
    "if-none-match"?: string | undefined
    "if-unmodified-since"?: string | undefined
    "last-modified"?: string | undefined
    location?: string | undefined
    origin?: string | undefined
    pragma?: string | undefined
    "proxy-authenticate"?: string | undefined
    "proxy-authorization"?: string | undefined
    "public-key-pins"?: string | undefined
    range?: string | undefined
    referer?: string | undefined
    "retry-after"?: string | undefined
    "sec-fetch-site"?: string | undefined
    "sec-fetch-mode"?: string | undefined
    "sec-fetch-user"?: string | undefined
    "sec-fetch-dest"?: string | undefined
    "sec-websocket-accept"?: string | undefined
    "sec-websocket-extensions"?: string | undefined
    "sec-websocket-key"?: string | undefined
    "sec-websocket-protocol"?: string | undefined
    "sec-websocket-version"?: string | undefined
    "set-cookie"?: string[] | undefined
    "strict-transport-security"?: string | undefined
    tk?: string | undefined
    trailer?: string | undefined
    "transfer-encoding"?: string | undefined
    upgrade?: string | undefined
    "user-agent"?: string | undefined
    vary?: string | undefined
    via?: string | undefined
    warning?: string | undefined
    "www-authenticate"?: string | undefined
}
