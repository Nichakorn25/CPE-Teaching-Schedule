import React, { useState, useEffect } from "react";
import { getAllTitle } from "../../../services/https/GetService";
import {
  TitleInterface,
  TeachingAssistantInterface,
} from "../../../interfaces/TeachingAssistant";
import { postCreateTeachingAssistant } from "../../../services/https/AdminPageServices";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

const ManageAssistance: React.FC = () => {
  const [title, setTitle] = useState<TitleInterface[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const navigate = useNavigate();

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

  const [form, setForm] = useState<TeachingAssistantInterface>({
    ID: 0,
    Firstname: "",
    Lastname: "",
    Email: "",
    PhoneNumber: "",
    TitleID: 0,
    Title: {
      ID: 0,
      Title: "",
      TeachingAssistants: [],
    },
    ScheduleTeachingAssistant: [],
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
        setForm({ ...form });
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setForm({ ...form });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !form.Firstname ||
      !form.Lastname ||
      !form.Email ||
      !form.PhoneNumber ||
      form.TitleID === 0
    ) {
      Swal.fire({
        icon: "warning",
        title: "ข้อมูลไม่ครบถ้วน",
        text: "กรุณากรอกข้อมูลให้ครบทุกช่องก่อนบันทึก",
      });
      return;
    }

    const dataToSubmit: TeachingAssistantInterface = {
      ...form,
    };

    const res = await postCreateTeachingAssistant(dataToSubmit);

    const selectedTitle = title.find((t) => t.ID === form.TitleID)?.Title || "";
    const fullname = `${form.Firstname} ${form.Lastname}`;

    if (res.status === 201 || res.status === 200) {
      Swal.fire({
        icon: "success",
        title: "บันทึกสำเร็จ",
        text: `ข้อมูล ${selectedTitle} ${fullname} ถูกบันทึกเรียบร้อยแล้ว`,
        confirmButtonText: "ตกลง",
      }).then(() => {
        navigate("/assistance-list"); // 🔁 เปลี่ยน path ได้ตามจริง
      });
    } else {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: res?.data?.error || "ไม่สามารถบันทึกข้อมูลได้",
      });
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-10 font-sarabun grid grid-cols-1 md:grid-cols-2 gap-y-14 gap-x-12 w-full mt-20 bg-white"
    >
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
              name="Firstname"
              value={form.Firstname}
              onChange={handleChange}
              className="w-full border border-orange-400 rounded px-3 py-2 text-sm"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm text-[#f26522]">นามสกุล</label>
            <input
              name="Lastname"
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
              name="Email"
              value={form.Email}
              onChange={handleChange}
              className="w-full border border-orange-400 rounded px-3 py-2 text-sm font-bold"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm text-[#f26522]">หมายเลขโทรศัพท์</label>
            <input
              name="PhoneNumber"
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
