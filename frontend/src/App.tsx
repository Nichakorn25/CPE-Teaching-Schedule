import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/login/Login";
import AdminPage from "./pages/admin/AdminPage";
import InstructorPage from "./pages/instructor/InstructorPage";
import Forgot from "./pages/forget/Forgotten";

import PrivateRoute from "./PrivateRoute";  

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/forgot-password" element={<Forgot />} />
        <Route path="/admin" element={<PrivateRoute><AdminPage /></PrivateRoute>} />
        <Route path="/instructor" element={<PrivateRoute><InstructorPage /></PrivateRoute>} />
      </Routes>
    </Router>
  );
};

export default App;
