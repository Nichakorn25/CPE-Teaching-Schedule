import React from "react";
import { Navigate } from "react-router-dom";

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const isLogin = localStorage.getItem("isLogin") === "true";
  
  return isLogin ? <>{children}</> : <Navigate to="/" />;
};

export default PrivateRoute;