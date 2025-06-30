import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/login/Login";
import HomeAdminPage from "./pages/home/HomeAdmin";
import HomeInstructorPage from "./pages/home/HomeInstructor";

import MenuBar from "./components/menu/Menu";
import Footer from "./components/footer/Footer";

import TeacherList from "./pages/admin/TeacherList/TeacherList";
import OpenCourse from "./pages/admin/OpenCourse/OpenCourse";
import AllCourse from "./pages/admin/AllCourse/AllCourse";
import ManageTeacher from "./pages/admin/ManageTeacher/ManageTeacher";
import ManageCourse from "./pages/admin/ManageCourse/ManageCourse";
import ManageCesCourse from "./pages/admin/ManageCesCourse/ManageCesCourse";

import ChangePassword from "./pages/instructor/ChangePassword/ChangePassword";
import AddCondition from "./pages/instructor/AddCondition/AddCondition";
import AddCourse from "./pages/instructor/AddCourse/AddCourse";

import PrivateRoute from "./PrivateRoute";

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route element={<MenuBar> </MenuBar>}>
          {/* <Route path="/home-admin" element={<PrivateRoute><HomeAdminPage /></PrivateRoute>} /> */}
          <Route path="/home-admin" element={<HomeAdminPage />} />
          <Route path="/teacher-list" element={<TeacherList />} />
          <Route path="/open-course" element={<OpenCourse />} />
          <Route path="/all-course" element={<AllCourse />} />
          <Route path="/manage-teacher" element={<ManageTeacher />} />
          <Route path="/manage-course" element={<ManageCourse />} />
          <Route path="/manage-cescourse" element={<ManageCesCourse />} />

          <Route path="/change-password" element={<ChangePassword/>} />
          <Route path="/add-condition" element={<AddCondition/>} />
          <Route path="/add-course" element={<AddCourse/>} />

          <Route path="/home-instructor" element={<PrivateRoute><HomeInstructorPage /></PrivateRoute>} />
        </Route>
      </Routes>
      <Footer />
    </Router>
  );
};

export default App;

