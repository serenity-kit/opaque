import sodium from "libsodium-wrappers";
import { beforeAll, expect, it } from "vitest";
import { Locker, RecoveryLockbox } from "../types";
import { createLocker } from "./createLocker";
import { createRecoveryLockbox } from "./createRecoveryLockbox";
import { decryptLockerFromRecoveryLockbox } from "./decryptLockerFromRecoveryLockbox";

const data = JSON.stringify({ secretNotes: [{ id: "1", text: "secret" }] });
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
  recoveryLockbox = createRecoveryLockbox({
    exportKey,
    recoveryExportKey,
  });
  locker = createLocker({
    data,
    exportKey,
    sessionKey,
  });
});

it("should decrypt locker as string by default", () => {
  const decryptedLocker = decryptLockerFromRecoveryLockbox({
    locker,
    recoveryExportKey,
    recoveryLockbox,
  });

  expect(decryptedLocker).toEqual(data);
});

it("should decrypt locker as string if output string is provided", () => {
  const decryptedLocker = decryptLockerFromRecoveryLockbox({
    locker,
    recoveryExportKey,
    recoveryLockbox,
    outputFormat: "string",
  });

  expect(decryptedLocker).toEqual(data);
});

it("should decrypt locker as Uint8Array", () => {
  const otherLocker = createLocker({
    data: new Uint8Array([0, 42, 0, 99]),
    exportKey,
    sessionKey: recoverySessionKey,
  });
  const decryptedLocker = decryptLockerFromRecoveryLockbox({
    locker: otherLocker,
    recoveryExportKey,
    recoveryLockbox,
    outputFormat: "uint8array",
  });

  expect(decryptedLocker).toEqual(new Uint8Array([0, 42, 0, 99]));
});

it("should throw an error for invalid data ciphertext", () => {
  const brokenLocker = {
    ciphertext: "ups",
    nonce: locker.nonce,
  };

  expect(() =>
    decryptLockerFromRecoveryLockbox({
      locker: brokenLocker,
      recoveryExportKey,
      recoveryLockbox,
    }),
  ).toThrow("ciphertext is too short");
});

it("should throw an error for invalid recoveryExportKey", () => {
  expect(() =>
    decryptLockerFromRecoveryLockbox({
      locker,
      recoveryExportKey: invalidKey,
      recoveryLockbox,
    }),
  ).toThrow("invalid input");
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
    }),
  ).toThrow("invalid input");
});
