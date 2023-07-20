import canonicalize from "canonicalize";
import sodium from "libsodium-wrappers";
import { createLockerForClient } from "../server/createLockerForClient";
import { Locker, RecoveryLockbox } from "../types";
import { createLocker } from "./createLocker";
import { createRecoveryLockbox } from "./createRecoveryLockbox";
import { decryptLockerFromRecoveryLockbox } from "./decryptLockerFromRecoveryLockbox";

const data = JSON.stringify({ secretNotes: [{ id: "1", text: "secret" }] });
const publicAdditionalData = {
  createdAt: new Date("2023-10-31").toISOString(),
};
// sodium.to_base64(sodium.randombytes_buf(32))
const exportKey = "iX3NooF-7W5dXzJWEso-ilpcYE-v_vj1Uam3rpDvKBQ";
const recoveryExportKey = "J3aJn5inymm39WL11Yb0qewnAHL3hB_CMB6V2VV_GQg";
const sessionKey = "dQcJZvTqCgDzW36bzQrnJ6PIcVcZgiRRaFHwC5D4QxY";
const recoverySessionKey = "Ak8fjh-4ajAxFPeCR_e_b4AvqJE2P37nW-10TnYv7A0";
const invalidKey = "invalidKey";

let locker: Locker;
let recoveryLockbox: RecoveryLockbox;

beforeAll(async () => {
  await sodium.ready;
  const createRecoveryLockboxResult = createRecoveryLockbox({
    exportKey,
    recoveryExportKey,
  });
  recoveryLockbox = createRecoveryLockboxResult.recoveryLockbox;
  const originalLocker = createLocker({
    data,
    publicAdditionalData,
    exportKey,
    sessionKey,
  });
  locker = createLockerForClient({
    ciphertext: originalLocker.ciphertext,
    nonce: originalLocker.nonce,
    publicAdditionalData,
    sessionKey: recoverySessionKey,
  });
});

it("should decrypt locker as string by default", () => {
  const decryptedLocker = decryptLockerFromRecoveryLockbox({
    locker,
    recoveryExportKey,
    recoveryLockbox,
    recoverySessionKey,
  });

  expect(decryptedLocker.data).toEqual(data);
  expect(decryptedLocker.publicAdditionalData).toEqual(publicAdditionalData);
});

it("should decrypt locker as string if output string is provided", () => {
  const decryptedLocker = decryptLockerFromRecoveryLockbox({
    locker,
    recoveryExportKey,
    recoveryLockbox,
    recoverySessionKey,
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
    sessionKey: recoverySessionKey,
  });
  const decryptedLocker = decryptLockerFromRecoveryLockbox({
    locker: otherLocker,
    recoveryExportKey,
    recoveryLockbox,
    recoverySessionKey,
    outputFormat: "uint8array",
  });

  expect(decryptedLocker.data).toEqual(new Uint8Array([0, 42, 0, 99]));
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
    sodium.from_base64(recoverySessionKey)
  );

  expect(() =>
    decryptLockerFromRecoveryLockbox({
      locker: {
        ...tagContent,
        tag: sodium.to_base64(tag),
      },
      recoveryExportKey,
      recoveryLockbox,
      recoverySessionKey,
    })
  ).toThrow("wrong secret key for the given ciphertext");
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
    sodium.from_base64(recoverySessionKey)
  );

  expect(() =>
    decryptLockerFromRecoveryLockbox({
      locker: {
        ...tagContent,
        tag: sodium.to_base64(tag),
      },
      recoveryExportKey,
      recoveryLockbox,
      recoverySessionKey,
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
    sodium.from_base64(recoverySessionKey)
  );

  expect(() =>
    decryptLockerFromRecoveryLockbox({
      locker: {
        ...tagContent,
        tag: sodium.to_base64(tag),
      },
      recoveryExportKey,
      recoveryLockbox,
      recoverySessionKey,
    })
  ).toThrow("ciphertext is too short");
});

it("should throw an error for invalid recoveryExportKey", () => {
  expect(() =>
    decryptLockerFromRecoveryLockbox({
      locker,
      recoveryExportKey: invalidKey,
      recoveryLockbox,
      recoverySessionKey,
    })
  ).toThrow("invalid input");
});

it("should throw an error for invalid recoverySessionKey", () => {
  expect(() =>
    decryptLockerFromRecoveryLockbox({
      locker,
      recoveryExportKey,
      recoveryLockbox,
      recoverySessionKey: invalidKey,
    })
  ).toThrow("Invalid locker tag");
});

it("should throw an error for invalid ciphertext in recoveryLockbox", () => {
  expect(() =>
    decryptLockerFromRecoveryLockbox({
      locker,
      recoveryExportKey: invalidKey,
      recoveryLockbox: {
        ...recoveryLockbox,
        ciphertext: "ups",
      },
      recoverySessionKey,
    })
  ).toThrow("invalid input");
});
