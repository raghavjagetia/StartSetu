import { Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import DepartmentDashboard from "./pages/department/DepartmentDashboard.jsx";
import ChallengeDetail from "./pages/department/ChallengeDetail.jsx";
import StartupDashboard from "./pages/startup/StartupDashboard.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import Templates from "./pages/admin/Templates.jsx";
import PilotDetail from "./pages/shared/PilotDetail.jsx";

export default function App() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/department"
          element={
            <ProtectedRoute roles={["department"]}>
              <DepartmentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/department/challenges/:id"
          element={
            <ProtectedRoute roles={["department"]}>
              <ChallengeDetail />
            </ProtectedRoute>
          }
        />

        <Route
          path="/startup"
          element={
            <ProtectedRoute roles={["startup"]}>
              <StartupDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/templates"
          element={
            <ProtectedRoute roles={["admin"]}>
              <Templates />
            </ProtectedRoute>
          }
        />

        <Route
          path="/pilots/:id"
          element={
            <ProtectedRoute roles={["department", "startup", "admin"]}>
              <PilotDetail />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}
