import sodium from "libsodium-wrappers";
import { encryptLocker, isValidLockerTag } from "./encryptedLocker";

const data = JSON.stringify({ secretNotes: [{ id: "1", text: "secret" }] });
const publicAdditionalData = { createdAt: new Date("2023-10-31") };
// sodium.to_base64(sodium.randombytes_buf(32))
const exportKey = "iX3NooF-7W5dXzJWEso-ilpcYE-v_vj1Uam3rpDvKBQ";
const sessionKey = "dQcJZvTqCgDzW36bzQrnJ6PIcVcZgiRRaFHwC5D4QxY";
const invalidKey = "invalidKey";

let encryptedLocker: {
  ciphertext: string;
  nonce: string;
  tag: string;
};

beforeAll(async () => {
  await sodium.ready;
  encryptedLocker = encryptLocker({
    data,
    publicAdditionalData,
    exportKey,
    sessionKey,
  });
});

it("should return true for valid tag", () => {
  const isValidTag = isValidLockerTag({
    ciphertext: encryptedLocker.ciphertext,
    nonce: encryptedLocker.nonce,
    tag: encryptedLocker.tag,
    sessionKey,
  });

  expect(isValidTag).toBeTruthy();
});

it("should return false for invalid tag", () => {
  const isValidTag = isValidLockerTag({
    ciphertext: encryptedLocker.ciphertext,
    nonce: encryptedLocker.nonce,
    tag: encryptedLocker.tag + "a",
    sessionKey,
  });

  expect(isValidTag).toBeFalsy();
});

it("should return false for invalid tag", () => {
  const isValidTag = isValidLockerTag({
    ciphertext: encryptedLocker.ciphertext,
    nonce: "XJutX1MPVYVeyTFvwPF63rHab2TC3SuJ", // wrong nonce
    tag: encryptedLocker.tag,
    sessionKey,
  });

  expect(isValidTag).toBeFalsy();
});

it("should return false for invalid sessionKey", () => {
  const isValidTag = isValidLockerTag({
    ciphertext: encryptedLocker.ciphertext,
    nonce: encryptedLocker.nonce,
    tag: encryptedLocker.tag,
    sessionKey: invalidKey,
  });

  expect(isValidTag).toBeFalsy();
});

it("should return false for another encrypted locker", () => {
  const otherEncryptedLocker = encryptLocker({
    data,
    publicAdditionalData,
    exportKey,
    sessionKey,
  });

  const isValidTag = isValidLockerTag({
    ciphertext: otherEncryptedLocker.ciphertext,
    nonce: otherEncryptedLocker.nonce,
    tag: encryptedLocker.tag,
    sessionKey,
  });

  expect(isValidTag).toBeFalsy();
});
