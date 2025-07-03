import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

interface MenuItem {
    id: number;
    title: string;
    icon: string;
    path: string;
    isActive?: boolean;
}

const Sidebar: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [activeItem, setActiveItem] = useState<number>(1);

    const menuItems: MenuItem[] = [
        { id: 1, title: "หน้าแรก", icon: "🏠", path: "/Homepage" },
        { id: 2, title: "ตารางสอน", icon: "📅", path: "/Schedulepage" },
        { id: 3, title: "รายวิชาที่เปิดสอน", icon: "📋", path: "/OfferedCoursespage" },
        { id: 4, title: "เงื่อนไขการจัดตารางสอน", icon: "🗂️", path: "/Conditionpage" },
        { id: 5, title: "รายชื่ออาจารย์", icon: "👥", path: "/Instructorpage" },
        { id: 6, title: "รายวิชาทั้งหมด", icon: "📊", path: "/AllCoursepage" },
        { id: 7, title: "เพิ่มเงื่อนไข", icon: "👤", path: "/AddConditionpage" },
        { id: 8, title: "เพิ่มวิชาที่เปิดสอน", icon: "💾", path: "/AddCoursepage" }
    ];

    // ตรวจสอบ path ปัจจุบันและอัพเดท activeItem
    useEffect(() => {
        const currentItem = menuItems.find(item => item.path === location.pathname);
        if (currentItem) {
            setActiveItem(currentItem.id);
        }
    }, [location.pathname]);

    // ฟังก์ชันสำหรับการนำทาง
    const handleNavigation = (item: MenuItem) => {
        setActiveItem(item.id);
        navigate(item.path);
    };

    return (
        <div style={{
            width: "300px",
            height: "100vh",
            backgroundColor: "#ffffff",
            borderRight: "1px solid #e0e0e0",
            position: "fixed",
            left: 0,
            top: 0,
            zIndex: 1000,
            display: "flex",
            flexDirection: "column",
            boxShadow: "2px 0 8px rgba(0,0,0,0.05)"
        }}>
            {/* Header - SUT Logo */}
            <div style={{
                padding: "25px 20px",
                backgroundColor: "#ffffff"
            }}>
                <div style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center"
                }}>
                   <img 
                        src="/src/assets/SUT_logo.png"
                        alt="SUT Logo"
                        style={{
                            width: "125.45px",
                            height: "98px",
                            objectFit: "contain",
                            marginRight: "auto", 
                            marginLeft: "0"      
                        }}
                    />
                </div>
            </div>

            {/* Menu Items */}
            <nav style={{ 
                flex: 1, 
                paddingTop: "10px",
                overflowY: "auto"
            }}>
                {menuItems.map((item) => (
                    <div
                        key={item.id}
                        onClick={() => handleNavigation(item)}
                        style={{
                            padding: "12px 20px",
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            cursor: "pointer",
                            backgroundColor: activeItem === item.id ? "#FF6B35" : "transparent",
                            color: activeItem === item.id ? "white" : "#333",
                            transition: "all 0.2s ease",
                            margin: "2px 8px",
                            borderRadius: "4px",
                            fontFamily: "'Poppins', sans-serif"
                        }}
                        onMouseEnter={(e) => {
                            if (activeItem !== item.id) {
                                e.currentTarget.style.backgroundColor = "#f5f5f5";
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (activeItem !== item.id) {
                                e.currentTarget.style.backgroundColor = "transparent";
                            }
                        }}
                    >
                        <span style={{ 
                            fontSize: "16px", 
                            minWidth: "20px",
                            opacity: activeItem === item.id ? 1 : 0.7
                        }}>
                            {item.icon}
                        </span>
                        <span style={{
                            fontSize: "14px",
                            fontWeight: activeItem === item.id ? "500" : "400"
                        }}>
                            {item.title}
                        </span>
                    </div>
                ))}
            </nav>

            {/* Footer - Logout Button */}
            <div style={{
                padding: "20px"
            }}>
                <button style={{
                    width: "100%",
                    padding: "12px 16px",
                    backgroundColor: "#6c7a89",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: "500",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    transition: "background-color 0.2s ease",
                    fontFamily: "'Poppins', sans-serif"
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#5a6c7d";
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#6c7a89";
                }}>
                    <span>🚪</span>
                    ออกจากระบบ
                </button>
            </div>
        </div>
    );
};

export default Sidebar;