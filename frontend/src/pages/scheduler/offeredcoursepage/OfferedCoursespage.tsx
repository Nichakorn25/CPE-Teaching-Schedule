import React, { useState, useEffect, useMemo } from "react";
import { Button, Table, Input, Select, message, Checkbox } from "antd";
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
import {
  Schedule,
  CourseTableData,
  CreditInAllCourses,
} from "../../../interfaces/OfferedInterface";

const { Option } = Select;

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
      CourseName: name,
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
  const [showonlyMine, setShowonlyMine] = useState<boolean>(false);
  const userID = Number(localStorage.getItem("user_id"));
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

  // เพิ่ม state สำหรับ hover
  const [hoveredRowKey, setHoveredRowKey] = useState<string | number | null>(
    null
  );

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
        console.log("rfhjhiudo:", response);
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

    function normalizeName(name: string) {
      return name
        .replace(/\s+/g, "") // ลบช่องว่างทั้งหมด
        .replace(/\./g, "") // ลบจุด
        .toLowerCase();
    }

    // ดึงชื่อเต็มของผู้ใช้ปัจจุบัน
    const title = localStorage.getItem("title") || "";
    const firstName = localStorage.getItem("first_name") || "";
    const lastName = localStorage.getItem("last_name") || "";
    const fullName = `${title}${firstName} ${lastName}`.trim();

    if (showonlyMine) {
      data = data.filter((course: any) => {
        if (course.isChild) return true;

        return course.Sections?.some(
          (s: any) =>
            Array.isArray(s.InstructorNames) &&
            s.InstructorNames.some((instructor: string) => {
              const match =
                normalizeName(instructor) === normalizeName(fullName);

              if (match) {
                console.log("เจอ match:", instructor, "==>", fullName);
              } else {
                console.log("ไม่ match:", instructor, "!==", fullName);
              }

              return match;
            })
        );
      });

      console.log("Data หลัง filter:", data);
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
  }, [courses, searchText, expandedRowKeys, sortBy, showonlyMine]);

  // Calculate pagination
  const totalItems = filteredCourses.filter((course) => !course.isChild).length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  // Get current page data
  const currentData = (() => {
    const nonChildItems = filteredCourses.filter((course) => !course.isChild);
    const pageItems = nonChildItems.slice(startIndex, endIndex);

    const result: any[] = [];

    pageItems.forEach((item) => {
      result.push(item); // แถวหลัก

      if (expandedRowKeys.includes(item.ID)) {
        const childItems = filteredCourses.filter(
          (course) => course.isChild && course.ID === item.ID
        );

        // เพิ่ม index สำหรับ child rows
        childItems.forEach((child, idx) => {
          result.push({
            ...child,
            __childIndex: idx, // ใช้สลับสี
          });
        });
      }
    });

    return result.map((course, index) => ({
      ...course,
      order: course.isChild
        ? 0
        : startIndex + result.filter((c, i) => i <= index && !c.isChild).length,
    }));
  })();

  // ระบบสี 10 สีใหม่
  const colorPalettes = [
    {
      lightBg: "#fed7aa",
      darkBg: "#ea580c",
      lightBorder: "#fb923c",
      darkBorder: "#9a3412",
    }, // Orange
    {
      lightBg: "#dbeafe",
      darkBg: "#2563eb",
      lightBorder: "#60a5fa",
      darkBorder: "#1e40af",
    }, // Blue
    {
      lightBg: "#dcfce7",
      darkBg: "#16a34a",
      lightBorder: "#4ade80",
      darkBorder: "#166534",
    }, // Green
    {
      lightBg: "#f3e8ff",
      darkBg: "#9333ea",
      lightBorder: "#a855f7",
      darkBorder: "#6b21a8",
    }, // Purple
    {
      lightBg: "#fce7f3",
      darkBg: "#db2777",
      lightBorder: "#f472b6",
      darkBorder: "#be185d",
    }, // Pink
    {
      lightBg: "#fef3c7",
      darkBg: "#ca8a04",
      lightBorder: "#facc15",
      darkBorder: "#92400e",
    }, // Yellow
    {
      lightBg: "#e0e7ff",
      darkBg: "#4f46e5",
      lightBorder: "#818cf8",
      darkBorder: "#3730a3",
    }, // Indigo
    {
      lightBg: "#fee2e2",
      darkBg: "#dc2626",
      lightBorder: "#f87171",
      darkBorder: "#991b1b",
    }, // Red
    {
      lightBg: "#ccfbf1",
      darkBg: "#0d9488",
      lightBorder: "#2dd4bf",
      darkBorder: "#115e59",
    }, // Teal
    {
      lightBg: "#cffafe",
      darkBg: "#0891b2",
      lightBorder: "#22d3ee",
      darkBorder: "#155e75",
    }, // Cyan
  ];

  // ใช้ useMemo เพื่อให้มั่นใจว่าสีจะ stable
  const courseColorMap = useMemo(() => {
    const map = new Map<number, number>();

    // สร้างลำดับสีตาม expandedRowKeys โดยเรียงเฉพาะ numeric IDs
    const numericExpandedKeys = expandedRowKeys
      .filter((key): key is number => typeof key === "number")
      .slice(); // copy array เพื่อไม่ให้กระทบ original

    console.log("Expanded course IDs:", numericExpandedKeys);

    numericExpandedKeys.forEach((courseId, index) => {
      map.set(courseId, index % colorPalettes.length);
      console.log(
        `Course ${courseId} gets color index ${index % colorPalettes.length}`
      );
    });

    return map;
  }, [expandedRowKeys, colorPalettes.length]);

  const currentDataWithColor = useMemo(() => {
    return currentData.map((record) => {
      if (record.isChild && record.SectionNumber != null) {
        const colorIndex = courseColorMap.get(record.ID) ?? 0;
        const palette = colorPalettes[colorIndex];

        // section เลขคี่ = สีเข้ม, section เลขคู่ = สีอ่อน
        const isOddSection = record.SectionNumber % 2 === 1;

        console.log(
          `Section ${record.SectionNumber} of course ${record.ID}: isOdd=${isOddSection}, colorIndex=${colorIndex}`
        );

        return {
          ...record,
          _colorIndex: colorIndex,
          _isOddSection: isOddSection,
          _palette: palette,
        };
      }
      return record;
    });
  }, [currentData, courseColorMap, colorPalettes]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle page size change
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  // ฟังก์ชันสำหรับกำหนดสี row พร้อม hover
  const getRowClassName = (record: any) => {
    const isHovered = hoveredRowKey === record.key;

    if (record.isChild) {
      const isOdd = record._isOddSection;
      const baseClass = isOdd ? "child-row-dark" : "child-row-light";
      return `${baseClass} ${isHovered ? "row-hovered" : ""}`;
    }

    // ✅ แก้ไขสำหรับ parent row ที่ expand แล้ว
    if (expandedRowKeys.includes(record.ID)) {
      // ใช้สีเดียวกับ Section 1 ของ course นี้
      const colorIndex = courseColorMap.get(record.ID) ?? 0;
      const palette = colorPalettes[colorIndex];

      // Section 1 เป็นเลขคี่ = สีเข้ม
      return `expanded-row-with-color ${
        isHovered ? "row-hovered-expanded" : ""
      }`;
    }

    return `normal-row ${isHovered ? "row-hovered-normal" : ""}`;
  };

  // ฟังก์ชันสำหรับกำหนด inline styles
  const getRowStyle = (record: any) => {
    // ✅ เพิ่มการจัดการสำหรับ parent row ที่ expand
    if (expandedRowKeys.includes(record.ID) && !record.isChild) {
      const colorIndex = courseColorMap.get(record.ID) ?? 0;
      const palette = colorPalettes[colorIndex];

      // Parent row ที่ expand แสดง Section 1 (เลขคี่ = สีเข้ม)
      return {
        backgroundColor: palette.darkBg,
        borderLeft: `4px solid ${palette.darkBorder}`,
        color: "white",
      };
    }

    if (record.isChild && record._palette) {
      const isOdd = record._isOddSection;
      const palette = record._palette;

      if (isOdd) {
        // Section เลขคี่ = สีเข้ม
        return {
          backgroundColor: palette.darkBg,
          borderLeft: `4px solid ${palette.darkBorder}`,
          color: "white",
        };
      } else {
        // Section เลขคู่ = สีอ่อน
        return {
          backgroundColor: palette.lightBg,
          borderLeft: `4px solid ${palette.lightBorder}`,
          color: "black",
        };
      }
    }
    return {};
  };

 const getColumns = (): ColumnsType<CourseTableData> => {
  const columns: ColumnsType<CourseTableData> = [];

  const fullName = `${localStorage.getItem("title") || ""}${localStorage.getItem("first_name") || ""} ${localStorage.getItem("last_name") || ""}`.trim();

  function normalizeName(name: string) {
    return name.replace(/\s+/g, "").replace(/\./g, "").toLowerCase();
  }

  const isMobile = window.innerWidth <= 768;
  const isIPad = window.innerWidth > 768 && window.innerWidth <= 1024;
  const isSmallScreen = isMobile || isIPad;

  // -------------------- ลำดับ --------------------
  columns.push({
    title: "ลำดับ",
    key: "order",
    width: isSmallScreen ? 40 : 60,
    align: "center",
    render: (_text, record) => (record.isChild ? null : <span style={{ fontWeight: "bold" }}>{record.order}</span>),
  });

  // -------------------- รหัสวิชา --------------------
  columns.push({
    title: "รหัสวิชา",
    key: "Code",
    width: isSmallScreen ? 80 : 100,
    render: (_t, r) => <span style={{ fontWeight: "bold", color: "#1890ff" }}>{r.Code}</span>,
  });

  // -------------------- ชื่อวิชา --------------------
  columns.push({
    title: "ชื่อวิชา",
    key: "CourseName",
    width: isSmallScreen ? 160 : 220,
    render: (_t, r) => (
      <div>
        <div style={{ fontWeight: 600, fontSize: isSmallScreen ? "12px" : "16px" }}>
          {r.EnglishCourseName || "-"}
        </div>
        <div style={{ color: "#555", fontSize: isSmallScreen ? "10px" : "14px" }}>
          {r.ThaiCourseName || "-"}
        </div>
      </div>
    ),
  });

  // -------------------- หน่วยกิต --------------------
  columns.push({
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
  });

  // -------------------- หมวดวิชา --------------------
  columns.push({
    title: "หมวดวิชา",
    key: "TypeOfCourse",
    width: 120,
    align: "center",
    render: (_t, r) => <span>{r.TypeOfCourse}</span>,
  });

  // -------------------- กลุ่มเรียน --------------------
  columns.push({
    title: "กลุ่มเรียน",
    key: "Sections",
    width: 100,
    align: "center",
    render: (_text, record) => {
      if (!record.Sections?.length) return "-";

      const sortedSections = [...record.Sections].sort((a, b) => a.SectionNumber - b.SectionNumber);
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
              {expandedRowKeys.includes(record.ID) ? "ซ่อน" : "ดูเพิ่มเติม"}
            </button>
          )}
        </div>
      );
    },
  });

  // -------------------- ห้อง --------------------
  columns.push({
    title: "ห้อง",
    key: "Room",
    width: 100,
    align: "center",
    render: (_t, r) => {
      const room = r.isChild ? r.Section?.Room : r.Sections?.[0]?.Room;
      return room || "รอศูนย์บริการจัดสรรห้องเรียน";
    },
  });

  // -------------------- วันที่สอน --------------------
  columns.push({
    title: "วันที่สอน",
    key: "DayOfWeek",
    width: 80,
    align: "center",
    render: (_t, r) => (r.isChild ? r.Section?.DayOfWeek : r.Sections?.[0]?.DayOfWeek ?? "-"),
  });

  // -------------------- เวลา --------------------
  columns.push({
    title: "เวลา",
    key: "Time",
    width: 120,
    align: "center",
    render: (_t, r) => (r.isChild ? r.Section?.Time : r.Sections?.[0]?.Time ?? "-"),
  });

  // -------------------- จำนวนกลุ่ม --------------------
  columns.push({
    title: "จำนวนกลุ่ม",
    key: "TotalSections",
    width: 90,
    align: "center",
    render: (_t, r) => r.TotalSections ?? 1,
  });

  // -------------------- จำนวนนักศึกษา --------------------
  columns.push({
    title: "จำนวนนักศึกษา",
    key: "Capacity",
    width: 110,
    align: "center",
    render: (_t, r) => (r.Sections?.[0]?.Capacity ?? "-"),
  });

  // -------------------- อาจารย์ผู้สอน --------------------
  columns.push({
    title: "อาจารย์ผู้สอน",
    key: "Teacher",
    width: 150,
    render: (_t, record) => {
      const instructors = record.isChild
        ? record.Section?.InstructorNames
        : record.Sections?.[0]?.InstructorNames ?? [];
      return (
        <div style={{ fontSize: isSmallScreen ? "10px" : "12px", color: "#000000ff" }}>
          {Array.isArray(instructors) && instructors.length > 0
            ? instructors.map((name: string, idx: number) => <div key={idx}>{idx + 1}. {name}</div>)
            : "-"}
        </div>
      );
    },
  });

  // -------------------- จัดการ --------------------
  columns.push({
    title: "จัดการ",
    key: "actions",
    width: isSmallScreen ? 100 : 120,
    align: "center",
    render: (_text, record) => {
      if (record.isChild) return null;

      const canEdit = record.Sections?.some(
        (s: any) =>
          Array.isArray(s.InstructorNames) &&
          s.InstructorNames.some((name: string) => normalizeName(name) === normalizeName(fullName))
      );

      if (!canEdit) return null;

      const isCesCourse = record.IsFixCourses === true;

      return (
        <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
          <Button
            size="small"
            icon={!isSmallScreen ? <EditOutlined /> : undefined}
            style={{
              backgroundColor: "#F26522",
              borderColor: "#F26522",
              color: "white",
              fontSize: isSmallScreen ? "10px" : "11px",
              padding: "2px 8px",
              height: "auto",
            }}
            onClick={() => {
              const path = isCesCourse ? `/manage-cescourse/${record.ID}` : `/add-open-course/${record.ID}`;
              console.log("rdtdtyjk",path)
              navigate(path);
            }}
          >
            แก้ไข
          </Button>
          <Button
            size="small"
            icon={!isSmallScreen ? <DeleteOutlined /> : undefined}
            style={{
              backgroundColor: "#ff4d4f",
              borderColor: "#ff4d4f",
              color: "white",
              fontSize: isSmallScreen ? "10px" : "11px",
              padding: "2px 8px",
              height: "auto",
            }}
            onClick={async () => {
              const result = await Swal.fire({
                title: `คุณต้องการลบรายวิชา "${record.EnglishCourseName} ${record.ThaiCourseName}" หรือไม่?`,
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
                  setCourses(prev => prev.filter(c => c.ID !== record.ID));
                  message.success("ลบรายวิชาสำเร็จ");
                } else {
                  message.error("ไม่สามารถลบรายวิชาได้");
                }
              }
            }}
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
      {/* Custom CSS */}
      <style>
        {`
          .custom-table .ant-table-tbody > tr.normal-row {
            background-color: #ffffff !important;
            transition: background-color 0.2s ease;
          }
          
          .custom-table .ant-table-tbody > tr.normal-row:hover,
          .custom-table .ant-table-tbody > tr.normal-row.row-hovered-normal {
            background-color: #6b7280 !important; /* สีเทาเข้ม */
            color: white !important;
          }
          
          .custom-table .ant-table-tbody > tr.expanded-row-with-color {
            transition: background-color 0.2s ease;
          }
          
          .custom-table .ant-table-tbody > tr.expanded-row-with-color:hover,
          .custom-table .ant-table-tbody > tr.expanded-row-with-color.row-hovered-expanded {
            background-color: #6b7280 !important; /* สีเทาเข้ม */
            color: white !important;
          }
          
          /* Child rows จะใช้ inline styles แทน */
          .custom-table .ant-table-tbody > tr.child-row-light,
          .custom-table .ant-table-tbody > tr.child-row-dark {
            transition: background-color 0.2s ease;
          }
          
          .custom-table .ant-table-tbody > tr.child-row-light:hover,
          .custom-table .ant-table-tbody > tr.child-row-light.row-hovered,
          .custom-table .ant-table-tbody > tr.child-row-dark:hover,
          .custom-table .ant-table-tbody > tr.child-row-dark.row-hovered {
            background-color: #6b7280 !important; /* สีเทาเข้ม */
            color: white !important;
          }

          /* Override Antd's default hover */
          .custom-table .ant-table-tbody > tr:hover > td {
            background-color: transparent !important;
          }

          /* เพิ่ม rule สำหรับ expanded row แบบเก่า */
          .custom-table .ant-table-tbody > tr.expanded-row {
            background-color: #ea580c !important;
            color: white !important;
            transition: background-color 0.2s ease;
          }
          
          .custom-table .ant-table-tbody > tr.expanded-row:hover,
          .custom-table .ant-table-tbody > tr.expanded-row.row-hovered-expanded {
            background-color: #6b7280 !important; /* สีเทาเข้ม */
            color: white !important;
          }
        `}
      </style>

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
            style={{
              width: 150,
            }}
            suffixIcon={null}
            optionLabelProp="children"
          >
            {[
              { value: "Code", label: "รหัสวิชา" },
              { value: "Name", label: "ชื่อวิชา" },
              { value: "TypeName", label: "หมวดวิชา" },
            ].map((item) => (
              <Option key={item.value} value={item.value}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="20"
                    viewBox="0 -960 960 960"
                    width="20"
                    fill="#1f1f1f"
                  >
                    <path d="M120-240v-80h240v80H120Zm0-200v-80h480v80H120Zm0-200v-80h720v80H120Z" />
                  </svg>
                  {item.label}
                </div>
              </Option>
            ))}
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

              {/* Checkbox ขวาสุด (Desktop) */}
              <Checkbox
                checked={showonlyMine}
                onChange={(e) => setShowonlyMine(e.target.checked)}
              >
                แสดงเฉพาะรายวิชาของฉัน
              </Checkbox>
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
              gap: "8px",
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

            {/* Checkbox ขวาสุด (Mobile) */}
            <Checkbox
              checked={showonlyMine}
              onChange={(e) => setShowonlyMine(e.target.checked)}
            >
              แสดงเฉพาะรายวิชาของฉัน
            </Checkbox>
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
          dataSource={currentDataWithColor}
          pagination={false}
          size="small"
          bordered
          scroll={{
            x: "max-content",
            y: isMobile ? 400 : 600,
          }}
          style={{
            width: "100%",
            fontSize: isMobile ? "11px" : "12px",
            fontFamily: "Sarabun, sans-serif",
          }}
          className="custom-table"
          rowClassName={getRowClassName}
          onRow={(record) => ({
            onMouseEnter: () => setHoveredRowKey(record.key),
            onMouseLeave: () => setHoveredRowKey(null),
          })}
          components={{
            body: {
              row: ({ children, ...props }) => {
                const record = props["data-row-key"]
                  ? currentDataWithColor.find(
                      (item) => item.key === props["data-row-key"]
                    )
                  : null;
                const customStyle = record ? getRowStyle(record) : {};

                return (
                  <tr {...props} style={{ ...props.style, ...customStyle }}>
                    {children}
                  </tr>
                );
              },
            },
          }}
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
