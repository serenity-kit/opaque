"use client";

import * as opaque from "@serenity-kit/opaque";
import Button from "../Button";
import { request, requireExportKey } from "../utils/auth";
import { createRecoveryLockbox } from "../utils/locker/client/createRecoveryLockbox";

export default function CreateRecoveryKeyButton() {
  return (
    <Button
      size="small"
      variant="muted"
      onClick={async () => {
        const recoveryKey = generateRecoveryKey();
        await registerRecovery(recoveryKey);
        alert("Your recovery key: " + recoveryKey);
      }}
    >
      Create Recovery Key
    </Button>
  );
}

function generateRecoveryKey() {
  return crypto.getRandomValues(new Uint8Array(16)).join("");
}

export async function registerRecovery(recoveryKey: string) {
  const { clientRegistrationState, registrationRequest } =
    opaque.client.startRegistration({ password: recoveryKey });
  const { registrationResponse } = await request(
    "POST",
    `/api/recovery/register/start`,
    {
      registrationRequest,
    }
  ).then((res) => res.json());

  console.log("registrationResponse", registrationResponse);

  const exportKey = requireExportKey();
  const { registrationRecord, exportKey: recoveryExportKey } =
    opaque.client.finishRegistration({
      clientRegistrationState,
      registrationResponse,
      password: recoveryKey,
    });

  const recoveryLockbox = createRecoveryLockbox({
    exportKey,
    recoveryExportKey,
  });

  const res = await request("POST", `/api/recovery/register/finish`, {
    recoveryLockbox,
    registrationRecord,
  });
  console.log("finish successful", res.ok);
  return res.ok;
}
