import React, { useState, useEffect, useMemo } from "react";
import { Button, Table, Input, Select, message } from "antd";
import {
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import type { ColumnsType } from "antd/es/table";
import { deleteOfferedCourse } from "../../../services/https/SchedulerPageService";
import { OpenCourseInterface } from "../../../interfaces/Adminpage";
import { getOfferedCoursesByMajor } from "../../../services/https/GetService";

const { Option } = Select;

/** ---------------- types จาก payload ---------------- */
type CreditInAllCourses = {
  ID: number;
  CreatedAt: string;
  UpdatedAt: string;
  DeletedAt: string | null;
  Unit: number;
  Lecture: number;
  Lab: number;
  Self: number;
  AllCourses: null;
};

type TimeFixedCourse = {
  ID: number;
  Year: number;
  Term: number;
  DayOfWeek: string;
  StartTime: string;
  EndTime: string;
  RoomFix: string;
  Section: number;
};

interface Schedule {
  ID: number;
  NameTable: string;
  SectionNumber: number;
  DayOfWeek: string;
  StartTime: string;
  EndTime: string;
  OfferedCoursesID: number;
  OfferedCourses: {
    ID: number;
    Year: number;
    Term: number;
    Section: number;
    Capacity: number;
    IsFixCourses: boolean;
    UserID: number;
    User: {
      ID: number;
      Firstname: string;
      Lastname: string;
      Title?: { Title: string } | null;
    };
    Laboratory?: {
      ID: number;
      Room?: string;
      Building?: string;
      Capacity?: string;
    } | null;
    AllCoursesID: number;
    AllCourses: {
      Code: string;
      EnglishName?: string;
      ThaiName?: string;
      Curriculum: {
        Major?: { MajorName: string } | null;
      };
      AcademicYear: { ID: number; Level: string };
      TypeOfCourses: { ID: number; Type: number; TypeName: string };
      CreditID: number;
      Credit: CreditInAllCourses;
    };
  };
  TimeFixedCourses?: TimeFixedCourse[];
}

interface CourseTableData {
  key: string;
  order: number;
  ID: number;
  Code: string;
  CourseName: string;
  Credit: string;
  TypeOfCourse: string;
  Sections: any[];
  TotalSections: number;
  IsFixCourses: boolean;
  isChild?: boolean;
  isLastChild?: boolean;
  Section?: any;
}

/** ---------------- helpers: format ---------------- */
const pad2 = (n: number) => (n < 10 ? `0${n}` : `${n}`);

function toTimeSpan(startISO: string, endISO: string) {
  const s = new Date(startISO);
  const e = new Date(endISO);
  const sh = pad2(s.getHours());
  const sm = pad2(s.getMinutes());
  const eh = pad2(e.getHours());
  const em = pad2(e.getMinutes());
  return `${sh}:${sm}-${eh}:${em}`;
}
function toStartHHMM(iso: string) {
  const d = new Date(iso);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function formatCredit(credit?: CreditInAllCourses | null): string {
  if (!credit) return "-";
  const u = Number.isFinite(credit.Unit) ? credit.Unit : 0;
  const lec = Number.isFinite(credit.Lecture) ? credit.Lecture : 0;
  const lab = Number.isFinite(credit.Lab) ? credit.Lab : 0;
  const self = Number.isFinite(credit.Self) ? credit.Self : 0;
  return `${u}(${lec}-${lab}-${self})`;
}

/** ห้องเรียน: ใช้ Laboratory ก่อน ถ้าไม่มีลองจับคู่ RoomFix */
function getRoomForSchedule(r: Schedule): string {
  const labRoom = r.OfferedCourses?.Laboratory?.Room?.trim();
  if (labRoom) return labRoom;

  const tfSameDaySameSec = (r.TimeFixedCourses ?? []).find(
    (tf) =>
      tf.DayOfWeek === r.DayOfWeek &&
      String(tf.Section ?? r.SectionNumber) === String(r.SectionNumber) &&
      String(tf.RoomFix ?? "").trim() !== ""
  );
  if (tfSameDaySameSec) return tfSameDaySameSec.RoomFix.trim();

  const tfAnyWithRoom = (r.TimeFixedCourses ?? []).find(
    (tf) => String(tf.RoomFix ?? "").trim() !== ""
  );
  return tfAnyWithRoom?.RoomFix?.trim() ?? "";
}

/** ---------------- mapper: Schedule[] → OpenCourseInterface[] ---------------- */
function mapSchedulesToOpenCourses(rows: Schedule[]): OpenCourseInterface[] {
  type GroupInfoAgg = {
    Group: string;
    Room: string;
    Day: string;
    TimeSpan: string;
    Time: string;
  };

  const courseMap = new Map<
    number,
    {
      oc: Schedule["OfferedCourses"];
      ac: Schedule["OfferedCourses"]["AllCourses"];
      groups: Map<string, GroupInfoAgg>;
    }
  >();

  for (const r of rows ?? []) {
    const oc = r.OfferedCourses;
    const ac = oc.AllCourses;
    const courseId = oc.ID;

    if (!courseMap.has(courseId)) {
      courseMap.set(courseId, { oc, ac, groups: new Map() });
    }
    const entry = courseMap.get(courseId)!;

    const secKey = String(r.SectionNumber);
    const room = getRoomForSchedule(r);
    const groupInfo: GroupInfoAgg = {
      Group: secKey,
      Room: room,
      Day: r.DayOfWeek,
      TimeSpan: toTimeSpan(r.StartTime, r.EndTime),
      Time: toStartHHMM(r.StartTime),
    };

    const exist = entry.groups.get(secKey);
    if (!exist) {
      entry.groups.set(secKey, groupInfo);
    } else if (!exist.Room && groupInfo.Room) {
      entry.groups.set(secKey, { ...exist, Room: groupInfo.Room });
    }
  }

  const result: OpenCourseInterface[] = [];
  for (const { oc, ac, groups } of courseMap.values()) {
    const major = ac.Curriculum.Major?.MajorName ?? "";
    const name = ac.ThaiName ?? ac.EnglishName ?? "";
    const creditStr = formatCredit(ac.Credit);

    const groupInfos = Array.from(groups.values()).sort(
      (a, b) => Number(a.Group) - Number(b.Group)
    );

    result.push({
      Major: major,
      ID: oc.ID,
      Year: oc.Year,
      Term: oc.Term,
      Code: ac.Code,
      Name: name,
      Credit: creditStr,
      TypeName: ac.TypeOfCourses.TypeName,
      TeacherID: oc.UserID,
      Teachers: [
        {
          ID: oc.User.ID,
          Title: oc.User.Title?.Title ?? "",
          Firstname: oc.User.Firstname,
          Lastname: oc.User.Lastname,
        },
      ],
      GroupInfos: groupInfos,
      GroupTotal: groupInfos.length,
      CapacityPer: oc.Capacity,
      Remark: "",
      IsFixCourses: oc.IsFixCourses,
    });
  }

  return result.sort((a, b) => a.ID - b.ID);
}

// ฟังก์ชันรวมเวลาเรียน (กลุ่มเดียวกัน + วันเดียวกัน)
const dayOrder: Record<string, number> = {
  อาทิตย์: 0,
  จันทร์: 1,
  อังคาร: 2,
  พุธ: 3,
  พฤหัสบดี: 4,
  ศุกร์: 5,
  เสาร์: 6,
};

function mergeAndSortSections(sections: any[]) {
  const grouped = new Map<string, any[]>();

  // จัดกลุ่มด้วย SectionNumber
  for (const s of sections) {
    const key = String(s.SectionNumber);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(s);
  }

  const merged: any[] = [];

  for (const [, group] of grouped) {
    // เรียงวัน
    const sorted = [...group].sort(
      (a, b) => dayOrder[a.DayOfWeek] - dayOrder[b.DayOfWeek]
    );

    sorted.forEach((s, idx) => {
      merged.push({
        ...s,
        showGroupNumber: idx === 0, // แถวแรกแสดงเลขกลุ่ม
      });
    });
  }

  // เรียงตาม SectionNumber และวัน
  return merged.sort((a, b) => {
    if (a.SectionNumber !== b.SectionNumber)
      return a.SectionNumber - b.SectionNumber;
    return dayOrder[a.DayOfWeek] - dayOrder[b.DayOfWeek];
  });
}

const OfferedCoursespage: React.FC = () => {
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [courses, setCourses] = useState<OpenCourseInterface[]>([]);
  const [sortBy, setSortBy] = useState<"Code" | "Name" | "TypeName">("Code");
  const [loading, setLoading] = useState<boolean>(false);
  const [academicYear, setAcademicYear] = useState<number>(0);
  const [term, setTerm] = useState<number>(0);
  const [expandedRowKeys, setExpandedRowKeys] = useState<(number | string)[]>(
    []
  );
  const [userMajor, setUserMajor] = useState<string | null>(null);
  const [containerWidth, setContainerWidth] = useState(window.innerWidth);

  const navigate = useNavigate();

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

  const toggleExpandRow = (id: number) => {
    setExpandedRowKeys((prev) =>
      prev.includes(id) ? prev.filter((key) => key !== id) : [...prev, id]
    );
  };

  // ปี/เทอมจาก localStorage
  useEffect(() => {
    const year = localStorage.getItem("academicYear");
    const t = localStorage.getItem("term");
    if (year) setAcademicYear(Number(year));
    if (t) setTerm(Number(t));
  }, []);

  // อ่านสาขาของผู้ใช้จาก localStorage
  useEffect(() => {
    const m = localStorage.getItem("major_name") || "";
    setUserMajor(m || null);
    if (!m) {
      Swal.fire(
        "ไม่ทราบสาขาผู้ใช้",
        "ไม่พบ major_name ในระบบ จะโชว์เฉพาะวิชาจากศูนย์บริการ",
        "info"
      );
    }
  }, []);

  // Fetch courses
  useEffect(() => {
    const fetchCourses = async () => {
      if (!userMajor || !academicYear || !term) return;
      setLoading(true);
      try {
        const response = await getOfferedCoursesByMajor(
          userMajor,
          academicYear,
          term
        );
        const rawCourses = Array.isArray(response?.data) ? response.data : [];
        const mergedCourses = rawCourses.map((c: any) => ({
          ...c,
          Sections: mergeAndSortSections(c.Sections ?? []),
        }));

        setCourses(mergedCourses);
      } catch (err) {
        console.error(err);
        setCourses([]);
        message.error("เกิดข้อผิดพลาดในการโหลดข้อมูล");
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, [userMajor, academicYear, term]);

  /** ทำ flat rows สำหรับแสดง/ซ่อนกลุ่มเพิ่มเติม */
  const getExpandedTableData = () => {
    const result: any[] = [];
    courses.forEach((course: any) => {
      // แถวหลัก
      result.push({
        ...course,
        isChild: false,
        key: course.ID,
        SectionNumber: course.Sections?.[0]?.SectionNumber || "", //แถวหลักโชว์เลขกลุ่มแรก
      });

      // ถ้ามีหลายกลุ่มและ expand แล้ว
      if (expandedRowKeys.includes(course.ID) && course.Sections?.length > 1) {
        const extraGroups = course.Sections.slice(1);
        extraGroups.forEach((group: any, i: number) => {
          result.push({
            ...course,
            isChild: true,
            isLastChild: i === extraGroups.length - 1,
            Section: group,
            key: `${course.ID}-extra-${i}`,
            SectionNumber: group.SectionNumber,
          });
        });
      }
    });
    return result;
  };

  // Filter courses based on search
  const filteredCourses = useMemo(() => {
    let data = getExpandedTableData();

    // filter ตาม searchText
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      data = data.filter((course: any) => {
        if (course.isChild) return true; // Always show child rows if parent matches
        return (
          course.Code?.toLowerCase().includes(searchLower) ||
          course.CourseName?.toLowerCase().includes(searchLower) ||
          course.TypeOfCourse?.toLowerCase().includes(searchLower) ||
          course.Sections?.[0]?.InstructorName?.toLowerCase().includes(
            searchLower
          )
        );
      });
    }

    // sort ตาม dropdown
    data.sort((a: any, b: any) => {
      if (sortBy === "Code") return a.Code.localeCompare(b.Code);
      if (sortBy === "Name") return a.CourseName.localeCompare(b.CourseName);
      if (sortBy === "TypeName")
        return a.TypeOfCourse.localeCompare(b.TypeOfCourse);
      return 0;
    });

    return data;
  }, [courses, searchText, expandedRowKeys, sortBy]);

  // Calculate pagination
  const totalItems = filteredCourses.filter((course) => !course.isChild).length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  // Get current page data
  const currentData = (() => {
    const nonChildItems = filteredCourses.filter((course) => !course.isChild);
    const pageItems = nonChildItems.slice(startIndex, endIndex);

    // Add child items for expanded rows
    const result: any[] = [];
    pageItems.forEach((item) => {
      result.push(item);
      if (expandedRowKeys.includes(item.ID)) {
        const childItems = filteredCourses.filter(
          (course) => course.isChild && course.ID === item.ID
        );
        result.push(...childItems);
      }
    });

    return result.map((course, index) => ({
      ...course,
      order: course.isChild
        ? 0
        : startIndex + result.filter((c, i) => i <= index && !c.isChild).length,
    }));
  })();

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle page size change
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const getColumns = (): ColumnsType<CourseTableData> => {
    const columns: ColumnsType<CourseTableData> = [];

    if (isMobile) {
      // Mobile layout
      columns.push(
        {
          title: "#",
          key: "order",
          width: 40,
          align: "center",
          render: (_text, record) => {
            if (record.isChild) return null;
            return (
              <span style={{ fontWeight: "bold", fontSize: "10px" }}>
                {record.order}
              </span>
            );
          },
        },
        {
          title: "รายวิชา",
          key: "course",
          width: 160,
          render: (_, record: CourseTableData) => (
            <div style={{ fontSize: "11px" }}>
              <div
                style={{
                  fontWeight: "bold",
                  color: "#1890ff",
                  marginBottom: "2px",
                }}
              >
                {record.Code}
              </div>
              <div style={{ fontWeight: "500", marginBottom: "2px" }}>
                {record.CourseName}
              </div>
              <div style={{ color: "#666", fontSize: "9px" }}>
                {record.Credit} หน่วยกิต | {record.TypeOfCourse}
              </div>
              {!record.isChild && record.Sections?.length > 1 && (
                <button
                  onClick={() => toggleExpandRow(record.ID)}
                  style={{
                    color: "#1677ff",
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    fontSize: "9px",
                  }}
                >
                  {expandedRowKeys.includes(record.ID) ? "ซ่อน" : "ดูเพิ่มเติม"}
                </button>
              )}
            </div>
          ),
        },
        {
          title: "กลุ่ม/เวลา",
          key: "section_time",
          width: 100,
          render: (_, record: CourseTableData) => {
            const section = record.isChild
              ? record.Section
              : record.Sections?.[0];
            return (
              <div style={{ fontSize: "10px", textAlign: "center" }}>
                <div style={{ fontWeight: "bold" }}>
                  กลุ่ม {section?.SectionNumber || "-"}
                </div>
                <div>{section?.DayOfWeek || "-"}</div>
                <div>{section?.Time || "-"}</div>
                <div style={{ color: "#666" }}>{section?.Room || "-"}</div>
              </div>
            );
          },
        }
      );
    } else {
      // Desktop layout
      columns.push(
        {
          title: "ลำดับ",
          key: "order",
          width: 60,
          align: "center",
          render: (_text, record) => {
            if (record.isChild) return null;
            return <span style={{ fontWeight: "bold" }}>{record.order}</span>;
          },
        },
        {
          title: "รหัสวิชา",
          key: "Code",
          width: 100,
          render: (_t, r) => (
            <span style={{ fontWeight: "bold", color: "#1890ff" }}>
              {r.Code}
            </span>
          ),
        },
        {
          title: "ชื่อวิชา",
          key: "CourseName",
          width: isSmallScreen ? 180 : 220,
          render: (_t, r) => (
            <span style={{ fontWeight: "500" }}>{r.CourseName}</span>
          ),
        },
        {
          title: "หน่วยกิต",
          key: "Credit",
          width: 80,
          align: "center",
          render: (_t, r) => (
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
              {r.Credit}
            </span>
          ),
        },
        {
          title: "หมวดวิชา",
          key: "TypeOfCourse",
          width: 120,
          align: "center",
          render: (_t, r) => <span>{r.TypeOfCourse}</span>,
        },
        {
          title: "กลุ่มเรียน",
          key: "Sections",
          width: 100,
          align: "center",
          render: (_text, record) => {
            if (!record.Sections?.length) return "-";

            const sortedSections = [...record.Sections].sort(
              (a, b) => a.SectionNumber - b.SectionNumber
            );

            if (record.isChild) return record.Section.SectionNumber;

            const firstSection = sortedSections[0];
            const hasMore = sortedSections.length > 1;

            return (
              <div style={{ textAlign: "center" }}>
                {firstSection?.SectionNumber ?? "-"}
                {hasMore && (
                  <button
                    onClick={() => toggleExpandRow(record.ID)}
                    style={{
                      color: "#1677ff",
                      background: "none",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                      marginLeft: "4px",
                      fontSize: "11px",
                    }}
                  >
                    {expandedRowKeys.includes(record.ID)
                      ? "ซ่อน"
                      : "ดูเพิ่มเติม"}
                  </button>
                )}
              </div>
            );
          },
        },
        {
          title: "ห้อง",
          key: "Room",
          width: 80,
          align: "center",
          render: (_t, r) =>
            r.isChild ? r.Section.Room : r.Sections?.[0]?.Room ?? "-",
        },
        {
          title: "วันที่สอน",
          key: "DayOfWeek",
          width: 100,
          align: "center",
          render: (_t, r) =>
            r.isChild ? r.Section.DayOfWeek : r.Sections?.[0]?.DayOfWeek ?? "-",
        },
        {
          title: "เวลา",
          key: "Time",
          width: 120,
          align: "center",
          render: (_t, r) =>
            r.isChild ? r.Section.Time : r.Sections?.[0]?.Time ?? "-",
        }
      );

      if (!isSmallScreen) {
        columns.push(
          {
            title: "จำนวนกลุ่ม",
            key: "TotalSections",
            width: 90,
            align: "center",
            render: (_t, r) => r.TotalSections ?? 1,
          },
          {
            title: "จำนวนนักศึกษา",
            key: "Capacity",
            width: 110,
            align: "center",
            render: (_t, r) => r.Sections?.[0]?.Capacity ?? "-",
          },
          {
            title: "อาจารย์ผู้สอน",
            key: "Teacher",
            width: 150,
            render: (_t, record) => {
              const instructorName = record.isChild
                ? record.Section.InstructorName
                : record.Sections?.[0]?.InstructorName ?? "-";
              return <span style={{ fontSize: "12px" }}>{instructorName}</span>;
            },
          }
        );
      }
    }

    // Add action column
    const userID = Number(localStorage.getItem("user_id"));
    columns.push({
      title: "จัดการ",
      key: "actions",
      width: isMobile ? 100 : 120,
      align: "center",
      render: (_text, record) => {
        if (record.isChild) return null;

        const canEdit = record.Sections?.some((s: any) => s.ID_user === userID);
        if (!canEdit) return null;

        const isCesCourse = record.IsFixCourses === true;
        return (
          <div
            style={{ display: "flex", gap: "4px", justifyContent: "center" }}
          >
            <Button
              size="small"
              icon={!isMobile ? <EditOutlined /> : undefined}
              style={{
                backgroundColor: "#F26522",
                borderColor: "#F26522",
                color: "white",
                fontSize: isMobile ? "10px" : "11px",
                padding: "2px 8px",
                height: "auto",
              }}
              onClick={() => {
                const targetPath = isCesCourse
                  ? `/manage-cescourse/${record.ID}`
                  : `/add-open-course/${record.ID}`;
                navigate(targetPath);
              }}
              title="แก้ไขข้อมูล"
            >
              แก้ไข
            </Button>
            <Button
              size="small"
              icon={!isMobile ? <DeleteOutlined /> : undefined}
              style={{
                backgroundColor: "#ff4d4f",
                borderColor: "#ff4d4f",
                color: "white",
                fontSize: isMobile ? "10px" : "11px",
                padding: "2px 8px",
                height: "auto",
              }}
              onClick={async () => {
                const result = await Swal.fire({
                  title: `คุณต้องการลบรายวิชา "${record.CourseName}" หรือไม่?`,
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
                    message.success("ลบรายวิชาสำเร็จ");
                  } else {
                    message.error("ไม่สามารถลบรายวิชาได้");
                  }
                }
              }}
              title="ลบข้อมูล"
            >
              ลบ
            </Button>
          </div>
        );
      },
    });

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
          รายวิชาที่เปิดสอน
        </h2>
        <p
          style={{
            margin: 0,
            color: "#666",
            fontSize: isMobile ? "12px" : "13px",
            fontFamily: "Sarabun, sans-serif",
          }}
        >
          จัดการรายวิชาที่คุณเปิดสอน
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
          <Select
            value={sortBy}
            onChange={(v) => setSortBy(v)}
            placeholder="เลือกการเรียงลำดับ"
            suffixIcon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
                fill="#1f1f1f"
              >
                <path d="M120-240v-80h240v80H120Zm0-200v-80h480v80H120Zm0-200v-80h720v80H120Z" />
              </svg>
            }
            style={{ width: 100 }}
          >
            <Option value="Code">รหัสวิชา</Option>
            <Option value="Name">ชื่อวิชา</Option>
            <Option value="TypeName">หมวดวิชา</Option>
          </Select>

          {/* Search */}
          <Input
            placeholder="ค้นหา รหัส/ชื่อวิชา/ชื่ออาจารย์"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{
              width: isMobile ? "100%" : 200,
              fontFamily: "Sarabun, sans-serif",
            }}
            size="small"
          />

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
            x: "max-content", // ให้ table ขยายเต็มคอนเทนเนอร์
            y: isMobile ? 400 : 600,
          }}
          style={{
            width: "100%", // เพิ่มให้ table ใช้เต็มความกว้าง
            fontSize: isMobile ? "11px" : "12px",
            fontFamily: "Sarabun, sans-serif",
          }}
          className="custom-table"
          locale={{
            emptyText: (
              <div style={{ padding: isMobile ? 20 : 40, textAlign: "center" }}>
                ไม่มีข้อมูล
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
              onClick={() => window.location.reload()}
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
          <div>• กดปุ่ม "ดูเพิ่มเติม" เพื่อดูกลุ่มเรียนอื่นๆ</div>
          <div>• หมุนหน้าจอเป็นแนวนอนเพื่อดูข้อมูลเพิ่มเติม</div>
        </div>
      )}
    </div>
  );
};

export default OfferedCoursespage;
