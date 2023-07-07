import sodium from "libsodium-wrappers";

const createRecoveryKey = () => {};

type Lockbox = {
  receiverPublicKey: string;
  creatorPublicKey: string;
  ciphertext: string;
  nonce: string;
};

type EncryptLockerParams = {
  data: any;
  publicKeys: string[];
  privateKey: string;
  publicKey: string;
};

const encryptLocker = ({
  data,
  publicKeys,
  privateKey,
  publicKey,
}: EncryptLockerParams) => {
  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
  const secretKey = sodium.randombytes_buf(sodium.crypto_secretbox_KEYBYTES);
  const ciphertext = sodium.crypto_secretbox_easy(
    JSON.stringify(data),
    nonce,
    secretKey
  );

  const lockboxes = publicKeys.map((receiverPublicKey) => {
    const asyncCryptoNonce = sodium.randombytes_buf(
      sodium.crypto_box_NONCEBYTES
    );

    const ciphertext = sodium.crypto_box_easy(
      secretKey,
      asyncCryptoNonce,
      sodium.from_base64(receiverPublicKey),
      sodium.from_base64(privateKey)
    );
    const lockbox: Lockbox = {
      receiverPublicKey,
      creatorPublicKey: publicKey,
      ciphertext: sodium.to_base64(ciphertext),
      nonce: sodium.to_base64(asyncCryptoNonce),
    };
    return lockbox;
  });

  return {
    ciphertext: sodium.to_base64(ciphertext),
    nonce: sodium.to_base64(nonce),
    lockboxes,
  };
};

type DecryptLockerParams = {
  ciphertext: string;
  nonce: string;
  privateKey: string;
  lockbox: Lockbox;
};

const decryptLocker = ({
  ciphertext,
  nonce,
  privateKey,
  lockbox,
}: DecryptLockerParams) => {
  const secretKey = sodium.crypto_box_open_easy(
    sodium.from_base64(lockbox.ciphertext),
    sodium.from_base64(lockbox.nonce),
    sodium.from_base64(lockbox.receiverPublicKey),
    sodium.from_base64(privateKey)
  );
  const decryptedSecretBox = sodium.crypto_secretbox_open_easy(
    sodium.from_base64(ciphertext),
    sodium.from_base64(nonce),
    secretKey
  );
  const data = sodium.to_string(decryptedSecretBox);
  return data;
};
