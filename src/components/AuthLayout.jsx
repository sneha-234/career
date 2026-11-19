import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";

export default function AuthLayout({ admin = false, children }) {
  const { lang, setLang, t } = useLanguage();
  return (
    <div className="auth-page">
      <header className="site-header">
        <div className="header-inner">
          <Link to="/login" className="brand"><img src="/lotus-logo.png" alt="Lotus Electronics" /></Link>
          <span className="header-title">{t("academy")}</span>
          <div className="language-toggle" aria-label="Language"><button className={lang === "en" ? "active" : ""} onClick={() => setLang("en")}>EN</button><button className={lang === "hi" ? "active" : ""} onClick={() => setLang("hi")}>हि</button></div>
          <span className="secure-chip">{admin ? t("adminPortal") : t("employeePortal")}</span>
        </div>
      </header>
      <main className="auth-main">
        <section className="auth-intro">
          <p className="eyebrow">Learn · Practice · Grow</p>
          <h1>Build the skills to serve every customer better.</h1>
          <p>Your role-based Lotus learning path, progress and assessment—together in one simple place.</p>
          <div className="auth-benefits"><span>Role-specific modules</span><span>Progress saved live</span><span>Day 10 assessment</span></div>
        </section>
        <section className="auth-card">{children}</section>
      </main>
      <footer className="site-footer"><div>Lotus Electronics Supermarket</div><span>Learning &amp; Development</span></footer>
    </div>
  );
}
