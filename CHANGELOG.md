# CHANGELOG

All notable changes to this project will be documented in this file.

This changelog follows the [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format and reflects changes across the entire monorepo.  
Per-package version history is maintained inside each package’s own `CHANGELOG.md`.

---

## [Unreleased]

### BREAKING CHANGES

- The `middlewares` option was renamed to `use` to align with standard conventions in backend libraries. Middleware behavior remains unchanged; only the name was updated for improved clarity. The option was renamed in `createRouter`, `createEndpoint`, and `createEndpointConfig`. [#38](https://github.com/aura-stack-ts/router/pull/38)

### Added

- Added `cache`, `credentials`, and `mode` RequestInit options in `createClient`. These options are passed to all requests made by the client. [#37](https://github.com/aura-stack-ts/router/pull/37)

- Added support for multiple HTTP methods in endpoint definitions via `createEndpoint`. Multiple HTTP methods can now match the same route. [#36](https://github.com/aura-stack-ts/router/pull/36)

- Added support for dynamic headers in `createClient`. Headers can now be returned as an object or a `Promise` resolving to an object. [#33](https://github.com/aura-stack-ts/router/pull/33)

- Added `basePath` option in `createClient` function to define the base path for all requests made to the endpoints. [#30](https://github.com/aura-stack-ts/router/pull/30).

- Introduced client API to access endpoints declared in the router via `createRouter`. The client API can be defined using the `createClient` function that takes the router type as a generic argument. [#28](https://github.com/aura-stack-ts/router/pull/28).

---

## [0.5.0] - 2025-12-22

### Added

- Added `HeadersBuilder` class for HTTP headers management with methods for common operations: `setHeader`, `getHeader`, `setCookie`, `getCookie`, and `getSetCookie`. Exposed via `/headers` entry point. [#26](https://github.com/aura-stack-ts/router/pull/26).

- Added cookie package via `/cookie` entry point for direct cookie management using the [cookie package](https://www.npmjs.com/package/cookie). [#26](https://github.com/aura-stack-ts/router/pull/26).

### Changed

- Updated the default error message for failed Zod schema validation in `searchParams`, `params`, and `body` context values. Now returns a detailed object with `message`, `error`, and `details` fields. [#25](https://github.com/aura-stack-ts/router/pull/25).

---

## [0.4.0] - 2025-12-09

### Added

- Added the `route`, `method`, and `url` properties to the `context` object for both route handlers and middlewares per endpoint to access extensive metadata related to the incoming request. [#19](https://github.com/aura-stack-ts/router/pull/19).

### Changed

- **BREAKING CHANGE:** The `request` property has been moved into the context object for route handlers and middlewares. Handlers now receive a single context parameter instead of separate `request` and `context` arguments. [#22](https://github.com/aura-stack-ts/router/pull/22).

- **BREAKING CHANGE:** The `request` property has also been moved into the `context` object for global middlewares. The global context now includes the incoming request along with the context defined in `createRouter.context`. [#18](https://github.com/aura-stack-ts/router/pull/18).

---

## [0.3.0] - 2025-11-18

### Added

- Added `isRouterError`, which checks whether a given error is an instance of the internal `RouterError` class. Use it with the `onError` handler to differentiate router errors from generic errors. [#12](https://github.com/aura-stack-ts/router/pull/12).

- Added `onError` handler in `createRouter` to customize error responses for failures that occur during router, endpoint, or middleware execution. [#12](https://github.com/aura-stack-ts/router/pull/12).

- Added support for Zod schemas to validate dynamic route parameters. Endpoint parameter schemas can be supplied via `createEndpoint` or `createEndpointConfig`; these schemas are used at runtime to validate and coerce parameters and provide stronger compile-time types via Zod inference. [#10](https://github.com/aura-stack-ts/router/pull/10)

### Changed

- Updated request body handling by cloning the original request before parsing. This prevents the raw request stream from being consumed prematurely and allows reading the body multiple times within endpoint handlers. [#13](https://github.com/aura-stack-ts/router/pull/13).

- Implemented a trie data structure to enhance route‑matching performance in the router. [#14](https://github.com/aura-stack-ts/router/pull/14).

---

## [0.2.0] - 2025-10-23

### Changed

- Router now only exposes HTTP handlers that are defined via `createRouter`. Undefined HTTP handlers are not exposed, preventing TypeScript errors when accessing non-existent methods. [#8](https://github.com/aura-stack-js/router/pull/8)

- Removed the second `context` argument from the HTTP handler functions returned by `createRouter`. Handlers now accept a single `Request` parameter and return a `Response`. [#6](https://github.com/aura-stack-js/router/pull/6)

---

## [0.1.0] - 2025-10-08

### Added

- Added standardized error responses for unexpected errors thrown within core functions. These responses include detailed information such as `statusCode`, `statusText`, and a descriptive `message``. [#4](https://github.com/aura-stack-js/router/pull/4)

- Added support for middlewares in route handlers via `createEndpoint.config.middlewares` or `createEndpointConfig.middlewares`. Middlewares receive Zod schemas defined in `createEndpoint.config.schemas` for `body` and `searchParams`, providing inferred types in the context for router handlers and global middlewares in `createRouter` functions. [#2](https://github.com/aura-stack-js/router/pull/2)

- Introduced core modules for the package, including `createRouter` to create the main router, `createEndpoint` to define endpoints within the router, and `createEndpointConfig` to define config options for `createEndpoint`. [#1](https://github.com/aura-stack-js/router/pull/1)
