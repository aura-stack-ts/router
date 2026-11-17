export type Prettify<Obj extends object> = {
    [Key in keyof Obj]: Obj[Key]
} & {}

export type LiteralUnion<T extends U, U = string> = T | (U & Record<never, never>)

/**
 * Utility type that represents a value that can be either synchronous or a Promise.
 */
export type Awaitable<T> = T | Promise<T>
