import React, { useState, useEffect } from "react";
import Header from "../../../components/header/Header";
import { getAllTitle } from "../../../services/https/GetService";
import { Alltitles,CreateUserInterface } from "../../../interfaces/Adminpage";
import { postCreateUser } from "../../../services/https/AdminPageServices";
import Swal from "sweetalert2";

const ManageAssistance: React.FC = () => {
  const [title, setTitle] = useState<Alltitles[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const titleResponse = await getAllTitle();
      if (titleResponse.status == 200 && Array.isArray(titleResponse.data)) {
        setTitle(titleResponse.data);
      } else {
        console.log("ไม่สามารถโหลดคำนำหน้าได้", titleResponse);
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
    MajorID: 1,
    RoleID: 0,
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
      form.RoleID === 0 ||
      form.TitleID === 0 ||
      form.PositionID === 0
    ) {
      Swal.fire({
        icon: "warning",
        title: "ข้อมูลไม่ครบถ้วน",
        text: "กรุณากรอกข้อมูลให้ครบทุกช่องก่อนบันทึก",
      });
      return;
    }

    const dataToSubmit: CreateUserInterface = {
      ...form,
      Address: form.Address || "N/A", // หรือให้มี input ให้กรอก
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
      <div className="flex flex-col gap-4 col-span-1 md:col-span-2">
        <label className="text-sm text-[#f26522]">คำนำหน้า</label>
        <select
          name="TitleID"
          value={form.TitleID}
          onChange={(e) =>
            setForm({ ...form, TitleID: Number(e.target.value) })
          }
          className="w-full md:w-40 border border-orange-400 rounded px-3 py-2 text-sm"
        >
          <option value={0}>-- เลือกคำนำหน้า --</option>
          {title.map((t) => (
            <option key={t.ID} value={t.ID}>
              {t.Title}
            </option>
          ))}
        </select>

        {/* ชื่อ + นามสกุล */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
          <div className="flex flex-col">
            <label className="text-sm text-[#f26522]">ชื่อ</label>
            <input
              name="firstName"
              value={form.Firstname}
              onChange={handleChange}
              className="w-full border border-orange-400 rounded px-3 py-2 text-sm"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm text-[#f26522]">นามสกุล</label>
            <input
              name="lastName"
              value={form.Lastname}
              onChange={handleChange}
              className="w-full border border-orange-400 rounded px-3 py-2 text-sm"
            />
          </div>
        </div>

        {/* อีเมล + โทรศัพท์ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
          <div className="flex flex-col">
            <label className="text-sm text-[#f26522]">อีเมล</label>
            <input
              name="email"
              value={form.Email}
              onChange={handleChange}
              className="w-full border border-orange-400 rounded px-3 py-2 text-sm font-bold"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm text-[#f26522]">หมายเลขโทรศัพท์</label>
            <input
              name="phone"
              value={form.PhoneNumber}
              onChange={handleChange}
              className="w-full border border-orange-400 rounded px-3 py-2 text-sm font-bold"
            />
          </div>
        </div>

        {/* รูปภาพ */}
        <label className="text-sm text-[#f26522]">รูปภาพผู้ช่วยสอน</label>
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

export default ManageAssistance;
