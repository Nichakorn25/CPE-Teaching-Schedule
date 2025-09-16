import React, { useState, useRef, useEffect, useMemo } from "react";
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
import { AllTeacher } from "../../../interfaces/Adminpage";
import { getAllTeachers } from "../../../services/https/AdminPageServices";
import * as XLSX from "xlsx";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import Swal from "sweetalert2";


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
  teacherIds?: number[];
  room: string;
  section: string;
  studentYear: string;
  duration: number;
  color: string;
  scheduleId?: number;
  scheduleIds?: number[]; // เพิ่มบรรทัดนี้
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

// Interface สำหรับข้อมูลขัดแย้ง
interface ConflictInfo {
  hasConflict: boolean;
  conflictType: 'time' | 'room' | 'teacher' | 'multiple';
  conflictDetails: {
    time?: boolean;
    room?: {
      conflictingSubCell: SubCell;
      room: string;
    };
    teacher?: {
      conflictingSubCell: SubCell;
      teacher: string;
    };
  };
  conflictingSubCells: SubCell[];
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
  const [allTeachers, setAllTeachers] = useState<AllTeacher[]>([]);

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

  // เพิ่ม function ใหม่ใน component
const fetchAllTeachers = async () => {
  try {
    const response = await getAllTeachers();
    if (response && response.data) {
      setAllTeachers(response.data);
      console.log('📚 Teachers loaded:', response.data);
    }
  } catch (error) {
    console.error("Error loading teachers:", error);
    message.error("เกิดข้อผิดพลาดในการโหลดข้อมูลอาจารย์");
  }
};
useEffect(() => {
  fetchAllTeachers();
}, []);

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
}, [sidebarFilterTags, sidebarSearchValue, courseCards, scheduleData]); // เพิ่ม scheduleData



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

