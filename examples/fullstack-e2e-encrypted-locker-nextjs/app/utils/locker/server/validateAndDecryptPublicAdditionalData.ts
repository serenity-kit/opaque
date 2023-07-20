import sodium from "libsodium-wrappers";
import { isValidLockerTag } from "../isValidLockerTag";
import { ValidateAndDecryptPublicAdditionalDataParams } from "../types";

export const validateAndDecryptPublicAdditionalData = ({
  locker,
  sessionKey,
}: ValidateAndDecryptPublicAdditionalDataParams) => {
  if (!isValidLockerTag({ locker, sessionKey })) {
    throw new Error("Invalid locker tag");
  }

  const publicAdditionalData = JSON.parse(
    sodium.to_string(
      sodium.crypto_secretbox_open_easy(
        sodium.from_base64(locker.publicAdditionalData.ciphertext),
        sodium.from_base64(locker.publicAdditionalData.nonce),
        sodium.from_base64(sessionKey)
      )
    )
  );

  return { publicAdditionalData };
};
