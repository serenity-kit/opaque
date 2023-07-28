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
    <div className="p-12 max-w-xl text-gray-900 space-y-4">
      <LoginForm />

      {/* <form
        id="form"
        className="p-12 space-y-4 max-w-xl"
        onSubmit={async (
          e: React.FormEvent<HTMLFormElement> & {
            nativeEvent: { submitter: HTMLButtonElement };
          }
        ) => {
          e.preventDefault();
          const action = e.nativeEvent.submitter.value;
          try {
            if (action === "login") {
              const loginResult = await login(username, password);
              if (loginResult) {
                alert(
                  `User "${username}" logged in successfully; sessionKey = ${loginResult.sessionKey}`
                );
                const locker = await fetchLocker();
                if (locker != null) {
                  const secret = decryptLocker({
                    locker,
                    exportKey: loginResult.exportKey,
                  });
                  if (typeof secret !== "string") throw new TypeError();
                  console.log("decrypted locker:", secret);
                  setLockerSecret(secret);
                } else {
                  setLockerSecret("");
                  console.log("no locker content found");
                }
                setLoginState(loginResult);
              } else {
                alert(`User "${username}" login failed`);
                setLoginState(null);
              }
            } else if (action === "register") {
              const ok = await register(username, password);
              if (ok) {
                alert(`User "${username}" registered successfully`);
              } else {
                alert(`Failed to register user "${username}"`);
              }
            }
          } catch (err) {
            console.error(err);
            alert(err);
          }
        }}
      >
        <h1 className="text-xl font-semibold">Login/Register</h1>

        <div className="space-y-2 flex flex-col">
          <input
            required
            className="border border-slate-300 p-2 rounded"
            name="username"
            placeholder="Username"
            type="text"
            autoComplete="off"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
            }}
          />

          <input
            required
            className="border border-slate-300 p-2 rounded"
            name="password"
            placeholder="Password"
            type="password"
            autoComplete="off"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
            }}
          />

          <div className="space-x-2">
            <Button name="action" value="login">
              Login
            </Button>
            <Button name="action" value="register">
              Register
            </Button>
          </div>
        </div>
      </form>

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
      )}

      <div className="p-12 space-y-4 max-w-xl">
        <p className="text-gray-500 text-sm">
          Run full flow in-memory demo (check console.log output).
        </p>
        <Button
          name="login"
          onClick={() => {
            runFullFlowDemo();
          }}
        >
          Demo
        </Button>
      </div> */}
    </div>
  );
}
