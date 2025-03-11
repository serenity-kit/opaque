import sodium from "libsodium-wrappers";
import { createLocker } from "../client/createLocker";
import { LockerWithServerVerificationMac } from "../types";
import { isValidLocker } from "./isValidLocker";

const data = JSON.stringify({ secretNotes: [{ id: "1", text: "secret" }] });
// sodium.to_base64(sodium.randombytes_buf(32))
const exportKey = "iX3NooF-7W5dXzJWEso-ilpcYE-v_vj1Uam3rpDvKBQ";
const sessionKey = "dQcJZvTqCgDzW36bzQrnJ6PIcVcZgiRRaFHwC5D4QxY";
const invalidKey = "invalidKey";

let locker: LockerWithServerVerificationMac;

beforeAll(async () => {
  await sodium.ready;
  locker = createLocker({
    data,
    exportKey,
    sessionKey,
  });
});

it("should return true for valid serverVerificationMac", () => {
  const isValid = isValidLocker({
    locker,
    sessionKey,
  });

  expect(isValid).toBeTruthy();
});

it("should return false for invalid serverVerificationMac", () => {
  const isValid = isValidLocker({
    locker: {
      ...locker,
      serverVerificationMac: locker.serverVerificationMac + "a",
    },
    sessionKey,
  });

  expect(isValid).toBeFalsy();
});

it("should return false for invalid serverVerificationMac", () => {
  const isValid = isValidLocker({
    locker: {
      ...locker,
      nonce: "XJutX1MPVYVeyTFvwPF63rHab2TC3SuJ", // wrong nonce
      serverVerificationMac: locker.serverVerificationMac + "a",
    },
    sessionKey,
  });

  expect(isValid).toBeFalsy();
});

it("should return false for invalid sessionKey", () => {
  const isValid = isValidLocker({
    locker,
    sessionKey: invalidKey,
  });

  expect(isValid).toBeFalsy();
});

it("should return false for another encrypted locker", () => {
  const otherLocker = createLocker({
    data,
    exportKey,
    sessionKey,
  });

  const isValid = isValidLocker({
    locker: {
      ...otherLocker,
      serverVerificationMac: locker.serverVerificationMac,
    },
    sessionKey,
  });

  expect(isValid).toBeFalsy();
});
