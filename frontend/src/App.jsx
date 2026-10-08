import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import LandingPage from "./pages/LandingPage";
import AccessControlModule from "./pages/modules/AccessControl";
import FleetModule from "./pages/modules/Fleet";
import BookingModule from "./pages/modules/Booking";
import SupportModule from "./pages/modules/Support";
import PricingModule from "./pages/modules/Pricing";

function RequireAuth({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<Layout />}>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/access-control/*"
          element={
            <RequireAuth>
              <AccessControlModule />
            </RequireAuth>
          }
        />
        <Route
          path="/fleet/*"
          element={
            <RequireAuth>
              <FleetModule />
            </RequireAuth>
          }
        />
        <Route path="/booking/*" element={<BookingModule />} />
        <Route path="/support/*" element={<SupportModule />} />
        <Route path="/pricing/*" element={<PricingModule />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
