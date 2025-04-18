// import React from "react";
// import { Navigate, RouteObject } from "react-router-dom";
// import Loadable from "../components/Loadable";
// import SchedulerLayout from "../layouts/SchedulerLayout";

// const ScheduleManager = Loadable(lazy(() => import("../pages/scheduler/schedule")));
// const ReportsPage = Loadable(lazy(() => import("../pages/scheduler/reports")));

// export const SchedulerRoutes = (isLoggedIn: boolean): RouteObject => {
//   return {
//     path: "/",
//     element: isLoggedIn ? <SchedulerLayout /> : <Navigate to="/login" replace />,
//     children: [
//       { path: "schedule", element: <ScheduleManager /> },
//       { path: "reports", element: <ReportsPage /> },
//     ],
//   };
// };
