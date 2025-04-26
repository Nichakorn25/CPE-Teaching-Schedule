import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/prelogin/PreLogin";
import LoginPage from "./pages/login/Login";
import AdminPage from "./pages/admin/AdminPage";
import InstructorPage from "./pages/instructor/InstructorPage";
import Forgot from "./pages/forget/Forgotten";

import Footer from "./components/footer/Footer";

import PrivateRoute from "./PrivateRoute";  

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<Forgot />} />
        <Route path="/admin" element={<PrivateRoute><AdminPage /></PrivateRoute>} />
        <Route path="/instructor" element={<PrivateRoute><InstructorPage /></PrivateRoute>} />
      </Routes>
      <Footer />
    </Router>
  );
};

export default App;

