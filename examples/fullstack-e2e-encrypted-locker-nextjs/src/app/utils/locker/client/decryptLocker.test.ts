import sodium from "libsodium-wrappers";
import { beforeAll, expect, it } from "vitest";
import { Locker } from "../types";
import { createLocker } from "./createLocker";
import { decryptLocker } from "./decryptLocker";

const data = JSON.stringify({ secretNotes: [{ id: "1", text: "secret" }] });
// sodium.to_base64(sodium.randombytes_buf(32))
const exportKey = "iX3NooF-7W5dXzJWEso-ilpcYE-v_vj1Uam3rpDvKBQ";
const sessionKey = "dQcJZvTqCgDzW36bzQrnJ6PIcVcZgiRRaFHwC5D4QxY";
const invalidKey = "invalidKey";

let locker: Locker;

beforeAll(async () => {
  await sodium.ready;
  locker = createLocker({
    data,
    exportKey,
    sessionKey,
  });
});

it("should decrypt locker as string by default", () => {
  const decryptedLocker = decryptLocker({
    locker,
    exportKey,
  });

  expect(decryptedLocker).toEqual(data);
});

it("should decrypt locker as string if output string is provided", () => {
  const decryptedLocker = decryptLocker({
    locker,
    exportKey,
    outputFormat: "string",
  });

  expect(decryptedLocker).toEqual(data);
});

it("should decrypt locker as Uint8Array", () => {
  const otherLocker = createLocker({
    data: new Uint8Array([0, 42, 0, 99]),
    exportKey,
    sessionKey,
  });

  const decryptedLocker = decryptLocker({
    locker: otherLocker,
    exportKey,
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
    decryptLocker({
      locker: brokenLocker,
      exportKey,
    }),
  ).toThrow("ciphertext is too short");
});

it("should throw an error for invalid exportKey", () => {
  expect(() =>
    decryptLocker({
      locker,
      exportKey: invalidKey,
    }),
  ).toThrow("invalid input");
});
