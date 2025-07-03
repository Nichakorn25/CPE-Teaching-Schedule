// Header.tsx - แก้ไขให้เรียงถูกต้อง
import React from "react";

interface User {
    id: number;
    image: string;
    username: string;
    password: string;
    firstname: string;
    lastname: string;
    email: string;
    phone_number: string;
    address: string;
    password_first: string;
    titleId: number;
    positionId: number;
    majorId: number;
    roleId: number;
}

const Header: React.FC = () => {
    const Userdata: User[] = [
        {
            id: 1,
            image: "/src/assets/Profile.jpg",
            username: "Victoria Secret",
            password: "1234",
            firstname: "Victoria",
            lastname: "Secret",
            email: "supapron@g.sut.ac.th",
            phone_number: "0888888888",
            address: "12 หมู่ 7",
            password_first: "12345",
            titleId: 1,
            positionId: 1,
            majorId: 1,
            roleId: 2,
        }
    ];

    return (
        <div style={{
            display: "flex",
            alignItems: "center",        
            gap: "12px",                 
            padding: "12px 16px",
        }}> 
             {/* ✅ ใช้ line-height แทน div wrapper */}
            <span style={{ 
                fontSize: "15px",
                fontWeight: "500",
                lineHeight: "40px",  // ✅ เท่ากับความสูงของรูป
                margin: 0,
                fontFamily: "'Poppins', sans-serif",
                color: "#2c3e50",
                whiteSpace: "nowrap"  // ✅ ป้องกันชื่อยาวขึ้นบรรทัดใหม่
            }}>
                {Userdata[0].firstname} {Userdata[0].lastname} 
            </span>       
            {/* ✅ เปลี่ยนลำดับ: รูปก่อน แล้วตามด้วยชื่อ */}
            <img 
                src={Userdata[0].image} 
                alt={`Profile of ${Userdata[0].username}`}
                style={{ 
                    width: "40px", 
                    height: "40px", 
                    borderRadius: "50%", 
                    objectFit: "cover",
                    flexShrink: 0,
                }}
            />
        </div>
    );
};

export default Header;