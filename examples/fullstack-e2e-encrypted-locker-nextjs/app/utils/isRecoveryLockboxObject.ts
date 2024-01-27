import { RecoveryLockbox } from "./locker";

export default function isRecoveryLockboxObject(
  data: unknown,
): data is RecoveryLockbox {
  return (
    data != null &&
    typeof data === "object" &&
    "ciphertext" in data &&
    "nonce" in data &&
    "receiverPublicKey" in data &&
    "creatorPublicKey" in data &&
    typeof data.ciphertext === "string" &&
    typeof data.nonce === "string" &&
    typeof data.receiverPublicKey === "string" &&
    typeof data.creatorPublicKey === "string"
  );
}
