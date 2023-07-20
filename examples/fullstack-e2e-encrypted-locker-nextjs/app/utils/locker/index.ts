import { createLocker } from "./client/createLocker";
import { createRecoveryLockbox } from "./client/createRecoveryLockbox";
import { decryptLocker } from "./client/decryptLocker";
import { decryptLockerFromRecoveryLockbox } from "./client/decryptLockerFromRecoveryLockbox";
import { createLockerForClient } from "./server/createLockerForClient";
import { validateLockerAndDecryptPublicAdditionalData } from "./server/validateLockerAndDecryptPublicAdditionalData";

export const client = {
  createLocker,
  decryptLocker,
  createRecoveryLockbox,
  decryptLockerFromRecoveryLockbox,
};

export const server = {
  createLockerForClient,
  validateLockerAndDecryptPublicAdditionalData,
};
