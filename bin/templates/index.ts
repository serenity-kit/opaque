// This file serves only as a template and will be copied
// by the build script into the build directory.
// The imports in this file are relative to the target build
// directory so will show up as errors here.

// @ts-ignore we are ignoring this because TS is not aware
// of the rollup transformations and will complain that the
// wasm does not have a default export
import wasmData from "./opaque_bg.wasm";
import init from "./opaque";
export const ready = init(wasmData()).then(() => {
  // this .then callback only serves to drop the return value of the promise
  // so that the type of our export is Promise<void>
});
export * as client from "./client";
export * as server from "./server";
