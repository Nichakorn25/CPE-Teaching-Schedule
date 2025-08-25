import React, { useState, useEffect } from "react";
import {
  getAllCourses,
  deleteCourse,
} from "../../../services/https/AdminPageServices";
import { getMajorOfDepathment } from "../../../services/https/GetService";
import {
  AllCourseInterfaceForAllcourse,
  MajorInterfaceForAllcourse,
  DepartmentInterfaceForAllcourse,
} from "../../../interfaces/Adminpage";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { Button, Table, Input, Select, message } from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

const { Option } = Select;

interface CourseTableData extends AllCourseInterfaceForAllcourse {
  key: string;
  order: number;
}

const AllCourse: React.FC = () => {
  const userRole = localStorage.getItem("role");
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [department, setDepartment] = useState<
    DepartmentInterfaceForAllcourse[]
  >([]);
  const [major, setMajor] = useState<MajorInterfaceForAllcourse[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<number | "all">(
    "all"
  );
  const [selectedMajor, setSelectedMajor] = useState<number | "all">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [courseData, setCourseData] = useState<
    AllCourseInterfaceForAllcourse[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [containerWidth, setContainerWidth] = useState(window.innerWidth);

  useEffect(() => {
    const fetchMajors = async () => {
      try {
        const res = await getMajorOfDepathment();
        if (res.status === 200 && Array.isArray(res.data)) {
          const majorData = res.data as MajorInterfaceForAllcourse[];
          setMajor(majorData);

          const uniqueDepartments = Array.from(
            new Map(
              majorData.map((m) => [m.Department.ID, m.Department])
            ).values()
          );
          setDepartment(uniqueDepartments);
        }
      } catch (error) {
        message.error("เกิดข้อผิดพลาดในการโหลดข้อมูลสาขาวิชา");
      }
    };
    fetchMajors();
  }, []);

  // Monitor container width for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setContainerWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Determine responsive breakpoints
  const isSmallScreen = containerWidth < 1400;
  const isMobile = containerWidth < 768;

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await getAllCourses();

      if (response.status === 200 && Array.isArray(response.data)) {
        const mappedData: AllCourseInterfaceForAllcourse[] = response.data
          .filter((item: any) => item.CourseName && item.CourseCode)
          .map((item: any, index: number) => ({
            ID: item.ID,
            No: index + 1,
            CourseCode: item.CourseCode,
            CourseName: item.CourseName,
            Credit: item.Credit,
            CourseType: item.CourseType,
            CurriculumID: item.CurriculumID,
            Instructor: item.Instructor || [],
            MajorName: item.MajorName || {},
          }));
        setCourseData(mappedData);
      } else {
        console.error("โหลดข้อมูลรายวิชาไม่สำเร็จ", response);
        message.error("ไม่สามารถโหลดข้อมูลรายวิชาได้");
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
      message.error("เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const filteredCourses = courseData.filter(
    (course: AllCourseInterfaceForAllcourse) => {
      const matchesSearch =
        course.CourseName?.toLowerCase().includes(searchText.toLowerCase()) ||
        course.CourseCode?.toLowerCase().includes(searchText.toLowerCase()) ||
        course.Instructor?.some((instructor) =>
          instructor.toLowerCase().includes(searchText.toLowerCase())
        );

      const matchesCategory =
        selectedCategory === "all" || course.CourseType === selectedCategory;

      const matchesDepartment =
        selectedDepartment === "all" ||
        course.MajorName?.DepartmentID === selectedDepartment;

      const matchesMajor =
        selectedMajor === "all" || course.MajorName?.ID === selectedMajor;

      return (
        matchesSearch && matchesCategory && matchesDepartment && matchesMajor
      );
    }
  );

  // Convert data for table
  const tableData: CourseTableData[] = filteredCourses.map((course, index) => ({
    ...course,
    key: course.ID?.toString() || `${index}`,
    order: (currentPage - 1) * pageSize + index + 1,
  }));

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

  const handleDeleteCourse = async (id: number, courseName: string) => {
    const result = await Swal.fire({
      title: "คุณแน่ใจหรือไม่?",
      text: `คุณต้องการลบวิชา "${courseName}" หรือไม่?`,
      icon: "warning",
      showCancelButton: true,
      cancelButtonColor: "#d33",
      confirmButtonColor: "#f26522",
      cancelButtonText: "ยกเลิก",
      confirmButtonText: "ตกลง",
    });

    if (result.isConfirmed) {
      try {
        const loadingMessage = message.loading("กำลังลบข้อมูล...", 0);
        const response = await deleteCourse(id);
        loadingMessage();

        if (response.status === 200) {
          message.success(`ลบรายวิชา "${courseName}" สำเร็จ`);
          await fetchCourses(); // รีโหลดรายวิชาใหม่

          if (currentData.length === 1 && currentPage > 1) {
            setCurrentPage(currentPage - 1);
          }
        } else {
          const errorMsg = response.data?.error || "ไม่สามารถลบรายวิชาได้";
          message.error(`เกิดข้อผิดพลาด: ${errorMsg}`);
        }
      } catch (error) {
        message.error("เกิดข้อผิดพลาดในการลบข้อมูล กรุณาลองใหม่อีกครั้ง");
      }
    }
  };

  // Get unique categories for filter
  const categories = [
    ...new Set(courseData.map((course) => course.CourseType).filter(Boolean)),
  ];

  const getColumns = (): ColumnsType<CourseTableData> => {
  const columns: ColumnsType<CourseTableData> = [];

  if (isMobile) {
    // Mobile layout - Show essential columns only
    columns.push(
      {
        title: "#",
        dataIndex: "order",
        key: "order",
        width: 40,
        align: "center",
        render: (value: number) => (
          <span style={{ fontWeight: "bold", fontSize: "10px" }}>{value}</span>
        ),
      },
      {
        title: "รายวิชา",
        key: "course",
        width: 140,
        render: (_, record: CourseTableData) => (
          <div style={{ fontSize: "11px" }}>
            <div
              style={{
                fontWeight: "bold",
                color: "#1890ff",
                marginBottom: "2px",
              }}
            >
              {record.CourseCode}
            </div>
            <div style={{ fontWeight: "500", marginBottom: "2px" }}>
              {record.CourseName}
            </div>
            <div style={{ color: "#666", fontSize: "9px" }}>
              {record.Credit} หน่วยกิต | {record.CourseType}
            </div>
          </div>
        ),
      },
      {
        title: "อาจารย์",
        key: "instructors",
        width: 100,
        render: (_, record: CourseTableData) => (
          <div style={{ fontSize: "10px", textAlign: "center" }}>
            {record.Instructor?.slice(0, 2).map((instructor, idx) => (
              <div key={idx} style={{ marginBottom: "2px" }}>
                {instructor}
              </div>
            ))}
            {record.Instructor && record.Instructor.length > 2 && (
              <div style={{ color: "#666", fontSize: "9px" }}>
                +{record.Instructor.length - 2} คนอื่น
              </div>
            )}
          </div>
        ),
      }
    );

    // Add action column only if admin
    if (userRole === "admin") {
      columns.push({
        title: "จัดการ",
        key: "action",
        width: 120,
        align: "center",
        render: (_, record: CourseTableData) => (
          <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
            <Button
              size="small"
              icon={<EditOutlined />}
              style={{
                backgroundColor: "#F26522",
                borderColor: "#F26522",
                color: "white",
                fontSize: "11px",
                padding: "2px 8px",
                height: "auto",
              }}
              onClick={() => navigate(`/manage-course/${record.ID}`)}
              title="แก้ไขรายวิชา"
            >
              แก้ไข
            </Button>
            <Button
              size="small"
              icon={<DeleteOutlined />}
              style={{
                backgroundColor: "#ff4d4f",
                borderColor: "#ff4d4f",
                color: "white",
                fontSize: "11px",
                padding: "2px 8px",
                height: "auto",
              }}
              onClick={() => handleDeleteCourse(record.ID, record.CourseName)}
              title="ลบรายวิชา"
            >
              ลบ
            </Button>
          </div>
        ),
      });
    }

    return columns; // return สำหรับ mobile เสร็จ
  }

  // Desktop/Tablet layout
  columns.push(
    {
      title: "ลำดับ",
      dataIndex: "order",
      key: "order",
      width: 60,
      align: "center",
      render: (value: number) => <span style={{ fontWeight: "bold" }}>{value}</span>,
    },
    {
      title: "รหัสวิชา",
      dataIndex: "CourseCode",
      key: "code",
      width: 100,
      render: (value: string) => (
        <span style={{ fontWeight: "bold", color: "#1890ff" }}>{value}</span>
      ),
    },
    {
      title: "ชื่อวิชา",
      dataIndex: "CourseName",
      key: "name",
      width: isSmallScreen ? 180 : 220,
      render: (value: string) => <span style={{ fontWeight: "500" }}>{value}</span>,
    },
    {
      title: "หน่วยกิต",
      dataIndex: "Credit",
      key: "credit",
      width: 80,
      align: "center",
      render: (value: number) => (
        <span
          style={{
            backgroundColor: "#e6f7ff",
            color: "#1890ff",
            padding: "2px 6px",
            borderRadius: "4px",
            fontSize: "11px",
            fontWeight: "bold",
            border: "1px solid #91d5ff",
          }}
        >
          {value}
        </span>
      ),
    },
    {
      title: "หมวดวิชา",
      dataIndex: "CourseType",
      key: "category",
      width: isSmallScreen ? 120 : 140,
      align: "center",
    }
  );

  if (!isSmallScreen) {
    columns.push({
      title: "อาจารย์ผู้สอน",
      dataIndex: "Instructor",
      key: "instructors",
      width: 200,
      render: (value: string[]) => (
        <div style={{ fontSize: "12px" }}>{value?.join(", ") || "-"}</div>
      ),
    });
  }

  // Add action column only if admin
  if (userRole === "admin") {
    columns.push({
      title: "จัดการ",
      key: "action",
      width: 120,
      align: "center",
      render: (_, record: CourseTableData) => (
        <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
          <Button
            size="small"
            icon={<EditOutlined />}
            style={{
              backgroundColor: "#F26522",
              borderColor: "#F26522",
              color: "white",
              fontSize: "11px",
              padding: "2px 8px",
              height: "auto",
            }}
            onClick={() => navigate(`/manage-course/${record.ID}`)}
            title="แก้ไขรายวิชา"
          >
            แก้ไข
          </Button>
          <Button
            size="small"
            icon={<DeleteOutlined />}
            style={{
              backgroundColor: "#ff4d4f",
              borderColor: "#ff4d4f",
              color: "white",
              fontSize: "11px",
              padding: "2px 8px",
              height: "auto",
            }}
            onClick={() => handleDeleteCourse(record.ID, record.CourseName)}
            title="ลบรายวิชา"
          >
            ลบ
          </Button>
        </div>
      ),
    });
  }

  return columns;
};


  return (
    <div
      style={{
        fontFamily: "Sarabun, sans-serif",
        padding: 0,
        margin: 0,
      }}
    >
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
            fontSize: isMobile ? "18px" : "20px",
            fontWeight: "bold",
            fontFamily: "Sarabun, sans-serif",
          }}
        >
          รายวิชาทั้งหมด
        </h2>
        <p
          style={{
            margin: 0,
            color: "#666",
            fontSize: isMobile ? "12px" : "13px",
            fontFamily: "Sarabun, sans-serif",
          }}
        >
          จัดการข้อมูลรายวิชาทั้งหมดในหลักสูตร
        </p>
      </div>

      {/* Controls Section */}
      <div style={{ marginBottom: "20px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            backgroundColor: "#f8f9fa",
            padding: isMobile ? "8px 12px" : "12px 16px",
            borderRadius: "8px",
            border: "1px solid #e9ecef",
            minHeight: "48px",
            flexWrap: isMobile ? "wrap" : "nowrap",
            gap: isMobile ? "8px" : "12px",
          }}
        >
          {/* Search controls */}
          <Input
            placeholder="ค้นหารายวิชา..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{
              width: isMobile ? "100%" : 200,
              fontFamily: "Sarabun, sans-serif",
            }}
            size="small"
          />

          {/* หมวดวิชา */}
          <Select
            value={selectedCategory}
            onChange={setSelectedCategory}
            style={{
              width: isMobile ? "100%" : 150,
              fontFamily: "Sarabun, sans-serif",
            }}
            placeholder="เลือกหมวดวิชา"
            size="small"
          >
            <Option value="all">ทุกหมวดวิชา</Option>
            {categories.map((category) => (
              <Option key={category} value={category}>
                {category}
              </Option>
            ))}
          </Select>

          {/* สำนักวิชา */}
          <Select
            value={selectedDepartment}
            onChange={(value) => {
              setSelectedDepartment(value);
              setSelectedMajor("all"); // reset major เมื่อเปลี่ยนสำนักวิชา
            }}
            style={{
              width: isMobile ? "100%" : 150,
              fontFamily: "Sarabun, sans-serif",
            }}
            placeholder="เลือกสำนักวิชา"
            size="small"
          >
            <Option value="all">ทุกสำนักวิชา</Option>
            {department.map((dep) => (
              <Option key={dep.ID} value={dep.ID}>
                {dep.DepartmentName}
              </Option>
            ))}
          </Select>

          {/* สาขาวิชา */}
          <Select
            value={selectedMajor}
            onChange={setSelectedMajor}
            style={{
              width: isMobile ? "100%" : 150,
              fontFamily: "Sarabun, sans-serif",
            }}
            placeholder="เลือกสาขาวิชา"
            size="small"
            disabled={selectedDepartment === "all"}
          >
            <Option value="all">ทุกสาขา</Option>
            {major
              .filter(
                (m) =>
                  selectedDepartment === "all" ||
                  m.DepartmentID === selectedDepartment
              )
              .map((m) => (
                <Option key={m.ID} value={m.ID}>
                  {m.MajorName}
                </Option>
              ))}
          </Select>

          {/* Pagination controls for desktop */}
          {!isMobile && (
            <>
              <span
                style={{
                  whiteSpace: "nowrap",
                  fontSize: "12px",
                  color: "#666",
                  fontFamily: "Sarabun, sans-serif",
                }}
              >
                รายการที่แสดง
              </span>
              <Select
                value={pageSize.toString()}
                style={{
                  width: 50,
                  fontFamily: "Sarabun, sans-serif",
                }}
                size="small"
                onChange={(value) => handlePageSizeChange(parseInt(value))}
              >
                <Option value="5">5</Option>
                <Option value="10">10</Option>
                <Option value="20">20</Option>
                <Option value="50">50</Option>
              </Select>

              {/* Page numbers */}
              {totalPages > 1 && (
                <div
                  style={{ display: "flex", gap: "4px", alignItems: "center" }}
                >
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
                            fontWeight:
                              currentPage === page ? "bold" : "normal",
                            minWidth: "18px",
                            textAlign: "center",
                            cursor: "pointer",
                            display: "inline-block",
                            fontFamily: "Sarabun, sans-serif",
                          }}
                          onClick={() => handlePageChange(page)}
                        >
                          {page}
                        </span>
                      )
                  )}
                  {totalPages > 5 && (
                    <span
                      style={{
                        color: "#666",
                        fontSize: "11px",
                        fontFamily: "Sarabun, sans-serif",
                      }}
                    >
                      ... {totalPages}
                    </span>
                  )}
                </div>
              )}

              <div style={{ flex: 1 }}></div>
            </>
          )}

          {/* Add Course Button */}
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate("/manage-course")}
            style={{
              backgroundColor: "#52c41a",
              borderColor: "#52c41a",
              fontSize: "12px",
              width: isMobile ? "100%" : "auto",
              fontFamily: "Sarabun, sans-serif",
            }}
            size="small"
          >
            เพิ่มรายวิชา
          </Button>

        </div>

        {/* Mobile pagination */}
        {isMobile && totalPages > 1 && (
          <div
            style={{
              marginTop: "12px",
              padding: "8px 12px",
              backgroundColor: "#f8f9fa",
              borderRadius: "6px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Select
              value={pageSize.toString()}
              style={{
                width: 70,
                fontFamily: "Sarabun, sans-serif",
              }}
              size="small"
              onChange={(value) => handlePageSizeChange(parseInt(value))}
            >
              <Option value="5">5</Option>
              <Option value="10">10</Option>
              <Option value="20">20</Option>
            </Select>

            <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
              <Button
                size="small"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
                style={{ fontFamily: "Sarabun, sans-serif" }}
              >
                ←
              </Button>
              <span
                style={{
                  fontSize: "12px",
                  padding: "0 8px",
                  fontFamily: "Sarabun, sans-serif",
                }}
              >
                {currentPage}/{totalPages}
              </span>
              <Button
                size="small"
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
                style={{ fontFamily: "Sarabun, sans-serif" }}
              >
                →
              </Button>
            </div>
          </div>
        )}
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
          columns={getColumns()}
          dataSource={currentData}
          pagination={false}
          size="small"
          bordered
          scroll={{
            x: isMobile ? 350 : isSmallScreen ? 800 : 1200,
            y: isMobile ? 400 : 600,
          }}
          loading={loading}
          style={{
            fontSize: isMobile ? "11px" : "12px",
            fontFamily: "Sarabun, sans-serif",
          }}
          className="custom-table"
          locale={{
            emptyText: (
              <div
                style={{
                  padding: isMobile ? "20px" : "40px",
                  textAlign: "center",
                  color: "#999",
                  fontFamily: "Sarabun, sans-serif",
                }}
              >
                <div
                  style={{
                    fontSize: isMobile ? "32px" : "48px",
                    marginBottom: "16px",
                  }}
                >
                  📚
                </div>
                <div
                  style={{
                    fontSize: isMobile ? "14px" : "16px",
                    marginBottom: "8px",
                  }}
                >
                  ไม่พบข้อมูลรายวิชา
                </div>
                <div
                  style={{
                    fontSize: isMobile ? "12px" : "14px",
                    color: "#ccc",
                  }}
                >
                  ยังไม่มีรายวิชาในระบบ
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
          padding: isMobile ? "8px 12px" : "12px 16px",
          backgroundColor: "#f8f9fa",
          borderRadius: "6px",
          border: "1px solid #e9ecef",
          fontSize: isMobile ? "11px" : "12px",
          color: "#666",
          fontFamily: "Sarabun, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexDirection: isMobile ? "column" : "row",
            gap: isMobile ? "8px" : "0",
          }}
        >
          <div>
            💡 <strong>หมายเหตุ:</strong>{" "}
            ข้อมูลรายวิชาเหล่านี้ใช้สำหรับการจัดตารางเรียนและการลงทะเบียน
          </div>
          <div>
            ข้อมูลล่าสุด: {new Date().toLocaleString("th-TH")} |
            <span
              style={{
                marginLeft: "8px",
                cursor: "pointer",
                color: "#F26522",
                fontWeight: "500",
              }}
              onClick={fetchCourses}
              title="รีเฟรชข้อมูล"
            >
              🔄 รีเฟรช
            </span>
          </div>
        </div>
      </div>

      {/* Additional Info for Mobile */}
      {isMobile && (
        <div
          style={{
            marginTop: "12px",
            padding: "8px 12px",
            backgroundColor: "#fff3cd",
            borderRadius: "6px",
            border: "1px solid #ffeaa7",
            fontSize: "11px",
            color: "#856404",
            fontFamily: "Sarabun, sans-serif",
          }}
        >
          <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
            💡 เคล็ดลับการใช้งาน:
          </div>
          <div>• ใช้การค้นหาเพื่อหารายวิชาที่ต้องการได้เร็วขึ้น</div>
          <div>• กรองข้อมูลตามหมวดวิชาที่สนใจ</div>
          <div>• หมุนหน้าจอเป็นแนวนอนเพื่อดูข้อมูลเพิ่มเติม</div>
          <div>• กดปุ่ม "เพิ่มรายวิชา" เพื่อเพิ่มรายวิชาใหม่</div>
        </div>
      )}
    </div>
  );
};

export default AllCourse;
