import { LoadingOutlined } from "@ant-design/icons";
import React from "react";

const Loader: React.FC = () => (
  <div
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      zIndex: 2000,
      width: "100vw",
      height: "100vh",
      backgroundColor: "rgba(255, 255, 255, 0.7)",
      backdropFilter: "blur(4px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <LoadingOutlined
      style={{
        fontSize: 80,
        color: "#1A1A1A",
      }}
      spin
    />
  </div>
);

export default Loader;
