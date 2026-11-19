import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { signInAnonymously, signOut } from "firebase/auth";
import AuthLayout from "../components/AuthLayout";
import { useLanguage } from "../context/LanguageContext";
import { auth, db } from "../firebase";

export default function EmployeeLogin() {
  const [code, setCode] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false); const navigate = useNavigate(); const { lang } = useLanguage(); const tx = (en, hi) => lang === "hi" ? hi : en;
  async function submit(event) {
    event.preventDefault(); const employeeCode = code.trim().toUpperCase();
    if (!employeeCode) return setError(tx("Please enter your employee code.", "कृपया अपना एम्प्लॉई कोड दर्ज करें।"));
    setBusy(true); setError("");
    try {
      if (auth.currentUser?.email) await signOut(auth);
      if (!auth.currentUser) await signInAnonymously(auth);
      const snap = await getDoc(doc(db, "emps", employeeCode));
      if (!snap.exists()) throw new Error(tx("No employee found with this code. Please contact HR.", "इस कोड से कोई कर्मचारी नहीं मिला। कृपया HR से संपर्क करें।"));
      localStorage.setItem("lta-code", employeeCode); navigate("/dashboard", { replace: true });
    } catch (error) { setError(error.code?.includes("permission") ? tx("Access is not allowed. Please ask HR to check Firebase rules.", "प्रवेश की अनुमति नहीं है। कृपया HR से Firebase rules जाँचने को कहें।") : error.message || tx("Sign in failed.", "साइन इन नहीं हो पाया।")); }
    finally { setBusy(false); }
  }
  return <AuthLayout><div className="auth-card-title"><p className="eyebrow">{tx("Employee access", "कर्मचारी प्रवेश")}</p><h2>{tx("Continue your learning", "अपनी ट्रेनिंग जारी रखें")}</h2><p>{tx("Enter the employee code shared by HR.", "HR द्वारा दिया गया एम्प्लॉई कोड दर्ज करें।")}</p></div><form onSubmit={submit}><label className="field">{tx("Employee code", "एम्प्लॉई कोड")}<input value={code} onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s/g, ""))} placeholder="LE-1001" autoComplete="username" autoCapitalize="characters" spellCheck="false" enterKeyHint="go" autoFocus /></label>{error && <p className="form-message bad" role="alert">{error}</p>}<button className="primary-btn" disabled={busy}>{busy ? <><span className="spinner" /> {tx("Signing in…", "साइन इन हो रहा है…")}</> : tx("Sign in to academy", "अकादमी में साइन इन करें")}</button></form><p className="auth-switch">{tx("HR or management?", "HR या मैनेजमेंट?")} <Link to="/admin-signin">{tx("Admin sign in", "एडमिन साइन इन")}</Link></p></AuthLayout>;
}
