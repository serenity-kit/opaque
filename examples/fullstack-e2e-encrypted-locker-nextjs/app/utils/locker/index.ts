import { createLocker } from "./client/createLocker";
import { createRecoveryLockbox } from "./client/createRecoveryLockbox";
import { decryptLocker } from "./client/decryptLocker";
import { decryptLockerFromRecoveryLockbox } from "./client/decryptLockerFromRecoveryLockbox";
import { isValidLocker } from "./server/isValidLocker";

export * from "./types";

export const client = {
  createLocker,
  decryptLocker,
  createRecoveryLockbox,
  decryptLockerFromRecoveryLockbox,
};

export const server = {
  isValidLocker,
};
