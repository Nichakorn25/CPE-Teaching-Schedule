import React, { useState, useEffect, useMemo } from "react";
import { Button, Table, Input, Select, Card } from "antd";
import { SearchOutlined } from "@ant-design/icons";
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
      TypeName: ac.TypeOfCourses.TypeName, // ใช้ฟิลด์นี้ตัดสิน “ศูนย์บริการ”
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

/** ---------- helpers ---------- */
function normalize(str: string) {
  return (str ?? "").toString().trim().toLowerCase();
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

  // จัดกลุ่มด้วย SectionNumber + DayOfWeek
  for (const s of sections) {
    const key = `${s.SectionNumber}_${s.DayOfWeek}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(s);
  }

  const merged: any[] = [];

  for (const [, group] of grouped) {
    if (group.length === 1) {
      merged.push(group[0]);
    } else {
      // เรียงเวลาในแต่ละกลุ่ม
      const sorted = [...group].sort(
        (a, b) =>
          new Date("1970-01-01 " + a.Time.split("-")[0]).getTime() -
          new Date("1970-01-01 " + b.Time.split("-")[0]).getTime()
      );
      const first = sorted[0];
      const last = sorted[sorted.length - 1];

      merged.push({
        ...first,
        Time: `${first.Time.split("-")[0]} - ${last.Time.split("-")[1]}`,
      });
    }
  }

  // เรียงวันและ SectionNumber
  return merged.sort((a, b) => {
    if (a.SectionNumber !== b.SectionNumber) {
      return a.SectionNumber - b.SectionNumber;
    } else {
      return dayOrder[a.DayOfWeek] - dayOrder[b.DayOfWeek];
    }
  });
}

function processCourses(courses: any[]) {
  return courses.map((c) => ({
    ...c,
    Sections: mergeAndSortSections(c.Sections ?? []),
  }));
}

const OfferedCoursespage: React.FC = () => {
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [courses, setCourses] = useState<OpenCourseInterface[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [academicYear, setAcademicYear] = useState<number>(0);
  const [term, setTerm] = useState<number>(0);
  const [expandedRowKeys, setExpandedRowKeys] = useState<(number | string)[]>(
    []
  );
  const [userMajor, setUserMajor] = useState<string | null>(null);
  const navigate = useNavigate();

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
      result.push({ ...course, isChild: false, key: course.ID });

      // ถ้ามีหลายกลุ่มและ expand แล้ว
      if (expandedRowKeys.includes(course.ID) && course.Sections?.length > 1) {
        const extraGroups = course.Sections.slice(1);
        extraGroups.forEach((group: any, i: number) => {
          result.push({
            ...course,
            isChild: true,
            isLastChild: i === extraGroups.length - 1,
            Section: group, // เก็บแต่ละกลุ่ม
            key: `${course.ID}-extra-${i}`,
          });
        });
      }
    });
    return result;
  };

  // เลือกกลุ่มแรกที่มีห้อง (ถ้ากลุ่มแรกไม่มีห้อง)
  const pickFirstGroupWithRoom = (record: any) => {
    if (!record?.GroupInfos?.length) return undefined;
    return (
      record.GroupInfos.find((g: any) => String(g?.Room ?? "").trim() !== "") ||
      record.GroupInfos[0]
    );
  };

  /** ---------------- ตาราง ---------------- */
  const columns: ColumnsType<any> = [
    {
      title: "ลำดับ",
      key: "index",
      width: 80,
      render: (_text, record, index) => {
        // ไม่ต้องแสดงลำดับสำหรับ row ลูก
        if (record.isChild) return null;

        // index ของ row หลัก (ไม่รวม row ลูก)
        const mainIndex = getExpandedTableData()
          .filter((r) => !r.isChild)
          .findIndex((r) => r.ID === record.ID);

        return mainIndex + 1 + (currentPage - 1) * pageSize;
      },
    },
    {
      title: "รหัสวิชา",
      key: "Code",
      render: (_t, r) => <span>{r.Code}</span>,
    },
    {
      title: "ชื่อวิชา",
      key: "CourseName",
      render: (_t, r) => <span>{r.CourseName}</span>,
    },
    {
      title: "หน่วยกิต",
      key: "Credit",
      render: (_t, r) => <span>{r.Credit}</span>,
    },
    {
      title: "หมวดวิชา",
      key: "TypeOfCourse",
      render: (_t, r) => <span>{r.TypeOfCourse}</span>,
    },
    {
      title: "กลุ่มเรียน",
      key: "Sections",
      render: (_text, record) => {
        if (!record.Sections?.length) return "-";

        // sort Sections ตาม SectionNumber
        const sortedSections = [...record.Sections].sort(
          (a, b) => a.SectionNumber - b.SectionNumber
        );

        if (record.isChild) return record.Section.SectionNumber;

        const firstSection = sortedSections[0];
        const hasMore = sortedSections.length > 1;

        return (
          <div>
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
                }}
              >
                {expandedRowKeys.includes(record.ID) ? "ซ่อน" : "ดูเพิ่มเติม"}
              </button>
            )}
          </div>
        );
      },
    },
    {
      title: "ห้อง",
      key: "Room",
      render: (_t, r) =>
        r.isChild ? r.Section.Room : r.Sections?.[0]?.Room ?? "-",
    },
    {
      title: "วันที่สอน",
      key: "DayOfWeek",
      render: (_t, r) =>
        r.isChild ? r.Section.DayOfWeek : r.Sections?.[0]?.DayOfWeek ?? "-",
    },
    {
      title: "เวลา",
      key: "Time",
      render: (_t, r) =>
        r.isChild ? r.Section.Time : r.Sections?.[0]?.Time ?? "-",
    },
    {
      title: "จำนวนกลุ่ม",
      key: "TotalSections",
      render: (_t, r) => r.TotalSections ?? 1,
    },
    {
      title: "จำนวนนักศึกษาต่อกลุ่มเรียน",
      key: "Capacity",
      render: (_t, r) => r.Sections?.[0]?.Capacity ?? "-",
    },
    {
      title: "อาจารย์ผู้สอน",
      key: "Teacher",
      render: (_t, record) => {
        if (record.isChild) return record.Section.InstructorName;
        return record.Sections?.[0]?.InstructorName ?? "-";
      },
    },
    {
      title: "จัดการ",
      key: "actions",
      width: 160,
      render: (_text, record) => {
        const userID = Number(localStorage.getItem("user_id"));
        // ตรวจสอบว่าผู้ใช้ตรงกับ ID_user ของ section
        const canEdit = record.Sections?.some((s: any) => s.ID_user === userID);
        if (!canEdit) return null;

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
                marginRight: 6,
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
    <div
      style={{
        fontFamily: "Sarabun, sans-serif",
        padding: "24px",
        backgroundColor: "#f5f5f5",
        minHeight: "100vh",
      }}
    >
      {/* Header */}
      <div
        style={{
          marginBottom: "24px",
          display: "flex",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              color: "#333",
              fontSize: "24px",
              fontWeight: "bold",
            }}
          >
            รายวิชาที่เปิดสอน
          </h1>
          <p
            style={{
              margin: 0,
              color: "#666",
              fontSize: "14px",
            }}
          >
            จัดการรายวิชาที่คุณเปิดสอน
          </p>
        </div>
      </div>

      {/* Main Card */}
      <Card
        style={{
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          borderRadius: "8px",
        }}
      >
        {/* Controls */}
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
            value={String(pageSize)}
            style={{ width: 70, fontFamily: "Sarabun, sans-serif" }}
            size="small"
            onChange={(value) => setPageSize(parseInt(value))}
          >
            <Option value="5">5</Option>
            <Option value="10">10</Option>
            <Option value="20">20</Option>
            <Option value="50">50</Option>
          </Select>

          <Input
            placeholder="ค้นหา..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 220, fontFamily: "Sarabun, sans-serif" }}
          />
        </div>

        {/* Table */}
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
      </Card>
    </div>
  );
};

export default OfferedCoursespage;
