import { useRoutes, RouteObject, Navigate } from "react-router-dom";
import AdminRoutes from "./AdminRoutes";
import MainRoutes from "./MainRoutes";
import InstructorRoutes from "./InstructorRoutes"; 

function ConfigRoutes() {
  const isLoggedIn = localStorage.getItem("isLogin") === "true";
  const role = localStorage.getItem("role") || "";

  let routes: RouteObject[] = [];

  if (isLoggedIn) {
    if (role === "Admin") {
      routes = AdminRoutes(isLoggedIn);
    } else if (role === "Scheduler" || role === "Instructor") {
      routes = InstructorRoutes(isLoggedIn);
    } else {
      routes = [{ path: "*", element: <Navigate to="/login" replace /> }];
    }
  } else {
    routes = [MainRoutes()];
  }

  routes.push({ path: "*", element: <Navigate to="/" replace /> });

  return useRoutes(routes);
}

export default ConfigRoutes;
