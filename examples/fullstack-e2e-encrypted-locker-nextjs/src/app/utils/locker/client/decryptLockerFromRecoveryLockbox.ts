import sodium from "libsodium-wrappers";
import { DecryptLockerFromRecoveryLockboxParams } from "../types";

export const decryptLockerFromRecoveryLockbox = ({
  locker,
  recoveryExportKey,
  recoveryLockbox,
  outputFormat = "string",
}: DecryptLockerFromRecoveryLockboxParams) => {
  const recoveryExportKeyAsUint8Array = sodium
    .from_base64(recoveryExportKey)
    .subarray(0, sodium.crypto_kdf_KEYBYTES);
  const recoveryKeyPair = sodium.crypto_box_seed_keypair(
    recoveryExportKeyAsUint8Array,
  );

  const lockerSecretKey = sodium.crypto_box_open_easy(
    sodium.from_base64(recoveryLockbox.ciphertext),
    sodium.from_base64(recoveryLockbox.nonce),
    sodium.from_base64(recoveryLockbox.creatorPublicKey),
    recoveryKeyPair.privateKey,
  );

  const contentAsUint8Array = sodium.crypto_secretbox_open_easy(
    sodium.from_base64(locker.ciphertext),
    sodium.from_base64(locker.nonce),
    lockerSecretKey,
  );
  if (outputFormat === "uint8array") {
    return contentAsUint8Array;
  } else {
    return sodium.to_string(contentAsUint8Array);
  }
};
