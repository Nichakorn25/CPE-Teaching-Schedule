// import React, { useState, useEffect } from "react";
// import { IoMenu, IoClose } from "react-icons/io5";
// import { useNavigate, useLocation } from "react-router-dom";
// import { MenuItem } from "../../interfaces/Adminpage";
// import Header from "../header/Header";

// const Sidebar: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const [activeItem, setActiveItem] = useState<number>(1);
//   const [isOpen, setIsOpen] = useState(true);
//   const [hoveredItemId, setHoveredItemId] = useState<number | null>(null);

//   const toggleSidebar = () => setIsOpen(!isOpen);

//   const menuItems: MenuItem[] = [
//     // { id: 1, label: "หน้าแรก", icon: "📖", path: "/Homepage", roles: ["Admin", "Scheduler", "Instructor"] },
//     // { id: 1, label: "หน้าแรก", icon: "📖", path: "/Homepage", roles: ["Admin", "Scheduler", "Instructor"] },
//     // { id: 1, label: "หน้าแรก", icon: "📖", path: "/Homepage", roles: ["Admin", "Scheduler", "Instructor"] },
//     {
//       id: 1,
//       label: "หน้าแรก",
//       icon: "📖",
//       path: "/Homepage",
//       roles: ["Admin", "Scheduler", "Instructor"],
//     },
//     {
//       id: 2,
//       label: "ตารางสอน",
//       icon: "🧑‍🏫",
//       path: "/Schedulepage",
//       roles: ["Scheduler", "Instructor"],
//     },
//     {
//       id: 3,
//       label: "ประวัติการจัดตารางสอน",
//       icon: "🧑‍🏫",
//       path: "/history-schedule",
//       roles: ["Scheduler"],
//     },
//     {
//       id: 4,
//       label: "เงื่อนไขการจัดตารางสอน",
//       icon: "🧑‍🏫",
//       path: "/Conditionpage",
//       roles: ["Scheduler"],
//     },
//     {
//       id: 5,
//       label: "เพิ่มเงื่อนไข",
//       icon: "🧑‍🏫",
//       path: "/AddConditionpage",
//       roles: ["Scheduler", "Instructor"],
//     },
//     {
//       id: 6,
//       label: "เพิ่มวิชาที่ต้องการสอน",
//       icon: "🧑‍🏫",
//       path: "/AddCoursepage",
//       roles: ["Scheduler", "Instructor"],
//     },
//     {
//       id: 7,
//       label: "รายชื่ออาจารย์",
//       icon: "🧑‍🏫",
//       path: "/teacher-list",
//       roles: ["Admin", "Scheduler"],
//     },
//     {
//       id: 8,
//       label: "รายชื่อผู้ช่วยสอน",
//       icon: "🧑‍🏫",
//       path: "/assistance-list",
//       roles: ["Admin", "Scheduler"],
//     },
//     {
//       id: 9,
//       label: "รายวิชาที่เปิดสอน",
//       icon: "📋",
//       path: "/open-course",
//       roles: ["Admin", "Scheduler", "Instructor"],
//     },
//     {
//       id: 10,
//       label: "รายวิชาทั้งหมด",
//       icon: "📚",
//       path: "/all-course",
//       roles: ["Admin", "Scheduler"],
//     },
//     {
//       id: 11,
//       label: "จัดการรายชื่ออาจารย์",
//       icon: "🛠️",
//       path: "/manage-teacher",
//       roles: ["Admin"],
//     },
//     {
//       id: 12,
//       label: "จัดการรายชื่อผู้ช่วยสอน",
//       icon: "🛠️",
//       path: "/manage-assistance",
//       roles: ["Admin"],
//     },
//     {
//       id: 13,
//       label: "จัดการรายวิชา",
//       icon: "🖊️",
//       path: "/manage-course",
//       roles: ["Admin", "Scheduler"],
//     },
//     {
//       id: 14,
//       label: "จัดการวิชาจากศูนย์บริการ",
//       icon: "🖋️",
//       path: "/manage-cescourse",
//       roles: ["Admin"],
//     },
//   ];

//   // ตรวจสอบ path ปัจจุบันและอัพเดท activeItem
//   useEffect(() => {
//     const currentItem = menuItems.find(
//       (item) => item.path === location.pathname
//     );
//     if (currentItem) {
//       setActiveItem(currentItem.id);
//     }
//   }, [location.pathname]);

