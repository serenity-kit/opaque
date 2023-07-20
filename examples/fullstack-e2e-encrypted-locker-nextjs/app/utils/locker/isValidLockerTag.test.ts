import sodium from "libsodium-wrappers";
import { encryptLocker } from "./client/encryptLocker";
import { isValidLockerTag } from "./isValidLockerTag";
import { createLockerForClient } from "./server/createLockerForClient";

const data = JSON.stringify({ secretNotes: [{ id: "1", text: "secret" }] });
const publicAdditionalData = {
  createdAt: new Date("2023-10-31").toISOString(),
};
// sodium.to_base64(sodium.randombytes_buf(32))
const exportKey = "iX3NooF-7W5dXzJWEso-ilpcYE-v_vj1Uam3rpDvKBQ";
const sessionKey = "dQcJZvTqCgDzW36bzQrnJ6PIcVcZgiRRaFHwC5D4QxY";
const invalidKey = "invalidKey";

let locker: {
  data: {
    ciphertext: string;
    nonce: string;
  };
  publicAdditionalData: {
    ciphertext: string;
    nonce: string;
  };
  tag: string;
};

beforeAll(async () => {
  await sodium.ready;
  locker = encryptLocker({
    data,
    publicAdditionalData,
    exportKey,
    sessionKey,
  });
});

it("should return true for valid tag", () => {
  const isValidTag = isValidLockerTag({
    locker,
    sessionKey,
  });

  expect(isValidTag).toBeTruthy();

  const anotherLocker = createLockerForClient({
    ciphertext: locker.data.ciphertext,
    nonce: locker.data.nonce,
    publicAdditionalData,
    sessionKey,
  });

  const isValidTag2 = isValidLockerTag({
    locker: anotherLocker,
    sessionKey,
  });
  expect(isValidTag2).toBeTruthy();
});

it("should return false for invalid tag", () => {
  const isValidTag = isValidLockerTag({
    locker: {
      ...locker,
      tag: locker.tag + "a",
    },
    sessionKey,
  });

  expect(isValidTag).toBeFalsy();
});

it("should return false for invalid tag", () => {
  const isValidTag = isValidLockerTag({
    locker: {
      ...locker,
      data: {
        ...locker.data,
        nonce: "XJutX1MPVYVeyTFvwPF63rHab2TC3SuJ", // wrong nonce
      },
      tag: locker.tag + "a",
    },
    sessionKey,
  });

  expect(isValidTag).toBeFalsy();
});

it("should return false for invalid sessionKey", () => {
  const isValidTag = isValidLockerTag({
    locker,
    sessionKey: invalidKey,
  });

  expect(isValidTag).toBeFalsy();
});

it("should return false for another encrypted locker", () => {
  const otherLocker = encryptLocker({
    data,
    publicAdditionalData,
    exportKey,
    sessionKey,
  });

  const isValidTag = isValidLockerTag({
    locker: { ...otherLocker, tag: locker.tag },
    sessionKey,
  });

  expect(isValidTag).toBeFalsy();
});
