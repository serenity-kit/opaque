import sodium from "libsodium-wrappers";
import { isValidLockerTag } from "../isValidLockerTag";
import { ValidateLockerAndDecryptPublicAdditionalDataParams } from "../types";

export const validateLockerAndDecryptPublicAdditionalData = ({
  locker,
  sessionKey,
}: ValidateLockerAndDecryptPublicAdditionalDataParams) => {
  if (!isValidLockerTag({ locker, sessionKey })) {
    throw new Error("Invalid locker tag");
  }

  const publicAdditionalData = JSON.parse(
    sodium.to_string(
      sodium.crypto_secretbox_open_easy(
        sodium.from_base64(locker.publicAdditionalDataCiphertext),
        sodium.from_base64(locker.publicAdditionalDataNonce),
        sodium.from_base64(sessionKey)
      )
    )
  );

  return { publicAdditionalData };
};
