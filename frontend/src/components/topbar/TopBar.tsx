import React from "react";
import { useNavigate } from "react-router-dom";

function TopBar() {
  const navigate = useNavigate();

  const handleLoginClick = () => {
    navigate("/login");
  };

  return (
    <header className="flex items-center justify-between bg-orange-500 p-4">
      <div className="bg-orange-600 p-2 text-white font-bold">
        <div>SUT</div>
        <div className="text-xs">มหาวิทยาลัยเทคโนโลยีสุรนารี</div>
      </div>
      <button
        onClick={handleLoginClick}
        className="bg-white text-black px-8 py-2 rounded-md shadow-md hover:bg-white hover:text-black text-sm font-medium transition transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-orange-400"
      >
        เข้าสู่ระบบ
      </button>
    </header>
  );
}
export default TopBar;
