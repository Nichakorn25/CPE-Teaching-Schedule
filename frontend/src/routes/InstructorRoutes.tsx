import { lazy } from "react";
import { Navigate, RouteObject } from "react-router-dom";
import Loadable from "../components/loading/Loadable";
import InstructorLayout from "../components/adminlayout/AdminLayout";
// import InstructorLayout from "../layouts/InstructorLayout";

const InstructorPage = Loadable(lazy(() => import("../pages/instructor/InstructorPage")));

const InstructorRoutes = (isLoggedIn: boolean): RouteObject[] => {
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
            element: <InstructorLayout />,
            children: [
                {
                    path: "admin",
                    element: <InstructorPage />,
                },
            ],
        },
    ];
};

export default InstructorRoutes;
