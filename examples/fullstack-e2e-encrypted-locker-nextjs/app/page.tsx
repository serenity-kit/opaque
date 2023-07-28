import { useState } from "react";
import { login, register, request } from "./utils/auth";
import runFullFlowDemo from "./utils/demoflow";
import { Locker } from "./utils/locker";
import { createLocker } from "./utils/locker/client/createLocker";
import { decryptLocker } from "./utils/locker/client/decryptLocker";
import Button from "./Button";
import CredentialsForm from "./CredentialsForm";
import { redirect } from "next/navigation";
import LoginForm from "./LoginForm";
import { cookies } from "next/headers";
import database from "./api/db";
import Demoflow from "./Demoflow";

// function isValidLockerResponse(data: unknown): data is Locker {
//   return (
//     data != null &&
//     typeof data === "object" &&
//     "ciphertext" in data &&
//     "nonce" in data &&
//     typeof data.ciphertext === "string" &&
//     typeof data.nonce === "string"
//   );
// }

// async function fetchLocker(): Promise<Locker | null> {
//   const res = await fetch("/api/locker");
//   if (res.status === 404) {
//     return null;
//   }
//   if (res.status !== 200) throw new Error("unexpected locker response");
//   const json: unknown = await res.json();
//   if (!isValidLockerResponse(json)) {
//     throw new TypeError("malformed locker object");
//   }
//   return json;
// }

// function LockerForm({
//   secret,
//   onSubmit,
//   onChange,
// }: {
//   secret: string;
//   onSubmit?: () => void;
//   onChange?: (secret: string) => void;
// }) {
//   return (
//     <div className="px-12 space-y-4">
//       <h2 className="text-xl font-semibold">Locker</h2>

//       <form
//         className="flex flex-col items-start space-y-2"
//         onSubmit={(e) => {
//           e.preventDefault();
//           onSubmit?.();
//         }}
//       >
//         <textarea
//           className="w-full max-w-xl border border-gray-300 p-2 rounded"
//           value={secret}
//           onChange={(e) => {
//             onChange?.(e.target.value);
//           }}
//         />
//         <Button>Save</Button>
//       </form>
//     </div>
//   );
// }

type LoginState = { sessionKey: string; exportKey: string } | null;

export default async function Home() {
  const sessionCookie = cookies().get("session");
  if (sessionCookie) {
    const db = await database;
    const session = await db.getSession(sessionCookie.value);
    if (session) {
      redirect("/private");
    }
  }

  // const [username, setUsername] = useState("");
  // const [password, setPassword] = useState("");

  // const [loginState, setLoginState] = useState<LoginState>(null);
  // const [lockerSecret, setLockerSecret] = useState<string>("");

  return (
    <div className="p-12 max-w-xl text-gray-900 flex flex-col space-y-16">
      <LoginForm />
      <hr />
      {/*
      {loginState != null && (
        <LockerForm
          secret={lockerSecret}
          onChange={(secret) => {
            setLockerSecret(secret);
          }}
          onSubmit={async () => {
            console.log(loginState);
            const locker = createLocker({
              data: lockerSecret,
              exportKey: loginState.exportKey,
              sessionKey: loginState.sessionKey,
            });
            console.log(locker);
            const res = await request("POST", "/api/locker", locker);
          }}
        />
      )}*/}

      <Demoflow />
    </div>
  );
}
