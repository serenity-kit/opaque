import canonicalize from "canonicalize";
import sodium from "libsodium-wrappers";
import { VerifyLockerTagParams } from "./types";

export const isValidLockerTag = ({
  encryptedLocker,
  sessionKey,
}: VerifyLockerTagParams) => {
  const { data, publicAdditionalData, tag } = encryptedLocker;
  const tagContent = canonicalize({
    data,
    publicAdditionalData,
  });
  try {
    if (!tagContent) throw new Error("tagContent is undefined");
    return sodium.crypto_auth_verify(
      sodium.from_base64(tag),
      tagContent,
      sodium.from_base64(sessionKey)
    );
  } catch (err) {
    return false;
  }
};
