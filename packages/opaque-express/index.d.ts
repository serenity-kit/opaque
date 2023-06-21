/**
 * @param {Config} config
 * @returns {Router}
 */
export default function _default({ serverSetup, opaque, ...config }: Config): Router;
export type CreateUser = (userIdent: string, passwordFile: string) => Promise<unknown>;
export type Config = {
    createUser: CreateUser;
    serverSetup: string;
    fallbackRegistrationError?: unknown;
    createLogin: (userIdent: string, login: string) => Promise<void>;
    removeLogin: (userIdent: string) => Promise<string>;
    getPasswordFile: (userIdent: string) => Promise<string>;
    finishLogin: (userIdent: string, sessionKey: string) => Promise<void>;
    opaque: typeof import("@serenity-kit/opaque");
};
import { Router } from "express";
