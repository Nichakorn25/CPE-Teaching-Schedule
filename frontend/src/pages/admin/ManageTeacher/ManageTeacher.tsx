import React, { useEffect, useState } from "react";
import Header from "../../../components/header/Header";
import {
  getAllTitle,
  getAllPosition,
} from "../../../services/https/GetService";
import {
  Alltitles,
  Allposition,
  CreateUserInterface,
} from "../../../interfaces/Adminpage";
import Title from "antd/es/skeleton/Title";
import { postCreateUser } from "../../../services/https/AdminPageServices";

const ManageTeacher: React.FC = () => {
  const [title, setTitle] = useState<Alltitles[]>([]);
  const [position, setPosition] = useState<Allposition[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [faculty, setFaculty] = useState("");
  const [department, setDepartment] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const titleResponse = await getAllTitle();
      if (titleResponse.status == 200 && Array.isArray(titleResponse.data)) {
        setTitle(titleResponse.data);
      } else {
        console.log("ไม่สามารถโหลดคำนำหน้าได้", titleResponse);
      }

      const positionResponse = await getAllPosition();
      if (
        positionResponse.status == 200 &&
        Array.isArray(positionResponse.data)
      ) {
        setPosition(positionResponse.data);
      } else {
        console.log("ไม่สามารถโหลดตำำแหน่งได้", positionResponse);
      }
    };
    fetchData();
  }, []);

  const [form, setForm] = useState<CreateUserInterface>({
    Username: "",
    Password: "",
    Firstname: "",
    Lastname: "",
    Image: "", // จะเปลี่ยนเป็น base64 หรือ URL ภายหลัง
    Email: "",
    PhoneNumber: "",
    Address: "",
    TitleID: 0,
    PositionID: 0,
    MajorID: 1, // ตัวอย่าง: กำหนดไว้ล่วงหน้า
    RoleID: 2, // ตัวอย่าง: 2 = Teacher
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm({ ...form, Image: reader.result as string });
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setForm({ ...form, Image: "" });
      setImagePreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !form.Username ||
      !form.Password ||
      !form.Firstname ||
      !form.Lastname ||
      !form.Image ||
      !form.Email ||
      !form.PhoneNumber ||
      form.TitleID === 0 ||
      form.PositionID === 0 ||
      !faculty ||
      !department
    ) {
      alert("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    const dataToSubmit: CreateUserInterface = {
      ...form,
      Address: `${faculty} - ${department}`,
    };

    const res = await postCreateUser(dataToSubmit);

    if (res.status === 201 || res.status === 200) {
      alert("บันทึกสำเร็จ");
    } else {
      alert("บันทึกล้มเหลว: " + res?.data?.error);
    }
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
          name="TitleID"
          value={form.TitleID}
          onChange={(e) =>
            setForm({ ...form, TitleID: Number(e.target.value) })
          }
        >
          <option value={0}>-- เลือกคำนำหน้า --</option>
          {title.map((t) => (
            <option key={t.ID} value={t.ID}>
              {t.Title}
            </option>
          ))}
        </select>

        <label className="text-sm text-[#f26522]">ชื่อ</label>
        <input
          name="firstName"
          value={form.Firstname}
          onChange={handleChange}
          className="border border-orange-400 rounded px-3 py-2 text-sm"
        />

        <label className="text-sm text-[#f26522]">สำนักวิชา</label>
        <input
          name="faculty"
          value={form.MajorID}
          onChange={handleChange}
          className="border border-orange-400 rounded px-3 py-2 text-sm"
        />

        <label className="text-sm text-[#f26522]">อีเมล</label>
        <input
          name="email"
          value={form.Email}
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

        {imagePreview && (
          <img
            src={imagePreview}
            alt="Preview"
            className="mt-2 rounded border w-32 h-32 object-cover"
          />
        )}
      </div>

      {/* Right side */}
      <div className="flex flex-col gap-4">
        <label className="text-sm text-[#f26522]">
          ตำแหน่งที่ได้รับการแต่งตั้ง
        </label>
        <select
          name="PositionID"
          value={form.PositionID}
          onChange={(e) =>
            setForm({ ...form, PositionID: Number(e.target.value) })
          }
        >
          <option value={0}>-- เลือกตำแหน่ง --</option>
          {position.map((p) => (
            <option key={p.ID} value={p.ID}>
              {p.Position}
            </option>
          ))}
        </select>

        <label className="text-sm text-[#f26522]">นามสกุล</label>
        <input
          name="lastName"
          value={form.Lastname}
          onChange={handleChange}
          className="border border-orange-400 rounded px-3 py-2 text-sm"
        />

        <label className="text-sm text-[#f26522]">สาขาวิชา</label>
        <input
          name="department"
          value={form.MajorID}
          onChange={handleChange}
          className="border border-orange-400 rounded px-3 py-2 text-sm"
        />

        <label className="text-sm text-[#f26522]">หมายเลขโทรศัพท์</label>
        <input
          name="phone"
          value={form.PhoneNumber}
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
            value={form.MajorID}
            onChange={handleChange}
            className="border border-orange-400 rounded px-3 py-2 text-sm"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm text-[#f26522]">รหัสผ่าน</label>
          <input
            name="password"
            value={form.Password}
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
