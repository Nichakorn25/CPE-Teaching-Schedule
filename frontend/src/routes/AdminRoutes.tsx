// import React from "react";
// import { Navigate, RouteObject } from "react-router-dom";
// import Loadable from "../components/Loadable";
// import AdminLayout from "../layouts/AdminLayout";

// const AdminMailBox = Loadable(lazy(() => import("../pages/adminpage/mailbox")));
// const ArticlePage = Loadable(lazy(() => import("../pages/adminpage/article")));
// const AdminReturn = Loadable(lazy(() => import("../pages/adminpage/return")));
// const AdminPayment = Loadable(lazy(() => import("../pages/adminpage/payment")));

// export const AdminRoutes = (isLoggedIn: boolean): RouteObject => {
//   return {
//     path: "/",
//     element: isLoggedIn ? <AdminLayout /> : <Navigate to="/login" replace />,
//     children: [
//       { path: "mailboxes", element: <AdminMailBox ID={0} /> },
//       { path: "article", element: <ArticlePage /> },
//       { path: "return", element: <AdminReturn /> },
//       { path: "payments", element: <AdminPayment /> },
//     ],
//   };
// };
