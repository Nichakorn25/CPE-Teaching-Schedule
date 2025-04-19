// import React from "react";
// import { lazy } from "react";
// import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// // componant
// import Loadable from "./components/loading/Loadable";
// import Topbar from "./components/topbar/Topbar";
// import Footerbar from "./components/footerbar/Footerbar";
// import LayoutMenu from "./components/menubar/Layout";
// //page
// import InstructorPage from "./pages/instructor/InstructorPage";
// // Route
// import AdminRoutes from "./routes/AdminRoutes"
// import PrivateRoute from "./PrivateRoute";

// const LoginPage = Loadable(lazy(() => import("./pages/login/Login")));
// const ForgottenPassword = Loadable(lazy(() => import("./pages/forget/Forgotten")));

// const isLoggedIn = localStorage.getItem("isLogin") === "true";
// const role = localStorage.getItem("role");

// const App: React.FC = () => {
//   return (
//     <Router>
//       <Routes>
//         {/* เส้นทางหลักทุกผู้ใช้งาน */}
//         <Route
//           path="/"
//           element={
//             <>
//               <Topbar />
//               <LoginPage />
//               <Footerbar />
//             </>
//           }
//         />
//         <Route
//           path="/login"
//           element={
//             <>
//               <Topbar />
//               <LoginPage />
//               <Footerbar />
//             </>
//           }
//         />
//         <Route
//           path="/forgotten-password"
//           element={
//             <>
//               <Topbar />
//               <ForgottenPassword />
//               <Footerbar />
//             </>
//           }
//         />
//         {/* ล็อกอินเข้าใช้งานปกติ อาจารย์ผู้สอน สำหรับผู้จัดตารางสอนจะแก้ menu ให้มองเห็นต่างจากผู้สอนธรรมดา */}
//         <Route element={<LayoutMenu />}>
//           <Route path="/instructor" element={<PrivateRoute><InstructorPage /></PrivateRoute>} />
//         </Route>
//         {/* ไปยังเส้นทางสำหรับ Admin Route */}
//         {isLoggedIn && role === "Admin" && AdminRoutes(isLoggedIn)}
//         <Route path="*" element={<LoginPage />} />
//       </Routes>
//     </Router>
//   );
// };

// export default App;

import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import ConfigRoutes from "./routes";

const App: React.FC = () => {
  return (
    <Router>
      <ConfigRoutes />
    </Router>
  );
};

export default App;


