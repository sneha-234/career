import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { doc, updateDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import PortalLayout from "../components/PortalLayout";
import Loading from "../components/Loading";
import useEmployee from "../hooks/useEmployee";
import { useLanguage } from "../context/LanguageContext";
import { auth, db } from "../firebase";
import { deptName, fillRules } from "../data";

export default function ModuleReader() {
  const { moduleId } = useParams(); const mi = Number(moduleId);
  const [state, setState] = useEmployee(); const { t, pick, lang } = useLanguage();
  const [index, setIndex] = useState(0); const [revealed, setRevealed] = useState(false); const [busy, setBusy] = useState(false); const [message, setMessage] = useState("");
  const module = state.content?.modules?.[mi];
  useEffect(() => { if (module && state.employee) { const next = module.cards.findIndex((_, ci) => !state.employee.done[`${mi}-${ci}`]); setIndex(next < 0 ? 0 : next); } }, [module, state.employee, mi]);
  if (state.loading) return <Loading label={lang === "hi" ? "मॉड्यूल लोड हो रहा है…" : "Loading module…"} />;
  if (state.error === "NO_LOGIN") return <Navigate to="/login" replace />;
  if (state.error || !module) return <div className="error-state"><h2>Module unavailable</h2><p>{state.error || "This module does not exist."}</p><Link to="/dashboard">Back to dashboard</Link></div>;

  const { employee, rules } = state; const card = module.cards[index]; const done = employee.done[`${mi}-${index}`]; const needsReveal = card.k !== "B"; const pct = Math.round((index + 1) / module.cards.length * 100);
  async function complete() { const nextDone = { ...employee.done, [`${mi}-${index}`]: 1 }; setBusy(true); setMessage(""); try { await updateDoc(doc(db, "emps", employee.code), { done: nextDone }); setState((s) => ({ ...s, employee: { ...s.employee, done: nextDone } })); if (index < module.cards.length - 1) { setIndex(index + 1); setRevealed(false); } else setMessage(lang === "hi" ? "मॉड्यूल पूरा हुआ। बहुत अच्छा!" : "Module complete. Great work!"); } catch { setMessage(lang === "hi" ? "प्रोग्रेस सेव नहीं हुई। फिर कोशिश करें।" : "Progress could not be saved. Try again."); } finally { setBusy(false); } }
  async function logout() { localStorage.removeItem("lta-code"); await signOut(auth).catch(() => {}); location.assign("/login"); }
  const typeLabel = card.k === "S" ? t("situation") : card.k === "F" ? t("thinkAnswer") : t("keyLearning");
  const title = fillRules(pick(card.te, card.th), rules); const body = fillRules(pick(card.be, card.bh), rules);

  return <PortalLayout name={employee.name} subtitle={deptName[employee.dept]} onLogout={logout}><main className="reader-page"><div className="reader-top"><Link to="/dashboard">{t("allModules")}</Link><span>{t("card")} {index + 1} {t("of")} {module.cards.length}</span></div><div className="reader-progress"><i style={{ width: `${pct}%` }} /></div><div className="reader-heading"><p className="eyebrow">{lang === "hi" ? `मॉड्यूल ${mi + 1}` : `Module ${mi + 1}`}</p><h1>{pick(module.en, module.hi)}</h1></div><article className="learning-card"><span className="type-pill">{typeLabel}</span><h2>{title}</h2>{(!needsReveal || revealed || done) ? <div className="answer-box"><b>{t("remember")}</b><p>{body}</p></div> : <button className="outline-btn" onClick={() => setRevealed(true)}>{t("showAnswer")}</button>}</article>{message && <p className={message.includes("नहीं") || message.includes("could not") ? "form-message bad" : "form-message ok"}>{message}</p>}<div className="reader-actions"><button className="secondary-btn" disabled={!index} onClick={() => { setIndex(index - 1); setRevealed(false); }}>{t("previous")}</button><button className="primary-btn auto" disabled={busy || (needsReveal && !revealed && !done)} onClick={complete}>{busy ? t("saving") : index === module.cards.length - 1 ? t("completeModule") : t("nextCard")}</button></div></main></PortalLayout>;
}
