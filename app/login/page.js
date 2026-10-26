"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp, ConfigNotice } from "@/components/AppProvider";
import { GoogleIcon } from "@/components/SocialIcons";
import { authErrorMessage, DEMO_ACCOUNT, DEMO_EMAIL_DOMAIN } from "@/lib/store/authSlice";

// Only allow redirects back into our own site ("/checkout", never "https://evil.com").
const safeNext = (value) => (value && value.startsWith("/") && !value.startsWith("//") ? value : "/");

// Login and registration live on one page: /login (log in) and /login?tab=register (sign up).
function AuthForm() {
  const router = useRouter();
  const params = useSearchParams();
  const isRegister = params.get("tab") === "register";
  const next = safeNext(params.get("next"));
  const { user, authReady, login, demoLogin, register, loginWithGoogle, resetPassword, toast } = useApp();

  const [form, setForm] = useState({ name: "", identifier: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Already logged in? Go where they were heading.
  useEffect(() => {
    if (authReady && user) router.replace(next);
  }, [authReady, user, next, router]);

  // Switching tab clears old messages.
  useEffect(() => {
    setErrors({});
    setFormError("");
  }, [isRegister]);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((er) => ({ ...er, [key]: "" }));
  };

  function validate() {
    const er = {};
    if (isRegister) {
      if (form.name.trim().length < 2) er.name = "Please enter your full name.";
      const email = form.email.trim().toLowerCase();
      if (!/^\S+@\S+\.\S+$/.test(email)) er.email = "Enter a valid email address.";
      else if (email.endsWith("@x.dummyjson.com") || email.endsWith(DEMO_EMAIL_DOMAIN)) er.email = "This email domain is reserved for demo accounts.";
      if (form.password.length < 6) er.password = "Password must be at least 6 characters.";
      if (form.confirm !== form.password) er.confirm = "Passwords do not match.";
    } else {
      if (!form.identifier.trim()) er.identifier = "Enter your username or email.";
      if (!form.password) er.password = "Enter your password.";
    }
    setErrors(er);
    return Object.keys(er).length === 0;
  }

  // Runs an auth action, shows errors in the form, and redirects on success.
  async function run(action, welcome) {
    setFormError("");
    setBusy(true);
    try {
      await action();
      if (welcome) toast(welcome);
      router.replace(next);
    } catch (err) {
      setFormError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(e) {
    e.preventDefault();
    setFormError("");
    if (!validate()) return;
    if (isRegister) {
      run(
        () => register({ name: form.name.trim(), email: form.email.trim(), password: form.password }),
        "Account created! We sent you a verification email."
      );
    } else {
      run(() => login({ identifier: form.identifier, password: form.password }), "Welcome back!");
    }
  }

  async function onForgot() {
    setFormError("");
    const email = form.identifier.trim();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setErrors({ identifier: "Enter your email above first, then click “Forgot password”." });
      return;
    }
    try {
      await resetPassword(email);
      toast("Password reset email sent. Check your inbox.");
    } catch (err) {
      setFormError(authErrorMessage(err));
    }
  }

  const tabHref = (register) => {
    const q = new URLSearchParams();
    if (register) q.set("tab", "register");
    if (next !== "/") q.set("next", next);
    const qs = q.toString();
    return qs ? `/login?${qs}` : "/login";
  };

  const pwInput = (id, label, key, autoComplete) => (
    <div className="field mb-3.5">
      <div className="flex items-center justify-between">
        <label htmlFor={id}>{label}</label>
        {!isRegister && key === "password" && (
          <button type="button" className="btn-link !text-[13px] !text-brand" onClick={onForgot}>Forgot password?</button>
        )}
      </div>
      <div className="relative">
        <input
          className="pr-[60px]"
          id={id}
          type={showPassword ? "text" : "password"}
          autoComplete={autoComplete}
          value={form[key]}
          onChange={set(key)}
          aria-invalid={!!errors[key]}
        />
        <button
          type="button"
          className="absolute top-2 right-2 h-[26px] bg-transparent px-2 text-[13px] font-semibold text-brand"
          onClick={() => setShowPassword((s) => !s)} aria-label={showPassword ? "Hide password" : "Show password"}>
          {showPassword ? "Hide" : "Show"}
        </button>
      </div>
      {errors[key] && <small className="err">{errors[key]}</small>}
    </div>
  );

  return (
    <div className="flex justify-center bg-surface px-4 pt-12 pb-[72px]">
      <div className="w-full max-w-[440px] rounded-xl border border-line bg-white p-8 shadow-[0_4px_20px_rgba(0,0,0,.05)] max-sm:px-[18px] max-sm:py-6">
        <div className="mb-[22px] grid grid-cols-2 gap-1 rounded-[10px] bg-surface p-1" role="tablist">
          <Link href={tabHref(false)} role="tab" aria-selected={!isRegister} className={`rounded-lg py-[9px] text-center text-[15px] font-semibold ${!isRegister ? "bg-white text-brand shadow-[0_1px_3px_rgba(0,0,0,.12)]" : "text-muted"}`} replace>Login</Link>
          <Link href={tabHref(true)} role="tab" aria-selected={isRegister} className={`rounded-lg py-[9px] text-center text-[15px] font-semibold ${isRegister ? "bg-white text-brand shadow-[0_1px_3px_rgba(0,0,0,.12)]" : "text-muted"}`} replace>Register</Link>
        </div>

        <h1 className="mb-5 text-center text-[28px] font-bold">{isRegister ? "Create your account" : "Welcome back"}</h1>

        <ConfigNotice />

        <form onSubmit={onSubmit} noValidate>
          {isRegister ? (
            <>
              <div className="field mb-3.5">
                <label htmlFor="name">Full name</label>
                <input id="name" autoComplete="name" value={form.name} onChange={set("name")} aria-invalid={!!errors.name} />
                {errors.name && <small className="err">{errors.name}</small>}
              </div>
              <div className="field mb-3.5">
                <label htmlFor="email">Email</label>
                <input id="email" type="email" autoComplete="email" value={form.email} onChange={set("email")} aria-invalid={!!errors.email} />
                {errors.email && <small className="err">{errors.email}</small>}
              </div>
              {pwInput("password", "Password", "password", "new-password")}
              {pwInput("confirm", "Confirm password", "confirm", "new-password")}
            </>
          ) : (
            <>
              <div className="field mb-3.5">
                <label htmlFor="identifier">Username or email</label>
                <input
                  id="identifier"
                  autoComplete="username"
                  autoCapitalize="none"
                  value={form.identifier}
                  onChange={set("identifier")}
                  aria-invalid={!!errors.identifier}
                />
                {errors.identifier && <small className="err">{errors.identifier}</small>}
              </div>
              {pwInput("password", "Password", "password", "current-password")}
            </>
          )}

          {formError && <div className="form-error" role="alert">{formError}</div>}

          <button className="btn-primary w-full" type="submit" disabled={busy}>
            {busy ? "Please wait..." : isRegister ? "Create account" : "Login"}
          </button>
        </form>

        <div className="my-[18px] flex items-center gap-3 text-[13px] text-faint before:h-px before:flex-1 before:bg-line before:content-[''] after:h-px after:flex-1 after:bg-line after:content-['']">
          <span>OR</span>
        </div>

        <button
          type="button"
          className="flex h-11 w-full items-center justify-center gap-2.5 rounded-lg border border-line bg-white text-[15px] font-medium not-disabled:hover:bg-surface" onClick={() => run(loginWithGoogle)} disabled={busy}>
          <GoogleIcon /> Continue with Google
        </button>

        {!isRegister && (
          <div className="mt-[18px] rounded-lg bg-tint px-4 py-3.5 text-sm text-[#1f2937]">
            <b>Demo account</b>
            <p className="mt-1 mb-2.5">Username: <b>{DEMO_ACCOUNT.username}</b> · Password: <b>{DEMO_ACCOUNT.password}</b></p>
            <button type="button" className="font-semibold text-brand-dark underline" onClick={() => run(demoLogin, "Logged in with the demo account")} disabled={busy}>
              Login with demo account →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <AuthForm />
    </Suspense>
  );
}
