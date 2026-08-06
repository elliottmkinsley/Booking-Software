import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import EquipmentDetailPage from "./pages/EquipmentDetailPage";
import LabDetailPage from "./pages/LabDetailPage";
import MainMenuPage from "./pages/MainMenuPage";
import ProfilePage from "./pages/ProfilePage";
import SignInPage from "./pages/SignInPage";
import TrainingDetailPage from "./pages/TrainingDetailPage";
import TrainingsPage from "./pages/TrainingsPage";

function RequireAuth() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  return <Outlet />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<SignInPage />} />
      <Route element={<RequireAuth />}>
        <Route path="/labs" element={<MainMenuPage />} />
        <Route path="/labs/:labId" element={<LabDetailPage />} />
        <Route path="/equipment/:equipmentId" element={<EquipmentDetailPage />} />
        <Route path="/trainings" element={<TrainingsPage />} />
        <Route path="/trainings/:trainingId" element={<TrainingDetailPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
