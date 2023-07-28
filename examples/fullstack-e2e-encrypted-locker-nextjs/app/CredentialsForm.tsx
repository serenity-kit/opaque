"use client";

import { useState } from "react";
import Button from "./Button";

type Credentials = {
  username: string;
  password: string;
};

export default function CredentialsForm({
  label,
  onSubmit,
}: {
  label: string;
  onSubmit: (credentials: Credentials) => void;
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
          <Button>{label}</Button>
        </div>
      </div>
    </form>
  );
}
