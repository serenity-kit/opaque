import { useOpaqueLoginState } from "@serenity-kit/opaque-react";
import { useNavigation } from "./Navigation";
import { useOpaqueConfig } from "./Opaque";
import Button from "./Button";
import { useState } from "react";

export default function LoginView() {
  const opaqueConfig = useOpaqueConfig();
  const { login, ...loginState } = useOpaqueLoginState(opaqueConfig);
  const navigate = useNavigation();
  return (
    <div className="w-full max-w-lg space-y-8">
      {!loginState.sessionKey && (
        <>
          <h1 className="text-xl font-semibold">Login</h1>
          <Form
            label="Login"
            disabled={loginState.isLoading}
            onSubmit={({ username, password, ...data }) => {
              login(username, password, data);
            }}
          />

          <p className="text-center text-slate-500">
            Don't have an account?{" "}
            <button
              onClick={() => navigate("register")}
              className="text-blue-600"
            >
              Register
            </button>
          </p>
        </>
      )}

      {loginState.error != null && !loginState.isLoading && (
        <div className="bg-rose-50 border border-rose-300 rounded p-4 text-rose-500">
          {loginState.error instanceof Error
            ? loginState.error.message
            : "" + loginState.error}
        </div>
      )}

      {loginState.sessionKey && (
        <>
          <div className="bg-emerald-50 border border-emerald-300 rounded p-4 text-emerald-600 break-words whitespace-pre-wrap flex flex-col space-y-4">
            <div className="font-semibold">Success! Session Key:</div>

            <div className="font-mono">{loginState.sessionKey}</div>
          </div>
          <div className="text-center">
            <Button onClick={() => loginState.reset()}>Close</Button>
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
  onSubmit: (data: {
    username: string;
    password: string;
    rememberMe: boolean;
  }) => void;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  return (
    <form
      className="flex flex-col space-y-4 items-start"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ username, password, rememberMe });
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
      <label className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={rememberMe}
          onChange={(e) => {
            setRememberMe(e.target.checked);
          }}
        />
        <span>Remember me</span>
      </label>
      <Button disabled={disabled}>{label}</Button>
    </form>
  );
}
