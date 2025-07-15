import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/login/Login";
import Password from "./pages/forget/FristChangePassword";
// import HomeAdminPage from "./pages/home/HomeAdmin";
import HomeInstructorPage from "./pages/home/HomeInstructor";
import HomeSchedulePage from "./pages/home/HomeSchedulor/Homepage";

import MenuBar from "./components/menu/Menu";

import TeacherList from "./pages/admin/TeacherList/TeacherList";
import AssistanceList from "./pages/admin/AssistanceList/AssistanceList";
import OpenCourse from "./pages/admin/OpenCourse/OpenCourse";
import AllCourse from "./pages/admin/AllCourse/AllCourse";
import ManageTeacher from "./pages/admin/ManageTeacher/ManageTeacher";
import ManageCourse from "./pages/admin/ManageCourse/ManageCourse";
import ManageCesCourse from "./pages/admin/ManageCesCourse/ManageCesCourse";
import ManageAssistance from "./pages/admin/ManageAssistance/ManageAssistance";

import ChangePassword from "./pages/instructor/ChangePassword/ChangePassword";
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


import PrivateRoute from "./PrivateRoute";

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/change-password" element={<Password />} />
        <Route path="/home-schedule" element={<HomeSchedulePage />} />
        <Route element={<MenuBar> </MenuBar>}>
          {/* <Route path="/home-admin" element={<PrivateRoute><HomeAdminPage /></PrivateRoute>} /> */}
          {/* <Route path="/home-admin" element={<HomeAdminPage />} /> */}
          <Route path="/teacher-list" element={<TeacherList />} />
          <Route path="/assistance-list" element={<AssistanceList />} />
          <Route path="/open-course" element={<OpenCourse />} />
          <Route path="/all-course" element={<AllCourse />} />
          <Route path="/manage-teacher" element={<ManageTeacher />} />
          <Route path="/manage-teacher/:id" element={<ManageTeacher />} />
          <Route path="/manage-course" element={<ManageCourse />} />
          <Route path="/manage-cescourse" element={<ManageCesCourse />} />
          <Route path="/manage-assistance" element={<ManageAssistance />} />

          <Route path="/change-password" element={<ChangePassword/>} />
          <Route path="/add-condition" element={<AddCondition/>} />
          <Route path="/add-course" element={<AddCourse/>} />

          <Route path="/home-instructor" element={<PrivateRoute><HomeInstructorPage /></PrivateRoute>} />
        </Route>
        <Route path="/Homepage" element={<Homepage />} />
        <Route path="/Schedulepage" element={<Schedulepage />} />
        <Route path="/OfferedCoursespage" element={<OfferedCoursespage />} />
        <Route path="/Conditionpage" element={<Conditionpage/>} />
        <Route path="/Instructorpage" element={<Instructorpage/>} />
        <Route path="/AllCoursepage" element={<AllCoursepage/>} />
        <Route path="/AddConditionpage" element={<AddConditionpage/>} />
        <Route path="/EditConditionpage" element={<EditConditionpage/>} />
        <Route path="/AddCoursepage" element={<AddCoursepage/>} />
      </Routes>
    </Router>
  );
};

export default App;

// import React from "react";
// import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
//  import Test from "./pages/admin/AllCourse/AllCourse";
// import Test from "./pages/admin/ManageCesCourse/ManageCesCourse";
// import Test from "./pages/admin/ManageCourse/ManageCourse";
// import Test from "./pages/admin/ManageTeacher/ManageTeacher";
// import Test from "./pages/admin/OpenCourse/OpenCourse";
// import Test from "./pages/admin/TeacherList/TeacherList";
////////////////////////////////////////////////////////////////////////////////////
// import Test from "./pages/scheduler/addconditionpage/AddConditionpage";
// import Test from "./pages/scheduler/addcoursepage/AddCoursepage";
// import Test from "./pages/scheduler/allcoursepage/AllCoursepage";
// import Test from "./pages/scheduler/conditionpage/Conditionpage";
// import Test from "./pages/scheduler/homepage/Homepage";
// import Test from "./pages/scheduler/instructorpage/Instructorpage";
// import Test from "./pages/scheduler/offeredcoursepage/OfferedCoursespage";
// import Test from "./pages/scheduler/schedulepage/Schedulepage";

// const App: React.FC = () => {
//   return (
//     <Router>
//       <Routes>
//         <Route path="/" element={<Test />} />
//       </Routes>
//     </Router>
//   );
// };

// export default App;

