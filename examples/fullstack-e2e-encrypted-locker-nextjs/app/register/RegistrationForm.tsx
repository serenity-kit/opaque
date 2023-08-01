"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import CredentialsForm from "../CredentialsForm";
import {
  login,
  register,
  storeLoginKeys,
  usePrivateRedirect,
} from "../utils/auth";
import { useState } from "react";

export default function RegistrationForm() {
  const [showError, setShowError] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const redirectPrivate = usePrivateRedirect();
  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold">Register</h1>
      <CredentialsForm
        label="Register"
        invalid={showError}
        disabled={disabled}
        onChange={() => setShowError(false)}
        onSubmit={async ({ username, password }) => {
          setShowError(false);
          setDisabled(true);
          try {
            await register(username, password);
            console.log(`User "${username}" registered successfully`);
            const loginResult = await login(username, password);
            if (loginResult) {
              console.log(
                `User "${username}" logged in successfully; sessionKey = ${loginResult.sessionKey}`
              );
              storeLoginKeys(loginResult);
              redirectPrivate();
              return;
            } else {
              console.log(`User "${username}" login failed`);
              setShowError(true);
            }
          } catch (err) {
            setShowError(true);
            alert(err);
          }
          setDisabled(false);
        }}
      />
      <p className="text-sm">
        Already have an account?{" "}
        <Link href="/" className="text-blue-500">
          Login
        </Link>
      </p>
    </div>
  );
}
