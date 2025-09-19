import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Conditionpage.css";
import { Button, Table, Input, Select, message } from 'antd';
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
    const [containerWidth, setContainerWidth] = useState(window.innerWidth);

    // Monitor container width for responsive behavior
    useEffect(() => {
        const handleResize = () => {
            setContainerWidth(window.innerWidth);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Determine responsive breakpoints
    const isSmallScreen = containerWidth < 1400;
    const isMobile = containerWidth < 768;

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
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '4px',
                maxWidth: isSmallScreen ? '150px' : '200px'
            }}>
                {conditions.map((condition, index) => (
                    <div key={`${condition.ID}-${index}`} style={{
                        padding: '2px 6px',
                        margin: '1px',
                        backgroundColor: '#e6f4ff',
                        borderRadius: '4px',
                        fontSize: isSmallScreen ? '9px' : '10px',
                        display: 'inline-block',
                        border: '1px solid #91d5ff',
                        color: '#1890ff',
                        fontWeight: '500'
                    }}>
                        {condition.DayOfWeek}: {condition.Start}-{condition.End}
                    </div>
                ))}
            </div>
        );
    };

    // ฟังก์ชันลบเงื่อนไข
    const handleDeleteCondition = async (userID: number, fullname: string) => {
        const confirmDelete = window.confirm(
            `คุณต้องการลบเงื่อนไขทั้งหมดของ "${fullname}" หรือไม่?\n\n⚠️ การดำเนินการนี้ไม่สามารถยกเลิกได้`
        );
        
        if (confirmDelete) {
            try {
                const loadingMessage = message.loading('กำลังลบเงื่อนไข...', 0);
                const result = await deleteConditionsByUser(userID.toString());
                loadingMessage();
                
                if (result && (result.status === 200 || result.status === 204 || result.status === 201)) {
                    setConditionsData(prev => prev.filter(item => item.UserID !== userID));
                    message.success(`ลบเงื่อนไขของ ${fullname} สำเร็จ`);
                    
                    if (currentData.length === 1 && currentPage > 1) {
                        setCurrentPage(currentPage - 1);
                    }
                } else {
                    const errorMsg = result?.data?.error || result?.data?.message || result?.statusText || 'ไม่สามารถลบเงื่อนไขได้';
                    message.error(`เกิดข้อผิดพลาด: ${errorMsg}`);
                }
            } catch (error) {
                message.error('เกิดข้อผิดพลาดในการลบเงื่อนไข กรุณาลองใหม่อีกครั้ง');
            }
        }
    };

    // ฟังก์ชันแก้ไขเงื่อนไข
    const handleEditCondition = (userID: number, fullname: string, conditions: ConditionInterface[]) => {
        navigate('/EditConditionpage', {
            state: {
                userID: userID,
                fullname: fullname,
                existingConditions: conditions
            }
        });
    };

    // Responsive columns configuration
    const getColumns = (): ColumnsType<ConditionTableData> => {
        if (isMobile) {
            // Mobile layout - Show only essential columns
            return [
                {
                    title: '#',
                    dataIndex: 'order',
                    key: 'order',
                    width: 40,
                    align: 'center',
                    render: (value: number) => <span style={{ fontWeight: 'bold', fontSize: '10px' }}>{value}</span>
                },
                {
                    title: 'อาจารย์',
                    key: 'teacher',
                    width: 140,
                    render: (_, record: ConditionTableData) => (
                        <div style={{ fontSize: '11px' }}>
                            <div style={{ fontWeight: 'bold', color: '#1890ff', marginBottom: '2px' }}>
                                {record.Code}
                            </div>
                            <div style={{ fontWeight: '500' }}>
                                {record.Fullname}
                            </div>
                            <div style={{ color: '#666', fontSize: '9px' }}>
                                {record.Major}
                            </div>
                        </div>
                    )
                },
                {
                    title: 'เงื่อนไข',
                    key: 'conditions',
                    width: 100,
                    render: (_, record: ConditionTableData) => {
                        const hasConditions = record.Conditions && record.Conditions.length > 0;
                        return (
                            <div style={{ textAlign: 'center' }}>
                                <div style={{
                                    backgroundColor: hasConditions ? '#e6f7ff' : '#f5f5f5',
                                    color: hasConditions ? '#1890ff' : '#999',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    fontSize: '10px',
                                    fontWeight: 'bold',
                                    border: `1px solid ${hasConditions ? '#91d5ff' : '#d9d9d9'}`,
                                    marginBottom: '4px'
                                }}>
                                    {record.ItemCount || 0} ช่วง
                                </div>
                                {hasConditions && (
                                    <div style={{ fontSize: '8px', color: '#666' }}>
                                        มีเงื่อนไข
                                    </div>
                                )}
                            </div>
                        );
                    }
                },
                {
                    title: 'จัดการ',
                    key: 'action',
                    width: 70,
                    align: 'center',
                    render: (_, record: ConditionTableData) => {
                        const hasConditions = record.Conditions && record.Conditions.length > 0;
                        
                        return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <Button
                                    size="small"
                                    style={{
                                        backgroundColor: hasConditions ? '#F26522' : '#f5f5f5',
                                        borderColor: hasConditions ? '#F26522' : '#d9d9d9',
                                        color: hasConditions ? 'white' : '#999',
                                        fontSize: '9px',
                                        padding: '1px 4px',
                                        height: '20px',
                                        lineHeight: '18px'
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
                                        fontSize: '9px',
                                        padding: '1px 4px',
                                        height: '20px',
                                        lineHeight: '18px'
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
        }

        // Desktop/Tablet layout
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
                width: isSmallScreen ? 120 : 150,
                align: 'center'
            }
        ];

        // Add email and phone for large screens only
        if (!isSmallScreen) {
            columns.push(
                {
                    title: 'อีเมล',
                    dataIndex: 'Email',
                    key: 'Email',
                    width: 180,
                    render: (value: string) => (
                        <a href={`mailto:${value}`} style={{ color: '#1890ff', fontSize: '12px' }}>
                            {value}
                        </a>
                    )
                },
                {
                    title: 'เบอร์โทร',
                    dataIndex: 'Phone',
                    key: 'Phone',
                    width: 120,
                    align: 'center',
                    render: (value: string) => <span style={{ fontSize: '12px' }}>{value}</span>
                }
            );
        }

        // Add conditions and count columns
        columns.push(
            {
                title: 'เงื่อนไขเวลาที่ไม่สะดวก',
                dataIndex: 'Conditions',
                key: 'Conditions',
                width: isSmallScreen ? 200 : 280,
                render: (value: ConditionInterface[]) => renderTimeSlots(value)
            },
            {
                title: 'จำนวนช่วงเวลา',
                dataIndex: 'ItemCount',
                key: 'ItemCount',
                width: isSmallScreen ? 80 : 100,
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
                        {value || 0} ช่วง
                    </span>
                )
            }
        );



        // Add action column
        columns.push({
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
        });

        return columns;
    };

    return (
        <div style={{ 
            fontFamily: 'Sarabun, sans-serif',
            padding: 0,
            margin: 0
        }}>
            {/* Page Title */}
            <div style={{ 
                marginBottom: '20px',
                paddingBottom: '12px',
                borderBottom: '2px solid #F26522'
            }}>
                <h2 style={{ 
                    margin: '0 0 8px 0', 
                    color: '#333',
                    fontSize: isMobile ? '18px' : '20px',
                    fontWeight: 'bold',
                    fontFamily: 'Sarabun, sans-serif'
                }}>
                    เงื่อนไขเวลาที่ไม่สะดวกของอาจารย์
                </h2>
                <p style={{ 
                    margin: 0, 
                    color: '#666',
                    fontSize: isMobile ? '12px' : '13px',
                    fontFamily: 'Sarabun, sans-serif'
                }}>
                    จัดการและดูเงื่อนไขเวลาที่ไม่สะดวกของอาจารย์ทุกคน สำหรับการจัดตารางเรียน
                </p>
            </div>

            {/* Controls Section */}
            <div style={{ marginBottom: '20px' }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: '#f8f9fa',
                    padding: isMobile ? '8px 12px' : '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid #e9ecef',
                    minHeight: '48px',
                    flexWrap: isMobile ? 'wrap' : 'nowrap',
                    gap: isMobile ? '8px' : '12px'
                }}>
                    {/* Search controls */}
                    <Select
                        value={selectedDepartment}
                        onChange={setSelectedDepartment}
                        style={{ 
                            width: isMobile ? '100%' : 150,
                            fontFamily: 'Sarabun, sans-serif'
                        }}
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
                        style={{ 
                            width: isMobile ? '100%' : 180,
                            fontFamily: 'Sarabun, sans-serif'
                        }}
                        size="small"
                    />

                    {/* Pagination controls for desktop */}
                    {!isMobile && (
                        <>
                            <span style={{ 
                                whiteSpace: 'nowrap', 
                                fontSize: '12px', 
                                color: '#666',
                                fontFamily: 'Sarabun, sans-serif'
                            }}>
                                รายการที่แสดง
                            </span>
                            <Select
                                value={pageSize.toString()}
                                style={{ 
                                    width: 50,
                                    fontFamily: 'Sarabun, sans-serif'
                                }}
                                size="small"
                                onChange={(value) => handlePageSizeChange(parseInt(value))}
                            >
                                <Option value="5">5</Option>
                                <Option value="10">10</Option>
                                <Option value="20">20</Option>
                                <Option value="50">50</Option>
                            </Select>
                            
                            {/* Page numbers */}
                            {totalPages > 1 && (
                                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
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
                                                    display: 'inline-block',
                                                    fontFamily: 'Sarabun, sans-serif'
                                                }}
                                                onClick={() => handlePageChange(page)}
                                            >
                                                {page}
                                            </span>
                                        )
                                    ))}
                                    {totalPages > 5 && (
                                        <span style={{ 
                                            color: '#666', 
                                            fontSize: '11px',
                                            fontFamily: 'Sarabun, sans-serif'
                                        }}>
                                            ... {totalPages}
                                        </span>
                                    )}
                                </div>
                            )}

                            <div style={{ flex: 1 }}></div>
                        </>
                    )}

                    {/* Refresh Button */}
                    <Button
                        onClick={getAllUserConditions}
                        disabled={loading}
                        style={{ 
                            fontSize: '12px',
                            color: '#666',
                            width: isMobile ? '100%' : 'auto',
                            fontFamily: 'Sarabun, sans-serif'
                        }}
                        size="small"
                    >
                        🔄 รีเฟรช
                    </Button>
                </div>

                {/* Mobile pagination */}
                {isMobile && totalPages > 1 && (
                    <div style={{
                        marginTop: '12px',
                        padding: '8px 12px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '6px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <Select
                            value={pageSize.toString()}
                            style={{ 
                                width: 70,
                                fontFamily: 'Sarabun, sans-serif'
                            }}
                            size="small"
                            onChange={(value) => handlePageSizeChange(parseInt(value))}
                        >
                            <Option value="5">5</Option>
                            <Option value="10">10</Option>
                            <Option value="20">20</Option>
                        </Select>
                        
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <Button
                                size="small"
                                disabled={currentPage === 1}
                                onClick={() => handlePageChange(currentPage - 1)}
                                style={{ fontFamily: 'Sarabun, sans-serif' }}
                            >
                                ←
                            </Button>
                            <span style={{ 
                                fontSize: '12px', 
                                padding: '0 8px',
                                fontFamily: 'Sarabun, sans-serif'
                            }}>
                                {currentPage}/{totalPages}
                            </span>
                            <Button
                                size="small"
                                disabled={currentPage === totalPages}
                                onClick={() => handlePageChange(currentPage + 1)}
                                style={{ fontFamily: 'Sarabun, sans-serif' }}
                            >
                                →
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Summary Stats */}
            {conditionsData.length > 0 && (
                <div style={{
                    marginBottom: '16px',
                    padding: isMobile ? '8px 12px' : '12px 16px',
                    backgroundColor: '#e6f7ff',
                    borderRadius: '6px',
                    border: '1px solid #91d5ff',
                    fontSize: isMobile ? '12px' : '13px',
                    fontFamily: 'Sarabun, sans-serif'
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
                    columns={getColumns()}
                    dataSource={currentData}
                    pagination={false}
                    size="small"
                    bordered
                    scroll={{ 
                        x: isMobile ? 350 : isSmallScreen ? 700 : 1200, 
                        y: isMobile ? 400 : 600 
                    }}
                    loading={loading}
                    style={{ 
                        fontSize: isMobile ? '11px' : '12px',
                        fontFamily: 'Sarabun, sans-serif'
                    }}
                    locale={{
                        emptyText: (
                            <div style={{ 
                                padding: isMobile ? '20px' : '40px', 
                                textAlign: 'center', 
                                color: '#999',
                                fontFamily: 'Sarabun, sans-serif'
                            }}>
                                <div style={{ fontSize: isMobile ? '32px' : '48px', marginBottom: '16px' }}>📋</div>
                                <div style={{ fontSize: isMobile ? '14px' : '16px', marginBottom: '8px' }}>
                                    ไม่พบข้อมูลเงื่อนไข
                                </div>
                                <div style={{ fontSize: isMobile ? '12px' : '14px', color: '#ccc' }}>
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
                padding: isMobile ? '8px 12px' : '12px 16px',
                backgroundColor: '#f8f9fa',
                borderRadius: '6px',
                border: '1px solid #e9ecef',
                fontSize: isMobile ? '11px' : '12px',
                color: '#666',
                fontFamily: 'Sarabun, sans-serif'
            }}>
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: isMobile ? '8px' : '0'
                }}>
                    <div>
                        💡 <strong>หมายเหตุ:</strong> เงื่อนไขเหล่านี้จะถูกนำไปใช้ในการจัดตารางเรียนอัตโนมัติ
                    </div>
                    <div>
                        ข้อมูลล่าสุด: {new Date().toLocaleString('th-TH')} | 
                        <span 
                            style={{ 
                                marginLeft: '8px', 
                                cursor: 'pointer', 
                                color: '#F26522',
                                fontWeight: '500'
                            }}
                            onClick={getAllUserConditions}
                            title="รีเฟรชข้อมูล"
                        >
                            🔄 รีเฟรช
                        </span>
                    </div>
                </div>
            </div>

            {/* Additional Info for Mobile */}
            {isMobile && (
                <div style={{
                    marginTop: '12px',
                    padding: '8px 12px',
                    backgroundColor: '#fff3cd',
                    borderRadius: '6px',
                    border: '1px solid #ffeaa7',
                    fontSize: '11px',
                    color: '#856404',
                    fontFamily: 'Sarabun, sans-serif'
                }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '6px' }}>
                        เคล็ดลับการใช้งานบนมือถือ
                    </div>
                    <div>
                        - แตะปุ่ม <strong>แก้ไข</strong> เพื่อแก้ไขเงื่อนไขของอาจารย์ <br />
                        - แตะ <strong>รีเฟรช</strong> หากข้อมูลไม่อัพเดททันที
                    </div>
                </div>
            )}
        </div>
    );
};

export default Conditionpage;