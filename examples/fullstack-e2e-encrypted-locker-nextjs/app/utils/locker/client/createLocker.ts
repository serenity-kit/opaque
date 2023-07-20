import canonicalize from "canonicalize";
import sodium from "libsodium-wrappers";
import { CreateLockerParams, Locker } from "../types";
import { createLockerSecretKey } from "./createLockerSecretKey";

export const createLocker = ({
  data,
  publicAdditionalData,
  exportKey,
  sessionKey,
}: CreateLockerParams): Locker => {
  const nonce = sodium.randombytes_buf(
    sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES
  );
  const { lockerSecretKey } = createLockerSecretKey({ exportKey });

  const publicAdditionalDataString = canonicalize(publicAdditionalData);
  if (!publicAdditionalDataString) {
    throw new Error("publicAdditionalData can't be serialized");
  }
  const ciphertext = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
    data,
    publicAdditionalDataString,
    null,
    nonce,
    lockerSecretKey
  );

  const publicAdditionalDataNonce = sodium.randombytes_buf(
    sodium.crypto_secretbox_NONCEBYTES
  );
  const publicAdditionalDataCiphertext = sodium.crypto_secretbox_easy(
    JSON.stringify(publicAdditionalData),
    publicAdditionalDataNonce,
    sodium.from_base64(sessionKey)
  );

  const tagContent = canonicalize({
    data: {
      ciphertext: sodium.to_base64(ciphertext),
      nonce: sodium.to_base64(nonce),
    },
    publicAdditionalData: {
      ciphertext: sodium.to_base64(publicAdditionalDataCiphertext),
      nonce: sodium.to_base64(publicAdditionalDataNonce),
    },
  });

  if (!tagContent) throw new Error("tagContent is undefined");
  const tag = sodium.crypto_auth(tagContent, sodium.from_base64(sessionKey));

  return {
    data: {
      ciphertext: sodium.to_base64(ciphertext),
      nonce: sodium.to_base64(nonce),
    },
    publicAdditionalData: {
      ciphertext: sodium.to_base64(publicAdditionalDataCiphertext),
      nonce: sodium.to_base64(publicAdditionalDataNonce),
    },
    tag: sodium.to_base64(tag),
  };
};
