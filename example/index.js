import * as opaque from "opaque";

const server = new opaque.Server();
// console.log(server);

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

const registeredUsers = {};

window.handleSubmit = function handleSubmit() {
  event.preventDefault();

  const username = event.target.username.value;
  const password = event.target.password.value;
  const action = event.submitter.name;

  if (action === "login") {
    const passwordFile = registeredUsers[username];
    if (passwordFile == null) {
      alert(`User "${username}" is not registered`);
      return;
    }
    const ok = accountLogin(username, password, passwordFile);
    if (ok) {
      alert(`User "${username}" logged in successfully`);
    } else {
      alert(`User "${username}" login failed`);
    }
  } else if (action === "register") {
    if (registeredUsers[username] != null) {
      alert(`User "${username}" is already registered`);
      return;
    }
    const passwordFile = accountRegistration(username, password);
    registeredUsers[username] = passwordFile;

    const elem = document.createElement("div");
    elem.appendChild(document.createTextNode(username));
    window.users.appendChild(elem);
  }
};
