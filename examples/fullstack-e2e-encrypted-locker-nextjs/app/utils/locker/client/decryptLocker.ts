import canonicalize from "canonicalize";
import sodium from "libsodium-wrappers";
import { isValidLockerTag } from "../isValidLockerTag";
import { DecryptLockerParams } from "../types";

export const decryptLocker = ({
  locker,
  exportKey,
  sessionKey,
  outputFormat = "string",
}: DecryptLockerParams) => {
  if (!isValidLockerTag({ locker, sessionKey })) {
    throw new Error("Invalid locker tag");
  }

  const exportKeyAsUint8Array = sodium.from_base64(exportKey);
  const lockerSecretKey = sodium.crypto_kdf_derive_from_key(
    sodium.crypto_aead_xchacha20poly1305_ietf_KEYBYTES,
    42,
    "locker",
    exportKeyAsUint8Array
  );

  const publicAdditionalData = JSON.parse(
    sodium.to_string(
      sodium.crypto_secretbox_open_easy(
        sodium.from_base64(locker.publicAdditionalData.ciphertext),
        sodium.from_base64(locker.publicAdditionalData.nonce),
        sodium.from_base64(sessionKey)
      )
    )
  );

  const publicAdditionalDataString = canonicalize(publicAdditionalData);
  if (!publicAdditionalDataString) {
    throw new Error("publicAdditionalData can't be serialized");
  }
  const contentAsUint8Array = sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
    null,
    sodium.from_base64(locker.data.ciphertext),
    publicAdditionalDataString,
    sodium.from_base64(locker.data.nonce),
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
