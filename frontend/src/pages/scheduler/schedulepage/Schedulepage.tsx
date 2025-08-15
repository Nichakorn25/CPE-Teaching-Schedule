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

  const tableRef = useRef<HTMLDivElement>(null);

  // =================== SUB-CELL FUNCTIONS ===================
  const createSubCell = (
    classData: ClassInfo, 
    day: string, 
    startTime: string, 
    endTime: string
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
      duration: endSlot - startSlot
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
      zIndex: 1
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
            <div style={{ fontFamily: "Sarabun, sans-serif" }}>
              <div style={{
                fontSize: "14px",
                fontWeight: "bold",
                marginBottom: "8px",
                color: "#F26522",
                borderBottom: "1px solid #eee",
                paddingBottom: "4px",
              }}>
                📚 รายละเอียดวิชา
              </div>
              <div style={{ marginBottom: "6px" }}>
                <strong>🏷️ รหัสวิชา:</strong> {subCell.classData.subject}
              </div>
              <div style={{ marginBottom: "6px" }}>
                <strong>👩‍🏫 อาจารย์:</strong> {subCell.classData.teacher}
              </div>
              <div style={{ marginBottom: "6px" }}>
                <strong>🏢 ห้องเรียน:</strong> {subCell.classData.room}
              </div>
              <div style={{ marginBottom: "6px" }}>
                <strong>📅 วัน:</strong> {subCell.day}
              </div>
              <div style={{ marginBottom: "8px" }}>
                <strong>🕐 เวลา:</strong> {subCell.startTime} - {subCell.endTime}
              </div>
              <div style={{ marginBottom: "8px" }}>
                <strong>⏱️ ระยะเวลา:</strong> {duration} ชั่วโมง
              </div>
              <div style={{ marginBottom: "8px" }}>
                <strong>📏 ขยายครอบคลุม:</strong> {duration} ช่อง
              </div>
              {shouldSpan && (
                <div style={{ marginBottom: "8px" }}>
                  <strong>🔗 คาบต่อเนื่อง:</strong> {duration} คาบ
                </div>
              )}
              <div style={{
                fontSize: "11px",
                color: "#666",
                fontStyle: "italic",
                borderTop: "1px solid #eee",
                paddingTop: "4px",
              }}>
                💡 เคล็ดลับ: ลากเพื่อย้าย | คลิก × เพื่อลบ
              </div>
            </div>
          }
          placement="top"
          overlayStyle={{
            maxWidth: "350px",
            fontFamily: "Sarabun, sans-serif",
          }}
          color="#ffffff"
        >
          <div style={{ 
            flex: 1, 
            display: "flex", 
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
            textAlign: "center",
            minHeight: "auto"
          }}>
            <div style={{
              fontWeight: shouldSpan ? "bold" : "600",
              marginBottom: duration > 1 ? "4px" : "2px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: duration > 2 ? "normal" : shouldSpan ? "normal" : "nowrap",
              fontSize: duration > 2 ? "12px" : shouldSpan ? "11px" : "10px",
              maxWidth: "100%",
              lineHeight: duration > 2 ? "1.2" : shouldSpan ? "1.1" : "1.2"
            }}>
              {subCell.classData.subject}
            </div>
            
            <div style={{
              fontSize: duration > 2 ? "10px" : shouldSpan ? "9px" : "8px",
              color: "#666",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: duration > 1 ? "normal" : "nowrap",
              maxWidth: "100%",
              marginBottom: duration > 1 ? "2px" : "1px"
            }}>
              {subCell.classData.teacher}
            </div>
            
            <div style={{
              fontSize: duration > 2 ? "10px" : shouldSpan ? "9px" : "8px",
              color: "#888",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: duration > 1 ? "normal" : "nowrap",
              maxWidth: "100%"
            }}>
              {subCell.classData.room}
            </div>
            
            {shouldSpan && (
              <div style={{
                fontSize: duration > 2 ? "10px" : "9px",
                color: "#F26522",
                fontWeight: "bold",
                marginTop: duration > 2 ? "6px" : "4px",
                borderTop: "1px solid rgba(242, 101, 34, 0.3)",
                paddingTop: "2px",
                whiteSpace: "nowrap"
              }}>
                {subCell.startTime}-{subCell.endTime}
              </div>
            )}
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
  const transformScheduleDataWithRowSeparation = (rawSchedules: any[]): ExtendedScheduleData[] => {
    const result: ExtendedScheduleData[] = [];
    
    DAYS.forEach((day, dayIndex) => {
      const daySchedules = rawSchedules.filter(item => item.DayOfWeek === day);
      
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
        // แปลงข้อมูลเป็น SubCells
        const subCells: SubCell[] = daySchedules.map((item: any) => {
          const classInfo: ClassInfo = {
            subject: item.OfferedCourses?.AllCourses?.ThaiName ||
                    item.OfferedCourses?.AllCourses?.EnglishName ||
                    "ไม่ทราบชื่อ",
            teacher: (item.OfferedCourses?.User?.Firstname || "") +
                    " " +
                    (item.OfferedCourses?.User?.Lastname || ""),
            room: item.OfferedCourses?.Laboratory?.Room || "ไม่ระบุห้อง",
          };

          const getTimeString = (time: string | Date): string => {
            if (typeof time === 'string') {
              return time.substring(11, 16);
            } else if (time instanceof Date) {
              return time.toTimeString().substring(0, 5);
            }
            return "00:00";
          };

          const startTime = getTimeString(item.StartTime);
          const endTime = getTimeString(item.EndTime);
          
          return createSubCell(classInfo, day, startTime, endTime);
        });

        // แยกวิชาที่ซ้อนกันออกเป็นแถวต่าง ๆ
        const rowGroups = separateOverlappingSubCells(subCells);
        
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
        const newScheduleData = transformScheduleDataWithRowSeparation(res.data);
        setScheduleData(newScheduleData);
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
          const newScheduleData = transformScheduleDataWithRowSeparation(tableRes.data);
          setScheduleData(newScheduleData);
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

  // =================== MODAL HANDLERS ===================
  const handleLoadSchedule = async (scheduleName: string) => {
    try {
      const res = await getSchedulesBynameTable(scheduleName);
      if (res.status === 200 && res.data) {
        const newScheduleData = transformScheduleDataWithRowSeparation(res.data);
        setScheduleData(newScheduleData);
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

  const handleSaveConfirm = () => {
    if (!scheduleNameToSave.trim()) {
      message.error("กรุณาใส่ชื่อตาราง");
      return;
    }

    const currentSaved = JSON.parse(localStorage.getItem("savedSchedules") || "{}");
    currentSaved[scheduleNameToSave] = {
      scheduleData: scheduleData,
      savedAt: new Date().toLocaleString("th-TH"),
      totalClasses: scheduleData.reduce((total, dayData) => {
        return total + (dayData.subCells?.length || 0);
      }, 0),
    };

    localStorage.setItem("savedSchedules", JSON.stringify(currentSaved));
    setSaveModalVisible(false);
    setScheduleNameToSave("");
    message.success(`บันทึกตาราง "${scheduleNameToSave}" สำเร็จ!`);
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
          จัดตารางเรียน (Fixed Excel-like Row Separation) 🎯
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
          แต่ละวิชาจะขยายครอบคลุมช่องตามจำนวนคาบจริง | 
          ตรวจสอบ Console เพื่อ Debug การทำงาน
        </p>
      </div>

      {/* Action Buttons */}
      <Flex gap="small" wrap style={{ marginBottom: "20px" }}>
        <Button
          type="primary"
          onClick={() => {
            if (scheduleData.length === 0) {
              message.warning("ไม่มีข้อมูลให้บันทึก กรุณาสร้างตารางก่อน");
              return;
            }
            setSaveModalVisible(true);
          }}
        >
          บันทึก
        </Button>
        <Button onClick={() => setScheduleData([])}>
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
        title="บันทึกตาราง"
        open={saveModalVisible}
        onOk={handleSaveConfirm}
        onCancel={() => {
          setSaveModalVisible(false);
          setScheduleNameToSave("");
        }}
        okText="บันทึก"
        cancelText="ยกเลิก"
      >
        <div style={{ margin: "20px 0" }}>
          <p>กรุณาใส่ชื่อตาราง:</p>
          <Input
            placeholder="เช่น ตารางเรียนภาคเรียนที่ 1/2567"
            value={scheduleNameToSave}
            onChange={(e) => setScheduleNameToSave(e.target.value)}
            onPressEnter={handleSaveConfirm}
            maxLength={50}
          />
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
                    style={{ width: "100%", cursor: "pointer" }}
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
                    <Card.Meta title={name} />
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