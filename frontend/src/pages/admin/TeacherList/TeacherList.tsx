import React from "react";
import Header from "../../../components/header/Header";

const TeacherList = () => {
  const teacherData = [
    {
      id: 1,
      title: "ผศ.ดร.",
      firstName: "นันทวุฒิ",
      lastName: "คะอังกุ",
      email: "nunthawut@sut.ac.th",
      empId: "6500001",
      faculty: "วิศวกรรมศาสตร์",
      department: "วิศวกรรมคอมพิวเตอร์",
      position: "หัวหน้าสาขาวิชา",
      status: "Active",
      role: "Instructor",
    },
    {
      id: 2,
      title: "รศ.ดร.",
      firstName: "กิตติศักดิ์",
      lastName: "เกิดประสพ",
      email: "kerdpras@sut.ac.th",
      empId: "6500002",
      faculty: "วิศวกรรมศาสตร์",
      department: "วิศวกรรมคอมพิวเตอร์",
      position: "อาจารย์ประจำหลักสูตร",
      status: "Active",
      role: "Instructor",
    },
    {
      id: 3,
      title: "รศ.ดร.",
      firstName: "นิตยา",
      lastName: "เกิดประสพ",
      email: "nittaya@sut.ac.th",
      empId: "6500003",
      faculty: "วิศวกรรมศาสตร์",
      department: "วิศวกรรมคอมพิวเตอร์",
      position: "อาจารย์ประจำหลักสูตร",
      status: "Active",
      role: "Instructor",
    },
    {
      id: 4,
      title: "รศ.ดร.",
      firstName: "คะชา",
      lastName: "ชาญศิลป์",
      email: "kacha@sut.ac.th",
      empId: "6500004",
      faculty: "วิศวกรรมศาสตร์",
      department: "วิศวกรรมคอมพิวเตอร์",
      position: "อาจารย์ประจำหลักสูตร",
      status: "Active",
      role: "Instructor",
    },
    {
      id: 5,
      title: "รศ.ดร.",
      firstName: "ปรเมศวร์",
      lastName: "ห่อแก้ว",
      email: "phorkaew@sut.ac.th",
      empId: "6500005",
      faculty: "วิศวกรรมศาสตร์",
      department: "วิศวกรรมคอมพิวเตอร์",
      position: "อาจารย์ประจำหลักสูตร",
      status: "Active",
      role: "Instructor",
    },
    {
      id: 6,
      title: "ผศ.ดร.",
      firstName: "ศรัญญา",
      lastName: "กาญจนวัฒนา",
      email: "sarunya.k@sut.ac.th",
      empId: "6500006",
      faculty: "วิศวกรรมศาสตร์",
      department: "วิศวกรรมคอมพิวเตอร์",
      position: "ผู้จัดตารางสอน",
      status: "Active",
      role: "Scheduler",
    },
    {
      id: 7,
      title: "อ.ดร.",
      firstName: "สุภาพร",
      lastName: "บุญฤทธิ์",
      email: "sbunrit@sut.ac.th",
      empId: "6500007",
      faculty: "วิศวกรรมศาสตร์",
      department: "วิศวกรรมคอมพิวเตอร์",
      position: "อาจารย์ประจำหลักสูตร",
      status: "Active",
      role: "Instructor",
    },
    {
      id: 8,
      title: "อ.ดร.",
      firstName: "วิชัย",
      lastName: "ศรีสุรักษ์",
      email: "wichai@sut.ac.th",
      empId: "6500008",
      faculty: "วิศวกรรมศาสตร์",
      department: "วิศวกรรมคอมพิวเตอร์",
      position: "อาจารย์ประจำหลักสูตร",
      status: "Active",
      role: "Instructor",
    },
    {
      id: 9,
      title: "อ.ดร.",
      firstName: "ปริญญ์",
      lastName: "ศรเลิศล้ำวาณิช",
      email: "parin.s@sut.ac.th",
      empId: "6500009",
      faculty: "วิศวกรรมศาสตร์",
      department: "วิศวกรรมคอมพิวเตอร์",
      position: "อาจารย์ประจำหลักสูตร",
      status: "Active",
      role: "Instructor",
    },
    {
      id: 10,
      title: "อ.ดร.",
      firstName: "คมศัลล์",
      lastName: "ศรีวิสุทธิ์",
      email: "komsan@sut.ac.th",
      empId: "6500010",
      faculty: "วิศวกรรมศาสตร์",
      department: "วิศวกรรมคอมพิวเตอร์",
      position: "หัวหน้านวัตกรรมสถานศึกษา",
      status: "Active",
      role: "Instructor",
    },
  ];

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
            <span className="text-sm text-black">...   7</span>
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
                <tr key={teacher.id} className="border-t">
                  <td className="py-3">{teacher.id}</td>
                  <td className="py-3">{teacher.title}</td>
                  <td className="py-3">{teacher.firstName}</td>
                  <td className="py-3">{teacher.lastName}</td>
                  <td className="py-3">{teacher.email}</td>
                  <td className="py-3">{teacher.empId}</td>
                  <td className="py-3">{teacher.faculty}</td>
                  <td className="py-3">{teacher.department}</td>
                  <td className="py-3">{teacher.position}</td>
                  <td className="py-3 text-green-600">{teacher.status}</td>
                  <td className="py-3">{teacher.role}</td>
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
