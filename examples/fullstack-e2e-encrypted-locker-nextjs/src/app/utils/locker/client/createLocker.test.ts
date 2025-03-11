import canonicalize from "canonicalize";
import sodium from "libsodium-wrappers";
import { createLocker } from "./createLocker";

const data = JSON.stringify({ secretNotes: [{ id: "1", text: "secret" }] });
// sodium.to_base64(sodium.randombytes_buf(32))
const exportKey = "iX3NooF-7W5dXzJWEso-ilpcYE-v_vj1Uam3rpDvKBQ";
const sessionKey = "dQcJZvTqCgDzW36bzQrnJ6PIcVcZgiRRaFHwC5D4QxY";
const invalidKey = "invalidKey";

beforeAll(async () => {
  await sodium.ready;
});

it("should encrypt locker data", () => {
  const locker = createLocker({
    data,
    exportKey,
    sessionKey,
  });

  expect(typeof locker.ciphertext).toBe("string");
  expect(typeof locker.nonce).toBe("string");
  expect(typeof locker.serverVerificationMac).toBe("string");

  const serverVerificationMacContent = canonicalize({
    ciphertext: locker.ciphertext,
    nonce: locker.nonce,
  });
  if (!serverVerificationMacContent)
    throw new Error("serverVerificationMacContent is undefined");

  expect(
    sodium.crypto_auth_verify(
      sodium.from_base64(locker.serverVerificationMac),
      serverVerificationMacContent,
      sodium.from_base64(sessionKey),
    ),
  ).toBe(true);
});

it("should encrypt locker data with publicAdditionalData as null", () => {
  const locker = createLocker({
    data,
    exportKey,
    sessionKey,
  });

  expect(typeof locker.ciphertext).toBe("string");
  expect(typeof locker.nonce).toBe("string");
  expect(typeof locker.serverVerificationMac).toBe("string");

  const serverVerificationMacContent = canonicalize({
    ciphertext: locker.ciphertext,
    nonce: locker.nonce,
  });
  if (!serverVerificationMacContent)
    throw new Error("serverVerificationMacContent is undefined");

  expect(
    sodium.crypto_auth_verify(
      sodium.from_base64(locker.serverVerificationMac),
      serverVerificationMacContent,
      sodium.from_base64(sessionKey),
    ),
  ).toBe(true);
});

it("should throw an error for invalid sessionKey", () => {
  expect(() =>
    createLocker({
      data,
      exportKey,
      sessionKey: invalidKey,
    }),
  ).toThrow("invalid input");
});

it("should throw an error for invalid lockerSecretKey", () => {
  expect(() =>
    createLocker({
      data,
      exportKey: sodium.to_base64(new Uint8Array([0, 0, 0, 0])),
      sessionKey,
    }),
  ).toThrow("invalid key length");
});

it("should throw an error for invalid data", () => {
  expect(() =>
    createLocker({
      // @ts-expect-error
      data: new Date(),
      exportKey,
      sessionKey,
    }),
  ).toThrow("unsupported input type for message");
});
