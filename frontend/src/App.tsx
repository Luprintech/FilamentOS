import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { CurrencyProvider } from '@/context/currency-context';
import { ErrorBoundary } from '@/components/error-boundary';
import { QueryProvider } from '@/components/query-provider';
import { CookieBanner } from '@/components/cookie-banner';
import { ChatBotBobina } from '@/components/chatbot-bobina';
import { IosInstallBanner } from '@/components/ios-install-banner';
import { useCookieConsent } from '@/hooks/use-cookie-consent';
import { AppLayout } from '@/components/app-layout';
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/components/login-page';
import { CalculadoraPage } from '@/pages/CalculadoraPage';
import { CalculadoraPdfPage } from '@/pages/CalculadoraPdfPage';
import { EstadisticasPage } from '@/pages/EstadisticasPage';
import { InventarioPage } from '@/pages/InventarioPage';
import { ProyectosPage } from '@/pages/ProyectosPage';
import { BitacoraLayout } from '@/pages/bitacora/BitacoraLayout';
import { BitacoraManagerPage } from '@/pages/bitacora/BitacoraManagerPage';
import { ProjectDetailPage } from '@/pages/bitacora/ProjectDetailPage';
import { NuevaPiezaPage } from '@/pages/bitacora/NuevaPiezaPage';
import { PiezasPage } from '@/pages/bitacora/PiezasPage';
import { BitacoraPdfPage } from '@/pages/bitacora/BitacoraPdfPage';
import { RecursosPage } from '@/pages/RecursosPage';
import { LupePage } from '@/pages/LupePage';

// ── Loading spinner ───────────────────────────────────────────────────────────
function FullPageLoader() {
  return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}

// ── Ruta raíz: landing o app ──────────────────────────────────────────────────
function RootRoute() {
  const { isAuthenticated, isGuest, isLoading } = useAuth();
  if (isLoading) return <FullPageLoader />;
  if (isAuthenticated || isGuest) return <Navigate to="/calculadora" replace />;
  return <HomePage />;
}

// ── Ruta protegida ────────────────────────────────────────────────────────────
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isGuest, isLoading } = useAuth();
  if (isLoading) return <FullPageLoader />;
  if (!isAuthenticated && !isGuest) return <Navigate to="/" replace />;
  return <>{children}</>;
}

// ── Routing ───────────────────────────────────────────────────────────────────
function AppRoutes() {
  const { accepted, accept } = useCookieConsent();

  return (
    <>
      <Routes>
        <Route path="/" element={<RootRoute />} />

        {/* Login page — accesible sin autenticación */}
        <Route path="/login" element={<LoginPage />} />

        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/calculadora"  element={<CalculadoraPage />} />
          <Route path="/calculadora/pdf" element={<CalculadoraPdfPage />} />
          <Route path="/proyectos"    element={<ProyectosPage />} />
          <Route path="/bitacora"     element={<BitacoraLayout />}>
            <Route index               element={<BitacoraManagerPage />} />
            <Route path=":projectId"             element={<ProjectDetailPage />} />
            <Route path=":projectId/piezas"      element={<PiezasPage />} />
            <Route path=":projectId/nueva-pieza" element={<NuevaPiezaPage />} />
            <Route path=":projectId/pdf"         element={<BitacoraPdfPage />} />
          </Route>
          <Route path="/estadisticas" element={<EstadisticasPage />} />
          <Route path="/inventario"   element={<InventarioPage />} />
          <Route path="/recursos"     element={<RecursosPage />} />
        </Route>

        {/* Panel privado — fuera del AppLayout y del ProtectedRoute */}
        <Route path="/lupe" element={<LupePage />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {!accepted && <CookieBanner onAccept={accept} />}
      <ChatBotBobina />
      <IosInstallBanner />
    </>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <ErrorBoundary>
        <QueryProvider>
          <CurrencyProvider>
            <BrowserRouter>
              <AuthProvider>
                <AppRoutes />
                <Toaster />
              </AuthProvider>
            </BrowserRouter>
          </CurrencyProvider>
        </QueryProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}
