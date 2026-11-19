import { useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { doc, updateDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import PortalLayout from "../components/PortalLayout";
import Loading from "../components/Loading";
import useEmployee from "../hooks/useEmployee";
import { useLanguage } from "../context/LanguageContext";
import { auth, db } from "../firebase";
import { categories, deptName, fillRules } from "../data";

const quota = { M: 10, P: 25, S: 8, D: 4, B: 3 };
const hiCategories = { M: "मानसिकता", P: "प्रक्रिया", S: "बिक्री", D: "अनुशासन", B: "व्यवहार" };

export default function TestPage() {
  const [state, setState] = useEmployee();
  const { lang } = useLanguage();
  const [started, setStarted] = useState(false), [index, setIndex] = useState(0), [answers, setAnswers] = useState({}), [busy, setBusy] = useState(false), [result, setResult] = useState(null);
  const questions = useMemo(() => {
    const all = state.content?.questions || [];
    const chosen = Object.entries(quota).flatMap(([k, n]) => all.filter((q) => q.c === k).slice(0, n));
    const used = new Set(chosen);
    return [...chosen, ...all.filter((q) => !used.has(q))].slice(0, 50);
  }, [state.content]);
  if (state.loading) return <Loading label={lang === "hi" ? "परीक्षा तैयार हो रही है…" : "Preparing assessment…"} />;
  if (state.error === "NO_LOGIN") return <Navigate to="/login" replace />;
  if (state.error) return <div className="error-state"><h2>Assessment unavailable</h2><p>{state.error}</p></div>;
  const { employee, rules, content } = state, totalCards = content.modules.reduce((n, m) => n + m.cards.length, 0), completed = Object.keys(employee.done).length;
  const eligible = completed >= totalCards || employee.test || employee.result, q = questions[index], shown = result || employee.result;
  const tx = (en, hi) => lang === "hi" ? hi : en;
  async function submit() { setBusy(true); const correct = questions.reduce((n, item, i) => n + (answers[i] === item.a ? 1 : 0), 0); const pct = Math.round(correct / questions.length * 100); const value = { score: correct, total: questions.length, pct, pass: pct >= Number(rules.pass || 80), at: new Date().toISOString() }; try { await updateDoc(doc(db, "emps", employee.code), { resultJ: JSON.stringify(value), attempts: (employee.attempts || 0) + 1 }); setResult(value); setState((s) => ({ ...s, employee: { ...s.employee, result: value } })); } finally { setBusy(false); } }
  async function logout() { localStorage.removeItem("lta-code"); await signOut(auth).catch(() => {}); location.assign("/login"); }
  return <PortalLayout name={employee.name} subtitle={deptName[employee.dept]} employeeCode={employee.code} onLogout={logout}><main className="assessment-page">
    {shown ? <section className="result-card"><span className={shown.pass ? "result-icon pass" : "result-icon fail"}>{shown.pass ? "✓" : "!"}</span><p className="eyebrow">{tx("Assessment result", "परीक्षा परिणाम")}</p><h1>{shown.pass ? tx("Congratulations, you passed", "बधाई हो, आप उत्तीर्ण हुए") : tx("Keep learning and try again", "सीखते रहें और फिर प्रयास करें")}</h1><div className="score">{shown.pct}%</div><p>{shown.score} / {shown.total} {tx("correct", "सही")}</p><Link className="primary-btn auto" to="/dashboard">{tx("Return to dashboard", "डैशबोर्ड पर जाएँ")}</Link></section>
    : !eligible ? <section className="locked-card"><span className="lock-icon" aria-hidden="true">◷</span><p className="eyebrow">{tx("Final assessment", "अंतिम परीक्षा")}</p><h1>{tx("Assessment is locked", "परीक्षा अभी लॉक है")}</h1><p>{tx("Finish your learning cards to unlock the final assessment.", "अंतिम परीक्षा अनलॉक करने के लिए अपने लर्निंग कार्ड पूरे करें।")}</p><div className="locked-progress"><div><b>{completed} / {totalCards}</b><small>{tx("cards completed", "कार्ड पूरे")}</small><strong>{totalCards ? Math.round(completed / totalCards * 100) : 0}%</strong></div><div className="progress"><i style={{ width: `${totalCards ? Math.round(completed / totalCards * 100) : 0}%` }} /></div></div><Link className="primary-btn auto" to="/dashboard#modules">{tx("Continue learning", "सीखना जारी रखें")}</Link></section>
    : !started ? <section className="test-intro"><p className="eyebrow">{tx("Final assessment", "अंतिम परीक्षा")}</p><h1>{tx("Ready to demonstrate your learning?", "क्या आप अपनी सीख दिखाने के लिए तैयार हैं?")}</h1><p>{tx(`Answer ${questions.length} questions. You need ${rules.pass || 80}% to pass.`, `${questions.length} प्रश्नों का उत्तर दें। उत्तीर्ण होने के लिए ${rules.pass || 80}% आवश्यक है।`)}</p><ul><li>{tx("Choose one answer per question", "हर प्रश्न का एक उत्तर चुनें")}</li><li>{tx("Review answers before submitting", "जमा करने से पहले उत्तर जाँचें")}</li><li>{tx("Results save automatically", "परिणाम स्वतः सेव होगा")}</li></ul><button className="primary-btn auto" onClick={() => setStarted(true)}>{tx("Start assessment", "परीक्षा शुरू करें")}</button></section>
    : <section className="question-card"><div className="question-meta"><span>{lang === "hi" ? hiCategories[q.c] || "प्रश्न" : categories[q.c] || "Question"}</span><b>{index + 1} / {questions.length}</b></div><div className="reader-progress"><i style={{ width: `${(index + 1) / questions.length * 100}%` }} /></div><h2>{fillRules(lang === "hi" ? q.qh || q.qe : q.qe, rules)}</h2><div className="options">{q.o.map((option, oi) => <button key={oi} className={answers[index] === oi ? "selected" : ""} onClick={() => setAnswers({ ...answers, [index]: oi })}><b>{String.fromCharCode(65 + oi)}</b>{fillRules(lang === "hi" ? option[1] || option[0] : option[0], rules)}</button>)}</div><div className="reader-actions"><button className="secondary-btn" disabled={!index} onClick={() => setIndex(index - 1)}>{tx("Previous", "पिछला")}</button>{index < questions.length - 1 ? <button className="primary-btn auto" disabled={answers[index] == null} onClick={() => setIndex(index + 1)}>{tx("Next question", "अगला प्रश्न")}</button> : <button className="primary-btn auto" disabled={busy || Object.keys(answers).length < questions.length} onClick={submit}>{busy ? tx("Submitting…", "जमा हो रहा है…") : tx("Submit assessment", "परीक्षा जमा करें")}</button>}</div></section>}
  </main></PortalLayout>;
}
