"use client";

import CredentialsForm from "../CredentialsForm";

export default function RecoveryForm() {
  return (
    <CredentialsForm
      label="Recover"
      placeholders={{ password: "Recovery Key" }}
      onSubmit={() => {
        //TODO
      }}
    />
  );
}
