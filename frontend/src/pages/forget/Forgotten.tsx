import React, { useState } from 'react';

const ForgotPasswordPage: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    newPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await res.json();
      if (res.ok) {
        alert('บันทึกรหัสผ่านใหม่เรียบร้อยแล้ว');
      } else {
        alert(result.message || 'เกิดข้อผิดพลาด');
      }
    } catch (err) {
      console.error(err);
      alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xl bg-white rounded-xl shadow-lg overflow-hidden"
      >
        {/* Header */}
        <div className="bg-[#09261d] text-white text-center py-4">
          <h1 className="text-2xl font-bold tracking-wide">
            ส่งคำร้องขอเปลี่ยนรหัสผ่าน
          </h1>
        </div>

        {/* Form */}
        <div className="p-4 md:p-6 space-y-4">
          {/* Username */}
          <div>
            <label className="block text-gray-800 text-sm font-medium mb-1">
              รหัสพนักงาน
            </label>
            <input
              type="text"
              name="username"
              placeholder="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full h-9 px-3 text-sm rounded-md border border-gray-300 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-orange-400 transition"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-gray-800 text-sm font-medium mb-1">
              อีเมลพนักงาน
            </label>
            <input
              type="email"
              name="email"
              placeholder="example@sut.ac.th"
              value={formData.email}
              onChange={handleChange}
              className="w-full h-9 px-3 text-sm rounded-md border border-gray-300 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-orange-400 transition"
              required
            />
          </div>

          {/* New Password */}
          <div>
            <label className="block text-gray-800 text-sm font-medium mb-1">
              รหัสผ่านใหม่
            </label>
            <input
              type="password"
              name="newPassword"
              placeholder="new password"
              value={formData.newPassword}
              onChange={handleChange}
              className="w-full h-9 px-3 text-sm rounded-md border border-gray-300 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-orange-400 transition"
              required
            />
          </div>

          {/* Save Button */}
          <button
            type="submit"
            className="w-full h-9 bg-[#ff6314] hover:bg-orange-600 text-white text-sm font-medium rounded-md transition"
          >
            ส่งคำร้องขอเปลี่ยนรหัสผ่าน
          </button>
        </div>
      </form>
    </div>
  );
};

export default ForgotPasswordPage;
