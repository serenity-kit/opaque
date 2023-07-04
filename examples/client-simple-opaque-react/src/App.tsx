import * as opaque from "@serenity-kit/opaque";
import {
  OpaqueConfig,
  useOpaqueLoginState,
  useOpaqueRegisterState,
} from "@serenity-kit/opaque-react";
import { createContext, useCallback, useContext, useState } from "react";

const opaqueConfig: OpaqueConfig = {
  opaque,
  basePath: "http://localhost:8881/auth/opaque",
};

function Button(
  props: Omit<
    React.PropsWithChildren<React.ComponentProps<"button">>,
    "className"
  >
) {
  return (
    <button
      className="px-4 py-1 bg-blue-500 text-white rounded shadow hover:bg-blue-600 disabled:opacity-50 font-semibold"
      {...props}
    />
  );
}

const NavContext = createContext<(location: string) => void>(() => {
  // intentional no-op
});

function App() {
  const [view, setView] = useState("register");
  const navigate = useCallback((location: string) => setView(location), []);
  return (
    <NavContext.Provider value={navigate}>
      <div className="p-12 flex flex-col space-y-12 items-center">
        {view === "login" && <LoginView />}
        {view === "register" && <RegisterView />}
      </div>
    </NavContext.Provider>
  );
}

function RegisterView() {
  const { register, ...regState } = useOpaqueRegisterState(opaqueConfig);
  const navigate = useContext(NavContext);
  return (
    <div className="w-full max-w-lg space-y-8">
      {!regState.userData && (
        <>
          <h1 className="text-xl font-semibold">Register</h1>
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
          <p className="text-center text-slate-500">
            Already have an account?{" "}
            <button onClick={() => navigate("login")} className="text-blue-600">
              Login
            </button>
          </p>
        </>
      )}
      {regState.error instanceof Error && !regState.isLoading && (
        <div className="bg-rose-50 border border-rose-300 rounded p-4 text-rose-500">
          {regState.error.message}
        </div>
      )}
      {regState.userData != null && (
        <>
          <div className="bg-emerald-50 border border-emerald-300 rounded p-4 text-emerald-600 break-words whitespace-pre-wrap flex flex-col space-y-4">
            <div className="font-semibold">Success! User Data:</div>
            <div className="font-mono">
              {JSON.stringify(regState.userData, null, 2)}
            </div>
          </div>
          <div className="text-center">
            <Button onClick={() => regState.reset()}>Close</Button>
          </div>
        </>
      )}
    </div>
  );
}

function LoginView() {
  const { login, ...loginState } = useOpaqueLoginState(opaqueConfig);
  const navigate = useContext(NavContext);
  return (
    <div className="w-full max-w-lg space-y-8">
      {!loginState.sessionKey && (
        <>
          <h1 className="text-xl font-semibold">Login</h1>
          <Form
            label="Login"
            disabled={loginState.isLoading}
            onSubmit={({ username, password }) => {
              login(username, password, { rememberMe: true });
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

      {loginState.error instanceof Error && !loginState.isLoading && (
        <div className="bg-rose-50 border border-rose-300 rounded p-4 text-rose-500">
          {loginState.error.message}
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

export default App;
