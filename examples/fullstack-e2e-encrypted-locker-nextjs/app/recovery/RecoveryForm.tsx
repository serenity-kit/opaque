"use client";

import { useState } from "react";
import CredentialsForm from "../CredentialsForm";
import { loginRecovery } from "../utils/client";
import { decryptLockerFromRecoveryLockbox } from "../utils/locker/client/decryptLockerFromRecoveryLockbox";

export default function RecoveryForm() {
  const [data, setData] = useState<string | null>(null);
  if (data != null) {
    return (
      <div className="space-y-4">
        <div className="bg-green-50 text-green-600 border border-green-200 rounded p-4 text-center">
          Locker successfully recovered
        </div>
        <label className="space-y-2 block">
          <div className="font-medium text-gray-400 text-sm">Content:</div>
          <textarea
            className="bg-gray-50 p-4 border border-gray-300 rounded w-full max-w-xl"
            rows={5}
            defaultValue={data}
            readOnly
          />
        </label>
      </div>
    );
  }
  return (
    <CredentialsForm
      label="Recover"
      placeholders={{ password: "Recovery Key" }}
      onSubmit={async ({ username, password }) => {
        const result = await loginRecovery(username, password);
        if (result) {
          const { recoveryExportKey, locker, recoveryLockbox } = result;
          const data = decryptLockerFromRecoveryLockbox({
            locker,
            recoveryLockbox,
            recoveryExportKey,
          });
          if (typeof data !== "string") throw new TypeError();
          setData(data);
        } else {
          alert("Login failure");
        }
      }}
    />
  );
}
