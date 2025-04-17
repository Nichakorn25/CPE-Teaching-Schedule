import React from "react";
import { lazy } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Loadable from "./components/loading/Loadable";
import Topbar from "./components/topbar/Topbar";
import Footerbar from "./components/footerbar/Footerbar";

const LoginPage = Loadable(lazy(() => import("./pages/login/Login")));
const ForgottenPassword = Loadable(lazy(() => import("./pages/forget/Forgotten")));

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <>
              <Topbar />
              <LoginPage />
              <Footerbar /> 
            </>
          }
        />
        <Route
          path="/login"
          element={
            <>
              <Topbar />
              <LoginPage />
              <Footerbar />
            </>
          }
        />
        <Route
          path="/forgotten-password"
          element={
            <>
              <Topbar />
              <ForgottenPassword />
              <Footerbar />
            </>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;

