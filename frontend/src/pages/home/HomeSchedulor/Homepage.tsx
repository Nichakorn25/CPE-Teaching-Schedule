import React from "react";
import "./Homepage.css";

const Homepage: React.FC = () => {
    return (
        <>
            {/* Page Title */}
            <div style={{ 
                marginBottom: '20px',
                paddingBottom: '12px',
                borderBottom: '2px solid #F26522'
            }}>
                <h2 style={{ 
                    margin: '0 0 8px 0', 
                    color: '#333',
                    fontSize: '20px',
                    fontWeight: 'bold'
                }}>
                    หน้าหลัก
                </h2>
                <p style={{ 
                    margin: 0, 
                    color: '#666',
                    fontSize: '13px'
                }}>
                    ยินดีต้อนรับสู่ระบบจัดตารางเรียน
                </p>
            </div>
            
            {/* Welcome Image */}
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '400px'
            }}>
                <img 
                    src="/src/assets/Welcome.png"
                    alt="Welcome"
                    style={{
                        maxWidth: '100%',
                        height: 'auto'
                    }}
                />
            </div>
        </>
    );
};

export default Homepage;