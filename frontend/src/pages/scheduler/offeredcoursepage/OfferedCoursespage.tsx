import React, { useState, useEffect, useMemo } from "react";
import "./OfferedCoursespage.css";
import { Button, Table, Input, Select } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

import {
  getSchedulesBynameTable,
  deleteOfferedCourse,
} from "../../../services/https/SchedulerPageService";
import { getMajorOfDepathment } from "../../../services/https/GetService";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import {
  OpenCourseInterface,
  MajorInterface,
  DepartmentInterface,
} from "../../../interfaces/Adminpage";

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
  DayOfWeek: string; // เช่น "อังคาร"
  StartTime: string; // ISO
  EndTime: string; // ISO
  RoomFix: string; // ห้องจากตาราง fix
  Section: number; // กลุ่ม
};

interface Schedule {
  ID: number;
  NameTable: string;
  SectionNumber: number;
  DayOfWeek: string; // "จันทร์"
  StartTime: string; // ISO
  EndTime: string; // ISO
  OfferedCoursesID: number;
  OfferedCourses: {
    ID: number;
    Year: number; // พ.ศ.
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
      Room?: string; // ✅ ใช้ Room (ตาม payload จริง)
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
  // ✅ ตารางเวลาที่ fix เพิ่มเติม (มีห้องเรียนใน RoomFix)
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
  // หน่วยกิต(บรรยาย-ปฏิบัติ-ศึกษาด้วยตนเอง)
  return `${u}(${lec}-${lab}-${self})`;
}

/** ใช้ห้องจาก Laboratory ก่อน ถ้าไม่มี ค่อยลองจับคู่ RoomFix ที่ "วันเดียวกัน+กลุ่มเดียวกัน" */
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

  // fallback: ถ้าไม่เจอแบบจับคู่ ให้หยิบ RoomFix อันแรกที่ไม่ว่าง (กันเคสกรอกห้องไว้ต่างวัน)
  const tfAnyWithRoom = (r.TimeFixedCourses ?? []).find(
    (tf) => String(tf.RoomFix ?? "").trim() !== ""
  );
  return tfAnyWithRoom?.RoomFix?.trim() ?? "";
}

/** ---------------- mapper: Schedule[] → OpenCourseInterface[] ----------------
 * - 1 แถว/OfferedCourse
 * - 1 กลุ่ม/Section (ไม่แตกจากหลายคาบ)
 * - ใช้ TimeFixedCourses เฉพาะเพื่อเติม "ห้อง" ให้คาบเดียวกัน
 */
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
      groups: Map<string, GroupInfoAgg>; // key = section string
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
    // ทำ Group ต่อ Section
    const room = getRoomForSchedule(r);
    const groupInfo: GroupInfoAgg = {
      Group: secKey,
      Room: room,
      Day: r.DayOfWeek, // ✅ ใช้เฉพาะวันจาก Schedule
      TimeSpan: toTimeSpan(r.StartTime, r.EndTime),
      Time: toStartHHMM(r.StartTime),
    };

    // ถ้าเคยมี group นี้แล้ว ให้คงค่าเดิม (กันซ้ำ) แต่ถ้าห้องว่างและรอบนี้มีห้อง ให้เติมห้อง
    const exist = entry.groups.get(secKey);
    if (!exist) {
      entry.groups.set(secKey, groupInfo);
    } else if (!exist.Room && groupInfo.Room) {
      entry.groups.set(secKey, { ...exist, Room: groupInfo.Room });
    }
  }

  // แปลงเป็น OpenCourseInterface
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
      GroupTotal: groupInfos.length, // ✅ จำนวนกลุ่มจริง (Section)
      CapacityPer: oc.Capacity,
      Remark: "",
      IsFixCourses: oc.IsFixCourses,
    });
  }

  return result.sort((a, b) => a.ID - b.ID);
}

