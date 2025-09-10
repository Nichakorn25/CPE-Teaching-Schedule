import React, { useState, useRef, useEffect } from "react";
import "./Schedulepage.css";
import {
  Button,
  Flex,
  Table,
  Modal,
  Input,
  List,
  Card,
  message,
  Tooltip,
  Select,
  Tag,
  Space,
  Divider,
  AutoComplete,
  Drawer,
  Tabs,
  Badge,
  Empty,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  CloseOutlined,
  SearchOutlined,
  FilterOutlined,
  ClearOutlined,
  MenuOutlined,
  BookOutlined,
  DeleteOutlined,
  RestTwoTone,
  HistoryOutlined,
} from "@ant-design/icons";
import {
  OfferedCoursesInterface,
  ScheduleInterface,
} from "../../../interfaces/Dash";
import {
  getSchedulesBynameTable,
  getNameTable,
  postAutoGenerateSchedule,
  deleteSchedulebyNametable,
  putupdateScheduleTime,
} from "../../../services/https/SchedulerPageService";
import * as XLSX from "xlsx";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";


// =================== TYPE DEFINITIONS ===================
interface ClassInfo {
  subject: string;
  teacher: string;
  room: string;
  color?: string;
  section?: string;
  courseCode?: string;
  studentYear?: string;
  offeredCoursesId?: string | number | null;
}

interface SubCell {
  id: string;
  classData: ClassInfo;
  startTime: string;
  endTime: string;
  day: string;
  position: {
    startSlot: number;
    endSlot: number;
  };
  zIndex: number;
  scheduleId?: number;
   isTimeFixed?: boolean;     // เพิ่มบรรทัดนี้
  timeFixedId?: number;      // เพิ่มบรรทัดนี้
}

interface ScheduleData {
  key: string;
  day: string;
  [key: string]: any;
}

interface ExtendedScheduleData extends ScheduleData {
  subCells?: SubCell[];
  dayIndex?: number;
  rowIndex?: number;
  isFirstRowOfDay?: boolean;
  totalRowsInDay?: number;
}

interface DragPreview {
  day: string;
  startSlot: number;
  endSlot: number;
  show: boolean;
}

interface ScheduleChange {
  id: number;
  originalData: {
    dayOfWeek: string;
    startTime: string;
    endTime: string;
  };
  newData: {
    dayOfWeek: string;
    startTime: string;
    endTime: string;
  };
}

interface ScheduleBatchUpdate {
  ID: number;
  DayOfWeek: string;
  StartTime: string;
  EndTime: string;
}

// =================== FILTER TYPES ===================
interface FilterTag {
  id: string;
  type: 'teacher' | 'studentYear' | 'subject' | 'courseCode' | 'room';
  value: string;
  label: string;
  color: string;
}

interface FilterOptions {
  teachers: string[];
  studentYears: string[];
  subjects: string[];
  courseCodes: string[];
  rooms: string[];
}

// =================== NEW COURSE CARD TYPES ===================
interface CourseCard {
  id: string;
  subject: string;
  courseCode: string;
  teacher: string;
  room: string;
  section: string;
  studentYear: string;
  duration: number; // duration in hours
  color: string;
  scheduleId?: number;
}

// =================== REMOVED COURSE TYPES ===================
interface RemovedCourse {
  id: string;
  subject: string;
  courseCode: string;
  teacher: string;
  room: string;
  section: string;
  studentYear: string;
  duration: number;
  color: string;
  scheduleId?: number;
  removedAt: Date;
  originalDay: string;
  originalStartTime: string;
  originalEndTime: string;
}

// =================== CONSTANTS ===================
const TIME_SLOTS = [
  "8:00-9:00", "9:00-10:00", "10:00-11:00", "11:00-12:00", "12:00-13:00",
  "13:00-14:00", "14:00-15:00", "15:00-16:00", "16:00-17:00", "17:00-18:00",
  "18:00-19:00", "19:00-20:00", "20:00-21:00",
];

const PURE_TIME_SLOTS = [
  "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", 
  "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00"
];

const DAYS = ["จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์", "อาทิตย์"];

// เปลี่ยนจากการสุ่มสีเป็น predefined colors สำหรับวิชาต่างๆ
const SUBJECT_COLORS = [
  "#FFE5E5", "#E5F3FF", "#E5FFE5", "#FFF5E5", "#F5E5FF", "#E5FFF5",
  "#FFE5F5", "#F5FFE5", "#E5E5FF", "#FFF5F5", "#FFE5CC", "#CCFFE5",
  "#E5CCFF", "#FFCCF5", "#CCF5FF", "#F5CCFF", "#CCFFF5", "#FFCCCC",
  "#CCCCFF", "#F5F5CC", "#E5FFCC", "#CCE5FF", "#FFCCE5", "#CCCCE5",
  "#E5CCCC", "#CCFFCC", "#FFFFCC", "#FFCCFF", "#CCFFFF", "#E5E5CC"
];

// =================== FILTER TAG COLORS ===================
const FILTER_TAG_COLORS = {
  teacher: '#52c41a',
  studentYear: '#1890ff',
  subject: '#722ed1',
  courseCode: '#f5222d',
  room: '#fa8c16'
};

// =================== CELL CONFIG ===================
const CELL_CONFIG = {
  BASE_WIDTH: 85,
  FIXED_HEIGHT: 85,
  MIN_HEIGHT: 100,
  GAP: 2,
  PADDING: 6,
};

// =================== UTILITY FUNCTIONS ===================
// แทนที่ getRandomBackgroundColor ด้วย getSubjectColor
const subjectColorMap = new Map<string, string>();
let colorIndex = 0;

const getSubjectColor = (subject: string, courseCode?: string): string => {
  // ใช้ courseCode เป็น key หลัก ถ้าไม่มีใช้ subject
  const key = courseCode || subject;
  
  if (!subjectColorMap.has(key)) {
    subjectColorMap.set(key, SUBJECT_COLORS[colorIndex % SUBJECT_COLORS.length]);
    colorIndex++;
  }
  
  return subjectColorMap.get(key)!;
};

const timeToSlotIndex = (time: string): number => {
  const cleanTime = time.includes('-') ? time.split('-')[0] : time;
  const formatted = cleanTime.padStart(5, '0');
  const index = PURE_TIME_SLOTS.findIndex(slot => slot === formatted);
  
  return index !== -1 ? index : 0;
};

const slotIndexToTime = (index: number): string => {
  return PURE_TIME_SLOTS[index] || "00:00";
};

const timeSlotToSlotIndex = (timeSlot: string): number => {
  return TIME_SLOTS.findIndex(slot => slot === timeSlot);
};

const isTimeInSlot = (startTime: string, endTime: string, slot: string): boolean => {
  const [slotStart, slotEnd] = slot.split("-");
  const toMinutes = (timeStr: string) => {
    const [h, m] = timeStr.split(":").map(Number);
    return h * 60 + m;
  };

  const getTimeString = (time: string | any): string => {
    if (typeof time === 'string') {
      return time.length > 5 ? time.substring(11, 16) : time;
    } else if (time instanceof Date) {
      return time.toTimeString().substring(0, 5);
    }
    return "00:00";
  };

  const startMinutes = toMinutes(getTimeString(startTime));
  const endMinutes = toMinutes(getTimeString(endTime));
  const slotStartMinutes = toMinutes(slotStart);
  const slotEndMinutes = toMinutes(slotEnd);

  return (
    (startMinutes <= slotStartMinutes && endMinutes > slotStartMinutes) ||
    (startMinutes >= slotStartMinutes && startMinutes < slotEndMinutes)
  );
};

// =================== MAIN COMPONENT ===================
const Schedulepage: React.FC = () => {
  // =================== STATES ===================
  const [academicYear, setAcademicYear] = useState(() => 
    localStorage.getItem("academicYear") || ""
  );
  const [term, setTerm] = useState(() => 
    localStorage.getItem("term") || ""
  );
 const [major_name, setmajor_name] = useState(() => 
    localStorage.getItem("major_name") || ""
  );
  const [role, setrole] = useState(() => 
    localStorage.getItem("role") || ""
  );

  const [scheduleData, setScheduleData] = useState<ExtendedScheduleData[]>([]);
  const [filteredScheduleData, setFilteredScheduleData] = useState<ExtendedScheduleData[]>([]);
  const [allNameTable, setAllNameTable] = useState<string[]>([]);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [loadModalVisible, setLoadModalVisible] = useState(false);
  const [scheduleNameToSave, setScheduleNameToSave] = useState("");
  const [deletingName, setDeletingName] = useState<string | null>(null);
  const [draggedSubCell, setDraggedSubCell] = useState<SubCell | null>(null);
  const [dragPreview, setDragPreview] = useState<DragPreview | null>(null);

  // =================== NEW STATES FOR API TRACKING ===================
  const [currentTableName, setCurrentTableName] = useState("");
  const [isTableFromAPI, setIsTableFromAPI] = useState(false);
  const [originalScheduleData, setOriginalScheduleData] = useState<any[]>([]);

  // =================== FILTER STATES ===================
  const [filterTags, setFilterTags] = useState<FilterTag[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    teachers: [],
    studentYears: [],
    subjects: [],
    courseCodes: [],
    rooms: []
  });
  const [searchValue, setSearchValue] = useState("");
  const [filterVisible, setFilterVisible] = useState(false);

  // =================== NEW SIDEBAR STATES ===================
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [courseCards, setCourseCards] = useState<CourseCard[]>([]);
  const [filteredCourseCards, setFilteredCourseCards] = useState<CourseCard[]>([]);
  const [draggedCourseCard, setDraggedCourseCard] = useState<CourseCard | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(350);
  
  // Sidebar Filter States
  const [sidebarFilterTags, setSidebarFilterTags] = useState<FilterTag[]>([]);
  const [sidebarSearchValue, setSidebarSearchValue] = useState("");
  const [sidebarFilterVisible, setSidebarFilterVisible] = useState(false);

  // =================== NEW REMOVED COURSES STATES ===================
  const [removedCourses, setRemovedCourses] = useState<RemovedCourse[]>([]);
  const [filteredRemovedCourses, setFilteredRemovedCourses] = useState<RemovedCourse[]>([]);
  const [removedSearchValue, setRemovedSearchValue] = useState("");
  const [activeTab, setActiveTab] = useState("available"); // "available" | "removed"

  const tableRef = useRef<HTMLDivElement>(null);

  // =================== REMOVED COURSES FILTER FUNCTIONS ===================
  const applyRemovedCoursesFilter = () => {
    if (!removedSearchValue) {
      setFilteredRemovedCourses(removedCourses);
      return;
    }

    const filtered = removedCourses.filter(course => 
      course.subject.toLowerCase().includes(removedSearchValue.toLowerCase()) ||
      course.teacher.toLowerCase().includes(removedSearchValue.toLowerCase()) ||
      course.courseCode.toLowerCase().includes(removedSearchValue.toLowerCase()) ||
      course.room.toLowerCase().includes(removedSearchValue.toLowerCase())
    );

    setFilteredRemovedCourses(filtered);
  };

  // Apply removed courses filter when search value changes
  useEffect(() => {
    applyRemovedCoursesFilter();
  }, [removedSearchValue, removedCourses]);

  // =================== SIDEBAR FILTER FUNCTIONS ===================
  const addSidebarFilterTag = (type: FilterTag['type'], value: string) => {
    if (!value || sidebarFilterTags.some(tag => tag.type === type && tag.value === value)) {
      return;
    }

    const newTag: FilterTag = {
      id: `sidebar-${type}-${value}-${Date.now()}`,
      type,
      value,
      label: `${getFilterTypeLabel(type)}: ${value}`,
      color: FILTER_TAG_COLORS[type]
    };

    setSidebarFilterTags(prev => [...prev, newTag]);
  };

  const removeSidebarFilterTag = (tagId: string) => {
    setSidebarFilterTags(prev => prev.filter(tag => tag.id !== tagId));
  };

  const clearAllSidebarFilters = () => {
    setSidebarFilterTags([]);
    setSidebarSearchValue("");
  };

  const applySidebarFilters = () => {
    if (sidebarFilterTags.length === 0 && !sidebarSearchValue) {
      setFilteredCourseCards(courseCards);
      return;
    }

    const filtered = courseCards.filter(courseCard => {
      // Apply tag filters
      const tagMatch = sidebarFilterTags.length === 0 || sidebarFilterTags.every(tag => {
        switch (tag.type) {
          case 'teacher':
            return courseCard.teacher
              .toLowerCase()
              .includes(tag.value.toLowerCase());
          case 'studentYear':
            return courseCard.studentYear === tag.value;
          case 'subject':
            return courseCard.subject
              .toLowerCase()
              .includes(tag.value.toLowerCase());
          case 'courseCode':
            return courseCard.courseCode
              .toLowerCase()
              .includes(tag.value.toLowerCase());
          case 'room':
            return courseCard.room
              .toLowerCase()
              .includes(tag.value.toLowerCase());
          default:
            return true;
        }
      });

      // Apply search filter
      const searchMatch = !sidebarSearchValue || 
        courseCard.teacher.toLowerCase().includes(sidebarSearchValue.toLowerCase()) ||
        courseCard.subject.toLowerCase().includes(sidebarSearchValue.toLowerCase()) ||
        courseCard.courseCode.toLowerCase().includes(sidebarSearchValue.toLowerCase());

      return tagMatch && searchMatch;
    });

    setFilteredCourseCards(filtered);
  };

  // Apply sidebar filters whenever sidebarFilterTags or sidebarSearchValue changes
  useEffect(() => {
    applySidebarFilters();
  }, [sidebarFilterTags, sidebarSearchValue, courseCards]);

  // =================== REMOVED COURSES FUNCTIONS ===================
  const addToRemovedCourses = (subCell: SubCell) => {
    // สร้าง unique identifier เพื่อตรวจสอบการซ้ำกันก่อนเพิ่ม
    const uniqueKey = `${subCell.classData.subject}-${subCell.classData.courseCode}-${subCell.classData.section}-${subCell.classData.teacher}-${subCell.day}-${subCell.startTime}-${subCell.endTime}`;
    
    // ตรวจสอบว่ามีวิชานี้ใน removed courses แล้วหรือไม่
    const isDuplicate = removedCourses.some(existing => {
      const existingKey = `${existing.subject}-${existing.courseCode}-${existing.section}-${existing.teacher}-${existing.originalDay}-${existing.originalStartTime}-${existing.originalEndTime}`;
      return existingKey === uniqueKey;
    });

    if (isDuplicate) {
      console.warn('🚫 Duplicate course detected, not adding to removed courses:', uniqueKey);
      return;
    }

    const removedCourse: RemovedCourse = {
      id: `removed-${Date.now()}-${Math.random()}`,
      subject: subCell.classData.subject,
      courseCode: subCell.classData.courseCode || "",
      teacher: subCell.classData.teacher,
      room: subCell.classData.room,
      section: subCell.classData.section || "",
      studentYear: subCell.classData.studentYear || "",
      duration: subCell.position.endSlot - subCell.position.startSlot,
      color: subCell.classData.color || getSubjectColor(subCell.classData.subject),
      scheduleId: subCell.scheduleId,
      removedAt: new Date(),
      originalDay: subCell.day,
      originalStartTime: subCell.startTime,
      originalEndTime: subCell.endTime
    };

    setRemovedCourses(prev => [removedCourse, ...prev]);
    console.log('✅ Added to removed courses:', removedCourse.subject);
  };

  const restoreRemovedCourse = (removedCourse: RemovedCourse) => {
    // ตรวจสอบ role ก่อน
    if (role !== "Scheduler") {
      message.warning("เฉพาะ Scheduler เท่านั้นที่สามารถกู้คืนวิชาได้");
      return;
    }

    // สร้าง ClassInfo จาก removed course
    const classInfo: ClassInfo = {
      subject: removedCourse.subject,
      teacher: removedCourse.teacher,
      room: removedCourse.room,
      section: removedCourse.section,
      courseCode: removedCourse.courseCode,
      studentYear: removedCourse.studentYear,
      color: removedCourse.color
    };

    // สร้าง SubCell ใหม่
    const newSubCell = createSubCell(
      classInfo, 
      removedCourse.originalDay, 
      removedCourse.originalStartTime, 
      removedCourse.originalEndTime,
      removedCourse.scheduleId
    );

    // หา row ที่เหมาะสมในวันเดิม
    const dayRows = scheduleData.filter(row => row.day === removedCourse.originalDay);
    let canRestore = false;
    let targetRow: ExtendedScheduleData | null = null;

    // ตรวจสอบว่ามี row ว่างในช่วงเวลาเดิมหรือไม่
    for (const row of dayRows) {
      const hasConflict = (row.subCells || []).some(existingSubCell => 
        doSubCellsOverlap(newSubCell, existingSubCell)
      );
      
      if (!hasConflict) {
        targetRow = row;
        canRestore = true;
        break;
      }
    }

    if (canRestore && targetRow) {
      addSubCellToDay(removedCourse.originalDay, newSubCell);
      // ลบออกจาก removed courses
      setRemovedCourses(prev => prev.filter(course => course.id !== removedCourse.id));
      message.success(`กู้คืนวิชา "${removedCourse.subject}" สำเร็จ`);
    } else {
      message.warning("ไม่สามารถกู้คืนได้ เนื่องจากมีการซ้อนทับเวลาในตำแหน่งเดิม");
    }
  };

  const deleteRemovedCoursePermanently = (removedCourseId: string) => {
    const removedCourse = removedCourses.find(course => course.id === removedCourseId);
    if (!removedCourse) return;

    Modal.confirm({
      title: 'ยืนยันการลบถาวร',
      content: `คุณต้องการลบวิชา "${removedCourse.subject}" ออกจากรายการถาวรหรือไม่? การดำเนินการนี้ไม่สามารถยกเลิกได้`,
      okText: 'ลบถาวร',
      okType: 'danger',
      cancelText: 'ยกเลิก',
      onOk() {
        setRemovedCourses(prev => prev.filter(course => course.id !== removedCourseId));
        message.success("ลบวิชาออกจากรายการถาวรแล้ว");
      }
    });
  };

  const clearAllRemovedCourses = () => {
    if (removedCourses.length === 0) {
      message.info("ไม่มีรายการวิชาที่ถูกลบ");
      return;
    }

    Modal.confirm({
      title: 'ยืนยันการล้างรายการทั้งหมด',
      content: `คุณต้องการลบรายการวิชาที่ถูกลบทั้งหมด ${removedCourses.length} รายการหรือไม่? การดำเนินการนี้ไม่สามารถยกเลิกได้`,
      okText: 'ล้างทั้งหมด',
      okType: 'danger',
      cancelText: 'ยกเลิก',
      onOk() {
        setRemovedCourses([]);
        setRemovedSearchValue("");
        message.success("ล้างรายการวิชาที่ถูกลบทั้งหมดแล้ว");
      }
    });
  };

  // =================== COURSE CARD FUNCTIONS ===================
