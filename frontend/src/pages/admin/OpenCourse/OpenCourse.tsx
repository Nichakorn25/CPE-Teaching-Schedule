import React, { useState, useEffect } from "react";
import {
  OpenCourseInterface,
  CurriculumInterface,
} from "../../../interfaces/Adminpage";
import {
  getOpenCourses,
  getCoursebyid,
} from "../../../services/https/AdminPageServices";
import { getAllCurriculum } from "../../../services/https/GetService";
import { Button, Table, Input, Select, message } from 'antd';
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Option } = Select;

interface CourseTableData extends OpenCourseInterface {
  key: string;
  order: number;
}

const OpenCourse: React.FC = () => {
  const [courseData, setCourseData] = useState<OpenCourseInterface[]>([]);
  const [curriculums, setCurriculums] = useState<CurriculumInterface[]>([]);
  const [selectedCurriculumID, setSelectedCurriculumID] = useState<number | null>(null);
  const [searchText, setSearchText] = useState('');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
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

  const fetchOpenCourses = async () => {
    try {
      setLoading(true);
      const response = await getOpenCourses();
      
      if (response.status === 200 && Array.isArray(response.data?.data)) {
        const mappedData: OpenCourseInterface[] = response.data.data.map(
          (item: any) => ({
            ID: item.ID,
            Year: item.Year,
            Term: item.Term,
            Code: item.Code,
            Name: item.Name,
            Credit: item.Credit,
            TypeName: item.TypeName,
            Teacher: item.Teacher,
            GroupInfos: item.GroupInfos || [],
            GroupTotal: item.GroupTotal,
            CapacityPer: item.CapacityPer,
            Remark: item.Remark,
            IsFixCourses: item.IsFixCourses,
          })
        );
        setCourseData(mappedData);
      } else {
        console.error("โหลดข้อมูลรายวิชาไม่สำเร็จ", response);
        message.error('ไม่สามารถโหลดข้อมูลรายวิชาได้');
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      message.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpenCourses();
  }, []);

  useEffect(() => {
    const fetchCurriculums = async () => {
      try {
        const response = await getAllCurriculum();
        if (response.status === 200 && Array.isArray(response.data)) {
          setCurriculums(response.data);
        }
      } catch (error) {
        console.error('Error fetching curriculums:', error);
      }
    };

    fetchCurriculums();
  }, []);

  // Filter data based on search text, year, and semester
  const filteredCourses = courseData.filter(course => {
    const matchesSearch = course.Name?.toLowerCase().includes(searchText.toLowerCase()) ||
                         course.Code?.toLowerCase().includes(searchText.toLowerCase()) ||
                         course.Teacher?.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesYear = selectedYear === 'all' || String(course.Year) === selectedYear;
    const matchesSemester = selectedSemester === 'all' || String(course.Term) === selectedSemester;
    
    return matchesSearch && matchesYear && matchesSemester;
  });

  // Convert data for table
  const tableData: CourseTableData[] = filteredCourses.map((course, index) => ({
    ...course,
    key: course.ID?.toString() || `${index}`,
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

  // Handle delete course
  const handleDeleteCourse = (courseId: number, courseName: string) => {
    // TODO: Implement delete functionality
    message.info(`ฟังก์ชันลบรายวิชา "${courseName}" ยังไม่ได้ implement`);
  };

  // Handle edit course
  const handleEditCourse = (courseId: number, courseName: string) => {
    // TODO: Implement edit functionality
    message.info(`ฟังก์ชันแก้ไขรายวิชา "${courseName}" ยังไม่ได้ implement`);
  };

  // Responsive columns configuration
  const getColumns = (): ColumnsType<CourseTableData> => {
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
          title: 'รายวิชา',
          key: 'course',
          width: 140,
          render: (_, record: CourseTableData) => (
            <div style={{ fontSize: '11px' }}>
              <div style={{ fontWeight: 'bold', color: '#1890ff', marginBottom: '2px' }}>
                {record.Code}
              </div>
              <div style={{ fontWeight: '500', marginBottom: '2px' }}>
                {record.Name}
              </div>
              <div style={{ color: '#666', fontSize: '9px' }}>
                {record.Credit} หน่วยกิต | {record.TypeName}
              </div>
            </div>
          )
        },
        {
          title: 'ข้อมูล',
          key: 'info',
          width: 100,
          render: (_, record: CourseTableData) => (
            <div style={{ fontSize: '10px', textAlign: 'center' }}>
              <div style={{ marginBottom: '2px' }}>
                ปี {record.Year}/{record.Term}
              </div>
              <div style={{ marginBottom: '2px' }}>
                {record.GroupTotal} กลุ่ม
              </div>
              <div style={{ color: '#666' }}>
                {record.CapacityPer} คน/กลุ่ม
              </div>
            </div>
          )
        },
        {
          title: 'จัดการ',
          key: 'action',
          width: 70,
          align: 'center',
          render: (_, record: CourseTableData) => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <Button
                size="small"
                style={{
                  backgroundColor: '#F26522',
                  borderColor: '#F26522',
                  color: 'white',
                  fontSize: '9px',
                  padding: '1px 4px',
                  height: '20px',
                  lineHeight: '18px'
                }}
                onClick={() => handleEditCourse(record.ID, record.Name || '')}
                title="แก้ไขรายวิชา"
              >
                แก้ไข
              </Button>
              <Button
                size="small"
                style={{
                  backgroundColor: '#ff4d4f',
                  borderColor: '#ff4d4f',
                  color: 'white',
                  fontSize: '9px',
                  padding: '1px 4px',
                  height: '20px',
                  lineHeight: '18px'
                }}
                onClick={() => handleDeleteCourse(record.ID, record.Name || '')}
                title="ลบรายวิชา"
              >
                ลบ
              </Button>
            </div>
          )
        }
      ];
    }

    // Desktop/Tablet layout
    const columns: ColumnsType<CourseTableData> = [
      {
        title: 'ลำดับ',
        dataIndex: 'order',
        key: 'order',
        width: 60,
        align: 'center',
        render: (value: number) => <span style={{ fontWeight: 'bold' }}>{value}</span>
      },
      {
        title: 'รหัสวิชา',
        dataIndex: 'Code',
        key: 'Code',
        width: 100,
        render: (value: string) => <span style={{ fontWeight: 'bold', color: '#1890ff' }}>{value || "-"}</span>
      },
      {
        title: 'ชื่อวิชา',
        dataIndex: 'Name',
        key: 'Name',
        width: isSmallScreen ? 180 : 220,
        render: (value: string) => <span style={{ fontWeight: '500' }}>{value || "-"}</span>
      },
      {
        title: 'หน่วยกิต',
        dataIndex: 'Credit',
        key: 'Credit',
        width: 80,
        align: 'center'
      },
      {
        title: 'หมวดวิชา',
        dataIndex: 'TypeName',
        key: 'TypeName',
        width: isSmallScreen ? 100 : 120,
        align: 'center'
      }
    ];

    // Add teacher column for larger screens
    if (!isSmallScreen) {
      columns.push({
        title: 'อาจารย์ผู้สอน',
        dataIndex: 'Teacher',
        key: 'Teacher',
        width: 150,
        align: 'center'
      });
    }

    // Add group info columns
    columns.push(
      {
        title: 'จำนวนกลุ่ม',
        dataIndex: 'GroupTotal',
        key: 'GroupTotal',
        width: isSmallScreen ? 80 : 100,
        align: 'center',
        render: (value: number) => (
          <span style={{ 
            backgroundColor: '#e6f7ff',
            color: '#1890ff',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 'bold',
            border: '1px solid #91d5ff'
          }}>
            {value} กลุ่ม
          </span>
        )
      },
      {
        title: 'นักศึกษาต่อกลุ่ม',
        dataIndex: 'CapacityPer',
        key: 'CapacityPer',
        width: isSmallScreen ? 100 : 120,
        align: 'center',
        render: (value: number) => `${value} คน`
      }
    );

    // Add year/term and remark for large screens
    if (!isSmallScreen) {
      columns.push(
        {
          title: 'ปีการศึกษา/ภาคเรียน',
          key: 'yearTerm',
          width: 120,
          align: 'center',
          render: (_, record: CourseTableData) => (
            <span style={{ fontSize: '11px' }}>
              {record.Year}/{record.Term}
            </span>
          )
        },
        {
          title: 'หมายเหตุ',
          dataIndex: 'Remark',
          key: 'Remark',
          width: 100,
          align: 'center',
          render: (value: string) => value || "-"
        }
      );
    }

    // Add action column
    columns.push({
      title: 'จัดการ',
      key: 'action',
      width: 120,
      align: 'center',
      render: (_, record: CourseTableData) => (
        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
          <Button
            size="small"
            icon={<EditOutlined />}
            style={{
              backgroundColor: '#F26522',
              borderColor: '#F26522',
              color: 'white',
              fontSize: '11px',
              padding: '2px 8px',
              height: 'auto'
            }}
            onClick={() => handleEditCourse(record.ID, record.Name || '')}
            title="แก้ไขรายวิชา"
          >
            แก้ไข
          </Button>
          <Button
            size="small"
            icon={<DeleteOutlined />}
            style={{
              backgroundColor: '#ff4d4f',
              borderColor: '#ff4d4f',
              color: 'white',
              fontSize: '11px',
              padding: '2px 8px',
              height: 'auto'
            }}
            onClick={() => handleDeleteCourse(record.ID, record.Name || '')}
            title="ลบรายวิชา"
          >
            ลบ
          </Button>
        </div>
      )
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
          รายวิชาที่เปิดสอน
        </h2>
        <p style={{ 
          margin: 0, 
          color: '#666',
          fontSize: isMobile ? '12px' : '13px',
          fontFamily: 'Sarabun, sans-serif'
        }}>
          จัดการข้อมูลรายวิชาที่เปิดสอนในแต่ละภาคเรียน
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
          <Input
            placeholder="ค้นหารายวิชา..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ 
              width: isMobile ? '100%' : 200,
              fontFamily: 'Sarabun, sans-serif'
            }}
            size="small"
          />

          <Select
            value={selectedYear}
            onChange={setSelectedYear}
            style={{ 
              width: isMobile ? '100%' : 100,
              fontFamily: 'Sarabun, sans-serif'
            }}
            placeholder="ปีการศึกษา"
            size="small"
          >
            <Option value="all">ทุกปี</Option>
            <Option value="2567">2567</Option>
            <Option value="2566">2566</Option>
            <Option value="2565">2565</Option>
          </Select>

          <Select
            value={selectedSemester}
            onChange={setSelectedSemester}
            style={{ 
              width: isMobile ? '100%' : 100,
              fontFamily: 'Sarabun, sans-serif'
            }}
            placeholder="ภาคเรียน"
            size="small"
          >
            <Option value="all">ทุกภาค</Option>
            <Option value="1">ภาค 1</Option>
            <Option value="2">ภาค 2</Option>
            <Option value="3">ภาค 3</Option>
          </Select>

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

          {/* Add Course Button */}
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => message.info('ฟังก์ชันเพิ่มรายวิชายังไม่ได้ implement')}
            style={{ 
              backgroundColor: '#52c41a',
              borderColor: '#52c41a',
              fontSize: '12px',
              width: isMobile ? '100%' : 'auto',
              fontFamily: 'Sarabun, sans-serif'
            }}
            size="small"
          >
            เพิ่มรายวิชา
          </Button>

          {/* Refresh Button */}
          <Button
            onClick={fetchOpenCourses}
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
            x: isMobile ? 350 : isSmallScreen ? 1000 : 1600, 
            y: isMobile ? 400 : 600 
          }}
          loading={loading}
          style={{ 
            fontSize: isMobile ? '11px' : '12px',
            fontFamily: 'Sarabun, sans-serif'
          }}
          className="custom-table"
          locale={{
            emptyText: (
              <div style={{ 
                padding: isMobile ? '20px' : '40px', 
                textAlign: 'center', 
                color: '#999',
                fontFamily: 'Sarabun, sans-serif'
              }}>
                <div style={{ fontSize: isMobile ? '32px' : '48px', marginBottom: '16px' }}>📚</div>
                <div style={{ fontSize: isMobile ? '14px' : '16px', marginBottom: '8px' }}>
                  ไม่พบข้อมูลรายวิชา
                </div>
                <div style={{ fontSize: isMobile ? '12px' : '14px', color: '#ccc' }}>
                  ยังไม่มีรายวิชาที่เปิดสอนในระบบ
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
            💡 <strong>หมายเหตุ:</strong> ข้อมูลรายวิชาเหล่านี้ใช้สำหรับการจัดตารางเรียนและการลงทะเบียน
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
              onClick={fetchOpenCourses}
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
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>💡 เคล็ดลับการใช้งาน:</div>
          <div>• ใช้การค้นหาเพื่อหารายวิชาที่ต้องการได้เร็วขึ้น</div>
          <div>• กรองข้อมูลตามปีการศึกษาและภาคเรียน</div>
          <div>• หมุนหน้าจอเป็นแนวนอนเพื่อดูข้อมูลเพิ่มเติม</div>
          <div>• กดปุ่ม "เพิ่มรายวิชา" เพื่อเพิ่มรายวิชาใหม่</div>
        </div>
      )}
    </div>
  );
};

export default OpenCourse;