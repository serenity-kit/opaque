import sodium from "libsodium-wrappers";
import { DecryptLockerParams } from "../types";

export const decryptLocker = ({
  locker,
  exportKey,
  outputFormat = "string",
}: DecryptLockerParams) => {
  const exportKeyAsUint8Array = sodium.from_base64(exportKey);
  const lockerSecretKey = sodium.crypto_kdf_derive_from_key(
    sodium.crypto_aead_xchacha20poly1305_ietf_KEYBYTES,
    42,
    "locker__",
    exportKeyAsUint8Array.subarray(0, sodium.crypto_kdf_KEYBYTES)
  );

  const contentAsUint8Array = sodium.crypto_secretbox_open_easy(
    sodium.from_base64(locker.ciphertext),
    sodium.from_base64(locker.nonce),
    lockerSecretKey
  );
  if (outputFormat === "uint8array") {
    return contentAsUint8Array;
  } else {
    return sodium.to_string(contentAsUint8Array);
  }
};
