import React, { useState } from "react";
import Header from "../../../components/header/Header";

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

  // ตรวจสอบว่าทุกช่องต้องไม่ว่าง
  const {
    title, position, firstName, lastName, faculty,
    department, email, phone, joinDate, employeeId,
    password, image
  } = form;

  if (
    !title || !position || !firstName || !lastName || !faculty ||
    !department || !email || !phone || !employeeId ||
    !password || !image
  ) {
    alert("กรุณากรอกข้อมูลให้ครบทุกช่องก่อนบันทึก");
    return;
  }

  console.log("Submitted", form);
};


  return (
    <form
      onSubmit={handleSubmit}
      className="p-10 font-sarabun grid grid-cols-1 md:grid-cols-2 gap-y-14 gap-x-12 w-full mt-20 bg-white"
    >
      <Header />

      {/* Left side */}
      <div className="flex flex-col gap-4">
        <label className="text-sm text-[#f26522]">ตำแหน่งทางวิชาการ</label>
        <select
          name="title"
          value={form.title}
          onChange={handleChange}
          className="border border-orange-400 rounded px-3 py-2 text-sm"
        >
          <option>รศ.ดร.</option>
          <option>อ.ดร.</option>
          <option>ผศ.ดร.</option>
        </select>

        <label className="text-sm text-[#f26522]">ชื่อ</label>
        <input
          name="firstName"
          value={form.firstName}
          onChange={handleChange}
          className="border border-orange-400 rounded px-3 py-2 text-sm"
        />

        <label className="text-sm text-[#f26522]">สำนักวิชา</label>
        <input
          name="faculty"
          value={form.faculty}
          onChange={handleChange}
          className="border border-orange-400 rounded px-3 py-2 text-sm"
        />

        <label className="text-sm text-[#f26522]">อีเมล</label>
        <input
          name="email"
          value={form.email}
          onChange={handleChange}
          className="border border-orange-400 rounded px-3 py-2 text-sm font-bold"
        />

        <label className="text-sm text-[#f26522]">รูปภาพอาจารย์</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="text-sm"
        />
      </div>

      {/* Right side */}
      <div className="flex flex-col gap-4">
        <label className="text-sm text-[#f26522]">ตำแหน่งที่ได้รับการแต่งตั้ง</label>
        <select
          name="position"
          value={form.position}
          onChange={handleChange}
          className="border border-orange-400 rounded px-3 py-2 text-sm"
        >
          <option>หัวหน้าสาขาวิชา</option>
          <option>อาจารย์ประจำหลักสูตร</option>
        </select>

        <label className="text-sm text-[#f26522]">นามสกุล</label>
        <input
          name="lastName"
          value={form.lastName}
          onChange={handleChange}
          className="border border-orange-400 rounded px-3 py-2 text-sm"
        />

        <label className="text-sm text-[#f26522]">สาขาวิชา</label>
        <input
          name="department"
          value={form.department}
          onChange={handleChange}
          className="border border-orange-400 rounded px-3 py-2 text-sm"
        />

        <label className="text-sm text-[#f26522]">หมายเลขโทรศัพท์</label>
        <input
          name="phone"
          value={form.phone}
          onChange={handleChange}
          className="border border-orange-400 rounded px-3 py-2 text-sm font-bold"
        />
      </div>

      {/* รหัสพนักงานและรหัสผ่าน แนวนอน ขนาดเท่ากัน */}
      <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
        <div className="flex flex-col">
          <label className="text-sm text-[#f26522]">รหัสพนักงาน</label>
          <input
            name="employeeId"
            value={form.employeeId}
            onChange={handleChange}
            className="border border-orange-400 rounded px-3 py-2 text-sm"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm text-[#f26522]">รหัสผ่าน</label>
          <input
            name="password"
            value={form.password}
            onChange={handleChange}
            className="border border-orange-400 rounded px-3 py-2 text-sm font-bold"
          />
        </div>
      </div>

      {/* ปุ่มบันทึก */}
      <div className="col-span-1 md:col-span-2 flex justify-end mt-6">
        <button
          type="submit"
          className="bg-[#f26522] text-white px-6 py-2 rounded hover:bg-[#d9531e]"
        >
          บันทึก
        </button>
      </div>
    </form>
  );
};

export default ManageTeacher;
