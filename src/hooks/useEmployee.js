import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { parseEmployee } from "../data";

export default function useEmployee() {
  const [state, setState] = useState({ loading: true, employee: null, content: null, rules: {}, error: "" });
  useEffect(() => {
    let live = true;
    (async () => {
      const code = localStorage.getItem("lta-code");
      if (!code) return live && setState({ loading: false, employee: null, content: null, rules: {}, error: "NO_LOGIN" });
      try {
        const [empSnap, ruleSnap] = await Promise.all([getDoc(doc(db, "emps", code)), getDoc(doc(db, "config", "rules"))]);
        if (!empSnap.exists()) throw new Error("Employee code not found.");
        const employee = parseEmployee(code, empSnap.data());
        const contentSnap = await getDoc(doc(db, "content", employee.dept));
        if (!contentSnap.exists()) throw new Error("Training content is not available for your department.");
        const content = JSON.parse(contentSnap.data().json);
        if (live) setState({ loading: false, employee, content, rules: ruleSnap.exists() ? ruleSnap.data() : {}, error: "" });
      } catch (error) { if (live) setState({ loading: false, employee: null, content: null, rules: {}, error: error.message }); }
    })();
    return () => { live = false; };
  }, []);
  return [state, setState];
}