const addSubCellToSpecificRow = (targetRow: ExtendedScheduleData, subCell: SubCell) => {
  setScheduleData(prevData => {
    const newData = [...prevData];
    
    // หา index ของแถวเป้าหมาย
    const targetRowIndex = newData.findIndex(row => row.key === targetRow.key);
    
    if (targetRowIndex === -1) {
      console.error('Target row not found');
      return prevData;
    }
    
    // ตรวจสอบว่าแถวเป้าหมายมีการทับซ้อนหรือไม่
    const hasConflictInTargetRow = (newData[targetRowIndex].subCells || []).some(existingSubCell => 
      doSubCellsOverlap(subCell, existingSubCell)
    );
    
    if (hasConflictInTargetRow) {
      // ถ้าแถวเป้าหมายมีการทับซ้อน ให้สร้างแถวใหม่
      const dayIndex = DAYS.findIndex(d => d === subCell.day);
      const dayRows = newData.filter(row => row.day === subCell.day);
      const newRowIndex = dayRows.length;
      const newTotalRows = dayRows.length + 1;
      
      const newRowData: ExtendedScheduleData = {
        key: `day-${dayIndex}-row-${newRowIndex}`,
        day: subCell.day,
        dayIndex: dayIndex,
        rowIndex: newRowIndex,
        isFirstRowOfDay: false,
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
      
      // อัปเดต totalRowsInDay ของแถวอื่นในวันเดียวกัน
      newData.forEach(row => {
        if (row.day === subCell.day) {
          row.totalRowsInDay = newTotalRows;
        }
      });
      
      newData.push(newRowData);
      
    } else {
      // ถ้าแถวเป้าหมายไม่มีการทับซ้อน ให้เพิ่มลงในแถวนั้นเลย
      if (!newData[targetRowIndex].subCells) {
        newData[targetRowIndex].subCells = [];
      }
      newData[targetRowIndex].subCells.push(subCell);
      
      // ตรวจสอบว่าต้องเพิ่ม empty row หรือไม่
      const dayRows = newData.filter(row => row.day === subCell.day);
      const isLastRowOfDay = targetRowIndex === Math.max(...dayRows.map(row => newData.findIndex(r => r.key === row.key)));
      const targetRowHasOnlyNewCell = newData[targetRowIndex].subCells.length === 1;
      
      if (isLastRowOfDay && !targetRowHasOnlyNewCell) {
        // สร้าง empty row ใหม่
        const dayIndex = DAYS.findIndex(d => d === subCell.day);
        const newEmptyRowIndex = dayRows.length;
        const newTotalRows = dayRows.length + 1;
        
        const newEmptyRow = createEmptyDayRow(subCell.day, dayIndex, newEmptyRowIndex, newTotalRows);
        newEmptyRow.isFirstRowOfDay = false;
        
        // อัปเดต totalRowsInDay
        newData.forEach(row => {
          if (row.day === subCell.day) {
            row.totalRowsInDay = newTotalRows;
          }
        });
        
        newData.push(newEmptyRow);
      }
    }
    
    return newData;
  });
};



  // =================== COURSE CARD FUNCTIONS ==================
const generateCourseCardsFromAPI = (schedules: ScheduleInterface[]) => {
  const cards: CourseCard[] = [];
  
  // เก็บข้อมูลวิชาทั้งหมดจาก API ก่อน (ไม่กรอง)
  const allCourseData: Array<{
    subject: string;
    courseCode: string;
    teacher: string;
    teacherIds: number[];
    room: string;
    section: string;
    studentYear: string;
    scheduleId: number;
    duration: number;
    dayOfWeek: string; // เพิ่มเพื่อแยกแต่ละคาบ
    startTime: string; // เพิ่มเพื่อแยกแต่ละคาบ
    endTime: string;   // เพิ่มเพื่อแยกแต่ละคาบ
  }> = [];

  schedules.forEach((schedule, index) => {
    const isTimeFixed = isTimeFixedCourse(schedule);

    if (isTimeFixed) {
      console.log('⭐ Skipping TimeFixed course from cards:', {
        courseCode: schedule.OfferedCourses?.AllCourses?.Code,
        courseName: schedule.OfferedCourses?.AllCourses?.ThaiName,
        scheduleID: schedule.ID
      });
      return;
    }

    const getRoomInfo = (schedule: ScheduleInterface): string => {
      if (schedule.TimeFixedCourses && schedule.TimeFixedCourses.length > 0) {
        const matchingFixedCourse = schedule.TimeFixedCourses.find(
          (tc: any) =>
            tc.Section === schedule.SectionNumber &&
            tc.ScheduleID === schedule.ID &&
            tc.RoomFix &&
            tc.RoomFix.trim() !== ""
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
        if (/^\d+$/.test(academicYear.Level)) return academicYear.Level;
        const yearMatch = academicYear.Level.match(/ปีที่\s*(\d+)/);
        if (yearMatch) return yearMatch[1];
      }

      const academicYearId = academicYear?.AcademicYearID;
      if (academicYearId) {
        switch (academicYearId) {
          case 2: return "1";
          case 3: return "2";
          case 4: return "3";
          default:
            if (academicYearId >= 5 && academicYearId <= 10) return (academicYearId - 1).toString();
        }
      }

      if (schedule.OfferedCourses?.AllCourses?.Code) {
        const code = schedule.OfferedCourses.AllCourses.Code;
        const codeYearMatch1 = code.match(/[A-Z]{2,4}\d+\s+(\d)/);
        if (codeYearMatch1) return codeYearMatch1[1];
        const codeYearMatch2 = code.match(/[A-Z]{2,4}(\d)/);
        if (codeYearMatch2) return codeYearMatch2[1];
      }
      return "1";
    };

    const getTeacherInfo = (schedule: ScheduleInterface) => {
      const offeredAny = (schedule.OfferedCourses as any) ?? {};

      const uaFromAll = offeredAny?.AllCourses?.UserAllCourses;
      const uaFromOffered = offeredAny?.UserAllCourses;

      const combined = [
        ...(Array.isArray(uaFromAll) ? uaFromAll : []),
        ...(Array.isArray(uaFromOffered) ? uaFromOffered : []),
      ];

      if (combined.length > 0) {
        const infos = combined
          .map((entry: any) => {
            const userObj = entry?.User;
            const id = userObj?.ID ?? entry?.UserID ?? undefined;
            const name = userObj
              ? `${userObj.Firstname || ""} ${userObj.Lastname || ""}`.trim()
              : (entry?.Username || "");
            return { id, name: name || undefined };
          })
          .filter((x: any) => x.name);

        const uniqueNames = Array.from(new Set(infos.map((i: any) => i.name)));
        const ids = infos.map((i: any) => i.id).filter(Boolean) as number[];

        return { namesJoined: uniqueNames.join(", "), ids };
      }

      const offeredUser = offeredAny?.User;
      if (offeredUser) {
        const id = offeredUser.ID ?? offeredAny?.UserID ?? undefined;
        const name = `${offeredUser.Firstname || ""} ${offeredUser.Lastname || ""}`.trim() || "ไม่ระบุอาจารย์";
        return { namesJoined: name, ids: id ? [id] : [] as number[] };
      }

      const fallbackTeacher = allTeachers.find(teacher => {
        return teacher.ID === schedule.OfferedCourses?.UserID;
      });

      if (fallbackTeacher) {
        const name = `${fallbackTeacher.Firstname} ${fallbackTeacher.Lastname}`.trim();
        return { namesJoined: name, ids: [fallbackTeacher.ID] };
      }

      return { namesJoined: "ไม่ระบุอาจารย์", ids: [] as number[] };
    };

    const teacherInfo = getTeacherInfo(schedule);
    const subject = schedule.OfferedCourses?.AllCourses?.ThaiName ||
                    schedule.OfferedCourses?.AllCourses?.EnglishName ||
                    schedule.OfferedCourses?.AllCourses?.Code ||
                    "ไม่ทราบชื่อ";
    const courseCode = schedule.OfferedCourses?.AllCourses?.Code || "";
    const teacher = teacherInfo.namesJoined;
    const teacherIds = teacherInfo.ids;
    const room = getRoomInfo(schedule);
    const section = schedule.SectionNumber?.toString() || "";
    const studentYear = getStudentYear(schedule);

    const getTimeString = (time: string | Date): string => {
      if (typeof time === 'string') {
        if (time.includes('T')) return time.substring(11, 16);
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

    if (schedule.ID === undefined) {
      console.warn('Schedule ID is undefined, skipping...', schedule);
      return;
    }

    allCourseData.push({
      subject,
      courseCode,
      teacher,
      teacherIds,
      room,
      section,
      studentYear,
      scheduleId: schedule.ID,
      duration: Math.max(1, duration),
      dayOfWeek: schedule.DayOfWeek, // เพิ่ม
      startTime: startTime, // เพิ่ม
      endTime: endTime // เพิ่ม
    });
  });

  // กรุ๊ปตามข้อมูลที่เหมือนกัน (ยกเว้นเวลาและวัน)
  const courseGroups = new Map<string, typeof allCourseData>();
  
  allCourseData.forEach(courseData => {
    const teacherKeyPart = courseData.teacherIds.length > 0 ? courseData.teacherIds.join("-") : courseData.teacher;
    const groupKey = `${courseData.courseCode}-${courseData.section}-${courseData.studentYear}-${teacherKeyPart}`;
    
    if (!courseGroups.has(groupKey)) {
      courseGroups.set(groupKey, []);
    }
    courseGroups.get(groupKey)!.push(courseData);
  });

  // สร้าง CourseCard จากแต่ละกรุ๊ป
  courseGroups.forEach((group, groupKey) => {
    const firstCourse = group[0];
    
    // **แก้ไขการคำนวณ totalDuration ให้ถูกต้อง**
    // แทนที่จะรวม duration ของทุก record ให้นับเฉพาะคาบที่ไม่ซ้ำกัน
    const uniquePeriods = new Set<string>();
    
    group.forEach(course => {
      // สร้าง unique key สำหรับแต่ละคาบ (วัน + เวลา)
      for (let slot = timeToSlotIndex(course.startTime); slot < timeToSlotIndex(course.endTime); slot++) {
        const periodKey = `${course.dayOfWeek}-${slot}`;
        uniquePeriods.add(periodKey);
      }
    });
    
    const totalDuration = uniquePeriods.size; // นับจากจำนวนคาบที่ไม่ซ้ำกัน

    const card: CourseCard = {
      id: `course-card-${groupKey}`,
      subject: firstCourse.subject,
      courseCode: firstCourse.courseCode,
      teacher: firstCourse.teacher,
      teacherIds: firstCourse.teacherIds,
      room: firstCourse.room,
      section: firstCourse.section,
      studentYear: firstCourse.studentYear,
      duration: totalDuration, // ใช้ค่าที่คำนวณใหม่
      color: getSubjectColor(firstCourse.subject, firstCourse.courseCode),
      scheduleId: firstCourse.scheduleId,
      scheduleIds: group.map(course => course.scheduleId)
    };

    cards.push(card);
    
    console.log(`📊 Created CourseCard: ${firstCourse.subject} with ${totalDuration} periods from ${group.length} records, scheduleIds:`, card.scheduleIds);
  });

  setCourseCards(cards);
  setFilteredCourseCards(cards);
};

// เพิ่ม function ใหม่หลังจาก isCourseCardUsed
const getCourseCardUsageInfo = (courseCard: CourseCard): { usedDuration: number; totalDuration: number; isFullyUsed: boolean } => {
  const usedPeriods = new Set<string>(); // ใช้ Set เพื่อป้องกันการนับซ้ำ
  
  scheduleData.forEach(dayData => {
    dayData.subCells?.forEach(subCell => {
      let isMatch = false;
      
      // Method 1: เช็คจาก scheduleIds array (สำหรับวิชาที่มีหลายคาบ)
      if (courseCard.scheduleIds && Array.isArray(courseCard.scheduleIds) && subCell.scheduleId) {
        isMatch = courseCard.scheduleIds.includes(subCell.scheduleId);
      }
      // Method 2: เช็คจาก scheduleId เดียว (backward compatibility)
      else if (courseCard.scheduleId && subCell.scheduleId) {
        isMatch = subCell.scheduleId === courseCard.scheduleId;
      }
      
      // Method 3: เช็คตามข้อมูลหลัก (สำคัญที่สุด - แก้ปัญหาจัดอัตโนมัติ)
      if (!isMatch) {
        // เช็คข้อมูลพื้นฐานที่ต้องตรงกันทั้งหมด
        const subjectMatch = subCell.classData.subject === courseCard.subject;
        const courseCodeMatch = subCell.classData.courseCode === courseCard.courseCode;
        const sectionMatch = subCell.classData.section === courseCard.section;
        
        // เช็คอาจารย์ (อาจมีหลายคนคั่นด้วย comma)
        let teacherMatch = false;
        if (subCell.classData.teacher && courseCard.teacher) {
          const subCellTeachers = subCell.classData.teacher.split(/[,\/]/).map(name => name.trim());
          const courseCardTeachers = courseCard.teacher.split(/[,\/]/).map(name => name.trim());
          
          // เช็คว่ามีอาจารย์คนใดคนหนึ่งตรงกันหรือไม่
          teacherMatch = subCellTeachers.some(subTeacher => 
            courseCardTeachers.some(cardTeacher => 
              subTeacher === cardTeacher
            )
          );
        }
        
        isMatch = subjectMatch && courseCodeMatch && sectionMatch && teacherMatch;
      }
      
      if (isMatch) {
        // **แก้ไขการนับ usedDuration ให้ถูกต้อง**
        // สร้าง unique key สำหรับแต่ละคาบที่ใช้ไป
        for (let slot = subCell.position.startSlot; slot < subCell.position.endSlot; slot++) {
          const periodKey = `${subCell.day}-${slot}`;
          usedPeriods.add(periodKey);
        }
        
        console.log(`🔍 Found matching subCell: ${subCell.classData.subject}, periods: ${subCell.position.endSlot - subCell.position.startSlot}, total unique used: ${usedPeriods.size}/${courseCard.duration}`);
      }
    });
  });
  
  const usedDuration = usedPeriods.size; // นับจาก Set ไม่ซ้ำ
  
  return {
    usedDuration,
    totalDuration: courseCard.duration,
    isFullyUsed: usedDuration >= courseCard.duration
  };
};

// =================== CHECK IF COURSE CARD IS USED ===================
// แก้ไข function เดิม
const isCourseCardUsed = (courseCard: CourseCard): boolean => {
  const usageInfo = getCourseCardUsageInfo(courseCard);
  return usageInfo.isFullyUsed;
};



  // =================== COURSE CARD DRAG HANDLERS ===================
const handleCourseCardDragStart = (e: React.DragEvent, courseCard: CourseCard) => {
  // ตรวจสอบ role ก่อน
  if (role !== "Scheduler") {
    e.preventDefault();
    message.warning("เฉพาะ Scheduler เท่านั้นที่สามารถลากวิชาไปใส่ในตารางได้");
    return;
  }

  // ตรวจสอบว่าวิชาถูกใช้แล้วหรือไม่
  if (isCourseCardUsed(courseCard)) {
    e.preventDefault();
    message.warning(`วิชา "${courseCard.subject}" ถูกใช้ในตารางแล้ว`);
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
  if (role !== "Scheduler") {
    e.preventDefault();
    return;
  }
  
  e.preventDefault();
  
  const slotIndex = timeToSlotIndex(timeSlot.split('-')[0]);
  let duration = 1; // เปลี่ยนเป็น 1 เสมอสำหรับ Course Card
  
  if (draggedSubCell) {
    // เฉพาะ SubCell ที่มีอยู่แล้วใช้ duration เดิม
    duration = draggedSubCell.position.endSlot - draggedSubCell.position.startSlot;
  }
  // draggedCourseCard จะใช้ duration = 1 เสมอ
  
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
  
  if (role !== "Scheduler") {
    message.warning("เฉพาะ Scheduler เท่านั้นที่สามารถย้ายตารางเรียนได้");
    setDraggedCourseCard(null);
    setDraggedSubCell(null);
    setDragPreview(null);
    return;
  }
  
  const slotIndex = timeToSlotIndex(timeSlot.split('-')[0]);
  
  if (draggedCourseCard) {
    const startTime = slotIndexToTime(slotIndex);
    const endTime = slotIndexToTime(slotIndex + 1);
    
    // เช็คการซ้ำ (เหมือนเดิม)
    const checkDuplicateInSameTime = (): boolean => {
      const dayRows = scheduleData.filter(row => row.day === targetRow.day);
      
      for (const row of dayRows) {
        if (row.subCells) {
          for (const existingSubCell of row.subCells) {
            const existingStart = timeToSlotIndex(existingSubCell.startTime);
            const existingEnd = timeToSlotIndex(existingSubCell.endTime);
            const newStart = slotIndex;
            const newEnd = slotIndex + 1;
            
            const timeOverlap = !(newEnd <= existingStart || existingEnd <= newStart);
            
            if (timeOverlap) {
              const isSameSubject = existingSubCell.classData.subject === draggedCourseCard.subject;
              const isSameCourseCode = existingSubCell.classData.courseCode === draggedCourseCard.courseCode;
              const isSameSection = existingSubCell.classData.section === draggedCourseCard.section;
              
              if (isSameSubject && isSameCourseCode && isSameSection) {
                return true;
              }
            }
          }
        }
      }
      return false;
    };
    
    if (checkDuplicateInSameTime()) {
      message.warning(`ไม่สามารถวางวิชา "${draggedCourseCard.subject}" section ${draggedCourseCard.section} ซ้ำในเวลาเดียวกันได้`);
      setDraggedCourseCard(null);
      setDragPreview(null);
      return;
    }
    
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
    
    const conflictInfo = checkConflictsAcrossAllRows(newSubCell, scheduleData);
    
    if (conflictInfo.hasConflict) {
      showConflictModal(conflictInfo, newSubCell);
      setDraggedCourseCard(null);
      setDragPreview(null);
      return;
    }
    
    const usageInfo = getCourseCardUsageInfo(draggedCourseCard);
    if (usageInfo.usedDuration >= draggedCourseCard.duration) {
      message.warning(`วิชา "${draggedCourseCard.subject}" ถูกใช้ครบ ${draggedCourseCard.duration} คาบแล้ว`);
      setDraggedCourseCard(null);
      setDragPreview(null);
      return;
    }
    
    // ======== แก้ไขส่วนนี้ - ส่ง targetRow ไปด้วย ========
    addSubCellToSpecificRow(targetRow, newSubCell);  // ใช้ฟังก์ชันใหม่
    setDraggedCourseCard(null);
    setDragPreview(null);
    
    const newUsageInfo = getCourseCardUsageInfo(draggedCourseCard);
    const remainingPeriods = draggedCourseCard.duration - newUsageInfo.usedDuration;
    
    if (remainingPeriods > 0) {
      message.success(`เพิ่มวิชา ${draggedCourseCard.subject} (คาบที่ ${newUsageInfo.usedDuration}/${draggedCourseCard.duration}) เหลืออีก ${remainingPeriods} คาบ`);
    } else {
      message.success(`เพิ่มวิชา ${draggedCourseCard.subject} ครบ ${draggedCourseCard.duration} คาบแล้ว`);
    }
    
  } else if (draggedSubCell) {
    // ส่วน draggedSubCell เหมือนเดิม
    const duration = draggedSubCell.position.endSlot - draggedSubCell.position.startSlot;
    const newStartTime = slotIndexToTime(slotIndex);
    const newEndTime = slotIndexToTime(slotIndex + duration);
    
    const tempSubCell = createSubCell(
      draggedSubCell.classData,
      targetRow.day,
      newStartTime,
      newEndTime,
      draggedSubCell.scheduleId,
      draggedSubCell.isTimeFixed,
      draggedSubCell.timeFixedId
    );
    
    const conflictInfo = checkConflictsAcrossAllRows(tempSubCell, scheduleData, draggedSubCell.id);
    
    if (conflictInfo.hasConflict) {
      showConflictModal(conflictInfo, tempSubCell);
      setDraggedSubCell(null);
      setDragPreview(null);
      return;
    }
    
    moveSubCellToRow(draggedSubCell.id, targetRow, slotIndex);
    setDraggedSubCell(null);
    setDragPreview(null);
    message.success(`ย้ายวิชา ${draggedSubCell.classData.subject} สำเร็จ`);
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
  const usageInfo = getCourseCardUsageInfo(courseCard);
  const isFullyUsed = usageInfo.isFullyUsed;
  const canDrag = isScheduler && !isFullyUsed;

  // เพิ่มการเช็คสถานะ drag เพื่อซ่อน tooltip
  const isDragging = draggedSubCell !== null || draggedCourseCard !== null;

  return (
    <div
      key={courseCard.id}
      draggable={canDrag}
      onDragStart={canDrag ? (e) => handleCourseCardDragStart(e, courseCard) : undefined}
      onDragEnd={canDrag ? handleCourseCardDragEnd : undefined}
      style={{
        backgroundColor: isFullyUsed ? "#f5f5f5" : courseCard.color,
        border: isFullyUsed 
          ? "2px solid #d9d9d9" 
          : "2px solid rgba(0,0,0,0.1)",
        borderRadius: "8px",
        padding: "12px",
        margin: "8px 0",
        cursor: canDrag ? "grab" : isFullyUsed ? "not-allowed" : "default",
        transition: "all 0.2s ease",
        fontSize: "11px",
        lineHeight: "1.3",
        opacity: isFullyUsed ? 0.6 : (!isScheduler ? 0.7 : 1),
        position: "relative"
      }}
      onMouseEnter={(e) => {
        if (canDrag) {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
        }
      }}
      onMouseLeave={(e) => {
        if (canDrag) {
          e.currentTarget.style.transform = "translateY(0px)";
          e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
        }
      }}
      onClick={() => {
        if (!isScheduler) {
          message.warning("เฉพาะ Scheduler เท่านั้นที่สามารถลากวิชาไปใส่ในตารางได้");
        } else if (isFullyUsed) {
          message.info(`วิชา "${courseCard.subject}" ถูกใช้ในตารางแล้ว`);
        }
      }}
    >
      <Tooltip
        title={
          <div style={{ fontFamily: "Sarabun, sans-serif", minWidth: "250px" }}>
            <div style={{ fontWeight: "bold", fontSize: "13px", marginBottom: "6px", color: isFullyUsed ? "#999" : "#F26522" }}>
              {isFullyUsed ? "🔒 วิชาที่ใช้ในตารางแล้ว" : "📚 รายละเอียดวิชา"}
            </div>
            <p><b>🏷️ รหัสวิชา:</b> {courseCard.courseCode || "ไม่ระบุ"}</p>
            <p><b>📖 ชื่อวิชา:</b> {courseCard.subject || "ไม่ระบุ"}</p>
            <p><b>🎓 ชั้นปี:</b> {courseCard.studentYear ? `ปีที่ ${courseCard.studentYear}` : "ไม่ระบุ"}</p>
            <p><b>📄 หมู่เรียน:</b> {courseCard.section || "ไม่ระบุ"}</p>
            <p><b>👩‍🏫 อาจารย์:</b> {courseCard.teacher || "ไม่ระบุ"}</p>
            <p><b>🏢 ห้องเรียน:</b> {courseCard.room || "ไม่ระบุ"}</p>
            <p><b>⏰ ระยะเวลา:</b> {courseCard.duration} ชั่วโมง</p>
            <p><b>📊 สถานะการใช้:</b> {usageInfo.usedDuration}/{courseCard.duration} คาบ</p>
            <div style={{ marginTop: "8px", fontSize: "11px", color: "#666", fontStyle: "italic" }}>
              {isFullyUsed 
                ? "🔒 วิชานี้ถูกใช้ในตารางแล้ว ไม่สามารถลากได้อีก"
                : !isScheduler 
                ? "🔒 ต้องเป็น Scheduler เท่านั้นถึงจะลากได้"
                : "💡 ลากการ์ดนี้ไปวางในตารางเรียน"
              }
            </div>
          </div>
        }
        placement="left"
        overlayStyle={{ maxWidth: "350px" }}
        trigger={isDragging ? [] : ["hover"]} // แก้ไขให้ซ่อนขณะ drag
        open={isDragging ? false : undefined} // บังคับซ่อนขณะ drag
      >
        <div>
          <div style={{ fontWeight: "bold", fontSize: "12px", marginBottom: "4px", color: isFullyUsed ? "#999" : "#333" }}>
            {courseCard.subject}
            {isFullyUsed && (
              <span style={{ marginLeft: "8px", fontSize: "10px" }}>🔒</span>
            )}
            {!isScheduler && (
              <span style={{ marginLeft: "8px", fontSize: "10px" }}>🔒</span>
            )}
          </div>
          <div style={{ fontSize: "9px", color: isFullyUsed ? "#aaa" : "#666", marginBottom: "2px" }}>
            รหัส: {courseCard.courseCode}
          </div>
          <div style={{ fontSize: "10px", color: isFullyUsed ? "#aaa" : "#555", marginBottom: "2px" }}>
            อาจารย์: {courseCard.teacher}
          </div>
          <div style={{ fontSize: "9px", color: isFullyUsed ? "#bbb" : "#777", marginBottom: "4px" }}>
            ห้อง: {courseCard.room}
          </div>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
            <span style={{ fontSize: "9px", color: isFullyUsed ? "#bbb" : "#888" }}>
              ปี {courseCard.studentYear} หมู่ {courseCard.section}
            </span>
            
            {/* แสดงสถานะการใช้งาน */}
            <span style={{ 
              fontSize: "10px", 
              fontWeight: "bold", 
              color: isFullyUsed ? "#aaa" : usageInfo.usedDuration > 0 ? "#ff9800" : "#F26522"
            }}>
              {usageInfo.usedDuration > 0 
                ? `${usageInfo.usedDuration}/${courseCard.duration}คาบ`
                : `${courseCard.duration}คาบ`
              }
            </span>
          </div>
          
          {/* Status indicator สำหรับวิชาที่ใช้ครบแล้ว */}
          {isFullyUsed && (
            <div
              style={{
                position: "absolute",
                top: "8px",
                right: "8px",
                backgroundColor: "rgba(153, 153, 153, 0.9)",
                color: "white",
                borderRadius: "12px",
                padding: "4px 8px",
                fontSize: "10px",
                fontWeight: "bold",
                border: "1px solid rgba(255,255,255,0.5)"
              }}
            >
              ใช้ครบแล้ว
            </div>
          )}
          
          {/* Status indicator สำหรับวิชาที่ใช้บางส่วน */}
          {usageInfo.usedDuration > 0 && !isFullyUsed && (
            <div
              style={{
                position: "absolute",
                top: "8px",
                right: "8px",
                backgroundColor: "rgba(255, 152, 0, 0.9)",
                color: "white",
                borderRadius: "12px",
                padding: "4px 8px",
                fontSize: "10px",
                fontWeight: "bold",
                border: "1px solid rgba(255,255,255,0.5)"
              }}
            >
              ใช้บางส่วน
            </div>
          )}
        </div>
      </Tooltip>
    </div>
  );
};

  // =================== RENDER SIDEBAR ===================
const renderSidebar = () => {
  if (role !== "Scheduler" || !sidebarVisible) return null;
  
  return (
    <div
      style={{
        width: `${sidebarWidth}px`,
        backgroundColor: "#fafafa",
        borderRight: "1px solid #d9d9d9", // เปลี่ยนจาก borderLeft
        height: "100vh",
        minHeight: "100vh",
        maxHeight: "100vh",
        position: "fixed",
        left: sidebarVisible ? 0 : -sidebarWidth, // เปลี่ยนจาก right: 0
        top: 0,
        bottom: 0,
        zIndex: 1000,
        boxShadow: "2px 0 8px rgba(0,0,0,0.1)", // เปลี่ยนจาก -2px เป็น 2px
        transition: "left 0.3s ease", // เปลี่ยนจาก right เป็น left
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

      {/* Available Courses Content */}
      <div style={{ 
        flex: 1,
        padding: "0 16px 16px 16px",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column"
      }}>
        {renderAvailableCourses()}
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
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Available Courses Filter Section */}
      <div style={{ 
        backgroundColor: "#f5f5f5", 
        padding: "12px", 
        borderRadius: "6px", 
        border: "1px solid #e8e8e8",
        marginBottom: "16px",
        flexShrink: 0  // ป้องกันไม่ให้ส่วนนี้ถูกบีบ
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
        border: "1px solid #91d5ff",
        flexShrink: 0
      }}>
        <div style={{ fontSize: "12px", color: "#1890ff" }}>
          📊 แสดงวิชา: <strong>{filteredCourseCards.length}</strong> จาก <strong>{courseCards.length}</strong> รายการ
        </div>
        <div style={{ fontSize: "11px", color: "#666", marginTop: "2px" }}>
          💡 ลากการ์ดวิชาไปวางในตารางเรียนได้เลย
        </div>
      </div>

      {/* Course Cards List */}
      <div style={{ 
        flex: 1, // ใช้พื้นที่ที่เหลือทั้งหมด
        overflowY: "auto",
        paddingRight: "4px" // เพิ่ม padding เล็กน้อยสำหรับ scrollbar
      }}>
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
  // ปรับปรุง extractFilterOptions function
const extractFilterOptions = (data: ExtendedScheduleData[]) => {
  const teachers = new Set<string>();
  const studentYears = new Set<string>();
  const subjects = new Set<string>();
  const courseCodes = new Set<string>();
  const rooms = new Set<string>();

  // เพิ่มข้อมูลอาจารย์จาก API
  allTeachers.forEach(teacher => {
    const fullName = `${teacher.Firstname} ${teacher.Lastname}`.trim();
    if (fullName && fullName !== '') {
      teachers.add(fullName);
    }
  });

  // เพิ่มข้อมูลจาก schedule data เช่นเดิม
  data.forEach(dayData => {
    dayData.subCells?.forEach(subCell => {
      // เพิ่มอาจารย์จาก subCell ด้วย (เผื่อมีอาจารย์ที่ไม่อยู่ใน API)
      if (subCell.classData.teacher) {
        // แยกอาจารย์หลายคนที่คั่นด้วย comma
        const teacherNames = subCell.classData.teacher.split(',').map(name => name.trim());
        teacherNames.forEach(name => {
          if (name && name !== '') {
            teachers.add(name);
          }
        });
      }
      
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

  // Extract student years from original API data เช่นเดิม
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

  console.log('🎯 Filter options updated:', {
    teachersCount: Array.from(teachers).length,
    fromAPI: allTeachers.length,
    fromSchedule: data.length
  });
};
useEffect(() => {
  extractFilterOptions(scheduleData);
}, [scheduleData, allTeachers]); // เพิ่ม allTeachers เป็น dependency

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

// ปรับปรุง applyFilters function
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
            // ปรับปรุงการค้นหาอาจารย์เพื่อรองรับหลายคน
            if (!subCell.classData.teacher) return false;
            
            // แยกชื่ออาจารย์หลายคนที่คั่นด้วย comma หรือ /
            const teacherNames = subCell.classData.teacher
              .split(/[,\/]/)
              .map(name => name.trim())
              .filter(name => name !== '');
            
            // ตรวจสอบว่าชื่ออาจารย์ที่ต้องการค้นหาอยู่ในรายชื่อหรือไม่
            return teacherNames.some(teacherName => 
              teacherName.toLowerCase().includes(tag.value.toLowerCase())
            );

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
      const searchMatch = !searchValue || (() => {
        if (!subCell.classData.teacher) return false;
        
        // ปรับปรุงการค้นหาด้วย search value เพื่อรองรับอาจารย์หลายคน
        const teacherNames = subCell.classData.teacher
          .split(/[,\/]/)
          .map(name => name.trim())
          .filter(name => name !== '');
        
        return teacherNames.some(teacherName => 
          teacherName.toLowerCase().includes(searchValue.toLowerCase())
        );
      })();

      return tagMatch && searchMatch;
    }) || [];

    return {
      ...dayData,
      subCells: filteredSubCells,
    };
  });

  setFilteredScheduleData(filtered);

  // Log การ filter เพื่อ debug
  const totalOriginal = scheduleData.reduce((acc, day) => acc + (day.subCells?.length || 0), 0);
  const totalFiltered = filtered.reduce((acc, day) => acc + (day.subCells?.length || 0), 0);
  
  console.log('🔍 Filter applied:', {
    original: totalOriginal,
    filtered: totalFiltered,
    tags: filterTags.length,
    search: searchValue ? 'yes' : 'no'
  });
};

  // Apply filters whenever filterTags or searchValue changes
  useEffect(() => {
    applyFilters();
  }, [filterTags, searchValue, scheduleData]);

  // Extract filter options whenever scheduleData changes
  useEffect(() => {
    extractFilterOptions(scheduleData);
  }, [scheduleData]);

// =================== TIME FIXED COURSE CHECK FUNCTION ===================
const isTimeFixedCourse = (schedule: ScheduleInterface): boolean => {
  try {
    const isFixed = schedule?.OfferedCourses?.IsFixCourses === true;

    if (isFixed) {
      console.log('🔒 Fixed Course Detected:', {
        courseCode: schedule.OfferedCourses?.AllCourses?.Code,
        courseName: schedule.OfferedCourses?.AllCourses?.ThaiName,
        teacher: `${schedule.OfferedCourses?.User?.Firstname || ''} ${schedule.OfferedCourses?.User?.Lastname || ''}`.trim(),
        scheduleID: schedule.ID
      });
    }

    return isFixed;
  } catch (error) {
    console.error('Error checking Fixed course:', error);
    return false;
  }
};

  // =================== CONFLICT DETECTION FUNCTIONS ===================

// ฟังก์ชันตรวจสอบขัดแย้งแบบครอบคลุม
const checkAllConflicts = (
  newSubCell: SubCell, 
  existingSubCells: SubCell[], 
  excludeSubCellId?: string
): ConflictInfo => {
  const conflictInfo: ConflictInfo = {
    hasConflict: false,
    conflictType: 'time',
    conflictDetails: {},
    conflictingSubCells: []
  };

  const conflicts: ('time' | 'room' | 'teacher')[] = [];

  for (const existingSubCell of existingSubCells) {
    // ข้าม SubCell ที่เป็นตัวเดียวกัน
    if (excludeSubCellId && existingSubCell.id === excludeSubCellId) {
      continue;
    }

    // ตรวจสอบการทับซ้อนของเวลาก่อน
    const timeOverlap = doSubCellsOverlap(newSubCell, existingSubCell);
    
    if (timeOverlap) {
      const isSameSubject = newSubCell.classData.subject === existingSubCell.classData.subject;
      const isSameTeacher = newSubCell.classData.teacher && existingSubCell.classData.teacher &&
                           newSubCell.classData.teacher.trim() !== "" && existingSubCell.classData.teacher.trim() !== "" &&
                           newSubCell.classData.teacher === existingSubCell.classData.teacher;
      const isSameCourseCode = newSubCell.classData.courseCode && existingSubCell.classData.courseCode &&
                              newSubCell.classData.courseCode === existingSubCell.classData.courseCode;

      // เงื่อนไข 1: ถ้าเป็นวิชาเดียวกัน + รหัสเดียวกัน = ไม่ขัดแย้ง (คนละ section)
      if (isSameSubject && isSameCourseCode) {
        console.log('✅ ไม่ขัดแย้ง: วิชาเดียวกัน section ต่างกัน', {
          subject: newSubCell.classData.subject,
          courseCode: newSubCell.classData.courseCode,
          newSection: newSubCell.classData.section,
          existingSection: existingSubCell.classData.section
        });
        continue;
      }

      // เงื่อนไข 2: ตรวจสอบอาจารย์ขัดแย้ง (เอาเงื่อนไขห้องออกแล้ว)
      if (isSameTeacher && !isSameSubject) {
        // อาจารย์เดียวกัน + วิชาต่างกัน = ขัดแย้ง
        if (!conflictInfo.conflictingSubCells.includes(existingSubCell)) {
          conflictInfo.conflictingSubCells.push(existingSubCell);
        }
        conflictInfo.conflictDetails.teacher = {
          conflictingSubCell: existingSubCell,
          teacher: existingSubCell.classData.teacher
        };
        if (!conflicts.includes('teacher')) conflicts.push('teacher');
        console.log('❌ ขัดแย้ง: อาจารย์เดียวกัน วิชาต่างกัน', {
          teacher: newSubCell.classData.teacher,
          newSubject: newSubCell.classData.subject,
          existingSubject: existingSubCell.classData.subject
        });
      }
    }
  }

  // กำหนดประเภทขัดแย้ง
  if (conflicts.length > 0) {
    conflictInfo.hasConflict = true;
    if (conflicts.length === 1) {
      conflictInfo.conflictType = conflicts[0];
    } else {
      conflictInfo.conflictType = 'multiple';
    }
  }

  return conflictInfo;
};

const showConflictModal = (conflictInfo: ConflictInfo, newSubCell: SubCell) => {
  console.log('🚨 showConflictModal called!', conflictInfo);
  
  let title = '';
  let htmlContent = '';
  let conflictDetails: string[] = [];

  // สร้างข้อความตามประเภทขัดแย้ง
  if (conflictInfo.conflictDetails.room) {
    const roomConflict = conflictInfo.conflictDetails.room;
    conflictDetails.push(`🏢 ห้อง "${roomConflict.room}" ถูกใช้โดยวิชาอื่นในเวลาดังกล่าว`);
  }

  if (conflictInfo.conflictDetails.teacher) {
    const teacherConflict = conflictInfo.conflictDetails.teacher;
    conflictDetails.push(`👩‍🏫 อาจารย์ "${teacherConflict.teacher}" มีการสอนวิชาอื่นในเวลาดังกล่าวแล้ว`);
  }

  // กำหนด title และเนื้อหาตามประเภทขัดแย้ง
  if (conflictInfo.conflictType === 'multiple') {
    title = '⚠️ พบการขัดแย้งหลายประการ';
    htmlContent = `<div style="text-align: left; font-family: Sarabun, sans-serif;">
      <p>ไม่สามารถวางวิชา <strong>"${newSubCell.classData.subject}"</strong> ได้ เนื่องจาก:</p>
      <ul style="margin: 10px 0; padding-left: 20px;">
        ${conflictDetails.map(detail => `<li>${detail}</li>`).join('')}
      </ul>
    </div>`;
  } else if (conflictInfo.conflictType === 'room') {
    title = '🏢 ห้องเรียนขัดแย้ง';
    htmlContent = `<div style="text-align: left; font-family: Sarabun, sans-serif;">
      <p>ไม่สามารถวางวิชา <strong>"${newSubCell.classData.subject}"</strong> ได้</p>
      <p>ห้อง "${conflictInfo.conflictDetails.room?.room}" กำลังถูกใช้โดยวิชาอื่นในช่วงเวลานี้</p>
    </div>`;
  } else if (conflictInfo.conflictType === 'teacher') {
    title = '👩‍🏫 อาจารย์ขัดแย้ง';
    htmlContent = `<div style="text-align: left; font-family: Sarabun, sans-serif;">
      <p>ไม่สามารถวางวิชา <strong>"${newSubCell.classData.subject}"</strong> ได้</p>
      <p>อาจารย์ "${conflictInfo.conflictDetails.teacher?.teacher}" กำลังสอนวิชาอื่นในช่วงเวลานี้</p>
    </div>`;
  } else {
    title = '⏰ เวลาขัดแย้ง';
    htmlContent = `<div style="text-align: left; font-family: Sarabun, sans-serif;">
      <p>ไม่สามารถวางวิชา <strong>"${newSubCell.classData.subject}"</strong> ได้ เนื่องจากมีการขัดแย้งเกี่ยวกับเวลา</p>
    </div>`;
  }

  // เพิ่มข้อมูลรายละเอียดวิชาที่ขัดแย้ง
  if (conflictInfo.conflictingSubCells.length > 0) {
    htmlContent += `<div style="margin-top: 15px;">
      <h4 style="color: #1890ff; margin-bottom: 10px;">📚 วิชาที่ขัดแย้ง:</h4>
      <div style="background-color: #f5f5f5; padding: 10px; border-radius: 5px;">`;
    
    conflictInfo.conflictingSubCells.forEach((subCell, index) => {
      htmlContent += `<div style="margin-bottom: 8px; padding: 8px; background-color: white; border-radius: 4px; border-left: 3px solid #ff4d4f;">
        <strong>${index + 1}. ${subCell.classData.subject}</strong>`;
      
      if (subCell.classData.courseCode) {
        htmlContent += ` <span style="color: #666;">(${subCell.classData.courseCode})</span>`;
      }
      
      htmlContent += `<br>
        <span style="font-size: 12px; color: #666;">
          👩‍🏫 ${subCell.classData.teacher}<br>
          🕐 ${subCell.startTime} - ${subCell.endTime}`;
      
      if (subCell.classData.room) {
        htmlContent += ` | 🏢 ${subCell.classData.room}`;
      }
      
      if (subCell.classData.section) {
        htmlContent += ` | กลุ่ม ${subCell.classData.section}`;
      }
      
      htmlContent += `</span></div>`;
    });
    
    htmlContent += `</div></div>`;
  }

  // สร้างคำแนะนำ
  let suggestions = '';
  if (conflictInfo.conflictType === 'room') {
    suggestions = 'ลองเปลี่ยนห้องเรียน หรือเลือกเวลาอื่น';
  } else if (conflictInfo.conflictType === 'teacher') {
    suggestions = 'ลองเลือกเวลาอื่น หรือตรวจสอบตารางสอนของอาจารย์';
  } else if (conflictInfo.conflictType === 'multiple') {
    suggestions = 'ลองเลือกเวลาอื่น หรือเปลี่ยนห้องเรียน หรือตรวจสอบตารางอาจารย์';
  } else {
    suggestions = 'ลองเลือกช่วงเวลาที่ไม่ทับซ้อนกัน';
  }

  // เพิ่มคำแนะนำและหมายเหตุ
  htmlContent += `
    <div style="margin-top: 15px; padding: 12px; background-color: #fff2e8; border-radius: 6px; border: 1px solid #ffec3d;">
      <strong style="color: #d46b08;">💡 คำแนะนำ:</strong> 
      <span style="color: #d46b08; font-size: 12px;">${suggestions}</span>
    </div>
    <div style="margin-top: 8px; padding: 12px; background-color: #e6f7ff; border-radius: 6px; border: 1px solid #91d5ff;">
      <strong style="color: #1890ff;">ℹ️ หมายเหตุ:</strong> 
      <span style="color: #1890ff; font-size: 11px;">วิชาเดียวกัน + อาจารย์เดียวกัน + ห้องเดียวกัน + เวลาเดียวกัน = สามารถวางได้ (กลุ่มต่างกัน)</span>
    </div>
  `;

  // แสดง SweetAlert
  Swal.fire({
    title: title,
    html: htmlContent,
    icon: 'error',
    confirmButtonText: 'เข้าใจแล้ว',
    confirmButtonColor: '#ff4d4f',
    width: '600px',
    padding: '20px',
    customClass: {
      popup: 'swal-custom-popup',
      title: 'swal-custom-title'
    }
  });
};

// ฟังก์ชันตรวจสอบขัดแย้งสำหรับทั้งแถว (ครอบคลุมทุกแถวในวันเดียวกัน)
const checkConflictsAcrossAllRows = (
  newSubCell: SubCell, 
  dayData: ExtendedScheduleData[],
  excludeSubCellId?: string
): ConflictInfo => {
  // รวบรวม SubCell ทั้งหมดในวันเดียวกัน
  const allSubCellsInDay: SubCell[] = [];
  
  dayData
    .filter(row => row.day === newSubCell.day)
    .forEach(row => {
      if (row.subCells) {
        allSubCellsInDay.push(...row.subCells);
      }
    });

  return checkAllConflicts(newSubCell, allSubCellsInDay, excludeSubCellId);
};

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
    // ตรวจสอบขัดแย้งก่อนเพิ่ม
    const conflictInfo = checkConflictsAcrossAllRows(subCell, prevData);
    
    if (conflictInfo.hasConflict) {
      showConflictModal(conflictInfo, subCell);
      return prevData; // ไม่เพิ่มถ้ามีขัดแย้ง
    }
    
    // หาแถวของวันที่เหมาะสม (ไม่มีการซ้อนทับเวลา)
    const dayRows = prevData.filter(row => row.day === day);
    
    let targetRowIndex = -1;
    for (let i = 0; i < dayRows.length; i++) {
      const row = dayRows[i];
      const hasTimeOverlap = (row.subCells || []).some(existingSubCell => 
        doSubCellsOverlap(subCell, existingSubCell)
      );
      
      if (!hasTimeOverlap) {
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
      const isEmptyRow = (newData[targetRowIndex].subCells || []).length === 1;
      
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
    let wasRemoved = false;
    
    for (const dayData of newData) {
      const cellIndex = (dayData.subCells || []).findIndex(cell => cell.id === subCellId);
      if (cellIndex !== -1) {
        dayData.subCells!.splice(cellIndex, 1);
        wasRemoved = true;
        break;
      }
    }
    
    if (wasRemoved) {
      message.success("ลบวิชาออกจากตารางแล้ว (วิชาจะกลับมาพร้อมใช้งานใน sidebar)");
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
    
    // ตรวจสอบขัดแย้งก่อนเพิ่มลงในแถวเป้าหมาย
    const conflictInfo = checkConflictsAcrossAllRows(movedSubCell, newData, subCellId);
    
    if (conflictInfo.hasConflict) {
      // แสดง Modal แจ้งเตือน
      showConflictModal(conflictInfo, movedSubCell);
      
      // ใส่ SubCell กลับไปที่เดิม (rollback)
      for (const dayData of newData) {
        if (dayData.day === subCellToMove.day) {
          if (!dayData.subCells) dayData.subCells = [];
          dayData.subCells.push(subCellToMove);
          break;
        }
      }
      
      return newData;
    }
    
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

  // เพิ่มการเช็คสถานะ drag เพื่อซ่อน tooltip
  const isDragging = draggedSubCell !== null || draggedCourseCard !== null;

  // เพิ่ม function สำหรับดึงข้อมูลห้องแลป
  const getLaboratoryRoom = (subCell: SubCell): string => {
    if (subCell.scheduleId && originalScheduleData) {
      const originalSchedule = originalScheduleData.find(
        (schedule: any) => schedule.ID === subCell.scheduleId
      );
      
      const labRoom = originalSchedule?.OfferedCourses?.Laboratory?.Room;
      return labRoom && labRoom.trim() !== "" ? labRoom : "";
    }
    return "";
  };

  const laboratoryRoom = getLaboratoryRoom(subCell);

  return (
    <div
      key={subCell.id}
      draggable={isScheduler && !isTimeFixed}
      onDragStart={isScheduler && !isTimeFixed ? (e) => handleSubCellDragStart(e, subCell) : undefined}
      onDragEnd={isScheduler && !isTimeFixed ? handleSubCellDragEnd : undefined}
      style={{
        backgroundColor: isTimeFixed ? "#f5f5f5" : subCell.classData.color,
        border: isTimeFixed 
          ? "2px solid #d9d9d9"
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
        color: isTimeFixed ? "#999" : "#333",
        height: `${CELL_CONFIG.FIXED_HEIGHT}px`,
        position: "absolute",
        width: "calc(100% - 4px)",
        left: "2px",
        top: "0px",
        zIndex: shouldSpan ? 10 : 5,
        fontWeight: shouldSpan ? "bold" : "normal",
        boxShadow: isTimeFixed 
          ? "0 2px 6px rgba(153, 153, 153, 0.3)"
          : shouldSpan 
          ? "0 4px 12px rgba(242, 101, 34, 0.4)" 
          : "0 3px 6px rgba(0,0,0,0.15)",
        opacity: isTimeFixed ? 0.7 : (!isScheduler ? 0.8 : 1),
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
            <div style={{ fontWeight: "bold", fontSize: "14px", marginBottom: "6px", color: isTimeFixed ? "#999" : "#F26522" }}>
              {isTimeFixed ? "🔒 Time Fixed Course" : "📚 รายละเอียดวิชา"}
            </div>
            <p><b>🏷️ รหัสวิชา:</b> {subCell.classData.courseCode || "ไม่ระบุ"}</p>
            <p><b>📖 ชื่อวิชา:</b> {subCell.classData.subject || "ไม่ระบุ"}</p>
            <p><b>🎓 ชั้นปี:</b> {subCell.classData.studentYear ? `ปีที่ ${subCell.classData.studentYear}` : "ไม่ระบุ"}</p>
            <p><b>📄 หมู่เรียน:</b> {subCell.classData.section || "ไม่ระบุ"}</p>
            <p><b>👩‍🏫 อาจารย์:</b> {subCell.classData.teacher || "ไม่ระบุ"}</p>
            <p><b>🏢 ห้องเรียน:</b> {subCell.classData.room || "ไม่ระบุ"}</p>
            
            {/* เพิ่มบรรทัดห้องแลป */}
            {laboratoryRoom && (
              <p><b>🔬 ห้องแลป:</b> {laboratoryRoom}</p>
            )}
            
            <p><b>📅 วัน:</b> {subCell.day}</p>
            <p><b>🕐 เวลา:</b> {subCell.startTime} - {subCell.endTime}</p>
            {isTimeFixed && (
              <p style={{ color: "#999", fontSize: "12px", marginTop: "8px", fontWeight: "bold" }}>
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
        trigger={isDragging ? [] : ["hover"]} // แก้ไขให้ซ่อนขณะ drag
        open={isDragging ? false : undefined} // บังคับซ่อนขณะ drag
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
            color: isTimeFixed ? "#aaa" : "inherit"
          }}>
            {subCell.classData.subject}
          </div>
          <div style={{
            fontSize: "7px",
            color: isTimeFixed ? "#bbb" : "#050505ff",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: "100%",
          }}>
            {subCell.classData.courseCode}
          </div>
          <div style={{
            fontSize: "10px",
            color: isTimeFixed ? "#bbb" : "#666",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: "100%",
          }}>
            {subCell.classData.teacher}
          </div>
          <div style={{
            fontSize: "10px",
            color: isTimeFixed ? "#ccc" : "#888",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: "100%",
          }}>
            {subCell.classData.room}
          </div>
        </div>
      </Tooltip>

      {/* TimeFixed Course Lock Icon */}
      {isTimeFixed && (
        <div
          style={{
            position: "absolute",
            top: "4px",
            left: "4px",
            width: duration > 2 ? "22px" : shouldSpan ? "20px" : "18px",
            height: duration > 2 ? "22px" : shouldSpan ? "20px" : "18px",
            backgroundColor: "rgba(153, 153, 153, 0.9)",
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
          title="Time Fixed Course - ถูกล็อกไว้"
        >
          🔒
        </div>
      )}

      {/* "ใช้แล้ว" Badge for TimeFixed */}
      {isTimeFixed && (
        <div
          style={{
            position: "absolute",
            top: "4px",
            right: "4px",
            backgroundColor: "rgba(153, 153, 153, 0.9)",
            color: "white",
            borderRadius: "12px",
            padding: "2px 6px",
            fontSize: "8px",
            fontWeight: "bold",
            border: "1px solid rgba(255,255,255,0.5)"
          }}
        >
          ล็อก
        </div>
      )}

      {/* Delete Button for Scheduler */}
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

      {/* Duration Display */}
      <div style={{
        position: "absolute",
        bottom: "4px",
        left: "4px",
        fontSize: duration > 2 ? "10px" : "9px",
        color: isTimeFixed ? "#aaa" : "#F26522",
        fontWeight: "bold",
        backgroundColor: "rgba(255,255,255,0.95)",
        borderRadius: "4px",
        padding: duration > 1 ? "2px 6px" : "1px 4px",
        border: `1px solid rgba(${isTimeFixed ? '153, 153, 153' : '242, 101, 34'}, 0.4)`
      }}>
        {duration}คาบ
      </div>

      {/* Bottom Color Strip */}
      <div style={{
        position: "absolute",
        left: "0",
        bottom: "0",
        right: "0",
        height: duration > 2 ? "6px" : shouldSpan ? "5px" : "4px",
        backgroundColor: `rgba(${isTimeFixed ? '153, 153, 153' : '242, 101, 34'}, ${0.3 + (duration * 0.1)})`,
        borderRadius: "0 0 6px 6px"
      }} />
      
      {/* Hours Display for Multi-hour Classes */}
      {duration > 1 && (
        <div style={{
          position: "absolute",
          right: "4px",
          bottom: "4px",
          fontSize: "8px",
          color: isTimeFixed ? "#aaa" : "#F26522",
          fontWeight: "bold",
          backgroundColor: "rgba(255,255,255,0.9)",
          borderRadius: "3px",
          padding: "1px 4px",
          border: `1px solid rgba(${isTimeFixed ? '153, 153, 153' : '242, 101, 34'}, 0.3)`
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

  // helper: อ่านชื่ออาจารย์ (รองรับหลายตำแหน่งของ UserAllCourses)
  const getTeacherInfoFromSchedule = (schedule: ScheduleInterface) => {
    const offeredAny = (schedule.OfferedCourses as any) ?? {};

    // 1) UserAllCourses อาจอยู่ใน AllCourses
    const uaFromAll = offeredAny?.AllCourses?.UserAllCourses;
    // 2) หรืออาจอยู่ตรง OfferedCourses
    const uaFromOffered = offeredAny?.UserAllCourses;

    // รวมทั้งสองที่ (ถ้ามี)
    const combined = [
      ...(Array.isArray(uaFromAll) ? uaFromAll : []),
      ...(Array.isArray(uaFromOffered) ? uaFromOffered : []),
    ];

    if (combined.length > 0) {
      const infos = combined
        .map((entry: any) => {
          const userObj = entry?.User;
          const id = userObj?.ID ?? entry?.UserID ?? undefined;
          const name = userObj
            ? `${userObj.Firstname || ""} ${userObj.Lastname || ""}`.trim()
            : (entry?.Username || "");
          return { id, name: name || undefined };
        })
        .filter((x: any) => x.name);

      const uniqueNames = Array.from(new Set(infos.map((i: any) => i.name)));
      const ids = infos.map((i: any) => i.id).filter(Boolean) as number[];

      return { namesJoined: uniqueNames.join(", "), ids };
    }

    // fallback: ถ้ามี OfferedCourses.User (structure เก่า)
    const offeredUser = offeredAny?.User;
    if (offeredUser) {
      const id = offeredUser.ID ?? offeredAny?.UserID ?? undefined;
      const name = `${offeredUser.Firstname || ""} ${offeredUser.Lastname || ""}`.trim() || "ไม่ระบุอาจารย์";
      return { namesJoined: name, ids: id ? [id] : [] as number[] };
    }

    return { namesJoined: "ไม่ระบุอาจารย์", ids: [] as number[] };
  };

  DAYS.forEach((day, dayIndex) => {
    const daySchedules = rawSchedules.filter(item => item.DayOfWeek === day);

    if (daySchedules.length === 0) {
      const firstRow = createEmptyDayRow(day, dayIndex, 0, 2);
      const secondRow = createEmptyDayRow(day, dayIndex, 1, 2);
      secondRow.isFirstRowOfDay = false;
      result.push(firstRow, secondRow);
    } else {
      const subCells: SubCell[] = daySchedules.map((item: ScheduleInterface, index: number) => {
        // แยกเวลา fixed
        const isTimeFixed = isTimeFixedCourse(item);

        const timeFixedCourse = item.TimeFixedCourses && item.TimeFixedCourses.length > 0 ?
          item.TimeFixedCourses.find(tc =>
            tc.Section === item.SectionNumber &&
            tc.ScheduleID === item.ID
          ) : undefined;

        const getRoomInfo = (schedule: ScheduleInterface): string => {
          if (schedule.TimeFixedCourses && schedule.TimeFixedCourses.length > 0) {
            const matchingFixedCourse = schedule.TimeFixedCourses.find(
              (tc: any) => tc.Section === schedule.SectionNumber &&
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

        // ดึงชื่ออาจารย์จากตำแหน่งที่ถูกต้อง
        const teacherInfo = getTeacherInfoFromSchedule(item);
        const teacherName = teacherInfo.namesJoined;

        const classInfo: ClassInfo = {
          subject: item.OfferedCourses?.AllCourses?.ThaiName ||
            item.OfferedCourses?.AllCourses?.EnglishName ||
            item.OfferedCourses?.AllCourses?.Code ||
            "ไม่ทราบชื่อ",
          teacher: teacherName,
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
    
    // วิธีที่ 1: ใช้ type guard (แนะนำ)
    const getErrorMessage = (error: unknown): string => {
      if (error instanceof Error) {
        return error.message;
      }
      if (typeof error === 'string') {
        return error;
      }
      return 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
    };
    
    message.error(`เกิดข้อผิดพลาด: ${getErrorMessage(error)}`);
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
  // ปรับปรุง handleReset function ใหม่
const handleReset = () => {
  // เก็บเฉพาะ TimeFixed Courses ไว้
  const newScheduleData: ExtendedScheduleData[] = [];
  
  // วนลูปผ่าน scheduleData เพื่อหา TimeFixed courses
  DAYS.forEach((day, dayIndex) => {
    // หา TimeFixed courses ในวันนี้
    const timeFixedSubCells: SubCell[] = [];
    
    scheduleData.forEach(dayData => {
      if (dayData.day === day && dayData.subCells) {
        dayData.subCells.forEach(subCell => {
          // เก็บเฉพาะ SubCell ที่เป็น TimeFixed Course
          if (subCell.isTimeFixed === true) {
            timeFixedSubCells.push(subCell);
          }
        });
      }
    });

    if (timeFixedSubCells.length > 0) {
      // สร้างแถวสำหรับ TimeFixed courses
      const rowGroups = separateOverlappingSubCells(timeFixedSubCells);
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

        // สร้าง time slots
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

        newScheduleData.push(dayData);
      });

      // เพิ่ม empty row
      const emptyRowIndex = rowGroups.length;
      const emptyRow = createEmptyDayRow(day, dayIndex, emptyRowIndex, totalRowsForThisDay);
      emptyRow.isFirstRowOfDay = false;
      newScheduleData.push(emptyRow);
    } else {
      // ถ้าไม่มี TimeFixed courses ในวันนี้ ให้สร้าง empty rows
      const firstRow = createEmptyDayRow(day, dayIndex, 0, 2);
      const secondRow = createEmptyDayRow(day, dayIndex, 1, 2);
      secondRow.isFirstRowOfDay = false;
      newScheduleData.push(firstRow, secondRow);
    }
  });

  // อัปเดต schedule data
  setScheduleData(newScheduleData);
  
  // ล้างข้อมูลอื่นๆ
  setCurrentTableName("");
  setIsTableFromAPI(false);
  setOriginalScheduleData([]);
  
  // *** ไม่ลบ course cards ออก ให้คงไว้ทั้งหมด ***
  // courseCards จะยังคงอยู่ แต่ isCourseCardUsed() จะตรวจสอบใหม่จาก newScheduleData
  // ทำให้วิชาที่ไม่ใช่ TimeFixed จะเปลี่ยนเป็นสถานะ "ใช้งานได้" อัตโนมัติ
  
  // ล้าง filters
  clearAllFilters();
  clearAllSidebarFilters();
  
  // นับจำนวน TimeFixed courses ที่เหลืออยู่
  const timeFixedCount = newScheduleData.reduce((count, dayData) => 
    count + (dayData.subCells?.filter(subCell => subCell.isTimeFixed).length || 0), 0
  );
  
  // นับจำนวนวิชาปกติที่กลับมาใช้ได้
  const availableCourses = courseCards.filter(card => !isCourseCardUsed(card));
  
  if (timeFixedCount > 0) {
    message.success(`รีเซตตารางสำเร็จ (เก็บ TimeFixed Courses ไว้ ${timeFixedCount} วิชา, วิชาปกติ ${availableCourses.length} วิชา กลับมาพร้อมใช้งาน)`);
  } else {
    message.success(`รีเซตตารางสำเร็จ (วิชาทั้งหมด ${courseCards.length} วิชา กลับมาพร้อมใช้งาน)`);
  }

  console.log(`🔄 Reset completed. TimeFixed courses preserved: ${timeFixedCount}, Available courses: ${availableCourses.length}`);
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
  
  try {
    const dataUrl = await toPng(node, { 
      cacheBust: true,
      quality: 1.0,
      pixelRatio: 2,
      backgroundColor: 'white'
    });

    const img = new Image();
    img.src = dataUrl;
    
    img.onload = () => {
      const imgWidth = img.width;
      const imgHeight = img.height;

      // คำนวณสัดส่วนของรูป
      const aspectRatio = imgWidth / imgHeight;
      
      // กำหนดความกว้างเท่า A4 (210mm)
      const targetWidth = 210; // A4 width in mm
      const targetHeight = targetWidth / aspectRatio; // คำนวณความสูงตามสัดส่วน
      
      // สร้าง PDF ขนาดที่พอดีกับรูป (custom size)
      const pdf = new jsPDF({
        orientation: targetWidth > targetHeight ? 'l' : 'p',
        unit: 'mm',
        format: [targetWidth, targetHeight] // custom page size
      });
      
      // วางรูปเต็มหน้าไม่มีขอบ
      pdf.addImage(dataUrl, "PNG", 0, 0, targetWidth, targetHeight);
      pdf.save("schedule.pdf");
    };
    
  } catch (error) {
    console.error("Export failed:", error);
    message.error("เกิดข้อผิดพลาดในการส่งออก PDF");
  }
};

const exportScheduleToXLSX = async () => {
  if (!scheduleData || scheduleData.length === 0) {
    message.warning("ไม่มีข้อมูลให้ส่งออก กรุณาสร้างตารางก่อน");
    return;
  }

  const hide = message.loading("กำลังสร้าง Excel...", 0);

  try {
    // ---------- 1) Ensure Buffer exists in browser ----------
    if (typeof (window as any).Buffer === "undefined") {
      try {
        // ถ้าติดตั้ง buffer เป็น dependency จะ import ได้
        // @ts-ignore
        const bufferMod = await import("buffer");
        (window as any).Buffer = bufferMod?.Buffer || (bufferMod as any)?.default?.Buffer;
      } catch (e) {
        // ถ้า import ไม่ได้ ให้โหลด polyfill จาก CDN เป็น fallback
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement("script");
          s.src = "https://cdn.jsdelivr.net/npm/buffer@6.0.3/index.js";
          s.onload = () => resolve();
          s.onerror = (err) => reject(err);
          document.head.appendChild(s);
        });
      }
    }

    // ---------- 2) Load browser build of xlsx-populate ----------
    // @ts-ignore
    const XlsxPopulateModule = await import("xlsx-populate/browser/xlsx-populate.min.js");
    const XlsxPopulate: any = XlsxPopulateModule?.default || XlsxPopulateModule || (window as any).XlsxPopulate;
    if (!XlsxPopulate) throw new Error("ไม่สามารถโหลด xlsx-populate (browser build) ได้");

    // ---------- 3) Build allSubjects map ----------
    interface SubjectInfo {
      subject: string;
      courseCode: string;
      teacher: string;
      section: string;
      studentYear: string;
      room: string;
      capacity: number;
      schedule: Map<string, Array<{ startTime: string; endTime: string; room: string }>>;
      isTimeFixed: boolean;
    }

    const allSubjects = new Map<string, SubjectInfo>();

    scheduleData.forEach((dayData: any) => {
      if (dayData.subCells && dayData.subCells.length > 0) {
        dayData.subCells.forEach((subCell: any) => {
          const key = `${subCell.classData.courseCode || "NO_CODE"}-${subCell.classData.section || "1"}`;
          let capacity = null;
          if (subCell.scheduleId && originalScheduleData) {
            const originalSchedule = originalScheduleData.find((s: any) => s.ID === subCell.scheduleId);
            if (originalSchedule?.OfferedCourses?.Capacity !== undefined) {
              capacity = originalSchedule.OfferedCourses.Capacity;
            }
            allSubjects.set(key, {
              subject: subCell.classData.subject || "ไม่ระบุวิชา",
              courseCode: subCell.classData.courseCode || "N/A",
              teacher: subCell.classData.teacher || "ไม่ระบุอาจารย์",
              section: subCell.classData.section || "1",
              studentYear: subCell.classData.studentYear || "", // keep as string
              room: subCell.classData.room || "ไม่ระบุห้อง",
              capacity,
              schedule: new Map<string, Array<{ startTime: string; endTime: string; room: string }>>(),
              isTimeFixed: !!subCell.isTimeFixed,
            });
          }
          const subjectData = allSubjects.get(key)!;
          if (!subjectData.schedule.has(subCell.day)) subjectData.schedule.set(subCell.day, []);
          subjectData.schedule.get(subCell.day)!.push({
            startTime: subCell.startTime,
            endTime: subCell.endTime,
            room: subCell.classData.room || "ไม่ระบุห้อง",
          });
        });
      }
    });

    if (allSubjects.size === 0) {
      hide();
      message.warning("ไม่มีวิชาที่สามารถส่งออกได้");
      return;
    }

    // ---------- 4) Prepare workbook ----------
    const workbook: any = await XlsxPopulate.fromBlankAsync();

    // helper col index -> letter
    const colToLetter = (col: number) => {
      let s = "";
      let n = col;
      while (n > 0) {
        const m = (n - 1) % 26;
        s = String.fromCharCode(65 + m) + s;
        n = Math.floor((n - 1) / 26);
      }
      return s;
    };

    const compactTimeSlots = [
      "08-09","09-10","10-11","11-12","12-13",
      "13-14","14-15","15-16","16-17","17-18","18-19","19-20","20-21"
    ];

    // --- pre-assign colors so color mapping consistent across sheets ---
    const exportSubjectColors = [
      "FFE5E5","E5F3FF","E5FFE5","FFF5E5","F5E5FF","E5FFF5",
      "FFE5F5","F5FFE5","E5E5FF","FFF5F5","FFE5CC","CCFFE5",
      "E5CCFF","FFCCF5","CCF5FF","F5CCFF","CCFFF5","FFCCCC",
      "CCCCFF","F5F5CC","E5FFCC","CCE5FF","FFCCE5","CCCCE5",
      "E5CCCC","CCFFCC","FFFFCC","FFCCFF","CCFFFF","E5E5CC"
    ];
    const exportSubjectColorMap = new Map<string, string>();
    let exportColorIndex = 0;
    // assign color per courseCode (or key)
    for (const [k, sInfo] of Array.from(allSubjects.entries())) {
      if (!exportSubjectColorMap.has(k)) {
        exportSubjectColorMap.set(k, exportSubjectColors[exportColorIndex % exportSubjectColors.length]);
        exportColorIndex++;
      }
    }
    const getExportSubjectColor = (key: string) => exportSubjectColorMap.get(key) || "FFFFFF";

    // ---------- 5) split subjects into 5 groups in order requested ----------
    const fixedSubjects: Array<[string, SubjectInfo]> = [];
    const year2: Array<[string, SubjectInfo]> = [];
    const year3: Array<[string, SubjectInfo]> = [];
    const year4: Array<[string, SubjectInfo]> = [];
    const others: Array<[string, SubjectInfo]> = [];

    for (const entry of Array.from(allSubjects.entries())) {
      const [k, s] = entry;
      if (s.isTimeFixed) fixedSubjects.push(entry);
      else if (String(s.studentYear) === "2") year2.push(entry);
      else if (String(s.studentYear) === "3") year3.push(entry);
      else if (String(s.studentYear) === "4") year4.push(entry);
      else others.push(entry);
    }

    // sheet definitions in order
    const sheetsDef: { name: string; items: Array<[string, SubjectInfo]> }[] = [
      { name: "Fixed Time", items: fixedSubjects },
      { name: "Year 2", items: year2 },
      { name: "Year 3", items: year3 },
      { name: "Year 4", items: year4 },
      { name: "Others", items: others },
    ];

    // helper to create/populate a sheet
    const createSheetFromItems = (sheet: any, items: Array<[string, SubjectInfo]>) => {
      // headers
      const DAYS_LOCAL = DAYS; // use existing DAYS array
      const header1: string[] = ['วิชา', 'กลุ่ม', 'คน/กลุ่ม', 'อาจารย์'];
      DAYS_LOCAL.forEach((day: string) => {
        header1.push(day);
        for (let i = 1; i < compactTimeSlots.length; i++) header1.push('');
      });
      const header2: string[] = ['รหัส/ชื่อวิชา', 'Section', 'Capacity', 'Teacher'];
      DAYS_LOCAL.forEach(() => compactTimeSlots.forEach(t => header2.push(t)));

      const totalColumns = 4 + (DAYS_LOCAL.length * compactTimeSlots.length);

      // write headers
      for (let c = 1; c <= totalColumns; c++) {
        sheet.cell(`${colToLetter(c)}1`).value(header1[c - 1] || "");
        sheet.cell(`${colToLetter(c)}2`).value(header2[c - 1] || "");
      }

      // merge header days
      let curCol = 5;
      for (let d = 0; d < DAYS_LOCAL.length; d++) {
        const startCol = curCol;
        const endCol = curCol + compactTimeSlots.length - 1;
        sheet.range(`${colToLetter(startCol)}1:${colToLetter(endCol)}1`).merged(true);
        curCol = endCol + 1;
      }

      // column widths & row heights
      sheet.column("A").width(30);
      sheet.column("B").width(8);
      sheet.column("C").width(8);
      sheet.column("D").width(18);
      for (let c = 5; c <= totalColumns; c++) sheet.column(colToLetter(c)).width(6);
      sheet.row(1).height(25);
      sheet.row(2).height(20);

      // header row1 style (only row1)
      const lastColLetter = colToLetter(totalColumns);
      sheet.range(`A1:${lastColLetter}1`).style('fill', 'E3F2FD');
      sheet.range(`A1:${lastColLetter}1`).style('bold', true);
      sheet.range(`A1:${lastColLetter}1`).style('horizontalAlignment', 'center');
      sheet.range(`A1:${lastColLetter}1`).style('verticalAlignment', 'center');

      // if no items, write a "No data" row
      if (items.length === 0) {
        sheet.cell(`A3`).value("ไม่มีข้อมูลใน sheet นี้");
        return;
      }

      // write each subject (2 rows per subject)
      let rowPtr = 3;
      for (const [key, subjectInfo] of items) {
        // row1
        sheet.cell(`A${rowPtr}`).value(subjectInfo.courseCode.length > 12 ? subjectInfo.courseCode.substring(0,12) + "..." : subjectInfo.courseCode);
        sheet.cell(`B${rowPtr}`).value(subjectInfo.section);
        sheet.cell(`C${rowPtr}`).value(subjectInfo.capacity);
        sheet.cell(`D${rowPtr}`).value("");
        // row2
        const subjNameShort = subjectInfo.subject.length > 25 ? subjectInfo.subject.substring(0,25) + "..." : subjectInfo.subject;
        sheet.cell(`A${rowPtr + 1}`).value(subjNameShort);
        sheet.cell(`D${rowPtr + 1}`).value((() => {
          let t = subjectInfo.teacher || "";
          if (t.includes(",")) {
            const arr = t.split(",").map((s: string) => s.trim());
            t = arr.length > 2 ? arr.slice(0,2).join(', ') + " +" + (arr.length - 2) : arr.join(', ');
          }
          return t.length > 20 ? t.substring(0,20) + "..." : t;
        })());

        // merge B and C vertically
        sheet.range(`B${rowPtr}:B${rowPtr + 1}`).merged(true);
        sheet.range(`C${rowPtr}:C${rowPtr + 1}`).merged(true);
        sheet.row(rowPtr).height(20);
        sheet.row(rowPtr + 1).height(20);

        // fill times and color SEC cells using global mapping
        let col = 5;
        for (const day of DAYS_LOCAL) {
          const daySchedule = subjectInfo.schedule.get(day) || [];
          for (const tslot of compactTimeSlots) {
            let cellValue = "";
            const startHour = Number(tslot.split("-")[0]);
            if (daySchedule && daySchedule.length > 0) {
              for (const sch of daySchedule) {
                const sh = parseInt(sch.startTime.split(":" )[0], 10);
                const eh = parseInt(sch.endTime.split(":" )[0], 10);
                if (startHour >= sh && startHour < eh) {
                  cellValue = `SEC:${subjectInfo.section}`;
                  break;
                }
              }
            }
            const cell1 = sheet.cell(`${colToLetter(col)}${rowPtr}`);
            const cell2 = sheet.cell(`${colToLetter(col)}${rowPtr + 1}`);
            cell1.value(cellValue);
            cell2.value("");

            if (cellValue && cellValue.includes("SEC:")) {
              const colorHex = getExportSubjectColor(key); // e.g. "FFE5E5"
              cell1.style("fill", colorHex);
              cell1.style("bold", true);
              cell1.style("horizontalAlignment", "center");
              cell1.style("verticalAlignment", "center");
            } else {
              cell1.style("horizontalAlignment", "center");
              cell1.style("verticalAlignment", "center");
            }
            col++;
          }
        }

        // NOTE: removed fill for subject rows per your request (no blue there)
        rowPtr += 2;
      }
    };

    // ---------- 6) Create sheets in order ----------
    // Use the initial sheet (sheet 0) for the first group, then add others
    let first = true;
    for (const def of sheetsDef) {
      if (first) {
        const sheet = workbook.sheet(0);
        try { sheet.name(def.name); } catch(e) { /* ignore if API differs */ }
        createSheetFromItems(sheet, def.items);
        first = false;
      } else {
        const newSheet = workbook.addSheet(def.name);
        createSheetFromItems(newSheet, def.items);
      }
    }

    // ---------- 7) Output blob and download ----------
    const now = new Date();
    const filename = `ตารางสอน_multiSheets_${now.toISOString().slice(0,19).replace(/[-:]/g,'').replace('T','_')}.xlsx`;
    const outputBlob: Blob = await workbook.outputAsync({ type: "blob" });
    const url = URL.createObjectURL(outputBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    hide();
    message.success(`สร้างไฟล์ Excel: ${filename}`);
  } catch (err) {
    hide();
    console.error("เกิดข้อผิดพลาดในการสร้าง Excel ด้วย xlsx-populate:", err);
    message.error("เกิดข้อผิดพลาดในการสร้างไฟล์ Excel");
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
          <Button
            type="primary"
            style={{ backgroundColor: "#F26522", borderColor: "#F26522" }}
            onClick={exportPDF}
          >
            ส่งออก Pdf
          </Button>   
          <Button
            type="primary"
            style={{ backgroundColor: "#F26522", borderColor: "#F26522" }}
            onClick={exportScheduleToXLSX}
          >
            ส่งออก Xlsx
            {(filterTags.length > 0 || searchValue) && " (กรอง)"}
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