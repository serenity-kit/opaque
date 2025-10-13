// This file serves only as a template and will be copied
// by the build script into the build directory.
// The imports in this file are relative to the target build
// directory so will show up as errors here.

export {
  startClientRegistration as startRegistration,
  finishClientRegistration as finishRegistration,
  startClientLogin as startLogin,
  finishClientLogin as finishLogin,
} from "./opaque";

export type {
  StartClientRegistrationParams as StartRegistrationParams,
  StartClientRegistrationResult as StartRegistrationResult,
  FinishClientRegistrationParams as FinishRegistrationParams,
  FinishClientRegistrationResult as FinishRegistrationResult,
  StartClientLoginParams as StartLoginParams,
  StartClientLoginResult as StartLoginResult,
  FinishClientLoginResult as FinishLoginResult,
  FinishClientLoginParams as FinishLoginParams,
} from "./opaque";
