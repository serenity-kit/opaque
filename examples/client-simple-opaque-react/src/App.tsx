import * as opaque from "@serenity-kit/opaque";
import {
  OpaqueConfig,
  useOpaqueLoginState,
  useOpaqueRegisterState,
} from "@serenity-kit/opaque-react";
import { useState } from "react";

const opaqueConfig: OpaqueConfig = {
  opaque,
  basePath: "http://localhost:8881/auth/opaque",
};

function App() {
  const { register, ...regState } = useOpaqueRegisterState(opaqueConfig);
  const { login, ...loginState } = useOpaqueLoginState(opaqueConfig);

  return (
    <div>
      <Form
        label="Register"
        disabled={regState.isLoading}
        onSubmit={async ({ username, password }) => {
          const userResult = await register(username, password, {
            name: username,
            email: username + "@example.com",
          });
          console.log(userResult);
        }}
      />

      {regState.error instanceof Error &&
        !regState.isLoading &&
        regState.error.message}

      <Form
        label="Login"
        disabled={loginState.isLoading}
        onSubmit={({ username, password }) => {
          login(username, password, { rememberMe: true });
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
