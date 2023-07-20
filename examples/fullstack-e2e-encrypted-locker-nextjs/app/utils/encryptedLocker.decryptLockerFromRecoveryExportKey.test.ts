import sodium from "libsodium-wrappers";
import {
  RecoveryLockbox,
  createRecoveryLockbox,
  decryptLockerFromRecoveryExportKey,
  encryptLocker,
} from "./encryptedLocker";

const data = JSON.stringify({ secretNotes: [{ id: "1", text: "secret" }] });
const publicAdditionalData = { createdAt: new Date("2023-10-31") };
// sodium.to_base64(sodium.randombytes_buf(32))
const exportKey = "iX3NooF-7W5dXzJWEso-ilpcYE-v_vj1Uam3rpDvKBQ";
const recoveryExportKey = "J3aJn5inymm39WL11Yb0qewnAHL3hB_CMB6V2VV_GQg";
const sessionKey = "dQcJZvTqCgDzW36bzQrnJ6PIcVcZgiRRaFHwC5D4QxY";
const invalidKey = "invalidKey";

let encryptedLocker: {
  ciphertext: string;
  nonce: string;
  tag: string;
};
let recoveryLockbox: RecoveryLockbox;

beforeAll(async () => {
  await sodium.ready;
  const createRecoveryLockboxResult = createRecoveryLockbox({
    exportKey,
    recoveryExportKey,
  });
  recoveryLockbox = createRecoveryLockboxResult.recoveryLockbox;
  encryptedLocker = encryptLocker({
    data,
    publicAdditionalData,
    exportKey,
    sessionKey,
  });
});

it("should decrypt locker as string by default", () => {
  const decryptedLocker = decryptLockerFromRecoveryExportKey({
    ciphertext: encryptedLocker.ciphertext,
    publicAdditionalData,
    nonce: encryptedLocker.nonce,
    recoveryExportKey,
    recoveryLockbox,
  });

  expect(decryptedLocker).toEqual(data);
});

it("should decrypt locker as string by default", () => {
  const decryptedLocker = decryptLockerFromRecoveryExportKey({
    ciphertext: encryptedLocker.ciphertext,
    publicAdditionalData,
    nonce: encryptedLocker.nonce,
    recoveryExportKey,
    recoveryLockbox,
    outputFormat: "string",
  });

  expect(decryptedLocker).toEqual(data);
});

it("should decrypt locker as Uint8Array", () => {
  const otherEncryptedLocker = encryptLocker({
    data: new Uint8Array([0, 42, 0, 99]),
    publicAdditionalData,
    exportKey,
    sessionKey,
  });
  const decryptedLocker = decryptLockerFromRecoveryExportKey({
    ciphertext: otherEncryptedLocker.ciphertext,
    publicAdditionalData,
    nonce: otherEncryptedLocker.nonce,
    recoveryExportKey,
    recoveryLockbox,
    outputFormat: "uint8array",
  });

  expect(decryptedLocker).toEqual(new Uint8Array([0, 42, 0, 99]));
});

it("should throw an error for an invalid publicAdditionalData", () => {
  expect(() =>
    decryptLockerFromRecoveryExportKey({
      ciphertext: encryptedLocker.ciphertext,
      publicAdditionalData: NaN,
      nonce: encryptedLocker.nonce,
      recoveryExportKey,
      recoveryLockbox,
    })
  ).toThrow("NaN is not allowed");
});

it("should throw an error for invalid ciphertext", () => {
  expect(() =>
    decryptLockerFromRecoveryExportKey({
      ciphertext: "ups",
      publicAdditionalData,
      nonce: encryptedLocker.nonce,
      recoveryExportKey,
      recoveryLockbox,
    })
  ).toThrow("ciphertext is too short");
});

it("should throw an error for invalid recoveryExportKey", () => {
  expect(() =>
    decryptLockerFromRecoveryExportKey({
      ciphertext: encryptedLocker.ciphertext,
      publicAdditionalData,
      nonce: encryptedLocker.nonce,
      recoveryExportKey: invalidKey,
      recoveryLockbox,
    })
  ).toThrow("invalid input");
});

it("should throw an error for invalid ciphertext in recoveryLockbox", () => {
  expect(() =>
    decryptLockerFromRecoveryExportKey({
      ciphertext: encryptedLocker.ciphertext,
      publicAdditionalData,
      nonce: encryptedLocker.nonce,
      recoveryExportKey: invalidKey,
      recoveryLockbox: {
        ...recoveryLockbox,
        ciphertext: "ups",
      },
    })
  ).toThrow("invalid input");
});
