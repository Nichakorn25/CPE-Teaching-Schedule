import React, { useState,useEffect } from "react";
import { FaSearch } from "react-icons/fa";
import Header from "../../../components/header/Header";
import { getAllCourses } from "../../../services/https/AdminPageServices";

interface Course {
  id: number;
  code: string;
  name: string;
  credit: string;
  category: string;
  instructors: string[];
}

const AllCourse: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [courseData, setCourseData] = useState<Course[]>([]);

  useEffect(() => {
  const fetchCourses = async () => {
    const response = await getAllCourses();

    if (response.status === 200 && Array.isArray(response.data)) {
      const mappedData: Course[] = response.data.map((item: any, index: number) => ({
        id: index + 1,
        code: item["รหัสวิชา"],
        name: item["ชื่อวิชา"],
        credit: item["หน่วยกิต"],
        category: item["หมวดวิชา"],
        instructors: [...new Set(item["อาจารย์ผู้สอน"]?.split(", ").map((name: string) => name.trim()))],
      }));

      setCourseData(mappedData);
    } else {
      console.error("โหลดข้อมูลรายวิชาไม่สำเร็จ", response);
    }
  };

  fetchCourses();
}, []);


  const filteredCourses = courseData.filter((course) =>
    course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 font-sarabun mt-10">
      <Header />

      {/* Filters */}
      <div className="flex flex-wrap justify-between items-center gap-4 bg-[#f5f5f5] p-4 rounded-md mb-4">
        <div className="flex items-center border border-orange-400 rounded px-2 py-1 bg-white">
          <input
            type="text"
            placeholder="ค้นหารายวิชา"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="outline-none text-sm text-gray-800 w-40"
          />
          <button className="text-orange-500 ml-2 text-lg">
            <FaSearch />
          </button>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <span>รายการที่แสดง</span>
          <select
            value={perPage}
            onChange={(e) => setPerPage(Number(e.target.value))}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
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
          <button onClick={() => setCurrentPage(currentPage + 1)} className="hover:underline">
            ถัดไป
          </button>
        </div>

        <button className="bg-orange-500 text-white rounded px-4 py-2 hover:bg-orange-600 transition-all">
          + เพิ่ม
        </button>
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
              <th className="border p-2">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {filteredCourses.map((course) => (
              <tr key={course.id} className="border-t">
                <td className="border p-2">{course.id}</td>
                <td className="border p-2">{course.code}</td>
                <td className="border p-2">{course.name}</td>
                <td className="border p-2">{course.credit}</td>
                <td className="border p-2">{course.category}</td>
                <td className="border p-2">{course.instructors.join(", ")}</td>
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
  );
};

export default AllCourse;
