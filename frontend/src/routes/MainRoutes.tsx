import { lazy } from "react";
import { RouteObject } from "react-router-dom";
import Loadable from "../components/loading/Loadable";

const LoginPage = Loadable(lazy(() => import("../pages/login/Login")));
const ForgottenPassword = Loadable(lazy(() => import("../pages/forget/Forgotten")));

const MainRoutes = (): RouteObject => {
  return {
    path: "/",
    children: [
      {
        path: "/",
        element: <LoginPage />,
      },

      {
        path: "/forgotten-password", 
        element: <ForgottenPassword />,
      },

      {
        path: "*",
        element: <LoginPage />, 
      },
    ],
  };
};

export default MainRoutes;
