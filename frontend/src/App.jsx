import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./components/AppShell.jsx";
import ClassLayout from "./components/ClassLayout.jsx";
import RequireAuth from "./components/RequireAuth.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import WelcomePage from "./pages/WelcomePage.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import ClassesPage from "./pages/ClassesPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import LiveAttendance from "./pages/class/LiveAttendance.jsx";
import UploadAttendance from "./pages/class/UploadAttendance.jsx";
import StudentsPage from "./pages/class/StudentsPage.jsx";
import RecordsPage from "./pages/class/RecordsPage.jsx";
import ReportsPage from "./pages/class/ReportsPage.jsx";

function PublicOnly({ children }) {
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicOnly>
            <Login />
          </PublicOnly>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnly>
            <Register />
          </PublicOnly>
        }
      />
      <Route
        path="/welcome"
        element={
          <PublicOnly>
            <WelcomePage />
          </PublicOnly>
        }
      />
      <Route
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="classes" element={<ClassesPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="classes/:classId" element={<ClassLayout />}>
          <Route index element={<Navigate to="live" replace />} />
          <Route path="live" element={<LiveAttendance />} />
          <Route path="upload" element={<UploadAttendance />} />
          <Route path="students" element={<StudentsPage />} />
          <Route path="records" element={<RecordsPage />} />
          <Route path="reports" element={<ReportsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
