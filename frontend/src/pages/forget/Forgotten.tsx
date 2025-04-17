import React from 'react';

const ForgotPasswordPage: React.FC = () => {
  return (
    <div className="w-full h-screen bg-[#c4c4c4] flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#09261d] py-6 px-4 md:px-12 rounded-t-xl">
          <h1 className="text-white text-2xl md:text-4xl font-bold font-montserrat text-center">
            Forgotten your password
          </h1>
        </div>

        {/* Form */}
        <div className="p-6 md:p-10 space-y-6">
          {/* Email */}
          <div>
            <label className="block text-black text-lg font-montserrat mb-1">อีเมลพนักงาน</label>
            <input
              type="email"
              placeholder="email"
              className="w-full h-12 px-4 rounded-xl border border-[#aaaaaa] text-[#aaaaaa] text-lg font-montserrat"
            />
          </div>

          {/* New Password */}
          <div>
            <label className="block text-black text-lg font-montserrat mb-1">รหัสผ่านใหม่</label>
            <input
              type="password"
              placeholder="new password"
              className="w-full h-12 px-4 rounded-xl border border-[#aaaaaa] text-[#aaaaaa] text-lg font-montserrat"
            />
          </div>

          {/* Save Button */}
          <button className="w-full h-12 bg-[#ff6314] text-white text-xl font-bold font-montserrat rounded-xl hover:bg-orange-600 transition">
            save
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
