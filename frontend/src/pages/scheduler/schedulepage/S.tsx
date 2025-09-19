// =============================================================================
// IMPORTS
// =============================================================================

import React, { useState, useRef, useEffect, useMemo } from "react";
import "./Schedulepage.css";

// Ant Design Components
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

// Ant Design Icons
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

// Interfaces
import {
  OfferedCoursesInterface,
  ScheduleInterface,
} from "../../../interfaces/Dash";
import { AllTeacher } from "../../../interfaces/Adminpage";
import { 
  OpenCourseInterface, 
  LaboratoryInterface,
  AcademicYearInterface 
} from "../../../interfaces/Adminpage";

// Services
import {
  getSchedulesBynameTable,
  getNameTable,
  postAutoGenerateSchedule,
  deleteSchedulebyNametable,
  putupdateScheduleTime,
} from "../../../services/https/SchedulerPageService";
import { getAllTeachers } from "../../../services/https/AdminPageServices";
import { 
  getOfferedCoursesByMajor, 
  getLaboratory 
} from "../../../services/https/GetService";

// External Libraries
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import Swal from "sweetalert2";

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

// Basic Types
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
  isTimeFixed?: boolean;
  timeFixedId?: number;
}

// Schedule Data Types
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

// Drag and Drop Types
interface DragPreview {
  day: string;
  startSlot: number;
  endSlot: number;
  show: boolean;
}

// Schedule Management Types
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

// Filter Types
interface FilterTag {
  id: string;
  type: 'teacher' | 'studentYear' | 'subject' | 'courseCode' | 'room' | 'laboratory';
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
  laboratories: string[];
}

// Course Card Types
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
  scheduleIds?: number[];
}

// Removed Course Types
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

