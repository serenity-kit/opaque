import { createRecoveryLockbox } from "./client/createRecoveryLockbox";
import { decryptLocker } from "./client/decryptLocker";
import { decryptLockerFromRecoveryLockbox } from "./client/decryptLockerFromRecoveryLockbox";
import { encryptLocker } from "./client/encryptLocker";
import { createLockerForClient } from "./server/createLockerForClient";
import { validateAndDecryptPublicAdditionalData } from "./server/validateAndDecryptPublicAdditionalData";

export const client = {
  encryptLocker,
  decryptLocker,
  createRecoveryLockbox,
  decryptLockerFromRecoveryLockbox,
};

export const server = {
  createLockerForClient,
  validateAndDecryptPublicAdditionalData,
};
