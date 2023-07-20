import sodium from "libsodium-wrappers";
import {
  createLockerForClient,
  encryptLocker,
  isValidLockerTag,
} from "./encryptedLocker";

const data = JSON.stringify({ secretNotes: [{ id: "1", text: "secret" }] });
const publicAdditionalData = {
  createdAt: new Date("2023-10-31").toISOString(),
};
// sodium.to_base64(sodium.randombytes_buf(32))
const exportKey = "iX3NooF-7W5dXzJWEso-ilpcYE-v_vj1Uam3rpDvKBQ";
const sessionKey = "dQcJZvTqCgDzW36bzQrnJ6PIcVcZgiRRaFHwC5D4QxY";
const invalidKey = "invalidKey";

let encryptedLocker: {
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
  encryptedLocker = encryptLocker({
    data,
    publicAdditionalData,
    exportKey,
    sessionKey,
  });
});

it("should return true for valid tag", () => {
  const isValidTag = isValidLockerTag({
    encryptedLocker,
    sessionKey,
  });

  expect(isValidTag).toBeTruthy();

  const anotherLocker = createLockerForClient({
    ciphertext: encryptedLocker.data.ciphertext,
    nonce: encryptedLocker.data.nonce,
    publicAdditionalData,
    sessionKey,
  });

  const isValidTag2 = isValidLockerTag({
    encryptedLocker: anotherLocker,
    sessionKey,
  });
  expect(isValidTag2).toBeTruthy();
});

it("should return false for invalid tag", () => {
  const isValidTag = isValidLockerTag({
    encryptedLocker: {
      ...encryptedLocker,
      tag: encryptedLocker.tag + "a",
    },
    sessionKey,
  });

  expect(isValidTag).toBeFalsy();
});

it("should return false for invalid tag", () => {
  const isValidTag = isValidLockerTag({
    encryptedLocker: {
      ...encryptedLocker,
      data: {
        ...encryptedLocker.data,
        nonce: "XJutX1MPVYVeyTFvwPF63rHab2TC3SuJ", // wrong nonce
      },
      tag: encryptedLocker.tag + "a",
    },
    sessionKey,
  });

  expect(isValidTag).toBeFalsy();
});

it("should return false for invalid sessionKey", () => {
  const isValidTag = isValidLockerTag({
    encryptedLocker,
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
    encryptedLocker: { ...otherEncryptedLocker, tag: encryptedLocker.tag },
    sessionKey,
  });

  expect(isValidTag).toBeFalsy();
});
