import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { read, utils } from "xlsx";
import { onAuthStateChanged, signOut } from "firebase/auth";
import PortalLayout from "../components/PortalLayout";
import Loading from "../components/Loading";
import { auth, db } from "../firebase";
import { categories, departments, deptName, parseEmployee } from "../data";

const tabs = [
  ["employees", "Employees"],
  ["cards", "Study cards"],
  ["questions", "Question bank"],
  ["rules", "Process rules"],
  ["results", "Results"],
  ["hindi", "Hindi"],
];

export default function AdminDashboard() {
  const [user, setUser] = useState(undefined);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("employees");
  const [rules, setRules] = useState({
    delivery: "4–6",
    happy: "24",
    pass: "80",
    timer: "60",
  });
  const [contentCache, setContentCache] = useState({});
  useEffect(() => {
    const changeTab = (event) => setTab(event.detail);
    window.addEventListener("admin-tab", changeTab);
    return () => window.removeEventListener("admin-tab", changeTab);
  }, []);
  useEffect(() => {
    let stop = () => {};
    const authStop = onAuthStateChanged(auth, (next) => {
      setUser(next);
      if (!next?.email) return setLoading(false);
      stop = onSnapshot(
        collection(db, "emps"),
        (snapshot) => {
          setEmployees(
            snapshot.docs
              .map((item) => parseEmployee(item.id, item.data()))
              .sort((a, b) =>
                a.code.localeCompare(b.code, undefined, { numeric: true }),
              ),
          );
          setLoading(false);
        },
        (err) => {
          setError(
            err.code?.includes("permission")
              ? "This account can sign in, but Firestore rules do not allow admin access."
              : err.message,
          );
          setLoading(false);
        },
      );
      getDoc(doc(db, "config", "rules")).then(
        (snap) => snap.exists() && setRules((r) => ({ ...r, ...snap.data() })),
      );
    });
    return () => {
      authStop();
      stop();
    };
  }, []);
  async function loadContent(dept) {
    if (contentCache[dept]) return contentCache[dept];
    const snap = await getDoc(doc(db, "content", dept));
    if (!snap.exists())
      throw new Error(`No content found for ${deptName[dept]}.`);
    const value = JSON.parse(snap.data().json);
    setContentCache((old) => ({ ...old, [dept]: value }));
    return value;
  }
  async function saveContent(dept, value) {
    await setDoc(doc(db, "content", dept), { json: JSON.stringify(value) });
    setContentCache((old) => ({ ...old, [dept]: value }));
  }
  async function logout() {
    await signOut(auth);
    location.assign("/admin-signin");
  }
  if (loading) return <Loading label="Loading admin workspace…" />;
  if (!user?.email) return <Navigate to="/admin-signin" replace />;
  const passed = employees.filter((e) => e.result?.pass).length;
  const learning = employees.filter(
    (e) => !e.result && Object.keys(e.done).length,
  ).length;
  return (
    <PortalLayout
      admin
      name={user.email.split("@")[0]}
      subtitle="Administrator"
      onLogout={logout}
    >
      <main className="admin-page">
        <div className="page-heading">
          <div>
            <p className="eyebrow">Management workspace</p>
            <h1>Training administration</h1>
            <p>Manage people, learning content and assessment outcomes.</p>
          </div>
        </div>
        {error && <p className="form-message bad">{error}</p>}
        <section className="admin-metrics">
          <article>
            <span>Total employees</span>
            <b>{employees.length}</b>
            <small>
              {new Set(employees.map((e) => e.dept)).size} departments
            </small>
          </article>
          <article>
            <span>Currently learning</span>
            <b>{learning}</b>
            <small>Active progress</small>
          </article>
          <article>
            <span>Assessment passed</span>
            <b>{passed}</b>
            <small>
              {employees.length
                ? Math.round((passed / employees.length) * 100)
                : 0}
              % completion rate
            </small>
          </article>
        </section>
        <nav className="admin-tabs">
          {tabs.map(([id, label]) => (
            <button
              key={id}
              className={tab === id ? "active" : ""}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </nav>
        <section className="admin-panel">
          {tab === "employees" && <Employees employees={employees} />}
          {tab === "cards" && (
            <Cards loadContent={loadContent} saveContent={saveContent} />
          )}
          {tab === "questions" && (
            <Questions loadContent={loadContent} saveContent={saveContent} />
          )}
          {tab === "rules" && <Rules rules={rules} setRules={setRules} />}
          {tab === "results" && <Results employees={employees} />}
          {tab === "hindi" && <Hindi loadContent={loadContent} />}
        </section>
      </main>
    </PortalLayout>
  );
}

function Employees({ employees }) {
  const [search, setSearch] = useState("");
  const [show, setShow] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    code: "",
    name: "",
    dept: "sales",
    start: new Date().toISOString().slice(0, 10),
  });
  const filtered = employees.filter((e) =>
    `${e.code} ${e.name} ${deptName[e.dept]}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  async function add(event) {
    event.preventDefault();
    const code = form.code.trim().toUpperCase();
    if (!code || !form.name.trim())
      return setMessage("Code and name are required.");
    try {
      await setDoc(doc(db, "emps", code), {
        code,
        name: form.name.trim(),
        dept: form.dept,
        start: form.start,
        done: {},
        testJ: "",
        resultJ: "",
        attempts: 0,
        testDay: 10,
      });
      setShow(false);
      setForm({
        code: "",
        name: "",
        dept: "sales",
        start: new Date().toISOString().slice(0, 10),
      });
      setMessage(`${code} added successfully.`);
    } catch (error) {
      setMessage(error.message);
    }
  }
  return (
    <>
      <div className="panel-heading">
        <div>
          <h2>Employees</h2>
          <p>Codes, departments and training status.</p>
        </div>
        <div className="panel-actions">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employees"
          />
          <button
            className="secondary-btn auto"
            onClick={() => setShowImport(true)}
          >
            Import Excel
          </button>
          <button className="primary-btn auto" onClick={() => setShow(true)}>
            Add employee
          </button>
        </div>
      </div>
      {message && <p className="form-message info">{message}</p>}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Department</th>
              <th>Joined</th>
              <th>Cards</th>
              <th>Status</th>
              <th>Score</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((e) => (
              <tr key={e.code}>
                <td>
                  <div className="employee-cell">
                    <span>{e.name?.charAt(0)}</span>
                    <div>
                      <b>{e.name}</b>
                      <small>{e.code}</small>
                    </div>
                  </div>
                </td>
                <td>
                  <select
                    value={e.dept}
                    onChange={(x) =>
                      updateDoc(doc(db, "emps", e.code), {
                        dept: x.target.value,
                        done: {},
                        testJ: "",
                        resultJ: "",
                      })
                    }
                  >
                    {departments.map(([id, label]) => (
                      <option key={id} value={id}>
                        {label}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    type="date"
                    value={e.start}
                    onChange={(x) =>
                      updateDoc(doc(db, "emps", e.code), {
                        start: x.target.value,
                      })
                    }
                  />
                </td>
                <td>{Object.keys(e.done).length}</td>
                <td>
                  <Status employee={e} />
                </td>
                <td>{e.result ? `${e.result.pct}%` : "—"}</td>
                <td>
                  <button
                    className="text-btn danger"
                    onClick={async () => {
                      if (confirm(`Remove ${e.name}?`))
                        await deleteDoc(doc(db, "emps", e.code));
                    }}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showImport && (
        <EmployeeImport
          employees={employees}
          onClose={() => setShowImport(false)}
          onMessage={setMessage}
        />
      )}
      {show && (
        <div
          className="modal"
          onMouseDown={(e) => e.target === e.currentTarget && setShow(false)}
        >
          <form className="modal-card" onSubmit={add}>
            <div className="panel-heading">
              <div>
                <p className="eyebrow">New team member</p>
                <h2>Add employee</h2>
              </div>
              <button
                type="button"
                className="close"
                onClick={() => setShow(false)}
              >
                ×
              </button>
            </div>
            <label className="field">
              Employee code
              <input
                value={form.code}
                onChange={(e) =>
                  setForm({ ...form, code: e.target.value.toUpperCase() })
                }
                placeholder="LE-1005"
              />
            </label>
            <label className="field">
              Full name
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>
            <div className="form-grid">
              <label className="field">
                Department
                <select
                  value={form.dept}
                  onChange={(e) => setForm({ ...form, dept: e.target.value })}
                >
                  {departments.map(([id, label]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                Joining date
                <input
                  type="date"
                  value={form.start}
                  onChange={(e) => setForm({ ...form, start: e.target.value })}
                />
              </label>
            </div>
            <button className="primary-btn">Add employee</button>
          </form>
        </div>
      )}
    </>
  );
}

function EmployeeImport({ employees, onClose, onMessage }) {
  const [rows, setRows] = useState([]);
  const [fileName, setFileName] = useState("");
  const [updateExisting, setUpdateExisting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const existingCodes = useMemo(
    () => new Set(employees.map((employee) => employee.code.toUpperCase())),
    [employees],
  );
  const departmentMap = useMemo(() => {
    const map = new Map();
    departments.forEach(([id, label]) => {
      map.set(id.toLowerCase(), id);
      map.set(label.toLowerCase(), id);
    });
    return map;
  }, []);

  const getValue = (row, aliases) => {
    const entries = Object.entries(row);
    const found = entries.find(([key]) =>
      aliases.includes(String(key).trim().toLowerCase().replace(/[ _-]+/g, "")),
    );
    return found?.[1] ?? "";
  };
  const toDate = (value) => {
    if (value instanceof Date && !Number.isNaN(value.getTime()))
      return value.toISOString().slice(0, 10);
    if (typeof value === "number") {
      const parsed = utils.parse_date_code(value);
      if (parsed)
        return `${parsed.y}-${String(parsed.m).padStart(2, "0")}-${String(parsed.d).padStart(2, "0")}`;
    }
    const text = String(value || "").trim();
    if (!text) return new Date().toISOString().slice(0, 10);
    const date = new Date(text);
    return Number.isNaN(date.getTime())
      ? ""
      : date.toISOString().slice(0, 10);
  };

  async function chooseFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    setFileName(file.name);
    try {
      const workbook = read(await file.arrayBuffer(), {
        type: "array",
        cellDates: true,
      });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawRows = utils.sheet_to_json(sheet, { defval: "", raw: true });
      if (!rawRows.length) throw new Error("The first worksheet is empty.");
      const parsed = rawRows.map((row, index) => {
        const code = String(
          getValue(row, ["employeecode", "employeeid", "empcode", "empid", "code", "id"]),
        )
          .trim()
          .toUpperCase();
        const name = String(
          getValue(row, ["employeename", "fullname", "name"]),
        ).trim();
        const departmentValue = String(
          getValue(row, ["department", "dept", "role"]),
        )
          .trim()
          .toLowerCase();
        const dept = departmentMap.get(departmentValue) || "";
        const start = toDate(
          getValue(row, ["joiningdate", "joindate", "startdate", "joining", "start"]),
        );
        const problems = [];
        if (!code) problems.push("Employee ID missing");
        if (!name) problems.push("Name missing");
        if (!dept) problems.push("Unknown department");
        if (!start) problems.push("Invalid date");
        return {
          row: index + 2,
          code,
          name,
          dept,
          start,
          existing: existingCodes.has(code),
          error: problems.join(", "),
        };
      });
      setRows(parsed);
    } catch (readError) {
      setRows([]);
      setError(readError.message || "The spreadsheet could not be read.");
    }
  }

  async function importEmployees() {
    const valid = rows.filter(
      (row) => !row.error && (updateExisting || !row.existing),
    );
    if (!valid.length) return setError("There are no valid new employees to import.");
    setBusy(true);
    setError("");
    try {
      for (let offset = 0; offset < valid.length; offset += 450) {
        const batch = writeBatch(db);
        valid.slice(offset, offset + 450).forEach((employee) => {
          const ref = doc(db, "emps", employee.code);
          const base = {
            code: employee.code,
            name: employee.name,
            dept: employee.dept,
            start: employee.start,
          };
          batch.set(
            ref,
            employee.existing
              ? base
              : {
                  ...base,
                  done: {},
                  testJ: "",
                  resultJ: "",
                  attempts: 0,
                  testDay: 10,
                },
            { merge: employee.existing },
          );
        });
        await batch.commit();
      }
      const skipped = rows.length - valid.length;
      onMessage(
        `${valid.length} employee${valid.length === 1 ? "" : "s"} imported${skipped ? `; ${skipped} row${skipped === 1 ? "" : "s"} skipped` : ""}.`,
      );
      onClose();
    } catch (importError) {
      setError(importError.message || "Employees could not be imported.");
    } finally {
      setBusy(false);
    }
  }

  const validCount = rows.filter(
    (row) => !row.error && (updateExisting || !row.existing),
  ).length;
  return (
    <div className="modal" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal-card wide excel-import-modal">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Bulk employee upload</p>
            <h2>Import employees from Excel</h2>
            <p>Upload the first worksheet from an XLSX, XLS or CSV file.</p>
          </div>
          <button type="button" className="close" onClick={onClose}>×</button>
        </div>
        <div className="import-columns">
          <b>Required columns</b>
          <span>Employee ID</span><span>Name</span><span>Department</span>
          <span>Joining Date</span>
        </div>
        <label className="excel-dropzone">
          <input type="file" accept=".xlsx,.xls,.csv" onChange={chooseFile} />
          <b>{fileName || "Choose Excel file"}</b>
          <span>XLSX, XLS or CSV · first row must contain column names</span>
        </label>
        {error && <p className="form-message bad">{error}</p>}
        {!!rows.length && <>
          <div className="import-summary"><b>{validCount} ready</b><span>{rows.filter((row) => row.existing).length} existing</span><span>{rows.filter((row) => row.error).length} invalid</span></div>
          <label className="import-checkbox"><input type="checkbox" checked={updateExisting} onChange={(event) => setUpdateExisting(event.target.checked)} />Update name, department and joining date for existing Employee IDs</label>
          <div className="import-preview"><table><thead><tr><th>Row</th><th>Employee</th><th>Department</th><th>Joining date</th><th>Status</th></tr></thead><tbody>{rows.slice(0, 50).map((row) => <tr key={`${row.row}-${row.code}`}><td>{row.row}</td><td><b>{row.name || "—"}</b><small className="block">{row.code || "No ID"}</small></td><td>{deptName[row.dept] || "—"}</td><td>{row.start || "—"}</td><td><span className={`import-state ${row.error ? "bad" : row.existing ? "warn" : "good"}`}>{row.error || (row.existing ? (updateExisting ? "Will update" : "Skipped") : "Ready")}</span></td></tr>)}</tbody></table></div>
          {rows.length > 50 && <p className="import-more">Showing the first 50 of {rows.length} rows.</p>}
        </>}
        <div className="import-actions"><button type="button" className="secondary-btn" onClick={onClose}>Cancel</button><button type="button" className="primary-btn auto" disabled={busy || !validCount} onClick={importEmployees}>{busy ? "Importing…" : `Import ${validCount} employees`}</button></div>
      </section>
    </div>
  );
}

function Status({ employee }) {
  const label = employee.result?.pass
    ? "Passed"
    : employee.result
      ? "Retest"
      : Object.keys(employee.done).length
        ? "Learning"
        : "Not started";
  return (
    <span className={`status ${label.toLowerCase().replace(" ", "-")}`}>
      {label}
    </span>
  );
}

function ContentPicker({ dept, setDept, module, setModule, modules = [] }) {
  return (
    <div className="content-picker">
      <label>
        Department
        <select
          value={dept}
          onChange={(e) => {
            setDept(e.target.value);
            setModule?.(0);
          }}
        >
          {departments.map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      </label>
      {setModule && (
        <label>
          Module
          <select
            value={module}
            onChange={(e) => setModule(Number(e.target.value))}
          >
            {modules.map((m, i) => (
              <option key={m.en} value={i}>
                {i + 1}. {m.en}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}

function LanguageNotice({ children }) {
  return (
    <div className="language-notice">
      <span>EN</span>
      <span>हि</span>
      <p>{children}</p>
    </div>
  );
}

function Cards({ loadContent, saveContent }) {
  const [dept, setDept] = useState("sales");
  const [moduleId, setModuleId] = useState(0);
  const [content, setContent] = useState(null);
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState("");
  useEffect(() => {
    setContent(null);
    loadContent(dept)
      .then(setContent)
      .catch((e) => setMessage(e.message));
  }, [dept]);
  if (!content) return <Loading label="Loading study cards…" />;
  const module = content.modules[moduleId] || content.modules[0];
  async function saveCard(event) {
    event.preventDefault();
    const card = editing.card;
    if (![card.te, card.be, card.th, card.bh].every((value) => value?.trim())) {
      setMessage("Please fill the title and answer in both English and Hindi.");
      return;
    }
    const next = structuredClone(content);
    if (editing.index == null) next.modules[moduleId].cards.push(card);
    else next.modules[moduleId].cards[editing.index] = card;
    await saveContent(dept, next);
    setContent(next);
    setEditing(null);
    setMessage("Study card saved in English and Hindi.");
  }
  return (
    <>
      <div className="panel-heading">
        <div>
          <h2>Study cards / स्टडी कार्ड</h2>
          <p>Edit every card in English and Hindi.</p>
        </div>
        <button
          className="primary-btn auto"
          onClick={() =>
            setEditing({
              index: null,
              card: { k: "B", te: "", be: "", th: "", bh: "" },
            })
          }
        >
          Add card
        </button>
      </div>
      <LanguageNotice>
        Both language fields are required and are shown to employees using the
        EN/हि switch.
      </LanguageNotice>
      <ContentPicker
        dept={dept}
        setDept={setDept}
        module={moduleId}
        setModule={setModuleId}
        modules={content.modules}
      />
      {message && <p className="form-message info">{message}</p>}
      <div className="content-list">
        {module.cards.map((card, index) => (
          <article key={index}>
            <span className="type-pill">{card.k}</span>
            <div>
              <h3>{card.te}</h3>
              <p>{card.be}</p>
              <div className="hindi-preview">
                <b>{card.th || "Hindi title missing"}</b>
                <p>{card.bh || "Hindi answer missing"}</p>
              </div>
            </div>
            <button
              className="text-btn"
              onClick={() => setEditing({ index, card: { ...card } })}
            >
              Edit
            </button>
          </article>
        ))}
      </div>
      {editing && (
        <div className="modal">
          <form className="modal-card wide" onSubmit={saveCard}>
            <div className="panel-heading">
              <h2>{editing.index == null ? "Add" : "Edit"} bilingual card</h2>
              <button
                type="button"
                className="close"
                onClick={() => setEditing(null)}
              >
                ×
              </button>
            </div>
            <div className="form-grid">
              <label className="field">
                Type
                <select
                  value={editing.card.k}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      card: { ...editing.card, k: e.target.value },
                    })
                  }
                >
                  <option value="B">Quick fact</option>
                  <option value="F">Flashcard</option>
                  <option value="S">Scenario</option>
                </select>
              </label>
            </div>
            {[
              ["te", "Title (English)"],
              ["be", "Answer / Text (English)"],
              ["th", "शीर्षक (Hindi)"],
              ["bh", "उत्तर / विवरण (Hindi)"],
            ].map(([key, label], i) => (
              <label
                className={`field ${i > 1 ? "hindi-field" : ""}`}
                key={key}
              >
                {label}
                <textarea
                  required
                  lang={i > 1 ? "hi" : "en"}
                  value={editing.card[key] || ""}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      card: { ...editing.card, [key]: e.target.value },
                    })
                  }
                />
              </label>
            ))}
            <button className="primary-btn">Save English + Hindi card</button>
          </form>
        </div>
      )}
    </>
  );
}

function Questions({ loadContent, saveContent }) {
  const [dept, setDept] = useState("sales");
  const [content, setContent] = useState(null);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState("");
  useEffect(() => {
    setContent(null);
    loadContent(dept)
      .then(setContent)
      .catch((e) => setMessage(e.message));
  }, [dept]);
  const filtered = (content?.questions || []).filter((q) =>
    `${q.qe || ""} ${q.qh || ""}`.toLowerCase().includes(search.toLowerCase()),
  );
  if (!content) return <Loading label="Loading question bank…" />;
  async function saveQuestion(event) {
    event.preventDefault();
    const question = editing.question;
    if (
      !question.qe?.trim() ||
      !question.qh?.trim() ||
      question.o.some((option) => !option[0]?.trim() || !option[1]?.trim())
    ) {
      setMessage(
        "Fill the question and all four options in both English and Hindi.",
      );
      return;
    }
    const next = structuredClone(content);
    if (editing.index == null)
      next.questions.push({ ...question, id: Date.now() });
    else next.questions[editing.index] = question;
    await saveContent(dept, next);
    setContent(next);
    setEditing(null);
    setMessage("Question saved in English and Hindi.");
  }
  return (
    <>
      <div className="panel-heading">
        <div>
          <h2>Question bank / प्रश्न बैंक</h2>
          <p>Maintain questions and answers in both languages.</p>
        </div>
        <button
          className="primary-btn auto"
          onClick={() =>
            setEditing({
              index: null,
              question: {
                c: "P",
                qe: "",
                qh: "",
                o: [
                  ["", ""],
                  ["", ""],
                  ["", ""],
                  ["", ""],
                ],
                a: 0,
              },
            })
          }
        >
          Add question
        </button>
      </div>
      <LanguageNotice>
        Every question and each of its four options requires English and Hindi
        text.
      </LanguageNotice>
      <div className="toolbar">
        <ContentPicker dept={dept} setDept={setDept} />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search English or Hindi"
        />
      </div>
      {message && <p className="form-message info">{message}</p>}
      <div className="question-list">
        {filtered.slice(0, 100).map((q) => {
          const originalIndex = content.questions.indexOf(q);
          return (
            <article key={q.id}>
              <div>
                <span className="type-pill">{categories[q.c]}</span>
                <h3>{q.qe}</h3>
                <p className="hindi-text">{q.qh || "Hindi question missing"}</p>
                <p>
                  Correct: {q.o[q.a]?.[0]} /{" "}
                  {q.o[q.a]?.[1] || "Hindi option missing"}
                </p>
              </div>
              <button
                className="text-btn"
                onClick={() =>
                  setEditing({
                    index: originalIndex,
                    question: structuredClone(q),
                  })
                }
              >
                Edit
              </button>
            </article>
          );
        })}
      </div>
      {editing && (
        <div className="modal">
          <form className="modal-card wide" onSubmit={saveQuestion}>
            <div className="panel-heading">
              <h2>
                {editing.index == null ? "Add" : "Edit"} bilingual question
              </h2>
              <button
                type="button"
                className="close"
                onClick={() => setEditing(null)}
              >
                ×
              </button>
            </div>
            <label className="field">
              Category
              <select
                value={editing.question.c}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    question: { ...editing.question, c: e.target.value },
                  })
                }
              >
                {Object.entries(categories).map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              Question (English)
              <textarea
                required
                value={editing.question.qe}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    question: { ...editing.question, qe: e.target.value },
                  })
                }
              />
            </label>
            <label className="field hindi-field">
              प्रश्न (Hindi)
              <textarea
                required
                lang="hi"
                value={editing.question.qh}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    question: { ...editing.question, qh: e.target.value },
                  })
                }
              />
            </label>
            <div className="option-editor">
              {editing.question.o.map((option, oi) => (
                <label key={oi}>
                  <input
                    type="radio"
                    name="correct"
                    checked={editing.question.a === oi}
                    onChange={() =>
                      setEditing({
                        ...editing,
                        question: { ...editing.question, a: oi },
                      })
                    }
                  />
                  <input
                    required
                    value={option[0]}
                    placeholder={`Option ${oi + 1} English`}
                    onChange={(e) => {
                      const o = structuredClone(editing.question.o);
                      o[oi][0] = e.target.value;
                      setEditing({
                        ...editing,
                        question: { ...editing.question, o },
                      });
                    }}
                  />
                  <input
                    required
                    lang="hi"
                    value={option[1]}
                    placeholder={`विकल्प ${oi + 1} Hindi`}
                    onChange={(e) => {
                      const o = structuredClone(editing.question.o);
                      o[oi][1] = e.target.value;
                      setEditing({
                        ...editing,
                        question: { ...editing.question, o },
                      });
                    }}
                  />
                </label>
              ))}
            </div>
            <button className="primary-btn">
              Save English + Hindi question
            </button>
          </form>
        </div>
      )}
    </>
  );
}

function Rules({ rules, setRules }) {
  const [message, setMessage] = useState("");
  async function save(event) {
    event.preventDefault();
    await setDoc(doc(db, "config", "rules"), rules);
    setMessage("Process rules saved / प्रक्रिया नियम सेव हो गए।");
  }
  return (
    <>
      <div className="panel-heading">
        <div>
          <h2>Process rules / प्रक्रिया नियम</h2>
          <p>
            These shared values update English and Hindi learning content
            together.
          </p>
        </div>
      </div>
      <LanguageNotice>
        Rule values are common numbers/timings, so the same saved value is
        inserted into both language versions.
      </LanguageNotice>
      <form className="rules-form" onSubmit={save}>
        <label className="field">
          Delivery window / डिलीवरी समय
          <input
            value={rules.delivery}
            onChange={(e) => setRules({ ...rules, delivery: e.target.value })}
          />
          <small>
            Hours shown inside learning content / कंटेंट में दिखाए जाने वाले घंटे
          </small>
        </label>
        <label className="field">
          Happy Call target / हैप्पी कॉल लक्ष्य
          <input
            type="number"
            value={rules.happy}
            onChange={(e) => setRules({ ...rules, happy: e.target.value })}
          />
          <small>Hours after product demo / डेमो के बाद घंटे</small>
        </label>
        <label className="field">
          Pass mark / पास प्रतिशत
          <input
            type="number"
            min="1"
            max="100"
            value={rules.pass}
            onChange={(e) => setRules({ ...rules, pass: e.target.value })}
          />
          <small>Minimum assessment percentage / न्यूनतम परीक्षा प्रतिशत</small>
        </label>
        <label className="field">
          Assessment duration / परीक्षा समय
          <input
            type="number"
            value={rules.timer}
            onChange={(e) => setRules({ ...rules, timer: e.target.value })}
          />
          <small>Time allowed in minutes / उपलब्ध समय (मिनट)</small>
        </label>
        {message && <p className="form-message ok">{message}</p>}
        <button className="primary-btn auto">Save rules / नियम सेव करें</button>
      </form>
    </>
  );
}

function Results({ employees }) {
  const rows = employees.filter((e) => e.result);
  return (
    <>
      <div className="panel-heading">
        <div>
          <h2>Assessment results</h2>
          <p>Scores and attempts across the academy.</p>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Department</th>
              <th>Score</th>
              <th>Result</th>
              <th>Attempts</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((e) => (
                <tr key={e.code}>
                  <td>
                    <b>{e.name}</b>
                    <small className="block">{e.code}</small>
                  </td>
                  <td>{deptName[e.dept]}</td>
                  <td>
                    {e.result.score}/{e.result.total} ({e.result.pct}%)
                  </td>
                  <td>
                    <Status employee={e} />
                  </td>
                  <td>{e.attempts || 1}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="empty">
                  No assessment results yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Hindi({ loadContent }) {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    Promise.all(
      departments.map(async ([id, label]) => {
        const c = await loadContent(id);
        const cards = c.modules.flatMap((m) => m.cards);
        const questions = c.questions || [];
        return {
          id,
          label,
          missingCards: cards.filter((x) => !x.th || !x.bh).length,
          missingQuestions: questions.filter(
            (x) => !x.qh || x.o.some((o) => !o[1]),
          ).length,
        };
      }),
    ).then(setStats);
  }, []);
  if (!stats) return <Loading label="Checking Hindi content…" />;
  return (
    <>
      <div className="panel-heading">
        <div>
          <h2>Hindi completeness</h2>
          <p>Translation coverage by department.</p>
        </div>
      </div>
      <div className="hindi-grid">
        {stats.map((s) => (
          <article key={s.id}>
            <h3>{s.label}</h3>
            <p>
              <span className={s.missingCards ? "warn" : "good"}>
                {s.missingCards}
              </span>{" "}
              cards need Hindi
            </p>
            <p>
              <span className={s.missingQuestions ? "warn" : "good"}>
                {s.missingQuestions}
              </span>{" "}
              questions need Hindi
            </p>
          </article>
        ))}
      </div>
    </>
  );
}
