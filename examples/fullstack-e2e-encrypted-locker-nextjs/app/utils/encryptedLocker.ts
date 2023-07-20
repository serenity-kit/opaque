import canonicalize from "canonicalize";
import sodium from "libsodium-wrappers";

export type PublicAdditionalData =
  | string
  | number
  | boolean
  | Date
  | { [x: string]: PublicAdditionalData }
  | Array<PublicAdditionalData>;

export type RecoveryLockbox = {
  receiverPublicKey: string;
  creatorPublicKey: string;
  ciphertext: string;
  nonce: string;
};

export type CreateLockerParams = {
  exportKey: string;
};

export const createLockerSecretKey = ({ exportKey }: CreateLockerParams) => {
  const exportKeyAsUint8Array = sodium.from_base64(exportKey);
  const lockerSecretKey = sodium.crypto_kdf_derive_from_key(
    sodium.crypto_aead_xchacha20poly1305_ietf_KEYBYTES,
    42, // publicly available subkey_id
    "locker",
    exportKeyAsUint8Array
  );

  return { lockerSecretKey };
};

export type CreateRecoveryLockboxParams = {
  exportKey: string;
  recoveryExportKey: string;
};

export const createRecoveryLockbox = ({
  exportKey,
  recoveryExportKey,
}: CreateRecoveryLockboxParams) => {
  const exportKeyAsUint8Array = sodium.from_base64(exportKey);
  const recoveryExportKeyAsUint8Array = sodium.from_base64(recoveryExportKey);
  const { lockerSecretKey } = createLockerSecretKey({ exportKey });

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
    recoveryLockbox,
  };
};

export type EncryptLockerParams = {
  data: string | Uint8Array;
  publicAdditionalData: PublicAdditionalData;
  exportKey: string;
  sessionKey: string;
};

export const encryptLocker = ({
  data,
  publicAdditionalData,
  exportKey,
  sessionKey,
}: EncryptLockerParams) => {
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

export type DecryptLockerParams = {
  ciphertext: string;
  publicAdditionalData: PublicAdditionalData;
  nonce: string;
  exportKey: string;
  outputFormat?: "string" | "uint8array";
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

  const publicAdditionalDataString = canonicalize(publicAdditionalData);
  if (!publicAdditionalDataString) {
    throw new Error("publicAdditionalData can't be serialized");
  }
  const contentAsUint8Array = sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
    null,
    sodium.from_base64(ciphertext),
    publicAdditionalDataString,
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
  publicAdditionalData: PublicAdditionalData;
  nonce: string;
  recoveryExportKey: string;
  recoveryLockbox: RecoveryLockbox;
  outputFormat?: "string" | "uint8array";
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

  const publicAdditionalDataString = canonicalize(publicAdditionalData);
  if (!publicAdditionalDataString) {
    throw new Error("publicAdditionalData can't be serialized");
  }
  const contentAsUint8Array = sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
    null,
    sodium.from_base64(ciphertext),
    publicAdditionalDataString,
    sodium.from_base64(nonce),
    lockerSecretKey
  );
  if (outputFormat === "uint8array") {
    return contentAsUint8Array;
  } else {
    return sodium.to_string(contentAsUint8Array);
  }
};
