import canonicalize from "canonicalize";
import sodium from "libsodium-wrappers";
import { CreateLockerParams, LockerWithServerVerificationMac } from "../types";
import { createLockerSecretKey } from "./createLockerSecretKey";

export const createLocker = ({
  data,
  exportKey,
  sessionKey,
}: CreateLockerParams): LockerWithServerVerificationMac => {
  const nonce = sodium.randombytes_buf(
    sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES,
  );
  const lockerSecretKey = createLockerSecretKey({ exportKey });

  const ciphertext = sodium.crypto_secretbox_easy(data, nonce, lockerSecretKey);

  const serverVerificationMacContent = canonicalize({
    ciphertext: sodium.to_base64(ciphertext),
    nonce: sodium.to_base64(nonce),
  });

  if (!serverVerificationMacContent)
    throw new Error("serverVerificationMacContent is undefined");
  const serverVerificationMac = sodium.crypto_auth(
    serverVerificationMacContent,
    sodium.from_base64(sessionKey).subarray(0, sodium.crypto_auth_KEYBYTES),
  );

  return {
    ciphertext: sodium.to_base64(ciphertext),
    nonce: sodium.to_base64(nonce),
    serverVerificationMac: sodium.to_base64(serverVerificationMac),
  };
};
