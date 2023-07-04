import { useOpaqueRegisterState } from "@serenity-kit/opaque-react";
import { useNavigation } from "./Navigation";
import { useOpaqueConfig } from "./Opaque";
import { useState } from "react";
import Button from "./Button";

export default function RegisterView() {
  const opaqueConfig = useOpaqueConfig();
  const { register, ...registration } = useOpaqueRegisterState(opaqueConfig);
  const navigate = useNavigation();
  return (
    <div className="w-full max-w-lg space-y-8">
      {!registration.userData && (
        <>
          <h1 className="text-xl font-semibold">Register</h1>
          <Form
            label="Register"
            disabled={registration.isLoading}
            onSubmit={async ({ username, password }) => {
              const userResult = await register(username, password, {
                name: username,
                email: username + "@example.com",
              });
              console.log(userResult);
            }}
          />
          <p className="text-center text-slate-500">
            Already have an account?{" "}
            <button onClick={() => navigate("login")} className="text-blue-600">
              Login
            </button>
          </p>
        </>
      )}
      {registration.error != null && !registration.isLoading && (
        <div className="bg-rose-50 border border-rose-300 rounded p-4 text-rose-500">
          {registration.error instanceof Error
            ? registration.error.message
            : "" + registration.error}
        </div>
      )}
      {registration.userData != null && (
        <>
          <div className="bg-emerald-50 border border-emerald-300 rounded p-4 text-emerald-600 break-words whitespace-pre-wrap flex flex-col space-y-4">
            <div className="font-semibold">Success! User Data:</div>
            <div className="font-mono">
              {JSON.stringify(registration.userData, null, 2)}
            </div>
          </div>
          <div className="text-center">
            <Button onClick={() => registration.reset()}>Close</Button>
          </div>
        </>
      )}
    </div>
  );
}

function Form({
  label,
  disabled,
  onSubmit,
}: {
  label: string;
  disabled: boolean;
  onSubmit: (credentials: { username: string; password: string }) => void;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  return (
    <form
      className="flex flex-col space-y-4 items-start"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ username, password });
      }}
    >
      <input
        type="text"
        required
        placeholder="Username"
        value={username}
        onChange={(e) => {
          setUsername(e.target.value);
        }}
        className="border border-slate-300 rounded p-2 w-full"
      />
      <input
        type="password"
        required
        placeholder="Password"
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
        }}
        className="border border-slate-300 rounded p-2 w-full"
      />
      <Button disabled={disabled}>{label}</Button>
    </form>
  );
}
