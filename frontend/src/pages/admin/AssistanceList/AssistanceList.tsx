import React, { useState, useEffect } from "react";
import Header from "../../../components/header/Header";
import Sidebar from "../../../components/schedule-sidebar/Sidebar";
import {
  getAllTeachingAssistants,
  deleteTeachingAssistant,
} from "../../../services/https/AdminPageServices";
import { TeachingAssistantInterface } from "../../../interfaces/TeachingAssistant";
import Swal from "sweetalert2";

const AssistanceList = () => {
  const [assistanceData, setAssistanceData] = useState<
    TeachingAssistantInterface[]
  >([]);

  useEffect(() => {
    const FetchAssistance = async () => {
      const response = await getAllTeachingAssistants();
      console.log(response);

      if (response.status === 200 && Array.isArray(response.data)) {
        const mappedData: TeachingAssistantInterface[] = response.data
          .filter((item: any) => item.Firstname && item.Lastname)
          .map((item: any) => ({
            ID: item.ID,
            TitleID: item.TitleID,
            Title: item.Title,
            Firstname: item.Firstname,
            Lastname: item.Lastname,
            Email: item.Email,
            PhoneNumber: item.PhoneNumber,
            ScheduleTeachingAssistant: [],
          }));

        setAssistanceData(mappedData);
      } else {
        console.error("โหลดข้อมูลรายชื่อผู้ช่วยสอนไม่สำเร็จ", response);
      }
    };
    FetchAssistance();
  }, []);

  const handleDeleteAssistance = async (
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
      const response = await deleteTeachingAssistant(DeleteID); // ส่ง ID ที่เป็น number
      console.log("ลบไอดีนี้", response);

      if (response.status === 200) {
        Swal.fire("ลบเรียบร้อย!", `${title} ${fullName} ถูกลบแล้ว`, "success");

        setAssistanceData((prev) => {
          const updated = prev.filter((ass) => ass.ID !== DeleteID);
          return updated.map((item, index) => ({
            ...item,
            ID: index + 1, // จัดลำดับใหม่
          }));
        });
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
    <div className="font-sarabun p-6 mt-10">
      <Header />
      <Sidebar/>
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
                <th className="w-[120px]">คำนำหน้า</th>
                <th className="w-[100px]">ชื่อ</th>
                <th className="w-[120px]">นามสกุล</th>
                <th className="w-[220px]">อีเมล</th>
                <th className="w-[120px]">หมายเลขโทรศัพท์</th>
                <th className="w-[120px]">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {assistanceData.map((assistance) => (
                <tr key={assistance.ID} className="border-t">
                  <td className="py-3">{assistance.ID}</td>
                  <td className="py-3">{assistance.Title?.Title}</td>
                  <td className="py-3">{assistance.Firstname}</td>
                  <td className="py-3">{assistance.Lastname}</td>
                  <td className="py-3">{assistance.Email}</td>
                  <td className="py-3">{assistance.PhoneNumber}</td>
                  <td className="py-3 flex justify-center gap-2">
                    <button className="bg-orange-500 hover:bg-orange-600 text-white px-2 py-1 rounded text-sm">
                      แก้ไข
                    </button>
                    <button
                      className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-sm"
                      onClick={() =>
                        handleDeleteAssistance(
                          assistance.ID,
                          `${assistance.Firstname} ${assistance.Lastname}`,
                          assistance.Title?.Title || ""
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
      </div>
    </div>
  );
};

export default AssistanceList;
