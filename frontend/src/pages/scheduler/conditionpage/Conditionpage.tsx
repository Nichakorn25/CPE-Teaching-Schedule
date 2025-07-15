import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../../components/schedule-sidebar/Sidebar";
import Header from "../../../components/schedule-header/Header";
import "./Conditionpage.css";
import { Button, Table, Input, Select, message, Modal } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { getAllConditions, deleteConditionsByUser } from "../../../services/https/SchedulerPageService";
import { UserConInterface, ConditionInterface } from "../../../interfaces/SchedulerIn";

const { Option } = Select;

interface ConditionTableData extends UserConInterface {
  key: string;
  order: number;
}

const Conditionpage: React.FC = () => {
    const navigate = useNavigate();
    const [searchText, setSearchText] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [conditionsData, setConditionsData] = useState<UserConInterface[]>([]);
    const [loading, setLoading] = useState(false);

    const getAllUserConditions = async () => {
        try {
            setLoading(true);
            let res = await getAllConditions();
            if (res && res.status === 200) {
                setConditionsData(res.data);
            } else {
                console.error('Error response:', res);
                message.error('ไม่สามารถโหลดข้อมูลเงื่อนไขได้');
            }
        } catch (error) {
            console.error('Error fetching conditions:', error);
            message.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        getAllUserConditions();
    }, []);

    // กรองข้อมูลตาม search text และแผนก
    const filteredConditions = conditionsData.filter(condition => {
        const matchesSearch = condition.Fullname?.toLowerCase().includes(searchText.toLowerCase()) ||
                            condition.Code?.toLowerCase().includes(searchText.toLowerCase()) ||
                            condition.Email?.toLowerCase().includes(searchText.toLowerCase());
        
        const matchesDepartment = selectedDepartment === 'all' || 
                                condition.Major === selectedDepartment;
        
        return matchesSearch && matchesDepartment;
    });

    // แปลงข้อมูลสำหรับตาราง
    const tableData: ConditionTableData[] = filteredConditions.map((condition, index) => ({
        ...condition,
        key: condition.UserID?.toString() || `${index}`,
        order: (currentPage - 1) * pageSize + index + 1
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
    const renderTimeSlots = (conditions: ConditionInterface[]) => {
        if (!conditions || conditions.length === 0) {
            return <span style={{ color: '#999', fontStyle: 'italic' }}>ไม่มีเงื่อนไข</span>;
        }
        
        return (
            <div className="time-slots-container">
                {conditions.map((condition, index) => (
                    <div key={`${condition.ID}-${index}`} className="time-slot-display" style={{
                        padding: '2px 6px',
                        margin: '2px',
                        backgroundColor: '#e6f4ff',
                        borderRadius: '4px',
                        fontSize: '11px',
                        display: 'inline-block'
                    }}>
                        {condition.DayOfWeek}: {condition.Start}-{condition.End}
                    </div>
                ))}
            </div>
        );
    };

    // ฟังก์ชันลบเงื่อนไข - ใช้ window.confirm แทน Modal.confirm
    const handleDeleteCondition = async (userID: number, fullname: string) => {
        console.log('=== DELETE CONDITION DEBUG ===');
        console.log('UserID to delete:', userID);
        console.log('Fullname:', fullname);
        
        const confirmDelete = window.confirm(
            `คุณต้องการลบเงื่อนไขทั้งหมดของ "${fullname}" หรือไม่?\n\n⚠️ การดำเนินการนี้ไม่สามารถยกเลิกได้`
        );
        
        if (confirmDelete) {
            console.log('=== USER CONFIRMED DELETE ===');
            
            try {
                console.log('=== STARTING DELETE PROCESS ===');
                console.log('Calling deleteConditionsByUser with userID:', userID.toString());
                
                // แสดง loading message
                const loadingMessage = message.loading('กำลังลบเงื่อนไข...', 0);
                
                const result = await deleteConditionsByUser(userID.toString());
                
                // ปิด loading message
                loadingMessage();
                
                console.log('=== DELETE API RESULT ===');
                console.log('Full result object:', result);
                console.log('Result status:', result?.status);
                console.log('Result data:', result?.data);
                
                // ตรวจสอบผลลัพธ์
                if (result && (result.status === 200 || result.status === 204 || result.status === 201)) {
                    console.log('=== DELETE SUCCESS ===');
                    
                    // ลบออกจาก state
                    setConditionsData(prev => {
                        const filtered = prev.filter(item => item.UserID !== userID);
                        console.log('Updated conditions data length:', filtered.length);
                        return filtered;
                    });
                    
                    message.success(`ลบเงื่อนไขของ ${fullname} สำเร็จ`);
                    
                    // ปรับหน้าถ้าจำเป็น
                    if (currentData.length === 1 && currentPage > 1) {
                        console.log('Adjusting pagination from page', currentPage, 'to', currentPage - 1);
                        setCurrentPage(currentPage - 1);
                    }
                } else {
                    console.log('=== DELETE FAILED ===');
                    console.log('Status was not 200/201/204');
                    console.log('Status:', result?.status);
                    console.log('Data:', result?.data);
                    
                    const errorMsg = result?.data?.error || 
                                    result?.data?.message || 
                                    result?.statusText ||
                                    'ไม่สามารถลบเงื่อนไขได้';
                    message.error(`เกิดข้อผิดพลาด: ${errorMsg}`);
                }
            } catch (error) {
                console.log('=== DELETE EXCEPTION ===');
                console.error('Exception during delete:', error);
                console.error('Error type:', typeof error);
                console.error('Error message:', (error as any)?.message);
                console.error('Error stack:', (error as any)?.stack);
                
                message.error('เกิดข้อผิดพลาดในการลบเงื่อนไข กรุณาลองใหม่อีกครั้ง');
            }
        } else {
            console.log('Delete cancelled by user');
        }
    };

    // ฟังก์ชันแก้ไขเงื่อนไข - ไปหน้า EditCondition พร้อมข้อมูลเดิม
    const handleEditCondition = (userID: number, fullname: string, conditions: ConditionInterface[]) => {
        console.log('=== EDIT CONDITION DEBUG ===');
        console.log('UserID:', userID);
        console.log('Fullname:', fullname);
        console.log('Existing conditions:', conditions);
        
        // ส่งข้อมูลไปหน้า EditCondition ผ่าน state
        navigate('/EditConditionpage', {
            state: {
                userID: userID,
                fullname: fullname,
                existingConditions: conditions
            }
        });
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
            dataIndex: 'Code',
            key: 'Code',
            width: 100,
            render: (value: string) => <span style={{ fontWeight: 'bold', color: '#1890ff' }}>{value}</span>
        },
        {
            title: 'ชื่อ-นามสกุล',
            dataIndex: 'Fullname',
            key: 'Fullname',
            width: 200,
            render: (value: string) => <span style={{ fontWeight: '500' }}>{value}</span>
        },
        {
            title: 'แผนก/สาขา',
            dataIndex: 'Major',
            key: 'Major',
            width: 150,
            align: 'center'
        },
        {
            title: 'อีเมล',
            dataIndex: 'Email',
            key: 'Email',
            width: 180,
            render: (value: string) => (
                <a href={`mailto:${value}`} style={{ color: '#1890ff' }}>
                    {value}
                </a>
            )
        },
        {
            title: 'เบอร์โทร',
            dataIndex: 'Phone',
            key: 'Phone',
            width: 120,
            align: 'center'
        },
        {
            title: 'เงื่อนไขเวลาที่ไม่สะดวก',
            dataIndex: 'Conditions',
            key: 'Conditions',
            width: 280,
            render: (value: ConditionInterface[]) => renderTimeSlots(value)
        },
        {
            title: 'จำนวนช่วงเวลา',
            dataIndex: 'ItemCount',
            key: 'ItemCount',
            width: 100,
            align: 'center',
            render: (value: number) => (
                <span style={{ 
                    backgroundColor: value > 0 ? '#e6f7ff' : '#f5f5f5',
                    color: value > 0 ? '#1890ff' : '#999',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    border: `1px solid ${value > 0 ? '#91d5ff' : '#d9d9d9'}`
                }}>
                    {value} ช่วง
                </span>
            )
        },
        {
            title: 'วันที่สร้าง',
            dataIndex: 'CreatedAt',
            key: 'CreatedAt',
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
            dataIndex: 'LastUpdatedAt',
            key: 'LastUpdatedAt',
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
            render: (_, record: ConditionTableData) => {
                const hasConditions = record.Conditions && record.Conditions.length > 0;
                
                return (
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                        <Button
                            size="small"
                            style={{
                                backgroundColor: hasConditions ? '#F26522' : '#f5f5f5',
                                borderColor: hasConditions ? '#F26522' : '#d9d9d9',
                                color: hasConditions ? 'white' : '#999',
                                fontSize: '11px',
                                padding: '2px 8px',
                                height: 'auto'
                            }}
                            onClick={() => handleEditCondition(record.UserID, record.Fullname, record.Conditions)}
                            disabled={!hasConditions}
                            title={hasConditions ? 'แก้ไขเงื่อนไข' : 'ไม่มีเงื่อนไขให้แก้ไข'}
                        >
                            แก้ไข
                        </Button>
                        <Button
                            size="small"
                            style={{
                                backgroundColor: hasConditions ? '#ff4d4f' : '#f5f5f5',
                                borderColor: hasConditions ? '#ff4d4f' : '#d9d9d9',
                                color: hasConditions ? 'white' : '#999',
                                fontSize: '11px',
                                padding: '2px 8px',
                                height: 'auto'
                            }}
                            onClick={() => handleDeleteCondition(record.UserID, record.Fullname)}
                            disabled={!hasConditions}
                            title={hasConditions ? 'ลบเงื่อนไขทั้งหมด' : 'ไม่มีเงื่อนไขให้ลบ'}
                        >
                            ลบ
                        </Button>
                    </div>
                );
            }
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

                            {/* Spacer */}
                            <div style={{ flex: 1 }}></div>

                            {/* Refresh Button */}
                            <Button
                                onClick={getAllUserConditions}
                                disabled={loading}
                                style={{ 
                                    fontSize: '12px',
                                    color: '#666'
                                }}
                                size="small"
                            >
                                🔄 รีเฟรช
                            </Button>
                        </div>
                    </div>

                    {/* Summary Stats */}
                    {conditionsData.length > 0 && (
                        <div style={{
                            marginBottom: '16px',
                            padding: '12px 16px',
                            backgroundColor: '#e6f7ff',
                            borderRadius: '6px',
                            border: '1px solid #91d5ff',
                            fontSize: '13px'
                        }}>
                            <strong>สรุป:</strong> อาจารย์ทั้งหมด {conditionsData.length} คน | 
                            มีเงื่อนไข {conditionsData.filter(c => c.Conditions && c.Conditions.length > 0).length} คน | 
                            ไม่มีเงื่อนไข {conditionsData.filter(c => !c.Conditions || c.Conditions.length === 0).length} คน
                        </div>
                    )}

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
                            loading={loading}
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
                                ข้อมูลล่าสุด: {new Date().toLocaleString('th-TH')} | 
                                <span 
                                    style={{ marginLeft: '8px', cursor: 'pointer', color: '#F26522' }}
                                    onClick={getAllUserConditions}
                                    title="รีเฟรชข้อมูล"
                                >
                                    🔄 รีเฟรช
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Conditionpage;