import React from "react";
import { lazy } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Loadable from "./components/loading/Loadable";
import Topbar from "./components/topbar/Topbar";
import Footerbar from "./components/footerbar/Footerbar";

const LoginPage = Loadable(lazy(() => import("./pages/login/Login")));
const ForgottenPassword = Loadable(lazy(() => import("./pages/forget/Forgotten")));

const isLoggedIn = localStorage.getItem("isLogin") === "true";
const role = localStorage.getItem("role");

const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <>
    <Topbar />
    {children}
    <Footerbar />
  </>
);

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Authentication Routes */}
        <Route
          path="/"
          element={
            <PublicLayout>
              <LoginPage />
            </PublicLayout>
          }
        />
        <Route
          path="/login"
          element={
            <PublicLayout>
              <LoginPage />
            </PublicLayout>
          }
        />
        <Route
          path="/forgotten-password"
          element={
            <PublicLayout>
              <ForgottenPassword />
            </PublicLayout>
          }
        />
        {/* Authenticated User Routes */}
        
        {/* Role-based redirects (หลัง login แล้วมีใน LoginPage.tsx อยู่แล้ว) */}
        {/* ส่วนเส้นทางสำหรับ /admin, /scheduler, /instructor อยู่ในส่วน Authenticated Route ของคุณ */}

        {/* Default redirect */}
        <Route path="*" element={<LoginPage />} />
      </Routes>
    </Router>
  );
};

export default App;




