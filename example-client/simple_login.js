import * as opaque from "opaque";

const server = new opaque.Server();

// -------------------- registration flow example --------------------

function accountRegistration(username, password) {
  // on client; start registration request process
  const clientRegistration = opaque.clientRegisterStart(password);
  const registrationRequest = clientRegistration.getRegistrationRequest();
  console.log("registrationRequest", registrationRequest);

  // ... client sends registrationRequest to server ...

  // on server start registration process
  const registrationResponse = server.startRegistration(
    username,
    registrationRequest
  );
  console.log("registrationResponse", registrationResponse);

  // ... server sends registrationResponse to client ...

  // on client finish registration with server registrationResponse to obtain registrationMessage
  const registrationMessage = clientRegistration.finish(
    password,
    registrationResponse
  );
  console.log("registrationMessage", registrationMessage);

  // ... client sends registrationMessage to server ...

  // on server finish with registrationMessage to obtain passwordFile credentials
  const passwordFile = opaque.serverRegisterFinish(registrationMessage);
  console.log("passwordFile", passwordFile);

  return passwordFile;
}

// -------------------- login flow example --------------------

function accountLogin(username, password, passwordFile) {
  // on client; start login process
  const clientLogin = opaque.clientLoginStart(password);
  const credentialRequest = clientLogin.getCredentialRequest();
  console.log("credentialRequest", credentialRequest);

  // ... client sends credential request to server ...

  // on server; start login process with credentialRequest from client
  const serverLogin = server.startLogin(
    username,
    passwordFile,
    credentialRequest
  );
  const credentialResponse = serverLogin.getCredentialResponse();
  console.log("credentialResponse", credentialResponse);

  // ... server sends credentialResponse to client ...

  // on client; finish login with credentialResponse
  const loginResult = clientLogin.finish(password, credentialResponse);

  if (!loginResult) {
    // client detected login failure
    return false;
  }

  const credentialFinalization = loginResult.getCredentialFinalization();
  const clientSessionKey = loginResult.getSessionKey();
  console.log("loginResult", { credentialFinalization, clientSessionKey });

  // ... client sends credentialFinalization to server ...

  // on server; finish login
  const serverSessionKey = serverLogin.finish(credentialFinalization);

  console.log("serverSessionKey", serverSessionKey);
  return serverSessionKey === clientSessionKey;
}
