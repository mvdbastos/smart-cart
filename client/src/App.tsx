import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import Layout from "@/components/Layout";
import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import NewListPage from "@/pages/NewListPage";
import PlanningModePage from "@/pages/PlanningModePage";
import BuyingModePage from "@/pages/BuyingModePage";
import StoresPage from "@/pages/StoresPage";
import ProductsPage from "@/pages/ProductsPage";
import ProfilePage from "@/pages/ProfilePage";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center py-20">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/stores" element={<StoresPage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route
                path="/lists/new"
                element={<ProtectedRoute><NewListPage /></ProtectedRoute>}
              />
              <Route
                path="/lists/:id/plan"
                element={<ProtectedRoute><PlanningModePage /></ProtectedRoute>}
              />
              <Route
                path="/lists/:id/buy"
                element={<ProtectedRoute><BuyingModePage /></ProtectedRoute>}
              />
              <Route
                path="/profile"
                element={<ProtectedRoute><ProfilePage /></ProtectedRoute>}
              />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
