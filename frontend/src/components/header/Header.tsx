import React from "react";
import { FaUserCircle } from "react-icons/fa";
// import Sidebar from "../schedule-sidebar/Sidebar";

const Header: React.FC = () => {
  const first_name = localStorage.getItem("first_name") || "ชื่อ";
  const last_name = localStorage.getItem("last_name") || "นามสกุล";

  return (
    <header className="fixed top-0 left-0 w-full z-40 pl-64 pr-10 py-4 flex items-center bg-white shadow">
  <div className="ml-auto flex items-center gap-3 mr-2">
    <span className="text-[#5d7285] font-medium text-sm">
      {first_name} {last_name}
    </span>
    <FaUserCircle size={28} className="text-[#5d7285]" />
  </div>
</header>

  );
};

export default Header;
