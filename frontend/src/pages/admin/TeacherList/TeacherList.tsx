import React, { useState, useEffect } from "react";
import {
  getAllTeachers,
  deleteUser,
} from "../../../services/https/AdminPageServices";
import {
  AllTeacher,
  DepartmentInterface,
  MajorInterface,
} from "../../../interfaces/Adminpage";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { Button, Table, Input, Select, message } from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { getMajorOfDepathment } from "../../../services/https/GetService";

const { Option } = Select;

interface TeacherTableData extends AllTeacher {
  key: string;
  order: number;
}

const normalize = (s?: string | null) => (s ?? "").trim().toLowerCase();

const TeacherList: React.FC = () => {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [teacherData, setTeacherData] = useState<AllTeacher[]>([]);
  const [loading, setLoading] = useState(false);
  const [containerWidth, setContainerWidth] = useState(window.innerWidth);
  const [departments, setDepartments] = useState<DepartmentInterface[]>([]);
  const [majors, setMajors] = useState<MajorInterface[]>([]);
  const [filteredMajors, setFilteredMajors] = useState<MajorInterface[]>([]);
  const [selectedDepartmentID, setSelectedDepartmentID] = useState<
    number | "all"
  >("all");
  const [selectedMajorID, setSelectedMajorID] = useState<number | "all">("all");

  // ── NEW: role & userMajor ──────────────────────────────────────────────────────────────────────────
  const [role, setRole] = useState<string>("");
  const [userMajor, setUserMajor] = useState<string>("");

  const isSmallScreen = containerWidth < 1400;
  const isMobile = containerWidth < 768;

  const isAdmin =
    role === "admin" || role === "administrator" || role === "superadmin";
  const isScheduler =
    role === "scheduler" || role === "schedule" || role === "coordinator";

  useEffect(() => {
    const handleResize = () => setContainerWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ── Load role & major from localStorage ──────────────────────────────────────────────────────────
  useEffect(() => {
    const r = (
      localStorage.getItem("role") ||
      localStorage.getItem("user_role") ||
      localStorage.getItem("role_name") ||
      ""
    ).toLowerCase();
    const m = localStorage.getItem("major_name") || "";
    setRole(r);
    setUserMajor(m);
    if (r) console.log("[DEBUG] current role:", r);
    if (m) console.log("[DEBUG] current userMajor:", m);
  }, []);

  const fetchAllTeachers = async () => {
    try {
      setLoading(true);
      const response = await getAllTeachers();
      if (response.status === 200 && Array.isArray(response.data)) {
        const mappedData: AllTeacher[] = response.data
          .filter((item: any) => item.Firstname && item.Lastname)
          .map((item: any, index: number) => ({
            ID: index + 1,
            DeleteID: item.ID,
            Title: item.Title,
            Firstname: item.Firstname,
            Lastname: item.Lastname,
            Email: item.Email,
            EmpId: item.Username,
            Department: item.Department,
            Major: item.Major,
            Position: item.Position,
            Status: item.Status,
            Role: item.Role,
          }));

        // ⛳ ถ้าเป็น scheduler → เห็นเฉพาะอาจารย์ในสาขาตัวเอง
        const data =
          isScheduler && userMajor
            ? mappedData.filter(
                (t) => normalize(t.Major) === normalize(userMajor)
              )
            : mappedData;

        setTeacherData(data);
      } else {
        console.error("โหลดข้อมูลรายชื่ออาจารย์ไม่สำเร็จ", response);
        message.error("ไม่สามารถโหลดข้อมูลอาจารย์ได้");
      }
    } catch (error) {
      console.error("Error fetching teachers:", error);
      message.error("เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // โหลดใหม่เมื่อรู้ role/major แล้ว เพื่อให้กรองตามเงื่อนไขได้
    if (role !== "") {
      fetchAllTeachers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, userMajor]);

  // ── Load departments & majors (ใช้กับแค่ admin เท่านั้น) ──────────────────────────────────────────
  useEffect(() => {
    const fetchDepartmentsAndMajors = async () => {
      const res = await getMajorOfDepathment();
      if (res.status === 200) {
        const allMajors = res.data;
        setMajors(allMajors);

        const uniqueDepartments = Array.from(
          new Set(allMajors.map((m: any) => m.Department.ID))
        ).map((id) => {
          return allMajors.find((m: any) => m.Department.ID === id)?.Department;
        });

        setDepartments(uniqueDepartments);
      }
    };
    fetchDepartmentsAndMajors();
  }, []);

  useEffect(() => {
    if (selectedDepartmentID === "all") {
      setFilteredMajors(majors);
    } else {
      setFilteredMajors(
        majors.filter((m) => m.Department.ID === selectedDepartmentID)
      );
    }
  }, [selectedDepartmentID, majors]);

  // ── Filter (search + department/major dropdown) ──────────────────────────────────────────────────
  const filteredTeachers = teacherData.filter((teacher) => {
    const q = searchText.toLowerCase();
    const matchesSearch =
      teacher.Firstname?.toLowerCase().includes(q) ||
      teacher.Lastname?.toLowerCase().includes(q) ||
      teacher.Email?.toLowerCase().includes(q) ||
      teacher.EmpId?.toLowerCase().includes(q);

    // ถ้าไม่ใช่แอดมิน (เช่น scheduler) ใช้เฉพาะ search
    if (!isAdmin) return matchesSearch;

    // ── สำหรับ Admin ──────────────────────────────────────
    const selectedDepartmentName = departments.find(
      (d) => d.ID === selectedDepartmentID
    )?.DepartmentName;
    const selectedMajorName = majors.find(
      (m) => m.ID === selectedMajorID
    )?.MajorName;

    const matchesDepartment =
      selectedDepartmentID === "all" ||
      teacher.Department === selectedDepartmentName;

    const matchesMajor =
      selectedMajorID === "all" || teacher.Major === selectedMajorName;

    //ถ้าเลือกแค่สำนัก → กรองตามสำนักเลย
    //ถ้าเลือกสาขาด้วย → ต้อง match ทั้งสำนักและสาขา
    return matchesSearch && matchesDepartment && matchesMajor;
  });

  // ── Table data & pagination ───────────────────────────────────────────────────────────────────────
  const tableData: TeacherTableData[] = filteredTeachers.map(
    (teacher, index) => ({
      ...teacher,
      key: teacher.DeleteID?.toString() || `${index}`,
      order: (currentPage - 1) * pageSize + index + 1,
    })
  );

  const totalItems = tableData.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentData = tableData.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => setCurrentPage(page);
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const handleDeleteTeacher = async (
    deleteID: number,
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
      try {
        const loadingMessage = message.loading("กำลังลบข้อมูล...", 0);
        const response = await deleteUser(deleteID);
        loadingMessage();

        if (response.status === 200) {
          message.success(`ลบ ${title} ${fullName} สำเร็จ`);
          setTeacherData((prev) => prev.filter((t) => t.DeleteID !== deleteID));
          if (currentData.length === 1 && currentPage > 1)
            setCurrentPage(currentPage - 1);
        } else {
          const errorMsg = response.data?.error || "ไม่สามารถลบอาจารย์ได้";
          message.error(`เกิดข้อผิดพลาด: ${errorMsg}`);
        }
      } catch (error) {
        message.error("เกิดข้อผิดพลาดในการลบข้อมูล กรุณาลองใหม่อีกครั้ง");
      }
    }
  };

  // ── Columns: แยกตามหน้าจอ & role ───────────────────────────────────────────────────────────────────
  const getColumns = (): ColumnsType<TeacherTableData> => {
    if (isMobile) {
      // Mobile layout (ไม่มี EmpId อยู่แล้ว) → ซ่อน "จัดการ" ถ้าไม่ใช่ admin
      const base: ColumnsType<TeacherTableData> = [
        {
          title: "ลำดับ",
          dataIndex: "order",
          key: "order",
          width: 40,
          align: "center",
          render: (v: number) => (
            <span style={{ fontWeight: "bold", fontSize: "10px" }}>{v}</span>
          ),
        },
        {
          title: "อาจารย์",
          key: "teacher",
          width: 160,
          render: (_, r) => (
            <div style={{ fontSize: "11px" }}>
              <div
                style={{
                  fontWeight: "bold",
                  color: "#1890ff",
                  marginBottom: "2px",
                }}
              >
                {typeof r.Title === "string" ? r.Title : r.Title?.Title || "-"}
              </div>
              <div style={{ fontWeight: 500 }}>
                {r.Firstname} {r.Lastname}
              </div>
              <div style={{ color: "#666", fontSize: "9px" }}>{r.Major}</div>
            </div>
          ),
        },
      ];

      if (isAdmin) {
        base.push({
          title: "จัดการ",
          key: "action",
          width: 70,
          align: "center",
          render: (_, record) => (
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Button
                size="small"
                style={{
                  backgroundColor: "#F26522",
                  borderColor: "#F26522",
                  color: "white",
                  fontSize: 9,
                  padding: "1px 4px",
                  height: 20,
                  lineHeight: "18px",
                }}
                onClick={() => navigate(`/manage-teacher/${record.DeleteID}`)}
              >
                แก้ไข
              </Button>
              <Button
                size="small"
                style={{
                  backgroundColor: "#ff4d4f",
                  borderColor: "#ff4d4f",
                  color: "white",
                  fontSize: 9,
                  padding: "1px 4px",
                  height: 20,
                  lineHeight: "18px",
                }}
                onClick={() =>
                  handleDeleteTeacher(
                    record.DeleteID,
                    `${record.Firstname} ${record.Lastname}`,
                    typeof record.Title === "string"
                      ? record.Title
                      : record.Title?.Title || ""
                  )
                }
              >
                ลบ
              </Button>
            </div>
          ),
        });
      }

      return base;
    }

    // Desktop / Tablet
    const columns: ColumnsType<TeacherTableData> = [
      {
        title: "ลำดับ",
        dataIndex: "order",
        key: "order",
        width: 60,
        align: "center",
        render: (v: number) => <span style={{ fontWeight: "bold" }}>{v}</span>,
      },
      {
        title: "ตำแหน่งทางวิชาการ",
        dataIndex: "Title",
        key: "Title",
        width: 120,
        render: (v: any) => (
          <span style={{ fontWeight: "bold", color: "#1890ff" }}>
            {typeof v === "string" ? v : v?.Title || "-"}
          </span>
        ),
      },
      {
        title: "ชื่อ-นามสกุล",
        key: "fullname",
        width: 200,
        render: (_, r) => (
          <span style={{ fontWeight: 500 }}>
            {r.Firstname} {r.Lastname}
          </span>
        ),
      },
    ];

    // ⛳ EmpId เฉพาะ admin
    if (!isScheduler) {
      columns.push({
        title: "รหัสพนักงาน",
        dataIndex: "EmpId",
        key: "EmpId",
        width: 120,
        align: "center",
      });
    }

    if (!isSmallScreen) {
      columns.push({
        title: "อีเมล",
        dataIndex: "Email",
        key: "Email",
        width: 220,
        render: (value: string) => (
          <a
            href={`mailto:${value}`}
            style={{ color: "#1890ff", fontSize: 12 }}
          >
            {value}
          </a>
        ),
      });
    }

    columns.push(
      {
        title: "สำนักวิชา",
        dataIndex: "Department",
        key: "Department",
        width: isSmallScreen ? 120 : 160,
        align: "center",
      },
      {
        title: "สาขาวิชา",
        dataIndex: "Major",
        key: "Major",
        width: isSmallScreen ? 140 : 180,
        align: "center",
      }
    );

    if (!isSmallScreen) {
      columns.push(
        {
          title: "ตำแหน่ง",
          dataIndex: "Position",
          key: "Position",
          width: 150,
          align: "center",
        },
        {
          title: "บทบาท",
          dataIndex: "Role",
          key: "Role",
          width: 100,
          align: "center",
        }
      );
    }

    // ⛳ คอลัมน์จัดการเฉพาะ admin
    if (isAdmin) {
      columns.push({
        title: "จัดการ",
        key: "action",
        width: 120,
        align: "center",
        render: (_, record) => (
          <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
            <Button
              size="small"
              icon={<EditOutlined />}
              style={{
                backgroundColor: "#F26522",
                borderColor: "#F26522",
                color: "white",
                fontSize: 11,
                padding: "2px 8px",
                height: "auto",
              }}
              onClick={() => navigate(`/manage-teacher/${record.DeleteID}`)}
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
                fontSize: 11,
                padding: "2px 8px",
                height: "auto",
              }}
              onClick={() =>
                handleDeleteTeacher(
                  record.DeleteID,
                  `${record.Firstname} ${record.Lastname}`,
                  typeof record.Title === "string"
                    ? record.Title
                    : record.Title?.Title || ""
                )
              }
            >
              ลบ
            </Button>
          </div>
        ),
      });
    }

    return columns;
  };

  // ฟังก์ชันสำหรับสร้าง pagination ที่ปรับปรุงแล้ว
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const getPaginationRange = () => {
      const delta = 2; // จำนวนหน้าที่แสดงข้างๆ หน้าปัจจุบัน
      const range = [];
      const rangeWithDots = [];

      // คำนวณช่วงที่จะแสดง
      const start = Math.max(1, currentPage - delta);
      const end = Math.min(totalPages, currentPage + delta);

      // เพิ่มหน้าแรกถ้าจำเป็น
      if (start > 1) {
        rangeWithDots.push(1);
        if (start > 2) {
          rangeWithDots.push('...');
        }
      }

      // เพิ่มหน้าในช่วง
      for (let i = start; i <= end; i++) {
        rangeWithDots.push(i);
      }

      // เพิ่มหน้าสุดท้ายถ้าจำเป็น
      if (end < totalPages) {
        if (end < totalPages - 1) {
          rangeWithDots.push('...');
        }
        rangeWithDots.push(totalPages);
      }

      return rangeWithDots;
    };

    const paginationRange = getPaginationRange();

    return (
      <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
        {/* ปุ่มก่อนหน้า */}
        <span
          style={{
            backgroundColor: currentPage === 1 ? "#f5f5f5" : "#F26522",
            color: currentPage === 1 ? "#ccc" : "white",
            padding: "2px 6px",
            borderRadius: "3px",
            fontSize: "11px",
            fontWeight: "bold",
            minWidth: "18px",
            textAlign: "center",
            cursor: currentPage === 1 ? "not-allowed" : "pointer",
            display: "inline-block",
            fontFamily: "Sarabun, sans-serif",
          }}
          onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
        >
          ‹
        </span>

        {/* หน้าต่างๆ */}
        {paginationRange.map((page, index) => {
          if (page === '...') {
            return (
              <span 
                key={`dots-${index}`} 
                style={{ 
                  color: "#666", 
                  fontSize: "11px", 
                  padding: "2px 6px",
                  fontFamily: "Sarabun, sans-serif",
                }}
              >
                ...
              </span>
            );
          }

          return (
            <span
              key={page}
              style={{
                backgroundColor: currentPage === page ? "#F26522" : "transparent",
                color: currentPage === page ? "white" : "#666",
                padding: "2px 6px",
                borderRadius: "3px",
                fontSize: "11px",
                fontWeight: currentPage === page ? "bold" : "normal",
                minWidth: "18px",
                textAlign: "center",
                cursor: "pointer",
                display: "inline-block",
                fontFamily: "Sarabun, sans-serif",
              }}
              onClick={() => handlePageChange(page as number)}
            >
              {page}
            </span>
          );
        })}

        {/* ปุ่มถัดไป */}
        <span
          style={{
            backgroundColor: currentPage === totalPages ? "#f5f5f5" : "#F26522",
            color: currentPage === totalPages ? "#ccc" : "white",
            padding: "2px 6px",
            borderRadius: "3px",
            fontSize: "11px",
            fontWeight: "bold",
            minWidth: "18px",
            textAlign: "center",
            cursor: currentPage === totalPages ? "not-allowed" : "pointer",
            display: "inline-block",
            fontFamily: "Sarabun, sans-serif",
          }}
          onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
        >
          ›
        </span>
      </div>
    );
  };

  return (
    <div style={{ fontFamily: "Sarabun, sans-serif", padding: 0, margin: 0 }}>
      {/* Page Title */}
      <div
        style={{
          marginBottom: 20,
          paddingBottom: 12,
          borderBottom: "2px solid #F26522",
        }}
      >
        <h2
          style={{
            margin: "0 0 8px 0",
            color: "#333",
            fontSize: isMobile ? 18 : 20,
            fontWeight: "bold",
          }}
        >
          รายชื่ออาจารย์ผู้สอน
        </h2>
        <p style={{ margin: 0, color: "#666", fontSize: isMobile ? 12 : 13 }}>
          {isScheduler
            ? `แสดงเฉพาะอาจารย์ในสาขา: ${userMajor || "-"}`
            : "จัดการข้อมูลอาจารย์ผู้สอนทุกคน สำหรับการบริหารจัดการระบบ"}
        </p>
      </div>

      {/* Controls */}
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            backgroundColor: "#f8f9fa",
            padding: isMobile ? "8px 12px" : "12px 16px",
            borderRadius: 8,
            border: "1px solid #e9ecef",
            minHeight: 48,
            flexWrap: isMobile ? "wrap" : "nowrap",
            gap: isMobile ? 8 : 12,
          }}
        >
          {/* ⛳ ซ่อนดรอปดาวสำนักวิชา/สาขาเมื่อเป็น scheduler */}
          {!isScheduler && (
            <>
              <Select
                value={selectedDepartmentID}
                onChange={(value) => {
                  setSelectedDepartmentID(value);
                  setSelectedMajorID("all"); // รีเซ็ตให้เลือกได้ทุกสาขาของสำนักนั้น
                }}
                style={{ width: isMobile ? "100%" : 200 }}
                size="small"
                placeholder="เลือกสำนักวิชา"
              >
                <Option value="all">ทุกสำนักวิชา</Option>
                {departments.map((dep) => (
                  <Option key={dep.ID} value={dep.ID}>
                    {dep.DepartmentName}
                  </Option>
                ))}
              </Select>

              <Select
                value={selectedMajorID}
                onChange={(value) => setSelectedMajorID(value)}
                style={{ width: isMobile ? "100%" : 200 }}
                size="small"
                placeholder="เลือกสาขาวิชา"
              >
                <Option value="all">ทุกสาขาวิชา</Option>
                {filteredMajors.map((major) => (
                  <Option key={major.ID} value={major.ID}>
                    {major.MajorName}
                  </Option>
                ))}
              </Select>
            </>
          )}

          <Input
            placeholder="ค้นหาอาจารย์..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: isMobile ? "100%" : 200 }}
            size="small"
          />

          {!isMobile && (
            <>
              <span
                style={{ whiteSpace: "nowrap", fontSize: 12, color: "#666" }}
              >
                รายการที่แสดง
              </span>
              <Select
                value={pageSize.toString()}
                style={{ width: 50 }}
                size="small"
                onChange={(value) => handlePageSizeChange(parseInt(value))}
              >
                <Option value="5">5</Option>
                <Option value="10">10</Option>
                <Option value="20">20</Option>
                <Option value="50">50</Option>
              </Select>

              {/* ใช้ฟังก์ชัน pagination ใหม่ */}
              {renderPagination()}

              <div style={{ flex: 1 }} />
            </>
          )}

          {/* ⛳ ปุ่มเพิ่มอาจารย์: เฉพาะ admin */}
          {isAdmin && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate("/manage-teacher")}
              style={{
                backgroundColor: "#52c41a",
                borderColor: "#52c41a",
                fontSize: 12,
              }}
              size="small"
            >
              เพิ่มอาจารย์
            </Button>
          )}
        </div>

        {/* Mobile pagination */}
        {isMobile && totalPages > 1 && (
          <div
            style={{
              marginTop: 12,
              padding: "8px 12px",
              backgroundColor: "#f8f9fa",
              borderRadius: 6,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Select
              value={pageSize.toString()}
              style={{ width: 70 }}
              size="small"
              onChange={(value) => handlePageSizeChange(parseInt(value))}
            >
              <Option value="5">5</Option>
              <Option value="10">10</Option>
              <Option value="20">20</Option>
            </Select>

            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              <Button
                size="small"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                ←
              </Button>
              <span style={{ fontSize: 12, padding: "0 8px" }}>
                {currentPage}/{totalPages}
              </span>
              <Button
                size="small"
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                →
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div
        style={{
          backgroundColor: "white",
          border: "1px solid #d9d9d9",
          borderRadius: 6,
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
            x: isMobile ? 350 : isSmallScreen ? 1000 : 1800,
            y: isMobile ? 400 : 600,
          }}
          loading={loading}
          style={{ fontSize: isMobile ? 11 : 12 }}
          locale={{
            emptyText: (
              <div
                style={{
                  padding: isMobile ? 20 : 40,
                  textAlign: "center",
                  color: "#999",
                }}
              >
                <div style={{ fontSize: isMobile ? 32 : 48, marginBottom: 16 }}>
                  👨‍🏫
                </div>
                <div style={{ fontSize: isMobile ? 14 : 16, marginBottom: 8 }}>
                  ไม่พบข้อมูลอาจารย์
                </div>
                <div style={{ fontSize: isMobile ? 12 : 14, color: "#ccc" }}>
                  {isScheduler
                    ? "ไม่พบอาจารย์ในสาขาของคุณ"
                    : "ยังไม่มีข้อมูลอาจารย์ในระบบ"}
                </div>
              </div>
            ),
          }}
        />
      </div>

      {/* Footer Info */}
      <div
        style={{
          marginTop: 16,
          padding: isMobile ? "8px 12px" : "12px 16px",
          backgroundColor: "#f8f9fa",
          borderRadius: 6,
          border: "1px solid #e9ecef",
          fontSize: isMobile ? 11 : 12,
          color: "#666",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexDirection: isMobile ? "column" : "row",
            gap: isMobile ? 8 : 0,
          }}
        >
          <div>
            💡 <strong>หมายเหตุ:</strong>{" "}
            ข้อมูลอาจารย์เหล่านี้ใช้สำหรับการบริหารจัดการระบบตารางเรียน
          </div>
          <div>
            ข้อมูลล่าสุด: {new Date().toLocaleString("th-TH")}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherList;