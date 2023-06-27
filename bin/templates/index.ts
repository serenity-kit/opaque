// @ts-ignore
import wasmData from "./opaque_bg.wasm";
import init from "./opaque";
// @ts-ignore
export const ready = init(wasmData()).then(() => {});
export * as client from "./client";
export * as server from "./server";
export type {
  ServerLoginStartParams,
  ServerLoginFinishParams,
  ServerRegistrationStartParams,
  ClientRegistrationStartResult,
  ClientRegistrationFinishParams,
  ClientRegistrationFinishResult,
  ClientLoginStartResult,
  ClientLoginFinishResult,
  ClientLoginFinishParams,
} from "./opaque";
