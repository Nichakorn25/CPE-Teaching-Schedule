import React from "react";
import { Navigate, Outlet } from "react-router-dom";

const PrivateRoute: React.FC = () => {
  const isLogin = localStorage.getItem("isLogin") === "true";

  return isLogin ? <Outlet /> : <Navigate to="/" />;
};

export default PrivateRoute;
