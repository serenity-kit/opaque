import canonicalize from "canonicalize";
import sodium from "libsodium-wrappers";

export type EncryptedLocker = {
  data: {
    ciphertext: string;
    nonce: string;
  };
  publicAdditionalData: {
    ciphertext: string;
    nonce: string;
  };
  tag: string;
};

export type PublicAdditionalData =
  | string
  | number
  | boolean
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
}: EncryptLockerParams): EncryptedLocker => {
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

export type VerifyLockerTagParams = {
  encryptedLocker: EncryptedLocker;
  sessionKey: string;
};

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

export type ValidateAndDecryptPublicAdditionalDataParams = {
  encryptedLocker: EncryptedLocker;
  sessionKey: string;
};

export const validateAndDecryptPublicAdditionalData = ({
  encryptedLocker,
  sessionKey,
}: ValidateAndDecryptPublicAdditionalDataParams) => {
  if (!isValidLockerTag({ encryptedLocker, sessionKey })) {
    throw new Error("Invalid locker tag");
  }

  const publicAdditionalData = JSON.parse(
    sodium.to_string(
      sodium.crypto_secretbox_open_easy(
        sodium.from_base64(encryptedLocker.publicAdditionalData.ciphertext),
        sodium.from_base64(encryptedLocker.publicAdditionalData.nonce),
        sodium.from_base64(sessionKey)
      )
    )
  );

  return { publicAdditionalData };
};

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

export type DecryptLockerParams = {
  encryptedLocker: EncryptedLocker;
  exportKey: string;
  sessionKey: string;
  outputFormat?: "string" | "uint8array";
};

export const decryptLocker = ({
  encryptedLocker,
  exportKey,
  sessionKey,
  outputFormat = "string",
}: DecryptLockerParams) => {
  if (!isValidLockerTag({ encryptedLocker, sessionKey })) {
    throw new Error("Invalid locker tag");
  }

  const exportKeyAsUint8Array = sodium.from_base64(exportKey);
  const lockerSecretKey = sodium.crypto_kdf_derive_from_key(
    sodium.crypto_aead_xchacha20poly1305_ietf_KEYBYTES,
    42,
    "locker",
    exportKeyAsUint8Array
  );

  const publicAdditionalData = JSON.parse(
    sodium.to_string(
      sodium.crypto_secretbox_open_easy(
        sodium.from_base64(encryptedLocker.publicAdditionalData.ciphertext),
        sodium.from_base64(encryptedLocker.publicAdditionalData.nonce),
        sodium.from_base64(sessionKey)
      )
    )
  );

  const publicAdditionalDataString = canonicalize(publicAdditionalData);
  if (!publicAdditionalDataString) {
    throw new Error("publicAdditionalData can't be serialized");
  }
  const contentAsUint8Array = sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
    null,
    sodium.from_base64(encryptedLocker.data.ciphertext),
    publicAdditionalDataString,
    sodium.from_base64(encryptedLocker.data.nonce),
    lockerSecretKey
  );
  if (outputFormat === "uint8array") {
    return {
      data: contentAsUint8Array,
      publicAdditionalData,
    };
  } else {
    return {
      data: sodium.to_string(contentAsUint8Array),
      publicAdditionalData,
    };
  }
};

export type DecryptLockerFromRecoveryExportKeyParams = {
  encryptedLocker: EncryptedLocker;
  recoveryExportKey: string;
  recoverySessionKey: string;
  recoveryLockbox: RecoveryLockbox;
  outputFormat?: "string" | "uint8array";
};

export const decryptLockerFromRecoveryExportKey = ({
  encryptedLocker,
  recoveryExportKey,
  recoverySessionKey,
  recoveryLockbox,
  outputFormat = "string",
}: DecryptLockerFromRecoveryExportKeyParams) => {
  if (!isValidLockerTag({ encryptedLocker, sessionKey: recoverySessionKey })) {
    throw new Error("Invalid locker tag");
  }

  const publicAdditionalData = JSON.parse(
    sodium.to_string(
      sodium.crypto_secretbox_open_easy(
        sodium.from_base64(encryptedLocker.publicAdditionalData.ciphertext),
        sodium.from_base64(encryptedLocker.publicAdditionalData.nonce),
        sodium.from_base64(recoverySessionKey)
      )
    )
  );
  const publicAdditionalDataString = canonicalize(publicAdditionalData);
  if (!publicAdditionalDataString) {
    throw new Error("publicAdditionalData can't be serialized");
  }

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
    sodium.from_base64(encryptedLocker.data.ciphertext),
    publicAdditionalDataString,
    sodium.from_base64(encryptedLocker.data.nonce),
    lockerSecretKey
  );
  if (outputFormat === "uint8array") {
    return {
      data: contentAsUint8Array,
      publicAdditionalData,
    };
  } else {
    return {
      data: sodium.to_string(contentAsUint8Array),
      publicAdditionalData,
    };
  }
};
