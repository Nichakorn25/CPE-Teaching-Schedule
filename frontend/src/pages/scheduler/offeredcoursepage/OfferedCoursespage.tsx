import React, { useState, useEffect } from "react";
import "./OfferedCoursespage.css";
import { Button, Table, Input, Select } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { getOpenCourses } from "../../../services/https/AdminPageServices";
import {
  OpenCourseInterface,
  MajorInterface,
} from "../../../interfaces/Adminpage";
import { getMajorOfDepathment } from "../../../services/https/GetService";

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
  const [departments, setDepartments] = useState<
    { ID: number; DepartmentName: string }[]
  >([]);

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
      if (response.status === 200 && Array.isArray(response.data?.data)) {
        setCourses(response.data.data);
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

        // ✅ แปลงคณะโดยไม่ hardcode และเรียงชื่อคณะตามตัวอักษร
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
        selectedMajor === "all" || course.Code?.startsWith(selectedMajor);

      return matchesSearch && matchesMajor;
    })
    .sort((a, b) => a.ID - b.ID); // ✅ เรียงตาม ID

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
        groups.map((g: any, index: number) => <div key={index}>{g.Time}</div>),
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
  ];

  return (
    <div>
      <h2>รายวิชาที่เปิดสอน</h2>
      <div style={{ marginBottom: 16 }}>
        <Select
          placeholder="เลือกคณะ"
          style={{ width: 200, marginRight: 10 }}
          onChange={(value: number) => {
            setSelectedDepartmentID(value);
            setSelectedMajor("all");
          }}
          value={selectedDepartmentID ?? undefined}
        >
          {departments.map((dep) => (
            <Option key={dep.ID} value={dep.ID}>
              {dep.DepartmentName}
            </Option>
          ))}
        </Select>
        <Select
          placeholder="เลือกสาขา"
          style={{ width: 200, marginRight: 10 }}
          onChange={(value: string) => setSelectedMajor(value)}
          value={selectedMajor}
        >
          <Option value="all">ทุกสาขา</Option>
          {filteredMajors.map((major) => (
            <Option key={major.ID} value={major.ID}>
              {major.MajorName}
            </Option>
          ))}
        </Select>
        <Input
          placeholder="ค้นหา..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 200 }}
        />
      </div>
      <Table
        dataSource={filteredCourses.map((c, i) => ({ key: i, ...c }))}
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
