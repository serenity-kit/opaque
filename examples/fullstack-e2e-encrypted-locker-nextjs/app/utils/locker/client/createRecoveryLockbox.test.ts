import sodium from "libsodium-wrappers";
import { createRecoveryLockbox } from "./createRecoveryLockbox";

// sodium.to_base64(sodium.randombytes_buf(32))
const exportKey = "iX3NooF-7W5dXzJWEso-ilpcYE-v_vj1Uam3rpDvKBQ";
const recoveryExportKey = "J3aJn5inymm39WL11Yb0qewnAHL3hB_CMB6V2VV_GQg";
const invalidKey = "invalidKey";

beforeAll(async () => {
  await sodium.ready;
});

it("should throw an error for an invalid exportKey", () => {
  expect(() =>
    createRecoveryLockbox({ exportKey: invalidKey, recoveryExportKey })
  ).toThrow();
});

it("should throw an error for an invalid recoveryExportKey", () => {
  expect(() =>
    createRecoveryLockbox({ exportKey, recoveryExportKey: invalidKey })
  ).toThrow();
});

it("should create a locker for valid keys", () => {
  const recoveryLockbox = createRecoveryLockbox({
    exportKey: exportKey,
    recoveryExportKey: recoveryExportKey,
  });

  expect(typeof recoveryLockbox.ciphertext).toBe("string");
  expect(typeof recoveryLockbox.nonce).toBe("string");
  expect(recoveryLockbox.creatorPublicKey).toBe(
    "TIIhpkyZRdSI4jIS7exm6Hp-wVFIkJqrAiYwD8MLFSo"
  );
  expect(recoveryLockbox.receiverPublicKey).toBe(
    "rTTA6RfRF8CU3d8L833m7FJcWmL_K035Z7mRaGk0Wnk"
  );
});
