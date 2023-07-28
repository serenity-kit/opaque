"use client";

import { useState } from "react";
import Button from "./Button";
import classNames from "classnames";

type Credentials = {
  username: string;
  password: string;
};

export default function CredentialsForm({
  label,
  invalid = false,
  disabled = false,
  onSubmit,
  onChange,
}: {
  label: string;
  invalid?: boolean;
  disabled?: boolean;
  onSubmit: (credentials: Credentials) => void;
  onChange?: () => void;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  return (
    <form
      id="form"
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ username, password });
      }}
    >
      <div className="space-y-2 flex flex-col">
        <input
          disabled={disabled}
          required
          className={classNames("border p-2 rounded transition-colors", {
            "border-rose-400 text-rose-600": invalid,
            "border-slate-300": !invalid,
          })}
          name="username"
          placeholder="Username"
          type="text"
          autoComplete="off"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            onChange?.();
          }}
        />

        <input
          required
          disabled={disabled}
          className={classNames("border p-2 rounded transition-colors", {
            "border-rose-400 text-rose-600": invalid,
            "border-slate-300": !invalid,
          })}
          name="password"
          placeholder="Password"
          type="password"
          autoComplete="off"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            onChange?.();
          }}
        />

        <div className="space-x-2">
          <Button disabled={disabled}>{label}</Button>
        </div>
      </div>
    </form>
  );
}
