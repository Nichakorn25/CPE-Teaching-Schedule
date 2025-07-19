import React, { useState, useEffect } from "react";


import {
  postCreateCourse,
  getTypeofCourse,
  getTeachers,
} from "../../../services/https/AdminPageServices";
import {
  getAllAcademicYears,
  getAllCurriculum,
  getMajorOfDepathment,
} from "../../../services/https/GetService";
import {
  CurriculumInterface,
  AcademicYearInterface,
  CreateCourseInteface,
  MajorInterface,
  DepartmentInterface,
  AllTeacher,
} from "../../../interfaces/Adminpage";


const ManageCourse: React.FC = () => {
  const [majors, setMajors] = useState<MajorInterface[]>([]);
  const [departments, setDepartments] = useState<DepartmentInterface[]>([]);
  const [selectedDepartmentID, setSelectedDepartmentID] = useState<number>(0);
  const [filteredMajors, setFilteredMajors] = useState<MajorInterface[]>([]);
  const [selectedMajorID, setSelectedMajorID] = useState<number>(0);
  const [allTeachers, setAllTeachers] = useState<AllTeacher[]>([]);
  const [teacherOptions, setTeacherOptions] = useState<AllTeacher[]>([]);
  const [teachers, setTeachers] = useState<AllTeacher[]>([]);
  const [curriculums, setCurriculums] = useState<CurriculumInterface[]>([]);
  const [selectedCurriculum, setSelectedCurriculum] =
    useState<CurriculumInterface | null>(null);
  const [academicYears, setAcademicYears] = useState<AcademicYearInterface[]>(
    []
  );
  const [selectedAcademicYear, setSelectedAcademicYear] =
    useState<AcademicYearInterface | null>(null);

  const [courseType, setCourseType] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [credit, setCredit] = useState("");
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
    const fetchData = async () => {
      const curriculum = await getAllCurriculum();
      const years = await getAllAcademicYears();
      setCurriculums(curriculum.data);
      setAcademicYears(years.data);
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchTypes = async () => {
      const result = await getTypeofCourse();
      console.log(result);
      setTypeOfCoursesList(result.data);
    };
    fetchTypes();
  }, []);

  useEffect(() => {
    const fetchMajors = async () => {
      const res = await getMajorOfDepathment();
      if (res.status === 200 && Array.isArray(res.data)) {
        const majorData = res.data as MajorInterface[];
        setMajors(majorData);

        const uniqueDepartments = Array.from(
          new Map(
            majorData.map((m) => [m.Department.ID, m.Department])
          ).values()
        );

        setDepartments(uniqueDepartments); // ไม่มี error แล้ว
      }
    };
    fetchMajors();
  }, []);

  useEffect(() => {
    const filtered = majors.filter(
      (m) => m.Department.ID === selectedDepartmentID
    );
    setFilteredMajors(filtered);
    setSelectedMajorID(0); // reset major เมื่อเปลี่ยนสำนักวิชา
  }, [selectedDepartmentID, majors]);

  useEffect(() => {
    const fetchTeachers = async () => {
      if (selectedMajorID === 0) {
        setAllTeachers([]);
        setTeacherOptions([]);
        return;
      }
      const res = await getTeachers();
      if (res.status === 200) {
        setAllTeachers(res.data);
        setTeacherOptions(res.data); // <- เพิ่มบรรทัดนี้
      }
    };
    fetchTeachers();
  }, [selectedMajorID]);

  const addTeacher = () => {
    setTeachers([
      ...teachers,
      {
        ID: 0,
        DeleteID: 0,
        Title: "",
        FirstName: "",
        LastName: "",
        Email: "",
        EmpId: "",
        Department: "",
        Major: "",
        Position: "",
        Status: "",
        Role: "",
      },
    ]);
  };

  // const addAssistant = () => {
  //   const nextId = assistants.length + 1;
  //   setAssistants([
  //     ...assistants,
  //     { id: nextId, title: "", firstName: "", lastName: "" },
  //   ]);
  // };

  const removeTeacher = (id: number) => {
    setTeachers(teachers.filter((t) => t.ID !== id));
  };

  // const removeAssistant = (id: number) => {
  //   setAssistants(assistants.filter((a) => a.id !== id));
  // };

  const isFormValid = () => {
    if (
      !curriculums ||
      !courseType ||
      !courseCode ||
      !credit ||
      !thaiName ||
      !englishName
    )
      return false;
    if (!hours.lecture || !hours.practice || !hours.selfStudy) return false;

    for (const teacher of teachers) {
      if (!teacher.Title || !teacher.FirstName || !teacher.LastName)
        return false;
    }

    // for (const assistant of assistants) {
    //   if (!assistant.title || !assistant.firstName || !assistant.lastName)
    //     return false;
    // }

    return true;
  };

  const handleSubmit = async () => {
    if (!selectedCurriculum || !selectedAcademicYear) return;

    const data: CreateCourseInteface = {
      Code: courseCode,
      EnglishName: englishName,
      ThaiName: thaiName,
      CurriculumID: selectedCurriculum.ID,
      AcademicYearID: selectedAcademicYear.ID,
      TypeOfCoursesID: parseInt(courseType),
      CreditID: parseInt(credit),
      Lecture: parseInt(hours.lecture),
      Lab: parseInt(hours.practice),
      Self: parseInt(hours.selfStudy),
      UserIDs: teachers.map((t) => t.ID).filter((id) => id && id !== 0),
    };

    const response = await postCreateCourse(data);

    if (response.status === 200) {
      alert("เพิ่มรายวิชาเรียบร้อย");
    } else {
      alert("เกิดข้อผิดพลาดในการเพิ่มรายวิชา");
      console.error(response.data);
    }
  };

  return (
    <>
      <div className="pt-16 px-6 font-sarabun">
        <form className="w-full p-10 space-y-10 bg-white">
          <div>
            <label className="text-[#f26522] font-medium text-xl">
              โครงสร้างหลักสูตร
            </label>
            <select
              className="border px-3 py-2 rounded w-full"
              value={selectedCurriculum?.ID || ""}
              onChange={(e) => {
                const found = curriculums.find(
                  (c) => c.ID === Number(e.target.value)
                );
                if (found) setSelectedCurriculum(found);
              }}
            >
              <option value="">-- กรุณาเลือก --</option>
              {curriculums.map((c) => (
                <option key={c.ID} value={c.ID}>
                  {`${c.CurriculumName}`}
                </option>
              ))}
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
                  value={selectedAcademicYear?.ID || ""}
                  onChange={(e) => {
                    const found = academicYears.find(
                      (a) => a.ID === Number(e.target.value)
                    );
                    if (found) setSelectedAcademicYear(found);
                  }}
                >
                  <option value="">-- กรุณาเลือก --</option>
                  {academicYears.map((a) => (
                    <option key={a.ID} value={a.ID}>
                      {a.Level}
                    </option>
                  ))}
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

          <div>
            <label className="text-[#f26522] font-medium text-xl block mb-2">
              สำนักวิชา
            </label>
            <select
              className="border px-3 py-2 rounded w-full"
              value={selectedDepartmentID || ""}
              onChange={(e) => setSelectedDepartmentID(Number(e.target.value))}
            >
              <option value="">-- กรุณาเลือก --</option>
              {departments.map((d) => (
                <option key={d.ID} value={d.ID}>
                  {d.DepartmentName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[#f26522] font-medium text-xl block mb-2">
              สาขา
            </label>
            <select
              className="border px-3 py-2 rounded w-full"
              value={selectedMajorID || ""}
              onChange={(e) => setSelectedMajorID(Number(e.target.value))}
            >
              <option value="">-- กรุณาเลือก --</option>
              {filteredMajors.map((m) => (
                <option key={m.ID} value={m.ID}>
                  {m.MajorName}
                </option>
              ))}
            </select>
          </div>

          {/* อาจารย์ผู้สอน */}
          <div className="space-y-4">
            <h2 className="text-orange-500 font-semibold text-xl">
              เพิ่มอาจารย์ผู้สอน
            </h2>

            {teachers.map((t, index) => (
              <div key={index} className="grid grid-cols-12 gap-4 items-center">
                <div className="w-8 h-8 bg-[#f26522] text-white rounded-full flex items-center justify-center font-semibold text-sm">
                  {index + 1}
                </div>

                <div className="col-span-10">
                  <select
                    className="border px-3 py-2 rounded w-full"
                    value={t.ID || ""}
                    onChange={(e) => {
                      const selectedId = Number(e.target.value);
                      const selected = teacherOptions.find(
                        (opt) => opt.ID === selectedId
                      );
                      if (!selected) return;

                      const updatedTeachers = [...teachers];
                      updatedTeachers[index] = selected;
                      setTeachers(updatedTeachers);
                    }}
                  >
                    <option value="">-- เลือกอาจารย์ --</option>
                    {teacherOptions.map((teacher) => (
                      <option key={teacher.ID} value={teacher.ID}>
                        {`${teacher.Title} ${teacher.FirstName} ${teacher.LastName}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-1 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setTeachers(teachers.filter((_, i) => i !== index));
                    }}
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
          {/* <div className="space-y-4">
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
          </div> */}

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
