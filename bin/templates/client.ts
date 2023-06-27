export {
  clientRegistrationStart as startRegistration,
  clientRegistrationFinish as finishRegistration,
  clientLoginStart as startLogin,
  clientLoginFinish as finishLogin,
} from "./opaque";

export type {
  ClientRegistrationStartResult as RegistrationStartResult,
  ClientRegistrationFinishParams as RegistrationFinishParams,
  ClientRegistrationFinishResult as RegistrationFinishResult,
  ClientLoginStartResult as LoginStartResult,
  ClientLoginFinishResult as LoginFinishResult,
  ClientLoginFinishParams as LoginFinishParams,
} from "./opaque";
