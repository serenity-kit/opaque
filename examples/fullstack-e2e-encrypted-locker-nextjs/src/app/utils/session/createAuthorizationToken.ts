import sodium from "libsodium-wrappers";

export const createAuthorizationToken = ({
  sessionKey,
  subkeyId = 924,
}: CreateAuthorizationTokenParams) => {
  const sessionKeyAsUint8Array = sodium.from_base64(sessionKey);
  const authorizationToken = sodium.crypto_kdf_derive_from_key(
    sodium.crypto_aead_xchacha20poly1305_ietf_KEYBYTES,
    subkeyId, // publicly available subkey_id
    "session",
    sessionKeyAsUint8Array,
  );

  return sodium.to_base64(authorizationToken);
};
