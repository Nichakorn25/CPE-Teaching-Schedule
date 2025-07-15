import React, { useState, useEffect } from "react";
import Sidebar from "../../../components/schedule-sidebar/Sidebar";
import Header from "../../../components/header/Header";
import { postCreateCourse } from "../../../services/https/AdminPageServices";
import { getTypeofCourse } from "../../../services/https/AdminPageServices";

const ManageCourse: React.FC = () => {
  const [teachers, setTeachers] = useState([
    { id: 1, title: "ผศ.ดร.", firstName: "นันทวุฒิ", lastName: "คะอังกุ" },
    { id: 2, title: "ผศ.ดร.", firstName: "ศรัญญา", lastName: "กาญจนวัฒนา" },
  ]);

  const [assistants, setAssistants] = useState([
    { id: 1, title: "นาย", firstName: "ธนวัฒน์", lastName: "สีแก้วสิ่ว" },
    { id: 2, title: "นาย", firstName: "ภูวดล", lastName: "เดชารัมย์" },
  ]);

  const [courseStructure, setCourseStructure] = useState(
    "10705001165 วิศวกรรมคอมพิวเตอร์ 2565"
  );
  const [courseType, setCourseType] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [credit, setCredit] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [hours, setHours] = useState({
    lecture: "",
    practice: "",
    selfStudy: "",
  });
  const [thaiName, setThaiName] = useState("");
  const [englishName, setEnglishName] = useState("");
  const [typeOfCoursesList, setTypeOfCoursesList] = useState<
    { id: number; TypeName: string }[]
  >([]);

  useEffect(() => {
    const fetchTypes = async () => {
      const result = await getTypeofCourse();
      console.log(result);
      setTypeOfCoursesList(result.data);
    };
    fetchTypes();
  }, []);

  const addTeacher = () => {
    const nextId = teachers.length + 1;
    setTeachers([
      ...teachers,
      { id: nextId, title: "", firstName: "", lastName: "" },
    ]);
  };

  const addAssistant = () => {
    const nextId = assistants.length + 1;
    setAssistants([
      ...assistants,
      { id: nextId, title: "", firstName: "", lastName: "" },
    ]);
  };

  const removeTeacher = (id: number) => {
    setTeachers(teachers.filter((t) => t.id !== id));
  };

  const removeAssistant = (id: number) => {
    setAssistants(assistants.filter((a) => a.id !== id));
  };

  const isFormValid = () => {
    if (
      !courseStructure ||
      !courseType ||
      !courseCode ||
      !credit ||
      !thaiName ||
      !englishName
    )
      return false;
    if (!hours.lecture || !hours.practice || !hours.selfStudy) return false;

    for (const teacher of teachers) {
      if (!teacher.title || !teacher.firstName || !teacher.lastName)
        return false;
    }

    for (const assistant of assistants) {
      if (!assistant.title || !assistant.firstName || !assistant.lastName)
        return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    const data = {
      Code: courseCode,
      EnglishName: englishName,
      ThaiName: thaiName,
      CurriculumID: 1, // สมมุติเป็น ID จริง (ดึงจากระบบ)
      AcademicYearID: 1, // ปี 2565 เป็นต้น
      TypeOfCoursesID: parseInt(courseType),
      CreditID: 1, // ต้อง match กับฐานข้อมูล
      UserIDs: teachers.map((t) => t.id), // ใช้ id จริงของอาจารย์จากระบบ
    };

    const response = await postCreateCourse(data);

    if (response.status === 200) {
      alert("เพิ่มรายวิชาเรียบร้อย");
      // รีเซ็ตฟอร์มหรือ redirect ได้
    } else {
      alert("เกิดข้อผิดพลาดในการเพิ่มรายวิชา");
      console.error(response.data);
    }
  };

  return (
    <>
      <Header />
      <Sidebar />
      <div className="pt-16 px-6 font-sarabun">
        <form className="w-full p-10 space-y-10 bg-white">
          <div>
            <label className="text-[#f26522] font-medium text-xl">
              โครงสร้างหลักสูตร
            </label>
            <select
              className="border px-3 py-2 rounded w-full"
              value={courseStructure}
              onChange={(e) => setCourseStructure(e.target.value)}
            >
              <option>10705001165 วิศวกรรมคอมพิวเตอร์ 2565</option>
            </select>
          </div>

          <div className="flex justify-center px-4 md:px-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-6xl w-full">
              <div>
                <label className="text-[#f26522] font-medium text-xl block mb-2">
                  หมวดวิชา
                </label>
                <select
                  className="border px-3 py-2 rounded w-full"
                  value={courseType}
                  onChange={(e) => setCourseType(e.target.value)}
                >
                  <option value="">-- กรุณาเลือก --</option>
                  {typeOfCoursesList.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.TypeName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[#f26522] font-medium text-xl block mb-2">
                  รหัสวิชา
                </label>
                <input
                  className="border px-3 py-2 rounded w-[100%]"
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                />
              </div>
              <div>
                <label className="text-[#f26522] font-medium text-xl block mb-2">
                  ชั้นปีที่สามารถเรียนได้
                </label>
                <select
                  className="border px-3 py-2 rounded w-full"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                >
                  <option value="0">ทุกชั้นปี</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div>
              <label className="text-[#f26522] font-medium text-xl block mb-2">
                หน่วยกิต
              </label>
              <select
                className="border px-3 py-2 rounded w-full"
                value={credit}
                onChange={(e) => setCredit(e.target.value)}
              >
                <option value="">--</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
              </select>
            </div>
            <div>
              <label className="text-[#f26522] font-medium text-xl block mb-2">
                รูปแบบชั่วโมงการสอน
              </label>
              <div className="grid grid-cols-3 gap-4 text-center">
                {[
                  { label: "บรรยาย", key: "lecture" },
                  { label: "ปฏิบัติ", key: "practice" },
                  { label: "เรียนรู้ด้วยตนเอง", key: "selfStudy" },
                ].map(({ label, key }) => (
                  <div key={key}>
                    <div className="text-[#f26522] font-medium mb-1">
                      {label}
                    </div>
                    <select
                      className="border px-3 py-2 rounded-full w-20 mx-auto text-center"
                      value={hours[key as keyof typeof hours]}
                      onChange={(e) =>
                        setHours({ ...hours, [key]: e.target.value })
                      }
                    >
                      <option value="">--</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div>
              <label className="text-[#f26522] font-medium text-xl">
                ชื่อวิชา-ภาษาไทย
              </label>
              <input
                className="border px-3 py-2 rounded w-full"
                value={thaiName}
                onChange={(e) => setThaiName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[#f26522] font-medium text-xl">
                ชื่อวิชา-ภาษาอังกฤษ
              </label>
              <input
                className="border px-3 py-2 rounded w-full"
                value={englishName}
                onChange={(e) => setEnglishName(e.target.value)}
              />
            </div>
          </div>

          {/* อาจารย์ผู้สอน */}
          <div className="space-y-4">
            <h2 className="text-orange-500 font-semibold text-xl">
              เพิ่มอาจารย์ผู้สอน
            </h2>
            {teachers.map((t, index) => (
              <div key={t.id} className="grid grid-cols-12 gap-4 items-center">
                <div className="w-8 h-8 bg-[#f26522] text-white rounded-full flex items-center justify-center font-semibold text-sm">
                  {index + 1}
                </div>
                <div className="col-span-2">
                  <select className="border px-3 py-2 rounded w-full">
                    <option>รศ.ดร.</option>
                    <option>อ.ดร.</option>
                    <option>ผศ.ดร.</option>
                  </select>
                </div>
                <div className="col-span-4">
                  <input
                    className="border px-3 py-2 rounded w-full"
                    defaultValue={t.firstName}
                    placeholder="ชื่อ"
                  />
                </div>
                <div className="col-span-4">
                  <input
                    className="border px-3 py-2 rounded w-full"
                    defaultValue={t.lastName}
                    placeholder="นามสกุล"
                  />
                </div>
                <div className="col-span-1 text-center">
                  <button
                    type="button"
                    onClick={() => removeTeacher(t.id)}
                    className="bg-red-500 text-white px-6 py-2 rounded hover:bg-orange-600"
                  >
                    ลบ
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addTeacher}
              className="bg-orange-500 text-white px-6 py-2 rounded hover:bg-orange-600"
            >
              + เพิ่มอาจารย์ผู้สอน
            </button>
          </div>

          {/* ผู้ช่วยสอน */}
          <div className="space-y-4">
            <h2 className="text-orange-500 font-semibold text-xl">
              เพิ่มผู้ช่วยสอน
            </h2>
            {assistants.map((a, index) => (
              <div key={a.id} className="grid grid-cols-12 gap-4 items-center">
                <div className="w-8 h-8 bg-[#f26522] text-white rounded-full flex items-center justify-center font-semibold text-sm">
                  {index + 1}
                </div>
                <div className="col-span-2">
                  <select className="border px-3 py-2 rounded w-full">
                    <option>นาย</option>
                    <option>นางสาว</option>
                  </select>
                </div>
                <div className="col-span-3">
                  <input
                    className="border px-3 py-2 rounded w-full"
                    defaultValue={a.firstName}
                    placeholder="ชื่อ"
                  />
                </div>
                <div className="col-span-4">
                  <input
                    className="border px-3 py-2 rounded w-full"
                    defaultValue={a.lastName}
                    placeholder="นามสกุล"
                  />
                </div>
                <div className="col-span-2 text-center">
                  <button
                    type="button"
                    onClick={() => removeAssistant(a.id)}
                    className="bg-red-500 text-white px-6 py-2 rounded hover:bg-orange-600"
                  >
                    ลบ
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addAssistant}
              className="bg-orange-500 text-white px-6 py-2 rounded hover:bg-orange-600"
            >
              + เพิ่มผู้ช่วยสอน
            </button>
          </div>

          {/* ปุ่มบันทึก */}
          <div className="text-right">
            <button
              onClick={handleSubmit}
              disabled={!isFormValid()}
              className={`px-6 py-2 rounded text-white ${
                isFormValid()
                  ? "bg-orange-500 hover:bg-orange-600"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              บันทึก
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default ManageCourse;
