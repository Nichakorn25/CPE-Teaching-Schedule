import React, { useState, useEffect } from "react";
import Sidebar from "../../../components/schedule-sidebar/Sidebar";
import Header from "../../../components/schedule-header/Header";
import "./Conditionpage.css";
import { Button, Table, Input, Select, message, Modal } from 'antd';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Option } = Select;

interface TimeSlot {
  id: number;
  start: string;
  end: string;
}

interface TeacherCondition {
  id: string;
  teacherName: string;
  teacherCode: string;
  department: string;
  email: string;
  phone: string;
  unavailableDays: {
    [dayIndex: number]: TimeSlot[];
  };
  createdAt: string;
  updatedAt: string;
  totalTimeSlots: number;
}

interface ConditionTableData extends TeacherCondition {
  key: string;
  order: number;
}

const Conditionpage: React.FC = () => {
    const [searchText, setSearchText] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [conditionsData, setConditionsData] = useState<TeacherCondition[]>([]);

    const days = ["จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];

    // ข้อมูลตัวอย่างเงื่อนไขของอาจารย์
    const sampleConditions: TeacherCondition[] = [
        {
            id: "T001",
            teacherName: "อ.ดร.ปราโมทย์ ภักดีณรงค์",
            teacherCode: "T001",
            department: "เทคโนโลยีสารสนเทศ",
            email: "pramote@sut.ac.th",
            phone: "044-224-3000",
            unavailableDays: {
                0: [{ id: 1, start: "08:00", end: "10:00" }], // จันทร์
                2: [{ id: 2, start: "13:00", end: "15:00" }, { id: 3, start: "16:00", end: "18:00" }], // พุธ
            },
            createdAt: "2024-01-15 09:30:00",
            updatedAt: "2024-01-20 14:15:00",
            totalTimeSlots: 3
        },
        {
            id: "T002",
            teacherName: "รศ.ดร.ศรัญญา กาญจนวัฒนา",
            teacherCode: "T002",
            department: "วิศวกรรมคอมพิวเตอร์",
            email: "saranya@sut.ac.th",
            phone: "044-224-3001",
            unavailableDays: {
                1: [{ id: 4, start: "09:00", end: "12:00" }], // อังคาร
                4: [{ id: 5, start: "14:00", end: "16:00" }], // ศุกร์
            },
            createdAt: "2024-01-10 11:00:00",
            updatedAt: "2024-01-18 16:30:00",
            totalTimeSlots: 2
        },
        {
            id: "T003",
            teacherName: "อ.สมชาย รักการสอน",
            teacherCode: "T003",
            department: "วิทยาการคอมพิวเตอร์",
            email: "somchai@sut.ac.th",
            phone: "044-224-3002",
            unavailableDays: {
                0: [{ id: 6, start: "13:00", end: "15:00" }], // จันทร์
                2: [{ id: 7, start: "10:00", end: "12:00" }], // พุธ
                4: [{ id: 8, start: "15:00", end: "17:00" }], // ศุกร์
            },
            createdAt: "2024-01-12 14:20:00",
            updatedAt: "2024-01-22 10:45:00",
            totalTimeSlots: 3
        },
        {
            id: "T004",
            teacherName: "อ.วิมลา เก่งการสอน",
            teacherCode: "T004",
            department: "เทคโนโลยีสารสนเทศ",
            email: "vimala@sut.ac.th",
            phone: "044-224-3003",
            unavailableDays: {
                1: [{ id: 9, start: "08:00", end: "10:00" }, { id: 10, start: "14:00", end: "16:00" }], // อังคาร
                3: [{ id: 11, start: "11:00", end: "13:00" }], // พฤหัสบดี
            },
            createdAt: "2024-01-08 08:15:00",
            updatedAt: "2024-01-25 13:20:00",
            totalTimeSlots: 3
        },
        {
            id: "T005",
            teacherName: "ผศ.ดร.อนันต์ มานะเรียน",
            teacherCode: "T005",
            department: "วิศวกรรมคอมพิวเตอร์",
            email: "anan@sut.ac.th",
            phone: "044-224-3004",
            unavailableDays: {
                0: [{ id: 12, start: "09:00", end: "11:00" }], // จันทร์
                1: [{ id: 13, start: "13:00", end: "15:00" }], // อังคาร
                2: [{ id: 14, start: "16:00", end: "18:00" }], // พุธ
                4: [{ id: 15, start: "10:00", end: "12:00" }], // ศุกร์
            },
            createdAt: "2024-01-05 16:45:00",
            updatedAt: "2024-01-28 09:10:00",
            totalTimeSlots: 4
        },
        {
            id: "T006",
            teacherName: "อ.สุวรรณา ปัญญาดี",
            teacherCode: "T006",
            department: "วิทยาการคอมพิวเตอร์",
            email: "suwanna@sut.ac.th",
            phone: "044-224-3005",
            unavailableDays: {
                2: [{ id: 16, start: "08:00", end: "12:00" }], // พุธ
                5: [{ id: 17, start: "09:00", end: "11:00" }], // เสาร์
            },
            createdAt: "2024-01-20 10:30:00",
            updatedAt: "2024-01-30 15:45:00",
            totalTimeSlots: 2
        },
        {
            id: "T007",
            teacherName: "ผศ.ดร.จิรพันธ์ นักวิจัย",
            teacherCode: "T007",
            department: "เทคโนโลยีสารสนเทศ",
            email: "jirapan@sut.ac.th",
            phone: "044-224-3006",
            unavailableDays: {
                1: [{ id: 18, start: "10:00", end: "12:00" }], // อังคาร
                3: [{ id: 19, start: "14:00", end: "17:00" }], // พฤหัสบดี
                4: [{ id: 20, start: "08:00", end: "10:00" }], // ศุกร์
            },
            createdAt: "2024-01-03 13:15:00",
            updatedAt: "2024-01-27 11:20:00",
            totalTimeSlots: 3
        }
    ];

    useEffect(() => {
        // จำลองการโหลดข้อมูลจาก API หรือ localStorage
        setConditionsData(sampleConditions);
    }, []);

    // กรองข้อมูลตาม search text และแผนก
    const filteredConditions = conditionsData.filter(condition => {
        const matchesSearch = condition.teacherName.toLowerCase().includes(searchText.toLowerCase()) ||
                            condition.teacherCode.toLowerCase().includes(searchText.toLowerCase()) ||
                            condition.email.toLowerCase().includes(searchText.toLowerCase());
        
        const matchesDepartment = selectedDepartment === 'all' || 
                                condition.department === selectedDepartment;
        
        return matchesSearch && matchesDepartment;
    });

    // แปลงข้อมูลสำหรับตาราง
    const tableData: ConditionTableData[] = filteredConditions.map((condition, index) => ({
        ...condition,
        key: condition.id,
        order: index + 1
    }));

    // Calculate pagination
    const totalItems = tableData.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const currentData = tableData.slice(startIndex, endIndex);

    // Handle page change
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    // Handle page size change
    const handlePageSizeChange = (size: number) => {
        setPageSize(size);
        setCurrentPage(1);
    };

    // ฟังก์ชันแสดงช่วงเวลาที่ไม่สะดวก
    const renderTimeSlots = (unavailableDays: { [dayIndex: number]: TimeSlot[] }) => {
        const allSlots: React.ReactElement[] = [];
        
        Object.entries(unavailableDays).forEach(([dayIndex, slots]) => {
            const dayName = days[parseInt(dayIndex)];
            slots.forEach((slot, index) => {
                allSlots.push(
                    <div key={`${dayIndex}-${slot.id}`} className="time-slot-display">
                        {dayName}: {slot.start}-{slot.end}
                    </div>
                );
            });
        });
        
        return (
            <div className="time-slots-container">
                {allSlots.length > 0 ? allSlots : <span style={{ color: '#999', fontStyle: 'italic' }}>ไม่มีเงื่อนไข</span>}
            </div>
        );
    };

    // ฟังก์ชันลบเงื่อนไข
    const handleDeleteCondition = (conditionId: string, teacherName: string) => {
        Modal.confirm({
            title: 'ยืนยันการลบ',
            content: `คุณต้องการลบเงื่อนไขของ "${teacherName}" หรือไม่?`,
            okText: 'ลบ',
            okType: 'danger',
            cancelText: 'ยกเลิก',
            onOk() {
                setConditionsData(prev => prev.filter(item => item.id !== conditionId));
                message.success(`ลบเงื่อนไขของ ${teacherName} สำเร็จ`);
                
                // ปรับหน้าถ้าจำเป็น
                if (currentData.length === 1 && currentPage > 1) {
                    setCurrentPage(currentPage - 1);
                }
            }
        });
    };

    // ฟังก์ชันแก้ไขเงื่อนไข
    const handleEditCondition = (conditionId: string, teacherName: string) => {
        message.info(`เปิดหน้าแก้ไขเงื่อนไขของ ${teacherName}`);
        // TODO: นำไปยังหน้าแก้ไขเงื่อนไข หรือเปิด Modal แก้ไข
    };

    // คอลัมน์ของตาราง
    const columns: ColumnsType<ConditionTableData> = [
        {
            title: 'ลำดับ',
            dataIndex: 'order',
            key: 'order',
            width: 60,
            align: 'center',
            render: (value: number) => <span style={{ fontWeight: 'bold' }}>{value}</span>
        },
        {
            title: 'รหัสอาจารย์',
            dataIndex: 'teacherCode',
            key: 'teacherCode',
            width: 100,
            render: (value: string) => <span style={{ fontWeight: 'bold', color: '#1890ff' }}>{value}</span>
        },
        {
            title: 'ชื่อ-นามสกุล',
            dataIndex: 'teacherName',
            key: 'teacherName',
            width: 200,
            render: (value: string) => <span style={{ fontWeight: '500' }}>{value}</span>
        },
        {
            title: 'แผนก/สาขา',
            dataIndex: 'department',
            key: 'department',
            width: 150,
            align: 'center'
        },
        {
            title: 'อีเมล',
            dataIndex: 'email',
            key: 'email',
            width: 180,
            render: (value: string) => (
                <a href={`mailto:${value}`} style={{ color: '#1890ff' }}>
                    {value}
                </a>
            )
        },
        {
            title: 'เบอร์โทร',
            dataIndex: 'phone',
            key: 'phone',
            width: 120,
            align: 'center'
        },
        {
            title: 'เงื่อนไขเวลาที่ไม่สะดวก',
            dataIndex: 'unavailableDays',
            key: 'unavailableDays',
            width: 250,
            render: (value: { [dayIndex: number]: TimeSlot[] }) => renderTimeSlots(value)
        },
        {
            title: 'จำนวนช่วงเวลา',
            dataIndex: 'totalTimeSlots',
            key: 'totalTimeSlots',
            width: 100,
            align: 'center',
            render: (value: number) => (
                <span style={{ 
                    backgroundColor: '#f8f9fa',
                    color: '#333',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    border: '1px solid #e9ecef'
                }}>
                    {value} ช่วง
                </span>
            )
        },
        {
            title: 'วันที่สร้าง',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 130,
            align: 'center',
            render: (value: string) => (
                <span style={{ fontSize: '10px', color: '#666' }}>
                    {new Date(value).toLocaleDateString('th-TH')}
                </span>
            )
        },
        {
            title: 'แก้ไขล่าสุด',
            dataIndex: 'updatedAt',
            key: 'updatedAt',
            width: 130,
            align: 'center',
            render: (value: string) => (
                <span style={{ fontSize: '10px', color: '#666' }}>
                    {new Date(value).toLocaleDateString('th-TH')}
                </span>
            )
        },
        {
            title: 'จัดการ',
            key: 'action',
            width: 120,
            align: 'center',
            render: (_, record: ConditionTableData) => (
                <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                    <Button
                        size="small"
                        style={{
                            backgroundColor: '#F26522',
                            borderColor: '#F26522',
                            color: 'white',
                            fontSize: '11px',
                            padding: '2px 8px',
                            height: 'auto'
                        }}
                        onClick={() => handleEditCondition(record.id, record.teacherName)}
                    >
                        แก้ไข
                    </Button>
                    <Button
                        size="small"
                        style={{
                            backgroundColor: '#ff4d4f',
                            borderColor: '#ff4d4f',
                            color: 'white',
                            fontSize: '11px',
                            padding: '2px 8px',
                            height: 'auto'
                        }}
                        onClick={() => handleDeleteCondition(record.id, record.teacherName)}
                    >
                        ลบ
                    </Button>
                </div>
            )
        }
    ];

    return (
        <>
            {/* Background Layer */}
            <div className="condition-background" />
            
            {/* Sidebar */}
            <div className="condition-sidebar">
                <Sidebar />
            </div>
            
            {/* Main Content */}
            <div className="condition-main-content">
                {/* Header */}
                <div style={{
                    position: 'absolute',
                    top: '15px',
                    right: '0px',
                    zIndex: 999
                }}>
                    <Header />
                </div>
                
                {/* White Content Area */}
                <div className="condition-content-area">
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
                            เงื่อนไขเวลาที่ไม่สะดวกของอาจารย์
                        </h2>
                        <p style={{ 
                            margin: 0, 
                            color: '#666',
                            fontSize: '13px'
                        }}>
                            จัดการและดูเงื่อนไขเวลาที่ไม่สะดวกของอาจารย์ทุกคน สำหรับการจัดตารางเรียน
                        </p>
                    </div>

                    {/* Controls Section */}
                    <div style={{ 
                        marginBottom: '20px'
                    }}>
                        {/* Top row - Main controls */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            backgroundColor: '#f8f9fa',
                            padding: '12px 16px',
                            borderRadius: '8px',
                            border: '1px solid #e9ecef',
                            minHeight: '48px',
                            flexWrap: 'nowrap',
                            overflow: 'hidden'
                        }}>
                            {/* Left group - Search controls */}
                            <div style={{ 
                                display: 'flex', 
                                gap: '12px', 
                                alignItems: 'center',
                                flexShrink: 0
                            }}>
                                <Select
                                    value={selectedDepartment}
                                    onChange={setSelectedDepartment}
                                    style={{ width: 150 }}
                                    placeholder="เลือกแผนก"
                                    size="small"
                                >
                                    <Option value="all">ทุกแผนก</Option>
                                    <Option value="เทคโนโลยีสารสนเทศ">เทคโนโลยีสารสนเทศ</Option>
                                    <Option value="วิศวกรรมคอมพิวเตอร์">วิศวกรรมคอมพิวเตอร์</Option>
                                    <Option value="วิทยาการคอมพิวเตอร์">วิทยาการคอมพิวเตอร์</Option>
                                </Select>
                                
                                <Input
                                    placeholder="ค้นหาอาจารย์..."
                                    prefix={<SearchOutlined />}
                                    value={searchText}
                                    onChange={(e) => setSearchText(e.target.value)}
                                    style={{ width: 180 }}
                                    size="small"
                                />
                                
                                {/* Pagination controls */}
                                <span style={{ whiteSpace: 'nowrap', fontSize: '12px', color: '#666' }}>รายการที่แสดง</span>
                                <Select
                                    value={pageSize.toString()}
                                    style={{ width: 50 }}
                                    size="small"
                                    onChange={(value) => {
                                        const newSize = parseInt(value);
                                        handlePageSizeChange(newSize);
                                    }}
                                >
                                    <Option value="5">5</Option>
                                    <Option value="10">10</Option>
                                    <Option value="20">20</Option>
                                    <Option value="50">50</Option>
                                </Select>
                                
                                {/* Compact pagination numbers */}
                                {totalPages > 1 && (
                                    <>
                                        {[1, 2, 3, 4, 5].map((page) => (
                                            page <= totalPages && (
                                                <span
                                                    key={page}
                                                    style={{ 
                                                        backgroundColor: currentPage === page ? '#F26522' : 'transparent',
                                                        color: currentPage === page ? 'white' : '#666',
                                                        padding: '2px 6px',
                                                        borderRadius: '3px',
                                                        fontSize: '11px',
                                                        fontWeight: currentPage === page ? 'bold' : 'normal',
                                                        minWidth: '18px',
                                                        textAlign: 'center',
                                                        cursor: 'pointer',
                                                        display: 'inline-block'
                                                    }}
                                                    onClick={() => handlePageChange(page)}
                                                >
                                                    {page}
                                                </span>
                                            )
                                        ))}
                                        
                                        {totalPages > 5 && (
                                            <>
                                                <span style={{ color: '#666', fontSize: '11px' }}>... {totalPages}</span>
                                            </>
                                        )}
                                        
                                        {currentPage < totalPages && (
                                            <span 
                                                style={{ 
                                                    cursor: 'pointer', 
                                                    color: '#666', 
                                                    fontSize: '11px', 
                                                    whiteSpace: 'nowrap'
                                                }}
                                                onClick={() => handlePageChange(currentPage + 1)}
                                            >
                                                ถัดไป
                                            </span>
                                        )}
                                    </>
                                )}
                                
                                <span style={{ 
                                    fontSize: '10px', 
                                    whiteSpace: 'nowrap',
                                    color: '#666'
                                }}>
                                    แสดง {startIndex + 1}-{Math.min(endIndex, totalItems)} จาก {totalItems} รายการ
                                </span>
                            </div>
                        </div>
                    </div>



                    {/* Main Table */}
                    <div style={{ 
                        backgroundColor: 'white',
                        border: '1px solid #d9d9d9',
                        borderRadius: '6px',
                        overflow: 'hidden'
                    }}>
                        <Table
                            columns={columns}
                            dataSource={currentData}
                            pagination={false}
                            size="small"
                            bordered
                            scroll={{ x: 1600, y: 600 }}
                            style={{
                                fontSize: '12px'
                            }}
                            className="custom-table"
                            locale={{
                                emptyText: (
                                    <div style={{ 
                                        padding: '40px', 
                                        textAlign: 'center', 
                                        color: '#999' 
                                    }}>
                                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                                        <div style={{ fontSize: '16px', marginBottom: '8px' }}>
                                            ไม่พบข้อมูลเงื่อนไข
                                        </div>
                                        <div style={{ fontSize: '14px', color: '#ccc' }}>
                                            ยังไม่มีอาจารย์คนใดเพิ่มเงื่อนไขเวลาที่ไม่สะดวก
                                        </div>
                                    </div>
                                )
                            }}
                        />
                    </div>

                    {/* Footer Info */}
                    <div style={{
                        marginTop: '16px',
                        padding: '12px 16px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '6px',
                        border: '1px solid #e9ecef',
                        fontSize: '12px',
                        color: '#666'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                💡 <strong>หมายเหตุ:</strong> เงื่อนไขเหล่านี้จะถูกนำไปใช้ในการจัดตารางเรียนอัตโนมัติ
                            </div>
                            <div>
                                ข้อมูลล่าสุด: {new Date().toLocaleString('th-TH')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Conditionpage;