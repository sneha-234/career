import { NavLink, Link, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../context/LanguageContext";

export default function PortalLayout({ admin = false, name, subtitle, employeeCode = localStorage.getItem("lta-code"), onLogout, children }) {
  const location = useLocation();
  const { lang, setLang, t } = useLanguage();
  const [adminSection, setAdminSection] = useState("employees");
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  useEffect(() => {
    const close = (event) => { if (event.key === "Escape" || (event.type === "pointerdown" && !profileRef.current?.contains(event.target))) setProfileOpen(false); };
    document.addEventListener("pointerdown", close); document.addEventListener("keydown", close);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", close); };
  }, []);
  const employeeNav = [["/dashboard", t("home"), "home"], ["/dashboard#modules", t("learning"), "learn"], ["/assessment", t("assessment"), "test"]];
  const adminNav = [["/admin", "Dashboard", "⌂"]];
  const adminItems = [["employees", "Employees", "♙"], ["cards", "Study cards", "▤"], ["questions", "Question bank", "?"], ["rules", "Process rules", "⚙"], ["results", "Results", "▥"], ["hindi", "Hindi", "अ"]];
  const nav = admin ? adminNav : employeeNav;
  const employeeActive = (to) => to === "/assessment" ? location.pathname === "/assessment" : to.includes("#modules") ? location.pathname === "/dashboard" && location.hash === "#modules" : location.pathname === "/dashboard" && location.hash !== "#modules";
  const EmployeeIcon = ({ type }) => type === "home" ? <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10.5 12 4l8 6.5V20H7v-7h10v7" /></svg> : type === "learn" ? <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14v16H5zM9 4v16M12 8h4M12 12h4M12 16h4" /></svg> : type === "profile" ? <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4.5 21a7.5 7.5 0 0 1 15 0" /></svg> : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5 10 17l9-11" /></svg>;
  const MobileProfileSheet = () => <div className="mobile-profile-layer" onPointerDown={(event) => event.stopPropagation()}><button className="profile-backdrop" type="button" aria-label="Close profile" onClick={() => setProfileOpen(false)} /><section className="mobile-profile-sheet" role="dialog" aria-modal="true" aria-label={lang === "hi" ? "कर्मचारी प्रोफ़ाइल" : "Employee profile"}><div className="sheet-handle" /><div className="profile-card-head"><span className="avatar large">{(name || "L").charAt(0)}</span><div><b>{name || "Lotus user"}</b><small>{lang === "hi" ? "कर्मचारी प्रोफ़ाइल" : "Employee profile"}</small></div><button className="sheet-close" type="button" aria-label="Close" onClick={() => setProfileOpen(false)}>×</button></div><div className="profile-details"><div><span>{lang === "hi" ? "कर्मचारी का नाम" : "Employee name"}</span><b>{name || "—"}</b></div><div><span>{lang === "hi" ? "एम्प्लॉई आईडी" : "Employee ID"}</span><b className="employee-code">{employeeCode || "—"}</b></div><div><span>{lang === "hi" ? "विभाग" : "Department"}</span><b>{subtitle || "—"}</b></div></div><div className="profile-menu-language"><span>{lang === "hi" ? "भाषा" : "Language"}</span><div className="language-toggle"><button className={lang === "en" ? "active" : ""} onClick={() => setLang("en")}>EN</button><button className={lang === "hi" ? "active" : ""} onClick={() => setLang("hi")}>हि</button></div></div><button className="profile-logout" onClick={onLogout}>{t("logout")}</button></section></div>;
  return (
    <div className={`portal-shell ${admin ? "admin-shell" : "employee-shell"}`}>
      <header className="site-header portal-header">
        <div className="header-inner wide">
          <Link to={admin ? "/admin" : "/dashboard"} className="brand"><img src="/lotus-logo.png" alt="Lotus Electronics" /></Link>
          <span className="header-title">{t("academy")}</span>
          <div className="language-toggle" aria-label="Language"><button className={lang === "en" ? "active" : ""} onClick={() => setLang("en")}>EN</button><button className={lang === "hi" ? "active" : ""} onClick={() => setLang("hi")}>हि</button></div>
          <div className="profile-control" ref={profileRef}><button className="user-summary" type="button" aria-expanded={profileOpen} aria-haspopup="menu" onClick={() => setProfileOpen((open) => !open)}><span className="avatar">{(name || "L").charAt(0)}</span><div><b>{name || "Lotus user"}</b><small>{subtitle}</small></div><span className="profile-chevron" aria-hidden="true">⌄</span></button>{profileOpen && <div className="profile-menu" role="menu"><div className="profile-card-head"><span className="avatar large">{(name || "L").charAt(0)}</span><div><b>{name || "Lotus user"}</b><small>{admin ? "Administrator" : (lang === "hi" ? "कर्मचारी प्रोफ़ाइल" : "Employee profile")}</small></div></div>{!admin && <div className="profile-details"><div><span>{lang === "hi" ? "कर्मचारी का नाम" : "Employee name"}</span><b>{name || "—"}</b></div><div><span>{lang === "hi" ? "एम्प्लॉई आईडी" : "Employee ID"}</span><b className="employee-code">{employeeCode || "—"}</b></div><div><span>{lang === "hi" ? "विभाग" : "Department"}</span><b>{subtitle || "—"}</b></div></div>}<div className="profile-menu-language"><span>{lang === "hi" ? "भाषा" : "Language"}</span><div className="language-toggle"><button className={lang === "en" ? "active" : ""} onClick={() => setLang("en")}>EN</button><button className={lang === "hi" ? "active" : ""} onClick={() => setLang("hi")}>हि</button></div></div><button className="profile-logout" role="menuitem" onClick={onLogout}>{t("logout")}</button></div>}</div>
          <button className="logout-btn" onClick={onLogout}>{t("logout")}</button>
        </div>
      </header>
      <div className="portal-body">
        <aside className="portal-side">
          <p className="nav-label">{admin ? "Management" : "My academy"}</p>
          <nav>{admin ? adminItems.map(([id, label, icon]) => <button key={id} className={adminSection === id ? "active" : ""} onClick={() => { setAdminSection(id); window.dispatchEvent(new CustomEvent("admin-tab", { detail: id })); }}><span>{icon}</span>{label}</button>) : nav.map(([to, label, icon]) => <NavLink key={label} to={to} className={employeeActive(to) ? "active" : ""}><span><EmployeeIcon type={icon} /></span>{label}</NavLink>)}</nav>
          <div className="side-help"><b>{t("needHelp")}</b><p>{t("helpText")}</p></div>
        </aside>
        <div className="portal-content">{children}</div>
      </div>
      {!admin && <nav className="mobile-nav" aria-label="Employee navigation">{employeeNav.map(([to, label, icon]) => <NavLink key={label} to={to} className={employeeActive(to) && !profileOpen ? "active" : ""}><span><EmployeeIcon type={icon} /></span><small>{label}</small></NavLink>)}<button type="button" className={`mobile-profile ${profileOpen ? "active" : ""}`} aria-expanded={profileOpen} onPointerDown={(event) => event.stopPropagation()} onClick={() => setProfileOpen((open) => !open)}><span><EmployeeIcon type="profile" /></span><small>{lang === "hi" ? "प्रोफ़ाइल" : "Profile"}</small></button></nav>}
      {!admin && profileOpen && <MobileProfileSheet />}
      {admin && <nav className="admin-mobile-nav">{adminItems.map(([id, label]) => <button key={id} className={adminSection === id ? "active" : ""} onClick={() => { setAdminSection(id); window.dispatchEvent(new CustomEvent("admin-tab", { detail: id })); }}>{label}</button>)}</nav>}
    </div>
  );
}
