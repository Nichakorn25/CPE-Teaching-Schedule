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
  getSchedulesBynameTableid,
  postAutoGenerateSchedule,
  deleteSchedulebyNametable,
} from "../../../services/https/SchedulerPageService";
import { getOffered } from "../../../services/https/GetService";
import jsPDF from "jspdf";

// Import autoTable differently for better compatibility
import "jspdf-autotable";

// Extend jsPDF type to include autoTable
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface ScheduleData {
  key: string;
  day: string;
  [key: string]: any; // สำหรับ time slots
}

interface ScheduleCell {
  day: string;
  time: string;
  selected: boolean;
}

interface ClassInfo {
  subject: string;
  teacher: string;
  room: string;
}

interface SavedScheduleInfo {
  scheduleData: ScheduleData[];
  savedAt: string;
  totalClasses: number;
}

const Schedulepage: React.FC = () => {
  /////////////////////////////////////////////////////////////////////////////////////////////// ดึงปีและเทอม และสร้างชื่อ nameTable
  const [academicYear, setAcademicYear] = useState(() => {
    return localStorage.getItem("academicYear") || "";
  });

  const [term, setTerm] = useState(() => {
    return localStorage.getItem("term") || "";
  });

  useEffect(() => {
    if (academicYear && term) {
      const nameTable = `ปีการศึกษา ${academicYear} เทอม ${term}`;
      getSchedules(nameTable);
    }
  }, [academicYear, term]);

  /////////////////////////////////////////////////////////////////////////////////////////////// ดึงปีและเทอม และสร้างชื่อ nameTable

  const [allSchedule, setallSchedule] = useState<ScheduleInterface[]>([]);
  const getSchedules = async (nameTable: string) => {
    let res = await getSchedulesBynameTable(nameTable);
    if (res && Array.isArray(res.data)) {
      setallSchedule(res.data);
      console.log("gggggg", res.data);
    }
  };

  ///////////////////////////////////////////////////////////////////////////////////////////////
  const [allNameTable, setallNameTable] = useState<string[]>([]);
  const getAllNameTable = async () => {
    let res = await getNameTable();
    if (res && Array.isArray(res.data.name_tables)) {
      setallNameTable(res.data.name_tables);
    }
  };
  ///////////////////////////////////////////////////////////////////////////////////////////////
  //   const [loadSchedulebyname, setloadSchedule] = useState<ScheduleInterface[]>(
  //     []
  //   );
  //   const loadScheduleData = async (nameTable: string, userId: string) => {
  //     try {
  //       const res = await getSchedulesBynameTableid(nameTable, userId);
  //       if (res.status === 200 && res.data) {
  //         // res.data ควรจะเป็น array ของ schedule พร้อมข้อมูลวิชา
  //         const scheduleFromAPI = res.data;

  //         // แปลง scheduleFromAPI ให้อยู่ในรูปแบบ ScheduleData ที่ใช้ในตารางของคุณ
  //         // ตัวอย่าง:
  //         const newScheduleData: ScheduleData[] = days.map((day, index) => {
  //           const dayData: ScheduleData = {
  //             key: index.toString(),
  //             day,
  //           };

  //           timeSlots.forEach((time) => {
  //             // หา schedule ใน res.data ที่ตรงกับวันและช่วงเวลา
  //             const matchingSchedules = scheduleFromAPI.filter(
  //               (item: any) =>
  //                 item.DayOfWeek === day &&
  //                 // เช็คเวลาว่า time slot นี้อยู่ในช่วง StartTime-EndTime ของ item หรือเปล่า
  //                 isTimeInSlot(item.StartTime, item.EndTime, time)
  //             );

  //             if (matchingSchedules.length > 0) {
  //               dayData[time] = {
  //                 backgroundColor: getRandomBackgroundColor(),
  //                 classes: matchingSchedules.map((sch: any) => ({
  //                   subject:
  //                     sch.OfferedCourses?.AllCourses?.ThaiName || "ไม่ทราบชื่อ",
  //                   teacher:
  //                     sch.OfferedCourses?.User?.Firstname +
  //                     " " +
  //                     sch.OfferedCourses?.User?.Lastname,
  //                   room: sch.OfferedCourses?.Laboratory?.Room || "ไม่ระบุห้อง",
  //                 })),
  //               };
  //             } else if (time === "12:00-13:00") {
  //               dayData[time] = {
  //                 content: "พักเที่ยง",
  //                 backgroundColor: "#FFF5E5",
  //                 isBreak: true,
  //               };
  //             } else {
  //               dayData[time] = {
  //                 content: "",
  //                 backgroundColor: "#f9f9f9",
  //                 classes: [],
  //               };
  //             }
  //           });

  //           return dayData;
  //         });

  //         setScheduleData(newScheduleData);
  //         message.success("โหลดข้อมูลตารางสำเร็จ");
  //       }
  //     } catch (error) {
  //       console.error(error);
  //       message.error("เกิดข้อผิดพลาดในการโหลดข้อมูลตาราง");
  //     }
  //   };

  ///////////////////////////////////////////////////////////////////////////////////////////////
  useEffect(() => {
    getAllNameTable();
  }, []);

  /////////////////////////////////////////////////////////////////////// ฟังก์ชันสำหรับแปลง rawSchedules เป็น ScheduleData[]
  const transformScheduleData = (rawSchedules: any[]): ScheduleData[] => {
    return days.map((day, dayIndex) => {
      const dayData: ScheduleData = {
        key: dayIndex.toString(),
        day: day,
      };

      timeSlots.forEach((time) => {
        const matched = rawSchedules.filter((item: any) => {
          return (
            item.DayOfWeek === day &&
            isTimeInSlot(item.StartTime, item.EndTime, time)
          );
        });

        if (matched.length > 0) {
          dayData[time] = {
            backgroundColor: getRandomBackgroundColor(),
            classes: matched.map((item: any) => ({
              subject:
                item.OfferedCourses?.AllCourses?.ThaiName ||
                item.OfferedCourses?.AllCourses?.EnglishName ||
                "ไม่ทราบชื่อ",
              teacher:
                (item.OfferedCourses?.User?.Firstname || "") +
                " " +
                (item.OfferedCourses?.User?.Lastname || ""),
              room: item.OfferedCourses?.Laboratory?.Room || "ไม่ระบุห้อง",
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

      return dayData;
    });
  };
  /////////////////////////////////////////////////////////////////////// ฟังก์ชันสำหรับแปลง rawSchedules เป็น ScheduleData[]

  /////////////////////////////////////////////////////////////////////// โหลดตารางใน pop up
  const loadSchedule = async () => {
    setLoadModalVisible(true);
    await getAllNameTable();
  };

  const [scheduleData, setScheduleData] = useState<ScheduleData[]>([]);

  const handleLoadSchedule = async (scheduleName: string) => {
    try {
      const res = await getSchedulesBynameTable(scheduleName);
      if (res.status === 200 && res.data) {
        const newScheduleData = transformScheduleData(res.data);
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

  const [deletingName, setDeletingName] = useState<string | null>(null);

  const handleDeleteSchedule = async (scheduleName: string) => {
    const confirmed = window.confirm(
      `คุณต้องการลบตาราง "${scheduleName}" หรือไม่?`
    );

    if (!confirmed) {
      console.log("Delete cancelled for:", scheduleName);
      return;
    }

    setDeletingName(scheduleName);
    try {
      const apiRes = await deleteSchedulebyNametable(scheduleName);

      if (apiRes?.status === 200 || apiRes?.status === 204) {
        // 1) เคลียร์ข้อมูลตารางที่กำลังแสดง
        setScheduleData([]);

        // 2) โหลดรายชื่อตารางใหม่
        await getAllNameTable();

        message.success(`ลบตาราง "${scheduleName}" สำเร็จ`);
        setLoadModalVisible(false);
      } else {
        message.error("ไม่สามารถลบตารางบนเซิร์ฟเวอร์ได้");
      }
    } catch (error) {
      console.error("Error deleting schedule:", error);
      message.error("เกิดข้อผิดพลาดในการลบตาราง: " + (error as Error).message);
    } finally {
      setDeletingName(null);
    }
  };
  /////////////////////////////////////////////////////////////////////// โหลดตารางใน pop up

  /////////////////////////////////////////////////////////////////////// สร้างอัตโนมัติ
  const generateAutoSchedule = async () => {
    try {
      const res = await postAutoGenerateSchedule(
        Number(academicYear),
        Number(term)
      );

      const nameTable = `ปีการศึกษา ${academicYear} เทอม ${term}`;

      if (res.status === 200 && res.data) {
        const tableRes = await getSchedulesBynameTable(nameTable);

        if (tableRes.status === 200 && tableRes.data) {
          const newScheduleData = transformScheduleData(tableRes.data);
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
  /////////////////////////////////////////////////////////////////////// สร้างอัตโนมัติ

  // ฟังก์ชันช่วยเช็คว่าเวลานี้อยู่ในช่วง time slot หรือไม่
  function isTimeInSlot(
    startTime: string,
    endTime: string,
    slot: string
  ): boolean {
    // สมมติเวลารูปแบบ ISO string เช่น "2025-08-02T08:00:00.000Z"
    // slot รูปแบบ '08:00-09:00'
    const [slotStart, slotEnd] = slot.split("-");

    // แปลงเวลาจาก string เป็นนาที
    const toMinutes = (timeStr: string) => {
      const [h, m] = timeStr.split(":").map(Number);
      return h * 60 + m;
    };

    const startMinutes = toMinutes(startTime.substring(11, 16));
    const endMinutes = toMinutes(endTime.substring(11, 16));
    const slotStartMinutes = toMinutes(slotStart);
    const slotEndMinutes = toMinutes(slotEnd);

    // ถ้าช่วงเวลา class ครอบคลุมเวลาของ slot นี้ (หรือ overlap)
    return (
      (startMinutes <= slotStartMinutes && endMinutes > slotStartMinutes) ||
      (startMinutes >= slotStartMinutes && startMinutes < slotEndMinutes)
    );
  }

  // เวลาต่างๆ
  const timeSlots = [
    "8:00-9:00",
    "9:00-10:00",
    "10:00-11:00",
    "11:00-12:00",
    "12:00-13:00",
    "13:00-14:00",
    "14:00-15:00",
    "15:00-16:00",
    "16:00-17:00",
    "17:00-18:00",
    "18:00-19:00",
    "19:00-20:00",
    "20:00-21:00",
  ];

  // วันต่างๆ
  const days = [
    "จันทร์",
    "อังคาร",
    "พุธ",
    "พฤหัสบดี",
    "ศุกร์",
    "เสาร์",
    "อาทิตย์",
  ];

  // สีพื้นหลังสำหรับสุ่ม
  const backgroundColors = [
    "#FFE5E5",
    "#E5F3FF",
    "#E5FFE5",
    "#FFF5E5",
    "#F5E5FF",
    "#E5FFF5",
    "#FFE5F5",
    "#F5FFE5",
    "#E5E5FF",
    "#FFF5F5",
    "#FFE5CC",
    "#CCFFE5",
    "#E5CCFF",
    "#FFCCF5",
    "#CCF5FF",
    "#F5CCFF",
    "#CCFFF5",
    "#FFCCCC",
    "#CCCCFF",
    "#F5F5CC",
  ];

  // State สำหรับเก็บข้อมูลตาราง

  // State สำหรับ drag & drop
  const [draggedItem, setDraggedItem] = useState<{
    sourceDay: string;
    sourceTime: string;
    classIndex: number;
    classData: ClassInfo;
  } | null>(null);

  // State สำหรับ Modal บันทึก
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [scheduleNameToSave, setScheduleNameToSave] = useState("");

  // State สำหรับ Modal โหลด
  const [loadModalVisible, setLoadModalVisible] = useState(false);
  const [savedSchedules, setSavedSchedules] = useState<{
    [key: string]: SavedScheduleInfo;
  }>({});

  // Ref สำหรับตาราง
  const tableRef = useRef<HTMLDivElement>(null);

  // ฟังก์ชันสำหรับสุ่มสีพื้นหลัง
  const getRandomBackgroundColor = () => {
    return backgroundColors[
      Math.floor(Math.random() * backgroundColors.length)
    ];
  };

  // ฟังก์ชันสำหรับสร้าง Tooltip Content
  const createTooltipContent = (cls: ClassInfo, time: string, day: string) => (
    <div style={{ fontFamily: "Sarabun, sans-serif" }}>
      <div
        style={{
          fontSize: "14px",
          fontWeight: "bold",
          marginBottom: "8px",
          color: "#F26522",
          borderBottom: "1px solid #eee",
          paddingBottom: "4px",
        }}
      >
        📚 รายละเอียดวิชา
      </div>
      <div style={{ marginBottom: "6px" }}>
        <strong>🏷️ รหัสวิชา:</strong> {cls.subject}
      </div>
      <div style={{ marginBottom: "6px" }}>
        <strong>👩‍🏫 อาจารย์:</strong> {cls.teacher}
      </div>
      <div style={{ marginBottom: "6px" }}>
        <strong>🏢 ห้องเรียน:</strong> {cls.room}
      </div>
      <div style={{ marginBottom: "6px" }}>
        <strong>📅 วัน:</strong> {day}
      </div>
      <div style={{ marginBottom: "8px" }}>
        <strong>🕐 เวลา:</strong> {time}
      </div>
      <div
        style={{
          fontSize: "11px",
          color: "#666",
          fontStyle: "italic",
          borderTop: "1px solid #eee",
          paddingTop: "4px",
        }}
      >
        💡 เคล็ดลับ: ลากเพื่อย้าย | ดับเบิลคลิกเพื่อลบ
      </div>
    </div>
  );

  // ฟังก์ชันสำหรับ drag start
  const handleDragStart = (
    e: React.DragEvent,
    day: string,
    time: string,
    classIndex: number,
    classData: ClassInfo
  ) => {
    const dragData = {
      sourceDay: day,
      sourceTime: time,
      classIndex: classIndex,
      classData: classData,
    };
    setDraggedItem(dragData);
    e.dataTransfer.setData("text/plain", JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = "move";
  };

  // ฟังก์ชันสำหรับ drag over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  // ฟังก์ชันสำหรับ drop
  const handleDrop = (
    e: React.DragEvent,
    targetDay: string,
    targetTime: string
  ) => {
    e.preventDefault();

    if (!draggedItem) return;

    // ถ้า drop ในตำแหน่งเดิม ไม่ต้องทำอะไร
    if (
      draggedItem.sourceDay === targetDay &&
      draggedItem.sourceTime === targetTime
    ) {
      setDraggedItem(null);
      return;
    }

    // อัพเดทข้อมูลตาราง
    setScheduleData((prevData) => {
      const newData = [...prevData];

      // หา index ของวันต้นทางและปลายทาง
      const sourceDayIndex = newData.findIndex(
        (item) => item.day === draggedItem.sourceDay
      );
      const targetDayIndex = newData.findIndex(
        (item) => item.day === targetDay
      );

      if (sourceDayIndex === -1 || targetDayIndex === -1) return prevData;

      // ลบคาบจากตำแหน่งต้นทาง
      const sourceClasses = [
        ...(newData[sourceDayIndex][draggedItem.sourceTime]?.classes || []),
      ];
      sourceClasses.splice(draggedItem.classIndex, 1);

      newData[sourceDayIndex] = {
        ...newData[sourceDayIndex],
        [draggedItem.sourceTime]: {
          ...newData[sourceDayIndex][draggedItem.sourceTime],
          classes: sourceClasses,
        },
      };

      // เพิ่มคาบไปยังตำแหน่งปลายทาง
      const targetClasses = [
        ...(newData[targetDayIndex][targetTime]?.classes || []),
      ];
      targetClasses.push(draggedItem.classData);

      newData[targetDayIndex] = {
        ...newData[targetDayIndex],
        [targetTime]: {
          ...newData[targetDayIndex][targetTime],
          classes: targetClasses,
          backgroundColor:
            newData[targetDayIndex][targetTime]?.backgroundColor ||
            getRandomBackgroundColor(),
        },
      };

      return newData;
    });

    setDraggedItem(null);
  };

  // ฟังก์ชันสำหรับลบคาบเรียน
  const removeClass = (day: string, time: string, classIndex: number) => {
    setScheduleData((prevData) => {
      const newData = [...prevData];
      const dayIndex = newData.findIndex((item) => item.day === day);

      if (dayIndex === -1) return prevData;

      const classes = [...(newData[dayIndex][time]?.classes || [])];
      classes.splice(classIndex, 1);

      newData[dayIndex] = {
        ...newData[dayIndex],
        [time]: {
          ...newData[dayIndex][time],
          classes: classes,
        },
      };

      return newData;
    });
  };

  // ฟังก์ชันสำหรับรีเซตตาราง
  const resetTable = () => {
    setScheduleData([]);
  };

  // ฟังก์ชันสำหรับบันทึกข้อมูล
  const saveScheduleData = () => {
    if (scheduleData.length === 0) {
      message.warning("ไม่มีข้อมูลให้บันทึก กรุณาสร้างตารางก่อน");
      return;
    }

    // เปิด Modal ให้ตั้งชื่อ
    setSaveModalVisible(true);
  };

  // ฟังก์ชันบันทึกจริงหลังจากตั้งชื่อ
  const handleSaveConfirm = () => {
    if (!scheduleNameToSave.trim()) {
      message.error("กรุณาใส่ชื่อตาราง");
      return;
    }

    // บันทึกลง localStorage
    const currentSaved = JSON.parse(
      localStorage.getItem("savedSchedules") || "{}"
    );
    currentSaved[scheduleNameToSave] = {
      scheduleData: scheduleData, // เปลี่ยนจาก data เป็น scheduleData
      savedAt: new Date().toLocaleString("th-TH"),
      totalClasses: scheduleData.reduce((total, dayData) => {
        return (
          total +
          timeSlots.reduce((dayTotal, time) => {
            const cellData = dayData[time];
            return dayTotal + (cellData?.classes?.length || 0);
          }, 0)
        );
      }, 0),
    };

    localStorage.setItem("savedSchedules", JSON.stringify(currentSaved));
    setSavedSchedules(currentSaved);

    setSaveModalVisible(false);
    setScheduleNameToSave("");
    message.success(`บันทึกตาราง "${scheduleNameToSave}" สำเร็จ!`);

    console.log("Schedule data saved:", scheduleData);
  };

  // ฟังก์ชันสำหรับดาวน์โหลด JSON
  const downloadSchedule = () => {
    if (scheduleData.length === 0) {
      alert("ไม่มีข้อมูลให้ดาวน์โหลด กรุณาสร้างตารางก่อน");
      return;
    }

    const dataStr = JSON.stringify(scheduleData, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportFileDefaultName = "schedule.json";

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  // ฟังก์ชันสำหรับส่งออก PDF จากการจับภาพตาราง
  const exportScheduleToPDF = async () => {
    if (scheduleData.length === 0) {
      message.warning("ไม่มีข้อมูลให้ส่งออก กรุณาสร้างตารางก่อน");
      return;
    }

    if (!tableRef.current) {
      message.error("ไม่สามารถเข้าถึงตารางได้");
      return;
    }

    try {
      console.log("Starting PDF screenshot export..."); // Debug log

      // แสดง loading
      const hide = message.loading("กำลังสร้าง PDF...", 0);

      // ตรวจสอบว่า html2canvas มีอยู่หรือไม่
      const html2canvas = (window as any).html2canvas;

      if (!html2canvas) {
        hide();
        console.log("html2canvas not available, loading from CDN...");

        // โหลด html2canvas จาก CDN
        const script = document.createElement("script");
        script.src =
          "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
        script.onload = () => {
          console.log("html2canvas loaded from CDN");
          // เรียกฟังก์ชันใหม่หลังจากโหลด
          setTimeout(() => exportScheduleToPDF(), 500);
        };
        script.onerror = () => {
          hide();
          console.log("Failed to load html2canvas, using fallback method");
          exportScheduleToSimplePDF();
        };
        document.head.appendChild(script);
        return;
      }

      // รอสักครู่ให้ message แสดง
      await new Promise((resolve) => setTimeout(resolve, 500));

      console.log("Creating canvas from table...");

      // จับภาพตาราง
      const canvas = await html2canvas(tableRef.current, {
        scale: 2, // ความละเอียดสูง
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        width: tableRef.current.scrollWidth,
        height: tableRef.current.scrollHeight,
        scrollX: 0,
        scrollY: 0,
      });

      console.log("Canvas created:", canvas.width, "x", canvas.height);

      // สร้าง PDF
      const imgData = canvas.toDataURL("image/png");

      // คำนวณขนาด PDF
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      // กำหนดขนาด PDF (A4 landscape)
      const pdfWidth = 297; // A4 landscape width in mm
      const pdfHeight = 210; // A4 landscape height in mm

      // คำนวณ ratio เพื่อให้พอดีกับหน้า
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const scaledWidth = imgWidth * ratio;
      const scaledHeight = imgHeight * ratio;

      // สร้าง PDF
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      // วางภาพตารางตรงกลางหน้า (ไม่มีหัวข้อ)
      const x = (pdfWidth - scaledWidth) / 2;
      const y = (pdfHeight - scaledHeight) / 2;
      pdf.addImage(imgData, "PNG", x, y, scaledWidth, scaledHeight);

      // บันทึกไฟล์ (ไม่มีข้อมูลสรุป)
      const fileName = `schedule_${new Date().toISOString().split("T")[0]}.pdf`;
      pdf.save(fileName);

      hide(); // ปิด loading message
      message.success("ส่งออก PDF สำเร็จ!");
      console.log("Screenshot PDF saved successfully");
    } catch (error) {
      message.destroy(); // ปิด loading message
      console.error("Error generating screenshot PDF:", error);

      // ถ้าเกิด error ให้ใช้วิธี fallback
      console.log("Falling back to simple PDF method");
      exportScheduleToSimplePDF();
    }
  };

  // ฟังก์ชัน PDF แบบเดิม (fallback) - ลบหัวข้อและสรุปออก
  const exportScheduleToSimplePDF = () => {
    try {
      console.log("Creating simple PDF...");

      const hide = message.loading("กำลังสร้าง PDF แบบตาราง...", 0);

      // สร้าง jsPDF instance (landscape orientation)
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      // เตรียมข้อมูลสำหรับตาราง (ไม่มีหัวข้อ)
      const tableData: string[][] = [];

      // สร้างหัวตาราง
      const headers = ["Day/Time", ...timeSlots];

      // สร้างแถวข้อมูล
      scheduleData.forEach((dayData) => {
        const row: string[] = [dayData.day];

        timeSlots.forEach((time) => {
          const cellData = dayData[time];
          let content = "";

          if (cellData && typeof cellData === "object") {
            if (cellData.isBreak) {
              content = "Break";
            } else if (
              cellData.classes &&
              Array.isArray(cellData.classes) &&
              cellData.classes.length > 0
            ) {
              content = cellData.classes
                .map(
                  (cls: ClassInfo) =>
                    `${cls.subject}\n${cls.teacher}\n${cls.room}`
                )
                .join("\n---\n");
            } else {
              content = "-";
            }
          } else {
            content = cellData || "-";
          }

          row.push(content);
        });

        tableData.push(row);
      });

      // ตรวจสอบว่า autoTable มีอยู่หรือไม่
      if (typeof doc.autoTable === "function") {
        // สร้างตารางด้วย autoTable (เริ่มจากด้านบน ไม่มีหัวข้อ)
        doc.autoTable({
          head: [headers],
          body: tableData,
          startY: 10, // เริ่มจากด้านบนสุด
          styles: {
            fontSize: 6,
            cellPadding: 1,
            halign: "center",
            valign: "middle",
            lineColor: [0, 0, 0],
            lineWidth: 0.1,
          },
          headStyles: {
            fillColor: [242, 101, 34], // #F26522
            textColor: [255, 255, 255],
            fontSize: 7,
            fontStyle: "bold",
          },
          columnStyles: {
            0: {
              cellWidth: 20,
              fillColor: [248, 249, 250],
              fontStyle: "bold",
            },
          },
          alternateRowStyles: {
            fillColor: [249, 249, 249],
          },
          tableLineColor: [0, 0, 0],
          tableLineWidth: 0.1,
          theme: "grid",
          margin: { top: 10, right: 10, bottom: 10, left: 10 },
        });
      } else {
        // สร้าง PDF แบบข้อความธรรมดา (ไม่มีหัวข้อ)
        let yPosition = 20;
        doc.setFontSize(8);

        scheduleData.forEach((dayData) => {
          if (yPosition > 180) {
            doc.addPage();
            yPosition = 20;
          }

          doc.setFontSize(10);
          doc.text(`${dayData.day}:`, 20, yPosition);
          yPosition += 5;

          timeSlots.forEach((time) => {
            const cellData = dayData[time];
            let content = "";

            if (cellData && typeof cellData === "object") {
              if (cellData.isBreak) {
                content = "Break";
              } else if (
                cellData.classes &&
                Array.isArray(cellData.classes) &&
                cellData.classes.length > 0
              ) {
                content = cellData.classes
                  .map(
                    (cls: ClassInfo) =>
                      `${cls.subject} (${cls.teacher}) [${cls.room}]`
                  )
                  .join(", ");
              }
            }

            if (content) {
              doc.setFontSize(8);
              doc.text(`  ${time}: ${content}`, 25, yPosition);
              yPosition += 4;
            }
          });

          yPosition += 5;
        });
      }

      // บันทึกไฟล์ (ไม่มีข้อมูลสรุป)
      const fileName = `schedule_table_${
        new Date().toISOString().split("T")[0]
      }.pdf`;
      doc.save(fileName);

      hide();
      message.success("ส่งออก PDF สำเร็จ!");
      console.log("Simple PDF saved successfully");
    } catch (error) {
      message.destroy();
      console.error("Error generating simple PDF:", error);
      message.error(
        "เกิดข้อผิดพลาดในการสร้าง PDF: " + (error as Error).message
      );
    }
  };

// ฟังก์ชันสำหรับสร้าง horizontal spanning blocks (ขยายบล็อกแนวนอน)
const createHorizontalSpanningBlocks = (scheduleData: ScheduleData[]) => {
  return scheduleData.map((dayData) => {
    const spannedDayData = { ...dayData };
    
    // สร้าง map เพื่อเก็บข้อมูลคาบที่ถูกประมวลผลแล้ว
    const processedSlots = new Set<string>();
    
    timeSlots.forEach((currentTime, index) => {
      if (processedSlots.has(currentTime)) return;
      
      const currentCellData = dayData[currentTime];
      if (!currentCellData || !currentCellData.classes || currentCellData.classes.length === 0) {
        return;
      }
      
      // หาคาบที่ต่อเนื่องกัน
      const consecutiveSlots = [currentTime];
      let nextIndex = index + 1;
      
      while (nextIndex < timeSlots.length) {
        const nextTime = timeSlots[nextIndex];
        const nextCellData = dayData[nextTime];
        
        // เช็คว่าคาบถัดไปมีวิชาเดียวกันหรือไม่
        if (nextCellData && nextCellData.classes && nextCellData.classes.length > 0) {
          const currentClass = currentCellData.classes[0];
          const nextClass = nextCellData.classes[0];
          
          if (currentClass.subject === nextClass.subject && 
              currentClass.teacher === nextClass.teacher &&
              currentClass.room === nextClass.room) {
            consecutiveSlots.push(nextTime);
            nextIndex++;
          } else {
            break;
          }
        } else {
          break;
        }
      }
      
      // ถ้ามีการ span แนวนอน (มากกว่า 1 ช่วงเวลา)
      if (consecutiveSlots.length > 1) {
        // สร้าง spanning block สำหรับคาบแรก
        spannedDayData[currentTime] = {
          ...currentCellData,
          isHorizontalSpanning: true,
          colSpan: consecutiveSlots.length,
          spannedSlots: consecutiveSlots,
          startTime: currentTime.split('-')[0],
          endTime: consecutiveSlots[consecutiveSlots.length - 1].split('-')[1]
        };
        
        // ทำเครื่องหมายคาบที่เหลือว่าถูก span แล้ว
        consecutiveSlots.slice(1).forEach(slot => {
          spannedDayData[slot] = {
            ...dayData[slot],
            isHorizontalSpanned: true,
            spanParent: currentTime
          };
          processedSlots.add(slot);
        });
      }
      
      processedSlots.add(currentTime);
    });
    
    return spannedDayData;
  });
};

// สร้าง columns สำหรับ Ant Design Table พร้อม horizontal spanning
const columns: ColumnsType<ScheduleData> = [
  {
    title: "Day/Time",
    dataIndex: "day",
    key: "day",
    fixed: "left",
    width: 85,
    render: (text: string) => (
      <strong style={{ color: "#333" }}>{text}</strong>
    ),
  },
  ...timeSlots.map((time) => ({
    title: time,
    dataIndex: time,
    key: time,
    width: 85,
    onCell: (record: ScheduleData) => {
      const cellData = record[time];
      
      if (cellData && typeof cellData === "object") {
        // ถ้าเป็น horizontal spanning block
        if (cellData.isHorizontalSpanning) {
          return {
            colSpan: cellData.colSpan || 1,
          };
        }
        // ถ้าถูก span แล้ว ให้ซ่อน
        if (cellData.isHorizontalSpanned) {
          return {
            colSpan: 0, // ใช้ colSpan: 0 เพื่อซ่อนช่อง
          };
        }
      }
      
      return {};
    },
    render: (text: string, record: ScheduleData) => {
      const cellData = record[time];
      let classes: ClassInfo[] = [];
      let backgroundColor = "#f9f9f9";
      let isBreak = false;
      let isHorizontalSpanning = false;
      let isHorizontalSpanned = false;
      let colSpan = 1;
      let startTime = "";
      let endTime = "";

      if (cellData && typeof cellData === "object") {
        classes = cellData.classes || [];
        backgroundColor = cellData.backgroundColor || "#f9f9f9";
        isBreak = cellData.isBreak || false;
        isHorizontalSpanning = cellData.isHorizontalSpanning || false;
        isHorizontalSpanned = cellData.isHorizontalSpanned || false;
        colSpan = cellData.colSpan || 1;
        startTime = cellData.startTime || time.split('-')[0];
        endTime = cellData.endTime || time.split('-')[1];
      }

      // ถ้าถูก span แล้ว ไม่แสดงอะไร
      if (isHorizontalSpanned) {
        return null;
      }

      const isEmpty = !classes || classes.length === 0;

      // ถ้าเป็นช่วงพักเที่ยง
      if (isBreak) {
        return (
          <div
            style={{
              width: "100%",
              minHeight: "90px", // กลับมาเป็นขนาดเดิม
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: backgroundColor,
              color: "#666",
              borderRadius: "4px",
              padding: "8px 4px", // เพิ่ม padding แนวตั้ง
              fontSize: "7px", // กลับมาขนาดเดิม
              fontWeight: "bold",
              border: "1px solid #e0e0e0",
            }}
          >
            พักเที่ยง
          </div>
        );
      }

      // ถ้าไม่มีคาบเรียน
      if (isEmpty) {
        return (
          <div
            style={{
              width: "100%",
              minHeight: "90px", // กลับมาเป็นขนาดเดิม
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "transparent",
              borderRadius: "4px",
              padding: "4px", // กลับมาขนาดเดิม
              border: "1px dashed #ddd",
            }}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, record.day, time)}
          >
            <div
              style={{ color: "#999", fontSize: "7px", textAlign: "center" }} // กลับมาขนาดเดิม
            >
              วางคาบเรียนที่นี่
            </div>
          </div>
        );
      }

      // แสดงคาบเรียน (รวมทั้ง horizontal spanning blocks)
      const timeRange = `${startTime}-${endTime}`;
      
      return (
        <div
          style={{
            width: "100%",
            minHeight: "90px", // กลับมาเป็นขนาดเดิม
            backgroundColor: "transparent",
            borderRadius: "4px",
            padding: "4px", // กลับมาขนาดเดิม
            border: "none",
            boxShadow: "none",
            display: "flex",
            flexDirection: "column",
            gap: "2px", // กลับมาขนาดเดิม
            overflow: "hidden",
          }}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, record.day, time)}
        >
          {classes.map((cls: ClassInfo, index: number) => (
            <Tooltip
              key={index}
              title={
                <div style={{ fontFamily: "Sarabun, sans-serif" }}>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: "bold",
                      marginBottom: "8px",
                      color: "#F26522",
                      borderBottom: "1px solid #eee",
                      paddingBottom: "4px",
                    }}
                  >
                    📚 รายละเอียดวิชา
                  </div>
                  <div style={{ marginBottom: "6px" }}>
                    <strong>🏷️ รหัสวิชา:</strong> {cls.subject}
                  </div>
                  <div style={{ marginBottom: "6px" }}>
                    <strong>👩‍🏫 อาจารย์:</strong> {cls.teacher}
                  </div>
                  <div style={{ marginBottom: "6px" }}>
                    <strong>🏢 ห้องเรียน:</strong> {cls.room}
                  </div>
                  <div style={{ marginBottom: "6px" }}>
                    <strong>📅 วัน:</strong> {record.day}
                  </div>
                  <div style={{ marginBottom: "8px" }}>
                    <strong>🕐 เวลา:</strong> {timeRange}
                  </div>
                  {isHorizontalSpanning && (
                    <div style={{ marginBottom: "8px" }}>
                      <strong>⏱️ จำนวนคาบ:</strong> {colSpan} คาบ
                    </div>
                  )}
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#666",
                      fontStyle: "italic",
                      borderTop: "1px solid #eee",
                      paddingTop: "4px",
                    }}
                  >
                    💡 เคล็ดลับ: ลากเพื่อย้าย | ดับเบิลคลิกเพื่อลบ
                  </div>
                </div>
              }
              placement="top"
              overlayStyle={{
                maxWidth: "350px",
                fontFamily: "Sarabun, sans-serif",
              }}
              color="#ffffff"
              styles={{
                body: {
                  color: "#333",
                  border: "1px solid #F26522",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                },
              }}
            >
              <div
                draggable={true}
                style={{
                  backgroundColor: getRandomBackgroundColor(),
                  borderRadius: "2px",
                  padding: "3px 1px", // เพิ่ม padding แนวตั้ง
                  fontSize: "7px", // เพิ่มขนาดตัวอักษร
                  lineHeight: "1.2", // เพิ่ม line height
                  textAlign: "center",
                  border: "1px solid rgba(0,0,0,0.1)",
                  color: "#333",
                  minHeight: "20px", // เพิ่มความสูง
                  maxHeight: "25px", // เพิ่มความสูงสูงสุด
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  cursor: "grab",
                  transition: "all 0.2s ease",
                  position: "relative",
                  overflow: "hidden",
                  // ลบ maxWidth เพื่อให้ขยายได้
                  width: "100%", // ให้ขยายเต็มความกว้างที่มี
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.01)";
                  e.currentTarget.style.boxShadow =
                    "0 1px 4px rgba(0,0,0,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "none";
                }}
                onDragStart={(e) => {
                  handleDragStart(e, record.day, time, index, cls);
                  e.currentTarget.style.cursor = "grabbing";
                  e.currentTarget.style.opacity = "0.5";
                }}
                onDragEnd={(e) => {
                  e.currentTarget.style.cursor = "grab";
                  e.currentTarget.style.opacity = "1";
                }}
                onDoubleClick={() => removeClass(record.day, time, index)}
                title=""
              >
                <div
                  style={{
                    fontWeight: "bold",
                    marginBottom: "1px",
                    fontSize: "7px", // เพิ่มขนาดตัวอักษร
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    width: "calc(100% - 12px)", // เว้นที่ไว้สำหรับปุ่มลบ
                    // ลบ maxWidth เพื่อให้ขยายได้
                  }}
                >
                  {cls.subject}
                </div>
                <div
                  style={{
                    fontSize: "5px", // เพิ่มขนาดตัวอักษร
                    color: "#666",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    width: "calc(100% - 12px)", // เว้นที่ไว้สำหรับปุ่มลบ
                    // ลบ maxWidth เพื่อให้ขยายได้
                  }}
                >
                  {cls.teacher}
                </div>
                <div
                  style={{
                    fontSize: "5px", // เพิ่มขนาดตัวอักษร
                    color: "#888",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    width: "calc(100% - 12px)", // เว้นที่ไว้สำหรับปุ่มลบ
                    // ลบ maxWidth เพื่อให้ขยายได้
                  }}
                >
                  {cls.room}
                </div>
                {/* ไอคอนลบมุมขวาบน */}
                <div
                  style={{
                    position: "absolute",
                    top: "1px",
                    right: "1px",
                    width: "10px", // เพิ่มขนาดปุ่มลบ
                    height: "10px",
                    backgroundColor: "rgba(255,0,0,0.7)",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "8px", // เพิ่มขนาดตัวอักษรในปุ่ม
                    color: "white",
                    cursor: "pointer",
                    opacity: "0.7",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeClass(record.day, time, index);
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = "1";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = "0.7";
                  }}
                >
                  ×
                </div>
              </div>
            </Tooltip>
          ))}

          {/* Drop zone indicator */}
          {classes.length === 0 && (
            <div
              style={{
                minHeight: "18px", // กลับมาขนาดเดิม
                border: "1px dashed #ccc",
                borderRadius: "2px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#999",
                fontSize: "6px", // กลับมาขนาดเดิม
              }}
            >
              วางคาบเรียนที่นี่
            </div>
          )}
        </div>
      );
    },
  })),
];

// อัปเดตส่วนการใช้งานข้อมูล
const data: ScheduleData[] =
  scheduleData.length > 0
    ? createHorizontalSpanningBlocks(scheduleData) // ใช้ฟังก์ชันสร้าง horizontal spanning blocks
    : days.map((day, index) => {
        const rowData: ScheduleData = {
          key: index.toString(),
          day: day,
        };

        timeSlots.forEach((time) => {
          rowData[time] = {
            content: "",
            backgroundColor: "#f9f9f9",
            classes: [] as ClassInfo[],
          };
        });

        return rowData;
      });

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
          จัดตารางเรียน
        </h2>
        <p
          style={{
            margin: 0,
            color: "#666",
            fontSize: "13px",
          }}
        >
          สร้างและจัดการตารางเรียนแบบ Drag & Drop 🎯
          เลื่อนเมาส์ไปที่วิชาเพื่อดูรายละเอียด
        </p>
      </div>

      <Flex
        className="schedule-button"
        gap="small"
        wrap
        style={{ marginBottom: "20px" }}
      >
        <Button
          type="primary"
          className="primary-button"
          onClick={saveScheduleData}
        >
          บันทึก
        </Button>
        <Button className="defualt-button" onClick={resetTable}>
          รีเซต
        </Button>
        <Button className="defualt-button" onClick={loadSchedule}>
          โหลด
        </Button>
        <Button
          type="primary"
          className="primary-button"
          onClick={generateAutoSchedule}
        >
          สร้างอัตโนมัติ
        </Button>
        <Button
          type="primary"
          className="primary-button"
          onClick={exportScheduleToPDF}
        >
          ส่งออก PDF
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

      {/* Modal สำหรับบันทึก */}
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
        okButtonProps={{ className: "primary-button" }}
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

      {/* Modal สำหรับโหลด */}
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
            <div
              style={{ textAlign: "center", padding: "40px", color: "#999" }}
            >
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
                        className="primary-button"
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
