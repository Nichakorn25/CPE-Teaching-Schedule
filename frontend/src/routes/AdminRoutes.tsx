// import { lazy } from "react";
// import { Route, Navigate } from "react-router-dom";
// import Loadable from "../components/loading/Loadable";
// import AdminLayout from "../components/adminlayout/AdminLayout";

// const AdminPage = Loadable(lazy(() => import("../pages/admin/AdminPage")));

// const AdminRoutes = (isLoggedIn: boolean) => {
//   return isLoggedIn ? (
//     <Route path="/">
//       <Route element={<AdminLayout />}>
//         <Route path="admin" element={<AdminPage />} />
//       </Route>
//     </Route>
//   ) : (
//     <Navigate to="/login" replace />
//   );
// };

// export default AdminRoutes;

import { lazy } from "react";
import { RouteObject, Navigate } from "react-router-dom";
import Loadable from "../components/loading/Loadable";
import AdminLayout from "../components/adminlayout/AdminLayout";

const AdminPage = Loadable(lazy(() => import("../pages/admin/AdminPage")));

const AdminRoutes = (isLoggedIn: boolean): RouteObject[] => {
  if (!isLoggedIn) {
    return [
      {
        path: "*",
        element: <Navigate to="/login" replace />,
      },
    ];
  }

  return [
    {
      path: "/",
      element: <AdminLayout />,
      children: [
        {
          path: "admin",
          element: <AdminPage />,
        },
      ],
    },
  ];
};

export default AdminRoutes;