//   // ฟังก์ชันสำหรับการนำทาง
//   const handleNavigation = (item: MenuItem) => {
//     setActiveItem(item.id);
//     navigate(item.path);
//   };

//   return (
//     <>
//       <Header />
//       <div
//         style={{
//           width: "300px",
//           height: "100vh",
//           backgroundColor: "#ffffff",
//           borderRight: "1px solid #e0e0e0",
//           position: "fixed",
//           left: 0,
//           top: 0,
//           zIndex: 1000,
//           display: "flex",
//           flexDirection: "column",
//           boxShadow: "2px 0 8px rgba(0,0,0,0.05)",
//         }}
//       >
//         {/* Toggle Sidebar Button */}
//         <div
//           style={{
//             display: "flex",
//             justifyContent: isOpen ? "flex-end" : "center",
//             alignItems: "center",
//             height: "50px",
//             padding: "0 10px",
//           }}
//         >
//           <button
//             onClick={toggleSidebar}
//             style={{
//               background: "none",
//               border: "none",
//               cursor: "pointer",
//               fontSize: "24px",
//               color: "#FF6B35",
//             }}
//           >
//             {isOpen ? <IoClose /> : <IoMenu />}
//           </button>
//         </div>

//         {/* Header - SUT Logo */}
//         <div
//           style={{
//             padding: "25px 20px",
//             backgroundColor: "#ffffff",
//           }}
//         >
//           <div
//             style={{
//               display: "flex",
//               flexDirection: "column",
//               alignItems: "center",
//               textAlign: "center",
//             }}
//           >
//             <img
//               src="/src/assets/SUT_logo.png"
//               alt="SUT Logo"
//               style={{
//                 width: "125.45px",
//                 height: "98px",
//                 objectFit: "contain",
//                 marginRight: "auto",
//                 marginLeft: "0",
//               }}
//             />
//           </div>
//         </div>

//         {/* Menu Items */}
//         <nav
//           style={{
//             flex: 1,
//             paddingTop: "10px",
//             overflowY: "auto",
//           }}
//         >
//           {menuItems.map((item) => (
//             <div
//               key={item.id}
//               onClick={() => handleNavigation(item)}
//               style={{
//                 padding: "12px 20px",
//                 display: "flex",
//                 alignItems: "center",
//                 gap: "12px",
//                 cursor: "pointer",
//                 backgroundColor:
//                   activeItem === item.id ? "#FF6B35" : "transparent",
//                 color: activeItem === item.id ? "white" : "#333",
//                 transition: "all 0.2s ease",
//                 margin: "2px 8px",
//                 borderRadius: "4px",
//                 fontFamily: "'Poppins', sans-serif",
//               }}
//               onMouseEnter={(e) => {
//                 if (activeItem !== item.id) {
//                   e.currentTarget.style.backgroundColor = "#f5f5f5";
//                 }
//               }}
//               onMouseLeave={(e) => {
//                 if (activeItem !== item.id) {
//                   e.currentTarget.style.backgroundColor = "transparent";
//                 }
//               }}
//             >
//               <span
//                 style={{
//                   fontSize: "16px",
//                   minWidth: "20px",
//                   opacity: activeItem === item.id ? 1 : 0.7,
//                 }}
//               >
//                 {item.icon}
//               </span>
//               <span
//                 style={{
//                   fontSize: "14px",
//                   fontWeight: activeItem === item.id ? "500" : "400",
//                 }}
//               >
//                 {item.label}
//               </span>
//             </div>
//           ))}
//         </nav>

//         {/* Footer - Logout Button */}
//         <div
//           style={{
//             padding: "20px",
//           }}
//         >
//           <button
//             style={{
//               width: "100%",
//               padding: "12px 16px",
//               backgroundColor: "#6c7a89",
//               color: "white",
//               border: "none",
//               borderRadius: "8px",
//               fontSize: "14px",
//               fontWeight: "500",
//               cursor: "pointer",
//               display: "flex",
//               alignItems: "center",
//               justifyContent: "center",
//               gap: "8px",
//               transition: "background-color 0.2s ease",
//               fontFamily: "'Poppins', sans-serif",
//             }}
//             onMouseEnter={(e) => {
//               e.currentTarget.style.backgroundColor = "#5a6c7d";
//             }}
//             onMouseLeave={(e) => {
//               e.currentTarget.style.backgroundColor = "#6c7a89";
//             }}
//           >
//             <span>🚪</span>
//             ออกจากระบบ
//           </button>
//         </div>
//       </div>
//     </>
//   );
// };

