import canonicalize from "canonicalize";
import sodium from "libsodium-wrappers";
import { EncryptedLocker, PublicAdditionalData } from "../types";

type createLockerForClient = {
  ciphertext: string;
  nonce: string;
  publicAdditionalData: PublicAdditionalData;
  sessionKey: string;
};

export const createLockerForClient = ({
  ciphertext,
  nonce,
  publicAdditionalData,
  sessionKey,
}: createLockerForClient) => {
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
      ciphertext,
      nonce,
    },
    publicAdditionalData: {
      ciphertext: sodium.to_base64(publicAdditionalDataCiphertext),
      nonce: sodium.to_base64(publicAdditionalDataNonce),
    },
  });

  if (!tagContent) throw new Error("tagContent is undefined");
  const tag = sodium.crypto_auth(tagContent, sodium.from_base64(sessionKey));

  const encryptedLocker: EncryptedLocker = {
    data: {
      ciphertext,
      nonce,
    },
    publicAdditionalData: {
      ciphertext: sodium.to_base64(publicAdditionalDataCiphertext),
      nonce: sodium.to_base64(publicAdditionalDataNonce),
    },
    tag: sodium.to_base64(tag),
  };
  return encryptedLocker;
};
