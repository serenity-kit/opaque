/**
 * @typedef {Object} OpaqueConfig
 * @prop {string} basePath
 * @prop {typeof import('@serenity-kit/opaque')} opaque
 * @prop {typeof fetch} [fetch]
 * @prop {HeadersInit} [headers]
 */
/**
 * @template [UserResponse=unknown]
 * @template [UserData=unknown]
 * @param {OpaqueConfig} config
 */
export function useOpaqueRegister<UserResponse = unknown, UserData = unknown>(config: OpaqueConfig): (userIdentifier: string, password: string, userData: UserData) => Promise<UserResponse>;
/**
 * @template [CustomData=unknown]
 * @param {OpaqueConfig} config
 */
export function useOpaqueLogin<CustomData = unknown>(config: OpaqueConfig): (userIdentifier: string, password: string, customData?: CustomData | undefined) => Promise<string | null>;
/**
 * @template [UserResponse=unknown]
 * @template [UserData=unknown]
 * @param {OpaqueConfig} config
 */
export function useOpaqueRegisterState<UserResponse = unknown, UserData = unknown>(config: OpaqueConfig): {
    register: (userIdentifier: string, password: string, userData: UserData) => Promise<UserResponse | null>;
    isLoading: boolean;
    error: unknown;
};
/**
 * @template [CustomData=unknown]
 * @param {OpaqueConfig} config
 */
export function useOpaqueLoginState<CustomData = unknown>(config: OpaqueConfig): {
    login: (userIdentifier: string, password: string, customData?: CustomData | undefined) => Promise<string | null>;
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