const generateCourseCardsFromAPI = (schedules: ScheduleInterface[]) => {
  const cards: CourseCard[] = [];
  const seenCourses = new Set<string>();

  schedules.forEach((schedule, index) => {
    const isTimeFixed = schedule.TimeFixedCourses && 
                       schedule.TimeFixedCourses.length > 0 && 
                       schedule.TimeFixedCourses.some(tc => 
                         tc.Section === schedule.SectionNumber && 
                         tc.ScheduleID === schedule.ID &&
                         tc.RoomFix && tc.RoomFix.trim() !== ""
                       );

    if (isTimeFixed) {
      return;
    }

    const getRoomInfo = (schedule: ScheduleInterface): string => {
      if (schedule.TimeFixedCourses && schedule.TimeFixedCourses.length > 0) {
        const matchingFixedCourse = schedule.TimeFixedCourses.find(
          tc => tc.Section === schedule.SectionNumber && 
               tc.ScheduleID === schedule.ID &&
               tc.RoomFix && tc.RoomFix.trim() !== ""
        );
        if (matchingFixedCourse?.RoomFix) {
          return matchingFixedCourse.RoomFix;
        }
      }
      return "TBA";
    };

    const getStudentYear = (schedule: ScheduleInterface): string => {
      const academicYear = (schedule.OfferedCourses?.AllCourses as any)?.AcademicYear;
      
      if (academicYear?.Level && academicYear.Level !== 'เรียนได้ทุกชั้นปี') {
        if (/^\d+$/.test(academicYear.Level)) {
          return academicYear.Level;
        }
        
        const yearMatch = academicYear.Level.match(/ปีที่\s*(\d+)/);
        if (yearMatch) {
          return yearMatch[1];
        }
      }
      
      const academicYearId = academicYear?.AcademicYearID;
      if (academicYearId) {
        switch (academicYearId) {
          case 2: return "1";
          case 3: return "2";
          case 4: return "3";
          case 1:
            break;
          default:
            if (academicYearId >= 5 && academicYearId <= 10) {
              return (academicYearId - 1).toString();
            }
            break;
        }
      }
      
      if (schedule.OfferedCourses?.AllCourses?.Code) {
        const code = schedule.OfferedCourses.AllCourses.Code;
        
        const codeYearMatch1 = code.match(/[A-Z]{2,4}\d+\s+(\d)/);
        if (codeYearMatch1) {
          return codeYearMatch1[1];
        }
        
        const codeYearMatch2 = code.match(/[A-Z]{2,4}(\d)/);
        if (codeYearMatch2) {
          return codeYearMatch2[1];
        }
      }
      
      return "1";
    };

    const subject = schedule.OfferedCourses?.AllCourses?.ThaiName ||
                   schedule.OfferedCourses?.AllCourses?.EnglishName ||
                   schedule.OfferedCourses?.AllCourses?.Code ||
                   "ไม่ทราบชื่อ";
    
    const courseCode = schedule.OfferedCourses?.AllCourses?.Code || "";
    const teacher = schedule.OfferedCourses?.User ? 
                   `${schedule.OfferedCourses.User.Firstname || ""} ${schedule.OfferedCourses.User.Lastname || ""}`.trim() ||
                   "ไม่ระบุอาจารย์" :
                   "ไม่ระบุอาจารย์";
    const room = getRoomInfo(schedule);
    const section = schedule.SectionNumber?.toString() || "";
    const studentYear = getStudentYear(schedule);

    const courseKey = `${courseCode}-${section}-${studentYear}-${teacher}`;
    
    if (!seenCourses.has(courseKey)) {
      seenCourses.add(courseKey);
      
      const getTimeString = (time: string | Date): string => {
        if (typeof time === 'string') {
          if (time.includes('T')) {
            return time.substring(11, 16);
          }
          return time.length > 5 ? time.substring(0, 5) : time;
        } else if (time instanceof Date) {
          return time.toTimeString().substring(0, 5);
        }
        return "00:00";
      };

      const startTime = getTimeString(schedule.StartTime);
      const endTime = getTimeString(schedule.EndTime);
      const startSlot = timeToSlotIndex(startTime);
      const endSlot = timeToSlotIndex(endTime);
      const duration = endSlot - startSlot;

      const card: CourseCard = {
        id: `course-card-${index}`,
        subject,
        courseCode,
        teacher,
        room,
        section,
        studentYear,
        duration: Math.max(1, duration),
        color: getSubjectColor(subject, courseCode),
        scheduleId: schedule.ID
      };

      cards.push(card);
    }
  });

  setCourseCards(cards);
  setFilteredCourseCards(cards);
};

  // =================== COURSE CARD DRAG HANDLERS ===================
const handleCourseCardDragStart = (e: React.DragEvent, courseCard: CourseCard) => {
  // ตรวจสอบ role ก่อน
  if (role !== "Scheduler") {
    e.preventDefault();
    message.warning("เฉพาะ Scheduler เท่านั้นที่สามารถลากวิชาไปใส่ในตารางได้");
    return;
  }

  setDraggedCourseCard(courseCard);
  e.dataTransfer.effectAllowed = "copy";
  
  if (e.currentTarget instanceof HTMLElement) {
    e.currentTarget.style.opacity = "0.5";
  }
};

  const handleCourseCardDragEnd = (e: React.DragEvent) => {
    setDraggedCourseCard(null);
    setDragPreview(null);
    
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "1";
    }
  };

  // Modified cell drag handlers to handle course cards
