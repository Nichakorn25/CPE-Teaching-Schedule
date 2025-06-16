import React, { useState } from "react";
import bgVideo from '../../../assets/bg1.mp4'

const ChangePassword: React.FC = () => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("รหัสผ่านใหม่ไม่ตรงกัน");
      return;
    }
    console.log("ส่งข้อมูลเปลี่ยนรหัสผ่าน");
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
      {/* วิดีโอพื้นหลัง */}
      <video
        className="absolute top-0 left-0 w-full h-full object-cover z-0"
        src={bgVideo}
        autoPlay
        loop
        muted
        playsInline
      />

      {/* ชั้นเบลอพื้นหลังถ้าต้องการ */}
      <div className="absolute inset-0 bg-black bg-opacity-30 z-0"></div>

      {/* เนื้อหาด้านหน้า */}
      <div className="relative z-10 bg-white w-full max-w-3xl rounded-md shadow-md p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ฟอร์มเปลี่ยนรหัสผ่าน */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <h2 className="text-center text-lg font-bold text-[#f26522] mb-4">
            เปลี่ยนรหัสผ่าน
          </h2>

          <div>
            <label className="block text-sm text-[#f26522] mb-1">
              รหัสผ่านเดิม
            </label>
            <input
              type="password"
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#f26522]"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm text-[#f26522] mb-1">
              รหัสผ่านใหม่
            </label>
            <input
              type="password"
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#f26522]"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm text-[#f26522] mb-1">
              ยืนยันรหัสผ่านใหม่
            </label>
            <input
              type="password"
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#f26522]"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <div className="text-center">
            <button
              type="submit"
              className="bg-[#f26522] hover:bg-[#e0561a] text-white font-semibold px-6 py-2 rounded"
            >
              บันทึก
            </button>
          </div>
        </form>

        {/* ข้อความแนะนำ */}
        <div className="text-sm text-[#f26522] leading-relaxed">
          <p className="font-semibold mb-2">
            หลักการเปลี่ยนรหัสผ่านอย่างปลอดภัย:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              ใช้รหัสผ่านที่คาดเดายาก เช่น ตัวพิมพ์เล็ก-ใหญ่ ตัวเลข และสัญลักษณ์
            </li>
            <li>หลีกเลี่ยงคำง่าย ๆ เช่น “password”, “123456”, ชื่อเล่น ฯลฯ</li>
            <li>ความยาวอย่างน้อย 8–12 ตัวอักษร</li>
            <li>ไม่ใช้รหัสผ่านเดียวกันกับหลายบัญชี</li>
            <li>หากบัญชีใดถูกเจาะ ระบบอื่นที่ใช้รหัสเดียวกันอาจถูกแฮกได้</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
