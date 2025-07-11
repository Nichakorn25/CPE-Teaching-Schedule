import React, { useState, useEffect } from "react";
import Header from "../../../components/header/Header";
import { getAllTeachers } from "../../../services/https/AdminPageServices";
import { AllTeacher } from "../../../interfaces/Adminpage";

const TeacherList = () => {
  const [teacherData, setTeacherData] = useState<AllTeacher[]>([]);

  useEffect(() => {
    const FetchTeacher = async () => {
      const response = await getAllTeachers();
      console.log(response);

      if (response.status === 200 && Array.isArray(response.data)) {
        const mappedData: AllTeacher[] = response.data
          .filter((item: any) => item.Firstname && item.Lastname)
          .map((item: any, index: number) => ({
            ID: index+1,
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
          }));
        setTeacherData(mappedData);
      } else {
        console.error("โหลดข้อมูลรายชื่ออาจารย์ไม่สำเร็จ", response);
      }
    };
    FetchTeacher();
  }, []);

  return (
    <div className="font-sarabun p-6 mt-10">
      <Header />
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
            <select className="border border-gray-300 rounded px-2 py-[2px] text-sm">
              <option>10</option>
              <option>20</option>
            </select>
          </div>

          {/* Pagination */}
          <div className="flex items-center gap-1 ml-4">
            {[1, 2, 3, 4, 5].map((p) => (
              <button
                key={p}
                className={`w-7 h-7 text-sm rounded ${
                  p === 1
                    ? "bg-[#F26457] text-white"
                    : "text-black hover:bg-gray-200"
                }`}
              >
                {p}
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
        <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm">
          ➕ เพิ่มอาจารย์
        </button>
      </div>
      {/* Main Content */}
      <div className="px-8 py-6 max-w-[1400px] mx-auto">
        {/* Table */}
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
              {teacherData.map((teacher) => (
                <tr key={teacher.ID} className="border-t">
                  <td className="py-3">{teacher.ID}</td>
                  <td className="py-3">{teacher.Title}</td>
                  <td className="py-3">{teacher.FirstName}</td>
                  <td className="py-3">{teacher.LastName}</td>
                  <td className="py-3">{teacher.Email}</td>
                  <td className="py-3">{teacher.EmpId}</td>
                  <td className="py-3">{teacher.Department}</td>
                  <td className="py-3">{teacher.Major}</td>
                  <td className="py-3">{teacher.Position}</td>
                  <td className="py-3 text-green-600">{teacher.Status}</td>
                  <td className="py-3">{teacher.Role}</td>
                  <td className="py-3 flex justify-center gap-2">
                    <button className="bg-orange-500 hover:bg-orange-600 text-white px-2 py-1 rounded text-sm">
                      แก้ไข
                    </button>
                    <button className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-sm">
                      ลบ
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TeacherList;
