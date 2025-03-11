import sodium from "libsodium-wrappers";
import { CreateLockerSecretKeyParams } from "../types";

export const createLockerSecretKey = ({
  exportKey,
}: CreateLockerSecretKeyParams) => {
  const exportKeyAsUint8Array = sodium.from_base64(exportKey);
  const lockerSecretKey = sodium.crypto_kdf_derive_from_key(
    sodium.crypto_aead_xchacha20poly1305_ietf_KEYBYTES,
    42, // publicly available subkey_id
    "locker__",
    exportKeyAsUint8Array.subarray(0, sodium.crypto_kdf_KEYBYTES),
  );

  return lockerSecretKey;
};