const OfferedCoursespage: React.FC = () => {
  const [searchText, setSearchText] = useState("");
  const [selectedDepartmentID, setSelectedDepartmentID] = useState<number | null>(null);
  const [selectedMajor, setSelectedMajor] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [courses, setCourses] = useState<OpenCourseInterface[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [academicYear, setAcademicYear] = useState<number>(0);
  const [term, setTerm] = useState<number>(0);
  const [majors, setMajors] = useState<MajorInterface[]>([]);
  const [departments, setDepartments] = useState<DepartmentInterface[]>([]);
  const [expandedRowKeys, setExpandedRowKeys] = useState<(number | string)[]>([]);
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

  // ดึงตารางด้วย nameTable จาก year/term
  useEffect(() => {
    const fetchSchedules = async () => {
      setLoading(true);
      const nameTable = `ปีการศึกษา ${academicYear} เทอม ${term}`;

      try {
        const response = await getSchedulesBynameTable(nameTable);
        const schedules: Schedule[] = Array.isArray(response?.data)
          ? response.data
          : response?.data?.data ?? [];
        const ocList = mapSchedulesToOpenCourses(schedules ?? []);
        setCourses(ocList);
      } catch (err) {
        console.error("ไม่สามารถโหลดตาราง:", err);
      } finally {
        setLoading(false);
      }
    };

    if (academicYear && term) fetchSchedules();
  }, [academicYear, term]);

  // ดึง majors/ภาควิชา
  useEffect(() => {
    const fetchMajors = async () => {
      const res = await getMajorOfDepathment();
      if (res.status === 200 && Array.isArray(res.data)) {
        const majorsData = res.data as any[];
        setMajors(majorsData as MajorInterface[]);

        const uniqueDepartments = Array.from(
          new Map(
            majorsData.map((m: any) => [m.Department.ID, m.Department.DepartmentName])
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

  const filteredCourses = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return courses
      .filter((course) => {
        const matchesSearch =
          course.Code?.toLowerCase().includes(q) ||
          course.Name?.toLowerCase().includes(q);
        const matchesMajor =
          selectedMajor === "all" || course.Major === selectedMajor;
        return matchesSearch && matchesMajor;
      })
      .sort((a, b) => a.ID - b.ID);
  }, [courses, searchText, selectedMajor]);

  /** ทำ flat rows สำหรับแสดง/ซ่อนกลุ่มเพิ่มเติม */
  const getExpandedTableData = () => {
    const result: any[] = [];
    filteredCourses.forEach((course) => {
      result.push({ ...course, isChild: false, key: course.ID });

      if (expandedRowKeys.includes(course.ID) && course.GroupInfos.length > 1) {
        const extraGroups = course.GroupInfos.slice(1);
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

  // Reset หน้าเมื่อ filter/search เปลี่ยน
  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, selectedMajor, selectedDepartmentID]);

  // เลือกกลุ่มแรกที่มีห้อง (ถ้ากลุ่มแรกไม่มีห้อง)
  const pickFirstGroupWithRoom = (record: any) => {
    if (!record?.GroupInfos?.length) return undefined;
    return (
      record.GroupInfos.find((g: any) => String(g?.Room ?? "").trim() !== "") ??
      record.GroupInfos[0]
    );
  };

  /** ---------------- ตาราง ---------------- */
  const columns: ColumnsType<any> = [
    {
      title: "ลำดับ",
      key: "index",
      width: 80,
      render: (_text, record) => {
        if (record.isChild) return null;
        const indexInMain = filteredCourses.findIndex((c) => c.ID === record.ID);
        return indexInMain + 1 + (currentPage - 1) * pageSize;
      },
    },
    { title: "รหัสวิชา", key: "Code", render: (_t, r) => <span>{r.Code}</span> },
    { title: "ชื่อวิชา", key: "Name", render: (_t, r) => <span>{r.Name}</span> },
    { title: "หน่วยกิต", key: "Credit", render: (_t, r) => <span>{r.Credit}</span> },
    { title: "หมวดวิชา", key: "TypeName", render: (_t, r) => <span>{r.TypeName}</span> },
    {
      title: "กลุ่มเรียน",
      key: "Group",
      render: (_text, record) => {
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
        return <div>{record.GroupInfo?.Group}</div>;
      },
    },
    {
      title: "ห้อง",
      key: "Room",
      render: (_t, r) => {
        if (r.isChild) return r.GroupInfo?.Room;
        const g = pickFirstGroupWithRoom(r);
        return g?.Room ?? "";
      },
    },
    {
      title: "วันที่สอน",
      key: "Day",
      render: (_t, r) => {
        if (r.isChild) return r.GroupInfo?.Day;
        const g = pickFirstGroupWithRoom(r);
        return g?.Day ?? "";
      },
    },
    {
      title: "เวลา",
      key: "TimeSpan",
      render: (_t, r) => {
        if (r.isChild) return r.GroupInfo?.TimeSpan;
        const g = pickFirstGroupWithRoom(r);
        return g?.TimeSpan ?? "";
      },
    },

    { title: "จำนวนกลุ่ม", dataIndex: "GroupTotal", key: "GroupTotal", width: 120 },
    {
      title: "จำนวนนักศึกษาต่อกลุ่มเรียน",
      dataIndex: "CapacityPer",
      key: "CapacityPer",
      width: 220,
    },
     {
      title: "อาจารย์ผู้สอน",
      key: "Teacher",
      render: (_t, r) => (
        <span>
          {Array.isArray(r.Teachers)
            ? r.Teachers
                .map(
                  (t: any) =>
                    `${t.Title ? t.Title + " " : ""}${t.Firstname} ${t.Lastname}`
                )
                .join(", ")
            : ""}
        </span>
      ),
    },
    {
      title: "จัดการ",
      key: "actions",
      width: 160,
      render: (_text, record) => {
        const userID = Number(localStorage.getItem("user_id"));
        const canEdit = !!userID && record.TeacherID === userID;
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
                    setCourses((prev) => prev.filter((c) => c.ID !== record.ID));
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

        <Select
          placeholder="เลือกสำนักวิชา"
          style={{ width: 200, marginRight: 10 }}
          onChange={(value: string | number) => {
            if (value === "all") {
              setSelectedDepartmentID(null);
              setSelectedMajor("all");
            } else {
              setSelectedDepartmentID(Number(value));
              setSelectedMajor("all");
            }
          }}
          value={selectedDepartmentID ?? "all"}
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
