import canonicalize from "canonicalize";
import sodium from "libsodium-wrappers";
import { IsValidLockerParams } from "../types";

export const isValidLocker = ({ locker, sessionKey }: IsValidLockerParams) => {
  const { ciphertext, nonce, serverVerificationMac } = locker;
  const serverVerificationMacContent = canonicalize({
    ciphertext,
    nonce,
  });
  try {
    if (!serverVerificationMacContent)
      throw new Error("serverVerificationMacContent is undefined");
    return sodium.crypto_auth_verify(
      sodium.from_base64(serverVerificationMac),
      serverVerificationMacContent,
      sodium.from_base64(sessionKey).subarray(0, sodium.crypto_auth_KEYBYTES),
    );
  } catch (err) {
    return false;
  }
};
