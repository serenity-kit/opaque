import sodium from "libsodium-wrappers";
import {
  createLocker,
  encryptLocker,
  isValidLockerTag,
} from "./encryptedLocker";

const data = JSON.stringify({ secretNotes: [{ id: "1", text: "secret" }] });
const publicAdditionalData = { createdAt: new Date("2023-10-31") };
// sodium.to_base64(sodium.randombytes_buf(32))
const exportKey = "iX3NooF-7W5dXzJWEso-ilpcYE-v_vj1Uam3rpDvKBQ";
const recoveryExportKey = "J3aJn5inymm39WL11Yb0qewnAHL3hB_CMB6V2VV_GQg";
const sessionKey = "dQcJZvTqCgDzW36bzQrnJ6PIcVcZgiRRaFHwC5D4QxY";
const invalidKey = "invalidKey";

let lockerSecretKey: string;
let encryptedLocker: {
  ciphertext: string;
  nonce: string;
  tag: string;
};

beforeAll(async () => {
  await sodium.ready;
  const locker = createLocker({
    exportKey,
    recoveryExportKey,
  });
  lockerSecretKey = locker.lockerSecretKey;
  encryptedLocker = encryptLocker({
    data,
    publicAdditionalData,
    lockerSecretKey: sodium.from_base64(locker.lockerSecretKey),
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
    lockerSecretKey: sodium.from_base64(lockerSecretKey),
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
