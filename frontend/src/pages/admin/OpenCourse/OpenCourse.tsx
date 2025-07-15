import React, { useState, useEffect } from "react";
import { FaSearch } from "react-icons/fa";
import Header from "../../../components/header/Header";
import Sidebar from "../../../components/schedule-sidebar/Sidebar";
import { OpenCourseInterface } from "../../../interfaces/Adminpage";
import { getOpenCourses } from "../../../services/https/AdminPageServices";

const OpenCourse: React.FC = () => {
  const [courseData, setCourseData] = useState<OpenCourseInterface[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [semester, setSemester] = useState("");
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchOpenCourses = async () => {
    const response = await getOpenCourses();
    console.log(response)

    if (response.status === 200 && Array.isArray(response.data?.data)) {
      const mappedData: OpenCourseInterface[] = response.data.data.map(
        (item: any) => ({
          ID: item.ID,
          Year: item.Year,
          Term: item.Term,
          Code: item.Code,
          Name: item.Name,
          Credit: item.Credit,
          TypeName: item.TypeName,
          Teacher: item.Teacher,
          GroupInfos: item.GroupInfos || [],
          GroupTotal: item.GroupTotal,
          CapacityPer: item.CapacityPer,
          Remark: item.Remark,
          IsFixCourses: item.IsFixCourses,
        })
      );

      setCourseData(mappedData);
    } else {
      console.error("โหลดข้อมูลรายวิชาไม่สำเร็จ", response);
    }
  };

  useEffect(() => {
    fetchOpenCourses();
  }, []);

  const filteredCourses = courseData
  .filter((course) =>
    academicYear ? String(course.Year) === academicYear : true
  )
  .filter((course) =>
    semester ? String(course.Term) === semester : true
  )
  .filter((course) =>
    course.Name?.toLowerCase().includes(searchTerm.toLowerCase())
  );


  return (
     <>
      <Header />
      <Sidebar />
    <div className="p-6 font-sarabun mt-10">

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
              <th className="border p-2">จำนวนกลุ่ม</th>
              <th className="border p-2">นักศึกษาต่อกลุ่ม</th>
              <th className="border p-2">หมายเหตุ</th>
              <th className="border p-2">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {filteredCourses.map((course, index) => (
              <tr key={course.ID} className="border-t">
                <td className="border p-2">{index + 1}</td>
                <td className="border p-2">{course.Code || "-"}</td>
                <td className="border p-2">{course.Name || "-"}</td>
                <td className="border p-2">{course.Credit}</td>
                <td className="border p-2">{course.TypeName}</td>
                <td className="border p-2">{course.Teacher}</td>
                <td className="border p-2">{course.GroupTotal}</td>
                <td className="border p-2">{course.CapacityPer}</td>
                <td className="border p-2">{course.Remark || "-"}</td>
                <td className="border p-2">
                  <div className="flex justify-center gap-2">
                    <button className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-sm">
                      แก้ไข
                    </button>
                    <button className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm">
                      ลบ
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    </>
  );
};

export default OpenCourse;