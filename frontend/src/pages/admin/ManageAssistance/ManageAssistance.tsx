import React, { useState, useEffect } from "react";
import { getAllTitle } from "../../../services/https/GetService";
import {
  TitleInterface,
  TeachingAssistantInterface,
} from "../../../interfaces/TeachingAssistant";
import { 
  postCreateTeachingAssistant,
  putUpdateTeachingAssistant,
  getTeachingAssistantsById 
} from "../../../services/https/AdminPageServices";
import Swal from "sweetalert2";
import { useNavigate, useParams } from "react-router-dom";

const ManageAssistance: React.FC = () => {
  const [title, setTitle] = useState<TitleInterface[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>(); // รับ id จาก URL parameter

  useEffect(() => {
    const fetchData = async () => {
      // โหลดข้อมูล titles
      const titleResponse = await getAllTitle();
      if (titleResponse.status == 200 && Array.isArray(titleResponse.data)) {
        setTitle(titleResponse.data);
      } else {
        console.log("ไม่สามารถโหลดคำนำหน้าได้", titleResponse);
      }

      // ถ้ามี id ให้โหลดข้อมูลผู้ช่วยสอนสำหรับแก้ไข
      if (id) {
        setIsEditMode(true);
        const assistantResponse = await getTeachingAssistantsById(id);
        if (assistantResponse.status === 200) {
          const assistantData = assistantResponse.data;
          setForm({
            ID: assistantData.ID,
            Firstname: assistantData.Firstname || "",
            Lastname: assistantData.Lastname || "",
            Email: assistantData.Email || "",
            PhoneNumber: assistantData.PhoneNumber || "",
            TitleID: assistantData.TitleID || 0,
            Title: assistantData.Title,
            ScheduleTeachingAssistant: assistantData.ScheduleTeachingAssistant || [],
          });
          
          // ถ้ามีรูปภาพให้แสดง preview
          if (assistantData.ProfileImage) {
            setImagePreview(assistantData.ProfileImage);
          }
        } else {
          Swal.fire({
            icon: "error",
            title: "ไม่พบข้อมูล",
            text: "ไม่สามารถโหลดข้อมูลผู้ช่วยสอนได้",
          }).then(() => {
            navigate("/assistance-list");
          });
        }
      }
    };
    fetchData();
  }, [id, navigate]);

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

    const selectedTitle = title.find((t) => t.ID === form.TitleID)?.Title || "";
    const fullname = `${form.Firstname} ${form.Lastname}`;

    let res;
    if (isEditMode && form.ID) {
      // ใช้ PUT สำหรับการแก้ไข
      res = await putUpdateTeachingAssistant(form.ID, dataToSubmit);
    } else {
      // ใช้ POST สำหรับการสร้างใหม่
      res = await postCreateTeachingAssistant(dataToSubmit);
    }

    if (res.status === 201 || res.status === 200) {
      Swal.fire({
        icon: "success",
        title: isEditMode ? "แก้ไขสำเร็จ" : "บันทึกสำเร็จ",
        text: `ข้อมูล ${selectedTitle} ${fullname} ถูก${isEditMode ? 'แก้ไข' : 'บันทึก'}เรียบร้อยแล้ว`,
        confirmButtonText: "ตกลง",
      }).then(() => {
        navigate("/assistance-list");
      });
    } else {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: res?.data?.error || `ไม่สามารถ${isEditMode ? 'แก้ไข' : 'บันทึก'}ข้อมูลได้`,
      });
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-10 font-sarabun grid grid-cols-1 md:grid-cols-2 gap-y-14 gap-x-12 w-full mt-20 bg-white"
    >
      {/* Header */}
      <div className="col-span-1 md:col-span-2">
        <h2 className="text-xl font-bold text-[#f26522] mb-4">
          {isEditMode ? 'แก้ไขข้อมูลผู้ช่วยสอน' : 'เพิ่มผู้ช่วยสอนใหม่'}
        </h2>
      </div>

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
      <div className="col-span-1 md:col-span-2 flex justify-end gap-4 mt-6">
        <button
          type="button"
          onClick={() => navigate("/assistance-list")}
          className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
        >
          ยกเลิก
        </button>
        <button
          type="submit"
          className="bg-[#f26522] text-white px-6 py-2 rounded hover:bg-[#d9531e]"
        >
          {isEditMode ? 'แก้ไข' : 'บันทึก'}
        </button>
      </div>
    </form>
  );
};

export default ManageAssistance;
