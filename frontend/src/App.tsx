import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/login/Login";
import Password from "./pages/forget/FristChangePassword";

import HomeAdminPage from "./pages//home/HomeAdmin/HomeAdmin";
import HomeInstructorPage from "./pages/home/HomeInstructor/HomeInstructor";
import HomeSchedulePage from "./pages/home/HomeSchedulor/Homepage";
import Test from "./pages/home/Dash";
/////////////////////////////////////////////
import Sidebar from "./components/schedule-sidebar/Sidebar";

import TeacherList from "./pages/admin/TeacherList/TeacherList";
import AssistanceList from "./pages/admin/AssistanceList/AssistanceList";
import OpenCourse from "./pages/admin/OpenCourse/OpenCourse";
import AllCourse from "./pages/admin/AllCourse/AllCourse";
import ManageTeacher from "./pages/admin/ManageTeacher/ManageTeacher";
import ManageCourse from "./pages/admin/ManageCourse/ManageCourse";
import ManageCesCourse from "./pages/admin/ManageCesCourse/ManageCesCourse";
import ManageAssistance from "./pages/admin/ManageAssistance/ManageAssistance";

// import ChangePassword from "./pages/instructor/ChangePassword/ChangePassword";
import AddCondition from "./pages/instructor/AddCondition/AddCondition";
import EditConditionpage from "./pages/scheduler/addconditionpage/EditConditionpage";
import AddCourse from "./pages/instructor/AddCourse/AddCourse";

import Homepage from "./pages/home/HomeSchedulor/Homepage";
import Schedulepage from './pages/scheduler/schedulepage/Schedulepage';
import OfferedCoursespage from "./pages/scheduler/offeredcoursepage/OfferedCoursespage";
import AddConditionpage from './pages/scheduler/addconditionpage/AddConditionpage';
import Conditionpage from './pages/scheduler/conditionpage/Conditionpage';
import AllCoursepage from './pages/scheduler/allcoursepage/AllCoursepage';
import AddCoursepage from './pages/scheduler/addcoursepage/AddCoursepage';
import Instructorpage from './pages/scheduler/instructorpage/Instructorpage';
import Layout from "antd/es/layout/layout";

import MainLayout from "./layout/MainLayout";
import PrivateRoute from "./PrivateRoute";

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Routes without Layout (Login, etc.) */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/change-password" element={<Password />} />
        
        <Route path="/" element={<Layout />}/>
          <Route path="home-test" element={<Test />} />
          
          {/* <Route path="home-schedule" element={<HomeSchedulePage />} />
          <Route path="home-instructor" element={<HomeInstructorPage />} />
          <Route path="home-admin" element={<HomeAdminPage />} /> */}
        {/* Routes with MainLayout */}
        {/* <Route path="/home-schedule" element={<MainLayout><HomeSchedulePage /></MainLayout>} /> */}
        <Route path="/teacher-list" element={<MainLayout><TeacherList /></MainLayout>} />
        <Route path="/assistance-list" element={<MainLayout><AssistanceList /></MainLayout>} />
        <Route path="/open-course" element={<MainLayout><OpenCourse /></MainLayout>} />
        <Route path="/all-course" element={<MainLayout><AllCourse /></MainLayout>} />
        <Route path="/manage-teacher" element={<MainLayout><ManageTeacher /></MainLayout>} />
        <Route path="/manage-teacher/:id" element={<MainLayout><ManageTeacher /></MainLayout>} />
        <Route path="/manage-course" element={<MainLayout><ManageCourse /></MainLayout>} />
        <Route path="/manage-course/:id" element={<MainLayout><ManageCourse /></MainLayout>} />
        <Route path="/manage-cescourse" element={<MainLayout><ManageCesCourse /></MainLayout>} />
        <Route path="/manage-assistance" element={<MainLayout><ManageAssistance /></MainLayout>} />
        <Route path="/manage-assistance/:id" element={<MainLayout><ManageAssistance /></MainLayout>} />

        {/* <Route path="/change-password-instructor" element={<MainLayout><ChangePassword /></MainLayout>} /> */}
        <Route path="/add-condition" element={<MainLayout><AddCondition /></MainLayout>} />
        <Route path="/add-course" element={<MainLayout><AddCourse /></MainLayout>} />

        {/* <Route path="/home-instructor" element={
          <MainLayout>
            <PrivateRoute><HomeInstructorPage /></PrivateRoute>
          </MainLayout>
        } /> */}

        {/* <Route path="/Homepage" element={<MainLayout><Homepage /></MainLayout>} /> */}
        <Route path="/Schedulepage" element={<MainLayout><Schedulepage /></MainLayout>} />
        <Route path="/OfferedCoursespage" element={<MainLayout><OfferedCoursespage /></MainLayout>} />
        <Route path="/Conditionpage" element={<MainLayout><Conditionpage /></MainLayout>} />
        <Route path="/Instructorpage" element={<MainLayout><Instructorpage /></MainLayout>} />
        <Route path="/AllCoursepage" element={<MainLayout><AllCoursepage /></MainLayout>} />
        <Route path="/AddConditionpage" element={<MainLayout><AddConditionpage /></MainLayout>} />
        <Route path="/EditConditionpage" element={<MainLayout><EditConditionpage /></MainLayout>} />
        <Route path="/AddCoursepage" element={<MainLayout><AddCoursepage /></MainLayout>} />
      </Routes>
    </Router>
  );
};

export default App;