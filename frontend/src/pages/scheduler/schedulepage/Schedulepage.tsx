import React, { useState, useRef } from "react";
import Sidebar from "../../../components/schedule-sidebar/Sidebar";
import Header from "../../../components/header/Header";
import "./Schedulepage.css";
import { Button, Flex, Table, Modal, Input, List, Card, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import jsPDF from 'jspdf';

// Import autoTable differently for better compatibility
import 'jspdf-autotable';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
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
    // เวลาต่างๆ
    const timeSlots = [
        '8:00-9:00', '9:00-10:00', '10:00-11:00', '11:00-12:00',
        '12:00-13:00', '13:00-14:00', '14:00-15:00', '15:00-16:00',
        '16:00-17:00', '17:00-18:00', '18:00-19:00', '19:00-20:00', '20:00-21:00'
    ];

    // วันต่างๆ
    const days = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'];

    // สีพื้นหลังสำหรับสุ่ม
    const backgroundColors = [
        '#FFE5E5', '#E5F3FF', '#E5FFE5', '#FFF5E5', '#F5E5FF',
        '#E5FFF5', '#FFE5F5', '#F5FFE5', '#E5E5FF', '#FFF5F5',
        '#FFE5CC', '#CCFFE5', '#E5CCFF', '#FFCCF5', '#CCF5FF',
        '#F5CCFF', '#CCFFF5', '#FFCCCC', '#CCCCFF', '#F5F5CC'
    ];

    // State สำหรับเก็บข้อมูลตาราง
    const [scheduleData, setScheduleData] = useState<ScheduleData[]>([]);
    
    // State สำหรับ drag & drop
    const [draggedItem, setDraggedItem] = useState<{
        sourceDay: string;
        sourceTime: string;
        classIndex: number;
        classData: ClassInfo;
    } | null>(null);

    // State สำหรับ Modal บันทึก
    const [saveModalVisible, setSaveModalVisible] = useState(false);
    const [scheduleNameToSave, setScheduleNameToSave] = useState('');

    // State สำหรับ Modal โหลด
    const [loadModalVisible, setLoadModalVisible] = useState(false);
    const [savedSchedules, setSavedSchedules] = useState<{[key: string]: SavedScheduleInfo}>({});

    // Ref สำหรับตาราง
    const tableRef = useRef<HTMLDivElement>(null);

    // ฟังก์ชันสำหรับสุ่มสีพื้นหลัง
    const getRandomBackgroundColor = () => {
        return backgroundColors[Math.floor(Math.random() * backgroundColors.length)];
    };

    // ฟังก์ชันสำหรับ drag start
    const handleDragStart = (e: React.DragEvent, day: string, time: string, classIndex: number, classData: ClassInfo) => {
        const dragData = {
            sourceDay: day,
            sourceTime: time,
            classIndex: classIndex,
            classData: classData
        };
        setDraggedItem(dragData);
        e.dataTransfer.setData('text/plain', JSON.stringify(dragData));
        e.dataTransfer.effectAllowed = 'move';
    };

    // ฟังก์ชันสำหรับ drag over
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    // ฟังก์ชันสำหรับ drop
    const handleDrop = (e: React.DragEvent, targetDay: string, targetTime: string) => {
        e.preventDefault();
        
        if (!draggedItem) return;
        
        // ถ้า drop ในตำแหน่งเดิม ไม่ต้องทำอะไร
        if (draggedItem.sourceDay === targetDay && draggedItem.sourceTime === targetTime) {
            setDraggedItem(null);
            return;
        }

        // อัพเดทข้อมูลตาราง
        setScheduleData(prevData => {
            const newData = [...prevData];
            
            // หา index ของวันต้นทางและปลายทาง
            const sourceDayIndex = newData.findIndex(item => item.day === draggedItem.sourceDay);
            const targetDayIndex = newData.findIndex(item => item.day === targetDay);
            
            if (sourceDayIndex === -1 || targetDayIndex === -1) return prevData;
            
            // ลบคาบจากตำแหน่งต้นทาง
            const sourceClasses = [...(newData[sourceDayIndex][draggedItem.sourceTime]?.classes || [])];
            sourceClasses.splice(draggedItem.classIndex, 1);
            
            newData[sourceDayIndex] = {
                ...newData[sourceDayIndex],
                [draggedItem.sourceTime]: {
                    ...newData[sourceDayIndex][draggedItem.sourceTime],
                    classes: sourceClasses
                }
            };
            
            // เพิ่มคาบไปยังตำแหน่งปลายทาง
            const targetClasses = [...(newData[targetDayIndex][targetTime]?.classes || [])];
            targetClasses.push(draggedItem.classData);
            
            newData[targetDayIndex] = {
                ...newData[targetDayIndex],
                [targetTime]: {
                    ...newData[targetDayIndex][targetTime],
                    classes: targetClasses,
                    backgroundColor: newData[targetDayIndex][targetTime]?.backgroundColor || getRandomBackgroundColor()
                }
            };
            
            return newData;
        });
        
        setDraggedItem(null);
    };

    // ฟังก์ชันสำหรับลบคาบเรียน
    const removeClass = (day: string, time: string, classIndex: number) => {
        setScheduleData(prevData => {
            const newData = [...prevData];
            const dayIndex = newData.findIndex(item => item.day === day);
            
            if (dayIndex === -1) return prevData;
            
            const classes = [...(newData[dayIndex][time]?.classes || [])];
            classes.splice(classIndex, 1);
            
            newData[dayIndex] = {
                ...newData[dayIndex],
                [time]: {
                    ...newData[dayIndex][time],
                    classes: classes
                }
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
            message.warning('ไม่มีข้อมูลให้บันทึก กรุณาสร้างตารางก่อน');
            return;
        }
        
        // เปิด Modal ให้ตั้งชื่อ
        setSaveModalVisible(true);
    };

    // ฟังก์ชันบันทึกจริงหลังจากตั้งชื่อ
    const handleSaveConfirm = () => {
        if (!scheduleNameToSave.trim()) {
            message.error('กรุณาใส่ชื่อตาราง');
            return;
        }

        // บันทึกลง localStorage
        const currentSaved = JSON.parse(localStorage.getItem('savedSchedules') || '{}');
        currentSaved[scheduleNameToSave] = {
            scheduleData: scheduleData, // เปลี่ยนจาก data เป็น scheduleData
            savedAt: new Date().toLocaleString('th-TH'),
            totalClasses: scheduleData.reduce((total, dayData) => {
                return total + timeSlots.reduce((dayTotal, time) => {
                    const cellData = dayData[time];
                    return dayTotal + (cellData?.classes?.length || 0);
                }, 0);
            }, 0)
        };
        
        localStorage.setItem('savedSchedules', JSON.stringify(currentSaved));
        setSavedSchedules(currentSaved);
        
        setSaveModalVisible(false);
        setScheduleNameToSave('');
        message.success(`บันทึกตาราง "${scheduleNameToSave}" สำเร็จ!`);
        
        console.log('Schedule data saved:', scheduleData);
    };

    // ฟังก์ชันสำหรับสร้างตารางอัตโนมัติ
    const generateAutoSchedule = () => {
        const subjects = [
            'ENG23 2001', 'ENG23 2002', 'ENG23 2003', 'IST23 2001', 'IST23 2002',
            '523452', '523453', 'ENG23 2004', 'ENG23 2005', 'ENG23 2006', 'ENG23 2007'
        ];
        
        const teachers = [
            'อ.สมชาย', 'อ.สมศรี', 'อ.นิรันดร์', 'อ.วิมลา', 'อ.ประยุทธ์',
            'อ.กุลธิดา', 'อ.สุนทร', 'อ.มนีรัตน์', 'อ.อนันต์', 'อ.สุวรรณา',
            'อ.จิรพันธ์', 'อ.วรรณา', 'อ.ธนาคาร', 'อ.สุภาพ', 'อ.นิภา'
        ];
        
        const rooms = [
            'Lecture', 'F11-421,MicroP', 'F11-422,Software'
        ];

        const newScheduleData: ScheduleData[] = days.map((day, dayIndex) => {
            const dayData: ScheduleData = {
                key: dayIndex.toString(),
                day: day
            };

            // สร้างข้อมูลสำหรับแต่ละช่วงเวลา
            timeSlots.forEach((time, timeIndex) => {
                // ช่วงพักเที่ยง (12:00-13:00)
                if (time === '12:00-13:00') {
                    dayData[time] = {
                        content: 'พักเที่ยง',
                        backgroundColor: '#FFF5E5',
                        isBreak: true
                    };
                    return;
                }

                // กำหนดความหนาแน่นของคาบเรียนตามวัน
                let probability = 0.6; // ความน่าจะเป็นที่จะมีคาบเรียน
                if (day === 'เสาร์' || day === 'อาทิตย์') {
                    probability = 0.3; // วันหยุดมีคาบน้อยกว่า
                }

                // สุ่มจำนวนคาบที่จะมีในช่วงเวลานี้ (1-3 คาบ)
                const numberOfClasses = Math.random() < probability ? 
                    Math.floor(Math.random() * 3) + 1 : 0;

                if (numberOfClasses > 0) {
                    const classes: ClassInfo[] = [];
                    const usedTeachers = new Set<string>(); // เก็บอาจารย์ที่ใช้แล้วเพื่อไม่ให้ซ้ำ

                    for (let i = 0; i < numberOfClasses; i++) {
                        // เลือกอาจารย์ที่ยังไม่ได้ใช้
                        let availableTeachers = teachers.filter((t: string) => !usedTeachers.has(t));
                        if (availableTeachers.length === 0) {
                            // ถ้าอาจารย์หมดแล้ว ให้ใช้ได้ทั้งหมด
                            availableTeachers = teachers;
                        }

                        const randomSubject = subjects[Math.floor(Math.random() * subjects.length)];
                        const randomTeacher = availableTeachers[Math.floor(Math.random() * availableTeachers.length)];
                        const randomRoom = rooms[Math.floor(Math.random() * rooms.length)];
                        
                        usedTeachers.add(randomTeacher);
                        
                        classes.push({
                            subject: randomSubject,
                            teacher: randomTeacher,
                            room: randomRoom
                        });
                    }

                    // เก็บข้อมูลคาบเรียนแยกเป็นก้อนๆ
                    dayData[time] = {
                        content: '', // ไม่ใช้ content แล้ว
                        backgroundColor: getRandomBackgroundColor(),
                        classes: classes as ClassInfo[]
                    };
                } else {
                    dayData[time] = {
                        content: '',
                        backgroundColor: '#f9f9f9',
                        classes: []
                    };
                }
            });

            return dayData;
        });

        setScheduleData(newScheduleData);
        alert('สร้างตารางเรียนอัตโนมัติสำเร็จ!\n✨ รองรับหลายอาจารย์ในช่วงเวลาเดียวกัน\n🎨 สีพื้นหลังสุ่มแล้ว');
    };

    // ฟังก์ชันสำหรับดาวน์โหลด JSON
    const downloadSchedule = () => {
        if (scheduleData.length === 0) {
            alert('ไม่มีข้อมูลให้ดาวน์โหลด กรุณาสร้างตารางก่อน');
            return;
        }
        
        const dataStr = JSON.stringify(scheduleData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = 'schedule.json';
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };

    // ฟังก์ชันสำหรับโหลดตารางที่บันทึกแล้ว
    const loadSchedule = () => {
        // โหลดรายการที่บันทึกไว้จาก localStorage
        const saved = JSON.parse(localStorage.getItem('savedSchedules') || '{}');
        console.log('Loaded schedules:', saved); // Debug log
        setSavedSchedules(saved);
        
        if (Object.keys(saved).length === 0) {
            message.info('ไม่มีตารางที่บันทึกไว้');
            return;
        }
        
        // เปิด Modal เลือกตาราง
        setLoadModalVisible(true);
    };

    // ฟังก์ชันโหลดตารางที่เลือก
    const handleLoadSchedule = (scheduleName: string) => {
        const saved = savedSchedules[scheduleName];
        if (saved && saved.scheduleData) { // เปลี่ยนจาก data เป็น scheduleData
            setScheduleData(saved.scheduleData);
            setLoadModalVisible(false);
            message.success(`โหลดตาราง "${scheduleName}" สำเร็จ!`);
        }
    };

    // ฟังก์ชันลบตารางที่บันทึกไว้ - แบบใหม่ไม่ใช้ Modal.confirm
    const handleDeleteSchedule = (scheduleName: string) => {
        console.log('Attempting to delete:', scheduleName); // Debug log
        
        // ถามยืนยันด้วย window.confirm แทน Modal.confirm
        const confirmed = window.confirm(`คุณต้องการลบตาราง "${scheduleName}" หรือไม่?`);
        
        if (confirmed) {
            console.log('Delete confirmed for:', scheduleName); // Debug log
            try {
                // อ่านข้อมูลล่าสุดจาก localStorage
                const currentSaved = JSON.parse(localStorage.getItem('savedSchedules') || '{}');
                console.log('Before delete:', currentSaved); // Debug log
                
                // ตรวจสอบว่ามีตารางนี้จริงหรือไม่
                if (!currentSaved.hasOwnProperty(scheduleName)) {
                    console.log('Schedule not found:', scheduleName);
                    message.error('ไม่พบตารางที่ต้องการลบ');
                    return;
                }
                
                // ลบตาราง
                delete currentSaved[scheduleName];
                console.log('After delete:', currentSaved); // Debug log
                
                // บันทึกกลับ localStorage
                localStorage.setItem('savedSchedules', JSON.stringify(currentSaved));
                
                // อัปเดต state แบบ force re-render
                setSavedSchedules({});
                setTimeout(() => {
                    setSavedSchedules(currentSaved);
                }, 100);
                
                message.success(`ลบตาราง "${scheduleName}" สำเร็จ`);
                
                // ปิด Modal หากไม่มีตารางเหลือ
                if (Object.keys(currentSaved).length === 0) {
                    setTimeout(() => {
                        setLoadModalVisible(false);
                        message.info('ไม่มีตารางที่บันทึกไว้แล้ว');
                    }, 200);
                }
            } catch (error) {
                console.error('Error deleting schedule:', error);
                message.error('เกิดข้อผิดพลาดในการลบตาราง: ' + (error as Error).message);
            }
        } else {
            console.log('Delete cancelled for:', scheduleName);
        }
    };

    // ฟังก์ชันสำหรับส่งออก PDF จากการจับภาพตาราง
    const exportScheduleToPDF = async () => {
        if (scheduleData.length === 0) {
            message.warning('ไม่มีข้อมูลให้ส่งออก กรุณาสร้างตารางก่อน');
            return;
        }

        if (!tableRef.current) {
            message.error('ไม่สามารถเข้าถึงตารางได้');
            return;
        }

        try {
            console.log('Starting PDF screenshot export...'); // Debug log
            
            // แสดง loading
            const hide = message.loading('กำลังสร้าง PDF...', 0);

            // ตรวจสอบว่า html2canvas มีอยู่หรือไม่
            const html2canvas = (window as any).html2canvas;
            
            if (!html2canvas) {
                hide();
                console.log('html2canvas not available, loading from CDN...');
                
                // โหลด html2canvas จาก CDN
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
                script.onload = () => {
                    console.log('html2canvas loaded from CDN');
                    // เรียกฟังก์ชันใหม่หลังจากโหลด
                    setTimeout(() => exportScheduleToPDF(), 500);
                };
                script.onerror = () => {
                    hide();
                    console.log('Failed to load html2canvas, using fallback method');
                    exportScheduleToSimplePDF();
                };
                document.head.appendChild(script);
                return;
            }

            // รอสักครู่ให้ message แสดง
            await new Promise(resolve => setTimeout(resolve, 500));
            
            console.log('Creating canvas from table...');
            
            // จับภาพตาราง
            const canvas = await html2canvas(tableRef.current, {
                scale: 2, // ความละเอียดสูง
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                width: tableRef.current.scrollWidth,
                height: tableRef.current.scrollHeight,
                scrollX: 0,
                scrollY: 0
            });

            console.log('Canvas created:', canvas.width, 'x', canvas.height);

            // สร้าง PDF
            const imgData = canvas.toDataURL('image/png');
            
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
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });

            // วางภาพตารางตรงกลางหน้า (ไม่มีหัวข้อ)
            const x = (pdfWidth - scaledWidth) / 2;
            const y = (pdfHeight - scaledHeight) / 2;
            pdf.addImage(imgData, 'PNG', x, y, scaledWidth, scaledHeight);

            // บันทึกไฟล์ (ไม่มีข้อมูลสรุป)
            const fileName = `schedule_${new Date().toISOString().split('T')[0]}.pdf`;
            pdf.save(fileName);
            
            hide(); // ปิด loading message
            message.success('ส่งออก PDF สำเร็จ!');
            console.log('Screenshot PDF saved successfully');
            
        } catch (error) {
            message.destroy(); // ปิด loading message
            console.error('Error generating screenshot PDF:', error);
            
            // ถ้าเกิด error ให้ใช้วิธี fallback
            console.log('Falling back to simple PDF method');
            exportScheduleToSimplePDF();
        }
    };

    // ฟังก์ชัน PDF แบบเดิม (fallback) - ลบหัวข้อและสรุปออก
    const exportScheduleToSimplePDF = () => {
        try {
            console.log('Creating simple PDF...');
            
            const hide = message.loading('กำลังสร้าง PDF แบบตาราง...', 0);
            
            // สร้าง jsPDF instance (landscape orientation)
            const doc = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });

            // เตรียมข้อมูลสำหรับตาราง (ไม่มีหัวข้อ)
            const tableData: string[][] = [];
            
            // สร้างหัวตาราง
            const headers = ['Day/Time', ...timeSlots];
            
            // สร้างแถวข้อมูล
            scheduleData.forEach((dayData) => {
                const row: string[] = [dayData.day];
                
                timeSlots.forEach(time => {
                    const cellData = dayData[time];
                    let content = '';
                    
                    if (cellData && typeof cellData === 'object') {
                        if (cellData.isBreak) {
                            content = 'Break';
                        } else if (cellData.classes && Array.isArray(cellData.classes) && cellData.classes.length > 0) {
                            content = cellData.classes.map((cls: ClassInfo) => 
                                `${cls.subject}\n${cls.teacher}\n${cls.room}`
                            ).join('\n---\n');
                        } else {
                            content = '-';
                        }
                    } else {
                        content = cellData || '-';
                    }
                    
                    row.push(content);
                });
                
                tableData.push(row);
            });

            // ตรวจสอบว่า autoTable มีอยู่หรือไม่
            if (typeof doc.autoTable === 'function') {
                // สร้างตารางด้วย autoTable (เริ่มจากด้านบน ไม่มีหัวข้อ)
                doc.autoTable({
                    head: [headers],
                    body: tableData,
                    startY: 10, // เริ่มจากด้านบนสุด
                    styles: {
                        fontSize: 6,
                        cellPadding: 1,
                        halign: 'center',
                        valign: 'middle',
                        lineColor: [0, 0, 0],
                        lineWidth: 0.1,
                    },
                    headStyles: {
                        fillColor: [242, 101, 34], // #F26522
                        textColor: [255, 255, 255],
                        fontSize: 7,
                        fontStyle: 'bold',
                    },
                    columnStyles: {
                        0: { 
                            cellWidth: 20, 
                            fillColor: [248, 249, 250],
                            fontStyle: 'bold' 
                        },
                    },
                    alternateRowStyles: {
                        fillColor: [249, 249, 249],
                    },
                    tableLineColor: [0, 0, 0],
                    tableLineWidth: 0.1,
                    theme: 'grid',
                    margin: { top: 10, right: 10, bottom: 10, left: 10 }
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
                    
                    timeSlots.forEach(time => {
                        const cellData = dayData[time];
                        let content = '';
                        
                        if (cellData && typeof cellData === 'object') {
                            if (cellData.isBreak) {
                                content = 'Break';
                            } else if (cellData.classes && Array.isArray(cellData.classes) && cellData.classes.length > 0) {
                                content = cellData.classes.map((cls: ClassInfo) => 
                                    `${cls.subject} (${cls.teacher}) [${cls.room}]`
                                ).join(', ');
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
            const fileName = `schedule_table_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(fileName);
            
            hide();
            message.success('ส่งออก PDF สำเร็จ!');
            console.log('Simple PDF saved successfully');
            
        } catch (error) {
            message.destroy();
            console.error('Error generating simple PDF:', error);
            message.error('เกิดข้อผิดพลาดในการสร้าง PDF: ' + (error as Error).message);
        }
    };

    // สร้าง columns สำหรับ Ant Design Table
    const columns: ColumnsType<ScheduleData> = [
        {
            title: 'Day/Time',
            dataIndex: 'day',
            key: 'day',
            fixed: 'left',
            width: 85,
            render: (text: string) => <strong style={{ color: '#333' }}>{text}</strong>
        },
        ...timeSlots.map(time => ({
            title: time,
            dataIndex: time,
            key: time,
            width: 85,
            render: (text: string, record: ScheduleData) => {
                const cellData = record[time];
                let classes: ClassInfo[] = [];
                let backgroundColor = '#f9f9f9';
                let isBreak = false;
                
                if (cellData && typeof cellData === 'object') {
                    classes = cellData.classes || [];
                    backgroundColor = cellData.backgroundColor || '#f9f9f9';
                    isBreak = cellData.isBreak || false;
                }
                
                const isEmpty = !classes || classes.length === 0;
                
                // ถ้าเป็นช่วงพักเที่ยง
                if (isBreak) {
                    return (
                        <div
                            style={{
                                width: '100%',
                                minHeight: '90px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: backgroundColor,
                                color: '#666',
                                borderRadius: '4px',
                                padding: '8px 4px',
                                fontSize: '7px',
                                fontWeight: 'bold',
                                border: '1px solid #e0e0e0'
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
                                width: '100%',
                                minHeight: '90px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: 'transparent',
                                borderRadius: '4px',
                                padding: '4px',
                                border: '1px dashed #ddd'
                            }}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, record.day, time)}
                        >
                            <div style={{ color: '#999', fontSize: '7px', textAlign: 'center' }}>
                                วางคาบเรียนที่นี่
                            </div>
                        </div>
                    );
                }
                
                // แสดงคาบเรียนแยกเป็นก้อนๆ
                return (
                    <div
                        style={{
                            width: '100%',
                            minHeight: '90px',
                            backgroundColor: 'transparent',
                            borderRadius: '4px',
                            padding: '4px',
                            border: 'none',
                            boxShadow: 'none',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2px',
                            overflow: 'hidden'
                        }}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, record.day, time)}
                    >
                        {classes.map((cls: ClassInfo, index: number) => (
                            <div
                                key={index}
                                draggable={true}
                                style={{
                                    backgroundColor: getRandomBackgroundColor(),
                                    borderRadius: '2px',
                                    padding: '2px 4px',
                                    fontSize: '7px',
                                    lineHeight: '1.1',
                                    textAlign: 'center',
                                    border: '1px solid rgba(0,0,0,0.1)',
                                    color: '#333',
                                    minHeight: '14px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    cursor: 'grab',
                                    transition: 'all 0.2s ease',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    maxWidth: '100%'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'scale(1.01)';
                                    e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.15)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'scale(1)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                                onDragStart={(e) => {
                                    handleDragStart(e, record.day, time, index, cls);
                                    e.currentTarget.style.cursor = 'grabbing';
                                    e.currentTarget.style.opacity = '0.5';
                                }}
                                onDragEnd={(e) => {
                                    e.currentTarget.style.cursor = 'grab';
                                    e.currentTarget.style.opacity = '1';
                                }}
                                onDoubleClick={() => removeClass(record.day, time, index)}
                                title="ลากเพื่อย้าย | ดับเบิลคลิกเพื่อลบ"
                            >
                                <div style={{ fontWeight: 'bold', marginBottom: '1px', fontSize: '7px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {cls.subject}
                                </div>
                                <div style={{ fontSize: '6px', color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {cls.teacher}
                                </div>
                                <div style={{ fontSize: '6px', color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {cls.room}
                                </div>
                                {/* ไอคอนลบมุมขวาบน */}
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: '1px',
                                        right: '1px',
                                        width: '10px',
                                        height: '10px',
                                        backgroundColor: 'rgba(255,0,0,0.7)',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '10px',
                                        color: 'white',
                                        cursor: 'pointer',
                                        opacity: '0.7'
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeClass(record.day, time, index);
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.opacity = '1';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.opacity = '0.7';
                                    }}
                                >
                                    ×
                                </div>
                            </div>
                        ))}
                        
                        {/* Drop zone indicator */}
                        {classes.length === 0 && (
                            <div
                                style={{
                                    minHeight: '18px',
                                    border: '1px dashed #ccc',
                                    borderRadius: '2px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#999',
                                    fontSize: '6px'
                                }}
                            >
                                วางคาบเรียนที่นี่
                            </div>
                        )}
                    </div>
                );
            }
        }))
    ];

    // ใช้ข้อมูลจาก state แทนการสร้างใหม่
    const data: ScheduleData[] = scheduleData.length > 0 ? scheduleData : days.map((day, index) => {
        const rowData: ScheduleData = {
            key: index.toString(),
            day: day
        };
        
        timeSlots.forEach(time => {
            rowData[time] = {
                content: '',
                backgroundColor: '#f9f9f9',
                classes: [] as ClassInfo[]
            };
        });
        
        return rowData;
    });

    return (
        <>
                    {/* Page Title */}
                    <div style={{ 
                        marginBottom: '20px',
                        paddingBottom: '12px',
                        borderBottom: '2px solid #F26522'
                    }}>
                        <h2 style={{ 
                            margin: '0 0 8px 0', 
                            color: '#333',
                            fontSize: '20px',
                            fontWeight: 'bold'
                        }}>
                            จัดตารางเรียน
                        </h2>
                        <p style={{ 
                            margin: 0, 
                            color: '#666',
                            fontSize: '13px'
                        }}>
                            สร้างและจัดการตารางเรียนแบบ Drag & Drop
                        </p>
                    </div>

                    <Flex className="schedule-button" gap="small" wrap style={{ marginBottom: '20px' }}>
                        <Button type="primary" className="primary-button" onClick={saveScheduleData}>
                            บันทึก
                        </Button>
                        <Button className="defualt-button" onClick={resetTable}>
                            รีเซต
                        </Button>
                        <Button className="defualt-button" onClick={loadSchedule}>
                            โหลด
                        </Button>
                        <Button type="primary" className="primary-button" onClick={generateAutoSchedule}>
                            สร้างอัตโนมัติ
                        </Button>
                        <Button type="primary" className="primary-button" onClick={exportScheduleToPDF}>
                            ส่งออก PDF
                        </Button>
                    </Flex>

                    {/* Schedule Table */}
                    <div ref={tableRef} style={{ flex: 1, overflow: 'visible' }}>
                        <Table
                            columns={columns}
                            dataSource={data}
                            pagination={false}
                            size="small"
                            bordered
                            style={{
                                backgroundColor: 'white',
                                borderRadius: '8px',
                                overflow: 'visible'
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
                            setScheduleNameToSave('');
                        }}
                        okText="บันทึก"
                        cancelText="ยกเลิก"
                        okButtonProps={{ className: 'primary-button' }}
                    >
                        <div style={{ margin: '20px 0' }}>
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
                            </Button>
                        ]}
                        width={600}
                    >
                        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            {Object.keys(savedSchedules).length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                                    ไม่มีตารางที่บันทึกไว้
                                </div>
                            ) : (
                                <List
                                    dataSource={Object.entries(savedSchedules)}
                                    renderItem={([name, scheduleInfo]: [string, any]) => (
                                        <List.Item>
                                            <Card
                                                size="small"
                                                style={{ width: '100%', cursor: 'pointer' }}
                                                hoverable
                                                onClick={() => handleLoadSchedule(name)}
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
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteSchedule(name);
                                                        }}
                                                    >
                                                        ลบ
                                                    </Button>
                                                ]}
                                            >
                                                <Card.Meta
                                                    title={name}
                                                    description={
                                                        <div>
                                                            <div>บันทึกเมื่อ: {scheduleInfo.savedAt}</div>
                                                            <div>จำนวนคาบเรียน: {scheduleInfo.totalClasses} คาบ</div>
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