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

export type CreateLockerSecretKeyParams = {
  exportKey: string;
};

export type VerifyLockerTagParams = {
  encryptedLocker: EncryptedLocker;
  sessionKey: string;
};

export type ValidateAndDecryptPublicAdditionalDataParams = {
  encryptedLocker: EncryptedLocker;
  sessionKey: string;
};

export type CreateRecoveryLockboxParams = {
  exportKey: string;
  recoveryExportKey: string;
};

export type EncryptLockerParams = {
  data: string | Uint8Array;
  publicAdditionalData: PublicAdditionalData;
  exportKey: string;
  sessionKey: string;
};

export type DecryptLockerParams = {
  encryptedLocker: EncryptedLocker;
  exportKey: string;
  sessionKey: string;
  outputFormat?: "string" | "uint8array";
};

export type DecryptLockerFromRecoveryLockboxParams = {
  encryptedLocker: EncryptedLocker;
  recoveryExportKey: string;
  recoverySessionKey: string;
  recoveryLockbox: RecoveryLockbox;
  outputFormat?: "string" | "uint8array";
};
