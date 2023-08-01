import sodium from "libsodium-wrappers";
import { createAuthorizationToken } from "./createAuthorizationToken";

// sodium.to_base64(sodium.randombytes_buf(32))
const sessionKey = "dQcJZvTqCgDzW36bzQrnJ6PIcVcZgiRRaFHwC5D4QxY";
const invalidKey = "invalidKey";

beforeAll(async () => {
  await sodium.ready;
});

it("should throw an error for an invalid exportKey", () => {
  expect(() => createAuthorizationToken({ sessionKey: invalidKey })).toThrow();
});

it("should create an authorizationToken from a sessionKey", () => {
  const authorizationToken = createAuthorizationToken({ sessionKey });

  expect(authorizationToken).toBe(
    "2TicYPonoBFZZ9XydRp5JxjYyKNMLDnOPWWFQcvn9JQ"
  );
});

it("should create an authorizationToken from a sessionKey with a custom subkeyId", () => {
  const authorizationToken = createAuthorizationToken({
    sessionKey,
    subkeyId: 80,
  });

  expect(authorizationToken).toBe(
    "ZuTIrwzwIFxwrSaATjkRLNA6Xwz5pg125xASzybQEXw"
  );
});
