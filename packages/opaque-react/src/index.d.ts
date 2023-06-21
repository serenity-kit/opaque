/**
 * @typedef {Object} Config
 * @prop {string} basePath
 * @prop {typeof import('@serenity-kit/opaque')} opaque
 * @prop {typeof fetch} [fetch]
 * @prop {HeadersInit} [headers]
 */
/**
 * @param {Config} config
 */
export function useOpaqueRegister(config: Config): (userIdentifier: string, password: string) => Promise<boolean>;
/**
 * @param {Config} config
 */
export function useOpaqueLogin(config: Config): (userIdentifier: string, password: string) => Promise<string | null>;
/**
 * @param {Config} config
 */
export function useOpaqueRegisterRequest(config: Config): {
    request: (userIdentifier: string, password: string) => Promise<void>;
    isLoading: boolean;
    error: unknown;
};
/**
 * @param {Config} config
 */
export function useOpaqueLoginRequest(config: Config): {
    login: (userIdentifier: string, password: string) => Promise<void>;
    isLoading: boolean;
    error: unknown;
    sessionKey: string | null;
};
export type Config = {
    basePath: string;
    opaque: typeof import('@serenity-kit/opaque');
    fetch?: typeof fetch | undefined;
    headers?: HeadersInit | undefined;
};
