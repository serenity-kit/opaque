import canonicalize from "canonicalize";
import sodium from "libsodium-wrappers";
import { EncryptedLocker } from "../types";
import { decryptLocker } from "./decryptLocker";
import { encryptLocker } from "./encryptLocker";

const data = JSON.stringify({ secretNotes: [{ id: "1", text: "secret" }] });
const publicAdditionalData = {
  createdAt: new Date("2023-10-31").toISOString(),
};
// sodium.to_base64(sodium.randombytes_buf(32))
const exportKey = "iX3NooF-7W5dXzJWEso-ilpcYE-v_vj1Uam3rpDvKBQ";
const sessionKey = "dQcJZvTqCgDzW36bzQrnJ6PIcVcZgiRRaFHwC5D4QxY";
const invalidKey = "invalidKey";

let encryptedLocker: EncryptedLocker;

beforeAll(async () => {
  await sodium.ready;
  encryptedLocker = encryptLocker({
    data,
    publicAdditionalData,
    exportKey,
    sessionKey,
  });
});

it("should decrypt locker as string by default", () => {
  const decryptedLocker = decryptLocker({
    encryptedLocker,
    sessionKey,
    exportKey,
  });

  expect(decryptedLocker.data).toEqual(data);
  expect(decryptedLocker.publicAdditionalData).toEqual(publicAdditionalData);
});

it("should decrypt locker as string if output string is provided", () => {
  const decryptedLocker = decryptLocker({
    encryptedLocker,
    sessionKey,
    exportKey,
    outputFormat: "string",
  });

  expect(decryptedLocker.data).toEqual(data);
  expect(decryptedLocker.publicAdditionalData).toEqual(publicAdditionalData);
});

it("should decrypt locker as Uint8Array", () => {
  const otherEncryptedLocker = encryptLocker({
    data: new Uint8Array([0, 42, 0, 99]),
    publicAdditionalData,
    exportKey,
    sessionKey,
  });

  const decryptedLocker = decryptLocker({
    encryptedLocker: otherEncryptedLocker,
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
    sodium.from_base64(encryptedLocker.publicAdditionalData.nonce),
    sodium.from_base64(sessionKey)
  );

  const tagContent = {
    data: encryptedLocker.data,
    publicAdditionalData: {
      ciphertext: sodium.to_base64(invalidPublicAdditionalDataCiphertext),
      nonce: encryptedLocker.publicAdditionalData.nonce,
    },
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
      encryptedLocker: {
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
    data: {
      ciphertext: "ups",
      nonce: encryptedLocker.data.nonce,
    },
    publicAdditionalData: encryptedLocker.publicAdditionalData,
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
      encryptedLocker: {
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
    data: encryptedLocker.data,
    publicAdditionalData: {
      ciphertext: "ups",
      nonce: encryptedLocker.publicAdditionalData.nonce,
    },
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
      encryptedLocker: {
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
      encryptedLocker,
      exportKey: invalidKey,
      sessionKey,
    })
  ).toThrow("invalid input");
});

it("should throw an error for invalid sessionKey", () => {
  expect(() =>
    decryptLocker({
      encryptedLocker,
      exportKey,
      sessionKey: invalidKey,
    })
  ).toThrow("Invalid locker tag");
});
