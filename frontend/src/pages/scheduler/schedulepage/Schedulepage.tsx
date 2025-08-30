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
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  CloseOutlined,
  SearchOutlined,
  FilterOutlined,
  ClearOutlined,
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



// =================== TYPE DEFINITIONS ===================

interface ClassInfo {
  subject: string;
  teacher: string;
  room: string;
  color?: string;
  section?: string;
  courseCode?: string;
  studentYear?: string;
  // ใหม่: เก็บ OfferedCourses id เพื่อใช้เปรียบเทียบเมื่อรวมช่วง
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
  type: 'teacher' | 'studentYear';
  value: string;
  label: string;
  color: string;
}

interface FilterOptions {
  teachers: string[];
  studentYears: string[];
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

const BACKGROUND_COLORS = [
  "#FFE5E5", "#E5F3FF", "#E5FFE5", "#FFF5E5", "#F5E5FF", "#E5FFF5",
  "#FFE5F5", "#F5FFE5", "#E5E5FF", "#FFF5F5", "#FFE5CC", "#CCFFE5",
  "#E5CCFF", "#FFCCF5", "#CCF5FF", "#F5CCFF", "#CCFFF5", "#FFCCCC",
  "#CCCCFF", "#F5F5CC",
];

// =================== FILTER TAG COLORS ===================
const FILTER_TAG_COLORS = {
  teacher: '#52c41a',
  studentYear: '#1890ff'
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
const getRandomBackgroundColor = (): string => {
  return BACKGROUND_COLORS[Math.floor(Math.random() * BACKGROUND_COLORS.length)];
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
    studentYears: []
  });
  const [searchValue, setSearchValue] = useState("");
  const [filterVisible, setFilterVisible] = useState(false);

  const tableRef = useRef<HTMLDivElement>(null);

