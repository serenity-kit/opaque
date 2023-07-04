/**
 * @template User
 * @template Payload
 * @template CustomData
 * @param {Config<User, Payload, CustomData>} config
 * @returns {Router}
 */
export default function _default<User, Payload, CustomData>({ serverSetup, opaque, ...config }: Config<User, Payload, CustomData>): Router;
export type MaybeAsync<T> = T | Promise<T>;
export type RegistrationSuccessHandler<User, Payload> = (user: User, registrationRecord: string) => MaybeAsync<Payload>;
export type Result<L, R> = {
    ok: true;
    value: R;
} | {
    ok: false;
    error: L;
};
export type LoginStore = {
    createLogin: (userIdent: string, login: string) => MaybeAsync<void>;
    removeLogin: (userIdent: string) => MaybeAsync<string>;
};
export type LoginSuccessHandler<CustomData> = (userIdent: string, sessionKey: string, customData: CustomData) => MaybeAsync<void>;
export type Config<User = unknown, RegistrationSuccessResponse = unknown, CustomData = unknown> = {
    onRegistrationSuccess: RegistrationSuccessHandler<User, RegistrationSuccessResponse>;
    serverSetup: string;
    loginStore?: LoginStore | undefined;
    getRegistrationRecord: (userIdent: string) => MaybeAsync<string>;
    onLoginSuccess: LoginSuccessHandler<CustomData>;
    opaque: typeof import("@serenity-kit/opaque");
};
import { Router } from "express";
