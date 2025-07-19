import React from "react";

const Home = () => {
    const first_name = localStorage.getItem("first_name");
    const last_name = localStorage.getItem("last_name");

    return (
        <div className="p-6 space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-4xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-500 mb-4">
                    ยินดีต้อนรับเข้าสู่ระบบตารางสอน
                </h1>
                <h2 className="text-3xl font-semibold text-center text-gray-800">
                    สวัสดี <span className="text-blue-600">{first_name} {last_name}</span> 👋
                </h2>
                <p className="text-gray-600 mt-1">นี่คือภาพรวมตารางของคุณในวันนี้</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card title="ตารางวันนี้" value="2 วิชา" />
                <Card title="ตารางทั้งหมด" value="15 วิชา" />
                <Card title="รออนุมัติ" value="1 วิชา" />
            </div>

            {/* Upcoming Schedules */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-semibold">ตารางสอนถัดไป</h2>
                    <a href="/schedules" className="text-blue-500 hover:underline text-sm">
                        ดูทั้งหมด
                    </a>
                </div>
                <UpcomingSchedules />
            </div>

            {/* Notifications */}
            <div>
                <h2 className="text-2xl font-semibold mb-4">แจ้งเตือน</h2>
                <Notifications />
            </div>
        </div>
    );
};

// ---------- Components ในไฟล์เดียวกัน ----------

type CardProps = {
    title: string;
    value: string;
};

const Card: React.FC<CardProps> = ({ title, value }) => (
    <div className="bg-white shadow rounded-2xl p-6 text-center space-y-2">
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-gray-500">{title}</div>
    </div>
);

const UpcomingSchedules = () => {
    const schedules = [
        { subject: "คณิตศาสตร์พื้นฐาน", time: "09:00 น." },
        { subject: "ฟิสิกส์เบื้องต้น", time: "13:00 น." },
    ];

    return (
        <div className="space-y-4">
            {schedules.map((item, idx) => (
                <div key={idx} className="p-4 bg-gray-100 rounded-xl">
                    <div className="font-semibold">{item.subject}</div>
                    <div className="text-gray-600">{item.time}</div>
                </div>
            ))}
        </div>
    );
};

const Notifications = () => {
    const notiList = [
        "ตารางสอนวิชาฟิสิกส์เปลี่ยนเวลาแล้ว",
        "มีวิชาใหม่ที่รออนุมัติ",
    ];

    return (
        <ul className="space-y-3">
            {notiList.map((noti, idx) => (
                <li key={idx} className="bg-yellow-100 text-yellow-800 p-3 rounded-lg">
                    {noti}
                </li>
            ))}
        </ul>
    );
};

export default Home;
