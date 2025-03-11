export type Locker = {
  ciphertext: string;
  nonce: string;
};

export type LockerWithServerVerificationMac = Locker & {
  serverVerificationMac: string;
};

export type RecoveryLockbox = {
  receiverPublicKey: string;
  creatorPublicKey: string;
  ciphertext: string;
  nonce: string;
};

export type CreateLockerSecretKeyParams = {
  exportKey: string;
};

export type IsValidLockerParams = {
  locker: LockerWithServerVerificationMac;
  sessionKey: string;
};

export type CreateRecoveryLockboxParams = {
  exportKey: string;
  recoveryExportKey: string;
};

export type CreateLockerParams = {
  data: string | Uint8Array;
  exportKey: string;
  sessionKey: string;
};

export type DecryptLockerParams = {
  locker: Locker;
  exportKey: string;
  outputFormat?: "string" | "uint8array";
};

export type DecryptLockerFromRecoveryLockboxParams = {
  locker: Locker;
  recoveryExportKey: string;
  recoveryLockbox: RecoveryLockbox;
  outputFormat?: "string" | "uint8array";
};