const handleCellDragOver = (e: React.DragEvent, targetRow: ExtendedScheduleData, timeSlot: string) => {
  // ตรวจสอบ role ก่อน
  if (role !== "Scheduler") {
    e.preventDefault();
    return;
  }
  
  e.preventDefault();
  
  const slotIndex = timeToSlotIndex(timeSlot.split('-')[0]);
  let duration = 1;
  
  if (draggedSubCell) {
    duration = draggedSubCell.position.endSlot - draggedSubCell.position.startSlot;
  } else if (draggedCourseCard) {
    duration = draggedCourseCard.duration;
  }
  
  setDragPreview({
    day: targetRow.day,
    startSlot: slotIndex,
    endSlot: slotIndex + duration,
    show: true
  });
};

  // Modified drop handler to handle both subcells and course cards
  const handleCellDrop = (e: React.DragEvent, targetRow: ExtendedScheduleData, timeSlot: string) => {
  e.preventDefault();
  
  // ตรวจสอบ role ก่อน
  if (role !== "Scheduler") {
    message.warning("เฉพาะ Scheduler เท่านั้นที่สามารถย้ายตารางเรียนได้");
    setDraggedCourseCard(null);
    setDraggedSubCell(null);
    setDragPreview(null);
    return;
  }
  
  const slotIndex = timeToSlotIndex(timeSlot.split('-')[0]);
  
  if (draggedCourseCard) {
    // Handle course card drop
    const startTime = slotIndexToTime(slotIndex);
    const endTime = slotIndexToTime(slotIndex + draggedCourseCard.duration);
    
    const classInfo: ClassInfo = {
      subject: draggedCourseCard.subject,
      teacher: draggedCourseCard.teacher,
      room: draggedCourseCard.room,
      section: draggedCourseCard.section,
      courseCode: draggedCourseCard.courseCode,
      studentYear: draggedCourseCard.studentYear,
      color: draggedCourseCard.color
    };
    
    const newSubCell = createSubCell(classInfo, targetRow.day, startTime, endTime, draggedCourseCard.scheduleId);
    
    // Check for conflicts
    const hasConflict = (targetRow.subCells || []).some(existingSubCell => 
      doSubCellsOverlap(newSubCell, existingSubCell)
    );
    
    if (hasConflict) {
      message.warning("ไม่สามารถวางที่ตำแหน่งนี้ได้ เนื่องจากมีการซ้อนทับเวลา");
      setDraggedCourseCard(null);
      setDragPreview(null);
      return;
    }
    
    addSubCellToDay(targetRow.day, newSubCell);
    setDraggedCourseCard(null);
    setDragPreview(null);
    message.success(`เพิ่มวิชา ${draggedCourseCard.subject} ลงในตารางแล้ว`);
    
  } else if (draggedSubCell) {
    // Handle existing subcell move
    const duration = draggedSubCell.position.endSlot - draggedSubCell.position.startSlot;
    const tempSubCell = {
      ...draggedSubCell,
      position: { startSlot: slotIndex, endSlot: slotIndex + duration }
    };
    
    const hasConflict = (targetRow.subCells || []).some(existingSubCell => 
      existingSubCell.id !== draggedSubCell.id && doSubCellsOverlap(tempSubCell, existingSubCell)
    );
    
    if (hasConflict) {
      message.warning("ไม่สามารถวางที่ตำแหน่งนี้ได้ เนื่องจากมีการซ้อนทับเวลา");
      return;
    }
    
    moveSubCellToRow(draggedSubCell.id, targetRow, slotIndex);
    setDraggedSubCell(null);
    setDragPreview(null);
  }
};

  // =================== RENDER REMOVED COURSE ===================
  const renderRemovedCourse = (removedCourse: RemovedCourse) => {
    const isScheduler = role === "Scheduler";

    return (
      <div
        key={removedCourse.id}
        style={{
          backgroundColor: "#f5f5f5",
          border: "2px solid #d9d9d9",
          borderRadius: "8px",
          padding: "12px",
          margin: "8px 0",
          opacity: 0.8,
          transition: "all 0.2s ease",
          fontSize: "11px",
          lineHeight: "1.3",
          position: "relative"
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-1px)";
          e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0px)";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        <Tooltip
          title={
            <div style={{ fontFamily: "Sarabun, sans-serif", minWidth: "250px" }}>
              <div style={{ fontWeight: "bold", fontSize: "13px", marginBottom: "6px", color: "#ff4d4f" }}>
                🗑️ รายละเอียดวิชาที่ถูกลบ
              </div>
              <p><b>🏷️ รหัสวิชา:</b> {removedCourse.courseCode || "ไม่ระบุ"}</p>
              <p><b>📖 ชื่อวิชา:</b> {removedCourse.subject || "ไม่ระบุ"}</p>
              <p><b>🎓 ชั้นปี:</b> {removedCourse.studentYear ? `ปีที่ ${removedCourse.studentYear}` : "ไม่ระบุ"}</p>
              <p><b>📄 หมู่เรียน:</b> {removedCourse.section || "ไม่ระบุ"}</p>
              <p><b>👩‍🏫 อาจารย์:</b> {removedCourse.teacher || "ไม่ระบุ"}</p>
              <p><b>� ห้องเรียน:</b> {removedCourse.room || "ไม่ระบุ"}</p>
              <p><b>📅 วันเดิม:</b> {removedCourse.originalDay}</p>
              <p><b>🕐 เวลาเดิม:</b> {removedCourse.originalStartTime} - {removedCourse.originalEndTime}</p>
              <p><b>🗓️ ลบเมื่อ:</b> {removedCourse.removedAt.toLocaleString('th-TH')}</p>
              <div style={{ marginTop: "8px", fontSize: "11px", color: "#666", fontStyle: "italic" }}>
                {isScheduler 
                  ? "💡 คลิกปุ่มเพื่อกู้คืนหรือลบถาวร"
                  : "🔒 ต้องเป็น Scheduler เท่านั้นถึงจะกู้คืนได้"
                }
              </div>
            </div>
          }
          placement="left"
          overlayStyle={{ maxWidth: "350px" }}
        >
          <div>
            <div style={{ fontWeight: "bold", fontSize: "12px", marginBottom: "4px", color: "#666" }}>
              <DeleteOutlined style={{ color: "#ff4d4f", marginRight: "4px" }} />
              {removedCourse.subject}
              {!isScheduler && (
                <span style={{ marginLeft: "8px", fontSize: "10px" }}>🔒</span>
              )}
            </div>
            <div style={{ fontSize: "9px", color: "#999", marginBottom: "2px" }}>
              รหัส: {removedCourse.courseCode}
            </div>
            <div style={{ fontSize: "10px", color: "#888", marginBottom: "2px" }}>
              อาจารย์: {removedCourse.teacher}
            </div>
            <div style={{ fontSize: "9px", color: "#aaa", marginBottom: "4px" }}>
              ห้อง: {removedCourse.room} | วันเดิม: {removedCourse.originalDay}
            </div>
            
            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "4px", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
              <div style={{ fontSize: "8px", color: "#999" }}>
                ลบเมื่อ: {removedCourse.removedAt.toLocaleTimeString('th-TH', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
              
              {isScheduler && (
                <div style={{ display: "flex", gap: "4px" }}>
                  <Button
                    size="small"
                    type="primary"
                    icon={<RestTwoTone />}
                    onClick={() => restoreRemovedCourse(removedCourse)}
                    style={{ 
                      height: "24px", 
                      fontSize: "10px",
                      backgroundColor: "#52c41a",
                      borderColor: "#52c41a"
                    }}
                  >
                    กู้คืน
                  </Button>
                  <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => deleteRemovedCoursePermanently(removedCourse.id)}
                    style={{ height: "24px", fontSize: "10px" }}
                  >
                    ลบถาวร
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Tooltip>
      </div>
    );
  };

  // =================== RENDER COURSE CARD ===================
const renderCourseCard = (courseCard: CourseCard) => {
  const isScheduler = role === "Scheduler";

  return (
    <div
      key={courseCard.id}
      draggable={isScheduler} // เฉพาะ Scheduler เท่านั้นที่ drag ได้
      onDragStart={isScheduler ? (e) => handleCourseCardDragStart(e, courseCard) : undefined}
      onDragEnd={isScheduler ? handleCourseCardDragEnd : undefined}
      style={{
        backgroundColor: courseCard.color,
        border: "2px solid rgba(0,0,0,0.1)",
        borderRadius: "8px",
        padding: "12px",
        margin: "8px 0",
        cursor: isScheduler ? "grab" : "default", // เปลี่ยน cursor ตาม role
        transition: "all 0.2s ease",
        fontSize: "11px",
        lineHeight: "1.3",
        opacity: !isScheduler ? 0.7 : 1, // ลด opacity สำหรับ non-scheduler
      }}
      onMouseEnter={(e) => {
        if (isScheduler) {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
        }
      }}
      onMouseLeave={(e) => {
        if (isScheduler) {
          e.currentTarget.style.transform = "translateY(0px)";
          e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
        }
      }}
      onClick={() => {
        if (!isScheduler) {
          message.warning("เฉพาะ Scheduler เท่านั้นที่สามารถลากวิชาไปใส่ในตารางได้");
        }
      }}
    >
      <Tooltip
        title={
          <div style={{ fontFamily: "Sarabun, sans-serif", minWidth: "250px" }}>
            <div style={{ fontWeight: "bold", fontSize: "13px", marginBottom: "6px", color: "#F26522" }}>
              📚 รายละเอียดวิชา
            </div>
            <p><b>🏷️ รหัสวิชา:</b> {courseCard.courseCode || "ไม่ระบุ"}</p>
            <p><b>📖 ชื่อวิชา:</b> {courseCard.subject || "ไม่ระบุ"}</p>
            <p><b>🎓 ชั้นปี:</b> {courseCard.studentYear ? `ปีที่ ${courseCard.studentYear}` : "ไม่ระบุ"}</p>
            <p><b>📄 หมู่เรียน:</b> {courseCard.section || "ไม่ระบุ"}</p>
            <p><b>👩‍🏫 อาจารย์:</b> {courseCard.teacher || "ไม่ระบุ"}</p>
            <p><b>� ห้องเรียน:</b> {courseCard.room || "ไม่ระบุ"}</p>
            <p><b>ⱶ️ ระยะเวลา:</b> {courseCard.duration} ชั่วโมง</p>
            <div style={{ marginTop: "8px", fontSize: "11px", color: "#666", fontStyle: "italic" }}>
              {isScheduler 
                ? "💡 ลากการ์ดนี้ไปวางในตารางเรียน"
                : "🔒 ต้องเป็น Scheduler เท่านั้นถึงจะลากได้"
              }
            </div>
          </div>
        }
        placement="left"
        overlayStyle={{ maxWidth: "350px" }}
      >
        <div>
          <div style={{ fontWeight: "bold", fontSize: "12px", marginBottom: "4px", color: "#333" }}>
            {courseCard.subject}
            {!isScheduler && (
              <span style={{ marginLeft: "8px", fontSize: "10px" }}>🔒</span>
            )}
          </div>
          <div style={{ fontSize: "9px", color: "#666", marginBottom: "2px" }}>
            รหัส: {courseCard.courseCode}
          </div>
          <div style={{ fontSize: "10px", color: "#555", marginBottom: "2px" }}>
            อาจารย์: {courseCard.teacher}
          </div>
          <div style={{ fontSize: "9px", color: "#777", marginBottom: "2px" }}>
            ห้อง: {courseCard.room}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
            <span style={{ fontSize: "9px", color: "#888" }}>
              ปี {courseCard.studentYear} หมู่ {courseCard.section}
            </span>
            <span style={{ fontSize: "10px", fontWeight: "bold", color: "#F26522" }}>
              {courseCard.duration}ชม.
            </span>
          </div>
        </div>
      </Tooltip>
    </div>
  );
};

  // =================== RENDER SIDEBAR ===================
  const renderSidebar = () => {
    if (role !== "Scheduler" || !sidebarVisible) return null;
    
    const tabItems = [
      {
        key: 'available',
        label: (
          <span>
            📚 วิชาพร้อมใช้ 
            <Badge count={filteredCourseCards.length} style={{ marginLeft: '8px' }} />
          </span>
        ),
        children: renderAvailableCourses()
      },
      {
        key: 'removed',
        label: (
          <span>
            🗑️ วิชาที่ลบแล้ว 
            <Badge 
              count={filteredRemovedCourses.length} 
              style={{ marginLeft: '8px', backgroundColor: '#ff4d4f' }} 
            />
          </span>
        ),
        children: renderRemovedCourses()
      }
    ];
    
    return (
      <div
        style={{
          width: `${sidebarWidth}px`,
          backgroundColor: "#fafafa",
          borderLeft: "1px solid #d9d9d9",
          height: "100vh",
          minHeight: "100vh",
          maxHeight: "100vh",
          position: "fixed",
          right: 0,
          top: 0,
          bottom: 0,
          zIndex: 1000,
          boxShadow: "-2px 0 8px rgba(0,0,0,0.1)",
          transition: "right 0.3s ease",
          display: "flex",
          flexDirection: "column"
        }}
      >
        {/* Sidebar Header */}
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          padding: "16px",
          paddingBottom: "12px",
          borderBottom: "2px solid #F26522",
          flexShrink: 0
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <BookOutlined style={{ color: "#F26522", fontSize: "18px" }} />
            <h3 style={{ margin: 0, color: "#333", fontSize: "16px" }}>
              กล่องวิชา
            </h3>
          </div>
          <Button
            type="text"
            icon={<CloseOutlined />}
            onClick={() => setSidebarVisible(false)}
            size="small"
          />
        </div>

        {/* Tabs for Available and Removed Courses */}
        <div style={{ 
          flex: 1,
          padding: "0 16px 16px 16px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column"
        }}>
          <Tabs 
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            size="small"
            style={{ 
              height: "100%",
              display: "flex",
              flexDirection: "column"
            }}
            tabBarStyle={{ 
              marginBottom: "16px",
              flexShrink: 0
            }}
          />
        </div>

        {/* Sidebar Footer */}
        <div style={{ 
          padding: "12px 16px",
          borderTop: "1px solid #e8e8e8",
          fontSize: "10px",
          color: "#999",
          textAlign: "center",
          flexShrink: 0,
          backgroundColor: "#f0f0f0"
        }}>
          🔧 ใช้ปุ่มข้างบนเพื่อปิด sidebar
        </div>
      </div>
    );
  };

  // =================== RENDER AVAILABLE COURSES TAB ===================
  const renderAvailableCourses = () => {
    return (
      <div style={{ height: "100%" }}>
        {/* Available Courses Filter Section */}
        <div style={{ 
          backgroundColor: "#f5f5f5", 
          padding: "12px", 
          borderRadius: "6px", 
          border: "1px solid #e8e8e8",
          marginBottom: "16px" 
        }}>
          {/* Filter Header */}
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center", 
            marginBottom: "8px" 
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <FilterOutlined style={{ color: "#1890ff", fontSize: "12px" }} />
              <span style={{ fontWeight: "bold", color: "#333", fontSize: "12px" }}>
                กรองวิชา ({filteredCourseCards.length}/{courseCards.length})
              </span>
            </div>
            <div style={{ display: "flex", gap: "4px" }}>
              <Button
                size="small"
                icon={<SearchOutlined />}
                type={sidebarFilterVisible ? "primary" : "default"}
                onClick={() => setSidebarFilterVisible(!sidebarFilterVisible)}
                style={{ fontSize: "10px", height: "24px" }}
              >
                {sidebarFilterVisible ? "ซ่อน" : "แสดง"}
              </Button>
              {(sidebarFilterTags.length > 0 || sidebarSearchValue) && (
                <Button
                  size="small"
                  icon={<ClearOutlined />}
                  onClick={clearAllSidebarFilters}
                  danger
                  style={{ fontSize: "10px", height: "24px" }}
                >
                  ล้าง
                </Button>
              )}
            </div>
          </div>

          {/* Search Bar */}
          <div style={{ marginBottom: "8px" }}>
            <Input
              placeholder="ค้นหาวิชา, อาจารย์, รหัส..."
              prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
              value={sidebarSearchValue}
              onChange={(e) => setSidebarSearchValue(e.target.value)}
              allowClear
              size="small"
              style={{ width: "100%" }}
            />
          </div>

          {/* Filter Tags Display */}
          {sidebarFilterTags.length > 0 && (
            <div style={{ marginBottom: "8px" }}>
              <div style={{ fontSize: "10px", color: "#666", marginBottom: "4px" }}>
                ตัวกรอง:
              </div>
              <Space wrap size="small">
                {sidebarFilterTags.map(tag => (
                  <Tag
                    key={tag.id}
                    color={tag.color}
                    closable
                    onClose={() => removeSidebarFilterTag(tag.id)}
                    style={{ marginBottom: "2px", fontSize: "10px" }}
                  >
                    {tag.label}
                  </Tag>
                ))}
              </Space>
            </div>
          )}

          {/* Filter Controls */}
          {sidebarFilterVisible && (
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "1fr 1fr", 
              gap: "8px",
              borderTop: "1px solid #e8e8e8",
              paddingTop: "8px"
            }}>
              {/* Teacher Filter */}
              <div>
                <label style={{ fontSize: "10px", color: "#666", marginBottom: "2px", display: "block" }}>
                  อาจารย์:
                </label>
                <AutoComplete
                  placeholder="เลือกอาจารย์"
                  options={filterOptions.teachers.map(teacher => ({ value: teacher }))}
                  onSelect={(value) => addSidebarFilterTag('teacher', value)}
                  style={{ width: "100%" }}
                  size="small"
                  filterOption={(inputValue, option) =>
                    option?.value.toLowerCase().includes(inputValue.toLowerCase()) ?? false
                  }
                />
              </div>

              {/* Student Year Filter */}
              <div>
                <label style={{ fontSize: "10px", color: "#666", marginBottom: "2px", display: "block" }}>
                  ชั้นปี:
                </label>
                <Select
                  placeholder="เลือกชั้นปี"
                  onSelect={(value) => addSidebarFilterTag('studentYear', value)}
                  style={{ width: "100%" }}
                  size="small"
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  options={filterOptions.studentYears.map(year => ({ 
                    label: `ปีที่ ${year}`, 
                    value: year 
                  }))}
                />
              </div>

              {/* Subject Filter */}
              <div>
                <label style={{ fontSize: "10px", color: "#666", marginBottom: "2px", display: "block" }}>
                  วิชา:
                </label>
                <AutoComplete
                  placeholder="เลือกวิชา"
                  options={filterOptions.subjects.map(subject => ({ value: subject }))}
                  onSelect={(value) => addSidebarFilterTag('subject', value)}
                  style={{ width: "100%" }}
                  size="small"
                  filterOption={(inputValue, option) =>
                    option?.value.toLowerCase().includes(inputValue.toLowerCase()) ?? false
                  }
                />
              </div>

              {/* Course Code Filter */}
              <div>
                <label style={{ fontSize: "10px", color: "#666", marginBottom: "2px", display: "block" }}>
                  รหัสวิชา:
                </label>
                <AutoComplete
                  placeholder="เลือกรหัสวิชา"
                  options={filterOptions.courseCodes.map(code => ({ value: code }))}
                  onSelect={(value) => addSidebarFilterTag('courseCode', value)}
                  style={{ width: "100%" }}
                  size="small"
                  filterOption={(inputValue, option) =>
                    option?.value.toLowerCase().includes(inputValue.toLowerCase()) ?? false
                  }
                />
              </div>
            </div>
          )}
        </div>

        {/* Course Cards Count */}
        <div style={{ 
          backgroundColor: "#e6f7ff", 
          padding: "8px 12px", 
          borderRadius: "6px",
          marginBottom: "16px",
          border: "1px solid #91d5ff"
        }}>
          <div style={{ fontSize: "12px", color: "#1890ff" }}>
            📊 แสดงวิชา: <strong>{filteredCourseCards.length}</strong> จาก <strong>{courseCards.length}</strong> รายการ
          </div>
          <div style={{ fontSize: "11px", color: "#666", marginTop: "2px" }}>
            💡 ลากการ์ดวิชาไปวางในตารางเรียนได้เลย
          </div>
        </div>

        {/* Course Cards List */}
        <div style={{ maxHeight: "calc(100vh - 500px)", overflowY: "auto" }}>
          {filteredCourseCards.length === 0 ? (
            <div style={{ 
              textAlign: "center", 
              padding: "40px 20px", 
              color: "#999",
              backgroundColor: "#f9f9f9",
              borderRadius: "8px",
              border: "2px dashed #ddd"
            }}>
              <BookOutlined style={{ fontSize: "32px", marginBottom: "8px", color: "#ccc" }} />
              <div>
                {courseCards.length === 0 
                  ? "ไม่มีวิชาในกล่อง" 
                  : "ไม่มีวิชาที่ตรงกับการกรอง"
                }
              </div>
              <div style={{ fontSize: "11px", marginTop: "4px" }}>
                {courseCards.length === 0 
                  ? "กรุณาโหลดตารางจาก API ก่อน"
                  : "ลองปรับเงื่อนไขการกรอง"
                }
              </div>
            </div>
          ) : (
            filteredCourseCards.map(courseCard => renderCourseCard(courseCard))
          )}
        </div>
      </div>
    );
  };

  // =================== RENDER REMOVED COURSES TAB ===================
  const renderRemovedCourses = () => {
    return (
      <div style={{ height: "100%" }}>
        {/* Removed Courses Header */}
        <div style={{ 
          backgroundColor: "#fff1f0", 
          padding: "12px", 
          borderRadius: "6px", 
          border: "1px solid #ffccc7",
          marginBottom: "16px" 
        }}>
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center", 
            marginBottom: "8px" 
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <HistoryOutlined style={{ color: "#ff4d4f", fontSize: "12px" }} />
              <span style={{ fontWeight: "bold", color: "#333", fontSize: "12px" }}>
                วิชาที่ลบแล้ว ({filteredRemovedCourses.length})
              </span>
            </div>
            {removedCourses.length > 0 && (
              <Button
                size="small"
                icon={<DeleteOutlined />}
                onClick={clearAllRemovedCourses}
                danger
                style={{ fontSize: "10px", height: "24px" }}
              >
                ล้างทั้งหมด
              </Button>
            )}
          </div>

          {/* Search Bar for Removed Courses */}
          <div style={{ marginBottom: "8px" }}>
            <Input
              placeholder="ค้นหาวิชาที่ลบแล้ว..."
              prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
              value={removedSearchValue}
              onChange={(e) => setRemovedSearchValue(e.target.value)}
              allowClear
              size="small"
              style={{ width: "100%" }}
            />
          </div>
        </div>

        {/* Removed Courses Count */}
        <div style={{ 
          backgroundColor: "#fff1f0", 
          padding: "8px 12px", 
          borderRadius: "6px",
          marginBottom: "16px",
          border: "1px solid #ffccc7"
        }}>
          <div style={{ fontSize: "12px", color: "#ff4d4f" }}>
            📊 วิชาที่ถูกลบ: <strong>{filteredRemovedCourses.length}</strong> รายการ
          </div>
          <div style={{ fontSize: "11px", color: "#666", marginTop: "2px" }}>
            💡 สามารถกู้คืนหรือลบถาวรได้
          </div>
        </div>

        {/* Removed Courses List */}
        <div style={{ maxHeight: "calc(100vh - 500px)", overflowY: "auto" }}>
          {filteredRemovedCourses.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div>
                  <div style={{ color: "#999", marginBottom: "4px" }}>
                    {removedCourses.length === 0 
                      ? "ยังไม่มีวิชาที่ถูกลบ" 
                      : "ไม่มีวิชาที่ตรงกับการค้นหา"
                    }
                  </div>
                  <div style={{ fontSize: "11px", color: "#ccc" }}>
                    {removedCourses.length === 0 
                      ? "วิชาที่ลบออกจากตารางจะปรากฏที่นี่"
                      : "ลองใช้คำค้นหาอื่น"
                    }
                  </div>
                </div>
              }
              style={{ padding: "40px 20px" }}
            />
          ) : (
            filteredRemovedCourses.map(removedCourse => renderRemovedCourse(removedCourse))
          )}
        </div>
      </div>
    );
  };

  // =================== FILTER FUNCTIONS ===================
  const extractFilterOptions = (data: ExtendedScheduleData[]) => {
    const teachers = new Set<string>();
    const studentYears = new Set<string>();
    const subjects = new Set<string>();
    const courseCodes = new Set<string>();
    const rooms = new Set<string>();

    data.forEach(dayData => {
      dayData.subCells?.forEach(subCell => {
        if (subCell.classData.teacher) teachers.add(subCell.classData.teacher);
        if (subCell.classData.studentYear) {
          studentYears.add(subCell.classData.studentYear);
        }
        if (subCell.classData.subject) {
          subjects.add(subCell.classData.subject);
        }
        if (subCell.classData.courseCode) {
          courseCodes.add(subCell.classData.courseCode);
        }
        if (subCell.classData.room) {
          rooms.add(subCell.classData.room);
        }
      });
    });

    // Extract student years from original API data เท่านั้น (ไม่ hardcode)
    if (originalScheduleData && originalScheduleData.length > 0) {
      originalScheduleData.forEach((schedule: any) => {
        if (schedule.OfferedCourses?.AllCourses?.AcademicYear?.AcademicYearID) {
          const academicYearId = schedule.OfferedCourses.AllCourses.AcademicYear.AcademicYearID;
          studentYears.add(academicYearId.toString());
        }
        
        if (schedule.OfferedCourses?.AllCourses?.AcademicYear?.Level) {
          const level = schedule.OfferedCourses.AllCourses.AcademicYear.Level;
          if (level && level !== 'เรียนได้ทุกชั้นปี') {
            const yearMatch = level.match(/ปีที่\s*(\d+)/);
            if (yearMatch) {
              studentYears.add(yearMatch[1]);
            } else if (!level.includes('ปีที่')) {
              studentYears.add(level);
            }
          }
        }
      });
    }
    
    // กรองเฉพาะตัวเลข 1-9 (เผื่อมีปีอื่นๆ ในอนาคต)
    const validYears = Array.from(studentYears).filter(year => {
      const num = parseInt(year);
      return !isNaN(num) && num >= 1 && num <= 9;
    });

    setFilterOptions({
      teachers: Array.from(teachers).filter(Boolean).sort(),
      studentYears: validYears.sort((a, b) => parseInt(a) - parseInt(b)),
      subjects: Array.from(subjects).filter(Boolean).sort(),
      courseCodes: Array.from(courseCodes).filter(Boolean).sort(),
      rooms: Array.from(rooms).filter(Boolean).sort()
    });

  };

  const addFilterTag = (type: FilterTag['type'], value: string) => {
    if (!value || filterTags.some(tag => tag.type === type && tag.value === value)) {
      return;
    }

    const newTag: FilterTag = {
      id: `${type}-${value}-${Date.now()}`,
      type,
      value,
      label: `${getFilterTypeLabel(type)}: ${value}`,
      color: FILTER_TAG_COLORS[type]
    };

    setFilterTags(prev => [...prev, newTag]);
  };

  const removeFilterTag = (tagId: string) => {
    setFilterTags(prev => prev.filter(tag => tag.id !== tagId));
  };

  const clearAllFilters = () => {
    setFilterTags([]);
    setSearchValue("");
  };

  const getFilterTypeLabel = (type: FilterTag['type']): string => {
    switch (type) {
      case 'teacher': return 'อาจารย์';
      case 'studentYear': return 'ชั้นปี';
      case 'subject': return 'วิชา';
      case 'courseCode': return 'รหัสวิชา';
      case 'room': return 'ห้อง';
      default: return type;
    }
  };

