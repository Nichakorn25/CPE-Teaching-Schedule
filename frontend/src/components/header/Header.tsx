import React, { useState, useEffect } from "react";
import { FaUserCircle } from "react-icons/fa";

const Header: React.FC = () => {
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const first_name = localStorage.getItem("first_name") || "ชื่อ";
  const last_name = localStorage.getItem("last_name") || "นามสกุล";

  useEffect(() => {
    // Listen for sidebar toggle events
    const handleSidebarToggle = (event: CustomEvent) => {
      setSidebarWidth(event.detail.width);
    };

    window.addEventListener('sidebarToggle', handleSidebarToggle as EventListener);

    return () => {
      window.removeEventListener('sidebarToggle', handleSidebarToggle as EventListener);
    };
  }, []);

  return (
    <header style={{
      position: 'fixed',
      top: 0,
      left: `${sidebarWidth}px`,
      width: `calc(100vw - ${sidebarWidth}px)`,
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
      transition: 'left 0.3s ease, width 0.3s ease'
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
          {first_name} {last_name}
        </span>
        <FaUserCircle size={28} style={{ color: '#5d7285' }} />
      </div>
    </header>
  );
};

export default Header;