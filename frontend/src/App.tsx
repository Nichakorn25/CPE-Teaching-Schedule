import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/prelogin/PreLogin";
import LoginPage from "./pages/login/Login";
import HomeAdminPage from "./pages/home/HomeAdmin";
import HomeInstructorPage from "./pages/home/HomeInstructor";
import Forgot from "./pages/forget/Forgotten";

import MenuBar from "./components/menu/Menu";
import Footer from "./components/footer/Footer";

import TeacherList from "./pages/admin/TeacherList/TeacherList";

import PrivateRoute from "./PrivateRoute";

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<Forgot />} />
        <Route element={<MenuBar> </MenuBar>}>
          {/* <Route path="/home-admin" element={<PrivateRoute><HomeAdminPage /></PrivateRoute>} /> */}
          <Route path="/home-admin" element={<HomeAdminPage />} />
          <Route path="/teacher-list" element={<TeacherList />} />
          <Route path="/home-instructor" element={<PrivateRoute><HomeInstructorPage /></PrivateRoute>} />
        </Route>
      </Routes>
      <Footer />
    </Router>
  );
};

export default App;