const applyFilters = () => {
  if (filterTags.length === 0 && !searchValue) {
    setFilteredScheduleData(scheduleData);
    return;
  }

  const filtered = scheduleData.map(dayData => {
    const filteredSubCells = dayData.subCells?.filter(subCell => {
      // Apply tag filters
      const tagMatch = filterTags.length === 0 || filterTags.every(tag => {
        switch (tag.type) {
          case 'teacher':
            return subCell.classData.teacher
              .toLowerCase()
              .includes(tag.value.toLowerCase());
          case 'studentYear':
            const scheduleFromOriginal = originalScheduleData.find(
              (original: any) => original.ID === subCell.scheduleId
            );

            if (scheduleFromOriginal) {
              const academicYearId =
                (scheduleFromOriginal.OfferedCourses?.AllCourses as any)
                  ?.AcademicYear?.AcademicYearID;

              if (academicYearId) {
                return academicYearId.toString() === tag.value;
              }

              const level =
                (scheduleFromOriginal.OfferedCourses?.AllCourses as any)
                  ?.AcademicYear?.Level;
              if (level && level !== 'เรียนได้ทุกชั้นปี') {
                const yearMatch = level.match(/ปีที่\s*(\d+)/);
                if (yearMatch) {
                  return yearMatch[1] === tag.value;
                }
                return level === tag.value;
              }
            }

            return subCell.classData.studentYear === tag.value;

          case 'subject':
            return subCell.classData.subject
              .toLowerCase()
              .includes(tag.value.toLowerCase());

          case 'courseCode':
            return subCell.classData.courseCode
              ?.toLowerCase()
              .includes(tag.value.toLowerCase()) || false;

          case 'room':
            return subCell.classData.room
              .toLowerCase()
              .includes(tag.value.toLowerCase());

          default:
            return true;
        }
      });

      // Apply search filter (search in teacher name only)
      const searchMatch =
        !searchValue ||
        subCell.classData.teacher
          .toLowerCase()
          .includes(searchValue.toLowerCase());

      return tagMatch && searchMatch;
    }) || [];

    return {
      ...dayData,
      subCells: filteredSubCells,
    };
  });

  setFilteredScheduleData(filtered);
};

  // Apply filters whenever filterTags or searchValue changes
  useEffect(() => {
    applyFilters();
  }, [filterTags, searchValue, scheduleData]);

  // Extract filter options whenever scheduleData changes
  useEffect(() => {
    extractFilterOptions(scheduleData);
  }, [scheduleData]);

  // =================== SUB-CELL FUNCTIONS ===================
  const createSubCell = (
    classData: ClassInfo, 
    day: string, 
    startTime: string, 
    endTime: string,
    scheduleId?: number,
    isTimeFixed: boolean = false,    // เพิ่มบรรทัดนี้
    timeFixedId?: number            // เพิ่มบรรทัดนี้
  ): SubCell => {
    const cleanStartTime = startTime.includes('-') ? startTime.split('-')[0] : startTime;
    const cleanEndTime = endTime.includes('-') ? endTime.split('-')[1] || endTime : endTime;
    
    const startSlot = timeToSlotIndex(cleanStartTime);
    const endSlot = timeToSlotIndex(cleanEndTime);
    
    return {
      id: `${day}-${Date.now()}-${Math.random()}`,
      classData: {
        ...classData,
        // ใช้สีที่สอดคล้องกับวิชาแทนการสุ่ม
        color: classData.color || getSubjectColor(classData.subject, classData.courseCode)
      },
      startTime: cleanStartTime,
      endTime: cleanEndTime,
      day,
      position: {
        startSlot,
        endSlot
      },
      zIndex: 1,
      scheduleId: scheduleId,
      isTimeFixed: isTimeFixed,      // เพิ่มบรรทัดนี้
      timeFixedId: timeFixedId       // เพิ่มบรรทัดนี้
    };
  };

 const addSubCellToDay = (day: string, subCell: SubCell) => {
  setScheduleData(prevData => {
    // หาแถวของวันที่เหมาะสม (ไม่มีการซ้อนทับเวลา)
    const dayRows = prevData.filter(row => row.day === day);
    
    let targetRowIndex = -1;
    for (let i = 0; i < dayRows.length; i++) {
      const row = dayRows[i];
      const hasConflict = (row.subCells || []).some(existingSubCell => 
        doSubCellsOverlap(subCell, existingSubCell)
      );
      
      if (!hasConflict) {
        targetRowIndex = prevData.findIndex(r => r.key === row.key);
        break;
      }
    }
    
    const newData = [...prevData];
    
    if (targetRowIndex !== -1) {
      // เพิ่มลงในแถวที่มีอยู่
      newData[targetRowIndex] = {
        ...newData[targetRowIndex],
        subCells: [...(newData[targetRowIndex].subCells || []), subCell]
      };
      
      // เช็คว่าเพิ่มลงในแถวสุดท้ายของวันหรือไม่
      const isLastRowOfDay = targetRowIndex === dayRows.length - 1;
      const isEmptyRow = (newData[targetRowIndex].subCells || []).length === 1; // มี subcell แค่ตัวเดียวที่เพิ่งเพิ่ม
      
      if (isLastRowOfDay && !isEmptyRow) {
        // สร้าง empty row ใหม่หลังจากแถวสุดท้าย
        const dayIndex = DAYS.findIndex(d => d === day);
        const newEmptyRowIndex = dayRows.length;
        const newTotalRows = dayRows.length + 1;
        
        const newEmptyRow = createEmptyDayRow(day, dayIndex, newEmptyRowIndex, newTotalRows);
        newEmptyRow.isFirstRowOfDay = false;
        
        // อัปเดต totalRowsInDay ของแถวอื่นในวันเดียวกัน
        newData.forEach(row => {
          if (row.day === day) {
            row.totalRowsInDay = newTotalRows;
          }
        });
        
        newData.push(newEmptyRow);
      }
    } else {
      // สร้างแถวใหม่
      const dayIndex = DAYS.findIndex(d => d === day);
      const newRowIndex = dayRows.length;
      const newTotalRows = dayRows.length + 2; // +2 เพราะจะมีแถวใหม่ + empty row
      
      const newRowData: ExtendedScheduleData = {
        key: `day-${dayIndex}-row-${newRowIndex}`,
        day: day,
        dayIndex: dayIndex,
        rowIndex: newRowIndex,
        isFirstRowOfDay: newRowIndex === 0,
        totalRowsInDay: newTotalRows,
        subCells: [subCell]
      };
      
      // เพิ่ม time slots
      TIME_SLOTS.forEach((time) => {
        if (time === "12:00-13:00") {
          newRowData[time] = {
            content: "พักเที่ยง",
            backgroundColor: "#FFF5E5",
            isBreak: true,
          };
        } else {
          newRowData[time] = {
            content: "",
            backgroundColor: "#f9f9f9",
            classes: [],
          };
        }
      });
      
      newData.push(newRowData);
      
      // เพิ่ม empty row หลังจากแถวใหม่
      const emptyRowIndex = newRowIndex + 1;
      const emptyRow = createEmptyDayRow(day, dayIndex, emptyRowIndex, newTotalRows);
      emptyRow.isFirstRowOfDay = false;
      newData.push(emptyRow);
      
      // อัปเดต totalRowsInDay ของแถวอื่นในวันเดียวกัน
      newData.forEach(row => {
        if (row.day === day) {
          row.totalRowsInDay = newTotalRows;
        }
      });
    }
    
    return newData;
  });
};

  // =================== MODIFIED REMOVE SUB CELL FUNCTION ===================
const removeSubCell = (subCellId: string) => {
  if (role !== "Scheduler") {
    message.warning("เฉพาะ Scheduler เท่านั้นที่สามารถลบวิชาได้");
    return;
  }

  let targetSubCell: SubCell | null = null;
  
  for (const dayData of scheduleData) {
    const foundSubCell = (dayData.subCells || []).find(cell => cell.id === subCellId);
    if (foundSubCell) {
      targetSubCell = foundSubCell;
      break;
    }
  }

  if (targetSubCell?.isTimeFixed) {
    message.error(
      `ไม่สามารถลบวิชา "${targetSubCell.classData.subject}" ได้ เพราะเป็น Time Fixed Course`,
      3
    );
    return;
  }

  setScheduleData(prevData => {
    const newData = [...prevData];
    let removedSubCell: SubCell | null = null;
    let wasRemoved = false;
    
    for (const dayData of newData) {
      const cellIndex = (dayData.subCells || []).findIndex(cell => cell.id === subCellId);
      if (cellIndex !== -1) {
        removedSubCell = dayData.subCells![cellIndex];
        dayData.subCells!.splice(cellIndex, 1);
        wasRemoved = true;
        break;
      }
    }
    
    if (removedSubCell && wasRemoved) {
      const uniqueKey = `${removedSubCell.classData.subject}-${removedSubCell.classData.courseCode}-${removedSubCell.classData.section}-${removedSubCell.classData.teacher}-${removedSubCell.day}-${removedSubCell.startTime}-${removedSubCell.endTime}`;
      
      const isDuplicate = removedCourses.some(existing => {
        const existingKey = `${existing.subject}-${existing.courseCode}-${existing.section}-${existing.teacher}-${existing.originalDay}-${existing.originalStartTime}-${existing.originalEndTime}`;
        return existingKey === uniqueKey;
      });

      if (!isDuplicate) {
        const removedCourse: RemovedCourse = {
          id: `removed-${Date.now()}-${Math.random()}`,
          subject: removedSubCell.classData.subject,
          courseCode: removedSubCell.classData.courseCode || "",
          teacher: removedSubCell.classData.teacher,
          room: removedSubCell.classData.room,
          section: removedSubCell.classData.section || "",
          studentYear: removedSubCell.classData.studentYear || "",
          duration: removedSubCell.position.endSlot - removedSubCell.position.startSlot,
          color: removedSubCell.classData.color || getSubjectColor(removedSubCell.classData.subject),
          scheduleId: removedSubCell.scheduleId,
          removedAt: new Date(),
          originalDay: removedSubCell.day,
          originalStartTime: removedSubCell.startTime,
          originalEndTime: removedSubCell.endTime
        };

        setTimeout(() => {
          setRemovedCourses(prev => {
            const stillNotDuplicate = !prev.some(existing => {
              const existingKey = `${existing.subject}-${existing.courseCode}-${existing.section}-${existing.teacher}-${existing.originalDay}-${existing.originalStartTime}-${existing.originalEndTime}`;
              return existingKey === uniqueKey;
            });
            
            if (stillNotDuplicate) {
              return [removedCourse, ...prev];
            } else {
              return prev;
            }
          });
        }, 50);
        
        message.success("ลบวิชาออกจากตารางแล้ว (ย้ายไปยังรายการวิชาที่ลบ)");
      } else {
        message.success("ลบวิชาออกจากตารางแล้ว");
      }
    }
    
    return newData;
  });
};

const moveSubCellToRow = (subCellId: string, targetRow: ExtendedScheduleData, newStartSlot: number) => {
  setScheduleData(prevData => {
    const newData = [...prevData];
    let subCellToMove: SubCell | null = null;
    
    // ค้นหาและลบ sub-cell
    for (const dayData of newData) {
      const cellIndex = (dayData.subCells || []).findIndex(cell => cell.id === subCellId);
      if (cellIndex !== -1) {
        subCellToMove = dayData.subCells![cellIndex];
        dayData.subCells!.splice(cellIndex, 1);
        break;
      }
    }
    
    if (!subCellToMove) return prevData;
    
    // คำนวณตำแหน่งใหม่
    const duration = subCellToMove.position.endSlot - subCellToMove.position.startSlot;
    const newEndSlot = newStartSlot + duration;
    
    // ตรวจสอบขอบเขต
    if (newEndSlot > PURE_TIME_SLOTS.length) {
      message.warning("ไม่สามารถวางที่ตำแหน่งนี้ได้ เนื่องจากเกินเวลาสิ้นสุด");
      return prevData;
    }
    
    // สร้าง sub-cell ที่ถูกย้าย
    const movedSubCell: SubCell = {
      ...subCellToMove,
      day: targetRow.day,
      startTime: slotIndexToTime(newStartSlot),
      endTime: slotIndexToTime(newEndSlot),
      position: {
        startSlot: newStartSlot,
        endSlot: newEndSlot
      }
    };
    
    // เพิ่มลงในแถวเป้าหมาย
    const targetRowIndex = newData.findIndex(r => r.key === targetRow.key);
    if (targetRowIndex !== -1) {
      if (!newData[targetRowIndex].subCells) {
        newData[targetRowIndex].subCells = [];
      }
      newData[targetRowIndex].subCells!.push(movedSubCell);
      
      // เช็คว่าย้ายไปแถวสุดท้ายหรือไม่ และสร้าง empty row ใหม่ถ้าจำเป็น
      const dayRows = newData.filter(row => row.day === targetRow.day);
      const isTargetLastRow = targetRowIndex === Math.max(...dayRows.map(row => newData.findIndex(r => r.key === row.key)));
      const targetRowHasOnlyMovedCell = newData[targetRowIndex].subCells!.length === 1;
      
      if (isTargetLastRow && !targetRowHasOnlyMovedCell) {
        // สร้าง empty row ใหม่
        const dayIndex = DAYS.findIndex(d => d === targetRow.day);
        const newEmptyRowIndex = dayRows.length;
        const newTotalRows = dayRows.length + 1;
        
        const newEmptyRow = createEmptyDayRow(targetRow.day, dayIndex, newEmptyRowIndex, newTotalRows);
        newEmptyRow.isFirstRowOfDay = false;
        
        // อัปเดต totalRowsInDay
        newData.forEach(row => {
          if (row.day === targetRow.day) {
            row.totalRowsInDay = newTotalRows;
          }
        });
        
        newData.push(newEmptyRow);
      }
    }
    
    return newData;
  });
};

  // =================== DRAG & DROP HANDLERS ===================
const handleSubCellDragStart = (e: React.DragEvent, subCell: SubCell) => {
  if (role !== "Scheduler") {
    e.preventDefault();
    message.warning("เฉพาะ Scheduler เท่านั้นที่สามารถย้ายตารางเรียนได้");
    return;
  }

  if (subCell.isTimeFixed) {
    e.preventDefault();
    message.warning(
      `วิชา "${subCell.classData.subject}" เป็น Time Fixed Course ไม่สามารถย้ายได้`,
      3
    );
    return;
  }

  setDraggedSubCell(subCell);
  e.dataTransfer.effectAllowed = "move";
  
  if (e.currentTarget instanceof HTMLElement) {
    e.currentTarget.style.opacity = "0.5";
  }
};

  const handleSubCellDragEnd = (e: React.DragEvent) => {
    setDraggedSubCell(null);
    setDragPreview(null);
    
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "1";
    }
  };

  const handleCellDragLeave = () => {
    setDragPreview(prev => prev ? { ...prev, show: false } : null);
  };

  // =================== RENDER SUB-CELL FUNCTION ===================
