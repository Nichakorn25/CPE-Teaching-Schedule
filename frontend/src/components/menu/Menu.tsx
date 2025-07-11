import { AiOutlineMenu, AiOutlineClose, AiOutlineLogout } from "react-icons/ai";
import React, { useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import Header from "../header/Header";

type MenuItem = {
  label: string;
  icon: string;
  path?: string;
  roles: string[];
};

const menuItems = [
  { label: "หน้าแรก", icon: "📖", roles: ["Admin", "Scheduler", "Instructor"] },
  { label: "ตารางสอน", icon: "🧑‍🏫", roles: ["Scheduler", "Instructor"] },
  { label: "ประวัติการจัดตารางสอน", icon: "🧑‍🏫", roles: ["Scheduler"] },
  { label: "เงื่อนไขการจัดตารางสอน", icon: "🧑‍🏫", roles: ["Scheduler"] },
  { label: "เพิ่มเงื่อนไข", icon: "🧑‍🏫",path:"/add-condition", roles: ["Scheduler", "Instructor"] },
  {
    label: "เพิ่มวิชาที่ต้องการสอน",
    icon: "🧑‍🏫",path:"/add-course",
    roles: ["Scheduler", "Instructor"],
  },
  {
    label: "รายชื่ออาจารย์",
    icon: "🧑‍🏫",
    path: "/teacher-list",
    roles: ["Admin", "Scheduler"],
  },
  {
    label: "รายวิชาที่เปิดสอน",
    icon: "📋",
    path: "/open-course",
    roles: ["Admin", "Scheduler", "Instructor"],
  },
  {
    label: "รายวิชาทั้งหมด",
    icon: "📚",
    path: "/all-course",
    roles: ["Admin", "Scheduler"],
  },
  {
    label: "จัดการรายชื่ออาจารย์",
    icon: "🛠️",
    path: "/manage-teacher",
    roles: ["Admin"],
  },
  {
    label: "จัดการรายชื่อผู้ช่วยสอน",
    icon: "🛠️",
    path: "/manage-assistance",
    roles: ["Admin"],
  },
  { label: "จัดการรายวิชา", icon: "🖊️",path:"/manage-course", roles: ["Admin", "Scheduler"] },
  {
    label: "จัดการวิชาจากศูนย์บริการ",
    icon: "🖋️", path:"/manage-cescourse",
    roles: ["Admin", "Scheduler"],
  },
];

const LayoutMenu: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(true);
  // const role = localStorage.getItem("role");
  const first_name = localStorage.getItem("first_name");
  const last_name = localStorage.getItem("last_name");
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    setTimeout(() => {
      navigate("/");
    }, 1000);
  };

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <div className="flex h-screen font-sarabun">
      <Header/>
      {/* Sidebar */}
      <div
        className={`bg-white-500 z-50 text-orange transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen ? "w-64" : "w-16"
        }`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-orange-200">
          {isOpen && (
            <div className="font-bold text-lg text-orange-500">SUT</div>
          )}
          <button
            onClick={toggleMenu}
            className={`text-orange focus:outline-none text-3xl ${
              !isOpen ? "ml-auto" : ""
            }`}
          >
            {isOpen ? <AiOutlineClose /> : <AiOutlineMenu />}
          </button>
        </div>

        <nav className="flex flex-col gap-1 p-2 mt-4">
          {menuItems
            // .filter(item => role && item.roles.includes(role))
            .map((item, index) => (
              // <a
              //   key={index}
              //   onClick={() => navigate(item.path)}
              //   className="text-[#5d7285] flex items-center gap-3 hover:bg-orange-600 p-2 rounded"
              // >
              //   {item.icon}
              //   {isOpen && <span>{item.label}</span>}
              // </a>

              <a
                key={index}
                onClick={() => {
                  if (item.path) {
                    navigate(item.path);
                  }
                }}
                className="cursor-pointer text-[#5d7285] flex items-center gap-3 hover:bg-orange-600 p-2 rounded"
              >
                {item.icon}
                {isOpen && <span>{item.label}</span>}
              </a>
            ))}

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-[#5d7285] text-white rounded px-4 py-2 hover:bg-[#4a5d70] active:bg-[#3a4a58] transition-colors duration-300 mt-10"
          >
            <AiOutlineLogout size={20} />
            {isOpen && <span>ออกจากระบบ</span>}
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-gray-100">
        {/* <header className="flex justify-end items-center gap-6 p-3 bg-white shadow">
          <div className="font-bold text-gray-700">
            {first_name} {last_name}
          </div>
        </header> */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default LayoutMenu;
