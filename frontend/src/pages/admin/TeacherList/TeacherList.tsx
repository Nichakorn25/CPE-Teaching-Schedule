import React, { useState, useEffect } from "react";
import {
  getAllTeachers,
  deleteUser,
} from "../../../services/https/AdminPageServices";
import { AllTeacher } from "../../../interfaces/Adminpage";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

const TeacherList = () => {
  const [teacherData, setTeacherData] = useState<AllTeacher[]>([]);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const startIndex = (currentPage - 1) * perPage;
  const endIndex = startIndex + perPage;
  const paginatedTeachers = teacherData.slice(startIndex, endIndex);
  const totalPages = Math.ceil(teacherData.length / perPage);

  useEffect(() => {
    const FetchTeacher = async () => {
      const response = await getAllTeachers();
      console.log("ข้อมูลทั้งหมด:", response.data);
      response.data.forEach((item, i) => {
        if (!item.Firstname || !item.Lastname) {
          console.warn(`แถวที่ ${i + 1} ขาดชื่อหรือนามสกุล`, item);
        }
      });

      if (response.status === 200 && Array.isArray(response.data)) {
        const mappedData: AllTeacher[] = response.data.map(
          (item: any, index: number) => ({
            ID: index + 1,
            DeleteID: item.ID,
            Title: item.Title,
            FirstName: item.Firstname,
            LastName: item.Lastname,
            Email: item.Email,
            EmpId: item.Username, //ไม่ใช่รหัสพนักงานหรอ
            Department: item.Department,
            Major: item.Major,
            Position: item.Position,
            Status: item.Status,
            Role: item.Role,
          })
        );
        setTeacherData(mappedData);
      } else {
        console.error("โหลดข้อมูลรายชื่ออาจารย์ไม่สำเร็จ", response);
      }
    };
    FetchTeacher();
  }, []);

  const handleDeleteTeacher = async (
    DeleteID: number,
    fullName: string,
    title: string
  ) => {
    const result = await Swal.fire({
      title: "คุณแน่ใจหรือไม่?",
      text: `คุณต้องการลบ ${title} ${fullName} หรือไม่?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#f26522",
      cancelButtonColor: "#d33",
      confirmButtonText: "ตกลง",
      cancelButtonText: "ยกเลิก",
    });

    if (result.isConfirmed) {
      const response = await deleteUser(DeleteID); // ส่ง ID ที่เป็น number
      console.log("ลบไอดีนี้", response);

      if (response.status === 200) {
        Swal.fire("ลบเรียบร้อย!", `${title} ${fullName} ถูกลบแล้ว`, "success");

        //ลบจาก state โดยใช้ ID
        setTeacherData((prev) =>
          prev.filter((teacher) => teacher.DeleteID !== DeleteID)
        );
      } else {
        Swal.fire(
          "เกิดข้อผิดพลาด!",
          response.data?.error || "ไม่สามารถลบอาจารย์ได้",
          "error"
        );
      }
    }
  };

  return (
    <>
      <div className="font-sarabun p-6 mt-10">
        {/* Header */}
        <div className="flex items-center justify-between  px-4 py-2 rounded mb-4">
          {/* ซ้าย: ค้นหา */}
          <div className="flex items-center gap-4">
            {/* ช่องค้นหา */}
            <div className="flex items-center border border-orange-400 rounded px-2 py-1 bg-white">
              <input
                type="text"
                placeholder="ค้นหาอาจารย์ผู้สอน"
                className="outline-none text-sm text-gray-800 w-40"
              />
              <button className="text-orange-500 ml-2 text-lg">🔍</button>
            </div>

            {/* รายการที่แสดง */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">รายการที่แสดง</span>
              <select
                value={perPage}
                onChange={async (e) => {
                  const newPerPage = Number(e.target.value);
                  setIsLoading(true); // เริ่มแสดง UI โหลด
                  setPerPage(newPerPage);
                  setCurrentPage(1);

                  // เรียกข้อมูลและรอให้ครบ 1 วินาทีพร้อมกัน
                  const [response] = await Promise.all([
                    getAllTeachers(),
                    new Promise((resolve) => setTimeout(resolve, 1000)), // หน่วงเวลา 1 วิ
                  ]);

                  if (response.status === 200 && Array.isArray(response.data)) {
                    const mappedData: AllTeacher[] = response.data
                      .filter((item: any) => item.Firstname && item.Lastname)
                      .map((item: any, index: number) => ({
                        ID: index + 1,
                        DeleteID: item.ID,
                        Title: item.Title,
                        FirstName: item.Firstname,
                        LastName: item.Lastname,
                        Email: item.Email,
                        EmpId: item.Username,
                        Department: item.Department,
                        Major: item.Major,
                        Position: item.Position,
                        Status: item.Status,
                        Role: item.Role,
                      }));
                    setTeacherData(mappedData);
                  }

                  setIsLoading(false); // ซ่อน loading หลังครบ 1 วิ
                }}
                className="border border-gray-300 rounded px-2 py-[2px] text-sm"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </div>

            {/* Pagination */}
            <div className="flex items-center gap-1 ml-4">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-7 h-7 text-sm rounded ${
                    currentPage === i + 1
                      ? "bg-[#F26457] text-white"
                      : "text-black hover:bg-gray-200"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <span className="text-sm text-black">... 7</span>
              <button className="text-sm text-black hover:underline ml-5">
                ถัดไป
              </button>
            </div>
          </div>

          {/* ขวา: สาขา */}
          <select className="border border-orange-400 rounded px-3 py-1 text-sm text-orange-500">
            <option>สาขาวิชาวิศวกรรมคอมพิวเตอร์</option>
            {/* เพิ่มตัวเลือกอื่นได้ */}
          </select>
        </div>

        <div className="flex justify-end mb-2">
          <button
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm"
            onClick={() => navigate("/manage-teacher")}
          >
            ➕ เพิ่มอาจารย์
          </button>
        </div>
        {/* Main Content */}
        <div className="px-8 py-6 max-w-[1400px] mx-auto">
          {/* Table */}
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-orange-500 border-solid"></div>
            </div>
          ) : (
            <div className="overflow-x-auto bg-white shadow rounded-lg flex-1">
              <table className="min-w-full table-fixed text-sm text-center">
                <thead className="bg-[#f5f5f5] text-[#5d7285]">
                  <tr>
                    <th className="w-[60px]">ลำดับ</th>
                    <th className="w-[120px]">ตำแหน่งทางวิชาการ</th>
                    <th className="w-[100px]">ชื่อ</th>
                    <th className="w-[120px]">นามสกุล</th>
                    <th className="w-[220px]">อีเมล</th>
                    <th className="w-[120px]">รหัสพนักงาน</th>
                    <th className="w-[160px]">สำนักวิชาสังกัด</th>
                    <th className="w-[180px]">สาขาวิชาสังกัด</th>
                    <th className="w-[150px]">ตำแหน่ง</th>
                    <th className="w-[100px]">สถานะ</th>
                    <th className="w-[100px]">บทบาท</th>
                    <th className="w-[120px]">จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTeachers.map((teacher, index) => (
                    <tr key={teacher.DeleteID} className="border-t">
                      <td className="py-3">{startIndex + index + 1}</td>
                      <td className="py-3">
                        {typeof teacher.Title === "string"
                          ? teacher.Title
                          : teacher.Title?.Title || "-"}
                      </td>
                      <td className="py-3">{teacher.Firstname}</td>
                      <td className="py-3">{teacher.Lastname}</td>
                      <td className="py-3">{teacher.Email}</td>
                      <td className="py-3">{teacher.EmpId}</td>
                      <td className="py-3">{teacher.Department}</td>
                      <td className="py-3">{teacher.Major}</td>
                      <td className="py-3">{teacher.Position}</td>
                      <td className="py-3 text-green-600">{teacher.Status}</td>
                      <td className="py-3">{teacher.Role}</td>
                      <td className="py-3 flex justify-center gap-2">
                        <button
                          className="bg-orange-500 hover:bg-orange-600 text-white px-2 py-1 rounded text-sm"
                          onClick={() => {
                            navigate(`/manage-teacher/${teacher.DeleteID}`);
                          }}
                        >
                          แก้ไข
                        </button>
                        <button
                          className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-sm"
                          onClick={() =>
                            handleDeleteTeacher(
                              teacher.DeleteID,
                              `${teacher.Firstname} ${teacher.Lastname}`,
                              typeof teacher.Title === "string"
                                ? teacher.Title
                                : teacher.Title?.Title || ""
                            )
                          }
                        >
                          ลบ
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default TeacherList;
