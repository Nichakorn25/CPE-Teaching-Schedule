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
  AutoComplete,
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
import { OpenCourseInterface, LaboratoryInterface } from "../../../interfaces/Adminpage"; 
import { getOfferedCoursesByMajor, getLaboratory } from "../../../services/https/GetService";
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
  room: '#fa8c16',
  laboratory: '#13c2c2'
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
  const [academicYear] = useState(() => 
    localStorage.getItem("academicYear") || ""
  );
  const [term] = useState(() => 
    localStorage.getItem("term") || ""
  );
 const [major_name] = useState(() => 
    localStorage.getItem("major_name") || ""
  );
  const [role] = useState(() => 
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
    rooms: [],
    laboratories: []
  });
  const [searchValue, setSearchValue] = useState("");
  const [filterVisible, setFilterVisible] = useState(false);

  // =================== NEW SIDEBAR STATES ===================
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [courseCards, setCourseCards] = useState<CourseCard[]>([]);
  const [filteredCourseCards, setFilteredCourseCards] = useState<CourseCard[]>([]);
  const [draggedCourseCard, setDraggedCourseCard] = useState<CourseCard | null>(null);
  const [sidebarWidth] = useState(350);
  
  // Sidebar Filter States
  const [sidebarFilterTags, setSidebarFilterTags] = useState<FilterTag[]>([]);
  const [sidebarSearchValue, setSidebarSearchValue] = useState("");
  const [sidebarFilterVisible, setSidebarFilterVisible] = useState(false);

  // =================== NEW REMOVED COURSES STATES ===================
  const [removedCourses, setRemovedCourses] = useState<RemovedCourse[]>([]);
  const [filteredRemovedCourses, setFilteredRemovedCourses] = useState<RemovedCourse[]>([]);
  const [removedSearchValue, setRemovedSearchValue] = useState("");

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

const getDisplayStudentYear = (level: string): string => {
  if (!level) return "ทุกชั้นปี";
  
  const normalizedLevel = normalizeStudentYear(level);
  
  // ถ้าเป็นตัวเลข ให้แสดงเป็น "ปีที่ X"
  if (/^\d+$/.test(normalizedLevel)) {
    return `ปีที่ ${normalizedLevel}`;
  }
  
  // ถ้าเป็น "ทุกชั้นปี" ให้แสดงตามที่เป็น
  if (normalizedLevel === "ทุกชั้นปี") {
    return "ทุกชั้นปี";
  }
  
  // กรณีอื่นๆ
  return normalizedLevel;
};

const normalizeStudentYear = (level: string | number): string => {
  if (!level && level !== 0) return "ทุกชั้นปี";
  
  // แปลงเป็น string ก่อน
  const levelStr = String(level).trim();
  
  // กรณีที่เป็นตัวเลขธรรมดา "1", "2", "3", "4" จาก backend
  if (/^\d+$/.test(levelStr)) {
    const num = parseInt(levelStr);
    if (num >= 1 && num <= 9) {
      return levelStr; // return "1", "2", "3", "4"
    }
  }
  
  // กรณีที่เป็น "เรียนได้ทุกชั้นปี" (อาจมีใน backend บางกรณี)
  if (levelStr === 'เรียนได้ทุกชั้นปี') {
    return "ทุกชั้นปี";
  }
  
  // กรณีที่เป็นรูปแบบ "ปีที่ X" (fallback)
  const yearMatch = levelStr.match(/ปีที่\s*(\d+)/);
  if (yearMatch) {
    return yearMatch[1];
  }
  
  // กรณีอื่นๆ
  if (levelStr === "0" || levelStr.toLowerCase() === "all") {
    return "ทุกชั้นปี";
  }
  
  // fallback: return ตามที่ได้รับ
  return levelStr;
};