// export default Sidebar;

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

  const menuItems: MenuItem[] = [
    { id: 1, label: "หน้าแรก", icon: "📖", path: "/Homepage", roles: ["Admin", "Scheduler", "Instructor"] },
    { id: 2, label: "ตารางสอน", icon: "🧑‍🏫", path: "/Schedulepage", roles: ["Scheduler", "Instructor"] },
    { id: 3, label: "ประวัติการจัดตารางสอน", icon: "🧑‍🏫", path: "/history-schedule", roles: ["Scheduler"] },
    { id: 4, label: "เงื่อนไขการจัดตารางสอน", icon: "🧑‍🏫", path: "/Conditionpage", roles: ["Scheduler"] },
    { id: 5, label: "เพิ่มเงื่อนไข", icon: "🧑‍🏫", path: "/AddConditionpage", roles: ["Scheduler", "Instructor"] },
    { id: 6, label: "เพิ่มวิชาที่ต้องการสอน", icon: "🧑‍🏫", path: "/AddCoursepage", roles: ["Scheduler", "Instructor"] },
    { id: 7, label: "รายชื่ออาจารย์", icon: "🧑‍🏫", path: "/teacher-list", roles: ["Admin", "Scheduler"] },
    { id: 8, label: "รายชื่อผู้ช่วยสอน", icon: "🧑‍🏫", path: "/assistance-list", roles: ["Admin", "Scheduler"] },
    { id: 9, label: "รายวิชาที่เปิดสอน", icon: "📋", path: "/open-course", roles: ["Admin", "Scheduler", "Instructor"] },
    { id: 10, label: "รายวิชาทั้งหมด", icon: "📚", path: "/all-course", roles: ["Admin", "Scheduler"] },
    { id: 11, label: "จัดการรายชื่ออาจารย์", icon: "🛠️", path: "/manage-teacher", roles: ["Admin"] },
    { id: 12, label: "จัดการรายชื่อผู้ช่วยสอน", icon: "🛠️", path: "/manage-assistance", roles: ["Admin"] },
    { id: 13, label: "จัดการรายวิชา", icon: "🖊️", path: "/manage-course", roles: ["Admin", "Scheduler"] },
    { id: 14, label: "จัดการวิชาจากศูนย์บริการ", icon: "🖋️", path: "/manage-cescourse", roles: ["Admin"] },
  ];

  useEffect(() => {
    const currentItem = menuItems.find((item) => item.path === location.pathname);
    if (currentItem) setActiveItem(currentItem.id);
  }, [location.pathname]);

  const handleNavigation = (item: MenuItem) => {
    setActiveItem(item.id);
    navigate(item.path);
  };

  return (
    <>
      <Header />
      <div
        style={{
          width: isOpen ? "300px" : "60px",
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
        }}
      >
        {/* Toggle Button */}
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "8px" }}>
          <button
            onClick={toggleSidebar}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "24px",
              color: "#FF6B35",
            }}
          >
            {isOpen ? <IoClose /> : <IoMenu />}
          </button>
        </div>

        {/* Logo */}
        <div style={{ padding: "10px", display: "flex", justifyContent: "center" }}>
          <img
            src="/src/assets/SUT_logo.png"
            alt="SUT Logo"
            style={{
              width: isOpen ? "120px" : "40px",
              height: "auto",
              transition: "width 0.3s ease",
            }}
          />
        </div>

        {/* Menu */}
        <nav style={{ flex: 1, paddingTop: "10px", overflowY: "auto" }}>
          {menuItems.map((item) => (
            <div
              key={item.id}
              onClick={() => handleNavigation(item)}
              style={{
                padding: "12px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                cursor: "pointer",
                backgroundColor: activeItem === item.id ? "#FF6B35" : "transparent",
                color: activeItem === item.id ? "white" : "#333",
                borderRadius: "4px",
                margin: "4px 8px",
                transition: "all 0.2s ease",
              }}
            >
              <span style={{ fontSize: "18px", minWidth: "24px" }}>{item.icon}</span>
              {isOpen && (
                <span style={{ fontSize: "14px", fontWeight: activeItem === item.id ? "500" : "400" }}>
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
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#5a6c7d")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#6c7a89")}
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
