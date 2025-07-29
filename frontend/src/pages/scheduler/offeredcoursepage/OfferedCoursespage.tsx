import React, { useState, useEffect } from "react";
import "./OfferedCoursespage.css";
import { Button, Table, Input, Select } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { getOpenCourses } from "../../../services/https/AdminPageServices";
import {
  OpenCourseInterface,
  MajorInterface,
  DepartmentInterface,
} from "../../../interfaces/Adminpage";
import { getMajorOfDepathment } from "../../../services/https/GetService";
import { deleteOfferedCourse } from "../../../services/https/SchedulerPageService";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

const { Option } = Select;

const OfferedCoursespage: React.FC = () => {
  const [searchText, setSearchText] = useState("");
  const [selectedDepartmentID, setSelectedDepartmentID] = useState<
    number | null
  >(null);
  const [selectedMajor, setSelectedMajor] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [courses, setCourses] = useState<OpenCourseInterface[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [academicYear, setAcademicYear] = useState<number>(0);
  const [term, setTerm] = useState<number>(0);
  const [majors, setMajors] = useState<MajorInterface[]>([]);
  const [departments, setDepartments] = useState<DepartmentInterface[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const year = localStorage.getItem("academicYear");
    const t = localStorage.getItem("term");
    if (year) setAcademicYear(Number(year));
    if (t) setTerm(Number(t));
  }, []);

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      const response = await getOpenCourses();
      console.log("getopencourse : ", response);

      if (response.status === 200 && Array.isArray(response.data?.data)) {
        const uniqueCourses = Array.from(
          new Map(
            (response.data.data as OpenCourseInterface[]).map((item) => [
              item.ID,
              item,
            ])
          ).values()
        );
        setCourses(uniqueCourses);
      } else {
        console.error("ไม่สามารถโหลดรายวิชา:", response);
      }
      setLoading(false);
    };

    fetchCourses();
  }, []);

  useEffect(() => {
    const fetchMajors = async () => {
      const res = await getMajorOfDepathment();
      if (res.status === 200 && Array.isArray(res.data)) {
        const majorsData = res.data;
        setMajors(majorsData);

        const uniqueDepartments = Array.from(
          new Map(
            majorsData.map((m: any) => [
              m.Department.ID,
              m.Department.DepartmentName,
            ])
          )
        )
          .map(([id, name]) => ({
            ID: id as number,
            DepartmentName: name as string,
          }))
          .sort((a, b) => a.DepartmentName.localeCompare(b.DepartmentName));

        setDepartments(uniqueDepartments);
      }
    };

    fetchMajors();
  }, []);

  const filteredMajors = selectedDepartmentID
    ? majors.filter((m) => m.DepartmentID === selectedDepartmentID)
    : majors;

  const filteredCourses = courses
    .filter((course) => {
      const matchesSearch =
        course.Code?.toLowerCase().includes(searchText.toLowerCase()) ||
        course.Name?.toLowerCase().includes(searchText.toLowerCase());

      const matchesMajor =
        selectedMajor === "all" || course.Major === selectedMajor;

      console.log("Match major result : ",matchesMajor)
      
      return matchesSearch && matchesMajor;

   
    })
    .sort((a, b) => a.ID - b.ID);

  const columns: ColumnsType<OpenCourseInterface> = [
    {
      title: "ลำดับ",
      key: "index",
      render: (_text, _record, index) =>
        index + 1 + (currentPage - 1) * pageSize,
    },
    {
      title: "รหัสวิชา",
      dataIndex: "Code",
      key: "Code",
    },
    {
      title: "ชื่อวิชา",
      dataIndex: "Name",
      key: "Name",
    },
    {
      title: "หน่วยกิต",
      dataIndex: "Credit",
      key: "Credit",
    },
    {
      title: "หมวดวิชา",
      dataIndex: "TypeName",
      key: "TypeName",
    },
    {
      title: "อาจารย์ผู้สอน",
      dataIndex: "Teacher",
      key: "Teacher",
    },
    {
      title: "ห้องเรียน",
      dataIndex: "GroupInfos",
      key: "GroupInfos",
      render: (groups) =>
        groups.map((g: any, index: number) => (
          <div key={index}>ห้อง {g.Room}</div>
        )),
    },
    {
      title: "กลุ่มเรียน",
      dataIndex: "GroupInfos",
      key: "GroupInfos",
      render: (groups) =>
        groups.map((g: any, index: number) => <div key={index}>{g.Group}</div>),
    },
    {
      title: "วันที่สอน",
      dataIndex: "GroupInfos",
      key: "GroupInfos",
      render: (groups) =>
        groups.map((g: any, index: number) => <div key={index}>{g.Day}</div>),
    },
    {
      title: "เวลาที่สอน",
      dataIndex: "GroupInfos",
      key: "GroupInfos",
      render: (groups) =>
        groups.map((g: any, index: number) => (
          <div key={index}>{g.TimeSpan}</div>
        )),
    },
    {
      title: "จำนวนกลุ่ม",
      dataIndex: "GroupTotal",
      key: "GroupTotal",
    },
    {
      title: "จำนวนนักศึกษาต่อกลุ่มเรียน",
      dataIndex: "CapacityPer",
      key: "CapacityPer",
    },
    {
      title: "จัดการ",
      key: "actions",
      render: (_text, record) => {
        const userID = Number(localStorage.getItem("user_id")); // หรือใช้ useEffect preload ก็ได้
        const canEdit = userID && record.TeacherID === userID;

        if (!canEdit) {
          return null; //ไม่แสดงอะไรเลย
        }

        return (
          <>
            <Button
              size="small"
              style={{
                backgroundColor: "#F26522",
                borderColor: "#F26522",
                color: "white",
                fontSize: "9px",
                padding: "1px 4px",
                height: "20px",
                lineHeight: "18px",
              }}
              onClick={() => navigate(`/add-open-course/${record.ID}`)}
              title="แก้ไขข้อมูล"
            >
              แก้ไข
            </Button>
            <Button
              size="small"
              style={{
                backgroundColor: "#ff4d4f",
                borderColor: "#ff4d4f",
                color: "white",
                fontSize: "9px",
                padding: "1px 4px",
                height: "20px",
                lineHeight: "18px",
              }}
              onClick={async () => {
                const result = await Swal.fire({
                  title: `คุณต้องการลบรายวิชา "${record.Name}" หรือไม่?`,
                  text: "หากลบแล้วต้องการเพิ่มรายวิชาที่เปิดสอน ให้ไปที่เมนู 'เพิ่มวิชาที่ต้องการสอน'",
                  icon: "warning",
                  showCancelButton: true,
                  confirmButtonColor: "#d33",
                  cancelButtonColor: "#3085d6",
                  confirmButtonText: "ตกลง",
                  cancelButtonText: "ยกเลิก",
                });
                if (result.isConfirmed) {
                  const res = await deleteOfferedCourse(record.ID);
                  if (res.status === 200) {
                    setCourses((prev) =>
                      prev.filter((c) => c.ID !== record.ID)
                    );
                    Swal.fire("ลบสำเร็จ!", "รายวิชาถูกลบแล้ว", "success");
                  } else {
                    Swal.fire("ผิดพลาด", "ไม่สามารถลบรายวิชาได้", "error");
                  }
                }
              }}
              title="ลบข้อมูล"
            >
              ลบ
            </Button>
          </>
        );
      },
    },
  ];

  return (
    <div>
      <h2>รายวิชาที่เปิดสอน</h2>
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          flexWrap: "wrap",
          gap: "10px",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontSize: "12px",
            color: "#666",
            fontFamily: "Sarabun, sans-serif",
          }}
        >
          รายการที่แสดง
        </span>
        <Select
          value={pageSize.toString()}
          style={{ width: 70, fontFamily: "Sarabun, sans-serif" }}
          size="small"
          onChange={(value) => setPageSize(parseInt(value))}
        >
          <Option value="5">5</Option>
          <Option value="10">10</Option>
          <Option value="20">20</Option>
          <Option value="50">50</Option>
        </Select>
        <Select
          placeholder="เลือกสำนักวิชา"
          style={{ width: 200, marginRight: 10 }}
          onChange={(value: number) => {
            setSelectedDepartmentID(value);
            setSelectedMajor("all");
          }}
          value={selectedDepartmentID ?? undefined}
        >
          <Option value="all">ทุกสำนักวิชา</Option>
          {departments.map((dep) => (
            <Option key={dep.ID} value={dep.ID}>
              {dep.DepartmentName}
            </Option>
          ))}
        </Select>
        <Select
          placeholder="เลือกสาขาวิชา"
          style={{ width: 200, marginRight: 10 }}
          onChange={(value: string) => setSelectedMajor(value)}
          value={selectedMajor}
        >
          <Option value="all">ทุกสาขา</Option>
          {filteredMajors.map((major) => (
            <Option key={major.ID} value={major.MajorName}>
              {major.MajorName}
            </Option>
          ))}
        </Select>

        <Input
          placeholder="ค้นหา..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 200, fontFamily: "Sarabun, sans-serif" }}
        />
      </div>
      <Table
        dataSource={filteredCourses.map((c) => ({ key: c.ID, ...c }))}
        columns={columns}
        loading={loading}
        pagination={{
          current: currentPage,
          pageSize,
          onChange: setCurrentPage,
        }}
      />
    </div>
  );
};

export default OfferedCoursespage;
