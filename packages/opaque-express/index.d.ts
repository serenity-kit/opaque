/**
 * @template User
 * @template Payload
 * @template CustomData
 * @param {Config<User, Payload, CustomData>} config
 * @returns {Router}
 */
export default function _default<User, Payload, CustomData>({ serverSetup, opaque, ...config }: Config<User, Payload, CustomData>): Router;
export type MaybeAsync<T> = T | Promise<T>;
export type CreateUser<User, Payload> = (user: User, passwordFile: string) => MaybeAsync<Payload>;
export type Result<L, R> = {
    ok: true;
    value: R;
} | {
    ok: false;
    error: L;
};
export type Reader<T> = (input: unknown) => Result<string, T>;
export type LoginStore = {
    createLogin: (userIdent: string, login: string) => MaybeAsync<void>;
    removeLogin: (userIdent: string) => MaybeAsync<string>;
};
export type FinishLogin<CustomData> = (userIdent: string, sessionKey: string, customData: CustomData) => MaybeAsync<void>;
export type Config<User = unknown, CreateResponse = unknown, CustomData = unknown> = {
    createUser: CreateUser<User, CreateResponse>;
    serverSetup: string;
    loginStore?: LoginStore | undefined;
    getPasswordFile: (userIdent: string) => MaybeAsync<string>;
    finishLogin: FinishLogin<CustomData>;
    opaque: typeof import("@serenity-kit/opaque");
};
import { Router } from "express";
