import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { ChangePass } from "../../services/https/index";
import { ChangePassInterface } from "../../interfaces/ChangePass";

import TopBar from "../../../src/components/topbar/TopBar";

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<ChangePassInterface>({
    UsernameID: '',
    Email: '',
    Password: '',
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const response = await ChangePass(formData);
      if (response.status >= 200 && response.status < 300) {
        alert("ส่งคำร้องขอเปลี่ยนรหัสผ่านเรียบร้อยแล้ว");
        navigate("/login");
      } else {
        alert("ไม่สามารถส่งคำร้องได้: " + (response.data?.error || response.data?.message || "เกิดข้อผิดพลาด"));
      }
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.error) {
        alert("เกิดข้อผิดพลาด: " + err.response.data.error);
      } else {
        alert("เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์");
      }
    }
  };

  const handleBackToLogin = () => {
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <div
        className="min-h-screen flex items-center justify-center px-4 bg-cover bg-center"
        style={{ backgroundImage: 'linear-gradient(rgba(60,60,60,0.4), rgba(60,60,60,0.3)),url(/sut.jpg)' }}
      >
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md bg-white rounded-xl shadow-lg overflow-hidden"
        >
          {/* Header */}
          <div className="relative bg-[#09261d] text-white text-center pt-10 pb-6">
            <h1 className="text-2xl font-bold tracking-wide mt-2 z-20">
              ส่งคำร้องขอเปลี่ยนรหัสผ่าน
            </h1>
          </div>
          <div className="absolute top-[25.5%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#09261d] rounded-full p-3 z-10">
            <div className="border-1 border-[#09261d] rounded-full p-2">
              <img
                src={new URL('../../assets/key.png', import.meta.url).href}
                alt="Key Icon"
                className="w-20 h-20"
              />
            </div>
          </div>

          {/* Form */}
          <div className="p-8 space-y-4 mt-4">
            <div>
              <label className="block text-gray-800 text-sm font-medium mb-1">
                รหัสพนักงาน
              </label>
              <input
                type="text"
                name="UsernameID"
                placeholder="username"
                value={formData.UsernameID}
                onChange={handleChange}
                className="w-full h-9 px-3 text-sm rounded-md border border-gray-300 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-orange-400 transition"
                required
              />
            </div>
            <div>
              <label className="block text-gray-800 text-sm font-medium mb-1">
                อีเมลพนักงาน
              </label>
              <input
                type="email"
                name="Email"
                placeholder="example@sut.ac.th"
                value={formData.Email}
                onChange={handleChange}
                className="w-full h-9 px-3 text-sm rounded-md border border-gray-300 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-orange-400 transition"
                required
              />
            </div>
            <div>
              <label className="block text-gray-800 text-sm font-medium mb-1">
                รหัสผ่านใหม่
              </label>
              <input
                type="password"
                name="Password"
                placeholder="new password"
                value={formData.Password}
                onChange={handleChange}
                className="w-full h-9 px-3 text-sm rounded-md border border-gray-300 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-orange-400 transition"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full h-12 bg-[#ff6314] hover:bg-orange-600 text-white text-sm font-medium rounded-md transition transform hover:scale-105"
            >
              ส่งคำร้องขอเปลี่ยนรหัสผ่าน
            </button>
            <button
              type="button"
              onClick={handleBackToLogin}
              className="w-full h-12 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium rounded-md transition transform hover:scale-105"
            >
              กลับไปหน้าเข้าสู่ระบบ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;