useEffect(() => {
  const updateInitialFilterOptions = async () => {
    const currentMajor = localStorage.getItem("major_name");
    const currentAcademicYear = localStorage.getItem("academicYear");
    const currentTerm = localStorage.getItem("term");

    // ถ้าไม่มีข้อมูลที่จำเป็น ให้ข้าม
    if (!currentMajor || !currentAcademicYear || !currentTerm) {
      return;
    }

    try {
      console.log('🔄 Updating filter options from APIs...');
      
      const results = await Promise.allSettled([
        getOfferedCoursesByMajor(currentMajor, parseInt(currentAcademicYear), parseInt(currentTerm)),
        getLaboratory()
      ]);

      const subjects = new Set<string>();
      const courseCodes = new Set<string>();
      const rooms = new Set<string>();
      const studentYears = new Set<string>();
      const laboratories = new Set<string>();

      // เพิ่ม "ทุกชั้นปี" เป็นตัวเลือกเริ่มต้น (เพราะอาจมีวิชาที่เรียนได้ทุกชั้นปี)
      studentYears.add("ทุกชั้นปี");

      // ประมวลผลข้อมูลจาก OpenCourse API
      if (results[0].status === 'fulfilled' && results[0].value?.status === 200) {
        const openCourses: OpenCourseInterface[] = results[0].value.data;
        
        openCourses.forEach(course => {
          // เพิ่มชื่อวิชา
          if (course.CourseName) {
            subjects.add(course.CourseName);
          }
          
          // เพิ่มรหัสวิชา
          if (course.Code) {
            courseCodes.add(course.Code);
          }
          
          // เพิ่มอาจารย์
          if (course.Teachers && course.Teachers.length > 0) {
            course.Teachers.forEach(teacher => {
              const fullName = `${teacher.Title || ''} ${teacher.Firstname} ${teacher.Lastname}`.trim();
              if (fullName) {
                // Note: teachers จะถูกจัดการแยกใน useEffect อื่น
              }
            });
          }
          
          // เพิ่มห้องเรียนจาก GroupInfos
          if (course.GroupInfos && course.GroupInfos.length > 0) {
            course.GroupInfos.forEach(group => {
              if (group.Room && group.Room.trim() !== '') {
                rooms.add(group.Room.trim());
              }
            });
          }
          
          // เพิ่มชั้นปีจาก Code pattern matching (OpenCourse API ไม่มี AcademicYear.Level)
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
          rooms: rooms.size,
          studentYears: studentYears.size,
          studentYearsList: Array.from(studentYears),
          totalCourses: openCourses.length
        });
      } else {
        console.warn('Failed to load OpenCourse data or no data available');
      }

      // ประมวลผลข้อมูลจาก Laboratory API
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
      } else {
        console.warn('Failed to load Laboratory data or no data available');
      }

      // อัปเดต filterOptions ทันที (ไม่รอ scheduleData)
      setFilterOptions(prevOptions => ({
        ...prevOptions,
        subjects: Array.from(subjects).filter(Boolean).sort(),
        courseCodes: Array.from(courseCodes).filter(Boolean).sort(),
        rooms: Array.from(rooms).filter(Boolean).sort(),
        studentYears: Array.from(studentYears).sort((a, b) => {
          // เรียงลำดับ: ตัวเลข 1-9 ก่อน, แล้วตาม "ทุกชั้นปี"
          if (a === "ทุกชั้นปี") return 1;
          if (b === "ทุกชั้นปี") return -1;
          const numA = parseInt(a);
          const numB = parseInt(b);
          if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
          return a.localeCompare(b);
        }),
        laboratories: Array.from(laboratories).filter(Boolean).sort(),
        // รวมอาจารย์จาก API และ allTeachers
        teachers: [
          ...extractTeachersFromAPI(),
          ...prevOptions.teachers.filter(teacher => 
            !extractTeachersFromAPI().includes(teacher)
          )
        ].filter((teacher, index, array) => array.indexOf(teacher) === index).sort(), // remove duplicates
      }));
      
      console.log('✅ All initial filter data loaded successfully');
      
    } catch (error) {
      console.error('❌ Error loading initial filter data:', error);
    }
  };

  // เรียกใช้ทันทีเมื่อ component mount และเมื่อ localStorage เปลี่ยน
  updateInitialFilterOptions();
}, [academicYear, term, major_name]);
const extractTeachersFromAPI = () => {
  const teachers = new Set<string>();
  const currentMajor = localStorage.getItem("major_name");
  
  allTeachers.forEach(teacher => {
    const fullName = `${teacher.Firstname} ${teacher.Lastname}`.trim();
    
    // เช็คว่าอาจารย์มีสาขาตรงกับ currentMajor หรือไม่มีสาขา (SutAdmin)
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

const extractAPIBasedOptions = () => {
  const teachers = new Set<string>();
  const studentYears = new Set<string>();
  const subjects = new Set<string>();
  const courseCodes = new Set<string>();
  const rooms = new Set<string>();
  const laboratories = new Set<string>();

  // Extract teachers from API
  const teachersFromAPI = extractTeachersFromAPI();
  teachersFromAPI.forEach(teacher => teachers.add(teacher));

  // Extract from original schedule data if available
  if (originalScheduleData && originalScheduleData.length > 0) {
    originalScheduleData.forEach((schedule: any) => {
      // ใช้ Level เป็นหลัก
      if (schedule.OfferedCourses?.AllCourses?.AcademicYear?.Level) {
        const level = schedule.OfferedCourses.AllCourses.AcademicYear.Level;
        const normalizedLevel = normalizeStudentYear(level);
        studentYears.add(normalizedLevel);
      }

      // Subjects and course codes
      const subject = schedule.OfferedCourses?.AllCourses?.ThaiName ||
                      schedule.OfferedCourses?.AllCourses?.EnglishName;
      if (subject) subjects.add(subject);

      const courseCode = schedule.OfferedCourses?.AllCourses?.Code;
      if (courseCode) courseCodes.add(courseCode);

      // Laboratory rooms
      const labRoom = schedule?.OfferedCourses?.Laboratory?.Room;
      if (labRoom && labRoom.trim() !== "") {
        laboratories.add(labRoom.trim());
      }

      // Regular rooms (if available in API)
      if (schedule.TimeFixedCourses && schedule.TimeFixedCourses.length > 0) {
        schedule.TimeFixedCourses.forEach((tc: any) => {
          if (tc.RoomFix && tc.RoomFix.trim() !== "") {
            rooms.add(tc.RoomFix.trim());
          }
        });
      }
    });
  }

  // กรองเฉพาะชั้นปีที่เป็นตัวเลข 1-9 และ "ทุกชั้นปี"
  const validYears = Array.from(studentYears).filter(year => {
    if (year === "ทุกชั้นปี") return true;
    const num = parseInt(year);
    return !isNaN(num) && num >= 1 && num <= 9;
  });

  return {
    teachers: Array.from(teachers).filter(Boolean).sort(),
    studentYears: validYears.sort((a, b) => {
      // เรียงลำดับ: ตัวเลข 1-9 ก่อน, แล้วตาม "ทุกชั้นปี"
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
  };
};
useEffect(() => {
  if (allTeachers.length > 0) {
    // อัปเดตเฉพาะส่วนอาจารย์
    setFilterOptions(prevOptions => ({
      ...prevOptions,
      teachers: [
        ...extractTeachersFromAPI(),
        ...prevOptions.teachers.filter(teacher => 
          !extractTeachersFromAPI().includes(teacher)
        )
      ].filter((teacher, index, array) => array.indexOf(teacher) === index).sort() // remove duplicates
    }));
    
    console.log('✅ Teachers filter updated:', extractTeachersFromAPI().length);
  }
}, [allTeachers]);

  // =================== SIDEBAR FILTER FUNCTIONS ===================
  

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
          // ใช้ Level จาก originalScheduleData สำหรับ sidebar filter
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
          
          // fallback: ใช้จาก courseCard.studentYear
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
          // ตรวจสอบห้องแล็บสำหรับ course card
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

    // Apply search filter
    const searchMatch = !sidebarSearchValue || 
      courseCard.teacher.toLowerCase().includes(sidebarSearchValue.toLowerCase()) ||
      courseCard.subject.toLowerCase().includes(sidebarSearchValue.toLowerCase()) ||
      courseCard.courseCode.toLowerCase().includes(sidebarSearchValue.toLowerCase());

    return tagMatch && searchMatch;
  });

  setFilteredCourseCards(filtered);
};


useEffect(() => {
  if (originalScheduleData.length > 0) {
    // อัปเดตเฉพาะข้อมูลห้องแลป
    const laboratories = new Set<string>();
    
    originalScheduleData.forEach((schedule: any) => {
      const labRoom = schedule?.OfferedCourses?.Laboratory?.Room;
      if (labRoom && labRoom.trim() !== "") {
        laboratories.add(labRoom.trim());
      }
    });

    if (laboratories.size > 0) {
      setFilterOptions(prevOptions => ({
        ...prevOptions,
        laboratories: [
          ...Array.from(laboratories),
          ...prevOptions.laboratories
        ].filter(Boolean).sort()
      }));
    }
  }
}, [originalScheduleData]);

  // Apply sidebar filters whenever sidebarFilterTags or sidebarSearchValue changes
useEffect(() => {
  applySidebarFilters();
}, [sidebarFilterTags, sidebarSearchValue, courseCards, scheduleData]);

  // =================== REMOVED COURSES FUNCTIONS ===================

const restoreRemovedCourse = (removedCourse: RemovedCourse) => {
  // ตรวจสอบ role ก่อน
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
      'ไม่มีวิชาที่ถูกลบให้ล้างข้อมูล<br><br><small style="color: #666;">📝 รายการว่างเปล่า</small>',
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
const reconstructDaySchedule = (day: string, allSubCells: SubCell[]): ExtendedScheduleData[] => {
  // ใช้ logic เดียวกันกับ transformScheduleDataWithRowSeparation
  const daySubCells = allSubCells.filter(subCell => subCell.day === day);
  
  if (daySubCells.length === 0) {
    // สร้าง 2 แถวว่างเหมือน Auto-Generate
    const dayIndex = DAYS.findIndex(d => d === day);
    const firstRow = createEmptyDayRow(day, dayIndex, 0, 2);
    const secondRow = createEmptyDayRow(day, dayIndex, 1, 2);
    secondRow.isFirstRowOfDay = false;
    return [firstRow, secondRow];
  }

  // ใช้ separateOverlappingSubCells เหมือน Auto-Generate
  const rowGroups = separateOverlappingSubCells(daySubCells);
  const totalRowsForThisDay = rowGroups.length + 1; // +1 สำหรับ empty row
  const dayIndex = DAYS.findIndex(d => d === day);
  const result: ExtendedScheduleData[] = [];

  // สร้างแถวจาก rowGroups
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

    // เพิ่ม time slots
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

  // เพิ่ม empty row
  const emptyRowIndex = rowGroups.length;
  const emptyRow = createEmptyDayRow(day, dayIndex, emptyRowIndex, totalRowsForThisDay);
  emptyRow.isFirstRowOfDay = false;
  result.push(emptyRow);

  return result;
};

// แทนที่ addSubCellToSpecificRow ด้วยฟังก์ชันใหม่
const addSubCellToDay = (day: string, subCell: SubCell) => {
  setScheduleData(prevData => {
    const newData = [...prevData];
    
    // ตรวจสอบขัดแย้งก่อนเพิ่ม
    const conflictInfo = checkConflictsAcrossAllRows(subCell, prevData);
    
    if (conflictInfo.hasConflict) {
      showConflictModal(conflictInfo, subCell);
      return prevData; // ไม่เพิ่มถ้ามีขัดแย้ง
    }
    
    // รวบรวม SubCell ทั้งหมดในวันนั้น รวมกับ SubCell ใหม่
    const allDaySubCells: SubCell[] = [];
    
    // เก็บ SubCell จากแถวเดิม
    newData.forEach(row => {
      if (row.day === day && row.subCells && row.subCells.length > 0) {
        allDaySubCells.push(...row.subCells);
      }
    });
    
    // เพิ่ม SubCell ใหม่
    allDaySubCells.push(subCell);
    
    // ลบแถวเดิมของวันนั้น
    const filteredData = newData.filter(row => row.day !== day);
    
    // สร้างแถวใหม่ด้วย logic เดียวกับ Auto-Generate
    const newDayRows = reconstructDaySchedule(day, allDaySubCells);
    
    // รวมข้อมูล: วันอื่น + วันที่สร้างใหม่
    const finalData = [...filteredData, ...newDayRows];
    
    // เรียงลำดับตาม dayIndex และ rowIndex
    finalData.sort((a, b) => {
      if (a.dayIndex !== b.dayIndex) {
        return (a.dayIndex || 0) - (b.dayIndex || 0);
      }
      return (a.rowIndex || 0) - (b.rowIndex || 0);
    });
    
    return finalData;
  });
};


// เพิ่ม helper function สำหรับ debug การสร้างแถวใหม่
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
useEffect(() => {
  if (scheduleData.length > 0) {
    console.log('🔍 Current table structure:');
    debugTableStructure(scheduleData);
  }
}, [scheduleData]);

  // =================== COURSE CARD FUNCTIONS ==================
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

    // ใช้ Level ที่เป็นตัวเลขจาก backend
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

  // กรุ๊ปข้อมูลที่เหมือนกัน
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

const getTeachingAssistantsForTooltip = (subCell: SubCell): string => {
  if (subCell.scheduleId && originalScheduleData) {
    const originalSchedule = originalScheduleData.find(
      (schedule: any) => schedule.ID === subCell.scheduleId
    );
    
    if (originalSchedule?.ScheduleTeachingAssistant && originalSchedule.ScheduleTeachingAssistant.length > 0) {
      const assistants = originalSchedule.ScheduleTeachingAssistant
        .map((sta: any) => {
          if (sta.TeachingAssistant) {
            const title = sta.TeachingAssistant.Title?.Title || '';
            const firstname = sta.TeachingAssistant.Firstname || '';
            const lastname = sta.TeachingAssistant.Lastname || '';
            return `${title}${firstname} ${lastname}`.trim();
          }
          return '';
        })
        .filter(Boolean);
      
      if (assistants.length > 0) {
        return assistants.join(', ');
      }
    }
  }
  return "";
};

  // =================== COURSE CARD DRAG HANDLERS ===================
const handleCourseCardDragStart = (e: React.DragEvent, courseCard: CourseCard) => {
  // ตรวจสอบ role ก่อน
  if (role !== "Scheduler") {
    e.preventDefault();
    showSwalWarning(
      'ไม่มีสิทธิ์เข้าถึง',
      `เฉพาะ <strong>Scheduler</strong> เท่านั้นที่สามารถลากวิชาไปใส่ในตารางได้<br><br>
       <small style="color: #666;">💡 กรุณาติดต่อผู้ดูแลระบบเพื่อขอสิทธิ์</small>`
    );
    return;
  }

  // ตรวจสอบว่าวิชาถูกใช้แล้วหรือไม่
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
          
          console.log('🔍 Detailed comparison:', {
            isSameSubject,
            isSameCourseCode,
            isSameSection,
            existingSubject: existingSubCell.classData.subject,
            draggedSubject: draggedCourseCard.subject,
            existingCourseCode: existingSubCell.classData.courseCode,
            draggedCourseCode: draggedCourseCard.courseCode,
            existingSection: existingSubCell.classData.section,
            draggedSection: draggedCourseCard.section
          });
          
          // วิชาเดียวกัน รหัสเดียวกัน section เดียวกัน = ห้ามซ้ำ
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

  // Modified drop handler to handle both subcells and course cards
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
    
    // ตรวจสอบการซ้ำ
    const duplicateCheck = checkDuplicateInSameTimeForCourseCard(
      draggedCourseCard, 
      targetRow.day, 
      slotIndex, 
      scheduleData
    );
    
    if (duplicateCheck.isDuplicate) {
      showSwalWarning(
        'วิชาซ้ำในเวลาเดียวกัน',
        `ไม่สามารถวางวิชา <strong>"${draggedCourseCard.subject}"</strong><br>
         หมู่ <strong>${draggedCourseCard.section}</strong> ซ้ำในเวลาเดียวกันได้`
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
    
    // ตรวจสอบความขัดแยง
    const conflictInfo = checkConflictsAcrossAllRows(newSubCell, scheduleData);
    
    if (conflictInfo.hasConflict) {
      showConflictModal(conflictInfo, newSubCell);
      setDraggedCourseCard(null);
      setDragPreview(null);
      return;
    }
    
    // ตรวจสอบ usage
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
    
    // ใช้ addSubCellToDay ที่ใช้ logic เดียวกันกับ Auto-Generate
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
    // ส่วน draggedSubCell ใช้ moveSubCellToRow เดิม (ไม่เปลี่ยน)
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
        flexShrink: 0
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

            {/* Room Filter */}
            <div>
              <label style={{ fontSize: "10px", color: "#666", marginBottom: "2px", display: "block" }}>
                ห้อง:
              </label>
              <AutoComplete
                placeholder="เลือกห้อง"
                options={filterOptions.rooms.map(room => ({ value: room }))}
                onSelect={(value) => addSidebarFilterTag('room', value)}
                style={{ width: "100%" }}
                size="small"
                filterOption={(inputValue, option) =>
                  option?.value.toLowerCase().includes(inputValue.toLowerCase()) ?? false
                }
              />
            </div>

            {/* Laboratory Filter */}
            <div>
              <label style={{ fontSize: "10px", color: "#666", marginBottom: "2px", display: "block" }}>
                ห้องแลป:
              </label>
              <AutoComplete
                placeholder="เลือกห้องแลป"
                options={filterOptions.laboratories.map(lab => ({ value: lab }))}
                onSelect={(value) => addSidebarFilterTag('laboratory', value)}
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
        flex: 1,
        overflowY: "auto",
        paddingRight: "4px"
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

  // =================== FILTER FUNCTIONS ===================
const extractFilterOptions = (data: ExtendedScheduleData[]) => {
  // เริ่มจากข้อมูล API ที่มีอยู่แล้วใน filterOptions
  const teachers = new Set(filterOptions.teachers);
  const studentYears = new Set(filterOptions.studentYears);
  const subjects = new Set(filterOptions.subjects);
  const courseCodes = new Set(filterOptions.courseCodes);
  const rooms = new Set(filterOptions.rooms);
  const laboratories = new Set(filterOptions.laboratories);

  // เพิ่มข้อมูลจาก schedule data เท่านั้น (ไม่เขียนทับ)
  data.forEach(dayData => {
    dayData.subCells?.forEach(subCell => {
      // เพิ่มอาจารย์จาก subCell
      if (subCell.classData.teacher) {
        const teacherNames = subCell.classData.teacher.split(',').map(name => name.trim());
        teacherNames.forEach(name => {
          if (name && name !== '') {
            teachers.add(name);
          }
        });
      }
      
      // เพิ่มชั้นปีจาก Level ใน originalScheduleData
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

      // เพิ่มข้อมูลห้องแล็บจาก subCell
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

  // กรองเฉพาะตัวเลข 1-9 และ "ทุกชั้นปี" สำหรับปีการศึกษา
  const validYears = Array.from(studentYears).filter(year => {
    if (year === "ทุกชั้นปี") return true;
    const num = parseInt(year);
    return !isNaN(num) && num >= 1 && num <= 9;
  });

  // อัปเดตเฉพาะที่เพิ่มขึ้น ไม่เขียนทับของเดิม
  setFilterOptions(prevOptions => ({
    teachers: Array.from(teachers).filter(Boolean).sort(),
    studentYears: validYears.sort((a, b) => {
      // เรียงลำดับ: ตัวเลข 1-9 ก่อน, แล้วตาม "ทุกชั้นปี"
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

  console.log('🎯 Filter options merged with schedule data:', {
    teachersCount: teachers.size,
    studentYearsCount: validYears.length,
    studentYears: Array.from(validYears),
    subjectsCount: subjects.size,
    laboratoriesCount: laboratories.size,
  });
};
useEffect(() => {
  extractFilterOptions(scheduleData);
}, [scheduleData, allTeachers]);
// ⭐ ใหม่: โหลด filter options ทันทีที่ allTeachers โหลดเสร็จ
useEffect(() => {
  if (allTeachers.length > 0) {
    extractFilterOptions(scheduleData);
  }
}, [allTeachers]);

// ⭐ ใหม่: โหลด filter options ทันทีที่ originalScheduleData มีข้อมูล  
useEffect(() => {
  if (originalScheduleData.length > 0) {
    console.log('🔍 Debug originalScheduleData for studentYears:');
    originalScheduleData.forEach((schedule: any, index) => {
      const level = schedule?.OfferedCourses?.AllCourses?.AcademicYear?.Level;
      const normalizedLevel = normalizeStudentYear(level);
      const courseCode = schedule?.OfferedCourses?.AllCourses?.Code;
      
      console.log(`Schedule ${index + 1}:`, {
        courseCode,
        originalLevel: level,
        normalizedLevel: normalizedLevel
      });
    });
    
    // รีเฟรช filter options
    extractFilterOptions(scheduleData);
  }
}, [originalScheduleData]);

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
    case 'laboratory': return 'ห้องแลป';
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
                // กรณี "เรียนได้ทุกชั้นปี" 
                if (level === 'เรียนได้ทุกชั้นปี') {
                  return tag.value === "ทุกชั้นปี";
                }
                
                // กรณีตัวเลขธรรมดา
                if (/^\d+$/.test(level)) {
                  return level === tag.value;
                }
                
                // กรณี "ปีที่ X"
                const yearMatch = level.match(/ปีที่\s*(\d+)/);
                if (yearMatch) {
                  return yearMatch[1] === tag.value;
                }
                
                // กรณีอื่นๆ
                return level === tag.value;
              }
            }

            // fallback: ใช้จาก subCell.classData.studentYear
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
            // ตรวจสอบห้องแล็บจาก originalScheduleData
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

      // Apply search filter (search in teacher name only)
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

  const totalOriginal = scheduleData.reduce((acc, day) => acc + (day.subCells?.length || 0), 0);
  const totalFiltered = filtered.reduce((acc, day) => acc + (day.subCells?.length || 0), 0);
  
  console.log('🔍 Filter applied:', {
    original: totalOriginal,
    filtered: totalFiltered,
    tags: filterTags.length,
    search: searchValue ? 'yes' : 'no'
  });
};
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
const checkSameTeacher = (teacher1?: string, teacher2?: string): boolean => {
  if (!teacher1 || !teacher2 || teacher1.trim() === "" || teacher2.trim() === "") {
    return false;
  }
  
  // แยกชื่ออาจารย์ที่คั่นด้วย comma หรือ /
  const teachers1 = teacher1.split(/[,\/]/).map(name => name.trim()).filter(name => name !== '');
  const teachers2 = teacher2.split(/[,\/]/).map(name => name.trim()).filter(name => name !== '');
  
  // ตรวจสอบว่ามีอาจารย์คนใดคนหนึ่งเหมือนกันหรือไม่
  return teachers1.some(t1 => teachers2.some(t2 => t1 === t2));
};

const checkSameRoom = (room1?: string, room2?: string): boolean => {
  if (!room1 || !room2 || room1.trim() === "" || room2.trim() === "") {
    return false;
  }
  
  // ไม่ตรวจสอบความขัดแย้งของห้อง TBA
  if (room1.toUpperCase().includes('TBA') || room2.toUpperCase().includes('TBA')) {
    return false;
  }
  
  return room1.trim() === room2.trim();
};


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
    // ข้าม SubCell ที่เป็นตัวเดียวกัน (เมื่อเป็นการย้าย)
    if (excludeSubCellId && existingSubCell.id === excludeSubCellId) {
      console.log('⏭️ Skipping excluded SubCell:', existingSubCell.id);
      continue;
    }

    // ตรวจสอบการทับซ้อนของเวลาก่อน
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
      // ตัวแปรสำหรับเปรียบเทียบ
      const isSameSubject = newSubCell.classData.subject === existingSubCell.classData.subject;
      const isSameCourseCode = newSubCell.classData.courseCode === existingSubCell.classData.courseCode;
      const isSameSection = newSubCell.classData.section === existingSubCell.classData.section;
      
      // ตรวจสอบอาจารย์ (รองรับหลายชื่อคั่นด้วย comma)
      const isSameTeacher = checkSameTeacher(newSubCell.classData.teacher, existingSubCell.classData.teacher);
      
      console.log('📊 Comparison results:', {
        isSameSubject,
        isSameCourseCode,
        isSameSection,
        isSameTeacher,
        newSection: newSubCell.classData.section,
        existingSection: existingSubCell.classData.section
      });

      // **เงื่อนไข 1 (ที่สำคัญที่สุด)**: วิชาเดียวกัน + รหัสเดียวกัน + section เดียวกัน = ขัดแย้ง
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
        continue; // ไปตรวจสอบรายการถัดไป
      }

      // **เงื่อนไข 2**: วิชาเดียวกัน + รหัสเดียวกัน + section ต่างกัน = ไม่ขัดแย้ง
      if (isSameSubject && isSameCourseCode && !isSameSection) {
        console.log('✅ ALLOWED: Same subject, different sections');
        continue; // อนุญาตให้วางได้
      }

      // **เงื่อนไข 3**: อาจารย์เดียวกัน + วิชาต่างกัน = ขัดแย้ง
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

      // **เงื่อนไข 4**: ห้องเรียนขัดแย้ง (ถ้าไม่ใช่ TBA)
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

  // กำหนดประเภทขัดแย้ง
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


const showConflictModal = (conflictInfo: ConflictInfo, newSubCell: SubCell) => {
  console.log('🚨 showConflictModal called!', conflictInfo);
  
  let title = '';
  let mainMessage = '';

  // กำหนดข้อความตามประเภทขัดแย้ง - แบบเรียบง่าย
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


  // =================== MODIFIED REMOVE SUB CELL FUNCTION ===================
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
    
    // ค้นหา SubCell ที่จะย้าย (แต่ยังไม่ลบ)
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
    
    // คำนวดตำแหน่งใหม่
    const duration = subCellToMove.position.endSlot - subCellToMove.position.startSlot;
    const newEndSlot = newStartSlot + duration;
    
    // ตรวจสอบขอบเขต
    if (newEndSlot > PURE_TIME_SLOTS.length) {
      message.warning("ไม่สามารถวางที่ตำแหน่งนี้ได้ เนื่องจากเกินเวลาสิ้นสุด");
      return prevData;
    }
    
    // สร้าง SubCell ที่จะย้ายไปตำแหน่งใหม่
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
    
    // ===== การตรวจสอบความขัดแย้งแบบเข้มงวด =====
    
    // 1. ตรวจสอบการซ้อนทับในตำแหน่งเป้าหมาย
    const targetDayRows = newData.filter(row => row.day === targetRow.day);
    let hasConflictInTarget = false;
    let conflictingSubCell: SubCell | null = null;
    
    for (const row of targetDayRows) {
      if (row.subCells) {
        for (const existingSubCell of row.subCells) {
          // ข้าม SubCell ที่เป็นตัวเดียวกัน (กรณีย้ายในวันเดียวกัน)
          if (existingSubCell.id === subCellId) {
            continue;
          }
          
          // ตรวจสอบการทับซ้อนของเวลา
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
            
            // ตรวจสอบเงื่อนไขห้ามซ้ำ: วิชาเดียวกัน + section เดียวกัน
            if (isSameSubject && isSameCourseCode && isSameSection) {
              hasConflictInTarget = true;
              conflictingSubCell = existingSubCell;
              console.log('❌ CONFLICT DETECTED: Same subject, same section in target position');
              break;
            }
            
            // ตรวจสอบอาจารย์ซ้ำ
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
    
    // 2. หากพบความขัดแย้ง ให้แสดง Modal และไม่ย้าย
    if (hasConflictInTarget && conflictingSubCell) {
      console.log('🚨 Move operation blocked due to conflict');
      
      // สร้าง ConflictInfo สำหรับแสดง Modal
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
      
      // แสดง Modal แจ้งเตือน
      setTimeout(() => {
        showConflictModal(conflictInfo, movedSubCell);
      }, 100);
      
      // ไม่ย้าย SubCell (คืนค่า prevData เดิม)
      return prevData;
    }
    
    // 3. หากไม่มีความขัดแย้ง ดำเนินการย้าย
    console.log('✅ No conflicts detected, proceeding with move');
    
    // ลบ SubCell จากตำแหน่งเดิม
    const originalCellIndex = (originalRowData.subCells || []).findIndex(cell => cell.id === subCellId);
    if (originalCellIndex !== -1) {
      originalRowData.subCells!.splice(originalCellIndex, 1);
      console.log('🗑️ Removed SubCell from original position');
    }
    
    // เพิ่ม SubCell ไปยังตำแหน่งใหม่
    const targetRowIndex = newData.findIndex(r => r.key === targetRow.key);
    if (targetRowIndex !== -1) {
      if (!newData[targetRowIndex].subCells) {
        newData[targetRowIndex].subCells = [];
      }
      newData[targetRowIndex].subCells!.push(movedSubCell);
      
      console.log('✅ Successfully moved SubCell to target row');
      
      // จัดการ empty row ถ้าจำเป็น
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

  const isDragging = draggedSubCell !== null || draggedCourseCard !== null;

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

  // ดึงปีที่แท้จริงจาก Level และแสดงในรูปแบบ "ปีที่ X"
  const getRealStudentYearDisplay = (subCell: SubCell): string => {
    if (subCell.scheduleId && originalScheduleData) {
      const originalSchedule = originalScheduleData.find(
        (schedule: any) => schedule.ID === subCell.scheduleId
      );
      
      if (originalSchedule) {
        const level = originalSchedule?.OfferedCourses?.AllCourses?.AcademicYear?.Level;
        return getDisplayStudentYear(level);
      }
    }
    // fallback
    return getDisplayStudentYear(subCell.classData.studentYear ?? "");
  };

  const laboratoryRoom = getLaboratoryRoom(subCell);
  const realStudentYearDisplay = getRealStudentYearDisplay(subCell);
  const teachingAssistants = getTeachingAssistantsForTooltip(subCell); // ดึงข้อมูลผู้ช่วยสอน

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
            <p><b>🎓 ชั้นปี:</b> {realStudentYearDisplay}</p>
            <p><b>📄 หมู่เรียน:</b> {subCell.classData.section || "ไม่ระบุ"}</p>
            <p><b>👩‍🏫 อาจารย์:</b> {subCell.classData.teacher || "ไม่ระบุ"}</p>
            
            {/* เพิ่มข้อมูลผู้ช่วยสอน */}
            {teachingAssistants && (
              <p><b>👨‍🎓 ผู้ช่วยสอน:</b> {teachingAssistants}</p>
            )}
            
            <p><b>🏢 ห้องเรียน:</b> {subCell.classData.room || "ไม่ระบุ"}</p>
            
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
        trigger={isDragging ? [] : ["hover"]}
        open={isDragging ? false : undefined}
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

      {/* มี icon และส่วนอื่นๆ เหมือนเดิม */}
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

      <div style={{
        position: "absolute",
        left: "0",
        bottom: "0",
        right: "0",
        height: duration > 2 ? "6px" : shouldSpan ? "5px" : "4px",
        backgroundColor: `rgba(${isTimeFixed ? '153, 153, 153' : '242, 101, 34'}, ${0.3 + (duration * 0.1)})`,
        borderRadius: "0 0 6px 6px"
      }} />
      
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

const transformScheduleDataWithRowSeparation = (rawSchedules: ScheduleInterface[]): ExtendedScheduleData[] => {
  const result: ExtendedScheduleData[] = [];

  // helper: อ่านชื่ออาจารย์ (รองรับหลายตำแหน่งของ UserAllCourses)
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
      const subCells: SubCell[] = daySchedules.map((item: ScheduleInterface, index: number) => {
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

        // ใช้เฉพาะ Level จาก AcademicYear
        const getStudentYearFromLevel = (schedule: ScheduleInterface): string => {
          const level = (schedule.OfferedCourses?.AllCourses as any)?.AcademicYear?.Level;
          return normalizeStudentYear(level);
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
          studentYear: getStudentYearFromLevel(item), // ใช้ Level เป็นหลัก
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
// แทนที่ฟังก์ชันเดิมด้วยอันนี้
const doSubCellsOverlap = (subCell1: SubCell, subCell2: SubCell): boolean => {
  // ถ้าเป็น SubCell เดียวกัน (ID เดียวกัน) ให้ return false
  if (subCell1.id === subCell2.id) {
    return false;
  }

  // ตรวจสอบว่าเป็น "exact duplicate" (เนื้อหาเดียวกัน + เวลาเดียวกัน + วันเดียวกัน)
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

  // ถ้าเป็น exact duplicate และเป็นคนละ object (id ต่างกัน) -> ถือว่า "ซ้อนทับ" (conflict)
  if (isExactDuplicate) {
    return true;
  }

  // ตรวจสอบการทับซ้อนของเวลาปกติ (slot-based)
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
  useEffect(() => {
  if (academicYear && term && major_name) {
    getSchedules();
  }
}, [academicYear, term, major_name]);

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

  // =================== UPDATE EXISTING SCHEDULE ===================http://localhost:8080"
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
        const apiUrl = "https://cpeoffice.sut.ac.th/plan/api/";
        // const apiUrl = "http://localhost:8001";
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
  // เก็บเฉพาะ TimeFixed Courses ไว้
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

          {/* Laboratory Filter */}
          <div>
            <label style={{ fontSize: "12px", color: "#666", marginBottom: "4px", display: "block" }}>
              🔬 ห้องแลป:
            </label>
            <AutoComplete
              placeholder="เลือกห้องแลป"
              options={filterOptions.laboratories.map(lab => ({ value: lab }))}
              onSelect={(value) => addFilterTag('laboratory', value)}
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
    // Buffer polyfill (เหมือนเดิม)
    if (typeof (window as any).Buffer === "undefined") {
      try {
        // @ts-ignore
        const bufferMod = await import("buffer");
        (window as any).Buffer = bufferMod?.Buffer || (bufferMod as any)?.default?.Buffer;
      } catch (e) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement("script");
          s.src = "https://cdn.jsdelivr.net/npm/buffer@6.0.3/index.js";
          s.onload = () => resolve();
          s.onerror = (err) => reject(err);
          document.head.appendChild(s);
        });
      }
    }

    // load xlsx-populate browser build
    // @ts-ignore
    const XlsxPopulateModule = await import("xlsx-populate/browser/xlsx-populate.min.js");
    const XlsxPopulate: any = XlsxPopulateModule?.default || XlsxPopulateModule || (window as any).XlsxPopulate;
    if (!XlsxPopulate) throw new Error("ไม่สามารถโหลด xlsx-populate (browser build) ได้");

    // helpers
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

    // แก้ไข interface เพื่อเพิ่มฟิลด์ผู้ช่วยสอน
    interface SubjectInfo {
      subject: string;
      courseCode: string;
      teacher: string;
      teachingAssistants: string; // เพิ่มฟิลด์ผู้ช่วยสอน
      section: string;
      studentYear: string;
      room: string;
      laboratoryRoom: string;
      capacity: number;
      schedule: Map<string, Array<{ startTime: string; endTime: string; room: string }>>;
      isTimeFixed: boolean;
    }

    // ฟังก์ชันดึงข้อมูลห้องแลป
    const getLaboratoryRoom = (scheduleId: number): string => {
      if (scheduleId && originalScheduleData) {
        const originalSchedule = originalScheduleData.find(
          (schedule: any) => schedule.ID === scheduleId
        );
        
        const labRoom = originalSchedule?.OfferedCourses?.Laboratory?.Room;
        return labRoom && labRoom.trim() !== "" ? labRoom.trim() : "";
      }
      return "";
    };

    // เพิ่มฟังก์ชันดึงข้อมูลผู้ช่วยสอน
    const getTeachingAssistants = (scheduleId: number): string => {
      if (scheduleId && originalScheduleData) {
        const originalSchedule = originalScheduleData.find(
          (schedule: any) => schedule.ID === scheduleId
        );
        
        if (originalSchedule?.ScheduleTeachingAssistant && originalSchedule.ScheduleTeachingAssistant.length > 0) {
          const assistants = originalSchedule.ScheduleTeachingAssistant
            .map((sta: any) => {
              if (sta.TeachingAssistant) {
                const title = sta.TeachingAssistant.Title?.Title || '';
                const firstname = sta.TeachingAssistant.Firstname || '';
                const lastname = sta.TeachingAssistant.Lastname || '';
                return `${title}${firstname} ${lastname}`.trim();
              }
              return '';
            })
            .filter(Boolean)
            .join(', ');
          
          return assistants;
        }
      }
      return "";
    };

    // build allSubjects พร้อมข้อมูลห้องแลปและผู้ช่วยสอน
    const allSubjects = new Map<string, SubjectInfo>();
    scheduleData.forEach((dayData: any) => {
      if (dayData.subCells && dayData.subCells.length > 0) {
        dayData.subCells.forEach((subCell: any) => {
          const key = `${subCell.classData.courseCode || "NO_CODE"}-${subCell.classData.section || "1"}`;
          if (!allSubjects.has(key)) {
            let capacity = 30;
            let laboratoryRoom = "";
            let teachingAssistants = ""; // เพิ่มการดึงข้อมูลผู้ช่วยสอน
            
            if (subCell.scheduleId && originalScheduleData) {
              const originalSchedule = originalScheduleData.find((s: any) => s.ID === subCell.scheduleId);
              if (originalSchedule?.OfferedCourses?.Capacity !== undefined) {
                capacity = originalSchedule.OfferedCourses.Capacity;
              }
              // ดึงข้อมูลห้องแลป
              laboratoryRoom = getLaboratoryRoom(subCell.scheduleId);
              // ดึงข้อมูลผู้ช่วยสอน
              teachingAssistants = getTeachingAssistants(subCell.scheduleId);
            }
            
            allSubjects.set(key, {
              subject: subCell.classData.subject || "ไม่ระบุวิชา",
              courseCode: subCell.classData.courseCode || "N/A",
              teacher: subCell.classData.teacher || "ไม่ระบุอาจารย์",
              teachingAssistants: teachingAssistants, // เพิ่มข้อมูลผู้ช่วยสอน
              section: subCell.classData.section || "1",
              studentYear: subCell.classData.studentYear || "",
              room: subCell.classData.room || "ไม่ระบุห้อง",
              laboratoryRoom: laboratoryRoom,
              capacity,
              schedule: new Map<string, Array<{ startTime: string; endTime: string; room: string }>>(),
              isTimeFixed: !!subCell.isTimeFixed,
            });
          }
          const s = allSubjects.get(key)!;
          if (!s.schedule.has(subCell.day)) s.schedule.set(subCell.day, []);
          s.schedule.get(subCell.day)!.push({
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

    // workbook
    const workbook: any = await XlsxPopulate.fromBlankAsync();

    // color map
    const exportSubjectColors = [
      "FFE5E5","E5F3FF","E5FFE5","FFF5E5","F5E5FF","E5FFF5",
      "FFE5F5","F5FFE5","E5E5FF","FFF5F5","FFE5CC","CCFFE5",
      "E5CCFF","FFCCF5","CCF5FF","F5CCFF","CCFFF5","FFCCCC",
      "CCCCFF","F5F5CC","E5FFCC","CCE5FF","FFCCE5","CCCCE5",
      "E5CCCC","CCFFCC","FFFFCC","FFCCFF","CCFFFF","E5E5CC"
    ];
    const exportSubjectColorMap = new Map<string, string>();
    let exportColorIndex = 0;
    for (const k of Array.from(allSubjects.keys())) {
      exportSubjectColorMap.set(k, exportSubjectColors[exportColorIndex % exportSubjectColors.length]);
      exportColorIndex++;
    }
    const getExportSubjectColor = (key: string) => exportSubjectColorMap.get(key) || "FFFFFF";

    // split groups (same as before)
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

    const sheetsDef: { name: string; items: Array<[string, SubjectInfo]> }[] = [
      { name: "Fixed Time", items: fixedSubjects },
      { name: "Year 2", items: year2 },
      { name: "Year 3", items: year3 },
      { name: "Year 4", items: year4 },
      { name: "Others", items: others },
    ];

    // constants
    const TIME_COL_WIDTH = 7;
    const LINE_HEIGHT = 12;
    const MIN_ROW_HEIGHT = 16;

    // create sheet fn พร้อมการรองรับห้องแลปและผู้ช่วยสอน
    const createSheetFromItems = (sheet: any, items: Array<[string, SubjectInfo]>) => {
      const DAYS_LOCAL = DAYS;
      const header1: string[] = ['วิชา', 'กลุ่ม', 'คน/กลุ่ม', 'อาจารย์', 'ผู้ช่วยสอน']; // เพิ่มคอลัมน์ผู้ช่วยสอน
      DAYS_LOCAL.forEach((day: string) => {
        header1.push(day);
        for (let i = 1; i < compactTimeSlots.length; i++) header1.push('');
      });
      const header2: string[] = ['รหัส/ชื่อวิชา', 'Section', 'Capacity', 'Teacher', 'Teaching Assistant']; // เพิ่มคอลัมน์ผู้ช่วยสอน
      DAYS_LOCAL.forEach(() => compactTimeSlots.forEach(t => header2.push(t)));
      const totalColumns = 5 + (DAYS_LOCAL.length * compactTimeSlots.length); // เปลี่ยนจาก 4 เป็น 5

      // write headers
      for (let c = 1; c <= totalColumns; c++) {
        sheet.cell(`${colToLetter(c)}1`).value(header1[c - 1] || "");
        sheet.cell(`${colToLetter(c)}2`).value(header2[c - 1] || "");
      }

      // merge header days
      let curCol = 6; // เปลี่ยนจาก 5 เป็น 6 เพราะเพิ่มคอลัมน์ผู้ช่วยสอน
      for (let d = 0; d < DAYS_LOCAL.length; d++) {
        const startCol = curCol;
        const endCol = curCol + compactTimeSlots.length - 1;
        sheet.range(`${colToLetter(startCol)}1:${colToLetter(endCol)}1`).merged(true);
        curCol = endCol + 1;
      }

      // widths/heights
      sheet.column("A").width(30);
      sheet.column("B").width(8);
      sheet.column("C").width(8);
      sheet.column("D").width(22);
      sheet.column("E").width(25); // เพิ่มคอลัมน์ผู้ช่วยสอน
      for (let c = 6; c <= totalColumns; c++) sheet.column(colToLetter(c)).width(TIME_COL_WIDTH); // เปลี่ยนจาก 5 เป็น 6
      sheet.row(1).height(28);
      sheet.row(2).height(18);

      // style header1
      const lastColLetter = colToLetter(totalColumns);
      sheet.range(`A1:${lastColLetter}1`).style('fill', 'E3F2FD');
      sheet.range(`A1:${lastColLetter}1`).style('bold', true);
      sheet.range(`A1:${lastColLetter}1`).style('horizontalAlignment', 'center');
      sheet.range(`A1:${lastColLetter}1`).style('verticalAlignment', 'center');

      if (items.length === 0) {
        sheet.cell("A3").value("ไม่มีข้อมูลใน sheet นี้");
        sheet.range(`A1:${lastColLetter}4`).style('border', true);
        return;
      }

      // write subjects พร้อมข้อมูลห้องแลปและผู้ช่วยสอน
      let rowPtr = 3;
      for (const [key, subjectInfo] of items) {
        // prepare text
        const courseCodeText = subjectInfo.courseCode.length > 12 ? subjectInfo.courseCode.substring(0,12) + "..." : subjectInfo.courseCode;
        const courseNameText = subjectInfo.subject.length > 25 ? subjectInfo.subject.substring(0,25) + "..." : subjectInfo.subject;
        const aText = `${courseCodeText}\n${courseNameText}`;

        // teachers split to lines
        const teacherRaw = subjectInfo.teacher || "";
        const teacherLines = teacherRaw.split(",").map((s: string) => s.trim()).filter(Boolean);
        const teacherText = teacherLines.join("\n") || "";

        // MERGE A, D, and E across two rows
        sheet.range(`A${rowPtr}:A${rowPtr + 1}`).merged(true);
        sheet.cell(`A${rowPtr}`).value(aText).style('wrapText', true).style('horizontalAlignment', 'left');

        sheet.range(`D${rowPtr}:D${rowPtr + 1}`).merged(true);
        sheet.cell(`D${rowPtr}`).value(teacherText).style('wrapText', true).style('horizontalAlignment', 'left');

        // เพิ่มการ merge คอลัมน์ผู้ช่วยสอน
        const assistantLines = subjectInfo.teachingAssistants.split(",").map((s: string) => s.trim()).filter(Boolean);
        const assistantText = assistantLines.join("\n") || "ไม่มีผู้ช่วยสอน";
        
        sheet.range(`E${rowPtr}:E${rowPtr + 1}`).merged(true);
        sheet.cell(`E${rowPtr}`).value(assistantText).style('wrapText', true).style('horizontalAlignment', 'left');

        // B and C merged vertically as before
        sheet.range(`B${rowPtr}:B${rowPtr + 1}`).merged(true);
        sheet.range(`C${rowPtr}:C${rowPtr + 1}`).merged(true);
        sheet.cell(`B${rowPtr}`).value(subjectInfo.section);
        sheet.cell(`C${rowPtr}`).value(subjectInfo.capacity);

        // compute required height: at least show 2 lines for A (code+name) and teacherLines/assistantLines
        const linesNeeded = Math.max(2, Math.max(teacherLines.length || 1, assistantLines.length || 1));
        const totalHeight = Math.max(MIN_ROW_HEIGHT * 2, LINE_HEIGHT * linesNeeded + 8); // padding
        const perRow = Math.max(MIN_ROW_HEIGHT, Math.ceil(totalHeight / 2));
        sheet.row(rowPtr).height(perRow);
        sheet.row(rowPtr + 1).height(perRow);

        // แก้ไขส่วนนี้เพื่อรองรับห้องแลปและปรับตำแหน่งคอลัมน์
        // fill times - รวมข้อมูล SEC และห้องแลปในเซลเดียวกัน
        let col = 6; // เปลี่ยนจาก 5 เป็น 6 เพราะเพิ่มคอลัมน์ผู้ช่วยสอน
        for (const day of DAYS_LOCAL) {
          const daySchedule = subjectInfo.schedule.get(day) || [];
          for (const tslot of compactTimeSlots) {
            let cellValue = "";
            
            const startHour = Number(tslot.split("-")[0]);
            if (daySchedule && daySchedule.length > 0) {
              for (const sch of daySchedule) {
                const sh = parseInt(sch.startTime.split(":")[0], 10);
                const eh = parseInt(sch.endTime.split(":")[0], 10);
                if (startHour >= sh && startHour < eh) {
                  cellValue = `SEC:${subjectInfo.section}`;
                  
                  // ถ้ามีห้องแลป ให้รวมในเซลเดียวกันด้วย \n
                  if (subjectInfo.laboratoryRoom && subjectInfo.laboratoryRoom.trim() !== "") {
                    cellValue = `SEC:${subjectInfo.section}\n${subjectInfo.laboratoryRoom}`;
                  }
                  break;
                }
              }
            }
            
            const crefTop = `${colToLetter(col)}${rowPtr}`;
            const crefBottom = `${colToLetter(col)}${rowPtr + 1}`;
            
            // ใส่ข้อมูลในบรรทัดแรกเท่านั้น และ merge กับบรรทัดที่สอง
            sheet.range(`${crefTop}:${crefBottom}`).merged(true);
            sheet.cell(crefTop).value(cellValue)
              .style('horizontalAlignment', 'center')
              .style('verticalAlignment', 'center')
              .style('wrapText', true); // เพื่อให้แสดงหลายบรรทัดในเซลเดียวกัน

            // ใส่สีถ้ามีเนื้อหา
            if (cellValue && cellValue.includes("SEC:")) {
              const colorHex = getExportSubjectColor(key);
              sheet.cell(crefTop).style('fill', colorHex).style('bold', true);
            }
            col++;
          }
        }

        rowPtr += 2;
      } // end items

      // apply borders: grid + outer thick + separators
      const lastRow = (rowPtr - 1);
      const fullRange = `A1:${lastColLetter}${lastRow}`;
      sheet.range(fullRange).style('border', true);

      // outer thick border
      sheet.range(`A1:${lastColLetter}1`).style({ topBorder: 'thick' });
      sheet.range(`A${lastRow}:${lastColLetter}${lastRow}`).style({ bottomBorder: 'thick' });
      sheet.range(`A1:A${lastRow}`).style({ leftBorder: 'thick' });
      sheet.range(`${lastColLetter}1:${lastColLetter}${lastRow}`).style({ rightBorder: 'thick' });

      // thick separation between main info and time grid
      sheet.range(`E1:E${lastRow}`).style({ rightBorder: 'thick' }); // เปลี่ยนจาก D เป็น E

      // medium borders between days
      let dayColStart = 6; // เปลี่ยนจาก 5 เป็น 6
      for (let d = 0; d < DAYS_LOCAL.length; d++) {
        const dayStart = dayColStart;
        const dayEnd = dayStart + compactTimeSlots.length - 1;
        const dayEndLetter = colToLetter(dayEnd);
        sheet.range(`${dayEndLetter}1:${dayEndLetter}${lastRow}`).style({ rightBorder: 'medium' });
        const dayStartLetter = colToLetter(dayStart);
        sheet.range(`${dayStartLetter}1:${dayStartLetter}${lastRow}`).style({ leftBorder: 'medium' });
        dayColStart = dayEnd + 1;
      }

      // format header row2 smaller, centered
      sheet.range(`A2:${lastColLetter}2`).style({ bold: true, horizontalAlignment: 'center', verticalAlignment: 'center' });
    };

    // create sheets (same logic)
    let first = true;
    for (const def of sheetsDef) {
      if (first) {
        const sheet = workbook.sheet(0);
        try { sheet.name(def.name); } catch (e) { /* ignore */ }
        createSheetFromItems(sheet, def.items);
        first = false;
      } else {
        const newSheet = workbook.addSheet(def.name);
        createSheetFromItems(newSheet, def.items);
      }
    }

    // output
    const now = new Date();
    const filename = `ตารางสอน_with_lab_and_ta_${now.toISOString().slice(0,19).replace(/[-:]/g,'').replace('T','_')}.xlsx`;
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
    message.success(`สร้างไฟล์ Excel พร้อมข้อมูลห้องแลปและผู้ช่วยสอน: ${filename}`);
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
      render: (_text: string, record: ExtendedScheduleData) => {
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

  // =================== EFFECTS ===================
  // แก้ไข useEffect สำหรับการโหลดอัตโนมัติ

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