const renderSubCell = (subCell: SubCell) => {
  const duration = subCell.position.endSlot - subCell.position.startSlot;
  const shouldSpan = duration > 1;
  const isScheduler = role === "Scheduler";
  const isTimeFixed = subCell.isTimeFixed;

  return (
    <div
      key={subCell.id}
      draggable={isScheduler && !isTimeFixed}
      onDragStart={isScheduler && !isTimeFixed ? (e) => handleSubCellDragStart(e, subCell) : undefined}
      onDragEnd={isScheduler && !isTimeFixed ? handleSubCellDragEnd : undefined}
      style={{
        backgroundColor: subCell.classData.color,
        border: isTimeFixed 
          ? "3px solid #ff4d4f"
          : "2px solid rgba(0,0,0,0.2)",
        borderRadius: "6px",
        padding: "6px 8px",
        cursor: isScheduler && !isTimeFixed ? "grab" : isTimeFixed ? "not-allowed" : "default",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
        transition: "all 0.2s ease",
        fontSize: duration > 2 ? "11px" : shouldSpan ? "10px" : "9px",
        lineHeight: "1.2",
        textAlign: "center",
        color: "#333",
        height: `${CELL_CONFIG.FIXED_HEIGHT}px`,
        position: "absolute",
        width: "calc(100% - 4px)",
        left: "2px",
        top: "0px",
        zIndex: shouldSpan ? 10 : 5,
        fontWeight: shouldSpan ? "bold" : "normal",
        boxShadow: isTimeFixed 
          ? "0 4px 12px rgba(255, 77, 79, 0.4)"
          : shouldSpan 
          ? "0 4px 12px rgba(242, 101, 34, 0.4)" 
          : "0 3px 6px rgba(0,0,0,0.15)",
        opacity: !isScheduler ? 0.8 : isTimeFixed ? 0.95 : 1,
      }}
    >
      <Tooltip
        title={
          <div
            style={{
              fontFamily: "Sarabun, sans-serif",
              minWidth: "300px",
              backgroundColor: "white",
              color: "black",
              padding: "10px",
              borderRadius: "6px",
            }}
          >
            <div style={{ fontWeight: "bold", fontSize: "14px", marginBottom: "6px", color: isTimeFixed ? "#ff4d4f" : "#F26522" }}>
              {isTimeFixed ? "🔒 Time Fixed Course" : "📚 รายละเอียดวิชา"}
            </div>
            <p><b>🏷️ รหัสวิชา:</b> {subCell.classData.courseCode || "ไม่ระบุ"}</p>
            <p><b>📖 ชื่อวิชา:</b> {subCell.classData.subject || "ไม่ระบุ"}</p>
            <p><b>🎓 ชั้นปี:</b> {subCell.classData.studentYear ? `ปีที่ ${subCell.classData.studentYear}` : "ไม่ระบุ"}</p>
            <p><b>📄 หมู่เรียน:</b> {subCell.classData.section || "ไม่ระบุ"}</p>
            <p><b>👩‍🏫 อาจารย์:</b> {subCell.classData.teacher || "ไม่ระบุ"}</p>
            <p><b>🏢 ห้องเรียน:</b> {subCell.classData.room || "ไม่ระบุ"}</p>
            <p><b>📅 วัน:</b> {subCell.day}</p>
            <p><b>🕐 เวลา:</b> {subCell.startTime} - {subCell.endTime}</p>
            {isTimeFixed && (
              <p style={{ color: "#ff4d4f", fontSize: "12px", marginTop: "8px", fontWeight: "bold" }}>
                🔒 วิชานี้ถูกล็อกไว้ ไม่สามารถย้ายหรือลบได้
              </p>
            )}
            {!isScheduler && (
              <p style={{ color: "#ff4d4f", fontSize: "12px", marginTop: "8px" }}>
                ⚠️ ต้องเป็น Scheduler เท่านั้นถึงจะย้ายได้
              </p>
            )}
          </div>
        }
        placement="top"
        overlayStyle={{ maxWidth: "400px", backgroundColor: "white", color: "black" }}
        trigger="hover"
      >
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
          textAlign: "center"
        }}>
          <div style={{
            fontWeight: "bold",
            fontSize: "12px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: "100%",
          }}>
            {subCell.classData.subject}
          </div>
          <div style={{
            fontSize: "7px",
            color: "#050505ff",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: "100%",
          }}>
            {subCell.classData.courseCode}
          </div>
          <div style={{
            fontSize: "10px",
            color: "#666",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: "100%",
          }}>
            {subCell.classData.teacher}
          </div>
          <div style={{
            fontSize: "10px",
            color: "#888",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: "100%",
          }}>
            {subCell.classData.room}
          </div>
        </div>
      </Tooltip>

      {isTimeFixed && (
        <div
          style={{
            position: "absolute",
            top: "4px",
            left: "4px",
            width: duration > 2 ? "22px" : shouldSpan ? "20px" : "18px",
            height: duration > 2 ? "22px" : shouldSpan ? "20px" : "18px",
            backgroundColor: "rgba(255,77,79,0.9)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: duration > 2 ? "12px" : shouldSpan ? "11px" : "10px",
            color: "white",
            fontWeight: "bold",
            border: "2px solid white",
            boxShadow: "0 2px 4px rgba(0,0,0,0.3)"
          }}
          title="Time Fixed Course - ไม่สามารถย้ายได้"
        >
          🔒
        </div>
      )}

      {isScheduler && !isTimeFixed && (
        <div
          style={{
            position: "absolute",
            top: "4px",
            right: "4px",
            width: duration > 2 ? "20px" : shouldSpan ? "18px" : "16px",
            height: duration > 2 ? "20px" : shouldSpan ? "18px" : "16px",
            backgroundColor: "rgba(255,0,0,0.8)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: duration > 2 ? "13px" : shouldSpan ? "12px" : "11px",
            color: "white",
            cursor: "pointer",
            opacity: 0.7,
            fontWeight: "bold"
          }}
          onClick={(e) => {
            e.stopPropagation();
            removeSubCell(subCell.id);
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = "1";
            e.currentTarget.style.backgroundColor = "rgba(255,0,0,1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "0.7";
            e.currentTarget.style.backgroundColor = "rgba(255,0,0,0.8)";
          }}
        >
          ×
        </div>
      )}

      {isTimeFixed && (
        <div
          style={{
            position: "absolute",
            top: "4px",
            right: "4px",
            width: duration > 2 ? "20px" : shouldSpan ? "18px" : "16px",
            height: duration > 2 ? "20px" : shouldSpan ? "18px" : "16px",
            backgroundColor: "rgba(128,128,128,0.6)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: duration > 2 ? "11px" : shouldSpan ? "10px" : "9px",
            color: "white",
            cursor: "not-allowed",
            fontWeight: "bold",
            border: "1px solid rgba(255,255,255,0.5)"
          }}
          title="Time Fixed Course - ไม่สามารถลบได้"
          onClick={(e) => {
            e.stopPropagation();
            message.warning(`ไม่สามารถลบ "${subCell.classData.subject}" ได้ เพราะเป็น Time Fixed Course`);
          }}
        >
          🚫
        </div>
      )}

      <div style={{
        position: "absolute",
        bottom: "4px",
        left: "4px",
        fontSize: duration > 2 ? "10px" : "9px",
        color: isTimeFixed ? "#ff4d4f" : "#F26522",
        fontWeight: "bold",
        backgroundColor: "rgba(255,255,255,0.95)",
        borderRadius: "4px",
        padding: duration > 1 ? "2px 6px" : "1px 4px",
        border: `1px solid rgba(${isTimeFixed ? '255, 77, 79' : '242, 101, 34'}, 0.4)`
      }}>
        {duration}คาบ
      </div>

      {!isScheduler && (
        <div style={{
          position: "absolute",
          top: "4px",
          right: "4px",
          fontSize: "10px",
          color: "#666",
          backgroundColor: "rgba(255,255,255,0.9)",
          borderRadius: "3px",
          padding: "1px 4px",
          border: "1px solid #ddd"
        }}>
          🔒
        </div>
      )}

      <div style={{
        position: "absolute",
        left: "0",
        bottom: "0",
        right: "0",
        height: duration > 2 ? "6px" : shouldSpan ? "5px" : "4px",
        backgroundColor: `rgba(${isTimeFixed ? '255, 77, 79' : '242, 101, 34'}, ${0.3 + (duration * 0.1)})`,
        borderRadius: "0 0 6px 6px"
      }} />
      
      {duration > 1 && (
        <div style={{
          position: "absolute",
          right: "4px",
          bottom: "4px",
          fontSize: "8px",
          color: isTimeFixed ? "#ff4d4f" : "#F26522",
          fontWeight: "bold",
          backgroundColor: "rgba(255,255,255,0.9)",
          borderRadius: "3px",
          padding: "1px 4px",
          border: `1px solid rgba(${isTimeFixed ? '255, 77, 79' : '242, 101, 34'}, 0.3)`
        }}>
          {duration}ช่วง
        </div>
      )}
    </div>
  );
};

  // เพิ่ม helper function สำหรับสร้าง empty row
const createEmptyDayRow = (day: string, dayIndex: number, rowIndex: number, totalRowsInDay: number): ExtendedScheduleData => {
  const emptyRowData: ExtendedScheduleData = {
    key: `day-${dayIndex}-row-${rowIndex}`,
    day: day,
    dayIndex: dayIndex,
    rowIndex: rowIndex,
    isFirstRowOfDay: rowIndex === 0,
    totalRowsInDay: totalRowsInDay,
    subCells: []
  };
  
  // เพิ่ม time slots
  TIME_SLOTS.forEach((time) => {
    if (time === "12:00-13:00") {
      emptyRowData[time] = {
        content: "พักเที่ยง",
        backgroundColor: "#FFF5E5",
        isBreak: true,
      };
    } else {
      emptyRowData[time] = {
        content: "",
        backgroundColor: "#f9f9f9",
        classes: [],
      };
    }
  });
  
  return emptyRowData;
};

// ปรับปรุงการเรียกใช้ใน transformScheduleDataWithRowSeparation (ลบการ merge)
const transformScheduleDataWithRowSeparation = (rawSchedules: ScheduleInterface[]): ExtendedScheduleData[] => {
  const result: ExtendedScheduleData[] = [];
  
  DAYS.forEach((day, dayIndex) => {
    const daySchedules = rawSchedules.filter(item => item.DayOfWeek === day);
    
    if (daySchedules.length === 0) {
      const firstRow = createEmptyDayRow(day, dayIndex, 0, 2);
      const secondRow = createEmptyDayRow(day, dayIndex, 1, 2);
      secondRow.isFirstRowOfDay = false;
      result.push(firstRow, secondRow);
    } else {
      const subCells: SubCell[] = daySchedules.map((item: ScheduleInterface, index: number) => {
        // ตรวจสอบว่าเป็น TimeFixedCourse หรือไม่
        const isTimeFixed = item.TimeFixedCourses && 
                           item.TimeFixedCourses.length > 0 && 
                           item.TimeFixedCourses.some(tc => 
                             tc.Section === item.SectionNumber && 
                             tc.ScheduleID === item.ID &&
                             tc.RoomFix && tc.RoomFix.trim() !== ""
                           );

        // หา TimeFixed ID ถ้ามี
        const timeFixedCourse = isTimeFixed ? 
          item.TimeFixedCourses?.find(tc => 
            tc.Section === item.SectionNumber && 
            tc.ScheduleID === item.ID &&
            tc.RoomFix && tc.RoomFix.trim() !== ""
          ) : undefined;

        const getRoomInfo = (schedule: ScheduleInterface): string => {
          if (schedule.TimeFixedCourses && schedule.TimeFixedCourses.length > 0) {
            const matchingFixedCourse = schedule.TimeFixedCourses.find(
              tc => tc.Section === schedule.SectionNumber && 
                   tc.ScheduleID === schedule.ID &&
                   tc.RoomFix && tc.RoomFix.trim() !== ""
            );
            if (matchingFixedCourse?.RoomFix) {
              return matchingFixedCourse.RoomFix;
            }
          }
          return "TBA";
        };

        const getStudentYear = (schedule: ScheduleInterface): string => {
          const academicYear = (schedule.OfferedCourses?.AllCourses as any)?.AcademicYear;
          
          if (academicYear?.Level && academicYear.Level !== 'เรียนได้ทุกชั้นปี') {
            if (/^\d+$/.test(academicYear.Level)) {
              return academicYear.Level;
            }
            
            const yearMatch = academicYear.Level.match(/ปีที่\s*(\d+)/);
            if (yearMatch) {
              return yearMatch[1];
            }
          }
          
          const academicYearId = academicYear?.AcademicYearID;
          if (academicYearId) {
            switch (academicYearId) {
              case 2: return "1";
              case 3: return "2";
              case 4: return "3";
              case 1:
                break;
              default:
                if (academicYearId >= 5 && academicYearId <= 10) {
                  return (academicYearId - 1).toString();
                }
                break;
            }
          }
          
          if (schedule.OfferedCourses?.AllCourses?.Code) {
            const code = schedule.OfferedCourses.AllCourses.Code;
            
            const codeYearMatch1 = code.match(/[A-Z]{2,4}\d+\s+(\d)/);
            if (codeYearMatch1) {
              return codeYearMatch1[1];
            }
            
            const codeYearMatch2 = code.match(/[A-Z]{2,4}(\d)/);
            if (codeYearMatch2) {
              return codeYearMatch2[1];
            }
          }
          
          return "1";
        };

        const classInfo: ClassInfo = {
          subject: item.OfferedCourses?.AllCourses?.ThaiName ||
                   item.OfferedCourses?.AllCourses?.EnglishName ||
                   item.OfferedCourses?.AllCourses?.Code ||
                   "ไม่ทราบชื่อ",
          teacher: item.OfferedCourses?.User ? 
                   `${item.OfferedCourses.User.Firstname || ""} ${item.OfferedCourses.User.Lastname || ""}`.trim() ||
                   "ไม่ระบุอาจารย์" :
                   "ไม่ระบุอาจารย์",
          room: getRoomInfo(item),
          section: item.SectionNumber?.toString() || "",
          courseCode: item.OfferedCourses?.AllCourses?.Code || "",
          studentYear: getStudentYear(item),
          offeredCoursesId: item.OfferedCoursesID ?? item.OfferedCourses?.ID ?? null,
        };

        const getTimeString = (time: string | Date): string => {
          if (typeof time === 'string') {
            if (time.includes('T')) {
              return time.substring(11, 16);
            }
            return time.length > 5 ? time.substring(0, 5) : time;
          } else if (time instanceof Date) {
            return time.toTimeString().substring(0, 5);
          }
          return "00:00";
        };

        const startTime = getTimeString(item.StartTime);
        const endTime = getTimeString(item.EndTime);
        
        return createSubCell(
          classInfo, 
          day, 
          startTime, 
          endTime, 
          item.ID,
          isTimeFixed,
          timeFixedCourse?.ID
        );
      });

      const rowGroups = separateOverlappingSubCells(subCells);
      const totalRowsForThisDay = rowGroups.length + 1;
      
      rowGroups.forEach((rowSubCells, rowIndex) => {
        const dayData: ExtendedScheduleData = {
          key: `day-${dayIndex}-row-${rowIndex}`,
          day: day,
          dayIndex: dayIndex,
          rowIndex: rowIndex,
          isFirstRowOfDay: rowIndex === 0,
          totalRowsInDay: totalRowsForThisDay,
          subCells: rowSubCells
        };

        TIME_SLOTS.forEach((time) => {
          const matched = rowSubCells.filter(subCell => 
            isTimeInSlot(subCell.startTime, subCell.endTime, time)
          );

          if (matched.length > 0) {
            dayData[time] = {
              backgroundColor: getSubjectColor(matched[0].classData.subject, matched[0].classData.courseCode),
              classes: matched.map(subCell => ({
                subject: subCell.classData.subject,
                teacher: subCell.classData.teacher,
                room: subCell.classData.room,
              })),
            };
          } else if (time === "12:00-13:00") {
            dayData[time] = {
              content: "พักเที่ยง",
              backgroundColor: "#FFF5E5",
              isBreak: true,
            };
          } else {
            dayData[time] = {
              content: "",
              backgroundColor: "#f9f9f9",
              classes: [],
            };
          }
        });

        result.push(dayData);
      });

      const emptyRowIndex = rowGroups.length;
      const emptyRow = createEmptyDayRow(day, dayIndex, emptyRowIndex, totalRowsForThisDay);
      emptyRow.isFirstRowOfDay = false;
      result.push(emptyRow);
    }
  });
  return result;
};

  const separateOverlappingSubCells = (subCells: SubCell[]): SubCell[][] => {
    if (subCells.length === 0) return [[]];
    
    const rows: SubCell[][] = [];
    const sortedSubCells = [...subCells].sort((a, b) => a.position.startSlot - b.position.startSlot);
    
    for (const subCell of sortedSubCells) {
      let placed = false;
      
      // ลองใส่ในแถวที่มีอยู่
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const hasOverlap = row.some(existingSubCell => 
          doSubCellsOverlap(subCell, existingSubCell)
        );
        
        if (!hasOverlap) {
          row.push(subCell);
          placed = true;
          break;
        }
      }
      
      // ถ้าใส่ในแถวที่มีไม่ได้ ให้สร้างแถวใหม่
      if (!placed) {
        rows.push([subCell]);
      }
    }

    return rows;
  };

  // =================== FUNCTION TO CHECK SUB-CELL OVERLAP ===================
  // แก้ไขฟังก์ชัน doSubCellsOverlap - จัดการ duplicate อย่างระเอียด
