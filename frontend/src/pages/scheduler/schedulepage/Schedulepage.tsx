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
} from "antd";
import type { ColumnsType } from "antd/es/table";
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
import jsPDF from "jspdf";
import "jspdf-autotable";

// =================== TYPE DEFINITIONS ===================
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface ClassInfo {
  subject: string;
  teacher: string;
  room: string;
  color?: string;
  section?: string;      // เพิ่ม
  courseCode?: string;   // เพิ่ม
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
  scheduleId?: number; // เพิ่ม scheduleId สำหรับ track API record
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

// ✅ เพิ่ม interface สำหรับ Schedule Change
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

// ✅ เพิ่ม interface สำหรับ Batch Update Payload (PascalCase ตาม Backend)
interface ScheduleBatchUpdate {
  ID: number;
  DayOfWeek: string;
  StartTime: string;
  EndTime: string;
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
  
  console.log(`🕐 timeToSlotIndex: ${time} -> ${cleanTime} -> ${formatted} -> index: ${index}`);
  
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
  const [scheduleData, setScheduleData] = useState<ExtendedScheduleData[]>([]);
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

  const tableRef = useRef<HTMLDivElement>(null);

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
    
    console.log(`📚 createSubCell: ${classData.subject}`, {
      startTime: cleanStartTime,
      endTime: cleanEndTime,
      startSlot,
      endSlot,
      duration: endSlot - startSlot,
      scheduleId
    });
    
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
      } else {
        // สร้างแถวใหม่
        const dayIndex = DAYS.findIndex(d => d === day);
        const newRowIndex = dayRows.length;
        
        const newRowData: ExtendedScheduleData = {
          key: `day-${dayIndex}-row-${newRowIndex}`,
          day: day,
          dayIndex: dayIndex,
          rowIndex: newRowIndex,
          isFirstRowOfDay: newRowIndex === 0,
          totalRowsInDay: newRowIndex + 1,
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
        
        // อัปเดต totalRowsInDay ของแถวอื่นในวันเดียวกัน
        newData.forEach(row => {
          if (row.day === day) {
            row.totalRowsInDay = (row.totalRowsInDay || 1) + 1;
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
          border: shouldSpan ? "3px solid #F26522" : "2px solid rgba(0,0,0,0.2)",
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

      {/* ✅ Tooltip โชว์เต็ม ไม่ใช้ ellipsis */}
      <p><b>🏷️ รหัสวิชา:</b> {subCell.classData.courseCode || "ไม่ระบุ"}</p>
      <p><b>📖 ชื่อวิชา:</b> {subCell.classData.subject || "ไม่ระบุ"}</p>
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
  {/* ✅ Block ในตาราง ใช้ ellipsis */}
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

  // =================== DATA TRANSFORMATION WITH ROW SEPARATION ===================
  const transformScheduleDataWithRowSeparation = (rawSchedules: ScheduleInterface[]): ExtendedScheduleData[] => {
    console.log('🔍 Raw schedules received:', rawSchedules.length, rawSchedules);
    
    const result: ExtendedScheduleData[] = [];
    
    DAYS.forEach((day, dayIndex) => {
      const daySchedules = rawSchedules.filter(item => item.DayOfWeek === day);
      console.log(`📅 Day ${day}: Found ${daySchedules.length} schedules`);
      
      if (daySchedules.length === 0) {
        // ไม่มีวิชา -> สร้าง 1 แถวว่าง
        const emptyDayData: ExtendedScheduleData = {
          key: `day-${dayIndex}-row-0`,
          day: day,
          dayIndex: dayIndex,
          rowIndex: 0,
          isFirstRowOfDay: true,
          totalRowsInDay: 1,
          subCells: []
        };
        
        TIME_SLOTS.forEach((time) => {
          if (time === "12:00-13:00") {
            emptyDayData[time] = {
              content: "พักเที่ยง",
              backgroundColor: "#FFF5E5",
              isBreak: true,
            };
          } else {
            emptyDayData[time] = {
              content: "",
              backgroundColor: "#f9f9f9",
              classes: [],
            };
          }
        });
        
        result.push(emptyDayData);
      } else {
        // แปลงข้อมูลเป็น SubCells โดยใช้ interface ที่ถูกต้อง
        const subCells: SubCell[] = daySchedules.map((item: ScheduleInterface, index: number) => {
          console.log(`\n🔍 Processing schedule ${index + 1}/${daySchedules.length} for ${day}:`, {
            id: item.ID,
            nameTable: item.NameTable,
            section: item.SectionNumber,
            dayOfWeek: item.DayOfWeek,
            startTime: item.StartTime,
            endTime: item.EndTime,
            offeredCoursesId: item.OfferedCoursesID,
            offeredCourses: item.OfferedCourses ? {
              id: item.OfferedCourses.ID,
              year: item.OfferedCourses.Year,
              term: item.OfferedCourses.Term,
              section: item.OfferedCourses.Section,
              allCourses: item.OfferedCourses.AllCourses ? {
                id: item.OfferedCourses.AllCourses.ID,
                code: item.OfferedCourses.AllCourses.Code,
                thaiName: item.OfferedCourses.AllCourses.ThaiName,
                englishName: item.OfferedCourses.AllCourses.EnglishName
              } : null,
              user: item.OfferedCourses.User ? {
                id: item.OfferedCourses.User.ID,
                firstname: item.OfferedCourses.User.Firstname,
                lastname: item.OfferedCourses.User.Lastname
              } : null,
              laboratory: item.OfferedCourses.Laboratory ? {
                id: item.OfferedCourses.Laboratory.ID,
                room: item.OfferedCourses.Laboratory.Room,
                building: item.OfferedCourses.Laboratory.Building
              } : null
            } : null,
            timeFixedCourses: item.TimeFixedCourses ? item.TimeFixedCourses.map(tc => ({
              id: tc.ID,
              section: tc.Section,
              roomFix: tc.RoomFix,
              dayOfWeek: tc.DayOfWeek,
              scheduleId: tc.ScheduleID
            })) : []
          });

          // ดึงข้อมูลห้องจาก TimeFixedCourses หรือ Laboratory
          const getRoomInfo = (schedule: ScheduleInterface): string => {
            console.log('🏠 Getting room info for:', {
              scheduleId: schedule.ID,
              section: schedule.SectionNumber,
              offeredCourses: schedule.OfferedCourses,
              timeFixedCourses: schedule.TimeFixedCourses,
              laboratory: schedule.OfferedCourses?.Laboratory
            });

            // 1. ลำดับความสำคัญ: TimeFixedCourses.RoomFix (สำหรับวิชาที่กำหนดเวลาแล้ว)
            if (schedule.TimeFixedCourses && schedule.TimeFixedCourses.length > 0) {
              console.log('🔍 Checking TimeFixedCourses:', schedule.TimeFixedCourses);
              
              // หาห้องจาก TimeFixedCourses ที่ตรงกับ section และ schedule นี้
              const matchingFixedCourse = schedule.TimeFixedCourses.find(
                tc => tc.Section === schedule.SectionNumber && 
                     tc.ScheduleID === schedule.ID &&
                     tc.RoomFix && tc.RoomFix.trim() !== ""
              );
              
              if (matchingFixedCourse?.RoomFix) {
                console.log('✅ Found room from matching TimeFixedCourse:', matchingFixedCourse.RoomFix);
                return matchingFixedCourse.RoomFix;
              }
              
              // ถ้าไม่มีที่ตรงทั้ง section และ scheduleId ให้หาแค่ section
              const sectionMatch = schedule.TimeFixedCourses.find(
                tc => tc.Section === schedule.SectionNumber && 
                     tc.RoomFix && tc.RoomFix.trim() !== ""
              );
              
              if (sectionMatch?.RoomFix) {
                console.log('✅ Found room from section match:', sectionMatch.RoomFix);
                return sectionMatch.RoomFix;
              }
              
              // สุดท้าย เอาอันแรกที่มีห้อง
              const firstAvailable = schedule.TimeFixedCourses.find(
                tc => tc.RoomFix && tc.RoomFix.trim() !== ""
              );
              
              if (firstAvailable?.RoomFix) {
                console.log('✅ Found room from first available TimeFixedCourse:', firstAvailable.RoomFix);
                return firstAvailable.RoomFix;
              }
            }
            
            // 2. ดูจาก OfferedCourses.Laboratory (สำหรับวิชาปฏิบัติการ)
            if (schedule.OfferedCourses?.Laboratory?.Room && 
                schedule.OfferedCourses.Laboratory.Room.trim() !== "") {
              console.log('✅ Found room from Laboratory:', schedule.OfferedCourses.Laboratory.Room);
              return schedule.OfferedCourses.Laboratory.Room;
            }
            
            // 3. ถ้าไม่มีทั้งสองแหล่ง ให้ใช้ค่าเริ่มต้น
            console.log('❌ No room found, using default');
            return "TBA"; // หรือ "ไม่ระบุห้อง"
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
          };

          const getTimeString = (time: string | Date): string => {
            if (typeof time === 'string') {
              // ถ้าเป็น string แล้วมี T ให้เอาเฉพาะส่วนเวลา
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
          
          console.log(`✅ Final classInfo for schedule ${item.ID}:`, {
            subject: classInfo.subject,
            teacher: classInfo.teacher,
            room: classInfo.room,
            section: classInfo.section,
            courseCode: classInfo.courseCode,
            day: item.DayOfWeek,
            startTime,
            endTime
          });
          
          return createSubCell(classInfo, day, startTime, endTime, item.ID);
        });

        console.log(`📊 Created ${subCells.length} SubCells for ${day}`);

        // แยกวิชาที่ซ้อนกันออกเป็นแถวต่าง ๆ
        const rowGroups = separateOverlappingSubCells(subCells);
        console.log(`🗂️ Separated into ${rowGroups.length} row groups for ${day}`);
        
        rowGroups.forEach((rowSubCells, rowIndex) => {
          const dayData: ExtendedScheduleData = {
            key: `day-${dayIndex}-row-${rowIndex}`,
            day: day,
            dayIndex: dayIndex,
            rowIndex: rowIndex,
            isFirstRowOfDay: rowIndex === 0,
            totalRowsInDay: rowGroups.length,
            subCells: rowSubCells
          };

          // Fill time slots
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
      }
    });

    console.log(`📋 Final result: ${result.length} rows total`);
    return result;
  };

  // =================== FUNCTION TO SEPARATE OVERLAPPING SUB-CELLS ===================
  const separateOverlappingSubCells = (subCells: SubCell[]): SubCell[][] => {
    if (subCells.length === 0) return [[]];
    
    const rows: SubCell[][] = [];
    const sortedSubCells = [...subCells].sort((a, b) => a.position.startSlot - b.position.startSlot);
    
    console.log(`📊 separateOverlappingSubCells: Processing ${sortedSubCells.length} sub-cells`);
    
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
          console.log(`✅ Placed ${subCell.classData.subject} in row ${i}`);
          break;
        }
      }
      
      // ถ้าใส่ในแถวที่มีไม่ได้ ให้สร้างแถวใหม่
      if (!placed) {
        rows.push([subCell]);
        console.log(`🆕 Created new row ${rows.length - 1} for ${subCell.classData.subject}`);
      }
    }
    
    console.log(`📋 Total rows created: ${rows.length}`);
    return rows;
  };

  // =================== FUNCTION TO CHECK SUB-CELL OVERLAP ===================
  const doSubCellsOverlap = (subCell1: SubCell, subCell2: SubCell): boolean => {
    const start1 = subCell1.position.startSlot;
    const end1 = subCell1.position.endSlot;
    const start2 = subCell2.position.startSlot;
    const end2 = subCell2.position.endSlot;
    
    // ตรวจสอบการทับซ้อนของเวลา
    const overlap = !(end1 <= start2 || end2 <= start1);
    
    if (overlap) {
      console.log(`⚠️ Overlap detected:`, {
        subCell1: `${subCell1.classData.subject} (${start1}-${end1})`,
        subCell2: `${subCell2.classData.subject} (${start2}-${end2})`
      });
    }
    
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
        
        console.log('✅ Transformed schedule data:', newScheduleData);
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
      const res = await postAutoGenerateSchedule(Number(academicYear), Number(term));
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
    
    console.log('🔍 Finding changes...', {
      scheduleDataLength: scheduleData.length,
      originalDataLength: originalScheduleData.length
    });
    
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
            console.log(`📍 Current mapping: ID ${subCell.scheduleId} -> ${subCell.day} ${subCell.startTime}-${subCell.endTime}`);
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
        
        console.log(`🔎 Comparing ID ${original.ID}:`, {
          original: `${original.DayOfWeek} ${originalStartTime}-${originalEndTime}`,
          current: `${current.day} ${current.startTime}-${current.endTime}`
        });
        
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
          console.log(`✏️ Change detected for ID ${original.ID}`);
        }
      } else {
        console.log(`⚠️ Missing current data for ID ${original.ID}`);
      }
    });

    console.log(`📋 Total changes found: ${changes.length}`);
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
    console.log('🔍 Debug Save:', {
      name: scheduleNameToSave,
      dataLength: scheduleData.length,
      currentTableName: currentTableName,
      isFromAPI: isTableFromAPI,
      originalDataLength: originalScheduleData.length
    });

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
      console.log('📝 Changes detected:', changes);

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

      console.log(`🔄 Updating ${payloadArray.length} schedules:`, payloadArray);

      // ✅ สร้าง API call โดยตรงแทนการใช้ putupdateScheduleTime
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
          console.log(`✅ Updated all schedules successfully`);
          
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
        
        // ✅ ถ้า batch API ไม่มี ให้ fallback เป็นการอัปเดตทีละรายการ
        console.log('🔄 Falling back to individual updates...');
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

        console.log(`🔄 Updating schedule ID: ${change.id}`, payload);

        const result = await putupdateScheduleTime(change.id, payload);
        
        if (result.status === 200) {
          successCount++;
          console.log(`✅ Updated schedule ID: ${change.id}`);
        } else {
          errorCount++;
          console.error(`❌ Failed to update schedule ID: ${change.id}`, result);
        }
      } catch (error) {
        errorCount++;
        console.error(`💥 Error updating schedule ID: ${change.id}`, error);
      }
    }

    console.log(`📊 Individual update results: ${successCount} success, ${errorCount} errors`);
  };

  // =================== RESET FUNCTION ===================
  const handleReset = () => {
    setScheduleData([]);
    setCurrentTableName("");
    setIsTableFromAPI(false);
    setOriginalScheduleData([]);
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

  // =================== PDF EXPORT ===================
  const exportScheduleToPDF = async () => {
    if (scheduleData.length === 0) {
      message.warning("ไม่มีข้อมูลให้ส่งออก กรุณาสร้างตารางก่อน");
      return;
    }

    try {
      const hide = message.loading("กำลังสร้าง PDF...", 0);
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      
      const tableData: string[][] = [];
      const headers = ["Day/Time", ...TIME_SLOTS];

      scheduleData.forEach((dayData) => {
        const row: string[] = [dayData.day || ""];
        TIME_SLOTS.forEach((time) => {
          const subCells = dayData.subCells || [];
          const timeSlotIndex = timeSlotToSlotIndex(time);
          
          let content = "";

          const relevantSubCells = subCells.filter(subCell => {
            const subCellStartSlotIndex = Math.floor(subCell.position.startSlot);
            const subCellEndSlotIndex = Math.floor(subCell.position.endSlot);
            return subCellStartSlotIndex <= timeSlotIndex && subCellEndSlotIndex > timeSlotIndex;
          });

          if (relevantSubCells.length > 0) {
            content = relevantSubCells.map(subCell => 
              `${subCell.classData.subject}\n${subCell.classData.teacher}\n${subCell.classData.room}\n(${subCell.startTime}-${subCell.endTime})`
            ).join("\n---\n");
          } else {
            const cellData = dayData[time];
            if (cellData && typeof cellData === "object") {
              if (cellData.isBreak) {
                content = "พักเที่ยง";
              } else if (cellData.classes && Array.isArray(cellData.classes) && cellData.classes.length > 0) {
                content = cellData.classes.map((cls: ClassInfo) => 
                  `${cls.subject}\n${cls.teacher}\n${cls.room}`
                ).join("\n---\n");
              } else {
                content = "-";
              }
            } else {
              content = "-";
            }
          }
          row.push(content);
        });
        tableData.push(row);
      });

      if (typeof doc.autoTable === "function") {
        doc.autoTable({
          head: [headers],
          body: tableData,
          startY: 10,
          styles: { fontSize: 6, cellPadding: 1, halign: "center", valign: "middle" },
          headStyles: { fillColor: [242, 101, 34], textColor: [255, 255, 255], fontSize: 7, fontStyle: "bold" },
          columnStyles: { 0: { cellWidth: 20, fillColor: [248, 249, 250], fontStyle: "bold" } },
          theme: "grid",
        });
      }

      const fileName = `schedule_table_${new Date().toISOString().split("T")[0]}.pdf`;
      doc.save(fileName);
      hide();
      message.success("ส่งออก PDF สำเร็จ!");
    } catch (error) {
      message.destroy();
      console.error("Error generating PDF:", error);
      message.error("เกิดข้อผิดพลาดในการสร้าง PDF");
    }
  };

  // =================== TABLE COLUMNS WITH FIXED ROW GROUPING ===================
  const columns: ColumnsType<ExtendedScheduleData> = [
    {
      title: "Day/Time",
      dataIndex: "day",
      key: "day",
      fixed: "left",
      width: 85,
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
      width: 120,
      onCell: (record: ExtendedScheduleData) => {
        const timeSlotIndex = timeSlotToSlotIndex(time);
        
        // หาวิชาที่เริ่มในช่องนี้และยาวกว่า 1 ช่อง
        const spanningSubCell = (record.subCells || []).find(subCell => {
          const subCellStartSlotIndex = Math.floor(subCell.position.startSlot);
          const subCellEndSlotIndex = Math.floor(subCell.position.endSlot);
          
          const shouldSpan = subCellStartSlotIndex === timeSlotIndex && 
                            subCellEndSlotIndex > subCellStartSlotIndex + 1;
          
          if (shouldSpan) {
            console.log(`🔗 ColSpan detected: ${subCell.classData.subject}`, {
              startSlot: subCellStartSlotIndex,
              endSlot: subCellEndSlotIndex,
              timeSlotIndex,
              spanLength: subCellEndSlotIndex - subCellStartSlotIndex
            });
          }
          
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
        room: "ห้องทดสอบ"
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
        room: "ห้องใหญ่"
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
        room: "ห้องเล็ก"
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
    // เซ็ตชื่อตารางใน modal ให้ตรงกับตารางปัจจุบัน
    if (isTableFromAPI && currentTableName) {
      setScheduleNameToSave(currentTableName);
    }
  }, [isTableFromAPI, currentTableName]);

  // =================== DATA PROCESSING ===================
  const data: ExtendedScheduleData[] = scheduleData.length > 0
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
    <>
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
          จัดตารางเรียน (API Save Integration) 🎯
        </h2>
        <p
          style={{
            margin: 0,
            color: "#666",
            fontSize: "13px",
          }}
        >
          สร้างและจัดการตารางเรียนแบบ Drag & Drop | 
          วิชาที่มีเวลาซ้อนทับกันจะแยกเป็นแถวต่างหาก | 
          การบันทึกจะอัปเดตข้อมูลใน API ผ่าน putupdateScheduleTime | 
          ตรวจสอบ Console เพื่อ Debug การทำงาน
        </p>
      </div>

      {/* Table Status */}
      {renderTableStatus()}

      {/* Action Buttons */}
      <Flex gap="small" wrap style={{ marginBottom: "20px" }}>
        <Button
          type="primary"
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
        
        {/* เพิ่มปุ่มรีเฟรช */}
        {isTableFromAPI && currentTableName && (
          <Button
            type="default"
            onClick={async () => {
              const hide = message.loading("กำลังรีเฟรชข้อมูล...", 0);
              try {
                await getSchedules(currentTableName);
                hide();
                message.success("รีเฟรชข้อมูลสำเร็จ");
              } catch (error) {
                hide();
                message.error("เกิดข้อผิดพลาดในการรีเฟรช");
              }
            }}
            style={{ borderColor: "#52c41a", color: "#52c41a" }}
          >
            🔄 รีเฟรช
          </Button>
        )}
        
        <Button onClick={handleReset}>
          รีเซต
        </Button>
        <Button 
          onClick={() => {
            setLoadModalVisible(true);
            getAllNameTable();
          }}
        >
          โหลด
        </Button>
        <Button
          type="primary"
          onClick={generateAutoSchedule}
        >
          สร้างอัตโนมัติ
        </Button>
        <Button
          type="primary"
          onClick={exportScheduleToPDF}
        >
          ส่งออก PDF
        </Button>
        <Button
          type="dashed"
          onClick={addTestSubCell1Hour}
          style={{ borderColor: "#52c41a", color: "#52c41a" }}
        >
          + ทดสอบ 1 ชม.
        </Button>
        <Button
          type="dashed"
          onClick={addTestSubCell}
          style={{ borderColor: "#1890ff", color: "#1890ff" }}
        >
          + ทดสอบ 2 ชม.
        </Button>
        <Button
          type="dashed"
          onClick={addTestSubCell3Hours}
          style={{ borderColor: "#fa8c16", color: "#fa8c16" }}
        >
          + ทดสอบ 3 ชม. (ซ้อน)
        </Button>
      </Flex>

      {/* Schedule Table */}
      <div ref={tableRef} style={{ flex: 1, overflow: "visible" }}>
        <Table
          columns={columns}
          dataSource={data}
          pagination={false}
          size="small"
          bordered
          style={{
            backgroundColor: "white",
            borderRadius: "8px",
            overflow: "visible",
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
    </>
  );
};

export default Schedulepage;