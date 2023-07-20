import canonicalize from "canonicalize";
import sodium from "libsodium-wrappers";
import { Locker } from "../types";
import { createLocker } from "./createLocker";
import { decryptLocker } from "./decryptLocker";

const data = JSON.stringify({ secretNotes: [{ id: "1", text: "secret" }] });
const publicAdditionalData = {
  createdAt: new Date("2023-10-31").toISOString(),
};
// sodium.to_base64(sodium.randombytes_buf(32))
const exportKey = "iX3NooF-7W5dXzJWEso-ilpcYE-v_vj1Uam3rpDvKBQ";
const sessionKey = "dQcJZvTqCgDzW36bzQrnJ6PIcVcZgiRRaFHwC5D4QxY";
const invalidKey = "invalidKey";

let locker: Locker;

beforeAll(async () => {
  await sodium.ready;
  locker = createLocker({
    data,
    publicAdditionalData,
    exportKey,
    sessionKey,
  });
});

it("should decrypt locker as string by default", () => {
  const decryptedLocker = decryptLocker({
    locker,
    sessionKey,
    exportKey,
  });

  expect(decryptedLocker.data).toEqual(data);
  expect(decryptedLocker.publicAdditionalData).toEqual(publicAdditionalData);
});

it("should decrypt locker with publicAdditionalData as null", () => {
  const newLocker = createLocker({
    data,
    publicAdditionalData: null,
    exportKey,
    sessionKey,
  });
  const decryptedLocker = decryptLocker({
    locker: newLocker,
    sessionKey,
    exportKey,
  });

  expect(decryptedLocker.data).toEqual(data);
  expect(decryptedLocker.publicAdditionalData).toBeNull();
});

it("should decrypt locker as string if output string is provided", () => {
  const decryptedLocker = decryptLocker({
    locker,
    sessionKey,
    exportKey,
    outputFormat: "string",
  });

  expect(decryptedLocker.data).toEqual(data);
  expect(decryptedLocker.publicAdditionalData).toEqual(publicAdditionalData);
});

it("should decrypt locker as Uint8Array", () => {
  const otherLocker = createLocker({
    data: new Uint8Array([0, 42, 0, 99]),
    publicAdditionalData,
    exportKey,
    sessionKey,
  });

  const decryptedLocker = decryptLocker({
    locker: otherLocker,
    sessionKey,
    exportKey,
    outputFormat: "uint8array",
  });

  expect(decryptedLocker.data).toEqual(new Uint8Array([0, 42, 0, 99]));
  expect(decryptedLocker.publicAdditionalData).toEqual(publicAdditionalData);
});

it("should throw an error for an invalid publicAdditionalData", () => {
  const invalidPublicAdditionalDataCiphertext = sodium.crypto_secretbox_easy(
    JSON.stringify({ wrong: "additional data" }),
    sodium.from_base64(locker.publicAdditionalDataNonce),
    sodium.from_base64(sessionKey)
  );

  const tagContent = {
    ciphertext: locker.ciphertext,
    nonce: locker.nonce,
    publicAdditionalDataCiphertext: sodium.to_base64(
      invalidPublicAdditionalDataCiphertext
    ),
    publicAdditionalDataNonce: locker.publicAdditionalDataNonce,
  };
  const canonicalizedTagContent = canonicalize(tagContent);
  if (!canonicalizedTagContent)
    throw new Error("canonicalizedTagContent is undefined");
  const tag = sodium.crypto_auth(
    canonicalizedTagContent,
    sodium.from_base64(sessionKey)
  );

  expect(() =>
    decryptLocker({
      locker: {
        ...tagContent,
        tag: sodium.to_base64(tag),
      },
      sessionKey,
      exportKey,
    })
  ).toThrow("ciphertext cannot be decrypted using that key");
});

it("should throw an error for invalid data ciphertext", () => {
  const tagContent = {
    ciphertext: "ups",
    nonce: locker.nonce,
    publicAdditionalDataCiphertext: locker.publicAdditionalDataCiphertext,
    publicAdditionalDataNonce: locker.publicAdditionalDataNonce,
  };
  const canonicalizedTagContent = canonicalize(tagContent);
  if (!canonicalizedTagContent)
    throw new Error("canonicalizedTagContent is undefined");
  const tag = sodium.crypto_auth(
    canonicalizedTagContent,
    sodium.from_base64(sessionKey)
  );

  expect(() =>
    decryptLocker({
      locker: {
        ...tagContent,
        tag: sodium.to_base64(tag),
      },
      sessionKey,
      exportKey,
    })
  ).toThrow("ciphertext is too short");
});

it("should throw an error for invalid publicAdditionalData ciphertext", () => {
  const tagContent = {
    ciphertext: locker.ciphertext,
    nonce: locker.nonce,
    publicAdditionalDataCiphertext: "ups",
    publicAdditionalDataNonce: locker.publicAdditionalDataNonce,
  };
  const canonicalizedTagContent = canonicalize(tagContent);
  if (!canonicalizedTagContent)
    throw new Error("canonicalizedTagContent is undefined");
  const tag = sodium.crypto_auth(
    canonicalizedTagContent,
    sodium.from_base64(sessionKey)
  );

  expect(() =>
    decryptLocker({
      locker: {
        ...tagContent,
        tag: sodium.to_base64(tag),
      },
      sessionKey,
      exportKey,
    })
  ).toThrow("ciphertext is too short");
});

it("should throw an error for invalid exportKey", () => {
  expect(() =>
    decryptLocker({
      locker,
      exportKey: invalidKey,
      sessionKey,
    })
  ).toThrow("invalid input");
});

it("should throw an error for invalid sessionKey", () => {
  expect(() =>
    decryptLocker({
      locker,
      exportKey,
      sessionKey: invalidKey,
    })
  ).toThrow("Invalid locker tag");
});
