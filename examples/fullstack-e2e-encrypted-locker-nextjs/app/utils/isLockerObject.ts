import { Locker } from "./locker";

export default function isLockerObject(data: unknown): data is Locker {
  return (
    data != null &&
    typeof data === "object" &&
    "ciphertext" in data &&
    "nonce" in data &&
    typeof data.ciphertext === "string" &&
    typeof data.nonce === "string"
  );
}
