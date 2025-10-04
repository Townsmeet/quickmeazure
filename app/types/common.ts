/**
 * Common utility types used throughout the application
 */

/**
 * Generic dictionary type
 */
export type Dictionary<T> = Record<string, T>

/**
 * Make all properties in T optional
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

/**
 * Make all properties in T required
 */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>

/**
 * Make specific properties in T required and the rest optional
 */
export type AtLeast<T, K extends keyof T> = Partial<Omit<T, K>> & Required<Pick<T, K>>

/**
 * Make specific properties in T optional
 */
export type PartialPick<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

/**
 * Type for a function that returns a promise
 */
export type PromiseType<T> = () => Promise<T>

/**
 * Type for a value that can be a promise or not
 */
export type Awaitable<T> = T | Promise<T>

/**
 * Type for a value that can be an array or a single value
 */
export type ArrayOrSingle<T> = T | T[]

/**
 * Type for a value that can be null or undefined
 */
export type Nullable<T> = T | null | undefined

/**
 * Type for a function that takes no arguments and returns a value
 */
export type NoParamFunction<T> = () => T

/**
 * Type for a function that takes a single parameter and returns a value
 */
export type SingleParamFunction<T, R> = (arg: T) => R

/**
 * Type for a function that takes any number of arguments and returns a value
 */
export type AnyFunction = (...args: unknown[]) => unknown

/**
 * Type for a function that takes no arguments and returns void
 */
export type VoidFunction = () => void

/**
 * Type for a function that takes any arguments and returns void
 */
export type AnyVoidFunction = (...args: unknown[]) => void

/**
 * Type for a function that might return a promise
 */
export type MaybePromise<T> = T | Promise<T>

/**
 * Type for a value that can be a promise or a direct value or undefined
 */
export type MaybePromiseOrUndefined<T> = T | Promise<T> | undefined

/**
 * Type for a value that can be a promise or a direct value or null
 */
export type MaybePromiseOrNull<T> = T | Promise<T> | null

/**
 * Type for a value that can be a promise or a direct value or null or undefined
 */
export type MaybePromiseOrNullOrUndefined<T> = T | Promise<T> | null | undefined
