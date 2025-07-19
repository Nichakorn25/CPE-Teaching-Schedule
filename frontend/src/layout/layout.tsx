import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/schedule-sidebar/Sidebar";
import Header from "../components/header/Header";

const Layout: React.FC = () => {
  return (
    <div className="p-6 font-sarabun mt-16">
      <Header />
      
      {/* Sidebar */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '300px',
        height: '100vh',
        zIndex: 1000
      }}>
        <Sidebar />
      </div>
      
      {/* Main Content */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: '300px',
        width: 'calc(100vw - 300px)',
        height: '100vh',
        backgroundColor: '#e9ecef',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: '88px 40px 100px 40px',
        overflowY: 'scroll',
        boxSizing: 'border-box'
      }}>
        {/* Background Layer */}
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: '#e9ecef',
          zIndex: -1
        }} />
        
        {/* Content Area */}
        <div style={{
          width: '1200px',
          minHeight: 'calc(100vh - 300px)',
          backgroundColor: '#ffffff',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e0e0e0',
          padding: '15px',
          paddingTop: '45px',
          paddingBottom: '30px',
          overflow: 'visible',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          margin: '15px 15px 60px 15px',
          borderRadius: '8px',
          boxSizing: 'border-box'
        }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;