  // =================== FILTER FUNCTIONS ===================
  const extractFilterOptions = (data: ExtendedScheduleData[]) => {
    const teachers = new Set<string>();
    const studentYears = new Set<string>();

    data.forEach(dayData => {
      dayData.subCells?.forEach(subCell => {
        if (subCell.classData.teacher) teachers.add(subCell.classData.teacher);
        // เพิ่มการดึงชั้นปีจาก subCell ด้วย
        if (subCell.classData.studentYear) {
          studentYears.add(subCell.classData.studentYear);
        }
      });
    });

    // Extract student years from original API data เท่านั้น (ไม่ hardcode)
    if (originalScheduleData && originalScheduleData.length > 0) {
      originalScheduleData.forEach((schedule: any) => {
        // ใช้ any เพื่อหลีกเลี่ยง TypeScript error
        if (schedule.OfferedCourses?.AllCourses?.AcademicYear?.AcademicYearID) {
          const academicYearId = schedule.OfferedCourses.AllCourses.AcademicYear.AcademicYearID;
          // เก็บเป็นตัวเลขแทน "ปีที่ X"
          studentYears.add(academicYearId.toString());
        }
        
        // Alternative: ถ้ามี field อื่นที่บอกชั้นปี
        if (schedule.OfferedCourses?.AllCourses?.AcademicYear?.Level) {
          const level = schedule.OfferedCourses.AllCourses.AcademicYear.Level;
          if (level && level !== 'เรียนได้ทุกชั้นปี') {
            // ถ้า Level เป็น "ปีที่ X" ให้แปลงเป็นตัวเลข
            const yearMatch = level.match(/ปีที่\s*(\d+)/);
            if (yearMatch) {
              studentYears.add(yearMatch[1]);
            } else if (!level.includes('ปีที่')) {
              // ถ้าเป็นตัวเลขอยู่แล้ว
              studentYears.add(level);
            }
          }
        }
      });
    }
    
    // ✅ ลบ hardcode ออกทั้งหมด - ใช้เฉพาะข้อมูลจาก API

    // กรองเฉพาะตัวเลข 1-9 (เผื่อมีปีอื่นๆ ในอนาคต)
    const validYears = Array.from(studentYears).filter(year => {
      const num = parseInt(year);
      return !isNaN(num) && num >= 1 && num <= 9;
    });

    setFilterOptions({
      teachers: Array.from(teachers).filter(Boolean).sort(),
      studentYears: validYears.sort((a, b) => parseInt(a) - parseInt(b))
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

  // ❌ ไม่ต้อง filter วันทิ้ง
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
    scheduleId?: number
  ): SubCell => {
    const cleanStartTime = startTime.includes('-') ? startTime.split('-')[0] : startTime;
    const cleanEndTime = endTime.includes('-') ? endTime.split('-')[1] || endTime : endTime;
    
    const startSlot = timeToSlotIndex(cleanStartTime);
    const endSlot = timeToSlotIndex(cleanEndTime);
    
    return {
      id: `${day}-${Date.now()}-${Math.random()}`,
      classData: {
        ...classData,
        color: classData.color || getRandomBackgroundColor()
      },
      startTime: cleanStartTime,
      endTime: cleanEndTime,
      day,
      position: {
        startSlot,
        endSlot
      },
      zIndex: 1,
      scheduleId: scheduleId
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
      
      // ✅ เช็ควา่เพิ่มลงในแถวสุดท้ายของวันหรือไม่
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
      
      // ✅ เพิ่ม empty row หลังจากแถวใหม่
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

  const removeSubCell = (subCellId: string) => {
    setScheduleData(prevData => {
      return prevData.map(dayData => ({
        ...dayData,
        subCells: (dayData.subCells || []).filter(cell => cell.id !== subCellId)
      }));
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
      
      // ✅ เช็ควา่ย้ายไปแถวสุดท้ายหรือไม่ และสร้าง empty row ใหม่ถ้าจำเป็น
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

  const handleCellDragOver = (e: React.DragEvent, targetRow: ExtendedScheduleData, timeSlot: string) => {
    e.preventDefault();
    
    if (!draggedSubCell) return;
    
    const slotIndex = timeToSlotIndex(timeSlot.split('-')[0]);
    const duration = draggedSubCell.position.endSlot - draggedSubCell.position.startSlot;
    
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
    
    if (!draggedSubCell) return;
    
    const slotIndex = timeToSlotIndex(timeSlot.split('-')[0]);
    
    // ตรวจสอบการทับซ้อนในแถวเป้าหมาย
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
  };

  // =================== RENDER SUB-CELL FUNCTION ===================
  const renderSubCell = (subCell: SubCell) => {
    const duration = subCell.position.endSlot - subCell.position.startSlot;
    const shouldSpan = duration > 1;

    return (
      <div
        key={subCell.id}
        draggable
        onDragStart={(e) => handleSubCellDragStart(e, subCell)}
        onDragEnd={handleSubCellDragEnd}
        style={{
          backgroundColor: subCell.classData.color,
          border: "2px solid rgba(0,0,0,0.2)",
          borderRadius: "6px",
          padding: "6px 8px",
          cursor: "grab",
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
          boxShadow: shouldSpan ? 
            "0 4px 12px rgba(242, 101, 34, 0.4)" : 
            "0 3px 6px rgba(0,0,0,0.15)",
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
              <div style={{ fontWeight: "bold", fontSize: "14px", marginBottom: "6px", color: "#F26522" }}>
                📚 รายละเอียดวิชา
              </div>

              <p><b>🏷️ รหัสวิชา:</b> {subCell.classData.courseCode || "ไม่ระบุ"}</p>
              <p><b>📖 ชื่อวิชา:</b> {subCell.classData.subject || "ไม่ระบุ"}</p>
              <p><b>🎓 ชั้นปี:</b> {subCell.classData.studentYear ? `ปีที่ ${subCell.classData.studentYear}` : "ไม่ระบุ"}</p>
              <p><b>📝 หมู่เรียน:</b> {subCell.classData.section || "ไม่ระบุ"}</p>
              <p><b>👩‍🏫 อาจารย์:</b> {subCell.classData.teacher || "ไม่ระบุ"}</p>
              <p><b>🏢 ห้องเรียน:</b> {subCell.classData.room || "ไม่ระบุ"}</p>
              <p><b>📅 วัน:</b> {subCell.day}</p>
              <p><b>🕐 เวลา:</b> {subCell.startTime} - {subCell.endTime}</p>
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

        {/* Delete Button */}
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

        {/* Duration Indicator */}
        <div style={{
          position: "absolute",
          bottom: "4px",
          left: "4px",
          fontSize: duration > 2 ? "10px" : "9px",
          color: "#F26522",
          fontWeight: "bold",
          backgroundColor: "rgba(255,255,255,0.95)",
          borderRadius: "4px",
          padding: duration > 1 ? "2px 6px" : "1px 4px",
          border: "1px solid rgba(242, 101, 34, 0.4)"
        }}>
          {duration}คาบ
        </div>

        {/* Proportional Height Indicator */}
        <div style={{
          position: "absolute",
          left: "0",
          bottom: "0",
          right: "0",
          height: duration > 2 ? "6px" : shouldSpan ? "5px" : "4px",
          backgroundColor: `rgba(242, 101, 34, ${0.3 + (duration * 0.1)})`,
          borderRadius: "0 0 6px 6px"
        }} />
        
        {/* Visual Scale Indicator */}
        {duration > 1 && (
          <div style={{
            position: "absolute",
            right: "4px",
            bottom: "4px",
            fontSize: "8px",
            color: "#F26522",
            fontWeight: "bold",
            backgroundColor: "rgba(255,255,255,0.9)",
            borderRadius: "3px",
            padding: "1px 4px",
            border: "1px solid rgba(242, 101, 34, 0.3)"
          }}>
            {duration}ช่อง
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

// ✅ ปรับปรุงการเรียกใช้ใน transformScheduleDataWithRowSeparation (ลบการ merge)
const transformScheduleDataWithRowSeparation = (rawSchedules: ScheduleInterface[]): ExtendedScheduleData[] => {
  
  const result: ExtendedScheduleData[] = [];
  
  DAYS.forEach((day, dayIndex) => {
    const daySchedules = rawSchedules.filter(item => item.DayOfWeek === day);
    
    if (daySchedules.length === 0) {
      // สร้างแถวว่างสำหรับวันที่ไม่มีเรียน
      const firstRow = createEmptyDayRow(day, dayIndex, 0, 2);
      const secondRow = createEmptyDayRow(day, dayIndex, 1, 2);
      secondRow.isFirstRowOfDay = false;
      result.push(firstRow, secondRow);
    } else {
      // สร้าง SubCells
      const subCells: SubCell[] = daySchedules.map((item: ScheduleInterface, index: number) => {
        // ... (โค้ดสำหรับสร้าง subCells - เหมือนเดิม)
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
          const academicYearId = (schedule.OfferedCourses?.AllCourses as any)?.AcademicYear?.AcademicYearID;
          if (academicYearId && academicYearId >= 1) {
            return academicYearId.toString();
          }
          const level = (schedule.OfferedCourses?.AllCourses as any)?.AcademicYear?.Level;
          if (level && level !== 'เรียนได้ทุกชั้นปี') {
            const yearMatch = level.match(/ปีที่\s*(\d+)/);
            if (yearMatch) {
              return yearMatch[1];
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
        
        return createSubCell(classInfo, day, startTime, endTime, item.ID);
      });

      // แยกการทับซ้อน
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

        // เติม time slots
        TIME_SLOTS.forEach((time) => {
          const matched = rowSubCells.filter(subCell => 
            isTimeInSlot(subCell.startTime, subCell.endTime, time)
          );

          if (matched.length > 0) {
            dayData[time] = {
              backgroundColor: getRandomBackgroundColor(),
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
  // แก้ไขฟังก์ชัน doSubCellsOverlap - เพิ่มการตรวจสอบข้อมูลซ้ำที่แม่นยำ
const doSubCellsOverlap = (subCell1: SubCell, subCell2: SubCell): boolean => {
  // ถ้าเป็น SubCell เดียวกัน (ID เดียวกัน) ให้ return false
  if (subCell1.id === subCell2.id) {
    return false;
  }

  // ตรวจสอบข้อมูลซ้ำ: ต้องเหมือนกันทุกอย่าง
  const isDuplicate = 
    subCell1.classData.subject === subCell2.classData.subject &&
    subCell1.classData.section === subCell2.classData.section &&
    subCell1.classData.studentYear === subCell2.classData.studentYear &&
    subCell1.classData.teacher === subCell2.classData.teacher &&
    subCell1.startTime === subCell2.startTime &&
    subCell1.endTime === subCell2.endTime &&
    subCell1.day === subCell2.day;

  if (isDuplicate) {
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
  const getSchedules = async (nameTable: string) => {
    try {
      const res = await getSchedulesBynameTable(nameTable);
      if (res && Array.isArray(res.data)) {
        console.log('📊 Raw schedule data from API:', res.data);
        
        // Type cast เพื่อใช้ interface ที่ถูกต้อง
        const typedSchedules = res.data as ScheduleInterface[];
        
        const newScheduleData = transformScheduleDataWithRowSeparation(typedSchedules);
        setScheduleData(newScheduleData);
        
        // เก็บข้อมูลต้นฉบับและเซ็ต state
        setOriginalScheduleData(res.data);
        setCurrentTableName(nameTable);
        setIsTableFromAPI(true);
     
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
    if (!academicYear || !term) {
      message.warning("กรุณาระบุปีการศึกษาและเทอม");
      return;
    }

    try {
      const res = await postAutoGenerateSchedule(Number(academicYear), Number(term), major_name);
      const nameTable = `ปีการศึกษา ${academicYear} เทอม ${term}`;

      if (res.status === 200 && res.data) {
        const tableRes = await getSchedulesBynameTable(nameTable);
        if (tableRes.status === 200 && tableRes.data) {
          console.log('📊 Auto-generated schedule data:', tableRes.data);
          
          // Type cast เพื่อใช้ interface ที่ถูกต้อง
          const typedSchedules = tableRes.data as ScheduleInterface[];
          
          const newScheduleData = transformScheduleDataWithRowSeparation(typedSchedules);
          setScheduleData(newScheduleData);
          
          // เก็บข้อมูลต้นฉบับและเซ็ต state
          setOriginalScheduleData(tableRes.data);
          setCurrentTableName(nameTable);
          setIsTableFromAPI(true);
          
          message.success("สร้างตารางอัตโนมัติสำเร็จ และโหลดตารางแล้ว");
        } else {
          message.warning("สร้างตารางสำเร็จ แต่โหลดข้อมูลตารางไม่สำเร็จ");
        }
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
  const handleLoadSchedule = async (scheduleName: string) => {
    try {
      const res = await getSchedulesBynameTable(scheduleName);
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

      // ✅ สร้าง payload เป็น array ตาม Backend API format (PascalCase)
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

  // ✅ ฟังก์ชัน fallback สำหรับอัปเดตทีละรายการ
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
    clearAllFilters();
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
            gridTemplateColumns: "1fr 1fr", 
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
          </div>
        )}
      </div>
    );
  };

const exportScheduleToXLSX = async () => {
  if (scheduleData.length === 0) {
    message.warning("ไม่มีข้อมูลให้ส่งออก กรุณาสร้างตารางก่อน");
    return;
  }

  try {
    const hide = message.loading("กำลังสร้าง Excel...", 0);

    // สร้าง header row
    const timeHeaders = ['วัน/เวลา', ...TIME_SLOTS];

    // สร้าง body data จาก scheduleData
    const tableData: (string | number)[][] = [];
    
    // เพิ่ม header row ลงใน tableData
    tableData.push(timeHeaders);
    
    // จัดกลุ่มข้อมูลตามวัน
    const dayGroups = DAYS.map(day => {
      const dayRows = scheduleData.filter(row => row.day === day);
      return { day, rows: dayRows };
    });

    dayGroups.forEach(({ day, rows }) => {
      if (rows.length === 0) {
        // วันที่ไม่มีเรียน - สร้างแถวว่าง
        const emptyRow: (string | number)[] = [day];
        TIME_SLOTS.forEach(timeSlot => {
          if (timeSlot === "12:00-13:00") {
            emptyRow.push("พักเที่ยง");
          } else {
            emptyRow.push("");
          }
        });
        tableData.push(emptyRow);
      } else {
        // วันที่มีเรียน - วนลูปแต่ละ row
        rows.forEach((row, rowIndex) => {
          const rowData: (string | number)[] = [rowIndex === 0 ? day : ""]; // แสดงชื่อวันเฉพาะแถวแรก
          
          TIME_SLOTS.forEach(timeSlot => {
            if (timeSlot === "12:00-13:00") {
              rowData.push("พักเที่ยง");
              return;
            }

            // หาวิชาในช่วงเวลานี้
            const subCellsInSlot = (row.subCells || []).filter(subCell => {
              const timeSlotIndex = timeSlotToSlotIndex(timeSlot);
              return subCell.position.startSlot <= timeSlotIndex && 
                     subCell.position.endSlot > timeSlotIndex;
            });

            if (subCellsInSlot.length > 0) {
              const subCell = subCellsInSlot[0];
              const cellTextParts = [
                subCell.classData.subject || "ไม่ระบุชื่อวิชา",
                `รหัส: ${subCell.classData.courseCode || "ไม่ระบุ"}`,
                `อาจารย์: ${subCell.classData.teacher || "ไม่ระบุ"}`,
                `ห้อง: ${subCell.classData.room || "ไม่ระบุ"}`,
                `ปีที่: ${subCell.classData.studentYear || '1'}`,
                `หมู่: ${subCell.classData.section || "ไม่ระบุ"}`,
                `เวลา: ${subCell.startTime} - ${subCell.endTime}`
              ];
              
              const cellText = cellTextParts.join('\n');
              rowData.push(cellText);
            } else {
              rowData.push("");
            }
          });
          
          tableData.push(rowData);
        });
      }
    });

    // สร้าง workbook และ worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(tableData);

    // ตั้งค่าความกว้างของคอลัมน์
    const colWidths = [
      { wch: 15 }, // คอลัมน์วัน
      ...TIME_SLOTS.map(() => ({ wch: 25 })) // คอลัมน์เวลา
    ];
    ws['!cols'] = colWidths;

    // ตั้งค่าความสูงของแถว
    const rowHeights = tableData.map((_, index) => {
      if (index === 0) return { hpt: 25 }; // header row
      return { hpt: 60 }; // data rows
    });
    ws['!rows'] = rowHeights;

    // จัดรูปแบบเซลล์ header
    const headerRange = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
      const headerCell = ws[XLSX.utils.encode_cell({ r: 0, c: col })];
      if (headerCell) {
        headerCell.s = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "F26522" } },
          alignment: { horizontal: "center", vertical: "center" }
        };
      }
    }

    // จัดรูปแบบคอลัมน์วัน (คอลัมน์แรก)
    for (let row = 1; row <= headerRange.e.r; row++) {
      const dayCell = ws[XLSX.utils.encode_cell({ r: row, c: 0 })];
      if (dayCell && dayCell.v) {
        dayCell.s = {
          font: { bold: true },
          fill: { fgColor: { rgb: "F8F9FA" } },
          alignment: { horizontal: "center", vertical: "center" }
        };
      }
    }

    // จัดรูปแบบเซลล์พักเที่ยง
    for (let row = 1; row <= headerRange.e.r; row++) {
      for (let col = 1; col <= headerRange.e.c; col++) {
        const cell = ws[XLSX.utils.encode_cell({ r: row, c: col })];
        if (cell && cell.v === "พักเที่ยง") {
          cell.s = {
            font: { bold: true, color: { rgb: "666666" } },
            fill: { fgColor: { rgb: "FFF5E5" } },
            alignment: { horizontal: "center", vertical: "center" }
          };
        } else if (cell && cell.v && cell.v !== "") {
          // เซลล์ที่มีข้อมูล
          cell.s = {
            alignment: { horizontal: "center", vertical: "center", wrapText: true },
            border: {
              top: { style: "thin", color: { rgb: "000000" } },
              bottom: { style: "thin", color: { rgb: "000000" } },
              left: { style: "thin", color: { rgb: "000000" } },
              right: { style: "thin", color: { rgb: "000000" } }
            }
          };
        }
      }
    }

    // เพิ่ม worksheet ลง workbook
    let sheetName = "ตารางเรียน";
    if (currentTableName) {
      sheetName = currentTableName.length > 31 ? currentTableName.substring(0, 31) : currentTableName;
    }
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // เพิ่มข้อมูลการกรองในแผ่นงานใหม่ (ถ้ามี)
    if (filterTags.length > 0 || searchValue) {
      const filterData: (string | number)[][] = [
        ["ข้อมูลการกรอง"],
        [""],
      ];

      if (searchValue) {
        filterData.push(["ค้นหา:", searchValue]);
      }

      if (filterTags.length > 0) {
        filterData.push(["ตัวกรอง:", ""]);
        filterTags.forEach(tag => {
          const filterType = tag.type === 'teacher' ? 'อาจารย์' : 'ชั้นปี';
          filterData.push([filterType, tag.value]);
        });
      }

      const filterWs = XLSX.utils.aoa_to_sheet(filterData);
      filterWs['!cols'] = [{ wch: 20 }, { wch: 30 }];
      
      // จัดรูปแบบหัวข้อ
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

    let fileName = `ตารางเรียน_${dateStr}`;
    
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
        
        // ตรวจสอบว่าถูกครอบคลุมโดยช่องอื่นหรือไม่
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
  useEffect(() => {
    if (academicYear && term) {
      const nameTable = `ปีการศึกษา ${academicYear} เทอม ${term}`;
      getSchedules(nameTable);
    }
  }, [academicYear, term]);

  useEffect(() => {
    getAllNameTable();
  }, []);

  useEffect(() => {
    // เซ็ตชื่อชื่อตารางใน modal ให้ตรงกับตารางปัจจุบัน
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
    <div style={{ width: "100%", padding: "20px" }}>
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
          กรองข้อมูลตามอาจารย์และชั้นปี (ปีที่ 1, 2, 3, 4) | 
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
          onClick={exportScheduleToXLSX}
        >
          ส่งออก Xlsx
          {(filterTags.length > 0 || searchValue) && " (กรอง)"}
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
  );
};

export default Schedulepage;