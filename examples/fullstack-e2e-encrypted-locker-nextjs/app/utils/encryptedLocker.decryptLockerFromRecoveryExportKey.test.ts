import canonicalize from "canonicalize";
import sodium from "libsodium-wrappers";
import {
  EncryptedLocker,
  RecoveryLockbox,
  createLockerForClient,
  createRecoveryLockbox,
  decryptLockerFromRecoveryExportKey,
  encryptLocker,
} from "./encryptedLocker";

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

let encryptedLocker: EncryptedLocker;
let recoveryLockbox: RecoveryLockbox;

beforeAll(async () => {
  await sodium.ready;
  const createRecoveryLockboxResult = createRecoveryLockbox({
    exportKey,
    recoveryExportKey,
  });
  recoveryLockbox = createRecoveryLockboxResult.recoveryLockbox;
  const originalLocker = encryptLocker({
    data,
    publicAdditionalData,
    exportKey,
    sessionKey,
  });
  encryptedLocker = createLockerForClient({
    ciphertext: originalLocker.data.ciphertext,
    nonce: originalLocker.data.nonce,
    publicAdditionalData,
    sessionKey: recoverySessionKey,
  });
});

it("should decrypt locker as string by default", () => {
  const decryptedLocker = decryptLockerFromRecoveryExportKey({
    encryptedLocker,
    recoveryExportKey,
    recoveryLockbox,
    recoverySessionKey,
  });

  expect(decryptedLocker.data).toEqual(data);
  expect(decryptedLocker.publicAdditionalData).toEqual(publicAdditionalData);
});

it("should decrypt locker as string if output string is provided", () => {
  const decryptedLocker = decryptLockerFromRecoveryExportKey({
    encryptedLocker,
    recoveryExportKey,
    recoveryLockbox,
    recoverySessionKey,
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
    sessionKey: recoverySessionKey,
  });
  const decryptedLocker = decryptLockerFromRecoveryExportKey({
    encryptedLocker: otherEncryptedLocker,
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
    sodium.from_base64(recoverySessionKey)
  );

  expect(() =>
    decryptLockerFromRecoveryExportKey({
      encryptedLocker: {
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
    sodium.from_base64(recoverySessionKey)
  );

  expect(() =>
    decryptLockerFromRecoveryExportKey({
      encryptedLocker: {
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
    sodium.from_base64(recoverySessionKey)
  );

  expect(() =>
    decryptLockerFromRecoveryExportKey({
      encryptedLocker: {
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
    decryptLockerFromRecoveryExportKey({
      encryptedLocker,
      recoveryExportKey: invalidKey,
      recoveryLockbox,
      recoverySessionKey,
    })
  ).toThrow("invalid input");
});

it("should throw an error for invalid recoverySessionKey", () => {
  expect(() =>
    decryptLockerFromRecoveryExportKey({
      encryptedLocker,
      recoveryExportKey,
      recoveryLockbox,
      recoverySessionKey: invalidKey,
    })
  ).toThrow("Invalid locker tag");
});

it("should throw an error for invalid ciphertext in recoveryLockbox", () => {
  expect(() =>
    decryptLockerFromRecoveryExportKey({
      encryptedLocker,
      recoveryExportKey: invalidKey,
      recoveryLockbox: {
        ...recoveryLockbox,
        ciphertext: "ups",
      },
      recoverySessionKey,
    })
  ).toThrow("invalid input");
});
