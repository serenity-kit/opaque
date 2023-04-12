import * as opaque from "opaque";

const host = "http://localhost:8089";

async function request(method, path, body = undefined) {
  console.log(`${method} ${host}${path}`, body);
  const res = await fetch(`${host}${path}`, {
    method,
    body: body && JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const { error } = await res.json();
    console.log(error);
    throw new Error(error);
  }
  return res;
}

async function register(username, password) {
  const { clientRegistration, registrationRequest } =
    opaque.clientRegistrationStart(password);
  const { registrationResponse } = await request("POST", `/register/start`, {
    username,
    registrationRequest,
  }).then((res) => res.json());

  console.log("registrationResponse", registrationResponse);
  const registrationMessage = opaque.clientRegistrationFinish({
    clientRegistration,
    registrationResponse,
    password,
  });

  const res = await request("POST", `/register/finish`, {
    username,
    registrationMessage,
  });
  console.log("finish successful", res.ok);
  return res.ok;
}

async function login(username, password) {
  const { clientLogin, credentialRequest } = opaque.clientLoginStart(password);

  const { credentialResponse } = await request("POST", "/login/start", {
    username,
    credentialRequest,
  }).then((res) => res.json());

  const loginResult = opaque.clientLoginFinish({
    clientLogin,
    credentialResponse,
    password,
  });

  if (!loginResult) {
    return null;
  }
  const { sessionKey, credentialFinalization } = loginResult;
  const res = await request("POST", "/login/finish", {
    username,
    credentialFinalization,
  });
  return res.ok ? sessionKey : null;
}

window.handleSubmit = async function handleSubmit() {
  event.preventDefault();

  const username = event.target.username.value;
  const password = event.target.password.value;
  const action = event.submitter.name;

  try {
    if (action === "login") {
      const sessionKey = await login(username, password);
      if (sessionKey) {
        alert(
          `User "${username}" logged in successfully; sessionKey = ${sessionKey}`
        );
      } else {
        alert(`User "${username}" login failed`);
      }
    } else if (action === "register") {
      const ok = await register(username, password);
      if (ok) {
        alert(`User "${username}" registered successfully`);
      } else {
        alert(`Failed to register user "${username}"`);
      }
    }
  } catch (err) {
    console.error(err);
    alert(err);
  }
};
