import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Loading from "./components/Loading";

const EmployeeLogin = lazy(() => import("./pages/EmployeeLogin"));
const EmployeeDashboard = lazy(() => import("./pages/EmployeeDashboard"));
const ModuleReader = lazy(() => import("./pages/ModuleReader"));
const TestPage = lazy(() => import("./pages/TestPage"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const NotFound = lazy(() => import("./pages/NotFound"));

export default function App() {
  return (
    <Suspense fallback={<Loading label="Opening Lotus Academy…" />}><Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<EmployeeLogin />} />
      <Route path="/dashboard" element={<EmployeeDashboard />} />
      <Route path="/learn/:moduleId" element={<ModuleReader />} />
      <Route path="/assessment" element={<TestPage />} />
      <Route path="/admin-signin" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="*" element={<NotFound />} />
    </Routes></Suspense>
  );
}
