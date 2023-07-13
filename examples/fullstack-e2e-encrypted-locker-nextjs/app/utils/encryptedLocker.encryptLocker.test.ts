import canonicalize from "canonicalize";
import sodium from "libsodium-wrappers";
import { createLocker, encryptLocker } from "./encryptedLocker";

const data = JSON.stringify({ secretNotes: [{ id: "1", text: "secret" }] });
const publicAdditionalData = { createdAt: new Date("2023-10-31") };
// sodium.to_base64(sodium.randombytes_buf(32))
const exportKey = "iX3NooF-7W5dXzJWEso-ilpcYE-v_vj1Uam3rpDvKBQ";
const recoveryExportKey = "J3aJn5inymm39WL11Yb0qewnAHL3hB_CMB6V2VV_GQg";
const sessionKey = "dQcJZvTqCgDzW36bzQrnJ6PIcVcZgiRRaFHwC5D4QxY";
const invalidKey = "invalidKey";

beforeAll(async () => {
  await sodium.ready;
});

it("should encrypt locker data", () => {
  const locker = createLocker({
    exportKey,
    recoveryExportKey,
  });
  const encryptedLocker = encryptLocker({
    data,
    publicAdditionalData,
    lockerSecretKey: sodium.from_base64(locker.lockerSecretKey),
    sessionKey,
  });

  expect(typeof encryptedLocker.ciphertext).toBe("string");
  expect(typeof encryptedLocker.nonce).toBe("string");
  expect(typeof encryptedLocker.tag).toBe("string");

  const tagContent = canonicalize({
    ciphertext: encryptedLocker.ciphertext,
    nonce: encryptedLocker.nonce,
  });
  if (!tagContent) throw new Error("tagContent is undefined");

  expect(
    sodium.crypto_auth_verify(
      sodium.from_base64(encryptedLocker.tag),
      tagContent,
      sodium.from_base64(sessionKey)
    )
  ).toBe(true);
});

it("should throw an error for invalid sessionKey", () => {
  const locker = createLocker({
    exportKey,
    recoveryExportKey,
  });

  expect(() =>
    encryptLocker({
      data,
      publicAdditionalData,
      lockerSecretKey: sodium.from_base64(locker.lockerSecretKey),
      sessionKey: invalidKey,
    })
  ).toThrow("invalid input");
});

it("should throw an error for invalid lockerSecretKey", () => {
  const locker = createLocker({
    exportKey,
    recoveryExportKey,
  });

  expect(() =>
    encryptLocker({
      data,
      publicAdditionalData,
      lockerSecretKey: new Uint8Array([0, 0, 0, 0]),
      sessionKey,
    })
  ).toThrow("invalid key length");
});

it("should throw an error for invalid publicAdditionalData", () => {
  const locker = createLocker({
    exportKey,
    recoveryExportKey,
  });

  expect(() =>
    encryptLocker({
      data,
      publicAdditionalData: NaN,
      lockerSecretKey: sodium.from_base64(locker.lockerSecretKey),
      sessionKey,
    })
  ).toThrow("NaN is not allowed");
});

it("should throw an error for invalid data", () => {
  const locker = createLocker({
    exportKey,
    recoveryExportKey,
  });

  expect(() =>
    encryptLocker({
      // @ts-expect-error
      data: new Date(),
      publicAdditionalData,
      lockerSecretKey: sodium.from_base64(locker.lockerSecretKey),
      sessionKey,
    })
  ).toThrow("unsupported input type for message");
});
