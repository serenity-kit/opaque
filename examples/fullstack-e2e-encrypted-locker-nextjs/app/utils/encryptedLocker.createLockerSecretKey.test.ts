import sodium from "libsodium-wrappers";
import { createLockerSecretKey } from "./encryptedLocker";

// sodium.to_base64(sodium.randombytes_buf(32))
const exportKey = "iX3NooF-7W5dXzJWEso-ilpcYE-v_vj1Uam3rpDvKBQ";
const invalidKey = "invalidKey";

beforeAll(async () => {
  await sodium.ready;
});

it("should throw an error for an invalid exportKey", () => {
  expect(() => createLockerSecretKey({ exportKey: invalidKey })).toThrow();
});

it("should create a locker for valid keys", () => {
  const locker = createLockerSecretKey({
    exportKey: exportKey,
  });

  expect(sodium.to_base64(locker.lockerSecretKey)).toBe(
    "KuVfjVEND4MzldyZqLf8-AyCp23fNuyD3RNEsXuFaBw"
  );
});
