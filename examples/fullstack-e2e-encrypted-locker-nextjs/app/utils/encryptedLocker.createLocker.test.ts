import sodium from "libsodium-wrappers";
import { createLocker } from "./encryptedLocker";

// sodium.to_base64(sodium.randombytes_buf(32))
const exportKey = "iX3NooF-7W5dXzJWEso-ilpcYE-v_vj1Uam3rpDvKBQ";
const recoveryExportKey = "J3aJn5inymm39WL11Yb0qewnAHL3hB_CMB6V2VV_GQg";
const invalidKey = "invalidKey";

beforeAll(async () => {
  await sodium.ready;
});

it("should throw an error for an invalid exportKey", () => {
  expect(() =>
    createLocker({ exportKey: invalidKey, recoveryExportKey })
  ).toThrow();
});

it("should throw an error for an invalid recoveryExportKey", () => {
  expect(() =>
    createLocker({ exportKey: invalidKey, recoveryExportKey })
  ).toThrow();
});

it("should create a locker for valid keys", () => {
  const locker = createLocker({
    exportKey: exportKey,
    recoveryExportKey: recoveryExportKey,
  });

  expect(locker.lockerSecretKey).toBe(
    "Q-FGvetvFCfGKy2-zeHgFcWY3BM5Q8aHaKVUhDhKDLg"
  );
  expect(typeof locker.recoveryLockbox.ciphertext).toBe("string");
  expect(typeof locker.recoveryLockbox.nonce).toBe("string");
  expect(locker.recoveryLockbox.creatorPublicKey).toBe(
    "TIIhpkyZRdSI4jIS7exm6Hp-wVFIkJqrAiYwD8MLFSo"
  );
  expect(locker.recoveryLockbox.receiverPublicKey).toBe(
    "rTTA6RfRF8CU3d8L833m7FJcWmL_K035Z7mRaGk0Wnk"
  );
});
