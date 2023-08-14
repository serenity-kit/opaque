// This file serves only as a template and will be copied
// by the build script into the build directory.
// The imports in this file are relative to the target build
// directory so will show up as errors here.

export {
  createServerSetup as createSetup,
  startServerLogin as startLogin,
  finishServerLogin as finishLogin,
  createServerRegistrationResponse as createRegistrationResponse,
  getServerPublicKey as getPublicKey,
} from "./opaque";

export type {
  StartServerLoginParams as LoginStartParams,
  StartServerLoginResult as LoginStartResult,
  FinishServerLoginParams as LoginFinishParams,
  FinishServerLoginResult as LoginFinishResult,
  CreateServerRegistrationResponseParams as CreateRegistrationResponseParams,
  CreateServerRegistrationResponseResult as CreateRegistrationResponseResult,
} from "./opaque";
