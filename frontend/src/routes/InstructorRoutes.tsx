// import React from "react";
// import { Navigate, RouteObject } from "react-router-dom";
// import Loadable from "../components/Loadable";
// import InstructorLayout from "../layouts/InstructorLayout";

// const InstructorDashboard = Loadable(lazy(() => import("../pages/instructor/dashboard")));
// const InstructorProfile = Loadable(lazy(() => import("../pages/instructor/profile")));

// export const InstructorRoutes = (isLoggedIn: boolean): RouteObject => {
//   return {
//     path: "/",
//     element: isLoggedIn ? <InstructorLayout /> : <Navigate to="/login" replace />,
//     children: [
//       { path: "dashboard", element: <InstructorDashboard /> },
//       { path: "profile", element: <InstructorProfile /> },
//     ],
//   };
// };
