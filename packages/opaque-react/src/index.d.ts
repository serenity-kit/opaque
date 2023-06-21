/**
 * @typedef {Object} OpaqueConfig
 * @prop {string} basePath
 * @prop {typeof import('@serenity-kit/opaque')} opaque
 * @prop {typeof fetch} [fetch]
 * @prop {HeadersInit} [headers]
 */
/**
 * @param {OpaqueConfig} config
 */
export function useOpaqueRegister(config: OpaqueConfig): (userIdentifier: string, password: string) => Promise<boolean>;
/**
 * @param {OpaqueConfig} config
 */
export function useOpaqueLogin(config: OpaqueConfig): (userIdentifier: string, password: string) => Promise<string | null>;
/**
 * @param {OpaqueConfig} config
 */
export function useOpaqueRegisterRequest(config: OpaqueConfig): {
    register: (userIdentifier: string, password: string) => Promise<boolean | undefined>;
    isLoading: boolean;
    error: unknown;
};
/**
 * @param {OpaqueConfig} config
 */
export function useOpaqueLoginRequest(config: OpaqueConfig): {
    login: (userIdentifier: string, password: string) => Promise<string | null | undefined>;
    isLoading: boolean;
    error: unknown;
    sessionKey: string | null;
};
export type OpaqueConfig = {
    basePath: string;
    opaque: typeof import('@serenity-kit/opaque');
    fetch?: typeof fetch | undefined;
    headers?: HeadersInit | undefined;
};
