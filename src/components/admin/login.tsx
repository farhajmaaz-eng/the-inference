"use client";
import { useActionState } from "react";
import { loginAction } from "@/app/admin/actions";
export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, {});
  return (
    <form action={action}>
      <label className="field">
        Email address
        <input name="email" type="email" autoComplete="username" required />
      </label>
      <label className="field">
        Password
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          maxLength={200}
        />
      </label>
      {state.error && (
        <p className="notice error-notice" role="alert">
          {state.error}
        </p>
      )}
      <button className="button" disabled={pending}>
        {pending ? "Signing in…" : "Sign in to the newsroom"}
      </button>
    </form>
  );
}
