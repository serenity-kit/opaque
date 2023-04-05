import * as opaque from "opaque";
window.opaque = opaque;

// -------------------- registration flow example --------------------

// on client; start registration request process
const clientStart = opaque.clientRegisterStart("password");
const registrationRequest = clientStart.getRegistrationRequest();
console.log("registrationRequest", registrationRequest);

// ... client sends registrationRequest to server ...

// on server start registration process
const registrationResponse = opaque.serverRegisterStart(
  "foobar",
  registrationRequest
);
console.log("registrationResponse", registrationResponse);

// ... server sends registrationResponse to client ...

// on client finish registration with server registrationResponse to obtain registrationMessage
const registrationMessage = clientStart.finish(
  "password",
  registrationResponse
);
console.log("registrationMessage", registrationMessage);

// ... client sends registrationMessage to server ...

// on server finish with registrationMessage to obtain passwordFile credentials
const passwordFile = opaque.serverRegisterFinish(registrationMessage);
console.log("passwordFile", passwordFile);

// -------------------- login flow example --------------------

// TODO
