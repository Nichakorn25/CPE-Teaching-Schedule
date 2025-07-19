import React, { useState, useEffect } from "react";
import { IoMenu, IoClose } from "react-icons/io5";
import { useNavigate, useLocation } from "react-router-dom";
import { MenuItem } from "../../interfaces/Adminpage";
import Header from "../header/Header";

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeItem, setActiveItem] = useState<number>(1);
  const [isOpen, setIsOpen] = useState(true);

  const toggleSidebar = () => setIsOpen(!isOpen);

  useEffect(() => {
    updateBodyMargin(isOpen);
  }, []);

  useEffect(() => {
    updateBodyMargin(isOpen);
  }, [isOpen]);

  const updateBodyMargin = (open: boolean) => {
    const margin = open ? 324 : 84; // 300 หรือ 60 + 24px ช่องว่าง
    document.body.style.marginLeft = `${margin}px`;
  };

  const menuItems: MenuItem[] = [
    {
      id: 1,
      label: "หน้าแรก",
      icon: "📖",
      path: "/Homepage",
      roles: ["Admin", "Scheduler", "Instructor"],
    },
    {
      id: 2,
      label: "ตารางสอน",
      icon: "🧑‍🏫",
      path: "/Schedulepage",
      roles: ["Scheduler", "Instructor"],
    },
    {
      id: 3,
      label: "ประวัติการจัดตารางสอน",
      icon: "🧑‍🏫",
      path: "/history-schedule",
      roles: ["Scheduler"],
    },
    {
      id: 4,
      label: "เงื่อนไขการจัดตารางสอน",
      icon: "🧑‍🏫",
      path: "/Conditionpage",
      roles: ["Scheduler"],
    },
    {
      id: 5,
      label: "เพิ่มเงื่อนไข",
      icon: "🧑‍🏫",
      path: "/AddConditionpage",
      roles: ["Scheduler", "Instructor"],
    },
    {
      id: 6,
      label: "เพิ่มวิชาที่ต้องการสอน",
      icon: "🧑‍🏫",
      path: "/AddCoursepage",
      roles: ["Scheduler", "Instructor"],
    },
    {
      id: 7,
      label: "รายชื่ออาจารย์",
      icon: "🧑‍🏫",
      path: "/teacher-list",
      roles: ["Admin", "Scheduler"],
    },
    {
      id: 8,
      label: "รายชื่อผู้ช่วยสอน",
      icon: "🧑‍🏫",
      path: "/assistance-list",
      roles: ["Admin", "Scheduler"],
    },
    {
      id: 9,
      label: "รายวิชาที่เปิดสอน",
      icon: "📋",
      path: "/open-course",
      roles: ["Admin", "Scheduler", "Instructor"],
    },
    {
      id: 10,
      label: "รายวิชาทั้งหมด",
      icon: "📚",
      path: "/all-course",
      roles: ["Admin", "Scheduler"],
    },
    {
      id: 11,
      label: "จัดการรายชื่ออาจารย์",
      icon: "🛠️",
      path: "/manage-teacher",
      roles: ["Admin"],
    },
    {
      id: 12,
      label: "จัดการรายชื่อผู้ช่วยสอน",
      icon: "🛠️",
      path: "/manage-assistance",
      roles: ["Admin"],
    },
    {
      id: 13,
      label: "จัดการรายวิชา",
      icon: "🖊️",
      path: "/manage-course",
      roles: ["Admin", "Scheduler"],
    },
    {
      id: 14,
      label: "จัดการวิชาจากศูนย์บริการ",
      icon: "🖋️",
      path: "/manage-cescourse",
      roles: ["Admin"],
    },
  ];

  const role = localStorage.getItem("role"); // ได้ค่ามาเป็น string | null

  const filteredMenuItems: MenuItem[] = menuItems.filter((item) =>
    role ? item.roles.includes(role) : false
  );

  const handleLogout = () => {
    localStorage.clear();
    navigate("/"); 
    window.location.reload;
  };

  useEffect(() => {
    const currentItem = menuItems.find(
      (item) => item.path === location.pathname
    );
    if (currentItem) setActiveItem(currentItem.id);
  }, [location.pathname]);

  const handleNavigation = (item: MenuItem) => {
    setActiveItem(item.id);
    navigate(item.path);
  };

  return (
    <>
      <style>
        {`
      nav::-webkit-scrollbar {
        display: none;
      }
      nav {
        scrollbar-width: none; /* Firefox */
        -ms-overflow-style: none; /* IE 10+ */
      }
    `}
      </style>

      <Header />
      <div
        style={{
          width: isOpen ? "280px" : "60px",
          height: "100vh",
          backgroundColor: "#ffffff",
          borderRight: "1px solid #e0e0e0",
          position: "fixed",
          left: 0,
          top: 0,
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          transition: "width 0.3s ease",
          // marginRight: 10,
        }}
      >
        {/* Toggle Button */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            padding: "8px",
          }}
        >
          <button
            onClick={toggleSidebar}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "24px",
              display: "flex",
              alignItems: "center",
              justifyContent: isOpen ? "flex-start" : "center",
              color: "#FF6B35",
              width: "40px",
              height: "40px",
            }}
          >
            {isOpen ? <IoClose /> : <IoMenu />}
          </button>
        </div>

        {/* Logo */}
        <div
          style={{
            marginLeft: "20px",
            display: "flex",
            justifyContent: "flex-start",
          }}
        >
          <img
            src="/src/assets/SUT_logo.png"
            alt="SUT Logo"
            style={{
              width: isOpen ? "120px" : "30px",
              height: "auto",
              transition: "width 0.3s ease",
            }}
          />
        </div>

        {/* Menu */}
        <nav
          style={{
            flex: 1,
            paddingTop: "10px",
            overflowY: "auto",
          }}
        >
          {filteredMenuItems.map((item) => (
            <div
              key={item.id}
              onClick={() => handleNavigation(item)}
              style={{
                padding: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: isOpen ? "flex-start" : "center",
                gap: "12px",
                cursor: "pointer",
                backgroundColor:
                  activeItem === item.id ? "#FF6B35" : "transparent",
                color: activeItem === item.id ? "white" : "#333",
                borderRadius: "4px",
                margin: "4px 8px",
                transition: "all 0.2s ease",
              }}
            >
              <span style={{ fontSize: "18px", minWidth: "24px" }}>
                {item.icon}
              </span>
              {isOpen && (
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: activeItem === item.id ? "500" : "400",
                  }}
                >
                  {item.label}
                </span>
              )}
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div style={{ padding: "20px" }}>
          <button
            style={{
              width: "100%",
              padding: "12px",
              backgroundColor: "#6c7a89",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              cursor: "pointer",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "8px",
            }}
            onClick={handleLogout}
            onMouseEnter={(e) =>(e.currentTarget.style.backgroundColor = "#5a6c7d")}
            onMouseLeave={(e) =>(e.currentTarget.style.backgroundColor = "#6c7a89")}
          >
            <span>🚪</span>
            {isOpen && "ออกจากระบบ"}
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
