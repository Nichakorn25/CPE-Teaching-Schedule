import React, { useState } from "react";
import Sidebar from "../../../components/schedule-sidebar/Sidebar";
import Header from "../../../components/header/Header";
import "./Instructorpage.css";
import { Button, Table, Input, Select, message, Modal, Tag } from 'antd';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Option } = Select;

interface Instructor {
  id: number;
  instructorId: string;
  name: string;
  email: string;
  studentId: string;
  department: string;
  faculty: string;
  workType: string;
  status: string;
  role: string;
}

interface InstructorTableData extends Instructor {
  key: string;
  order: number;
}

const Instructorpage: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [instructorsData, setInstructorsData] = useState<Instructor[]>([]);

  // ข้อมูลตัวอย่างอาจารย์
  const sampleInstructors: Instructor[] = [
    {
      id: 1,
      instructorId: "รศ.ดร.",
      name: "นันทวุฒิ",
      email: "nantawut@sut.ac.th",
      studentId: "65000001",
      department: "วิศวกรรมคอมพิวเตอร์",
      faculty: "วิศวกรรมคอมพิวเตอร์",
      workType: "คณาจารย์วิศวกรรมคอมพิวเตอร์",
      status: "Active",
      role: "Instructor"
    },
    {
      id: 2,
      instructorId: "รศ.ดร.",
      name: "ศรัญญา",
      email: "sarunya.k@sut.ac.th",
      studentId: "65000002",
      department: "วิศวกรรมคอมพิวเตอร์",
      faculty: "วิศวกรรมคอมพิวเตอร์",
      workType: "อาจารย์ประจำ",
      status: "Active",
      role: "Scheduler"
    },
    {
      id: 3,
      instructorId: "อ.ดร.",
      name: "สุภาพร",
      email: "sbunyit@sut.ac.th",
      studentId: "65000003",
      department: "วิศวกรรมคอมพิวเตอร์",
      faculty: "วิศวกรรมคอมพิวเตอร์",
      workType: "อาจารย์ประจำ",
      status: "Active",
      role: "Instructor"
    },
    {
      id: 4,
      instructorId: "อ.ดร.",
      name: "คมศิลป์",
      email: "komsan@sut.ac.th",
      studentId: "65000004",
      department: "วิศวกรรมคอมพิวเตอร์",
      faculty: "วิศวกรรมคอมพิวเตอร์",
      workType: "คณาจารย์วิศวกรรมคอมพิวเตอร์",
      status: "Active",
      role: "Instructor"
    }
  ];

  React.useEffect(() => {
    setInstructorsData(sampleInstructors);
  }, []);

  // กรองข้อมูลตาม search text และแผนก
  const filteredInstructors = instructorsData.filter(instructor => {
    const matchesSearch = instructor.name.toLowerCase().includes(searchText.toLowerCase()) ||
                        instructor.email.toLowerCase().includes(searchText.toLowerCase()) ||
                        instructor.instructorId.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesDepartment = selectedDepartment === 'all' || 
                            instructor.department === selectedDepartment;
    
    return matchesSearch && matchesDepartment;
  });

  // แปลงข้อมูลสำหรับตาราง
  const tableData: InstructorTableData[] = filteredInstructors.map((instructor, index) => ({
    ...instructor,
    key: instructor.id.toString(),
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

  // ฟังก์ชันเพิ่มอาจารย์ใหม่
  const handleAddInstructor = () => {
    message.info('เปิดหน้าเพิ่มอาจารย์ใหม่');
    // TODO: นำไปยังหน้าเพิ่มอาจารย์
  };

  // คอลัมน์ของตาราง
  const columns: ColumnsType<InstructorTableData> = [
    {
      title: 'ลำดับ',
      dataIndex: 'order',
      key: 'order',
      width: 60,
      align: 'center',
      render: (value: number) => <span style={{ fontWeight: 'bold' }}>{value}</span>
    },
    {
      title: 'รหัสผู้ใช้ระบบ',
      dataIndex: 'instructorId',
      key: 'instructorId',
      width: 120,
      align: 'center',
      render: (value: string) => <span style={{ fontWeight: 'bold', color: '#1890ff' }}>{value}</span>
    },
    {
      title: 'ชื่อ',
      dataIndex: 'name',
      key: 'name',
      width: 120,
      align: 'center',
      render: (value: string) => <span style={{ fontWeight: '500' }}>{value}</span>
    },
    {
      title: 'อีเมล',
      dataIndex: 'email',
      key: 'email',
      width: 180,
      align: 'center',
      render: (value: string) => (
        <a href={`mailto:${value}`} style={{ color: '#1890ff' }}>
          {value}
        </a>
      )
    },
    {
      title: 'รหัสนักศึกษา',
      dataIndex: 'studentId',
      key: 'studentId',
      width: 120,
      align: 'center'
    },
    {
      title: 'หน่วยงาน/สาขา',
      dataIndex: 'department',
      key: 'department',
      width: 150,
      align: 'center'
    },
    {
      title: 'คณะ/วิทยาลัย',
      dataIndex: 'faculty',
      key: 'faculty',
      width: 150,
      align: 'center'
    },
    {
      title: 'ประเภทงาน',
      dataIndex: 'workType',
      key: 'workType',
      width: 180,
      align: 'center'
    },
    {
      title: 'สถานะ',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      align: 'center',
      render: (status: string) => (
        <Tag color={status === 'Active' ? 'green' : 'red'}>
          {status}
        </Tag>
      )
    },
    {
      title: 'บทบาท',
      dataIndex: 'role',
      key: 'role',
      width: 100,
      align: 'center',
      render: (role: string) => (
        <Tag color={role === 'Scheduler' ? 'blue' : 'orange'}>
          {role}
        </Tag>
      )
    }
  ];

  return (
    <div className="p-6 font-sarabun mt-16">
      <Header />
      
      {/* Background Layer */}
      <div className="instructor-background" />
      
      {/* Sidebar */}
      <div className="instructor-sidebar">
        <Sidebar />
      </div>
      
      {/* Main Content */}
      <div className="instructor-main-content">        
        {/* White Content Area */}
        <div className="instructor-content-area">
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
              รายชื่ออาจารย์
            </h2>
            <p style={{ 
              margin: 0, 
              color: '#666',
              fontSize: '13px'
            }}>
              จัดการข้อมูลรายชื่ออาจารย์และผู้สอนทั้งหมดในระบบ
            </p>
          </div>

          {/* Controls Section */}
          <div style={{ 
            marginBottom: '20px'
          }}>
            {/* Controls Bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#f8f9fa',
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid #e9ecef',
              gap: '12px',
              flexWrap: 'wrap'
            }}>
              {/* Search Input */}
              <Input
                placeholder="ค้นหารายชื่ออาจารย์"
                suffix={<SearchOutlined style={{ color: '#F26522' }} />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ 
                  width: 180,
                  borderColor: '#F26522'
                }}
                size="small"
              />
              
              {/* Items per page */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '12px', color: '#666' }}>รายการที่แสดง</span>
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
              </div>
              
              {/* Pagination Numbers */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {[1, 2, 3, 4, 5].map((page) => (
                  page <= totalPages && (
                    <span
                      key={page}
                      style={{ 
                        backgroundColor: currentPage === page ? '#F26522' : 'transparent',
                        color: currentPage === page ? 'white' : '#333',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: currentPage === page ? 'bold' : 'normal',
                        minWidth: '20px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        display: 'inline-block',
                        border: currentPage === page ? 'none' : '1px solid #ddd'
                      }}
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </span>
                  )
                ))}
                
                {totalPages > 5 && (
                  <>
                    <span style={{ color: '#666', fontSize: '12px', margin: '0 4px' }}>...</span>
                    <span
                      style={{ 
                        backgroundColor: 'transparent',
                        color: '#333',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        minWidth: '20px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        display: 'inline-block',
                        border: '1px solid #ddd'
                      }}
                      onClick={() => handlePageChange(totalPages)}
                    >
                      {totalPages}
                    </span>
                  </>
                )}
                
                <span style={{ 
                  fontSize: '12px',
                  color: '#333',
                  fontWeight: 'bold',
                  margin: '0 8px'
                }}>
                  ถัดไป
                </span>
              </div>

              {/* Spacer */}
              <div style={{ flex: 1 }}></div>

              {/* Department Filter */}
              <Select
                value={selectedDepartment}
                onChange={setSelectedDepartment}
                style={{ width: 200 }}
                placeholder="สาขาวิชาทั้งหมด"
                size="small"
              >
                <Option value="all">สาขาวิชาทั้งหมด</Option>
                <Option value="วิศวกรรมคอมพิวเตอร์">วิศวกรรมคอมพิวเตอร์</Option>
                <Option value="เทคโนโลยีสารสนเทศ">เทคโนโลยีสารสนเทศ</Option>
                <Option value="วิทยาการคอมพิวเตอร์">วิทยาการคอมพิวเตอร์</Option>
              </Select>
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
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>👨‍🏫</div>
                    <div style={{ fontSize: '16px', marginBottom: '8px' }}>
                      ไม่พบข้อมูลอาจารย์
                    </div>
                    <div style={{ fontSize: '14px', color: '#ccc' }}>
                      ยังไม่มีข้อมูลอาจารย์ในระบบ หรือไม่พบผลการค้นหา
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
                💡 <strong>หมายเหตุ:</strong> ข้อมูลอาจารย์เหล่านี้จะถูกนำไปใช้ในการจัดตารางเรียนและการมอบหมายงาน
              </div>
              <div>
                ข้อมูลล่าสุด: {new Date().toLocaleString('th-TH')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Instructorpage;