import React, { useState, useEffect } from "react";
import Sidebar from "../components/schedule-sidebar/Sidebar";
import Header from "../components/header/Header";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    // Listen for sidebar toggle events
    const handleSidebarToggle = (event: CustomEvent) => {
      setSidebarWidth(event.detail.width);
      setIsOpen(event.detail.isOpen);
    };

    window.addEventListener('sidebarToggle', handleSidebarToggle as EventListener);

    return () => {
      window.removeEventListener('sidebarToggle', handleSidebarToggle as EventListener);
    };
  }, []);

  // คำนวณ margin-left ของ content
  // เมื่อ sidebar เปิด: margin-left = sidebarWidth
  // เมื่อ sidebar ปิด: margin-left น้อยลง (content ขยายไปทางซ้าย)
  const contentMarginLeft = isOpen ? sidebarWidth : 60; // 60px คือความกว้างของ sidebar ตอนปิด
  const contentWidth = `calc(100vw - ${contentMarginLeft}px)`;

  return (
    <div style={{ 
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: '#e9ecef',
      fontFamily: 'Sarabun, sans-serif',
      margin: 0,
      padding: 0,
      width: '100vw',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Sidebar - Fixed position */}
      <div style={{
        width: `${sidebarWidth}px`,
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 1000,
        transition: 'width 0.3s ease'
      }}>
        <Sidebar />
      </div>
      
      {/* Main Content Area - ขยายไปทางซ้ายเมื่อ sidebar หุบ */}
      <div style={{
        marginLeft: `${contentMarginLeft}px`,
        width: contentWidth,
        minHeight: '100vh',
        backgroundColor: '#e9ecef',
        transition: 'margin-left 0.3s ease, width 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{
          height: '64px',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e0e0e0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          padding: '0 24px',
          zIndex: 999,
          boxSizing: 'border-box',
          flexShrink: 0
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{
              color: '#5d7285',
              fontWeight: 500,
              fontSize: '14px',
              fontFamily: 'Sarabun, sans-serif'
            }}>
              {localStorage.getItem("first_name")} {localStorage.getItem("last_name")}
            </span>
            <div style={{ 
              width: '28px', 
              height: '28px', 
              borderRadius: '50%', 
              backgroundColor: '#5d7285',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '14px'
            }}>
              👤
            </div>
          </div>
        </div>
        
        {/* Page Content */}
        <main style={{
          flex: 1,
          padding: '20px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          overflow: 'auto'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '1200px', // Fixed max-width ไม่เปลี่ยนตาม sidebar
            backgroundColor: '#ffffff',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            padding: '24px',
            minHeight: 'calc(100vh - 128px)',
            overflow: 'visible'
          }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;