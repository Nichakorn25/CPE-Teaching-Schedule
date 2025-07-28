import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/login/Login";
import ChangePassword from "./pages/login/forget/FirstChangePassword";

import HomeTest from "./pages/home/Dash";

import TeacherList from "./pages/admin/TeacherList/TeacherList";
import AssistanceList from "./pages/admin/AssistanceList/AssistanceList";
import AllCourse from "./pages/admin/AllCourse/AllCourse";
import ManageTeacher from "./pages/admin/ManageTeacher/ManageTeacher";
import ManageCourse from "./pages/admin/ManageCourse/ManageCourse";
import ManageCesCourse from "./pages/admin/ManageCesCourse/ManageCesCourse";
import ManageAssistance from "./pages/admin/ManageAssistance/ManageAssistance";

import AddCondition from "./pages/instructor/AddCondition/AddCondition";
import EditConditionpage from "./pages/scheduler/addconditionpage/EditConditionpage";
import AddCourse from "./pages/instructor/AddCourse/AddCourse";

import Schedulepage from './pages/scheduler/schedulepage/Schedulepage';
import OfferedCoursespage from "./pages/scheduler/offeredcoursepage/OfferedCoursespage";
import AddConditionpage from './pages/scheduler/addconditionpage/AddConditionpage';
import Conditionpage from './pages/scheduler/conditionpage/Conditionpage';
// import OpenCourse from './pages/scheduler/allcoursepage/AllCoursepage';
import AddCoursepage from './pages/scheduler/addcoursepage/AddCoursepage';
// import Instructorpage from './pages/scheduler/instructorpage/Instructorpage';
import Layout from "antd/es/layout/layout";

import MainLayout from "./layout/MainLayout";
import PrivateRoute from "./PrivateRoute";

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/change-password" element={<ChangePassword />} />

        <Route path="/" element={<Layout />}/>
          <Route path="home-dash" element={<MainLayout><HomeTest /></MainLayout>} />

          <Route path="teacher-list" element={<MainLayout><TeacherList /></MainLayout>} />
          <Route path="assistance-list" element={<MainLayout><AssistanceList /></MainLayout>} />
          <Route path="all-course" element={<MainLayout><AllCourse /></MainLayout>} />
          <Route path="manage-teacher" element={<MainLayout><ManageTeacher /></MainLayout>} />
          <Route path="manage-teacher/:id" element={<MainLayout><ManageTeacher /></MainLayout>} />
          <Route path="manage-course" element={<MainLayout><ManageCourse /></MainLayout>} />
          <Route path="manage-course/:id" element={<MainLayout><ManageCourse /></MainLayout>} />
          <Route path="manage-cescourse" element={<MainLayout><ManageCesCourse /></MainLayout>} />
          <Route path="manage-assistance" element={<MainLayout><ManageAssistance /></MainLayout>} />
          <Route path="manage-assistance/:id" element={<MainLayout><ManageAssistance /></MainLayout>} />

          <Route path="add-condition" element={<MainLayout><AddCondition /></MainLayout>} />
          <Route path="add-course" element={<MainLayout><AddCourse /></MainLayout>} />

          <Route path="schedule-page" element={<MainLayout><Schedulepage /></MainLayout>} />
          <Route path="all-open-course" element={<MainLayout><OfferedCoursespage /></MainLayout>} />
          <Route path="condition-page" element={<MainLayout><Conditionpage /></MainLayout>} />
          {/* <Route path="Instructorpage" element={<MainLayout><Instructorpage /></MainLayout>} /> */}
          {/* <Route path="open-course" element={<MainLayout><OpenCourse /></MainLayout>} /> */}
          <Route path="add-condition-page" element={<MainLayout><AddConditionpage /></MainLayout>} />
          <Route path="EditConditionpage" element={<MainLayout><EditConditionpage /></MainLayout>} />
          <Route path="add-open-course" element={<MainLayout><AddCoursepage /></MainLayout>} />
          <Route path="add-open-course/:id" element={<MainLayout><AddCoursepage /></MainLayout>} />
      </Routes>
    </Router>
  );
};

export default App;