const doSubCellsOverlap = (subCell1: SubCell, subCell2: SubCell): boolean => {
  // ถ้าเป็น SubCell เดียวกัน (ID เดียวกัน) ให้ return false
  if (subCell1.id === subCell2.id) {
    return false;
  }

  // ตรวจสอบ TimeFixedCourse ที่เหมือนกันทุกประการ - ให้ถือว่าเป็น duplicate
  const isExactDuplicate = 
    subCell1.classData.subject === subCell2.classData.subject &&
    subCell1.classData.courseCode === subCell2.classData.courseCode &&
    subCell1.classData.section === subCell2.classData.section &&
    subCell1.classData.studentYear === subCell2.classData.studentYear &&
    subCell1.classData.teacher === subCell2.classData.teacher &&
    subCell1.classData.room === subCell2.classData.room &&
    subCell1.startTime === subCell2.startTime &&
    subCell1.endTime === subCell2.endTime &&
    subCell1.day === subCell2.day;

  if (isExactDuplicate) {
    return false; // ถือว่าไม่ซ้อนทับ เพื่อป้องกัน infinite loop
  }

  // ตรวจสอบการทับซ้อนของเวลาปกติ
  const start1 = subCell1.position.startSlot;
  const end1 = subCell1.position.endSlot;
  const start2 = subCell2.position.startSlot;
  const end2 = subCell2.position.endSlot;
  
  const overlap = !(end1 <= start2 || end2 <= start1);
  
  return overlap;
};

  // =================== API FUNCTIONS ===================
  // แก้ไขฟังก์ชัน getSchedules ให้เรียก API ด้วย parameters ที่ถูกต้อง
  const getSchedules = async () => {
    if (!major_name || !academicYear || !term) {
      console.warn('Missing required parameters for getSchedules:', { major_name, academicYear, term });
      return;
    }

    try {
      const res = await getSchedulesBynameTable(major_name, academicYear, term);
      if (res && Array.isArray(res.data)) {
        console.log('📊 Raw schedule data from API:', res.data);
        
        // Type cast เพื่อใช้ interface ที่ถูกต้อง
        const typedSchedules = res.data as ScheduleInterface[];
        
        const newScheduleData = transformScheduleDataWithRowSeparation(typedSchedules);
        setScheduleData(newScheduleData);
        
        // เก็บข้อมูลต้นฉบับและเซ็ต state
        setOriginalScheduleData(res.data);
        const nameTable = `ปีการศึกษา ${academicYear} เทอม ${term}`;
        setCurrentTableName(nameTable);
        setIsTableFromAPI(true);
        
        // Generate course cards from API data
        generateCourseCardsFromAPI(typedSchedules);
     
      }
    } catch (error) {
      console.error("Error loading schedules:", error);
      message.error("เกิดข้อผิดพลาดในการโหลดตาราง");
    }
  };

  const getAllNameTable = async () => {
    try {
      const res = await getNameTable();
      if (res && Array.isArray(res.data.name_tables)) {
        setAllNameTable(res.data.name_tables);
      }
    } catch (error) {
      console.error("Error loading name tables:", error);
      message.error("เกิดข้อผิดพลาดในการโหลดรายชื่อตาราง");
    }
  };

  const generateAutoSchedule = async () => {
    if (!academicYear || !term || !major_name) {
      message.warning("กรุณาระบุปีการศึกษา, เทอม และสาขา");
      return;
    }

    try {
      const res = await postAutoGenerateSchedule(Number(academicYear), Number(term), major_name);

      if (res.status === 200 && res.data) {
        // หลังจากสร้างตารางอัตโนมัติแล้ว ให้โหลดตารางใหม่
        await getSchedules();
        message.success("สร้างตารางอัตโนมัติสำเร็จ และโหลดตารางแล้ว");
      } else {
        message.error("ไม่สามารถสร้างตารางได้");
      }
    } catch (error) {
      console.error(error);
      message.error("เกิดข้อผิดพลาดในการสร้างตาราง");
    }
  };

  // =================== FIND SCHEDULE CHANGES ===================
  const findScheduleChanges = (): ScheduleChange[] => {
    const changes: ScheduleChange[] = [];

    // สร้าง Map ของข้อมูลปัจจุบันจาก subCells
    const currentMap = new Map<number, {
      day: string;
      startTime: string;
      endTime: string;
      subject: string;
      teacher: string;
      room: string;
    }>();
    
    scheduleData.forEach(dayData => {
      if (dayData.subCells && dayData.subCells.length > 0) {
        dayData.subCells.forEach(subCell => {
          if (subCell.scheduleId) {
            currentMap.set(subCell.scheduleId, {
              day: subCell.day,
              startTime: subCell.startTime,
              endTime: subCell.endTime,
              subject: subCell.classData.subject,
              teacher: subCell.classData.teacher,
              room: subCell.classData.room
            });
          }
        });
      }
    });

    // เปรียบเทียบกับข้อมูลต้นฉบับ
    originalScheduleData.forEach(original => {
      const getTimeString = (time: string | Date): string => {
        if (typeof time === 'string') {
          return time.substring(11, 16);
        } else if (time instanceof Date) {
          return time.toTimeString().substring(0, 5);
        }
        return "00:00";
      };

      const current = currentMap.get(original.ID);
      
      if (current) {
        const originalStartTime = getTimeString(original.StartTime);
        const originalEndTime = getTimeString(original.EndTime);
        
        // ตรวจสอบการเปลี่ยนแปลง
        if (current.day !== original.DayOfWeek ||
            current.startTime !== originalStartTime ||
            current.endTime !== originalEndTime) {
          
          const scheduleChange: ScheduleChange = {
            id: original.ID,
            originalData: {
              dayOfWeek: original.DayOfWeek,
              startTime: originalStartTime,
              endTime: originalEndTime
            },
            newData: {
              dayOfWeek: current.day,
              startTime: current.startTime,
              endTime: current.endTime
            }
          };
          
          changes.push(scheduleChange);
        }
      }
    });

    return changes;
  };

  // =================== MODAL HANDLERS ===================
  // แก้ไขฟังก์ชัน handleLoadSchedule ให้ใช้ parameters ที่ถูกต้อง
  const handleLoadSchedule = async (scheduleName: string) => {
    // แยกปีและเทอมจาก scheduleName
    // Format: "ปีการศึกษา 2567 เทอม 1"
    const yearMatch = scheduleName.match(/ปีการศึกษา\s+(\d+)/);
    const termMatch = scheduleName.match(/เทอม\s+(\d+)/);
    
    if (!yearMatch || !termMatch) {
      message.error("รูปแบบชื่อตารางไม่ถูกต้อง");
      return;
    }

    const year = yearMatch[1];
    const term = termMatch[1];

    if (!major_name) {
      message.error("ไม่พบข้อมูลสาขา กรุณาตรวจสอบการตั้งค่า");
      return;
    }

    try {
      const res = await getSchedulesBynameTable(major_name, year, term);
      if (res.status === 200 && res.data) {
        console.log('📊 Loaded schedule data:', res.data);
        
        // Type cast เพื่อใช้ interface ที่ถูกต้อง
        const typedSchedules = res.data as ScheduleInterface[];
        
        const newScheduleData = transformScheduleDataWithRowSeparation(typedSchedules);
        setScheduleData(newScheduleData);
        
        // เก็บข้อมูลต้นฉบับและเซ็ต state
        setOriginalScheduleData(res.data);
        setCurrentTableName(scheduleName);
        setIsTableFromAPI(true);
        
        // Generate course cards from loaded data
        generateCourseCardsFromAPI(typedSchedules);
        
        // Clear removed courses when loading new schedule
        setRemovedCourses([]);
        setRemovedSearchValue("");
        
        message.success("โหลดตารางเรียบร้อย");
        setLoadModalVisible(false);
      } else {
        message.error("โหลดข้อมูลตารางไม่สำเร็จ");
      }
    } catch (error) {
      console.error(error);
      message.error("เกิดข้อผิดพลาดในการโหลดตาราง");
    }
  };

  const handleDeleteSchedule = async (scheduleName: string) => {
    const confirmed = window.confirm(`คุณต้องการลบตาราง "${scheduleName}" หรือไม่?`);
    if (!confirmed) return;

    setDeletingName(scheduleName);
    try {
      const apiRes = await deleteSchedulebyNametable(scheduleName);
      if (apiRes?.status === 200 || apiRes?.status === 204) {
        setScheduleData([]);
        setCurrentTableName("");
        setIsTableFromAPI(false);
        setOriginalScheduleData([]);
        setCourseCards([]); // Clear course cards
        setRemovedCourses([]); // Clear removed courses
        await getAllNameTable();
        message.success(`ลบตาราง "${scheduleName}" สำเร็จ`);
        setLoadModalVisible(false);
      } else {
        message.error("ไม่สามารถลบตารางบนเซิร์ฟเวอร์ได้");
      }
    } catch (error) {
      console.error("Error deleting schedule:", error);
      message.error("เกิดข้อผิดพลาดในการลบตาราง");
    } finally {
      setDeletingName(null);
    }
  };

  // =================== NEW SAVE FUNCTION USING API ===================
  const handleSaveConfirm = async () => {

    if (!scheduleNameToSave.trim()) {
      message.error("กรุณาใส่ชื่อตาราง");
      return;
    }

    if (scheduleData.length === 0) {
      message.error("ไม่มีข้อมูลตารางให้บันทึก");
      return;
    }

    // ตรวจสอบว่าต้องเป็นตารางจาก API เท่านั้น
    if (!isTableFromAPI || !currentTableName) {
      message.warning("สามารถบันทึกได้เฉพาะตารางที่มาจาก 'สร้างอัตโนมัติ' หรือ 'โหลด' เท่านั้น");
      return;
    }

    // ตรวจสอบว่าชื่อตรงกับตารางปัจจุบันหรือไม่
    if (scheduleNameToSave !== currentTableName) {
      message.error(`กรุณาใช้ชื่อตาราง "${currentTableName}" ไม่สามารถเปลี่ยนชื่อได้`);
      return;
    }

    try {
      await updateExistingSchedule();
    } catch (error) {
      console.error('Save error:', error);
      message.error(`เกิดข้อผิดพลาด: ${error.message}`);
    }
  };

  // =================== UPDATE EXISTING SCHEDULE ===================
  const updateExistingSchedule = async () => {
    const hide = message.loading("กำลังอัปเดตตาราง...", 0);
    
    try {
      // หาการเปลี่ยนแปลง
      const changes = findScheduleChanges();

      if (changes.length === 0) {
        hide();
        message.info("ไม่มีการเปลี่ยนแปลงในตาราง");
        setSaveModalVisible(false);
        setScheduleNameToSave("");
        return;
      }

      // สร้าง payload เป็น array ตาม Backend API format (PascalCase)
      const payloadArray: ScheduleBatchUpdate[] = changes.map(change => ({
        ID: change.id,
        DayOfWeek: change.newData.dayOfWeek,
        StartTime: `2006-01-02T${change.newData.startTime}:00+07:00`,
        EndTime: `2006-01-02T${change.newData.endTime}:00+07:00`
      }));

      try {
        const apiUrl = "http://localhost:8080";
        const Authorization = localStorage.getItem("token");
        const Bearer = localStorage.getItem("token_type");

        const response = await fetch(`${apiUrl}/update-schedules-batch`, {
          method: 'PUT',
          headers: {
            "Content-Type": "application/json",
            Authorization: `${Bearer} ${Authorization}`,
          },
          body: JSON.stringify(payloadArray)
        });

        const result = await response.json();
        
        hide();

        if (response.ok) {
          message.success(`อัปเดตตารางสำเร็จ ${changes.length} รายการ`);
          
          setSaveModalVisible(false);
          setScheduleNameToSave("");
          
          // แสดงข้อความแนะนำ
          message.info("หากต้องการดูข้อมูลล่าสุดจาก API กรุณาใช้ '🔄 รีเฟรช'", 3);
        } else {
          throw new Error(`ไม่สามารถอัปเดตตารางได้: ${result.error || 'Unknown error'}`);
        }
      } catch (fetchError) {
        hide();
        console.error('💥 Error with direct API call:', fetchError);
    
        await updateSchedulesIndividually(changes);
        
        hide();
        message.success(`อัปเดตตารางสำเร็จ ${changes.length} รายการ (ทีละรายการ)`);
        setSaveModalVisible(false);
        setScheduleNameToSave("");
        message.info("หากต้องการดูข้อมูลล่าสุดจาก API กรุณาใช้ '🔄 รีเฟรช'", 3);
      }

    } catch (error) {
      hide();
      console.error('💥 Error updating schedules:', error);
      throw error;
    }
  };

  // ฟังก์ชัน fallback สำหรับอัปเดตทีละรายการ
  const updateSchedulesIndividually = async (changes: ScheduleChange[]) => {
    let successCount = 0;
    let errorCount = 0;

    for (const change of changes) {
      try {
        // สร้าง payload แบบ object เดียวตาม ScheduleIn interface (PascalCase + วันที่ถูกต้อง)
        const payload = {
          DayOfWeek: change.newData.dayOfWeek,
          StartTime: `2006-01-02T${change.newData.startTime}:00+07:00`,
          EndTime: `2006-01-02T${change.newData.endTime}:00+07:00`
        };

        const result = await putupdateScheduleTime(change.id, payload);
        
        if (result.status === 200) {
          successCount++;
        } else {
          errorCount++;
          console.error(`❌ Failed to update schedule ID: ${change.id}`, result);
        }
      } catch (error) {
        errorCount++;
        console.error(`💥 Error updating schedule ID: ${change.id}`, error);
      }
    }
  };

  // =================== RESET FUNCTION ===================
  const handleReset = () => {
    setScheduleData([]);
    setCurrentTableName("");
    setIsTableFromAPI(false);
    setOriginalScheduleData([]);
    setCourseCards([]);
    setFilteredCourseCards([]);
    setRemovedCourses([]);
    setFilteredRemovedCourses([]);
    setRemovedSearchValue("");
    clearAllFilters();
    clearAllSidebarFilters(); // Clear sidebar filters too
    
    // รีเซ็ต color mapping
    subjectColorMap.clear();
    colorIndex = 0;
    
    message.success("รีเซตตารางสำเร็จ");
  };

  // =================== RENDER TABLE STATUS ===================
  const renderTableStatus = () => {
    if (!isTableFromAPI || !currentTableName) {
      return (
        <div style={{ 
          padding: "8px 12px", 
          backgroundColor: "#f6f6f6", 
          borderRadius: "4px", 
          fontSize: "12px", 
          color: "#666",
          marginBottom: "10px"
        }}>
          💡 ตารางใหม่ - กรุณาใช้ 'สร้างอัตโนมัติ' หรือ 'โหลด' เพื่อเริ่มแก้ไขตาราง
        </div>
      );
    }

    return (
      <div style={{ 
        padding: "8px 12px", 
        backgroundColor: "#e6f7ff", 
        borderRadius: "4px", 
        fontSize: "12px", 
        color: "#1890ff",
        marginBottom: "10px",
        border: "1px solid #91d5ff"
      }}>
        🔗 กำลังแก้ไขตาราง: <strong>{currentTableName}</strong>
        <span style={{ color: "#666", marginLeft: "10px" }}>
          (การบันทึกจะอัปเดตข้อมูลใน API)
        </span>
      </div>
    );
  };

  // =================== RENDER FILTER SECTION ===================
  const renderFilterSection = () => {
    return (
      <div style={{ 
        backgroundColor: "#fafafa", 
        padding: "16px", 
        borderRadius: "8px", 
        border: "1px solid #d9d9d9",
        marginBottom: "16px" 
      }}>
        {/* Filter Header */}
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          marginBottom: "12px" 
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <FilterOutlined style={{ color: "#1890ff" }} />
            <span style={{ fontWeight: "bold", color: "#333" }}>
              กรองข้อมูล ({filteredScheduleData.length} แถว)
            </span>
            {filterTags.length > 0 && (
              <Tag color="blue">{filterTags.length} ตัวกรอง</Tag>
            )}
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <Button
              size="small"
              icon={<SearchOutlined />}
              type={filterVisible ? "primary" : "default"}
              onClick={() => setFilterVisible(!filterVisible)}
            >
              {filterVisible ? "ซ่อนการกรอง" : "แสดงการกรอง"}
            </Button>
            {(filterTags.length > 0 || searchValue) && (
              <Button
                size="small"
                icon={<ClearOutlined />}
                onClick={clearAllFilters}
                danger
              >
                ล้างทั้งหมด
              </Button>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ marginBottom: "12px" }}>
          <Input
            placeholder="ค้นหาอาจารย์..."
            prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            allowClear
            style={{ width: "100%" }}
          />
        </div>

        {/* Filter Tags Display */}
        {filterTags.length > 0 && (
          <div style={{ marginBottom: "12px" }}>
            <div style={{ fontSize: "12px", color: "#666", marginBottom: "6px" }}>
              ตัวกรองที่เลือก:
            </div>
            <Space wrap>
              {filterTags.map(tag => (
                <Tag
                  key={tag.id}
                  color={tag.color}
                  closable
                  onClose={() => removeFilterTag(tag.id)}
                  style={{ marginBottom: "4px" }}
                >
                  {tag.label}
                </Tag>
              ))}
            </Space>
          </div>
        )}

        {/* Filter Controls */}
        {filterVisible && (
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "1fr 1fr 1fr", 
            gap: "16px",
            borderTop: "1px solid #e8e8e8",
            paddingTop: "12px"
          }}>
            {/* Teacher Filter */}
            <div>
              <label style={{ fontSize: "12px", color: "#666", marginBottom: "4px", display: "block" }}>
                🧑‍🏫 อาจารย์:
              </label>
              <AutoComplete
                placeholder="เลือกอาจารย์"
                options={filterOptions.teachers.map(teacher => ({ value: teacher }))}
                onSelect={(value) => addFilterTag('teacher', value)}
                style={{ width: "100%" }}
                size="small"
                filterOption={(inputValue, option) =>
                  option?.value.toLowerCase().includes(inputValue.toLowerCase()) ?? false
                }
              />
            </div>

            {/* Student Year Filter */}
            <div>
              <label style={{ fontSize: "12px", color: "#666", marginBottom: "4px", display: "block" }}>
                🎓 ชั้นปี:
              </label>
              <Select
                placeholder="เลือกชั้นปี"
                onSelect={(value) => addFilterTag('studentYear', value)}
                style={{ width: "100%" }}
                size="small"
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={filterOptions.studentYears.map(year => ({ 
                  label: `ปีที่ ${year}`, 
                  value: year 
                }))}
              />
            </div>

            {/* Subject Filter */}
            <div>
              <label style={{ fontSize: "12px", color: "#666", marginBottom: "4px", display: "block" }}>
                📚 วิชา:
              </label>
              <AutoComplete
                placeholder="เลือกวิชา"
                options={filterOptions.subjects.map(subject => ({ value: subject }))}
                onSelect={(value) => addFilterTag('subject', value)}
                style={{ width: "100%" }}
                size="small"
                filterOption={(inputValue, option) =>
                  option?.value.toLowerCase().includes(inputValue.toLowerCase()) ?? false
                }
              />
            </div>

            {/* Course Code Filter */}
            <div>
              <label style={{ fontSize: "12px", color: "#666", marginBottom: "4px", display: "block" }}>
                🏷️ รหัสวิชา:
              </label>
              <AutoComplete
                placeholder="เลือกรหัสวิชา"
                options={filterOptions.courseCodes.map(code => ({ value: code }))}
                onSelect={(value) => addFilterTag('courseCode', value)}
                style={{ width: "100%" }}
                size="small"
                filterOption={(inputValue, option) =>
                  option?.value.toLowerCase().includes(inputValue.toLowerCase()) ?? false
                }
              />
            </div>

            {/* Room Filter */}
            <div>
              <label style={{ fontSize: "12px", color: "#666", marginBottom: "4px", display: "block" }}>
                🏢 ห้อง:
              </label>
              <AutoComplete
                placeholder="เลือกห้อง"
                options={filterOptions.rooms.map(room => ({ value: room }))}
                onSelect={(value) => addFilterTag('room', value)}
                style={{ width: "100%" }}
                size="small"
                filterOption={(inputValue, option) =>
                  option?.value.toLowerCase().includes(inputValue.toLowerCase()) ?? false
                }
              />
            </div>

            {/* Empty cell to balance the grid */}
            <div></div>
          </div>
        )}
      </div>
    );
  };

  const exportPDF = async () => {
   const node = tableRef.current;
  if (!node) return;

  const originalHeight = node.style.height;
  const originalOverflow = node.style.overflow;

  node.style.height = `${node.scrollHeight}px`;
  node.style.overflow = "visible";

  try {
    const dataUrl = await toPng(node, { cacheBust: true });
    const pdf = new jsPDF("p", "mm", "a4");

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
      const imgWidth = img.width;
      const imgHeight = img.height;

      // สเกลภาพให้พอดีกับหน้ากระดาษ
      const ratio = Math.min(pageWidth / imgWidth, pageHeight / imgHeight);
      const finalWidth = imgWidth * ratio;
      const finalHeight = imgHeight * ratio;

      // 🎯 คำนวณ offset ให้อยู่ตรงกลาง
      const offsetX = (pageWidth - finalWidth) / 2;
      const offsetY = (pageHeight - finalHeight) / 2;

      pdf.addImage(dataUrl, "PNG", offsetX, offsetY, finalWidth, finalHeight);
      pdf.save("schedule.pdf");
    };
  } catch (error) {
    console.error("Export failed:", error);
  } finally {
    node.style.height = originalHeight;
    node.style.overflow = originalOverflow;
  }
};


