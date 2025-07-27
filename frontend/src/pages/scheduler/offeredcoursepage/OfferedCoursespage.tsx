import React, { useState, useEffect } from "react";
import Sidebar from "../../../components/schedule-sidebar/Sidebar";
import Header from "../../../components/header/Header";
import "./OfferedCoursespage.css";
import { Button, Table, Input, Select, Typography } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { getOpenCourses } from "../../../services/https/AdminPageServices";
import { OpenCourseInterface , DepartmentInterface , MajorInterface} from "../../../interfaces/Adminpage";
import {getMajorOfDepathment} from "../../../services/https/GetService";

const { Title } = Typography;
const { Option } = Select;

const OfferedCoursespage: React.FC = () => {
  const [searchText, setSearchText] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentInterface[]>([]);
  const [selectedMajor, setSelectedMajor] = useState<MajorInterface[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [courses, setCourses] = useState<OpenCourseInterface[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [academicYear, setAcademicYear] = useState<number>(0);
  const [term, setTerm] = useState<number>(0);

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      const response = await getOpenCourses();
      if (response.status === 200 && Array.isArray(response.data?.data)) {
        setCourses(response.data.data); // หรือ .data ขึ้นอยู่กับ structure
      } else {
        console.error("ไม่สามารถโหลดรายวิชา:", response);
      }
      setLoading(false);
    };

    fetchCourses();
  }, []);

  const courseData: OpenCourseInterface[] = courses.flatMap((item) => {
  return item.GroupInfos.map((group, index) => ({
    id: item.ID,
    code: item.Code,
    name: item.Name,
    credit: item.Credit,
    category: item.TypeName,
    teacher: item.Teacher,
    room: group.Room,
    group: group.Group,
    day: group.Day,
    time: group.Time,
    groupCount: item.GroupTotal,
    studentPerGroup: item.CapacityPer,
    note: item.Remark,
  }));
});

  // กรองข้อมูลตาม search text และสาขา
  const filteredCourses = courseData.filter((course) => {
    const matchesSearch =
      course.Name.toLowerCase().includes(searchText.toLowerCase()) ||
      course.Code.toLowerCase().includes(searchText.toLowerCase());

    const matchesMajor =
      selectedMajor === "all" || course.Code.startsWith(selectedMajor);

    return matchesSearch && matchesMajor;
  });

  // จัดกลุ่มข้อมูลตามรหัสวิชา (เหมือน OpenCourse)
  const groupedCourses = filteredCourses.reduce<Record<string, OpenCourseInterface[]>>(
    (acc, course) => {
      if (!acc[course.Code]) acc[course.Code] = [];
      acc[course.Code].push(course);
      return acc;
    },
    {}
  );

  // แปลงข้อมูลสำหรับตาราง
  const tableData: OpenCourseInterface[] = [];
  let orderCounter = 1;

  Object.entries(groupedCourses).forEach(([code, courses]) => {
    courses.forEach((course, index) => {
      tableData.push({
        ...course,
        key: `${course.Code}-${course.GroupTotal}`,
        order: index === 0 ? orderCounter : 0, // แสดงลำดับเฉพาะแถวแรกของแต่ละวิชา
      });
    });
    orderCounter++;
  });

  // Calculate pagination
  const totalItems = tableData.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentData = tableData.slice(startIndex, endIndex);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle page size change
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  // คอลัมน์ของตารางตาม OpenCourse
  const columns: ColumnsType<OpenCourseInterface> = [
    {
      title: "ลำดับ",
      dataIndex: "order",
      key: "order",
      width: 60,
      align: "center",
      render: (value: number, record: OpenCourseInterface, index: number) => {
        // แสดงลำดับเฉพาะแถวแรกของแต่ละกลุ่มวิชา
        const currentCourseCode = record.Code;
        const currentIndex = currentData.findIndex(
          (item) =>
            item.Code === currentCourseCode && item.GroupTotal === record.GroupTotal
        );
        const isFirstOfGroup =
          currentData.findIndex((item) => item.Code === currentCourseCode) ===
          currentIndex;

        if (isFirstOfGroup && value > 0) {
          return <span style={{ fontWeight: "bold" }}>{value}</span>;
        }
        return null;
      },
    },
    {
      title: "รหัสวิชา",
      dataIndex: "code",
      key: "code",
      width: 120,
      render: (value: string, record: OpenCourseInterface, index: number) => {
        // แสดงรหัสวิชาเฉพาะแถวแรกของแต่ละกลุ่มวิชา
        const currentCourseCode = record.Code;
        const currentIndex = currentData.findIndex(
          (item) =>
            item.Code === currentCourseCode && item.GroupTotal === record.GroupTotal
        );
        const isFirstOfGroup =
          currentData.findIndex((item) => item.Code === currentCourseCode) ===
          currentIndex;

        if (isFirstOfGroup) {
          return (
            <span style={{ fontWeight: "bold", color: "#1890ff" }}>
              {value}
            </span>
          );
        }
        return null;
      },
    },
    {
      title: "ชื่อวิชา",
      dataIndex: "name",
      key: "name",
      width: 250,
      render: (value: string, record: OpenCourseInterface, index: number) => {
        // แสดงชื่อวิชาเฉพาะแถวแรกของแต่ละกลุ่มวิชา
        const currentCourseCode = record.code;
        const currentIndex = currentData.findIndex(
          (item) =>
            item.code === currentCourseCode && item.GroupTotal === record.GroupTotal
        );
        const isFirstOfGroup =
          currentData.findIndex((item) => item.code === currentCourseCode) ===
          currentIndex;

        if (isFirstOfGroup) {
          return <span style={{ fontWeight: "500" }}>{value}</span>;
        }
        return null;
      },
    },
    {
      title: "หน่วยกิต",
      dataIndex: "credit",
      key: "credit",
      width: 100,
      align: "center",
      render: (value: string, record: OpenCourseInterface, index: number) => {
        // แสดงหน่วยกิตเฉพาะแถวแรกของแต่ละกลุ่มวิชา
        const currentCourseCode = record.code;
        const currentIndex = currentData.findIndex(
          (item) =>
            item.code === currentCourseCode && item.GroupTotal === record.group
        );
        const isFirstOfGroup =
          currentData.findIndex((item) => item.code === currentCourseCode) ===
          currentIndex;

        if (isFirstOfGroup) {
          return value;
        }
        return null;
      },
    },
    {
      title: "หมวดวิชา",
      dataIndex: "category",
      key: "category",
      width: 150,
      render: (value: string, record: OpenCourseInterface, index: number) => {
        // แสดงหมวดวิชาเฉพาะแถวแรกของแต่ละกลุ่มวิชา
        const currentCourseCode = record.code;
        const currentIndex = currentData.findIndex(
          (item) =>
            item.code === currentCourseCode && item.group === record.group
        );
        const isFirstOfGroup =
          currentData.findIndex((item) => item.code === currentCourseCode) ===
          currentIndex;

        if (isFirstOfGroup) {
          return value || "-";
        }
        return null;
      },
    },
    {
      title: "อาจารย์ผู้สอน",
      dataIndex: "teacher",
      key: "teacher",
      width: 200,
      render: (value: string, record: OpenCourseInterface, index: number) => {
        // แสดงอาจารย์ผู้สอนเฉพาะแถวแรกของแต่ละกลุ่มวิชา
        const currentCourseCode = record.code;
        const currentIndex = currentData.findIndex(
          (item) =>
            item.code === currentCourseCode && item.group === record.group
        );
        const isFirstOfGroup =
          currentData.findIndex((item) => item.code === currentCourseCode) ===
          currentIndex;

        if (isFirstOfGroup) {
          return value || "-";
        }
        return null;
      },
    },
    {
      title: "ห้องเรียน",
      dataIndex: "room",
      key: "room",
      width: 150,
      render: (value: string) => value || "-",
    },
    {
      title: "กลุ่ม",
      dataIndex: "group",
      key: "group",
      width: 80,
      align: "center",
      render: (value: string) => value,
    },
    {
      title: "วัน",
      dataIndex: "day",
      key: "day",
      width: 100,
      align: "center",
      render: (value: string, record: OpenCourseInterface, index: number) => {
        // แสดงวันเฉพาะแถวแรกของแต่ละกลุ่มวิชา
        const currentCourseCode = record.code;
        const currentIndex = currentData.findIndex(
          (item) =>
            item.code === currentCourseCode && item.group === record.group
        );
        const isFirstOfGroup =
          currentData.findIndex((item) => item.code === currentCourseCode) ===
          currentIndex;

        if (isFirstOfGroup) {
          return value || "-";
        }
        return null;
      },
    },
    {
      title: "เวลา",
      dataIndex: "time",
      key: "time",
      width: 120,
      align: "center",
      render: (value: string, record: OpenCourseInterface, index: number) => {
        // แสดงเวลาเฉพาะแถวแรกของแต่ละกลุ่มวิชา
        const currentCourseCode = record.code;
        const currentIndex = currentData.findIndex(
          (item) =>
            item.code === currentCourseCode && item.group === record.group
        );
        const isFirstOfGroup =
          currentData.findIndex((item) => item.code === currentCourseCode) ===
          currentIndex;

        if (isFirstOfGroup) {
          return value || "-";
        }
        return null;
      },
    },
    {
      title: "จำนวนกลุ่ม",
      dataIndex: "groupCount",
      key: "groupCount",
      width: 100,
      align: "center",
      render: (value: number, record: OpenCourseInterface, index: number) => {
        // แสดงจำนวนกลุ่มเฉพาะแถวแรกของแต่ละกลุ่มวิชา
        const currentCourseCode = record.code;
        const currentIndex = currentData.findIndex(
          (item) =>
            item.code === currentCourseCode && item.group === record.group
        );
        const isFirstOfGroup =
          currentData.findIndex((item) => item.code === currentCourseCode) ===
          currentIndex;

        if (isFirstOfGroup) {
          return value;
        }
        return null;
      },
    },
    {
      title: "นักศึกษาต่อกลุ่ม",
      dataIndex: "studentPerGroup",
      key: "studentPerGroup",
      width: 120,
      align: "center",
      render: (value: number, record: OpenCourseInterface, index: number) => {
        // แสดงนักศึกษาต่อกลุ่มเฉพาะแถวแรกของแต่ละกลุ่มวิชา
        const currentCourseCode = record.code;
        const currentIndex = currentData.findIndex(
          (item) =>
            item.code === currentCourseCode && item.group === record.group
        );
        const isFirstOfGroup =
          currentData.findIndex((item) => item.code === currentCourseCode) ===
          currentIndex;

        if (isFirstOfGroup) {
          return value;
        }
        return null;
      },
    },
    {
      title: "หมายเหตุ",
      dataIndex: "note",
      key: "note",
      width: 150,
      render: (value: string, record: OpenCourseInterface, index: number) => {
        // แสดงหมายเหตุเฉพาะแถวแรกของแต่ละกลุ่มวิชา
        const currentCourseCode = record.code;
        const currentIndex = currentData.findIndex(
          (item) =>
            item.code === currentCourseCode && item.group === record.group
        );
        const isFirstOfGroup =
          currentData.findIndex((item) => item.code === currentCourseCode) ===
          currentIndex;

        if (isFirstOfGroup) {
          return value || "-";
        }
        return null;
      },
    },
    {
      title: "จัดการ",
      key: "action",
      width: 120,
      align: "center",
      render: (value: any, record: OpenCourseInterface, index: number) => {
        // แสดงปุ่มจัดการเฉพาะแถวแรกของแต่ละกลุ่มวิชา
        const currentCourseCode = record.code;
        const currentIndex = currentData.findIndex(
          (item) =>
            item.code === currentCourseCode && item.group === record.group
        );
        const isFirstOfGroup =
          currentData.findIndex((item) => item.code === currentCourseCode) ===
          currentIndex;

        if (isFirstOfGroup) {
          return (
            <div
              style={{ display: "flex", gap: "4px", justifyContent: "center" }}
            >
              <Button
                size="small"
                style={{
                  backgroundColor: "#F26522",
                  borderColor: "#F26522",
                  color: "white",
                  fontSize: "11px",
                  padding: "2px 8px",
                  height: "auto",
                }}
                onClick={() => {
                  // Handle edit action
                  console.log("Edit course:", record.code);
                }}
              >
                แก้ไข
              </Button>
              <Button
                size="small"
                style={{
                  backgroundColor: "#ff4d4f",
                  borderColor: "#ff4d4f",
                  color: "white",
                  fontSize: "11px",
                  padding: "2px 8px",
                  height: "auto",
                }}
                onClick={() => {
                  // Handle delete action
                  console.log("Delete course:", record.code);
                }}
              >
                ลบ
              </Button>
            </div>
          );
        }
        return null;
      },
    },
  ];

  return (
    <>
      {/* Page Title */}
      <div
        style={{
          marginBottom: "20px",
          paddingBottom: "12px",
          borderBottom: "2px solid #F26522",
        }}
      >
        <h2
          style={{
            margin: "0 0 8px 0",
            color: "#333",
            fontSize: "20px",
            fontWeight: "bold",
          }}
        >
          รายวิชาที่เปิดสอน
        </h2>
        <p
          style={{
            margin: 0,
            color: "#666",
            fontSize: "13px",
          }}
        >
          จัดการรายวิชาที่เปิดสอนในแต่ละภาคเรียน
        </p>
      </div>

      {/* Controls Section */}
      <div
        style={{
          marginBottom: "20px",
        }}
      >
        {/* Top row - Main controls */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            backgroundColor: "#f8f9fa",
            padding: "12px 16px",
            borderRadius: "8px",
            border: "1px solid #e9ecef",
            minHeight: "48px",
            flexWrap: "nowrap",
            overflow: "hidden",
          }}
        >
          {/* Left group - Search controls */}
          <div
            style={{
              display: "flex",
              gap: "12px",
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            <Select
              value={selectedMajor}
              onChange={setSelectedMajor}
              style={{ width: 150 }}
              placeholder="เลือกสาขา"
              size="small"
            >
              <Option value="all">ทุกสาขา</Option>
              <Option value="IST">เทคโนโลยีสารสนเทศ</Option>
              <Option value="ENG">วิศวกรรม</Option>
              <Option value="CS">วิทยาการคอมพิวเตอร์</Option>
              <Option value="IT">เทคโนโลยีสารสนเทศ</Option>
            </Select>

            <Input
              placeholder="ค้นหารายวิชา..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 180 }}
              size="small"
            />

            {/* Pagination controls */}
            <span
              style={{ whiteSpace: "nowrap", fontSize: "12px", color: "#666" }}
            >
              รายการที่แสดง
            </span>
            <Select
              value={pageSize.toString()}
              style={{ width: 50 }}
              size="small"
              onChange={(value) => {
                const newSize = parseInt(value);
                handlePageSizeChange(newSize);
              }}
            >
              <Option value="5">5</Option>
              <Option value="10">10</Option>
              <Option value="20">20</Option>
              <Option value="50">50</Option>
            </Select>

            {/* Compact pagination numbers */}
            {totalPages > 1 && (
              <>
                {[1, 2, 3, 4, 5].map(
                  (page) =>
                    page <= totalPages && (
                      <span
                        key={page}
                        style={{
                          backgroundColor:
                            currentPage === page ? "#F26522" : "transparent",
                          color: currentPage === page ? "white" : "#666",
                          padding: "2px 6px",
                          borderRadius: "3px",
                          fontSize: "11px",
                          fontWeight: currentPage === page ? "bold" : "normal",
                          minWidth: "18px",
                          textAlign: "center",
                          cursor: "pointer",
                          display: "inline-block",
                        }}
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </span>
                    )
                )}

                {totalPages > 5 && (
                  <>
                    <span style={{ color: "#666", fontSize: "11px" }}>
                      ... {totalPages}
                    </span>
                  </>
                )}

                {currentPage < totalPages && (
                  <span
                    style={{
                      cursor: "pointer",
                      color: "#666",
                      fontSize: "11px",
                      whiteSpace: "nowrap",
                    }}
                    onClick={() => handlePageChange(currentPage + 1)}
                  >
                    ถัดไป
                  </span>
                )}
              </>
            )}

            <span
              style={{
                fontSize: "10px",
                whiteSpace: "nowrap",
                color: "#666",
              }}
            >
              แสดง {startIndex + 1}-{Math.min(endIndex, totalItems)} จาก{" "}
              {totalItems} รายการ
            </span>
          </div>

          {/* Spacer to push right content to the end */}
          <div style={{ flex: 1 }}></div>

          {/* Right group - Year/Term controls */}
          <div
            style={{
              display: "flex",
              gap: "6px",
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            <span
              style={{ fontSize: "12px", color: "#666", whiteSpace: "nowrap" }}
            >
              ปีการศึกษา
            </span>
            <Select defaultValue="2567" style={{ width: 70 }} size="small">
              <Option value="2565">2565</Option>
              <Option value="2566">2566</Option>
              <Option value="2567">2567</Option>
              <Option value="2568">2568</Option>
            </Select>

            <span
              style={{ fontSize: "12px", color: "#666", whiteSpace: "nowrap" }}
            >
              เทอม
            </span>
            <Select defaultValue="1" style={{ width: 50 }} size="small">
              <Option value="1">1</Option>
              <Option value="2">2</Option>
              <Option value="3">3</Option>
            </Select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div
        style={{
          backgroundColor: "white",
          border: "1px solid #d9d9d9",
          borderRadius: "6px",
          overflow: "hidden",
        }}
      >
        <Table
          columns={columns}
          dataSource={currentData}
          pagination={false}
          size="small"
          bordered
          scroll={{ x: 1800, y: 600 }}
          style={{
            fontSize: "12px",
          }}
          className="custom-table"
          locale={{
            emptyText: (
              <div
                style={{
                  padding: "40px",
                  textAlign: "center",
                  color: "#999",
                }}
              >
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>📚</div>
                <div style={{ fontSize: "16px", marginBottom: "8px" }}>
                  ไม่พบรายวิชาที่เปิดสอน
                </div>
                <div style={{ fontSize: "14px", color: "#ccc" }}>
                  ยังไม่มีรายวิชาที่เปิดสอนในภาคเรียนนี้
                </div>
              </div>
            ),
          }}
        />
      </div>

      {/* Footer Info */}
      <div
        style={{
          marginTop: "16px",
          padding: "12px 16px",
          backgroundColor: "#f8f9fa",
          borderRadius: "6px",
          border: "1px solid #e9ecef",
          fontSize: "12px",
          color: "#666",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            💡 <strong>หมายเหตุ:</strong>{" "}
            รายวิชาเหล่านี้เป็นรายวิชาที่เปิดสอนในภาคเรียนปัจจุบัน
          </div>
          <div>ข้อมูลล่าสุด: {new Date().toLocaleString("th-TH")}</div>
        </div>
      </div>
    </>
  );
};

export default OfferedCoursespage;
