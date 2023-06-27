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
  FinishClientRegistrationResult as FinishRegistrationPesult,
  StartClientLoginParams as StartLoginParams,
  StartClientLoginResult as StartLoginResult,
  FinishClientLoginResult as FinishLoginResult,
  FinishClientLoginParams as FinishLoginParams,
} from "./opaque";
