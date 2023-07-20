import canonicalize from "canonicalize";
import sodium from "libsodium-wrappers";
import { isValidLockerTag } from "../isValidLockerTag";
import { DecryptLockerFromRecoveryLockboxParams } from "../types";

export const decryptLockerFromRecoveryLockbox = ({
  encryptedLocker,
  recoveryExportKey,
  recoverySessionKey,
  recoveryLockbox,
  outputFormat = "string",
}: DecryptLockerFromRecoveryLockboxParams) => {
  if (!isValidLockerTag({ encryptedLocker, sessionKey: recoverySessionKey })) {
    throw new Error("Invalid locker tag");
  }

  const publicAdditionalData = JSON.parse(
    sodium.to_string(
      sodium.crypto_secretbox_open_easy(
        sodium.from_base64(encryptedLocker.publicAdditionalData.ciphertext),
        sodium.from_base64(encryptedLocker.publicAdditionalData.nonce),
        sodium.from_base64(recoverySessionKey)
      )
    )
  );
  const publicAdditionalDataString = canonicalize(publicAdditionalData);
  if (!publicAdditionalDataString) {
    throw new Error("publicAdditionalData can't be serialized");
  }

  const recoveryExportKeyAsUint8Array = sodium.from_base64(recoveryExportKey);
  const recoveryKeyPair = sodium.crypto_box_seed_keypair(
    recoveryExportKeyAsUint8Array
  );

  const lockerSecretKey = sodium.crypto_box_open_easy(
    sodium.from_base64(recoveryLockbox.ciphertext),
    sodium.from_base64(recoveryLockbox.nonce),
    sodium.from_base64(recoveryLockbox.creatorPublicKey),
    recoveryKeyPair.privateKey
  );

  const contentAsUint8Array = sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
    null,
    sodium.from_base64(encryptedLocker.data.ciphertext),
    publicAdditionalDataString,
    sodium.from_base64(encryptedLocker.data.nonce),
    lockerSecretKey
  );
  if (outputFormat === "uint8array") {
    return {
      data: contentAsUint8Array,
      publicAdditionalData,
    };
  } else {
    return {
      data: sodium.to_string(contentAsUint8Array),
      publicAdditionalData,
    };
  }
};
