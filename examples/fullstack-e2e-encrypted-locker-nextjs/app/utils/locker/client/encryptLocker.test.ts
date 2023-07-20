import canonicalize from "canonicalize";
import sodium from "libsodium-wrappers";
import { encryptLocker } from "./encryptLocker";

const data = JSON.stringify({ secretNotes: [{ id: "1", text: "secret" }] });
const publicAdditionalData = {
  createdAt: new Date("2023-10-31").toISOString(),
};
// sodium.to_base64(sodium.randombytes_buf(32))
const exportKey = "iX3NooF-7W5dXzJWEso-ilpcYE-v_vj1Uam3rpDvKBQ";
const sessionKey = "dQcJZvTqCgDzW36bzQrnJ6PIcVcZgiRRaFHwC5D4QxY";
const invalidKey = "invalidKey";

beforeAll(async () => {
  await sodium.ready;
});

it("should encrypt locker data", () => {
  const encryptedLocker = encryptLocker({
    data,
    publicAdditionalData,
    exportKey,
    sessionKey,
  });

  expect(typeof encryptedLocker.data.ciphertext).toBe("string");
  expect(typeof encryptedLocker.data.nonce).toBe("string");
  expect(typeof encryptedLocker.tag).toBe("string");

  const tagContent = canonicalize({
    data: {
      ciphertext: encryptedLocker.data.ciphertext,
      nonce: encryptedLocker.data.nonce,
    },
    publicAdditionalData: {
      ciphertext: encryptedLocker.publicAdditionalData.ciphertext,
      nonce: encryptedLocker.publicAdditionalData.nonce,
    },
  });
  if (!tagContent) throw new Error("tagContent is undefined");

  expect(
    sodium.crypto_auth_verify(
      sodium.from_base64(encryptedLocker.tag),
      tagContent,
      sodium.from_base64(sessionKey)
    )
  ).toBe(true);
});

it("should throw an error for invalid sessionKey", () => {
  expect(() =>
    encryptLocker({
      data,
      publicAdditionalData,
      exportKey,
      sessionKey: invalidKey,
    })
  ).toThrow("invalid input");
});

it("should throw an error for invalid lockerSecretKey", () => {
  expect(() =>
    encryptLocker({
      data,
      publicAdditionalData,
      exportKey: sodium.to_base64(new Uint8Array([0, 0, 0, 0])),
      sessionKey,
    })
  ).toThrow("invalid key length");
});

it("should throw an error for invalid publicAdditionalData", () => {
  expect(() =>
    encryptLocker({
      data,
      publicAdditionalData: NaN,
      exportKey,
      sessionKey,
    })
  ).toThrow("NaN is not allowed");
});

it("should throw an error for invalid data", () => {
  expect(() =>
    encryptLocker({
      // @ts-expect-error
      data: new Date(),
      publicAdditionalData,
      exportKey,
      sessionKey,
    })
  ).toThrow("unsupported input type for message");
});
