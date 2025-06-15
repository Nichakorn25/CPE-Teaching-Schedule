import React, { useState } from "react";

const ManageTeacher: React.FC = () => {
  const [form, setForm] = useState({
    title: "รศ.ดร.",
    position: "หัวหน้าสาขาวิชา",
    firstName: "",
    lastName: "",
    faculty: "",
    department: "",
    email: "",
    phone: "",
    joinDate: "",
    employeeId: "",
    password: "",
    image: null as File | null,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setForm({ ...form, image: file });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitted", form);
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 font-sarabun grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mt-10">
      {/* Left side */}
      <div className="flex flex-col gap-3">
        <label className="text-sm text-[#f26522]">ตำแหน่งทางวิชาการ</label>
        <select name="title" value={form.title} onChange={handleChange} className="border border-orange-400 rounded px-3 py-2 text-sm">
          <option>รศ.ดร.</option>
          <option>อ.ดร.</option>
          <option>ผศ.ดร.</option>
        </select>

        <input name="firstName" placeholder="ชื่อ" value={form.firstName} onChange={handleChange} className="border border-orange-400 rounded px-3 py-2 text-sm" />
        <input name="faculty" placeholder="สำนักวิชา" value={form.faculty} onChange={handleChange} className="border border-orange-400 rounded px-3 py-2 text-sm" />
        <input name="email" placeholder="อีเมล" value={form.email} onChange={handleChange} className="border border-orange-400 rounded px-3 py-2 text-sm font-bold" />

        <div>
          <label className="text-sm text-[#f26522] block mb-1">รูปภาพอาจารย์</label>
          <input type="file" accept="image/*" onChange={handleFileChange} className="text-sm" />
        </div>

        <input name="employeeId" placeholder="รหัสพนักงาน" value={form.employeeId} onChange={handleChange} className="border border-orange-400 rounded px-3 py-2 text-sm" />
      </div>

      {/* Right side */}
      <div className="flex flex-col gap-3">
        <label className="text-sm text-[#f26522]">ตำแหน่งที่ได้รับการแต่งตั้ง</label>
        <select name="position" value={form.position} onChange={handleChange} className="border border-orange-400 rounded px-3 py-2 text-sm">
          <option>หัวหน้าสาขาวิชา</option>
          <option>อาจารย์ประจำหลักสูตร</option>
          <option>อาจารย์พิเศษ</option>
        </select>

        <input name="lastName" placeholder="นามสกุล" value={form.lastName} onChange={handleChange} className="border border-orange-400 rounded px-3 py-2 text-sm" />
        <input name="department" placeholder="สาขาวิชา" value={form.department} onChange={handleChange} className="border border-orange-400 rounded px-3 py-2 text-sm" />
        <input name="phone" placeholder="หมายเลขโทรศัพท์ที่สามารถติดต่อได้" value={form.phone} onChange={handleChange} className="border border-orange-400 rounded px-3 py-2 text-sm font-bold" />
        <input name="joinDate" placeholder="วันที่เพิ่มเข้าสู่ระบบ" value={form.joinDate} onChange={handleChange} className="border border-orange-400 rounded px-3 py-2 text-sm font-bold" />
        <input name="password" placeholder="รหัสผ่าน" value={form.password} onChange={handleChange} className="border border-orange-400 rounded px-3 py-2 text-sm font-bold" />
      </div>

      <div className="col-span-1 md:col-span-2 flex justify-end">
        <button type="submit" className="bg-[#f26522] text-white px-6 py-2 rounded hover:bg-[#d9531e]">
          บันทึก
        </button>
      </div>
    </form>
  );
};

export default ManageTeacher;
