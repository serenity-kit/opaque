import * as opaque from "@serenity-kit/opaque";
import {
  OpaqueConfig,
  useOpaqueLoginRequest,
  useOpaqueRegisterRequest,
} from "@serenity-kit/opaque-react";
import { useState } from "react";

const opaqueConfig: OpaqueConfig = {
  opaque,
  basePath: "http://localhost:8881/auth/opaque",
};

function App() {
  const { register, ...regState } = useOpaqueRegisterRequest(opaqueConfig);
  const { login, ...loginState } = useOpaqueLoginRequest(opaqueConfig);

  return (
    <div>
      <Form
        label="Register"
        disabled={regState.isLoading}
        onSubmit={({ username, password }) => {
          register(username, password);
        }}
      />

      {regState.error instanceof Error &&
        !regState.isLoading &&
        regState.error.message}

      <Form
        label="Login"
        disabled={loginState.isLoading}
        onSubmit={({ username, password }) => {
          login(username, password);
        }}
      />

      {loginState.error instanceof Error &&
        !loginState.isLoading &&
        loginState.error.message}

      {loginState.sessionKey && <div>Session Key: {loginState.sessionKey}</div>}
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
      />
      <input
        type="password"
        required
        placeholder="Password"
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
        }}
      />
      <button disabled={disabled}>{label}</button>
    </form>
  );
}

export default App;
