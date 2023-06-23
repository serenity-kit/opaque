/*
Ideas:

I added my ideas sorted with top down sorting on how sure I am that we should do it.
Looking forward to here what you think!

- every input becomes an object
  * I'm confident we should do this one.
- call the state `clientRegistrationState` and `clientLoginState` and `serverLoginState`
  * I think this is useful. This troubled me quite a bit that people might get it wrong during the implementation. btw this is inspired by opaque-ke. They do .state.finish()
- every output becomes an object
  * I kind of like it. It makes the results very explicit and the feels good in such a subtle API
- rename `credentialRequest` to `loginRequest` and `credentialResponse` to `loginResponse`
  * Feel very natural to me.
- rename `passwordFile` to `registrationRecord`
  * Matches the Spec and password file sounds scary
- leave out serverRegistrationFinish
  * Not sure about this one. In the end it does nothing and then we could even rename it to 
  `serverRegistrationCreateResponse` or `server.createRegistrationResponse`. This is inspired by the actual names in the Protocol `CreateRegistrationRequest`, `CreateRegistrationResponse`, `FinalizeRegistrationRequest`.
- Instead of exporting functions we can wrap them in a `client` and `server` object.
  * Unsure about this one. This looks a bit weird, but allows us to have "cleaner" function names like `startRegistration` instead of `clientRegistrationStart`.
  * People als could do:
  * ```
  * import { client as opaqueClient } from "@serenity-kit/opaque";
  * 
  * opaqueClient.startRegistration({ password });
  * ```
  * Not sure about this one. btw also can ask other people here and basically do a small survey.
  * 
  * Another idea in this area would be to just turn around the function names and do:
  * startClientRegistration
  * finishClientRegistration
  * createServerRegistrationResponse
  * 
  * startClientLogin
  * finishClientLogin
  * startServerLogin
  * finishServerLogin
*/

/*
Discarded ideas:
- Make the finish a function on the start result.
  * I works nicely on the client side where you basically have the state in memory. But on the server-side you have stateless endpoints you need new serialize and deserialize functions. This means more API surface than necessary.
  * I thought about doing it different for the client and server, but that feels too confusing. The consistency is more important is my take.
  * ```
  * const registration = opaque.createRegistration({ password });
  * registration.registrationRequest; // send to server
  * registration.finish({
  *   registrationResponse,
  *   password,
  * });
  * ```
*/

import * as opaque from "@serenity-kit/opaque";

// registration client
const { clientRegistrationState, registrationRequest } =
  opaque.client.startRegistration({ password });

// send the registrationRequest to the server and get back the registrationResponse

const { exportKey, registrationRecord } = opaque.client.finishRegistration({
  clientRegistrationState,
  registrationResponse,
  password,
});

// send the registrationRecord to the server and store it

// ----------------------------
// registration server
const { registrationResponse } = opaque.server.createRegistrationResponse({
  serverSetup,
  userIdentifier,
  registrationRequest,
});

// ----------------------------
// login client

const { clientLoginState, startLoginRequest } = opaque.client.startLogin({
  password,
});

const { exportKey, sessionKey, finishLoginRequest } = opaque.client.finishLogin(
  {
    clientLoginState,
    loginResponse,
    password,
  }
);

// ----------------------------
// login server

const { serverLoginState, loginResponse } = opaque.server.startLogin({
  serverSetup,
  userIdentifier,
  registrationRecord,
  startLoginRequest,
});

const { sessionKey } = opaque.server.finishLogin({
  serverLoginState,
  serverSetup,
  finishLoginRequest,
});
