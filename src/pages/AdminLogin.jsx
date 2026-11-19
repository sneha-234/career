import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { onAuthStateChanged, signInWithEmailAndPassword } from "firebase/auth";
import AuthLayout from "../components/AuthLayout";
import { auth } from "../firebase";

export default function AdminLogin() {
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false); const navigate = useNavigate();
  useEffect(() => onAuthStateChanged(auth, (user) => { if (user?.email) navigate("/admin", { replace: true }); }), [navigate]);
  async function submit(event) { event.preventDefault(); if (!email || !password) return setError("Enter both email and password."); setBusy(true); setError(""); try { await signInWithEmailAndPassword(auth, email.trim(), password); navigate("/admin", { replace: true }); } catch (error) { setError(error.code?.includes("invalid-credential") ? "Email or password is incorrect." : error.code?.includes("too-many") ? "Too many attempts. Please wait and try again." : error.message); setBusy(false); } }
  return <AuthLayout admin><div className="auth-card-title"><p className="eyebrow">Secure management access</p><h2>Admin sign in</h2><p>Manage employees, content, assessments and results.</p></div><form onSubmit={submit}><label className="field">Work email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@lotuselectronics.com" autoComplete="username" autoFocus /></label><label className="field">Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" autoComplete="current-password" /></label>{error && <p className="form-message bad">{error}</p>}<button className="primary-btn" disabled={busy}>{busy ? <><span className="spinner" /> Signing in…</> : "Sign in securely"}</button></form><p className="auth-switch">Employee? <Link to="/login">Use employee code</Link></p></AuthLayout>;
}
