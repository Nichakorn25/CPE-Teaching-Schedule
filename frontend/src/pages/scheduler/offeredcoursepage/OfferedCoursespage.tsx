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
  const [expandedRowKeys, setExpandedRowKeys] = useState<number[]>([]);

  const toggleExpandRow = (id: number) => {
    setExpandedRowKeys((prev) =>
      prev.includes(id) ? prev.filter((key) => key !== id) : [...prev, id]
    );
  };

  const getExpandedTableData = () => {
    const result: any[] = [];

    filteredCourses.forEach((course) => {
      result.push({ ...course, isChild: false, key: course.ID });

      if (expandedRowKeys.includes(course.ID) && course.GroupInfos.length > 1) {
        const extraGroups = course.GroupInfos.slice(1); // กลุ่มที่ 2 เป็นต้นไป

        extraGroups.forEach((group, i) => {
          const isLast = i === extraGroups.length - 1;
          result.push({
            ...course,
            isChild: true,
            isLastChild: isLast,
            GroupInfo: group,
            key: `${course.ID}-extra-${i}`,
          });
        });
      }
    });

    return result;
  };

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
        const allCourses = response.data.data as OpenCourseInterface[];

        const grouped = allCourses.reduce((acc, course) => {
          const key = `${course.Code}-${course.Credit}-${course.TypeName}-${course.Major}-${course.Teachers}`;
          const existing = acc.get(key);

          if (existing) {
            const merged = [...existing.GroupInfos, ...course.GroupInfos];

            // 🔁 กำจัดรายการซ้ำโดยดูจาก combination ของ Room+Group+Day+TimeSpan
            const deduped = Array.from(
              new Map(
                merged.map((g) => [
                  `${g.Room}-${g.Group}-${g.Day}-${g.TimeSpan}`,
                  g,
                ])
              ).values()
            );

            existing.GroupInfos = deduped;
          } else {
            acc.set(key, { ...course, GroupInfos: [...course.GroupInfos] });
          }

          return acc;
        }, new Map<string, OpenCourseInterface>());

        const groupedCourses = Array.from(grouped.values());
        setCourses(groupedCourses);
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

      console.log("Match major result : ", matchesMajor);

      return matchesSearch && matchesMajor;
    })
    .sort((a, b) => a.ID - b.ID);

  const columns: ColumnsType<any> = [
    {
      title: "ลำดับ",
      key: "index",
      render: (_text, record, index) => {
        // นับเฉพาะแถวหลัก (isChild = false)
        if (record.isChild) return null;

        // หาตำแหน่งจริงใน filteredCourses แล้วคำนวณลำดับ
        const indexInMain = filteredCourses.findIndex(
          (c) => c.ID === record.ID
        );
        return indexInMain + 1 + (currentPage - 1) * pageSize;
      },
    },
    {
      title: "รหัสวิชา",
      key: "Code",
      render: (_text, record) => <span>{record.Code}</span>,
    },
    {
      title: "ชื่อวิชา",
      key: "Name",
      render: (_text, record) => <span>{record.Name}</span>,
    },
    {
      title: "หน่วยกิต",
      key: "Credit",
      render: (_text, record) => <span>{record.Credit}</span>,
    },
    {
      title: "หมวดวิชา",
      key: "TypeName",
      render: (_text, record) => <span>{record.TypeName}</span>,
    },
    {
      title: "อาจารย์ผู้สอน",
      key: "Teacher",
      render: (_text, record) => <span>{record.Teacher}</span>,
    },
    {
      title: "กลุ่มเรียน",
      key: "Group",
      render: (_text, record) => {
        // ✅ แถวหลัก
        if (!record.isChild) {
          const firstGroup = record.GroupInfos?.[0];
          const hasMore = record.GroupInfos?.length > 1;
          return (
            <div>
              {firstGroup?.Group}
              {hasMore && !expandedRowKeys.includes(record.ID) && (
                <div>
                  <button
                    onClick={() => toggleExpandRow(record.ID)}
                    style={{
                      color: "#1677ff",
                      background: "none",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                      marginLeft: "4px",
                    }}
                  >
                    ดูเพิ่มเติม
                  </button>
                </div>
              )}
            </div>
          );
        }

        // ✅ แถวลูก
        return (
          <div>
            {record.GroupInfo?.Group}
            {record.isLastChild && (
              <div>
                <button
                  onClick={() => toggleExpandRow(record.ID)}
                  style={{
                    color: "#1677ff",
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    marginLeft: "4px",
                  }}
                >
                  ซ่อน
                </button>
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: "ห้อง",
      key: "Room",
      render: (_text, record) =>
        !record.isChild ? record.GroupInfos?.[0]?.Room : record.GroupInfo?.Room,
    },
    {
      title: "วันที่สอน",
      key: "Day",
      render: (_text, record) =>
        !record.isChild ? record.GroupInfos?.[0]?.Day : record.GroupInfo?.Day,
    },
    {
      title: "เวลา",
      key: "TimeSpan",
      render: (_text, record) =>
        !record.isChild
          ? record.GroupInfos?.[0]?.TimeSpan
          : record.GroupInfo?.TimeSpan,
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

        const isCesCourse = record.IsFixCourses === true;

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
              onClick={() => {
                const targetPath = isCesCourse
                  ? `/manage-cescourse/${record.ID + 1}`
                  : `/add-open-course/${record.ID}`;
                navigate(targetPath);
              }}
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
          <Option value="all">ทุกสาขาวิชา</Option>
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
        dataSource={getExpandedTableData()}
        rowKey={(record) => record.key}
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
