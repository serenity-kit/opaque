import canonicalize from "canonicalize";
import sodium from "libsodium-wrappers";

export type RecoveryLockbox = {
  receiverPublicKey: string;
  creatorPublicKey: string;
  ciphertext: string;
  nonce: string;
};

export type CreateLockerParams = {
  exportKey: string;
  recoveryExportKey: string;
};

export const createLocker = ({
  exportKey,
  recoveryExportKey,
}: CreateLockerParams) => {
  const exportKeyAsUint8Array = sodium.from_base64(exportKey);
  const recoveryExportKeyAsUint8Array = sodium.from_base64(recoveryExportKey);
  const lockerSecretKey = sodium.crypto_kdf_derive_from_key(
    sodium.crypto_aead_xchacha20poly1305_ietf_KEYBYTES,
    42, // publicly available subkey_id
    "locker",
    exportKeyAsUint8Array
  );
  const keyPair = sodium.crypto_box_seed_keypair(exportKeyAsUint8Array);
  const recoveryKeyPair = sodium.crypto_box_seed_keypair(
    recoveryExportKeyAsUint8Array
  );

  const recoveryLockboxNonce = sodium.randombytes_buf(
    sodium.crypto_box_NONCEBYTES
  );
  const ciphertextRecoveryLockbox = sodium.crypto_box_easy(
    lockerSecretKey,
    recoveryLockboxNonce,
    recoveryKeyPair.publicKey,
    keyPair.privateKey
  );

  const recoveryLockbox: RecoveryLockbox = {
    receiverPublicKey: sodium.to_base64(recoveryKeyPair.publicKey),
    creatorPublicKey: sodium.to_base64(keyPair.publicKey),
    ciphertext: sodium.to_base64(ciphertextRecoveryLockbox),
    nonce: sodium.to_base64(recoveryLockboxNonce),
  };

  return {
    lockerSecretKey: sodium.to_base64(lockerSecretKey),
    recoveryLockbox,
  };
};

export type EncryptLockerParams = {
  data: string | Uint8Array;
  publicAdditionalData: string | Uint8Array;
  lockerSecretKey: Uint8Array;
  sessionKey: string;
};

export const encryptLocker = ({
  data,
  publicAdditionalData,
  lockerSecretKey,
  sessionKey,
}: EncryptLockerParams) => {
  const nonce = sodium.randombytes_buf(
    sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES
  );
  const ciphertext = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
    data,
    publicAdditionalData,
    null,
    nonce,
    lockerSecretKey
  );
  const tagContent = canonicalize({
    ciphertext: sodium.to_base64(ciphertext),
    nonce: sodium.to_base64(nonce),
  });
  if (!tagContent) throw new Error("tagContent is undefined");
  const tag = sodium.crypto_auth(tagContent, sodium.from_base64(sessionKey));

  return {
    ciphertext: sodium.to_base64(ciphertext),
    nonce: sodium.to_base64(nonce),
    tag: sodium.to_base64(tag),
  };
};

export type VerifyLockerTagParams = {
  ciphertext: string;
  nonce: string;
  tag: string;
  sessionKey: string;
};

export const isValidLockerTag = ({
  ciphertext,
  nonce,
  tag,
  sessionKey,
}: VerifyLockerTagParams) => {
  const tagContent = canonicalize({
    ciphertext,
    nonce,
  });
  if (!tagContent) throw new Error("tagContent is undefined");
  return sodium.crypto_auth_verify(
    sodium.from_base64(tag),
    tagContent,
    sodium.from_base64(sessionKey)
  );
};

export type DecryptLockerParams = {
  ciphertext: string;
  publicAdditionalData: string;
  nonce: string;
  exportKey: string;
  outputFormat: "string" | "uint8array";
};

export const decryptLocker = ({
  ciphertext,
  publicAdditionalData,
  nonce,
  exportKey,
  outputFormat = "string",
}: DecryptLockerParams) => {
  const exportKeyAsUint8Array = sodium.from_base64(exportKey);
  const lockerSecretKey = sodium.crypto_kdf_derive_from_key(
    sodium.crypto_aead_xchacha20poly1305_ietf_KEYBYTES,
    42,
    "locker",
    exportKeyAsUint8Array
  );

  const contentAsUint8Array = sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
    null,
    sodium.from_base64(ciphertext),
    publicAdditionalData,
    sodium.from_base64(nonce),
    lockerSecretKey
  );
  if (outputFormat === "uint8array") {
    return contentAsUint8Array;
  } else {
    return sodium.to_string(contentAsUint8Array);
  }
};

export type DecryptLockerFromRecoveryExportKeyParams = {
  ciphertext: string;
  publicAdditionalData: string;
  nonce: string;
  recoveryExportKey: string;
  recoveryLockbox: RecoveryLockbox;
  outputFormat: "string" | "uint8array";
};

export const decryptLockerFromRecoveryExportKey = ({
  ciphertext,
  publicAdditionalData,
  nonce,
  recoveryExportKey,
  recoveryLockbox,
  outputFormat = "string",
}: DecryptLockerFromRecoveryExportKeyParams) => {
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
    sodium.from_base64(ciphertext),
    publicAdditionalData,
    sodium.from_base64(nonce),
    lockerSecretKey
  );
  if (outputFormat === "uint8array") {
    return contentAsUint8Array;
  } else {
    return sodium.to_string(contentAsUint8Array);
  }
};
