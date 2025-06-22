import React, { useState } from "react";
import { FaSearch } from "react-icons/fa";
import Header from "../../../components/header/Header";

interface Course {
  id: number;
  code: string;
  name: string;
  credit: string;
  category: string;
  teacher: string;
  room: string;
  group: string;
  day: string;
  time: string;
  groupCount: number;
  studentPerGroup: number;
  note?: string;
}

const OpenCourse: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [academicYear, setAcademicYear] = useState("2567");
  const [semester, setSemester] = useState("3");
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const courseData: Course[] = [
    {
      id: 1,
      code: "IST20 1001",
      name: "DIGITAL LITERACY",
      credit: "2(2–0–4)",
      category: "หมวดวิชาศึกษาทั่วไป",
      teacher: "อ.ดร.ปราโมทย์ ภักดีณรงค์",
      room: "B4101",
      group: "1",
      day: "จันทร์",
      time: "13:00–15:00",
      groupCount: 1,
      studentPerGroup: 1500,
      note: "วิชาจากศูนย์บริการ",
    },
    {
      id: 2,
      code: "IST20 1502",
      name: "ART APPRECIATION",
      credit: "2(2–0–4)",
      category: "หมวดวิชาศึกษาทั่วไป",
      teacher: "อ.ดร.ปราโมทย์ ภักดีณรงค์",
      room: "B4101",
      group: "1",
      day: "พุธ",
      time: "17:00–19:00",
      groupCount: 1,
      studentPerGroup: 1500,
      note: "วิชาจากศูนย์บริการ",
    },
    {
      id: 3,
      code: "ENG323 3017",
      name: "INTRODUCTION TO DATA ENGINEERING",
      credit: "4(3–3–9)",
      category: "หมวดวิชาเฉพาะ",
      teacher: "รศ.ดร.ศรัญญา กาญจนวัฒนา",
      room: "DIGITAL TECH LAB 01",
      group: "1",
      day: "",
      time: "",
      groupCount: 1,
      studentPerGroup: 45,
    },
    ...Array.from({ length: 24 }, (_, i) => {
      const groupNumber = i + 1;
      return {
        id: 4 + i,
        code: "ENG323 2001",
        name: "COMPUTER PROGRAMMING 1",
        credit: "2(1–3–5)",
        category: "หมวดวิชาเฉพาะ",
        teacher: "รศ.ดร.ศรัญญา กาญจนวัฒนา",
        room: `DIGITAL TECH LAB ${String(groupNumber).padStart(2, "0")}`,
        group: `${groupNumber}`,
        day: groupNumber === 9 ? "พุธ" : groupNumber === 24 ? "พฤหัสบดี" : "",
        time: groupNumber === 9 || groupNumber === 24 ? "16:00–19:00" : "",
        groupCount: 30,
        studentPerGroup: 45,
        note: groupNumber === 9 ? "วิชาจากศูนย์บริการ" : "",
      };
    }),
  ];

  const filteredData = courseData.filter((course) =>
    course.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedCourses = filteredData.reduce<Record<string, Course[]>>(
    (acc, course) => {
      if (!acc[course.code]) acc[course.code] = [];
      acc[course.code].push(course);
      return acc;
    },
    {}
  );

  return (
    <div className="p-6 font-sarabun mt-10">
      <Header />
      {/* Filters */}
      <div className="flex flex-wrap justify-between items-center gap-4 bg-[#f5f5f5] p-4 rounded-md mb-4">

        <div className="flex items-center border border-black rounded px-2 py-1">
          <input
            type="text"
            placeholder="ค้นหารายวิชา"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="outline-none text-sm w-40"
          />
          <button className="text-black ml-2 text-lg">
            <FaSearch />
          </button>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <span>รายการที่แสดง</span>
          <select
            value={perPage}
            onChange={(e) => setPerPage(Number(e.target.value))}
            className="border border-black rounded px-2 py-1"
          >
            <option>10</option>
            <option>20</option>
          </select>
        </div>

        <div className="flex items-center gap-2 text-sm">
          {[1, 2, 3, 4, 5].map((page) => (
            <button
              key={page}
              className={`w-7 h-7 rounded ${
                page === currentPage
                  ? "bg-orange-500 text-white"
                  : "hover:underline"
              }`}
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </button>
          ))}
          <span>... 7</span>
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            className="hover:underline"
          >
            ถัดไป
          </button>
        </div>

        <select
          value={academicYear}
          onChange={(e) => setAcademicYear(e.target.value)}
          className="border border-black rounded px-3 py-1 text-sm"
        >
          <option>2567</option>
          <option>2566</option>
        </select>

        <select
          value={semester}
          onChange={(e) => setSemester(e.target.value)}
          className="border border-black rounded px-3 py-1 text-sm"
        >
          <option>1</option>
          <option>2</option>
          <option>3</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white shadow rounded-lg">
        <table className="min-w-full border text-sm text-center">
          <thead className="bg-gray-100 text-[#5d7285]">
            <tr>
              <th className="border p-2">ลำดับ</th>
              <th className="border p-2">รหัสวิชา</th>
              <th className="border p-2">ชื่อวิชา</th>
              <th className="border p-2">หน่วยกิต</th>
              <th className="border p-2">หมวดวิชา</th>
              <th className="border p-2">อาจารย์ผู้สอน</th>
              <th className="border p-2">ห้องเรียน</th>
              <th className="border p-2">กลุ่ม</th>
              <th className="border p-2">วัน</th>
              <th className="border p-2">เวลา</th>
              <th className="border p-2">จำนวนกลุ่ม</th>
              <th className="border p-2">นักศึกษาต่อกลุ่ม</th>
              <th className="border p-2">หมายเหตุ</th>
              <th className="border p-2">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(groupedCourses).map(([code, group]) =>
              group.map((course, index) => (
                <tr key={`${course.code}-${course.group}`} className="border-t">
                  {index === 0 && (
                    <>
                      <td className="border p-2" rowSpan={group.length}>
                        {course.id}
                      </td>
                      <td className="border p-2" rowSpan={group.length}>
                        {course.code}
                      </td>
                      <td className="border p-2" rowSpan={group.length}>
                        {course.name}
                      </td>
                      <td className="border p-2" rowSpan={group.length}>
                        {course.credit}
                      </td>
                      <td className="border p-2" rowSpan={group.length}>
                        {course.category}
                      </td>
                      <td className="border p-2" rowSpan={group.length}>
                        {course.teacher}
                      </td>
                    </>
                  )}

                  <td className="border p-2">{course.room}</td>
                  <td className="border p-2">{course.group}</td>

                  {index === 0 && (
                    <>
                      <td className="border p-2" rowSpan={group.length}>
                        {course.day || "-"}
                      </td>
                      <td className="border p-2" rowSpan={group.length}>
                        {course.time || "-"}
                      </td>
                      <td className="border p-2" rowSpan={group.length}>
                        {course.groupCount}
                      </td>
                      <td className="border p-2" rowSpan={group.length}>
                        {course.studentPerGroup}
                      </td>
                      <td className="border p-2" rowSpan={group.length}>
                        {course.note || "-"}
                      </td>
                      <td className="border p-2" rowSpan={group.length}>
                        <div className="flex justify-center gap-2">
                          <button className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-sm">
                            แก้ไข
                          </button>
                          <button className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm">
                            ลบ
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OpenCourse;
