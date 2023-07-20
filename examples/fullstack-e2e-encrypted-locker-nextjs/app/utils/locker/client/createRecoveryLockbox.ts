import sodium from "libsodium-wrappers";
import { CreateRecoveryLockboxParams, RecoveryLockbox } from "../types";
import { createLockerSecretKey } from "./createLockerSecretKey";

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
