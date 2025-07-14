import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../../../components/header/Header";
import {
  getAllTitle,
  getAllPosition,
  getMajorOfDepathment,
  getAllRoles,
} from "../../../services/https/GetService";
import {
  Alltitles,
  Allposition,
  CreateUserInterface,
  DepartmentInterface,
  MajorInterface,
  AllRoleInterface,
} from "../../../interfaces/Adminpage";
import {
  postCreateUser,
  putUpdateUser,
  getUserById,
} from "../../../services/https/AdminPageServices";
import Swal from "sweetalert2";

const ManageTeacher: React.FC = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState<Alltitles[]>([]);
  const [position, setPosition] = useState<Allposition[]>([]);
  const [roles, setRole] = useState<AllRoleInterface[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [departments, setDepartments] = useState<DepartmentInterface[]>([]);
  const [majors, setMajors] = useState<MajorInterface[]>([]);
  const [selectedDepartmentID, setSelectedDepartmentID] = useState<number>(0);
  const { id } = useParams();

  const filteredMajors = majors.filter(
    (m) => m.DepartmentID === selectedDepartmentID
  );

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
        console.log("ไม่สามารถโหลดตำแหน่งได้", positionResponse);
      }

      const majorResponse = await getMajorOfDepathment();
      if (majorResponse.status === 200 && Array.isArray(majorResponse.data)) {
        setMajors(majorResponse.data);
        // เก็บ department แยกจาก major
        const uniqueDepartments = Array.from(
          new Map(
            majorResponse.data.map((m: MajorInterface) => [
              m.Department.ID,
              m.Department,
            ])
          ).values()
        ) as DepartmentInterface[]; //ใส่ type

        setDepartments(uniqueDepartments);
      } else {
        console.error("โหลด major ล้มเหลว", majorResponse);
      }

      const roleResponse = await getAllRoles();
      if (roleResponse.status == 200 && Array.isArray(roleResponse.data)) {
        setRole(roleResponse.data);
      } else {
        console.log("ไม่สามารถโหลดบทบาทได้", roleResponse);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      if (!id) return;
      const res = await getUserById(id);

      console.log("👉 User Data", res.data); // ช่วย debug ได้

      if (res.status === 200 && res.data) {
        const data = res.data;

        setForm({
          Username: data.username,
          Password: "****", // ไม่ต้องโชว์รหัสจริง
          Firstname: data.firstname,
          Lastname: data.lastname,
          Image: data.image || "",
          Email: data.email,
          PhoneNumber: data.phone_number,
          Address: data.address || "",
          TitleID: Number(data.title_id),
          PositionID: Number(data.position_id),
          MajorID: Number(data.major_id),
          RoleID: Number(data.role_id),
        });

        // ✅ ค้นหา Major เพื่อ set DepartmentID
        const foundMajor = majors.find((m) => m.ID === Number(data.major_id));
        setSelectedDepartmentID(foundMajor?.DepartmentID || 0);

        setImagePreview(data.image || null);
      } else {
        console.error("ไม่สามารถโหลดข้อมูลผู้ใช้ได้", res);
      }
    };

    fetchUser();
  }, [id, majors]);

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

  const handleUpdate = async () => {
    const selectedTitle = title.find((t) => t.ID === form.TitleID)?.Title || "";
    const fullname = `${form.Firstname} ${form.Lastname}`;

    const result = await Swal.fire({
      title: "ยืนยันการแก้ไข",
      text: `คุณต้องการอัปเดตข้อมูล ${selectedTitle} ${fullname} หรือไม่?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#f26522",
      cancelButtonColor: "#d33",
      confirmButtonText: "ตกลง",
      cancelButtonText: "ยกเลิก",
    });

    if (!result.isConfirmed) return;

    const response = await putUpdateUser(Number(id), form);

    if (response.status === 200) {
      Swal.fire({
        icon: "success",
        title: "อัปเดตสำเร็จ",
        text: `อัปเดตข้อมูลของ ${fullname} เสร็จสิ้น`,
        confirmButtonText: "ตกลง",
      }).then(() => {
        navigate("/teacher-list");
      });
    } else {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: response.data?.error || "ไม่สามารถอัปเดตข้อมูลได้",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const selectedTitle = title.find((t) => t.ID === form.TitleID)?.Title || "";
    const fullname = `${form.Firstname} ${form.Lastname}`;

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

    if (id) {
      await handleUpdate(); // 🔁 กำลังแก้ไข
      return;
    }

    // ➕ เพิ่มใหม่
    const result = await Swal.fire({
      title: "ยืนยันการบันทึก",
      text: `คุณต้องการบันทึกข้อมูล ${selectedTitle} ${fullname} หรือไม่?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#f26522",
      cancelButtonColor: "#d33",
      confirmButtonText: "ตกลง",
      cancelButtonText: "ยกเลิก",
    });

    if (!result.isConfirmed) return;

    const dataToSubmit: CreateUserInterface = {
      ...form,
      Address: form.Address || "N/A",
    };

    const res = await postCreateUser(dataToSubmit);

    if (res.status === 201 || res.status === 200) {
      Swal.fire({
        icon: "success",
        title: "บันทึกสำเร็จ",
        text: `ข้อมูล ${selectedTitle} ${fullname} ถูกบันทึกเรียบร้อยแล้ว`,
        confirmButtonText: "ตกลง",
      }).then(() => {
        navigate("/teacher-list");
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
          className="border border-orange-400 rounded px-3 py-2 text-sm"
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
          name="Firstname"
          value={form.Firstname}
          onChange={handleChange}
          className="border border-orange-400 rounded px-3 py-2 text-sm"
        />

        <label className="text-sm text-[#f26522]">คณะ/สำนักวิชา</label>
        <select
          value={selectedDepartmentID}
          onChange={(e) => setSelectedDepartmentID(Number(e.target.value))}
          className="border border-orange-400 rounded px-3 py-2 text-sm"
        >
          <option value={0}>-- เลือกคณะ --</option>
          {departments.map((d) => (
            <option key={d.ID} value={d.ID}>
              {d.DepartmentName}
            </option>
          ))}
        </select>

        <label className="text-sm text-[#f26522]">อีเมล</label>
        <input
          name="Email"
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
          className="border border-orange-400 rounded px-3 py-2 text-sm"
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
          name="Lastname"
          value={form.Lastname}
          onChange={handleChange}
          className="border border-orange-400 rounded px-3 py-2 text-sm"
        />

        <label className="text-sm text-[#f26522]">สาขาวิชา</label>
        <select
          name="MajorID"
          value={form.MajorID}
          onChange={(e) =>
            setForm({ ...form, MajorID: Number(e.target.value) })
          }
          className="border border-orange-400 rounded px-3 py-2 text-sm"
        >
          <option value={0}>-- เลือกสาขา --</option>
          {filteredMajors.map((m) => (
            <option key={m.ID} value={m.ID}>
              {m.MajorName}
            </option>
          ))}
        </select>

        <label className="text-sm text-[#f26522]">หมายเลขโทรศัพท์</label>
        <input
          name="PhoneNumber"
          value={form.PhoneNumber}
          onChange={handleChange}
          className="border border-orange-400 rounded px-3 py-2 text-sm font-bold"
        />

        <label className="text-sm text-[#f26522]">บทบาท</label>
        <select
          name="RoleID"
          value={form.RoleID}
          onChange={(e) => setForm({ ...form, RoleID: Number(e.target.value) })}
          className="border border-orange-400 rounded px-3 py-2 text-sm"
        >
          <option value={0}>-- เลือกบทบาท --</option>
          {roles.map((r) => (
            <option key={r.ID} value={r.ID}>
              {r.Role}
            </option>
          ))}
        </select>
      </div>

      {/* รหัสพนักงานและรหัสผ่าน แนวนอน ขนาดเท่ากัน */}
      <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
        <div className="flex flex-col">
          <label className="text-sm text-[#f26522]">รหัสพนักงาน</label>
          <input
            name="Username"
            value={form.Username}
            onChange={handleChange}
            className="border border-orange-400 rounded px-3 py-2 text-sm"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm text-[#f26522]">รหัสผ่าน</label>
          <input
            name="Password"
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
