import { Link, Navigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import PortalLayout from "../components/PortalLayout";
import Loading from "../components/Loading";
import useEmployee from "../hooks/useEmployee";
import { useLanguage } from "../context/LanguageContext";
import { auth } from "../firebase";
import { dayNumber, deptName } from "../data";

export default function EmployeeDashboard() {
  const [state] = useEmployee();
  const { t, pick, lang } = useLanguage();
  if (state.loading) return <Loading label={lang === "hi" ? "अकादमी खुल रही है…" : "Opening your academy…"} />;
  if (state.error === "NO_LOGIN") return <Navigate to="/login" replace />;
  if (state.error) return <div className="error-state"><h2>Unable to load academy</h2><p>{state.error}</p><button onClick={() => location.reload()}>Try again</button></div>;

  const { employee, content } = state;
  const modules = content.modules || [];
  const total = modules.reduce((n, module) => n + module.cards.length, 0);
  const learned = Object.keys(employee.done).length;
  const pct = total ? Math.round(learned / total * 100) : 0;
  const complete = modules.filter((module, mi) => module.cards.every((_, ci) => employee.done[`${mi}-${ci}`])).length;
  const pending = modules.findIndex((module, mi) => module.cards.some((_, ci) => !employee.done[`${mi}-${ci}`]));
  const active = pending < 0 ? Math.max(0, modules.length - 1) : pending;
  const day = dayNumber(employee.start);
  async function logout() { localStorage.removeItem("lta-code"); await signOut(auth).catch(() => {}); location.assign("/login"); }

  return <PortalLayout name={employee.name} subtitle={deptName[employee.dept]} employeeCode={employee.code} onLogout={logout}>
    <main className="dashboard-page">
      <div className="page-heading"><div><p className="eyebrow">{lang === "hi" ? `दिन ${day} · ${deptName[employee.dept]}` : `Day ${day} · ${deptName[employee.dept]}`}</p><h1>{t("welcome")}, {employee.name?.split(" ")[0]}</h1><p>{lang === "hi" ? "हर कार्ड आपको बेहतर ग्राहक सेवा के लिए तैयार करता है।" : "Keep moving forward—every card builds stronger customer service."}</p></div><span className="id-chip">{employee.code}</span></div>
      <section className="continue-card"><div><span>{t("continueLearning")}</span><h2>{pick(modules[active]?.en, modules[active]?.hi) || t("journey")}</h2><p>{learned} {t("of")} {total} {t("cards")}</p><div className="progress"><i style={{ width: `${pct}%` }} /></div><Link to={`/learn/${active}`} className="light-btn">{t("resume")}</Link></div><div className="progress-orb"><b>{pct}%</b><small>{t("complete")}</small></div></section>
      <section className="stats-grid"><article><b>{learned}</b><span>{t("cardsLearned")}</span></article><article><b>{complete}/{modules.length}</b><span>{t("modulesCompleted")}</span></article><article><b>{employee.result ? `${employee.result.pct}%` : "—"}</b><span>{t("assessmentScore")}</span></article></section>
      <section id="modules" className="content-section"><div className="section-heading"><div><p className="eyebrow">{t("curriculum")}</p><h2>{t("modules")}</h2></div><span>{pct}% {t("complete")}</span></div><div className="module-list">{modules.map((module, mi) => { const count = module.cards.filter((_, ci) => employee.done[`${mi}-${ci}`]).length; const mp = Math.round(count / module.cards.length * 100); return <Link key={module.en} to={`/learn/${mi}`} className="module-card"><span className="module-index">{String(mi + 1).padStart(2, "0")}</span><div><h3>{pick(module.en, module.hi)}</h3><p>{count} {t("of")} {module.cards.length} {t("cards")}</p><div className="thin-progress"><i style={{ width: `${mp}%` }} /></div></div><b>{mp === 100 ? "✓" : "›"}</b></Link>; })}</div></section>
    </main>
  </PortalLayout>;
}