// Conflict Detection Types
interface ConflictInfo {
  hasConflict: boolean;
  conflictType: 'time' | 'room' | 'teacher' | 'multiple';
  conflictDetails: {
    time?: {
      conflictingSubCell: SubCell;
      reason: string;
    };
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

// =============================================================================
// CONSTANTS
// =============================================================================

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

const SUBJECT_COLORS = [
  "#FFE5E5", "#E5F3FF", "#E5FFE5", "#FFF5E5", "#F5E5FF", "#E5FFF5",
  "#FFE5F5", "#F5FFE5", "#E5E5FF", "#FFF5F5", "#FFE5CC", "#CCFFE5",
  "#E5CCFF", "#FFCCF5", "#CCF5FF", "#F5CCFF", "#CCFFF5", "#FFCCCC",
  "#CCCCFF", "#F5F5CC", "#E5FFCC", "#CCE5FF", "#FFCCE5", "#CCCCE5",
  "#E5CCCC", "#CCFFCC", "#FFFFCC", "#FFCCFF", "#CCFFFF", "#E5E5CC"
];

const FILTER_TAG_COLORS = {
  teacher: '#52c41a',
  studentYear: '#1890ff',
  subject: '#722ed1',
  courseCode: '#f5222d',
  room: '#fa8c16',
  laboratory: '#13c2c2'
};

const CELL_CONFIG = {
  BASE_WIDTH: 85,
  FIXED_HEIGHT: 85,
  MIN_HEIGHT: 100,
  GAP: 2,
  PADDING: 6,
};

// =============================================================================
// SWAL UTILITY FUNCTIONS
// =============================================================================

const showSwalSuccess = (title: string, html?: string, timer: number = 1500) => {
  Swal.fire({
    title,
    html,
    icon: 'success',
    timer,
    timerProgressBar: true,
    showConfirmButton: false,
    toast: true,
    position: 'top-end',
    customClass: {
      popup: 'swal-success-toast'
    }
  });
};

const showSwalWarning = (title: string, html: string) => {
  Swal.fire({
    title,
    html,
    icon: 'warning',
    confirmButtonText: 'เข้าใจแล้ว',
    confirmButtonColor: '#ff9800',
    width: '420px',
    padding: '20px',
    customClass: {
      popup: 'swal-warning-popup',
      title: 'swal-warning-title'
    }
  });
};

const showSwalError = (title: string, html: string) => {
  Swal.fire({
    title,
    html,
    icon: 'error',
    confirmButtonText: 'ปิด',
    confirmButtonColor: '#f44336',
    width: '420px',
    padding: '20px',
    customClass: {
      popup: 'swal-error-popup',
      title: 'swal-error-title'
    }
  });
};

const showSwalInfo = (title: string, html: string, timer?: number) => {
  Swal.fire({
    title,
    html,
    icon: 'info',
    timer: timer || undefined,
    timerProgressBar: timer ? true : false,
    confirmButtonText: 'เข้าใจแล้ว',
    confirmButtonColor: '#2196F3',
    width: '420px',
    padding: '20px',
    customClass: {
      popup: 'swal-info-popup'
    }
  });
};

// =============================================================================
// COLOR UTILITIES
// =============================================================================

const subjectColorMap = new Map<string, string>();
let colorIndex = 0;

const getSubjectColor = (subject: string, courseCode?: string): string => {
  const key = courseCode || subject;
  
  if (!subjectColorMap.has(key)) {
    subjectColorMap.set(key, SUBJECT_COLORS[colorIndex % SUBJECT_COLORS.length]);
    colorIndex++;
  }
  
  return subjectColorMap.get(key)!;
};

// =============================================================================
// TIME UTILITIES
// =============================================================================

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

// =============================================================================
// STUDENT YEAR UTILITIES
// =============================================================================

const normalizeStudentYear = (level: string | number): string => {
  if (!level && level !== 0) return "ทุกชั้นปี";
  
  const levelStr = String(level).trim();
  
  if (/^\d+$/.test(levelStr)) {
    const num = parseInt(levelStr);
    if (num >= 1 && num <= 9) {
      return levelStr;
    }
  }
  
  if (levelStr === 'เรียนได้ทุกชั้นปี') {
    return "ทุกชั้นปี";
  }
  
  const yearMatch = levelStr.match(/ปีที่\s*(\d+)/);
  if (yearMatch) {
    return yearMatch[1];
  }
  
  if (levelStr === "0" || levelStr.toLowerCase() === "all") {
    return "ทุกชั้นปี";
  }
  
  return levelStr;
};

const getDisplayStudentYear = (level: string): string => {
  if (!level) return "ทุกชั้นปี";
  
  const normalizedLevel = normalizeStudentYear(level);
  
  if (/^\d+$/.test(normalizedLevel)) {
    return `ปีที่ ${normalizedLevel}`;
  }
  
  if (normalizedLevel === "ทุกชั้นปี") {
    return "ทุกชั้นปี";
  }
  
  return normalizedLevel;
};

// =============================================================================
// CONFLICT DETECTION UTILITIES
// =============================================================================

const checkSameTeacher = (teacher1?: string, teacher2?: string): boolean => {
  if (!teacher1 || !teacher2 || teacher1.trim() === "" || teacher2.trim() === "") {
    return false;
  }
  
  const teachers1 = teacher1.split(/[,\/]/).map(name => name.trim()).filter(name => name !== '');
  const teachers2 = teacher2.split(/[,\/]/).map(name => name.trim()).filter(name => name !== '');
  
  return teachers1.some(t1 => teachers2.some(t2 => t1 === t2));
};

const checkSameRoom = (room1?: string, room2?: string): boolean => {
  if (!room1 || !room2 || room1.trim() === "" || room2.trim() === "") {
    return false;
  }
  
  if (room1.toUpperCase().includes('TBA') || room2.toUpperCase().includes('TBA')) {
    return false;
  }
  
  return room1.trim() === room2.trim();
};

const doSubCellsOverlap = (subCell1: SubCell, subCell2: SubCell): boolean => {
  if (subCell1.id === subCell2.id) {
    return false;
  }

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
    return true;
  }

  const start1 = subCell1.position.startSlot;
  const end1 = subCell1.position.endSlot;
  const start2 = subCell2.position.startSlot;
  const end2 = subCell2.position.endSlot;

  const overlap = !(end1 <= start2 || end2 <= start1);

  return overlap;
};

// =============================================================================
// FILTER UTILITIES
// =============================================================================

const getFilterTypeLabel = (type: FilterTag['type']): string => {
  switch (type) {
    case 'teacher': return 'อาจารย์';
    case 'studentYear': return 'ชั้นปี';
    case 'subject': return 'วิชา';
    case 'courseCode': return 'รหัสวิชา';
    case 'room': return 'ห้อง';
    case 'laboratory': return 'ห้องแลป';
    default: return type;
  }
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const Schedulepage: React.FC = () => {
  
  // =============================================================================
  // LOCAL STORAGE STATE
  // =============================================================================
  
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

  // =============================================================================
  // SCHEDULE DATA STATE
  // =============================================================================
  
  const [scheduleData, setScheduleData] = useState<ExtendedScheduleData[]>([]);
  const [filteredScheduleData, setFilteredScheduleData] = useState<ExtendedScheduleData[]>([]);
  const [originalScheduleData, setOriginalScheduleData] = useState<any[]>([]);
  const [allNameTable, setAllNameTable] = useState<string[]>([]);
  
  // API Tracking State
  const [currentTableName, setCurrentTableName] = useState("");
  const [isTableFromAPI, setIsTableFromAPI] = useState(false);

  // =============================================================================
  // MODAL STATE
  // =============================================================================
  
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [loadModalVisible, setLoadModalVisible] = useState(false);
  const [scheduleNameToSave, setScheduleNameToSave] = useState("");
  const [deletingName, setDeletingName] = useState<string | null>(null);

  // =============================================================================
  // DRAG & DROP STATE
  // =============================================================================
  
  const [draggedSubCell, setDraggedSubCell] = useState<SubCell | null>(null);
  const [draggedCourseCard, setDraggedCourseCard] = useState<CourseCard | null>(null);
  const [dragPreview, setDragPreview] = useState<DragPreview | null>(null);

  // =============================================================================
  // FILTER STATE
  // =============================================================================
  
  const [filterTags, setFilterTags] = useState<FilterTag[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    teachers: [],
    studentYears: [],
    subjects: [],
    courseCodes: [],
    rooms: [],
    laboratories: []
  });
  const [searchValue, setSearchValue] = useState("");
  const [filterVisible, setFilterVisible] = useState(false);

  // =============================================================================
  // SIDEBAR STATE
  // =============================================================================
  
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(350);
  
  // Sidebar Filter States
  const [sidebarFilterTags, setSidebarFilterTags] = useState<FilterTag[]>([]);
  const [sidebarSearchValue, setSidebarSearchValue] = useState("");
  const [sidebarFilterVisible, setSidebarFilterVisible] = useState(false);

  // =============================================================================
  // COURSE CARD STATE
  // =============================================================================
  
  const [courseCards, setCourseCards] = useState<CourseCard[]>([]);
  const [filteredCourseCards, setFilteredCourseCards] = useState<CourseCard[]>([]);

  // =============================================================================
  // REMOVED COURSES STATE
  // =============================================================================
  
  const [removedCourses, setRemovedCourses] = useState<RemovedCourse[]>([]);
  const [filteredRemovedCourses, setFilteredRemovedCourses] = useState<RemovedCourse[]>([]);
  const [removedSearchValue, setRemovedSearchValue] = useState("");
  const [activeTab, setActiveTab] = useState("available"); // "available" | "removed"

  // =============================================================================
  // REFS
  // =============================================================================
  
  const tableRef = useRef<HTMLDivElement>(null);

  // =============================================================================
  // TEACHER DATA STATE
  // =============================================================================
  
  const [allTeachers, setAllTeachers] = useState<AllTeacher[]>([]);

  // =============================================================================
  // SUB-CELL HELPER FUNCTIONS
  // =============================================================================

  const createSubCell = (
    classData: ClassInfo, 
    day: string, 
    startTime: string, 
    endTime: string,
    scheduleId?: number,
    isTimeFixed: boolean = false,
    timeFixedId?: number
  ): SubCell => {
    const cleanStartTime = startTime.includes('-') ? startTime.split('-')[0] : startTime;
    const cleanEndTime = endTime.includes('-') ? endTime.split('-')[1] || endTime : endTime;
    
    const startSlot = timeToSlotIndex(cleanStartTime);
    const endSlot = timeToSlotIndex(cleanEndTime);
    
    return {
      id: `${day}-${Date.now()}-${Math.random()}`,
      classData: {
        ...classData,
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
      isTimeFixed: isTimeFixed,
      timeFixedId: timeFixedId
    };
  };

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

  const separateOverlappingSubCells = (subCells: SubCell[]): SubCell[][] => {
    if (subCells.length === 0) return [[]];
    
    const rows: SubCell[][] = [];
    const sortedSubCells = [...subCells].sort((a, b) => a.position.startSlot - b.position.startSlot);
    
    for (const subCell of sortedSubCells) {
      let placed = false;
      
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
      
      if (!placed) {
        rows.push([subCell]);
      }
    }

    return rows;
  };

  // =============================================================================
  // COURSE CARD HELPER FUNCTIONS
  // =============================================================================

  const getCourseCardUsageInfo = (courseCard: CourseCard): { usedDuration: number; totalDuration: number; isFullyUsed: boolean } => {
    const usedPeriods = new Set<string>();
    
    scheduleData.forEach(dayData => {
      dayData.subCells?.forEach(subCell => {
        let isMatch = false;
        
        if (courseCard.scheduleIds && Array.isArray(courseCard.scheduleIds) && subCell.scheduleId) {
          isMatch = courseCard.scheduleIds.includes(subCell.scheduleId);
        }
        else if (courseCard.scheduleId && subCell.scheduleId) {
          isMatch = subCell.scheduleId === courseCard.scheduleId;
        }
        
        if (!isMatch) {
          const subjectMatch = subCell.classData.subject === courseCard.subject;
          const courseCodeMatch = subCell.classData.courseCode === courseCard.courseCode;
          const sectionMatch = subCell.classData.section === courseCard.section;
          
          let teacherMatch = false;
          if (subCell.classData.teacher && courseCard.teacher) {
            const subCellTeachers = subCell.classData.teacher.split(/[,\/]/).map(name => name.trim());
            const courseCardTeachers = courseCard.teacher.split(/[,\/]/).map(name => name.trim());
            
            teacherMatch = subCellTeachers.some(subTeacher => 
              courseCardTeachers.some(cardTeacher => 
                subTeacher === cardTeacher
              )
            );
          }
          
          isMatch = subjectMatch && courseCodeMatch && sectionMatch && teacherMatch;
        }
        
        if (isMatch) {
          for (let slot = subCell.position.startSlot; slot < subCell.position.endSlot; slot++) {
            const periodKey = `${subCell.day}-${slot}`;
            usedPeriods.add(periodKey);
          }
        }
      });
    });
    
    const usedDuration = usedPeriods.size;
    
    return {
      usedDuration,
      totalDuration: courseCard.duration,
      isFullyUsed: usedDuration >= courseCard.duration
    };
  };

  const isCourseCardUsed = (courseCard: CourseCard): boolean => {
    const usageInfo = getCourseCardUsageInfo(courseCard);
    return usageInfo.isFullyUsed;
  };

  // =============================================================================
  // TIME FIXED COURSE HELPER
  // =============================================================================

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

  // =============================================================================
  // SCHEDULE DATA TRANSFORMATION
  // =============================================================================

  const transformScheduleDataWithRowSeparation = (rawSchedules: ScheduleInterface[]): ExtendedScheduleData[] => {
    const result: ExtendedScheduleData[] = [];

    const getTeacherInfoFromSchedule = (schedule: ScheduleInterface) => {
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
        const subCells: SubCell[] = daySchedules.map((item: ScheduleInterface) => {
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

          const getStudentYearFromLevel = (schedule: ScheduleInterface): string => {
            const level = (schedule.OfferedCourses?.AllCourses as any)?.AcademicYear?.Level;
            return normalizeStudentYear(level);
          };

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
            studentYear: getStudentYearFromLevel(item),
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

  // =============================================================================
  // API FUNCTIONS
  // =============================================================================

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

  const getSchedules = async () => {
    if (!major_name || !academicYear || !term) {
      console.warn('Missing required parameters for getSchedules:', { major_name, academicYear, term });
      return;
    }

    try {
      const res = await getSchedulesBynameTable(major_name, academicYear, term);
      if (res && Array.isArray(res.data)) {
        console.log('📊 Raw schedule data from API:', res.data);
        
        const typedSchedules = res.data as ScheduleInterface[];
        
        const newScheduleData = transformScheduleDataWithRowSeparation(typedSchedules);
        setScheduleData(newScheduleData);
        
        setOriginalScheduleData(res.data);
        const nameTable = `ปีการศึกษา ${academicYear} เทอม ${term}`;
        setCurrentTableName(nameTable);
        setIsTableFromAPI(true);
        
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

  const loadInitialFilterData = async () => {
    const currentMajor = localStorage.getItem("major_name");
    const currentAcademicYear = localStorage.getItem("academicYear");
    const currentTerm = localStorage.getItem("term");

    if (!currentMajor || !currentAcademicYear || !currentTerm) {
      console.log('Missing required data for initial filter load:', { 
        currentMajor, 
        currentAcademicYear, 
        currentTerm 
      });
      return;
    }

    try {
      console.log('🔄 Loading initial filter data from APIs...');
      
      const results = await Promise.allSettled([
        getOfferedCoursesByMajor(currentMajor, parseInt(currentAcademicYear), parseInt(currentTerm)),
        getLaboratory()
      ]);

      const subjects = new Set<string>();
      const courseCodes = new Set<string>();
      const teachers = new Set<string>();
      const rooms = new Set<string>();
      const studentYears = new Set<string>();
      const laboratories = new Set<string>();

      // Process OpenCourse API results
      if (results[0].status === 'fulfilled' && results[0].value?.status === 200) {
        const openCourses: OpenCourseInterface[] = results[0].value.data;
        
        openCourses.forEach(course => {
          if (course.CourseName) {
            subjects.add(course.CourseName);
          }
          
          if (course.Code) {
            courseCodes.add(course.Code);
          }
          
          if (course.Teachers && course.Teachers.length > 0) {
            course.Teachers.forEach(teacher => {
              const fullName = `${teacher.Title || ''} ${teacher.Firstname} ${teacher.Lastname}`.trim();
              if (fullName) {
                teachers.add(fullName);
              }
            });
          }
          
          if (course.GroupInfos && course.GroupInfos.length > 0) {
            course.GroupInfos.forEach(group => {
              if (group.Room && group.Room.trim() !== '') {
                rooms.add(group.Room.trim());
              }
            });
          }
          
          if (course.Code) {
            const yearMatch = course.Code.match(/[A-Z]+(\d)/);
            if (yearMatch && yearMatch[1]) {
              const year = yearMatch[1];
              if (['1', '2', '3', '4'].includes(year)) {
                studentYears.add(year);
              }
            }
          }
        });

        console.log('✅ OpenCourse data loaded:', {
          subjects: subjects.size,
          courseCodes: courseCodes.size, 
          teachers: teachers.size,
          rooms: rooms.size,
          studentYears: studentYears.size,
          totalCourses: openCourses.length
        });
      }

      // Process Laboratory API results
      if (results[1].status === 'fulfilled' && results[1].value?.status === 200) {
        const laboratoryData: LaboratoryInterface[] = results[1].value.data;
        
        laboratoryData.forEach(lab => {
          if (lab.Room && lab.Room.trim() !== '') {
            laboratories.add(lab.Room.trim());
          }
        });

        console.log('✅ Laboratory data loaded:', {
          laboratories: laboratories.size,
          totalLabs: laboratoryData.length
        });
      }

      // Update filter options
      setFilterOptions(prevOptions => ({
        ...prevOptions,
        subjects: Array.from(subjects).filter(Boolean).sort(),
        courseCodes: Array.from(courseCodes).filter(Boolean).sort(),
        rooms: Array.from(rooms).filter(Boolean).sort(),
        studentYears: Array.from(studentYears).sort(),
        laboratories: Array.from(laboratories).filter(Boolean).sort(),
        teachers: [
          ...extractTeachersFromAPI(),
          ...Array.from(teachers).filter(Boolean)
        ].filter((teacher, index, array) => array.indexOf(teacher) === index).sort(),
      }));
      
      console.log('✅ All initial filter data loaded successfully');
      
    } catch (error) {
      console.error('❌ Error loading initial filter data:', error);
    }
  };

  const extractTeachersFromAPI = () => {
    const teachers = new Set<string>();
    const currentMajor = localStorage.getItem("major_name");
    
    allTeachers.forEach(teacher => {
      const fullName = `${teacher.Firstname} ${teacher.Lastname}`.trim();
      
      const shouldInclude = !currentMajor || 
                           !teacher.Major || 
                           teacher.Major === currentMajor ||
                           teacher.Major === "" ||
                           teacher.Major === "SutAdmin";
      
      if (fullName && fullName !== '' && shouldInclude) {
        teachers.add(fullName);
      }
    });

    return Array.from(teachers).filter(Boolean).sort();
  };

  // =============================================================================
  // SCHEDULE MANAGEMENT FUNCTIONS
  // =============================================================================

  const findScheduleChanges = (): ScheduleChange[] => {
    const changes: ScheduleChange[] = [];

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

  const updateExistingSchedule = async () => {
    const hide = message.loading("กำลังอัปเดตตาราง...", 0);
    
    try {
      const changes = findScheduleChanges();

      if (changes.length === 0) {
        hide();
        message.info("ไม่มีการเปลี่ยนแปลงในตาราง");
        setSaveModalVisible(false);
        setScheduleNameToSave("");
        return;
      }

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

  const updateSchedulesIndividually = async (changes: ScheduleChange[]) => {
    let successCount = 0;
    let errorCount = 0;

    for (const change of changes) {
      try {
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

  // =============================================================================
  // MODAL HANDLERS
  // =============================================================================

  const handleSaveConfirm = async () => {
    if (!scheduleNameToSave.trim()) {
      message.error("กรุณาใส่ชื่อตาราง");
      return;
    }

    if (scheduleData.length === 0) {
      message.error("ไม่มีข้อมูลตารางให้บันทึก");
      return;
    }

    if (!isTableFromAPI || !currentTableName) {
      message.warning("สามารถบันทึกได้เฉพาะตารางที่มาจาก 'สร้างอัตโนมัติ' หรือ 'โหลด' เท่านั้น");
      return;
    }

    if (scheduleNameToSave !== currentTableName) {
      message.error(`กรุณาใช้ชื่อตาราง "${currentTableName}" ไม่สามารถเปลี่ยนชื่อได้`);
      return;
    }

    try {
      await updateExistingSchedule();
    } catch (error) {
      console.error('Save error:', error);
      
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

  const handleLoadSchedule = async (scheduleName: string) => {
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
        
        const typedSchedules = res.data as ScheduleInterface[];
        
        const newScheduleData = transformScheduleDataWithRowSeparation(typedSchedules);
        setScheduleData(newScheduleData);
        
        setOriginalScheduleData(res.data);
        setCurrentTableName(scheduleName);
        setIsTableFromAPI(true);
        
        generateCourseCardsFromAPI(typedSchedules);
        
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
        setCourseCards([]);
        setRemovedCourses([]);
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

  const handleReset = () => {
    const newScheduleData: ExtendedScheduleData[] = [];
    
    DAYS.forEach((day, dayIndex) => {
      const timeFixedSubCells: SubCell[] = [];
      
      scheduleData.forEach(dayData => {
        if (dayData.day === day && dayData.subCells) {
          dayData.subCells.forEach(subCell => {
            if (subCell.isTimeFixed === true) {
              timeFixedSubCells.push(subCell);
            }
          });
        }
      });

      if (timeFixedSubCells.length > 0) {
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

        const emptyRowIndex = rowGroups.length;
        const emptyRow = createEmptyDayRow(day, dayIndex, emptyRowIndex, totalRowsForThisDay);
        emptyRow.isFirstRowOfDay = false;
        newScheduleData.push(emptyRow);
      } else {
        const firstRow = createEmptyDayRow(day, dayIndex, 0, 2);
        const secondRow = createEmptyDayRow(day, dayIndex, 1, 2);
        secondRow.isFirstRowOfDay = false;
        newScheduleData.push(firstRow, secondRow);
      }
    });

    setScheduleData(newScheduleData);
    setCurrentTableName("");
    setIsTableFromAPI(false);
    setOriginalScheduleData([]);
    
    clearAllFilters();
    clearAllSidebarFilters();
    
    const timeFixedCount = newScheduleData.reduce((count, dayData) => 
      count + (dayData.subCells?.filter(subCell => subCell.isTimeFixed).length || 0), 0
    );
    
    const availableCourses = courseCards.filter(card => !isCourseCardUsed(card));
    
    if (timeFixedCount > 0) {
      showSwalSuccess(
        'รีเซตสำเร็จ ✅',
        `รีเซตตารางเสร็จแล้ว<br>
         <div style="margin: 8px 0; padding: 8px; background: #e3f2fd; border-radius: 4px;">
           🔒 <strong>TimeFixed Courses:</strong> ${timeFixedCount} วิชา (เก็บไว้)<br>
           📚 <strong>วิชาปกติ:</strong> ${availableCourses.length} วิชา (พร้อมใช้งาน)
         </div>`,
        2500
      );
    } else {
      showSwalSuccess(
        'รีเซตสำเร็จ ✅',
        `รีเซตตารางเสร็จแล้ว<br>
         <div style="margin: 8px 0; padding: 8px; background: #e3f2fd; border-radius: 4px;">
           📚 <strong>วิชาทั้งหมด:</strong> ${courseCards.length} วิชา<br>
           <small style="color: #1976D2;">พร้อมใช้งานใน sidebar</small>
         </div>`,
        2000
      );
    }

    console.log(`🔄 Reset completed. TimeFixed courses preserved: ${timeFixedCount}, Available courses: ${availableCourses.length}`);
  };

  // =============================================================================
  // DRAG & DROP EVENT HANDLERS
  // =============================================================================

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

  const handleCourseCardDragStart = (e: React.DragEvent, courseCard: CourseCard) => {
    if (role !== "Scheduler") {
      e.preventDefault();
      showSwalWarning(
        'ไม่มีสิทธิ์เข้าถึง',
        `เฉพาะ <strong>Scheduler</strong> เท่านั้นที่สามารถลากวิชาไปใส่ในตารางได้<br><br>
         <small style="color: #666;">💡 กรุณาติดต่อผู้ดูแลระบบเพื่อขอสิทธิ์</small>`
      );
      return;
    }

    if (isCourseCardUsed(courseCard)) {
      e.preventDefault();
      showSwalWarning(
        'วิชาถูกใช้แล้ว',
        `วิชา <strong>"${courseCard.subject}"</strong><br>
         ถูกใช้ในตารางครบแล้ว ไม่สามารถลากได้อีก<br><br>
         <small style="color: #666;">📊 สถานะ: ใช้ครบ ${courseCard.duration} คาบ</small>`
      );
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

  const handleCellDragOver = (e: React.DragEvent, targetRow: ExtendedScheduleData, timeSlot: string) => {
    if (role !== "Scheduler") {
      e.preventDefault();
      return;
    }
    
    e.preventDefault();
    
    const slotIndex = timeToSlotIndex(timeSlot.split('-')[0]);
    let duration = 1;
    
    if (draggedSubCell) {
      duration = draggedSubCell.position.endSlot - draggedSubCell.position.startSlot;
    }
    
    setDragPreview({
      day: targetRow.day,
      startSlot: slotIndex,
      endSlot: slotIndex + duration,
      show: true
    });
  };

  const handleCellDragLeave = () => {
    setDragPreview(prev => prev ? { ...prev, show: false } : null);
  };

  const handleCellDrop = (e: React.DragEvent, targetRow: ExtendedScheduleData, timeSlot: string) => {
    e.preventDefault();
    
    if (role !== "Scheduler") {
      showSwalWarning(
        'ไม่มีสิทธิ์แก้ไข',
        'เฉพาะ <strong>Scheduler</strong> เท่านั้นที่สามารถย้ายตารางเรียนได้'
      );
      setDraggedCourseCard(null);
      setDraggedSubCell(null);
      setDragPreview(null);
      return;
    }
    
    const slotIndex = timeToSlotIndex(timeSlot.split('-')[0]);
    
    if (draggedCourseCard) {
      const startTime = slotIndexToTime(slotIndex);
      const endTime = slotIndexToTime(slotIndex + 1);
      
      const duplicateCheck = checkDuplicateInSameTimeForCourseCard(
        draggedCourseCard, 
        targetRow.day, 
        slotIndex, 
        scheduleData
      );
      
      if (duplicateCheck.isDuplicate) {
        showSwalWarning(
          'วิชาซ้ำในเวลาเดียวกัน',
          `ไม่สามารถวางวิชา <strong>"${draggedCourseCard.subject}"</strong><br>หมู่ <strong>${draggedCourseCard.section}</strong> ซ้ำในเวลาเดียวกันได้`
        );
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
        showSwalWarning(
          'วิชาใช้ครบแล้ว',
          `วิชา <strong>"${draggedCourseCard.subject}"</strong> ถูกใช้ครบ ${draggedCourseCard.duration} คาบแล้ว`
        );
        setDraggedCourseCard(null);
        setDragPreview(null);
        return;
      }
      
      console.log(`🚀 Adding SubCell to ${targetRow.day} using Auto-Generate logic`);
      
      addSubCellToDay(targetRow.day, newSubCell);
      
      setDraggedCourseCard(null);
      setDragPreview(null);
      
      const newUsageInfo = getCourseCardUsageInfo(draggedCourseCard);
      const remainingPeriods = draggedCourseCard.duration - newUsageInfo.usedDuration;
      
      if (remainingPeriods > 0) {
        showSwalSuccess(
          'เพิ่มวิชาสำเร็จ',
          `วิชา <strong>${draggedCourseCard.subject}</strong><br>
           ใช้ไปแล้ว: ${newUsageInfo.usedDuration}/${draggedCourseCard.duration} คาบ<br>
           เหลืออีก: <strong>${remainingPeriods} คาบ</strong>`,
          2000
        );
      } else {
        showSwalSuccess(
          'เพิ่มวิชาครบแล้ว ✅',
          `วิชา <strong>${draggedCourseCard.subject}</strong><br>
           ใช้ครบ ${draggedCourseCard.duration} คาบแล้ว`,
          2500
        );
      }
      
    } else if (draggedSubCell) {
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
      showSwalSuccess(
        'ย้ายวิชาสำเร็จ',
        `ย้ายวิชา <strong>${draggedSubCell.classData.subject}</strong> แล้ว`
      );
    }
  };

  // =============================================================================
  // FILTER FUNCTIONS
  // =============================================================================

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

    console.log('🏷️ Adding filter tag:', newTag);
    setFilterTags(prev => [...prev, newTag]);
  };

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

    console.log('🏷️ Adding sidebar filter tag:', newTag);
    setSidebarFilterTags(prev => [...prev, newTag]);
  };

  const removeFilterTag = (tagId: string) => {
    setFilterTags(prev => prev.filter(tag => tag.id !== tagId));
  };

  const removeSidebarFilterTag = (tagId: string) => {
    setSidebarFilterTags(prev => prev.filter(tag => tag.id !== tagId));
  };

  const clearAllFilters = () => {
    setFilterTags([]);
    setSearchValue("");
  };

  const clearAllSidebarFilters = () => {
    setSidebarFilterTags([]);
    setSidebarSearchValue("");
  };

  const applyFilters = () => {
    if (filterTags.length === 0 && !searchValue) {
      setFilteredScheduleData(scheduleData);
      return;
    }

    const filtered = scheduleData.map(dayData => {
      const filteredSubCells = dayData.subCells?.filter(subCell => {
        const tagMatch = filterTags.length === 0 || filterTags.every(tag => {
          switch (tag.type) {
            case 'teacher':
              if (!subCell.classData.teacher) return false;
              
              const teacherNames = subCell.classData.teacher
                .split(/[,\/]/)
                .map(name => name.trim())
                .filter(name => name !== '');
              
              return teacherNames.some(teacherName => 
                teacherName.toLowerCase().includes(tag.value.toLowerCase())
              );

            case 'studentYear':
              const scheduleFromOriginal = originalScheduleData.find(
                (original: any) => original.ID === subCell.scheduleId
              );

              if (scheduleFromOriginal) {
                const level = scheduleFromOriginal.OfferedCourses?.AllCourses?.AcademicYear?.Level;

                if (level) {
                  if (level === 'เรียนได้ทุกชั้นปี') {
                    return tag.value === "ทุกชั้นปี";
                  }
                  
                  if (/^\d+$/.test(level)) {
                    return level === tag.value;
                  }
                  
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

            case 'laboratory':
              if (subCell.scheduleId && originalScheduleData) {
                const originalSchedule = originalScheduleData.find(
                  (schedule: any) => schedule.ID === subCell.scheduleId
                );
                
                const labRoom = originalSchedule?.OfferedCourses?.Laboratory?.Room;
                if (labRoom && labRoom.trim() !== "") {
                  return labRoom.toLowerCase().includes(tag.value.toLowerCase());
                }
              }
              return false;

            default:
              return true;
          }
        });

        const searchMatch = !searchValue || (() => {
          if (!subCell.classData.teacher) return false;
          
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
  };

  const applySidebarFilters = () => {
    if (sidebarFilterTags.length === 0 && !sidebarSearchValue) {
      setFilteredCourseCards(courseCards);
      return;
    }

    const filtered = courseCards.filter(courseCard => {
      const tagMatch = sidebarFilterTags.length === 0 || sidebarFilterTags.every(tag => {
        switch (tag.type) {
          case 'teacher':
            return courseCard.teacher
              .toLowerCase()
              .includes(tag.value.toLowerCase());
              
          case 'studentYear':
            if (courseCard.scheduleIds && Array.isArray(courseCard.scheduleIds)) {
              return courseCard.scheduleIds.some(scheduleId => {
                const originalSchedule = originalScheduleData.find(
                  (schedule: any) => schedule.ID === scheduleId
                );
                
                if (originalSchedule) {
                  const level = originalSchedule?.OfferedCourses?.AllCourses?.AcademicYear?.Level;
                  if (level) {
                    const normalizedLevel = normalizeStudentYear(level);
                    return normalizedLevel === tag.value;
                  }
                }
                return false;
              });
            } else if (courseCard.scheduleId) {
              const originalSchedule = originalScheduleData.find(
                (schedule: any) => schedule.ID === courseCard.scheduleId
              );
              
              if (originalSchedule) {
                const level = originalSchedule?.OfferedCourses?.AllCourses?.AcademicYear?.Level;
                if (level) {
                  const normalizedLevel = normalizeStudentYear(level);
                  return normalizedLevel === tag.value;
                }
              }
            }
            
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
              
          case 'laboratory':
            if (courseCard.scheduleIds && Array.isArray(courseCard.scheduleIds)) {
              return courseCard.scheduleIds.some(scheduleId => {
                const originalSchedule = originalScheduleData.find(
                  (schedule: any) => schedule.ID === scheduleId
                );
                const labRoom = originalSchedule?.OfferedCourses?.Laboratory?.Room;
                return labRoom && labRoom.toLowerCase().includes(tag.value.toLowerCase());
              });
            } else if (courseCard.scheduleId) {
              const originalSchedule = originalScheduleData.find(
                (schedule: any) => schedule.ID === courseCard.scheduleId
              );
              const labRoom = originalSchedule?.OfferedCourses?.Laboratory?.Room;
              return labRoom && labRoom.toLowerCase().includes(tag.value.toLowerCase());
            }
            return false;
            
          default:
            return true;
        }
      });

      const searchMatch = !sidebarSearchValue || 
        courseCard.teacher.toLowerCase().includes(sidebarSearchValue.toLowerCase()) ||
        courseCard.subject.toLowerCase().includes(sidebarSearchValue.toLowerCase()) ||
        courseCard.courseCode.toLowerCase().includes(sidebarSearchValue.toLowerCase());

      return tagMatch && searchMatch;
    });

    setFilteredCourseCards(filtered);
  };

  const extractFilterOptions = (data: ExtendedScheduleData[]) => {
    const teachers = new Set(filterOptions.teachers);
    const studentYears = new Set(filterOptions.studentYears);
    const subjects = new Set(filterOptions.subjects);
    const courseCodes = new Set(filterOptions.courseCodes);
    const rooms = new Set(filterOptions.rooms);
    const laboratories = new Set(filterOptions.laboratories);

    data.forEach(dayData => {
      dayData.subCells?.forEach(subCell => {
        if (subCell.classData.teacher) {
          const teacherNames = subCell.classData.teacher.split(',').map(name => name.trim());
          teacherNames.forEach(name => {
            if (name && name !== '') {
              teachers.add(name);
            }
          });
        }
        
        if (subCell.scheduleId && originalScheduleData) {
          const originalSchedule = originalScheduleData.find(
            (schedule: any) => schedule.ID === subCell.scheduleId
          );
          
          if (originalSchedule) {
            const level = originalSchedule?.OfferedCourses?.AllCourses?.AcademicYear?.Level;
            if (level) {
              const normalizedLevel = normalizeStudentYear(level);
              studentYears.add(normalizedLevel);
            }
          }
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

        if (subCell.scheduleId && originalScheduleData) {
          const originalSchedule = originalScheduleData.find(
            (schedule: any) => schedule.ID === subCell.scheduleId
          );
          
          const labRoom = originalSchedule?.OfferedCourses?.Laboratory?.Room;
          if (labRoom && labRoom.trim() !== "") {
            laboratories.add(labRoom.trim());
          }
        }
      });
    });

    const validYears = Array.from(studentYears).filter(year => {
      if (year === "ทุกชั้นปี") return true;
      const num = parseInt(year);
      return !isNaN(num) && num >= 1 && num <= 9;
    });

    setFilterOptions(prevOptions => ({
      teachers: Array.from(teachers).filter(Boolean).sort(),
      studentYears: validYears.sort((a, b) => {
        if (a === "ทุกชั้นปี") return 1;
        if (b === "ทุกชั้นปี") return -1;
        const numA = parseInt(a);
        const numB = parseInt(b);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return a.localeCompare(b);
      }),
      subjects: Array.from(subjects).filter(Boolean).sort(),
      courseCodes: Array.from(courseCodes).filter(Boolean).sort(),
      rooms: Array.from(rooms).filter(Boolean).sort(),
      laboratories: Array.from(laboratories).filter(Boolean).sort()
    }));
  };

  // =============================================================================
  // CONFLICT DETECTION FUNCTIONS
  // =============================================================================

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

    console.log('🔍 Starting conflict check:', {
      newSubCell: {
        id: newSubCell.id,
        subject: newSubCell.classData.subject,
        section: newSubCell.classData.section,
        teacher: newSubCell.classData.teacher,
        time: `${newSubCell.startTime}-${newSubCell.endTime}`,
        day: newSubCell.day
      },
      excludeSubCellId,
      existingCount: existingSubCells.length
    });

    for (const existingSubCell of existingSubCells) {
      if (excludeSubCellId && existingSubCell.id === excludeSubCellId) {
        console.log('⭐️ Skipping excluded SubCell:', existingSubCell.id);
        continue;
      }

      const timeOverlap = doSubCellsOverlap(newSubCell, existingSubCell);
      
      console.log('⏰ Time overlap check:', {
        existing: {
          id: existingSubCell.id,
          subject: existingSubCell.classData.subject,
          section: existingSubCell.classData.section,
          time: `${existingSubCell.startTime}-${existingSubCell.endTime}`
        },
        hasOverlap: timeOverlap
      });

      if (timeOverlap) {
        const isSameSubject = newSubCell.classData.subject === existingSubCell.classData.subject;
        const isSameCourseCode = newSubCell.classData.courseCode === existingSubCell.classData.courseCode;
        const isSameSection = newSubCell.classData.section === existingSubCell.classData.section;
        
        const isSameTeacher = checkSameTeacher(newSubCell.classData.teacher, existingSubCell.classData.teacher);
        
        console.log('📊 Comparison results:', {
          isSameSubject,
          isSameCourseCode,
          isSameSection,
          isSameTeacher,
          newSection: newSubCell.classData.section,
          existingSection: existingSubCell.classData.section
        });

        if (isSameSubject && isSameCourseCode && isSameSection) {
          console.log('❌ CONFLICT: Same subject, same section in same time');
          
          if (!conflictInfo.conflictingSubCells.includes(existingSubCell)) {
            conflictInfo.conflictingSubCells.push(existingSubCell);
          }
          
          conflictInfo.conflictDetails.time = {
            conflictingSubCell: existingSubCell,
            reason: `วิชา "${newSubCell.classData.subject}" หมู่ ${newSubCell.classData.section} ห้ามจัดซ้ำในเวลาเดียวกัน`
          };
          
          if (!conflicts.includes('time')) conflicts.push('time');
          continue;
        }

        if (isSameSubject && isSameCourseCode && !isSameSection) {
          console.log('✅ ALLOWED: Same subject, different sections');
          continue;
        }

        if (isSameTeacher && !isSameSubject) {
          console.log('❌ CONFLICT: Same teacher, different subjects');
          
          if (!conflictInfo.conflictingSubCells.includes(existingSubCell)) {
            conflictInfo.conflictingSubCells.push(existingSubCell);
          }
          
          conflictInfo.conflictDetails.teacher = {
            conflictingSubCell: existingSubCell,
            teacher: existingSubCell.classData.teacher
          };
          
          if (!conflicts.includes('teacher')) conflicts.push('teacher');
        }

        const isSameRoom = checkSameRoom(newSubCell.classData.room, existingSubCell.classData.room);
        
        if (isSameRoom && !isSameSubject && !isSameTeacher) {
          console.log('⚠️ CONFLICT: Same room usage');
          
          if (!conflictInfo.conflictingSubCells.includes(existingSubCell)) {
            conflictInfo.conflictingSubCells.push(existingSubCell);
          }
          
          conflictInfo.conflictDetails.room = {
            conflictingSubCell: existingSubCell,
            room: existingSubCell.classData.room
          };
          
          if (!conflicts.includes('room')) conflicts.push('room');
        }
      }
    }

    if (conflicts.length > 0) {
      conflictInfo.hasConflict = true;
      if (conflicts.length === 1) {
        conflictInfo.conflictType = conflicts[0];
      } else {
        conflictInfo.conflictType = 'multiple';
      }
      
      console.log('🚨 CONFLICTS DETECTED:', {
        conflictType: conflictInfo.conflictType,
        conflictDetails: conflictInfo.conflictDetails,
        conflictingCount: conflictInfo.conflictingSubCells.length
      });
    } else {
      console.log('✅ NO CONFLICTS FOUND');
    }

    return conflictInfo;
  };

  const checkConflictsAcrossAllRows = (
    newSubCell: SubCell, 
    dayData: ExtendedScheduleData[],
    excludeSubCellId?: string
  ): ConflictInfo => {
    const allSubCellsInDay: SubCell[] = [];
    
    dayData
      .filter(row => row.day === newSubCell.day)
      .forEach(row => {
        if (row.subCells) {
          allSubCellsInDay.push(...row.subCells);
        }
      });

    console.log('🔍 Checking conflicts across all rows:', {
      newSubCell: {
        id: newSubCell.id,
        subject: newSubCell.classData.subject,
        section: newSubCell.classData.section
      },
      excludeSubCellId,
      totalSubCellsInDay: allSubCellsInDay.length
    });

    return checkAllConflicts(newSubCell, allSubCellsInDay, excludeSubCellId);
  };

  const checkDuplicateInSameTimeForCourseCard = (
    draggedCourseCard: CourseCard, 
    targetDay: string, 
    slotIndex: number,
    scheduleData: ExtendedScheduleData[]
  ): { isDuplicate: boolean; conflictingSubCell?: SubCell } => {
    console.log('🔍 Checking Course Card Duplicate:', {
      courseCard: {
        subject: draggedCourseCard.subject,
        courseCode: draggedCourseCard.courseCode,
        section: draggedCourseCard.section
      },
      targetDay,
      slotIndex,
      targetTime: `${slotIndexToTime(slotIndex)}-${slotIndexToTime(slotIndex + 1)}`
    });

    const dayRows = scheduleData.filter(row => row.day === targetDay);
    
    for (const row of dayRows) {
      if (row.subCells) {
        for (const existingSubCell of row.subCells) {
          const existingStart = timeToSlotIndex(existingSubCell.startTime);
          const existingEnd = timeToSlotIndex(existingSubCell.endTime);
          const newStart = slotIndex;
          const newEnd = slotIndex + 1;
          
          const timeOverlap = !(newEnd <= existingStart || existingEnd <= newStart);
          
          console.log('⏰ Time overlap check:', {
            existing: {
              subject: existingSubCell.classData.subject,
              courseCode: existingSubCell.classData.courseCode,
              section: existingSubCell.classData.section,
              time: `${existingSubCell.startTime}-${existingSubCell.endTime}`,
              timeSlots: `${existingStart}-${existingEnd}`
            },
            new: {
              subject: draggedCourseCard.subject,
              courseCode: draggedCourseCard.courseCode,
              section: draggedCourseCard.section,
              timeSlots: `${newStart}-${newEnd}`
            },
            timeOverlap
          });
          
          if (timeOverlap) {
            const isSameSubject = existingSubCell.classData.subject === draggedCourseCard.subject;
            const isSameCourseCode = existingSubCell.classData.courseCode === draggedCourseCard.courseCode;
            const isSameSection = existingSubCell.classData.section === draggedCourseCard.section;
            
            if (isSameSubject && isSameCourseCode && isSameSection) {
              console.log('❌ DUPLICATE DETECTED: Same subject, same course code, same section in same time');
              return { isDuplicate: true, conflictingSubCell: existingSubCell };
            }
          }
        }
      }
    }
    
    console.log('✅ No duplicates found for Course Card');
    return { isDuplicate: false };
  };

  const showConflictModal = (conflictInfo: ConflictInfo, newSubCell: SubCell) => {
    console.log('🚨 showConflictModal called!', conflictInfo);
    
    let title = '';
    let mainMessage = '';

    if (conflictInfo.conflictType === 'time') {
      title = 'วิชาซ้ำในเวลาเดียวกัน';
      mainMessage = `ไม่สามารถวางวิชา <strong>"${newSubCell.classData.subject}"</strong><br>หมู่ ${newSubCell.classData.section} ซ้ำในเวลาเดียวกันได้`;
    } else if (conflictInfo.conflictType === 'teacher') {
      title = 'อาจารย์ขัดแย้ง';
      mainMessage = `อาจารย์ <strong>"${conflictInfo.conflictDetails.teacher?.teacher}"</strong><br>มีการสอนวิชาอื่นในเวลาเดียวกันแล้ว`;
    } else if (conflictInfo.conflictType === 'room') {
      title = 'ห้องเรียนขัดแย้ง';
      mainMessage = `ห้อง <strong>"${conflictInfo.conflictDetails.room?.room}"</strong><br>ถูกใช้โดยวิชาอื่นในเวลาเดียวกัน`;
    } else {
      title = 'ตารางเรียนขัดแย้ง';
      mainMessage = `มีการขัดแย้งในการจัดตาราง<br>ไม่สามารถวางวิชานี้ได้`;
    }

    showSwalWarning(
      title,
      `${mainMessage}<br><br>
       <div style="background: #fff3cd; padding: 12px; border-radius: 6px; border: 1px solid #ffeaa7; margin: 15px 0;">
         <span style="color: #856404;">💡 <strong>คำแนะนำ:</strong></span><br>
         <small style="color: #856404;">
           • เลือกเวลาอื่นที่ไม่ซ้ำกัน<br>
           • ตรวจสอบตารางที่มีอยู่แล้ว
         </small>
       </div>`
    );
  };

  // =============================================================================
  // SUBCELL MANAGEMENT FUNCTIONS
  // =============================================================================

  const removeSubCell = (subCellId: string) => {
    if (role !== "Scheduler") {
      showSwalWarning(
        'ไม่มีสิทธิ์ลบ',
        'เฉพาะ <strong>Scheduler</strong> เท่านั้นที่สามารถลบวิชาได้<br><br><small style="color: #666;">🔒 กรุณาติดต่อผู้ดูแลระบบ</small>'
      );
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
      showSwalError(
        'ไม่สามารถลบได้',
        `วิชา <strong>"${targetSubCell.classData.subject}"</strong><br>
         เป็น <strong>Time Fixed Course</strong><br><br>
         <div style="background: #ffebee; padding: 8px; border-radius: 4px; margin-top: 8px;">
           <small style="color: #c62828;">
             🔒 วิชานี้ถูกล็อกไว้ ไม่สามารถลบหรือแก้ไขได้
           </small>
         </div>`
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
        showSwalSuccess(
          'ลบวิชาสำเร็จ',
          `วิชาถูกลบออกจากตารางแล้ว<br>
           <div style="margin: 8px 0; padding: 6px; background: #e8f5e8; border-radius: 4px;">
             <small style="color: #4CAF50;">
               📚 วิชาจะกลับมาพร้อมใช้งานใน sidebar
             </small>
           </div>`,
          2000
        );
      }
      
      return newData;
    });
  };

  const addSubCellToDay = (day: string, subCell: SubCell) => {
    setScheduleData(prevData => {
      const newData = [...prevData];
      
      const conflictInfo = checkConflictsAcrossAllRows(subCell, prevData);
      
      if (conflictInfo.hasConflict) {
        showConflictModal(conflictInfo, subCell);
        return prevData;
      }
      
      const allDaySubCells: SubCell[] = [];
      
      newData.forEach(row => {
        if (row.day === day && row.subCells && row.subCells.length > 0) {
          allDaySubCells.push(...row.subCells);
        }
      });
      
      allDaySubCells.push(subCell);
      
      const filteredData = newData.filter(row => row.day !== day);
      
      const newDayRows = reconstructDaySchedule(day, allDaySubCells);
      
      const finalData = [...filteredData, ...newDayRows];
      
      finalData.sort((a, b) => {
        if (a.dayIndex !== b.dayIndex) {
          return (a.dayIndex || 0) - (b.dayIndex || 0);
        }
        return (a.rowIndex || 0) - (b.rowIndex || 0);
      });
      
      return finalData;
    });
  };

  const moveSubCellToRow = (subCellId: string, targetRow: ExtendedScheduleData, newStartSlot: number) => {
    console.log('🚀 Starting move operation:', {
      subCellId,
      targetDay: targetRow.day,
      newStartSlot,
      newTime: slotIndexToTime(newStartSlot)
    });

    setScheduleData(prevData => {
      const newData = [...prevData];
      let subCellToMove: SubCell | null = null;
      let originalRowData: ExtendedScheduleData | null = null;
      
      for (const dayData of newData) {
        const cellIndex = (dayData.subCells || []).findIndex(cell => cell.id === subCellId);
        if (cellIndex !== -1) {
          subCellToMove = dayData.subCells![cellIndex];
          originalRowData = dayData;
          console.log('📦 Found SubCell to move from:', dayData.day);
          break;
        }
      }
      
      if (!subCellToMove || !originalRowData) {
        console.error('❌ SubCell not found:', subCellId);
        return prevData;
      }
      
      const duration = subCellToMove.position.endSlot - subCellToMove.position.startSlot;
      const newEndSlot = newStartSlot + duration;
      
      if (newEndSlot > PURE_TIME_SLOTS.length) {
        message.warning("ไม่สามารถวางที่ตำแหน่งนี้ได้ เนื่องจากเกินเวลาสิ้นสุด");
        return prevData;
      }
      
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
      
      console.log('🎯 Created moved SubCell:', {
        id: movedSubCell.id,
        subject: movedSubCell.classData.subject,
        section: movedSubCell.classData.section,
        day: movedSubCell.day,
        time: `${movedSubCell.startTime}-${movedSubCell.endTime}`
      });
      
      const targetDayRows = newData.filter(row => row.day === targetRow.day);
      let hasConflictInTarget = false;
      let conflictingSubCell: SubCell | null = null;
      
      for (const row of targetDayRows) {
        if (row.subCells) {
          for (const existingSubCell of row.subCells) {
            if (existingSubCell.id === subCellId) {
              continue;
            }
            
            const timeOverlap = doSubCellsOverlap(movedSubCell, existingSubCell);
            
            if (timeOverlap) {
              const isSameSubject = movedSubCell.classData.subject === existingSubCell.classData.subject;
              const isSameCourseCode = movedSubCell.classData.courseCode === existingSubCell.classData.courseCode;
              const isSameSection = movedSubCell.classData.section === existingSubCell.classData.section;
              
              console.log('🔍 Checking overlap with existing SubCell:', {
                existing: {
                  id: existingSubCell.id,
                  subject: existingSubCell.classData.subject,
                  section: existingSubCell.classData.section,
                  time: `${existingSubCell.startTime}-${existingSubCell.endTime}`
                },
                comparison: {
                  isSameSubject,
                  isSameCourseCode,
                  isSameSection
                }
              });
              
              if (isSameSubject && isSameCourseCode && isSameSection) {
                hasConflictInTarget = true;
                conflictingSubCell = existingSubCell;
                console.log('❌ CONFLICT DETECTED: Same subject, same section in target position');
                break;
              }
              
              const isSameTeacher = checkSameTeacher(
                movedSubCell.classData.teacher, 
                existingSubCell.classData.teacher
              );
              
              if (isSameTeacher && !isSameSubject) {
                hasConflictInTarget = true;
                conflictingSubCell = existingSubCell;
                console.log('❌ TEACHER CONFLICT DETECTED: Same teacher, different subjects');
                break;
              }
            }
          }
          
          if (hasConflictInTarget) break;
        }
      }
      
      if (hasConflictInTarget && conflictingSubCell) {
        console.log('🚨 Move operation blocked due to conflict');
        
        const conflictInfo: ConflictInfo = {
          hasConflict: true,
          conflictType: 'time',
          conflictDetails: {
            time: {
              conflictingSubCell: conflictingSubCell,
              reason: `ไม่สามารถย้ายวิชา "${movedSubCell.classData.subject}" หมู่ ${movedSubCell.classData.section} ไปซ้อนกับตำแหน่งเดิมได้`
            }
          },
          conflictingSubCells: [conflictingSubCell]
        };
        
        setTimeout(() => {
          showConflictModal(conflictInfo, movedSubCell);
        }, 100);
        
        return prevData;
      }
      
      console.log('✅ No conflicts detected, proceeding with move');
      
      const originalCellIndex = (originalRowData.subCells || []).findIndex(cell => cell.id === subCellId);
      if (originalCellIndex !== -1) {
        originalRowData.subCells!.splice(originalCellIndex, 1);
        console.log('🗑️ Removed SubCell from original position');
      }
      
      const targetRowIndex = newData.findIndex(r => r.key === targetRow.key);
      if (targetRowIndex !== -1) {
        if (!newData[targetRowIndex].subCells) {
          newData[targetRowIndex].subCells = [];
        }
        newData[targetRowIndex].subCells!.push(movedSubCell);
        
        console.log('✅ Successfully moved SubCell to target row');
        
        const dayRows = newData.filter(row => row.day === targetRow.day);
        const isTargetLastRow = targetRowIndex === Math.max(...dayRows.map(row => newData.findIndex(r => r.key === row.key)));
        const targetRowHasOnlyMovedCell = newData[targetRowIndex].subCells!.length === 1;
        
        if (isTargetLastRow && !targetRowHasOnlyMovedCell) {
          const dayIndex = DAYS.findIndex(d => d === targetRow.day);
          const newEmptyRowIndex = dayRows.length;
          const newTotalRows = dayRows.length + 1;
          
          const newEmptyRow = createEmptyDayRow(targetRow.day, dayIndex, newEmptyRowIndex, newTotalRows);
          newEmptyRow.isFirstRowOfDay = false;
          
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

  const reconstructDaySchedule = (day: string, allSubCells: SubCell[]): ExtendedScheduleData[] => {
    const daySubCells = allSubCells.filter(subCell => subCell.day === day);
    
    if (daySubCells.length === 0) {
      const dayIndex = DAYS.findIndex(d => d === day);
      const firstRow = createEmptyDayRow(day, dayIndex, 0, 2);
      const secondRow = createEmptyDayRow(day, dayIndex, 1, 2);
      secondRow.isFirstRowOfDay = false;
      return [firstRow, secondRow];
    }

    const rowGroups = separateOverlappingSubCells(daySubCells);
    const totalRowsForThisDay = rowGroups.length + 1;
    const dayIndex = DAYS.findIndex(d => d === day);
    const result: ExtendedScheduleData[] = [];

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

    return result;
  };

  const addSubCellToSpecificRow = (targetRow: ExtendedScheduleData, subCell: SubCell) => {
    addSubCellToDay(targetRow.day, subCell);
  };

  // =============================================================================
  // DEBUG HELPER FUNCTIONS
  // =============================================================================

  const debugRowCreation = (day: string, subCells: SubCell[]) => {
    console.log(`🔧 Reconstructing ${day}:`, {
      totalSubCells: subCells.length,
      subCells: subCells.map(sc => ({
        subject: sc.classData.subject,
        time: `${sc.startTime}-${sc.endTime}`,
        startSlot: sc.position.startSlot,
        endSlot: sc.position.endSlot
      }))
    });
    
    const rowGroups = separateOverlappingSubCells(subCells);
    console.log(`📋 Row groups for ${day}:`, rowGroups.map((group, index) => ({
      rowIndex: index,
      subCells: group.map(sc => sc.classData.subject)
    })));
  };

  const debugTableStructure = (data: ExtendedScheduleData[]) => {
    DAYS.forEach(day => {
      const dayRows = data.filter(row => row.day === day);
      const sortedRows = dayRows.sort((a, b) => (a.rowIndex || 0) - (b.rowIndex || 0));
      
      console.log(`📋 ${day}:`, {
        totalRows: dayRows.length,
        rows: sortedRows.map(row => ({
          rowIndex: row.rowIndex,
          isFirst: row.isFirstRowOfDay,
          totalRowsInDay: row.totalRowsInDay,
          subCellsCount: row.subCells?.length || 0
        }))
      });
    });
  };

  // =============================================================================
  // COURSE CARD GENERATION FUNCTIONS
  // =============================================================================

  const generateCourseCardsFromAPI = (schedules: ScheduleInterface[]) => {
    const cards: CourseCard[] = [];
    
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
      dayOfWeek: string;
      startTime: string;
      endTime: string;
    }> = [];

    schedules.forEach((schedule) => {
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

      const getStudentYearFromLevel = (schedule: ScheduleInterface): string => {
        const level = (schedule.OfferedCourses?.AllCourses as any)?.AcademicYear?.Level;
        const normalized = normalizeStudentYear(level);
        
        console.log('🎓 Course studentYear:', {
          courseCode: schedule.OfferedCourses?.AllCourses?.Code,
          originalLevel: level,
          normalizedLevel: normalized
        });
        
        return normalized;
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
      const studentYear = getStudentYearFromLevel(schedule);

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
        dayOfWeek: schedule.DayOfWeek,
        startTime: startTime,
        endTime: endTime
      });
    });

    // Group similar courses
    const courseGroups = new Map<string, typeof allCourseData>();
    
    allCourseData.forEach(courseData => {
      const teacherKeyPart = courseData.teacherIds.length > 0 ? courseData.teacherIds.join("-") : courseData.teacher;
      const groupKey = `${courseData.courseCode}-${courseData.section}-${courseData.studentYear}-${teacherKeyPart}`;
      
      if (!courseGroups.has(groupKey)) {
        courseGroups.set(groupKey, []);
      }
      courseGroups.get(groupKey)!.push(courseData);
    });

    // Create CourseCard from each group
    courseGroups.forEach((group, groupKey) => {
      const firstCourse = group[0];
      
      const uniquePeriods = new Set<string>();
      group.forEach(course => {
        for (let slot = timeToSlotIndex(course.startTime); slot < timeToSlotIndex(course.endTime); slot++) {
          const periodKey = `${course.dayOfWeek}-${slot}`;
          uniquePeriods.add(periodKey);
        }
      });
      
      const totalDuration = uniquePeriods.size;

      const card: CourseCard = {
        id: `course-card-${groupKey}`,
        subject: firstCourse.subject,
        courseCode: firstCourse.courseCode,
        teacher: firstCourse.teacher,
        teacherIds: firstCourse.teacherIds,
        room: firstCourse.room,
        section: firstCourse.section,
        studentYear: firstCourse.studentYear,
        duration: totalDuration,
        color: getSubjectColor(firstCourse.subject, firstCourse.courseCode),
        scheduleId: firstCourse.scheduleId,
        scheduleIds: group.map(course => course.scheduleId)
      };

      cards.push(card);
      
      console.log(`📊 Created CourseCard: ${firstCourse.subject} (Year: ${getDisplayStudentYear(firstCourse.studentYear)}) with ${totalDuration} periods`);
    });

    setCourseCards(cards);
    setFilteredCourseCards(cards);
  };

  // =============================================================================
  // REMOVED COURSES FUNCTIONS
  // =============================================================================

  const addToRemovedCourses = (subCell: SubCell) => {
    const uniqueKey = `${subCell.classData.subject}-${subCell.classData.courseCode}-${subCell.classData.section}-${subCell.classData.teacher}-${subCell.day}-${subCell.startTime}-${subCell.endTime}`;
    
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
    if (role !== "Scheduler") {
      showSwalWarning(
        'ไม่มีสิทธิ์กู้คืน',
        'เฉพาะ <strong>Scheduler</strong> เท่านั้นที่สามารถกู้คืนวิชาได้'
      );
      return;
    }

    const classInfo: ClassInfo = {
      subject: removedCourse.subject,
      teacher: removedCourse.teacher,
      room: removedCourse.room,
      section: removedCourse.section,
      courseCode: removedCourse.courseCode,
      studentYear: removedCourse.studentYear,
      color: removedCourse.color
    };

    const newSubCell = createSubCell(
      classInfo, 
      removedCourse.originalDay, 
      removedCourse.originalStartTime, 
      removedCourse.originalEndTime,
      removedCourse.scheduleId
    );

    const dayRows = scheduleData.filter(row => row.day === removedCourse.originalDay);
    let canRestore = false;
    let targetRow: ExtendedScheduleData | null = null;

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
      setRemovedCourses(prev => prev.filter(course => course.id !== removedCourse.id));
      showSwalSuccess(
        'กู้คืนสำเร็จ ✅',
        `วิชา <strong>"${removedCourse.subject}"</strong><br>
         ถูกกู้คืนกลับเข้าตารางแล้ว<br><br>
         <small style="color: #4CAF50;">📅 วัน: ${removedCourse.originalDay} | ⏰ เวลา: ${removedCourse.originalStartTime}-${removedCourse.originalEndTime}</small>`,
        2500
      );
    } else {
      showSwalWarning(
        'ไม่สามารถกู้คืนได้',
        `วิชา <strong>"${removedCourse.subject}"</strong> ไม่สามารถกู้คืนได้<br><br>
         <div style="background: #fff3cd; padding: 8px; border-radius: 4px; margin-top: 10px;">
           <small style="color: #856404;">
             ⚠️ <strong>สาเหตุ:</strong> มีการซ้อนทับเวลาในตำแหน่งเดิม<br><br>
             💡 <strong>แนะนำ:</strong><br>
             • ลบวิชาที่ซ้อนทับก่อน<br>
             • หรือเลือกเวลาใหม่สำหรับวิชานี้
           </small>
         </div>`
      );
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
      showSwalInfo(
        'ไม่มีรายการ',
        'ไม่มีวิชาที่ถูกลบให้ล้างข้อมูล<br><br><small style="color: #666;">📁 รายการว่างเปล่า</small>',
        1500
      );
      return;
    }

    Swal.fire({
      title: 'ยืนยันการล้างรายการ',
      html: `คุณต้องการลบรายการวิชาที่ถูกลบทั้งหมด<br>
             <strong>${removedCourses.length} รายการ</strong> หรือไม่?<br><br>
             <div style="background: #ffebee; padding: 8px; border-radius: 4px; margin-top: 10px;">
               <small style="color: #c62828;">
                 ⚠️ การดำเนินการนี้ไม่สามารถยกเลิกได้
               </small>
             </div>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ล้างทั้งหมด',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#f44336',
      cancelButtonColor: '#6c757d'
    }).then((result) => {
      if (result.isConfirmed) {
        setRemovedCourses([]);
        setRemovedSearchValue("");
        showSwalSuccess(
          'ล้างข้อมูลสำเร็จ ✅',
          'ล้างรายการวิชาที่ถูกลบทั้งหมดแล้ว',
          1500
        );
      }
    });
  };

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