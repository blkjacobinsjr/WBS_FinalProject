import { ClerkProvider, SignedIn, SignedOut } from "@clerk/clerk-react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import { Toaster } from "sonner";
import DataProvider from "./contexts/dataContext";
import ApiTest from "./pages/ApiTest";
import Dashboard from "./pages/Dashboard";
import ErrorPage from "./pages/ErrorPage";
import Homepage from "./pages/Homepage";
import LegalPage from "./pages/LegalPage";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

// access our key
const publishableKey = import.meta.env.VITE_REACT_APP_CLERK_PUBLISHABLE_KEY;

// If we cannot read our key, we need to exit
if (!publishableKey) {
  throw new Error("Unable to access Publishable Key.");
}

// Our app has to be wrapped in a Clerk provider that will take also care
// of routing
function ClerkRouteProvider() {
  const navigate = useNavigate();

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      appearance={{
        elements: {
          formButtonPrimary: "bg-sky-500 text-white shadow-lg hover:bg-sky-700",
        },
      }}
      navigate={(to) => navigate(to)}
    >
      <Routes>
        <Route
          path="/"
          element={
            <>
              <SignedIn>
                <Navigate to="/dashboard" />
              </SignedIn>
              <SignedOut>
                <Homepage />
              </SignedOut>
            </>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/terms" element={<LegalPage pageKey="terms" />} />
        <Route
          path="/terms-and-conditions"
          element={<LegalPage pageKey="terms" />}
        />
        <Route path="/privacy" element={<LegalPage pageKey="privacy" />} />
        <Route
          path="/privacy-policy"
          element={<LegalPage pageKey="privacy" />}
        />
        <Route path="/refund" element={<LegalPage pageKey="refund" />} />
        <Route
          path="/refund-policy"
          element={<LegalPage pageKey="refund" />}
        />
        <Route
          path="/dashboard"
          element={
            <>
              <SignedIn>
                <DataProvider>
                  <Dashboard />
                </DataProvider>
              </SignedIn>
              <SignedOut>
                <Navigate to="/" />
              </SignedOut>
            </>
          }
        />

        {/* Route used for category links in sidebar */}
        <Route
          path="/dashboard/:pageId"
          element={
            <>
              <SignedIn>
                <DataProvider>
                  <Dashboard />
                </DataProvider>
              </SignedIn>
              <SignedOut>
                <Navigate to="/" />
              </SignedOut>
            </>
          }
        />

        {/* Needs to be the last one! */}
        <Route path="*" element={<ErrorPage />} />
      </Routes>
      <Toaster
        richColors
        position="top-center"
        toastOptions={{ duration: 2400 }}
      />
    </ClerkProvider>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ClerkRouteProvider />
    </BrowserRouter>
  );
}

export default App;