// ฟังก์ชัน Export Excel แบบใหม่ - แก้ปัญหาคอลัมน์และวัน

const exportScheduleToXLSX = async () => {
  if (scheduleData.length === 0) {
    message.warning("ไม่มีข้อมูลให้ส่งออก กรุณาสร้างตารางก่อน");
    return;
  }

  try {
    const hide = message.loading("กำลังสร้าง Excel...", 0);

    // รวบรวมข้อมูลวิชาทั้งหมด
    interface SubjectInfo {
    subject: string;
    courseCode: string;
    teacher: string;
    section: string;
    studentYear: string;
    room: string;
    capacity: number; // 🎯 เพิ่มบรรทัดนี้
    schedule: Map<string, Array<{startTime: string; endTime: string; room: string}>>;
  }
    
    const allSubjects = new Map<string, SubjectInfo>();

    scheduleData.forEach(dayData => {
  if (dayData.subCells && dayData.subCells.length > 0) {
    dayData.subCells.forEach(subCell => {
      const key = `${subCell.classData.courseCode || 'NO_CODE'}-${subCell.classData.section || '1'}`;
      if (!allSubjects.has(key)) {
        // 🎯 หา capacity จากข้อมูล API โดยใช้ scheduleId
        let capacity = 30; // default value
        if (subCell.scheduleId && originalScheduleData) {
          const originalSchedule = originalScheduleData.find(
            (schedule: any) => schedule.ID === subCell.scheduleId
          );
          if (originalSchedule?.OfferedCourses?.Capacity) {
            capacity = originalSchedule.OfferedCourses.Capacity;
          }
        }

        allSubjects.set(key, {
          subject: subCell.classData.subject || "ไม่ระบุชื่อวิชา",
          courseCode: subCell.classData.courseCode || "ไม่ระบุ",
          teacher: subCell.classData.teacher || "ไม่ระบุ",
          section: subCell.classData.section || "ไม่ระบุ",
          studentYear: subCell.classData.studentYear || "1",
          room: subCell.classData.room || "ไม่ระบุ",
          capacity: capacity, // 🎯 ใช้ capacity จาก API
          schedule: new Map<string, Array<{startTime: string; endTime: string; room: string}>>()
        });
      }
          
          // เพิ่มข้อมูลตารางเรียน
          const subjectData = allSubjects.get(key);
          if (subjectData && !subjectData.schedule.has(subCell.day)) {
            subjectData.schedule.set(subCell.day, []);
          }
          if (subjectData) {
            const daySchedule = subjectData.schedule.get(subCell.day);
            if (daySchedule) {
              daySchedule.push({
                startTime: subCell.startTime,
                endTime: subCell.endTime,
                room: subCell.classData.room || "ไม่ระบุ"
              });
            }
          }
        });
      }
    });

    // กำหนดช่วงเวลา 8-20 (13 ชั่วโมง)
    const timeSlots = Array.from({length: 13}, (_, i) => i + 8); // [8, 9, 10, ..., 20]

    // สร้าง workbook และ worksheet ก่อน (สร้างแบบ manual)
    const wb = XLSX.utils.book_new();
    const ws = {};

    // กำหนดจำนวนคอลัมน์ทั้งหมด
    const totalColumns = 4 + (DAYS.length * timeSlots.length); // 4 คอลัมน์ข้อมูล + วันและเวลา

    // สร้าง Header Row 1 - ทีละเซลล์
    // คอลัมน์ข้อมูลพื้นฐาน
    ws['A1'] = { v: 'วิชา', t: 's' };
    ws['B1'] = { v: 'จำนวนกลุ่ม', t: 's' };
    ws['C1'] = { v: 'กลุ่มละกี่คน', t: 's' };
    ws['D1'] = { v: 'อาจารย์ที่สอน', t: 's' };

    // วันต่างๆ - วางที่ตำแหน่งเริ่มต้นของแต่ละวัน
    let currentCol = 4; // เริ่มจากคอลัมน์ E (index 4)
    DAYS.forEach((day, dayIndex) => {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: currentCol });
      ws[cellRef] = { v: day, t: 's' };
      currentCol += timeSlots.length;
    });

    // สร้าง Header Row 2
    ws['A2'] = { v: 'รหัส/ชื่อวิชา', t: 's' };
    ws['B2'] = { v: 'Groups', t: 's' };
    ws['C2'] = { v: 'Students/Group', t: 's' };
    ws['D2'] = { v: 'Instructor', t: 's' };

    // เวลาต่างๆ - แสดงเป็นช่วงเวลา
    currentCol = 4;
    DAYS.forEach(day => {
      timeSlots.forEach((hour, index) => {
        const cellRef = XLSX.utils.encode_cell({ r: 1, c: currentCol });
        const timeRange = `${hour}-${hour + 1}`; // เช่น 8-9, 9-10, 10-11
        ws[cellRef] = { v: timeRange, t: 's' };
        currentCol++;
      });
    });

    // สร้างข้อมูลแต่ละวิชา
    let rowIndex = 2; // เริ่มจากแถวที่ 3 (index 2)
    Array.from(allSubjects.entries()).forEach(([key, subjectInfo]) => {
      // คอลัมน์ A: รหัสและชื่อวิชา
      const subjectDetails = `รหัส: ${subjectInfo.courseCode}\n${subjectInfo.subject}`;
      ws[XLSX.utils.encode_cell({ r: rowIndex, c: 0 })] = { v: subjectDetails, t: 's' };
      
      // คอลัมน์ B: จำนวนกลุ่ม
      ws[XLSX.utils.encode_cell({ r: rowIndex, c: 1 })] = { v: subjectInfo.section, t: 'n' };
      
      // คอลัมน์ C: กลุ่มละกี่คน
      ws[XLSX.utils.encode_cell({ r: rowIndex, c: 2 })] = { v: subjectInfo.capacity, t: 's' };
      
      // คอลัมน์ D: อาจารย์ที่สอน
      ws[XLSX.utils.encode_cell({ r: rowIndex, c: 3 })] = { v: subjectInfo.teacher, t: 's' };

      // คอลัมน์เวลาแต่ละวัน
      currentCol = 4;
      DAYS.forEach(day => {
        const daySchedule = subjectInfo.schedule.get(day);
        
        timeSlots.forEach(hour => {
          let cellValue = '';
          
          if (daySchedule && daySchedule.length > 0) {
            daySchedule.forEach(schedule => {
              const startHour = parseInt(schedule.startTime.split(':')[0]);
              const endHour = parseInt(schedule.endTime.split(':')[0]);
              
              if (hour >= startHour && hour < endHour) {
                cellValue = `SEC:${subjectInfo.section}`;
              }
            });
          }
          
          const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: currentCol });
          ws[cellRef] = { v: cellValue, t: 's' };
          currentCol++;
        });
      });

      rowIndex++;
    });

    // กำหนด range ของ worksheet
    const lastCol = XLSX.utils.encode_col(totalColumns - 1);
    const lastRow = rowIndex - 1;
    ws['!ref'] = `A1:${lastCol}${lastRow + 1}`;

    // ตั้งค่าความกว้างของคอลัมน์
    ws['!cols'] = [
      { wch: 25 }, // วิชา
      { wch: 8 },  // จำนวนกลุ่ม  
      { wch: 12 }, // กลุ่มละกี่คน
      { wch: 20 }, // อาจารย์ที่สอน
      ...Array(DAYS.length * timeSlots.length).fill({ wch: 4 }) // เวลา
    ];

    // ตั้งค่าความสูงของแถว
    ws['!rows'] = Array(lastRow + 1).fill(null).map((_, index) => {
      if (index === 0 || index === 1) return { hpt: 25 }; // header rows
      return { hpt: 80 }; // data rows
    });

    // จัดการ merge cells สำหรับวัน
    const merges: XLSX.Range[] = [];
    currentCol = 4;
    DAYS.forEach((day, dayIndex) => {
      const startCol = currentCol;
      const endCol = currentCol + timeSlots.length - 1;
      
      if (startCol < endCol) {
        const mergeRange: XLSX.Range = {
          s: { r: 0, c: startCol },
          e: { r: 0, c: endCol }
        };
        merges.push(mergeRange);
      }
      
      currentCol = endCol + 1;
    });
    ws['!merges'] = merges;

    // จัดรูปแบบ
    const range = XLSX.utils.decode_range(ws['!ref']);
    
    // Header Row 1 - สีส้ม
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
      if (ws[cellRef]) {
        ws[cellRef].s = {
          font: { bold: true, color: { rgb: "FFFFFF" }, sz: 12 },
          fill: { fgColor: { rgb: "F26522" } },
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            top: { style: "medium", color: { rgb: "000000" } },
            bottom: { style: "medium", color: { rgb: "000000" } },
            left: { style: "medium", color: { rgb: "000000" } },
            right: { style: "medium", color: { rgb: "000000" } }
          }
        };
      }
    }

    // Header Row 2 - สีฟ้าอ่อน
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: 1, c: col });
      if (ws[cellRef]) {
        ws[cellRef].s = {
          font: { bold: true, sz: 10 },
          fill: { fgColor: { rgb: "E8F4FD" } },
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "medium", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } }
          }
        };
      }
    }

    // Data rows
    for (let row = 2; row <= range.e.r; row++) {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
        if (ws[cellRef]) {
          if (col === 0) {
            // คอลัมน์วิชา
            ws[cellRef].s = {
              font: { bold: true, sz: 10 },
              fill: { fgColor: { rgb: "F8F9FA" } },
              alignment: { horizontal: "left", vertical: "top", wrapText: true },
              border: {
                top: { style: "thin", color: { rgb: "000000" } },
                bottom: { style: "thin", color: { rgb: "000000" } },
                left: { style: "medium", color: { rgb: "000000" } },
                right: { style: "thin", color: { rgb: "000000" } }
              }
            };
          } else if (col >= 1 && col <= 3) {
            // คอลัมน์ข้อมูลเพิ่มเติม
            ws[cellRef].s = {
              font: { sz: 10 },
              fill: { fgColor: { rgb: "F0F8FF" } },
              alignment: { horizontal: "center", vertical: "center" },
              border: {
                top: { style: "thin", color: { rgb: "000000" } },
                bottom: { style: "thin", color: { rgb: "000000" } },
                left: { style: "thin", color: { rgb: "000000" } },
                right: { style: "thin", color: { rgb: "000000" } }
              }
            };
          } else {
            // คอลัมน์เวลา
            const cellValue = ws[cellRef].v;
            if (cellValue && cellValue.includes && cellValue.includes('SEC:')) {
              // มี SEC - สีเขียว
              ws[cellRef].s = {
                font: { sz: 9, bold: true },
                fill: { fgColor: { rgb: "90EE90" } },
                alignment: { horizontal: "center", vertical: "center" },
                border: {
                  top: { style: "thin", color: { rgb: "000000" } },
                  bottom: { style: "thin", color: { rgb: "000000" } },
                  left: { style: "thin", color: { rgb: "000000" } },
                  right: { style: "thin", color: { rgb: "000000" } }
                }
              };
            } else {
              // ไม่มี SEC - สีขาว
              ws[cellRef].s = {
                fill: { fgColor: { rgb: "FFFFFF" } },
                border: {
                  top: { style: "hair", color: { rgb: "DDDDDD" } },
                  bottom: { style: "hair", color: { rgb: "DDDDDD" } },
                  left: { style: "hair", color: { rgb: "DDDDDD" } },
                  right: { style: "hair", color: { rgb: "DDDDDD" } }
                }
              };
            }
          }
        }
      }
    }

    // เพิ่ม worksheet ลง workbook
    let sheetName = "ตารางเรียนตามวิชา";
    if (currentTableName) {
      sheetName = currentTableName.length > 31 ? currentTableName.substring(0, 28) + "..." : currentTableName;
    }
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // เพิ่มข้อมูลการกรองในแผ่นงานใหม่ (ถ้ามี)
    if (filterTags.length > 0 || searchValue) {
      const filterData: (string | number)[][] = [
        ["ข้อมูลการกรอง"],
        [""],
      ];

      if (searchValue) {
        filterData.push(["คำค้นหา:", searchValue]);
      }

      if (filterTags.length > 0) {
        filterData.push(["ตัวกรอง:", ""]);
        filterTags.forEach(tag => {
          const filterTypeMap = {
            'teacher': 'อาจารย์',
            'studentYear': 'ชั้นปี',
            'subject': 'วิชา',
            'courseCode': 'รหัสวิชา',
            'room': 'ห้อง'
          };
          const filterType = filterTypeMap[tag.type] || tag.type;
          filterData.push([filterType, tag.value]);
        });
      }

      const filterWs = XLSX.utils.aoa_to_sheet(filterData);
      filterWs['!cols'] = [{ wch: 20 }, { wch: 30 }];
      
      const filterHeaderCell = filterWs['A1'];
      if (filterHeaderCell) {
        filterHeaderCell.s = {
          font: { bold: true, sz: 14 },
          alignment: { horizontal: "center" }
        };
      }

      XLSX.utils.book_append_sheet(wb, filterWs, "ข้อมูลการกรอง");
    }

    // สร้างชื่อไฟล์
    const now = new Date();
    const dateStr = now.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\//g, '-');

    let fileName = `ตารางเรียนตามวิชา_${dateStr}`;
    
    if (filterTags.length > 0 || searchValue) {
      fileName += '_กรองแล้ว';
    }
    
    fileName += '.xlsx';

    // บันทึกไฟล์
    XLSX.writeFile(wb, fileName);
    
    hide();
    message.success("ส่งออก Excel สำเร็จ!");

  } catch (error: any) {
    message.destroy();
    console.error("Error generating Excel:", error);
    message.error("เกิดข้อผิดพลาดในการสร้าง Excel: " + (error?.message || 'Unknown error'));
  }
};
  // =================== TABLE COLUMNS WITH FIXED ROW GROUPING ===================
  const columns: ColumnsType<ExtendedScheduleData> = [
    {
      title: "Day/Time",
      dataIndex: "day",
      key: "day",
      width: 100,
      onCell: (record: ExtendedScheduleData) => {
        if (record.isFirstRowOfDay) {
          return { 
            rowSpan: record.totalRowsInDay || 1,
            style: { 
              verticalAlign: 'top' as const,
              backgroundColor: '#f8f9fa',
              fontWeight: 'bold' as const
            }
          };
        } else {
          return { rowSpan: 0 };
        }
      },
      render: (text: string, record: ExtendedScheduleData) => {
        return record.isFirstRowOfDay ? 
          <strong style={{ color: "#333" }}>{text}</strong> : null;
      },
    },
    ...TIME_SLOTS.map((time) => ({
      title: time,
      dataIndex: time,
      key: time,
      width: 140,
      onCell: (record: ExtendedScheduleData) => {
        const timeSlotIndex = timeSlotToSlotIndex(time);
        
        // หาวิชาที่เริ่มในช่องนี้และยาวกว่า 1 ช่อง
        const spanningSubCell = (record.subCells || []).find(subCell => {
        const subCellStartSlotIndex = Math.floor(subCell.position.startSlot);
        const subCellEndSlotIndex = Math.floor(subCell.position.endSlot);
          
          const shouldSpan = subCellStartSlotIndex === timeSlotIndex && 
                      (subCellEndSlotIndex - subCellStartSlotIndex) >= 2; // แก้จาก > 1 เป็น >= 2
          
          return shouldSpan;
        });
        
        if (spanningSubCell) {
          const spanLength = Math.floor(spanningSubCell.position.endSlot) - 
                            Math.floor(spanningSubCell.position.startSlot);
          
          return { 
            colSpan: spanLength,
            style: { 
              height: `${CELL_CONFIG.MIN_HEIGHT}px`,
              verticalAlign: 'top' as const,
              padding: '6px',
              overflow: 'visible' as const,
              position: 'relative' as const
            }
          };
        }
        
        // ตรวจสอบว่าถูกคคลุมโดยช่องอื่นหรือไม่
        const spannedByOther = (record.subCells || []).some(subCell => {
          const subCellStartSlotIndex = Math.floor(subCell.position.startSlot);
          const subCellEndSlotIndex = Math.floor(subCell.position.endSlot);
          return subCellStartSlotIndex < timeSlotIndex && subCellEndSlotIndex > timeSlotIndex;
        });
        
        if (spannedByOther) {
          return { colSpan: 0 };
        }
        
        return {
          style: { 
            height: `${CELL_CONFIG.MIN_HEIGHT}px`,
            verticalAlign: 'top' as const,
            padding: '6px',
            overflow: 'visible' as const,
            position: 'relative' as const
          }
        };
      },
      render: (text: string, record: ExtendedScheduleData) => {
        const timeSlotIndex = timeSlotToSlotIndex(time);
        
        // หาวิชาที่เริ่มในช่องนี้
        const startingSubCells = (record.subCells || []).filter(subCell => 
          Math.floor(subCell.position.startSlot) === timeSlotIndex
        );
        
        if (startingSubCells.length > 0) {
          // ในระบบแยกแถว ควรมีวิชาเดียวต่อช่องต่อแถว
          const subCell = startingSubCells[0];
          
          return (
            <div
              style={{
                width: "100%",
                height: `${CELL_CONFIG.MIN_HEIGHT}px`,
                backgroundColor: "transparent",
                borderRadius: "6px",
                padding: "6px",
                border: "none",
                boxShadow: "none",
                display: "block",
                position: "relative",
                overflow: "visible"
              }}
              onDragOver={(e) => handleCellDragOver(e, record, time)}
              onDragLeave={handleCellDragLeave}
              onDrop={(e) => handleCellDrop(e, record, time)}
            >
              <div
                style={{
                  position: "absolute",
                  top: "0px",
                  left: "0",
                  width: "100%",
                  height: `${CELL_CONFIG.FIXED_HEIGHT}px`
                }}
              >
                {renderSubCell(subCell)}
              </div>
            </div>
          );
        }

        // Legacy rendering for empty cells or break time
        const cellData = record[time];
        
        // Break time
        if (cellData && cellData.isBreak) {
          return (
            <div
              style={{
                width: "100%",
                height: `${CELL_CONFIG.MIN_HEIGHT}px`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: cellData.backgroundColor,
                color: "#666",
                borderRadius: "6px",
                padding: "8px 4px",
                fontSize: "8px",
                fontWeight: "bold",
                border: "1px solid #e0e0e0",
              }}
            >
              พักเที่ยง
            </div>
          );
        }

        // Empty cell
        return (
          <div
            style={{
              width: "100%",
              height: `${CELL_CONFIG.MIN_HEIGHT}px`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "transparent",
              borderRadius: "6px",
              padding: "8px",
              border: "2px dashed #ddd",
              transition: "all 0.2s ease"
            }}
            onDragOver={(e) => {
              e.currentTarget.style.backgroundColor = "#f0f8ff";
              e.currentTarget.style.borderColor = "#F26522";
              handleCellDragOver(e, record, time);
            }}
            onDragLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.borderColor = "#ddd";
              handleCellDragLeave();
            }}
            onDrop={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.borderColor = "#ddd";
              handleCellDrop(e, record, time);
            }}
          >
            <div style={{ color: "#999", fontSize: "8px", textAlign: "center" }}>
              วางคาบเรียนที่นี่
            </div>
          </div>
        );
      },
    })),
  ];

  // =================== DEMO FUNCTIONS ===================
  const addTestSubCell = () => {
    const testSubCell = createSubCell(
      {
        subject: "วิชาทดสอบ Sub-Cell",
        teacher: "อ.ทดสอบ",
        room: "ห้องทดสอบ",
        studentYear: "1"
      },
      "จันทร์",
      "09:00",
      "11:00"
    );
    
    addSubCellToDay("จันทร์", testSubCell);
    message.success("เพิ่มวิชาทดสอบ (2 ชั่วโมง) สำเร็จ!");
  };

  const addTestSubCell3Hours = () => {
    const testSubCell = createSubCell(
      {
        subject: "วิชาทดสอบ 3 ชั่วโมง",
        teacher: "อ.ทดสอบยาว",
        room: "ห้องใหญ่",
        studentYear: "2"
      },
      "จันทร์",
      "09:00",
      "12:00"
    );
    
    addSubCellToDay("จันทร์", testSubCell);
    message.success("เพิ่มวิชาทดสอบ (3 ชั่วโมง) สำเร็จ!");
  };

  const addTestSubCell1Hour = () => {
    const testSubCell = createSubCell(
      {
        subject: "วิชาสั้น 1 ชม.",
        teacher: "อ.สั้น",
        room: "ห้องเล็ก",
        studentYear: "3"
      },
      "พุธ",
      "14:00",
      "15:00"
    );
    
    addSubCellToDay("พุธ", testSubCell);
    message.success("เพิ่มวิชาทดสอบ (1 ชั่วโมง) สำเร็จ!");
  };

  // =================== EFFECTS ===================
  // แก้ไข useEffect สำหรับการโหลดอัตโนมัติ
  useEffect(() => {
    if (academicYear && term && major_name) {
      getSchedules();
    }
  }, [academicYear, term, major_name]);

  useEffect(() => {
    getAllNameTable();
  }, []);

  useEffect(() => {
    // เซ็ตชื่อตารางใน modal ให้ตรงกับตารางปัจจุบัน
    if (isTableFromAPI && currentTableName) {
      setScheduleNameToSave(currentTableName);
    }
  }, [isTableFromAPI, currentTableName]);

  // =================== DATA PROCESSING ===================
  const data: ExtendedScheduleData[] = filteredScheduleData.length > 0
    ? filteredScheduleData
    : scheduleData.length > 0
    ? scheduleData
    : DAYS.map((day, index) => {
        const rowData: ExtendedScheduleData = { 
          key: `day-${index}-row-0`,
          day: day,
          dayIndex: index,
          rowIndex: 0,
          isFirstRowOfDay: true,
          totalRowsInDay: 1,
          subCells: []
        };
        TIME_SLOTS.forEach((time) => {
          if (time === "12:00-13:00") {
            rowData[time] = {
              content: "พักเที่ยง",
              backgroundColor: "#FFF5E5",
              isBreak: true,
            };
          } else {
            rowData[time] = { content: "", backgroundColor: "#f9f9f9", classes: [] };
          }
        });
        return rowData;
      });

  // =================== RENDER ===================
  return (
    <div style={{ 
      width: "100%", 
      height: "100vh",
      position: "relative"
    }}>
      {/* Main Content */}
      <div style={{ 
        width: "100%",
        padding: "20px",
        overflowY: "auto",
        height: "100vh"
      }}>
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
            จัดตารางเรียน (กรองอาจารย์ & ชั้นปี) 🎯
          </h2>
          <p
            style={{
              margin: 0,
              color: "#666",
              fontSize: "13px",
            }}
          >
            สร้างและจัดการตารางเรียนแบบ Drag & Drop | 
            กรองข้อมูลตามอาจารย์, ชั้นปี, วิชา, รหัสวิชา และห้องเรียน | 
            วิชาที่มีเวลาซ้อนทับกันจะแยกเป็นแถวต่างหาก | 
            การบันทึกจะอัปเดตข้อมูลใน API ผ่าน putupdateScheduleTime
          </p>
        </div>

        {/* Table Status */}
        {renderTableStatus()}

        {/* Filter Section */}
        {renderFilterSection()}

        {/* Action Buttons */}
        <Flex gap="small" wrap style={{ marginBottom: "20px" }}>
          {role === "Scheduler" && (
          <Button
            type="primary"
            style={{ backgroundColor: "#F26522", borderColor: "#F26522" }}
            onClick={() => {
              if (scheduleData.length === 0) {
                message.warning("ไม่มีข้อมูลให้บันทึก กรุณาสร้างตารางก่อน");
                return;
              }
              if (!isTableFromAPI) {
                message.warning("สามารถบันทึกได้เฉพาะตารางที่มาจาก API เท่านั้น");
                return;
              }
              setSaveModalVisible(true);
            }}
            disabled={!isTableFromAPI}
          >
            อัปเดตตาราง
          </Button>
          )}
          {role === "Scheduler" && (
          <Button 
            onClick={() => {
              setLoadModalVisible(true);
              getAllNameTable();
            }}
          >
            โหลด
          </Button>
          )}
          {role === "Scheduler" && (
          <Button onClick={handleReset}>
            รีเซต
          </Button>
          )}
          {role === "Scheduler" && (
          <Button
            type="primary"
            style={{ backgroundColor: "#F26522", borderColor: "#F26522" }}
            onClick={generateAutoSchedule}
          >
            สร้างอัตโนมัติ
          </Button>
          )}
          {role === "Scheduler" && (
          <Button
            type="primary"
            style={{ backgroundColor: "#F26522", borderColor: "#F26522" }}
            onClick={exportPDF}
          >
            ส่งออก Pdf
          </Button>
          )}
          <Button
            type="primary"
            style={{ backgroundColor: "#F26522", borderColor: "#F26522" }}
            onClick={exportScheduleToXLSX}
          >
            ส่งออก Xlsx
            {(filterTags.length > 0 || searchValue) && " (กรอง)"}
          </Button>
          
          {/* Refresh Button - เพื่อโหลดข้อมูลล่าสุดจาก API */}
          <Button
            icon={<SearchOutlined />}
            onClick={() => {
              if (academicYear && term && major_name) {
                getSchedules();
                message.success("รีเฟรชข้อมูลจาก API สำเร็จ");
              } else {
                message.warning("กรุณาตรวจสอบการตั้งค่า ปีการศึกษา, เทอม และสาขา");
              }
            }}
          >
            🔄 รีเฟรช
          </Button>
          
          {/* Sidebar Toggle Button */}
          {role === "Scheduler" && (
          <Button
            icon={<MenuOutlined />}
            onClick={() => setSidebarVisible(!sidebarVisible)}
            type={sidebarVisible ? "primary" : "default"}
          >
            {sidebarVisible ? "ซ่อนกล่องวิชา" : "แสดงกล่องวิชา"}
          </Button>
          )}
        </Flex>

        {/* Schedule Table */}
        <div ref={tableRef} style={{ 
          flex: 1, 
          width: "100%"
        }}>
          <Table
            columns={columns}
            dataSource={data}
            pagination={false}
            size="small"
            bordered
            style={{
              backgroundColor: "white",
              borderRadius: "8px",
            }}
          />
        </div>

        {/* Save Modal */}
        <Modal
          title="อัปเดตตาราง"
          open={saveModalVisible}
          onOk={handleSaveConfirm}
          onCancel={() => {
            setSaveModalVisible(false);
            setScheduleNameToSave("");
          }}
          okText="อัปเดต"
          cancelText="ยกเลิก"
        >
          <div style={{ margin: "20px 0" }}>
            {isTableFromAPI && currentTableName ? (
              <>
                <p>ชื่อตารางปัจจุบัน:</p>
                <Input
                  value={currentTableName}
                  disabled
                  style={{ 
                    backgroundColor: "#f5f5f5",
                    marginBottom: "10px"
                  }}
                />
                <p style={{ 
                  fontSize: "12px", 
                  color: "#666",
                  marginBottom: "15px",
                  padding: "8px",
                  backgroundColor: "#f0f8ff",
                  borderRadius: "4px",
                  border: "1px solid #d1ecf1"
                }}>
                  💡 ระบบจะอัปเดตเฉพาะรายการที่มีการเปลี่ยนแปลงเวลาหรือวันใน API
                </p>
                
                {/* Hidden input for form consistency */}
                <Input
                  type="hidden"
                  value={currentTableName}
                  onChange={(e) => setScheduleNameToSave(e.target.value)}
                />
              </>
            ) : (
              <>
                <p>กรุณาใส่ชื่อตาราง:</p>
                <Input
                  placeholder="เช่น ตารางเรียนภาคเรียนที่ 1/2567"
                  value={scheduleNameToSave}
                  onChange={(e) => setScheduleNameToSave(e.target.value)}
                  onPressEnter={handleSaveConfirm}
                  maxLength={50}
                  disabled
                />
                <p style={{ 
                  fontSize: "12px", 
                  color: "#999", 
                  marginTop: "8px",
                  fontStyle: "italic"
                }}>
                  ⚠️ สามารถบันทึกได้เฉพาะตารางที่มาจาก 'สร้างอัตโนมัติ' หรือ 'โหลด' เท่านั้น
                </p>
              </>
            )}
          </div>
        </Modal>

        {/* Load Modal */}
        <Modal
          title="เลือกตารางที่จะโหลด"
          open={loadModalVisible}
          onCancel={() => setLoadModalVisible(false)}
          footer={[
            <Button key="cancel" onClick={() => setLoadModalVisible(false)}>
              ยกเลิก
            </Button>,
          ]}
          width={600}
        >
          <div style={{ maxHeight: "400px", overflowY: "auto" }}>
            {allNameTable.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#999" }}>
                ไม่มีตารางที่บันทึกไว้
              </div>
            ) : (
              <List
                dataSource={allNameTable}
                renderItem={(name: string) => (
                  <List.Item>
                    <Card
                      size="small"
                      style={{ 
                        width: "100%", 
                        cursor: "pointer",
                        border: currentTableName === name ? "2px solid #1890ff" : "1px solid #d9d9d9"
                      }}
                      hoverable
                      actions={[
                        <Button
                          key="load"
                          type="primary"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLoadSchedule(name);
                          }}
                        >
                          โหลด
                        </Button>,
                        <Button
                          key="delete"
                          danger
                          size="small"
                          loading={deletingName === name}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSchedule(name);
                          }}
                        >
                          ลบ
                        </Button>,
                      ]}
                    >
                      <Card.Meta 
                        title={
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            {name}
                            {currentTableName === name && (
                              <span style={{ 
                                fontSize: "10px", 
                                color: "#1890ff", 
                                backgroundColor: "#e6f7ff",
                                padding: "2px 6px",
                                borderRadius: "4px",
                                border: "1px solid #91d5ff"
                              }}>
                                กำลังแก้ไข
                              </span>
                            )}
                          </div>
                        } 
                      />
                    </Card>
                  </List.Item>
                )}
              />
            )}
          </div>
        </Modal>
      </div>

      {/* Sidebar */}
      {renderSidebar()}
    </div>
  );
};

export default Schedulepage;