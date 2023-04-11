import * as opaque from "../build";

test("full registration flow", () => {
  const server = opaque.serverSetup();
  const { state, registrationRequest } =
    opaque.clientRegistrationStart("hunter42");
  const registrationResponse = opaque.serverRegistrationStart({
    server,
    username: "user123",
    registrationRequest,
  });

  const registrationMessage = opaque.clientRegistrationFinish({
    state,
    registrationResponse,
    password: "hunter42",
  });

  const passwordFile = opaque.serverRegistrationFinish(registrationMessage);

  expect(registrationMessage).toEqual(passwordFile);
});
