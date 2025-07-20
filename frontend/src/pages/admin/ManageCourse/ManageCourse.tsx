import React, { useState, useEffect } from "react";
import {
  postCreateCourse,
  getTypeofCourse,
  getTeachers,
  getCoursebyid,
  putUpdateCourse,
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
  CourseType,
} from "../../../interfaces/Adminpage";
import Swal from "sweetalert2";
import { useParams } from "react-router-dom";

const ManageCourse: React.FC = () => {
  const { id } = useParams();
  const [majors, setMajors] = useState<MajorInterface[]>([]);
  const [departments, setDepartments] = useState<DepartmentInterface[]>([]);
  const [selectedDepartmentID, setSelectedDepartmentID] = useState<number>(0);
  const [filteredMajors, setFilteredMajors] = useState<MajorInterface[]>([]);
  const [selectedMajorName, setSelectedMajorName] = useState("");
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
  const [typeOfCoursesList, setTypeOfCoursesList] = useState<CourseType[]>([]);

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
      console.log("result", res.data);

      if (res.status === 200) {
        const all = res.data;

        //กรองเฉพาะอาจารย์ที่มี MajorID ตรงกับ selectedMajorID
        const filtered = all.filter(
          (teacher) => teacher.MajorID === selectedMajorID
        );

        setAllTeachers(filtered);
        setTeacherOptions(filtered);
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
        Firstname: "",
        Lastname: "",
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

  const removeTeacher = (id: number) => {
    setTeachers(teachers.filter((t) => t.ID !== id));
  };

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
      if (!teacher.Title || !teacher.Firstname || !teacher.Lastname)
        return false;
    }
    return true;
  };

  useEffect(() => {
    const fetchCourseData = async () => {
      if (!id) return;
      const res = await getCoursebyid(Number(id));
      console.log("rftyghuij", res.data);

      if (res.status === 200 && res.data) {
        const data = res.data;

        setCourseCode(data.Code || "");
        setThaiName(data.ThaiName || "");
        setEnglishName(data.EnglishName || "");
        setCredit(data.Credit.Unit ? data.Credit.Unit.toString() : "");
        setCourseType(
          data.TypeOfCoursesID ? data.TypeOfCoursesID.toString() : ""
        );
        setHours({
          lecture: data.Credit.Lecture ? data.Credit.Lecture.toString() : "",
          practice: data.Credit.Lab ? data.Credit.Lab.toString() : "",
          selfStudy: data.Credit.Self ? data.Credit.Self.toString() : "",
        });

        // ตั้ง selectedCurriculum
        const foundCurriculum = curriculums.find(
          (c) => c.ID === data.CurriculumID
        );
        if (foundCurriculum) setSelectedCurriculum(foundCurriculum);

        // ตั้ง selectedAcademicYear
        const foundAcademicYear = academicYears.find(
          (a) => a.ID === data.AcademicYearID
        );
        if (foundAcademicYear) setSelectedAcademicYear(foundAcademicYear);

        // รอ majors โหลดก่อนค่อยตั้ง selectedDepartmentID และ selectedMajorID
        const foundMajor = majors.find(
          (m) => m.ID === data.Curriculum?.Major?.ID
        );
        if (foundMajor) {
          setSelectedDepartmentID(foundMajor.Department.ID);
          setSelectedMajorID(foundMajor.ID);
          setSelectedMajorName(foundMajor.MajorName);
        }

        // อาจารย์ผู้สอน (ตั้ง teachers ถ้ามี)
        // ถ้าข้อมูลผู้สอนมาจาก backend เช่น data.teachers
        if (data.UserAllCourses && Array.isArray(data.UserAllCourses)) {
          const fullTeacherObjects = data.UserAllCourses.map(
            (item) => item.User
          ).filter((user) => !!user); // ตัด null
          setTeachers(fullTeacherObjects); //ไม่ใช่ชื่ออย่างเดียว แต่เป็น object เต็ม
        }
      }
    };

    // เรียก fetchUser ก็ต่อเมื่อ majors, curriculums, academicYears โหลดแล้ว
    if (
      majors.length > 0 &&
      curriculums.length > 0 &&
      academicYears.length > 0
    ) {
      fetchCourseData();
    }
  }, [id, majors, curriculums, academicYears]);

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

    console.log("ส่งไปยัง backend", data);

    try {
      const response = await postCreateCourse(data);
      if (response.status === 200) {
        Swal.fire({
          icon: "success",
          title: "เพิ่มรายวิชาเรียบร้อย",
          showConfirmButton: false,
          timer: 1500,
        });
      }
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาดในการเพิ่มรายวิชา",
        text: error?.response?.data?.message || "ไม่สามารถเพิ่มรายวิชาได้",
      });
      console.error("Error submitting course", error);
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
              value={(selectedCurriculum?.ID ?? "").toString()}
              onChange={(e) => {
                const found = curriculums.find(
                  (c) => c.ID === Number(e.target.value)
                );
                if (found) setSelectedCurriculum(found);
              }}
            >
              <option value="">-- กรุณาเลือก --</option>
              {curriculums.map((c) => (
                <option key={c.ID} value={c.ID.toString()}>
                  {c.CurriculumName}
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
                    <option key={type.ID} value={type.ID}>
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
                <option value="5">5</option>
                <option value="6">6</option>
                <option value="7">7</option>
                <option value="8">8</option>
                <option value="9">9</option>
                <option value="10">10</option>
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
                      <option value="5">5</option>
                      <option value="6">6</option>
                      <option value="7">7</option>
                      <option value="8">8</option>
                      <option value="9">9</option>
                      <option value="10">10</option>
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
                    {teacherOptions.map((teacher) => {
                      const titleStr =
                        typeof teacher.Title === "string"
                          ? teacher.Title
                          : teacher.Title?.Title || "";

                      return (
                        <option key={teacher.ID} value={teacher.ID}>
                          {`${titleStr} ${teacher.Firstname} ${teacher.Lastname}`}
                        </option>
                      );
                    })}
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
              type="submit"
              onClick={(e) => {
                e.preventDefault(); // ป้องกัน form reload
                handleSubmit();
              }}
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
