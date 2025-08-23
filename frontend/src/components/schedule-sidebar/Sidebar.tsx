import React, { useState, useEffect, useCallback } from "react";
import { IoMenu, IoClose } from "react-icons/io5";
import { useNavigate, useLocation } from "react-router-dom";
import { MenuItem } from "../../interfaces/Adminpage";
import Header from "../header/Header";

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeItem, setActiveItem] = useState<number>(1);
  const [isOpen, setIsOpen] = useState(true);

  const toggleSidebar = useCallback(() => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);

    // Dispatch custom event to notify Layout component
    window.dispatchEvent(
      new CustomEvent("sidebarToggle", {
        detail: {
          isOpen: newIsOpen,
          width: newIsOpen ? 280 : 60,
        },
      })
    );
  }, [isOpen]);

  // Initial event dispatch
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("sidebarToggle", {
        detail: {
          isOpen: isOpen,
          width: isOpen ? 280 : 60,
        },
      })
    );
  }, []);

  const menuItems: MenuItem[] = [
    {
      id: 1,
      label: "หน้าแรก",
      icon: "📖",
      path: "/home-dash",
      roles: ["Admin", "Scheduler", "Instructor"],
    },
    {
      id: 2,
      label: "ตารางสอน",
      icon: "🧑‍🏫",
      path: "/schedule-page",
      roles: ["Scheduler", "Instructor"],
    },
    {
      id: 3,
      label: "เงื่อนไขการจัดตารางสอน",
      icon: "🧑‍🏫",
      path: "/condition-page",
      roles: ["Scheduler"],
    },
    {
      id: 4,
      label: "เพิ่มเงื่อนไข",
      icon: "🧑‍🏫",
      path: "/add-condition-page",
      roles: ["Scheduler", "Instructor"],
    },
    {
      id: 5,
      label: "เพิ่มวิชาที่ต้องการสอน",
      icon: "🧑‍🏫",
      path: "/add-open-course",
      roles: ["Scheduler", "Instructor"],
    },
    {
      id: 6,
      label: "เพิ่มผู้ช่วยสอน",
      icon: "🧑‍🏫",
      path: "/add-teacher-assistance",
      roles: ["Scheduler"],
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
      path: "/all-open-course",
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
      roles: ["Admin"],
    },
    {
      id: 13,
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
    localStorage.removeItem("email");
    localStorage.removeItem("first_name");
    localStorage.removeItem("first_password");
    localStorage.removeItem("image");
    localStorage.removeItem("isLogin");
    localStorage.removeItem("last_name");
    localStorage.removeItem("major_name");
    localStorage.removeItem("position");
    localStorage.removeItem("role");
    localStorage.removeItem("title");
    localStorage.removeItem("token");
    localStorage.removeItem("token_type");
    localStorage.removeItem("user_id");
    localStorage.removeItem("username");
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

  useEffect(() => {
    const currentItem = menuItems.find(
      (item) => item.path === location.pathname
    );
    if (currentItem) setActiveItem(currentItem.id);
  }, [location.pathname]);

  return (
    <>
      <style>
        {`
          .sidebar-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .sidebar-scrollbar {
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
        `}
      </style>

      <div
        style={{
          width: "100%",
          height: "100vh",
          backgroundColor: "#ffffff",
          borderRight: "1px solid #e0e0e0",
          display: "flex",
          flexDirection: "column",
          boxShadow: "2px 0 8px rgba(0,0,0,0.1)",
          position: "relative",
          zIndex: 1001,
          transition: "all 0.3s ease",
        }}
      >
        {/* Toggle Button */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            padding: "8px",
            borderBottom: "1px solid #f0f0f0",
            minHeight: "56px",
            alignItems: "center",
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
              justifyContent: "center",
              color: "#FF6B35",
              width: "40px",
              height: "40px",
              borderRadius: "8px",
              transition: "background-color 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#f5f5f5";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
            title={isOpen ? "ซ่อน Sidebar" : "แสดง Sidebar"}
          >
            {isOpen ? <IoClose /> : <IoMenu />}
          </button>
        </div>

        {/* Logo */}
        <div
          style={{
            padding: "16px 20px",
            display: "flex",
            justifyContent: isOpen ? "flex-start" : "center",
            borderBottom: "1px solid #f0f0f0",
            minHeight: "80px",
            alignItems: "center",
          }}
        >
          <img
            src="/src/assets/SUT_logo.png"
            alt="SUT Logo"
            style={{
              width: isOpen ? "120px" : "30px",
              height: "auto",
              transition: "width 0.3s ease",
              cursor: "pointer",
            }}
            onClick={() => navigate("/Homepage")}
            title="กลับสู่หน้าแรก"
          />
        </div>

        {/* Menu */}
        <nav
          className="sidebar-scrollbar"
          style={{
            flex: 1,
            padding: "10px 8px",
            overflowY: "auto",
            overflowX: "hidden",
          }}
        >
          {filteredMenuItems.map((item) => (
            <div
              key={item.id}
              onClick={() => handleNavigation(item)}
              style={{
                padding: isOpen ? "12px 16px" : "12px 8px",
                display: "flex",
                alignItems: "center",
                justifyContent: isOpen ? "flex-start" : "center",
                gap: isOpen ? "12px" : "0",
                cursor: "pointer",
                backgroundColor:
                  activeItem === item.id ? "#FF6B35" : "transparent",
                color: activeItem === item.id ? "white" : "#333",
                borderRadius: "6px",
                margin: "2px 0",
                transition: "all 0.2s ease",
                position: "relative",
                overflow: "hidden",
                minHeight: "44px",
              }}
              onMouseEnter={(e) => {
                if (activeItem !== item.id) {
                  e.currentTarget.style.backgroundColor = "#f8f9fa";
                }
              }}
              onMouseLeave={(e) => {
                if (activeItem !== item.id) {
                  e.currentTarget.style.backgroundColor = "transparent";
                }
              }}
              title={!isOpen ? item.label : undefined}
            >
              <span
                style={{
                  fontSize: "18px",
                  minWidth: "24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {item.icon}
              </span>

              {isOpen && (
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: activeItem === item.id ? "500" : "400",
                    whiteSpace: "nowrap",
                    opacity: 1,
                    transition: "opacity 0.3s ease",
                  }}
                >
                  {item.label}
                </span>
              )}

              {/* Active indicator */}
              {activeItem === item.id && (
                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    top: 0,
                    bottom: 0,
                    width: "3px",
                    backgroundColor: "white",
                    borderRadius: "3px 0 0 3px",
                  }}
                />
              )}
            </div>
          ))}
        </nav>

        {/* User Info & Logout */}
        <div
          style={{
            padding: "16px",
            borderTop: "1px solid #f0f0f0",
            backgroundColor: "#fafafa",
          }}
        >

          <button
            onClick={handleLogout}
            style={{
              width: "100%",
              padding: isOpen ? "12px" : "8px",
              backgroundColor: "#6c7a89",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: isOpen ? "14px" : "12px",
              cursor: "pointer",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: isOpen ? "8px" : "0",
              transition: "all 0.2s ease",
              minHeight: "40px",
              marginBottom: "10px",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#5a6c7d")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "#6c7a89")
            }
            title={!isOpen ? "ออกจากระบบ" : undefined}
          >
            <span style={{ fontSize: isOpen ? "16px" : "18px" }}>🚪</span>
            {isOpen && "ออกจากระบบ"}
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
