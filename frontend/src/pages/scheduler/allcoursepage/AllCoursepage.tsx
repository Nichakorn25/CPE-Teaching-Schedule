import React, { useState } from "react";
import Sidebar from "../../../components/schedule-sidebar/Sidebar";
import Header from "../../../components/schedule-header/Header";
import "./AllCoursepage.css";
import { Button, Table, Input, Select, message, Modal } from 'antd';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Option } = Select;

interface Course {
  id: number;
  code: string;
  name: string;
  credit: string;
  category: string;
  instructors: string[];
}

interface CourseTableData extends Course {
  key: string;
  order: number;
}

const AllCoursepage: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [coursesData, setCoursesData] = useState<Course[]>([]);

  // ข้อมูลตัวอย่างรายวิชา
  const sampleCourses: Course[] = [
    {
      id: 1,
      code: "IST20 1001",
      name: "DIGITAL LITERACY",
      credit: "2(2-0-4)",
      category: "หมวดวิชาศึกษาทั่วไป",
      instructors: ["อ.ดร.ปราโมทย์ ภักดีณรงค์"],
    },
    {
      id: 2,
      code: "IST20 1502",
      name: "ART APPRECIATION",
      credit: "2(2-0-4)",
      category: "หมวดวิชาศึกษาทั่วไป",
      instructors: ["อ.ดร.ปราโมทย์ ภักดีณรงค์"],
    },
    {
      id: 3,
      code: "ENG23 2003",
      name: "PROBLEM SOLVING WITH PROGRAMMING",
      credit: "2(1-3-5)",
      category: "หมวดวิชาเฉพาะ",
      instructors: ["อ.ดร.คมศัลล์ ศรีวิสุทธิ์"],
    },
    {
      id: 4,
      code: "ENG23 2011",
      name: "DATABASE SYSTEMS",
      credit: "4(3-3-9)",
      category: "หมวดวิชาเฉพาะ",
      instructors: ["ผศ.ดร.นันทวุฒิ คะอังกุ", "ผศ.ดร.ศรัญญา กาญจนวัฒนา"],
    },
    {
      id: 5,
      code: "ENG23 4014",
      name: "ARTIFICIAL NEURAL NETWORKS",
      credit: "4(4-0-8)",
      category: "หมวดวิชาเลือก",
      instructors: ["อ.ดร.สุภาพร บุญฤทธิ์"],
    },
    {
      id: 6,
      code: "ENG23 3017",
      name: "INTRODUCTION TO DATA ENGINEERING",
      credit: "4(3-3-9)",
      category: "หมวดวิชาเลือก",
      instructors: ["ผศ.ดร.ศรัญญา กาญจนวัฒนา"],
    },
    {
      id: 7,
      code: "CS23 1001",
      name: "COMPUTER PROGRAMMING 1",
      credit: "3(2-2-7)",
      category: "หมวดวิชาเฉพาะ",
      instructors: ["อ.สมชาย รักการสอน"],
    },
    {
      id: 8,
      code: "MAT23 1001",
      name: "CALCULUS I",
      credit: "3(3-0-6)",
      category: "หมวดวิชาพื้นฐาน",
      instructors: ["อ.วิมลา เก่งการสอน"],
    },
    {
      id: 9,
      code: "ENG23 3021",
      name: "SOFTWARE ENGINEERING",
      credit: "4(3-3-9)",
      category: "หมวดวิชาเฉพาะ",
      instructors: ["ผศ.ดร.อนันต์ มานะเรียน"],
    },
    {
      id: 10,
      code: "CS23 2005",
      name: "DATA STRUCTURES AND ALGORITHMS",
      credit: "3(2-2-7)",
      category: "หมวดวิชาเฉพาะ",
      instructors: ["อ.สุวรรณา ปัญญาดี"],
    }
  ];

  React.useEffect(() => {
    setCoursesData(sampleCourses);
  }, []);

  // กรองข้อมูลตาม search text และหมวดวิชา
  const filteredCourses = coursesData.filter(course => {
    const matchesSearch = course.name.toLowerCase().includes(searchText.toLowerCase()) ||
                        course.code.toLowerCase().includes(searchText.toLowerCase()) ||
                        course.instructors.some(instructor => 
                          instructor.toLowerCase().includes(searchText.toLowerCase())
                        );
    
    const matchesCategory = selectedCategory === 'all' || 
                          course.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // แปลงข้อมูลสำหรับตาราง
  const tableData: CourseTableData[] = filteredCourses.map((course, index) => ({
    ...course,
    key: course.id.toString(),
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

  // คอลัมน์ของตาราง
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
      dataIndex: 'code',
      key: 'code',
      width: 120,
      render: (value: string) => <span style={{ fontWeight: 'bold', color: '#1890ff' }}>{value}</span>
    },
    {
      title: 'ชื่อวิชา',
      dataIndex: 'name',
      key: 'name',
      width: 300,
      render: (value: string) => <span style={{ fontWeight: '500' }}>{value}</span>
    },
    {
      title: 'หน่วยกิต',
      dataIndex: 'credit',
      key: 'credit',
      width: 100,
      align: 'center'
    },
    {
      title: 'หมวดวิชา',
      dataIndex: 'category',
      key: 'category',
      width: 150,
      align: 'center'
    },
    {
      title: 'อาจารย์ผู้สอน',
      dataIndex: 'instructors',
      key: 'instructors',
      width: 250,
      render: (instructors: string[]) => (
        <div style={{ textAlign: 'left' }}>
          {instructors.map((instructor, index) => (
            <div key={index} style={{ fontSize: '12px', marginBottom: '2px' }}>
              {instructor}
            </div>
          ))}
        </div>
      )
    },
  ];

  return (
    <div className="p-6 font-sarabun mt-10">
    <>
      {/* Background Layer */}
      <div className="allcourse-background" />
      
      {/* Sidebar */}
      <div className="allcourse-sidebar">
        <Sidebar />
      </div>
      
      {/* Main Content */}
      <div className="allcourse-main-content">
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
        <div className="allcourse-content-area">
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
              รายวิชาทั้งหมด
            </h2>
            <p style={{ 
              margin: 0, 
              color: '#666',
              fontSize: '13px'
            }}>
              จัดการข้อมูลรายวิชาทั้งหมดในระบบ
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
                placeholder="ค้นหารายวิชา"
                suffix={<SearchOutlined style={{ color: '#F26522' }} />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ 
                  width: 150,
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

              {/* Category Filter */}
              <Select
                value={selectedCategory}
                onChange={setSelectedCategory}
                style={{ width: 160 }}
                placeholder="รายวิชาทั้งหมด"
                size="small"
              >
                <Option value="all">รายวิชาทั้งหมด</Option>
                <Option value="หมวดวิชาศึกษาทั่วไป">หมวดวิชาศึกษาทั่วไป</Option>
                <Option value="หมวดวิชาพื้นฐาน">หมวดวิชาพื้นฐาน</Option>
                <Option value="หมวดวิชาเฉพาะ">หมวดวิชาเฉพาะ</Option>
                <Option value="หมวดวิชาเลือก">หมวดวิชาเลือก</Option>
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
              scroll={{ x: 1400, y: 600 }}
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
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📚</div>
                    <div style={{ fontSize: '16px', marginBottom: '8px' }}>
                      ไม่พบข้อมูลรายวิชา
                    </div>
                    <div style={{ fontSize: '14px', color: '#ccc' }}>
                      ยังไม่มีรายวิชาในระบบ หรือไม่พบผลการค้นหา
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
                💡 <strong>หมายเหตุ:</strong> รายวิชาเหล่านี้จะถูกนำไปใช้ในการจัดตารางเรียน
              </div>
              <div>
                ข้อมูลล่าสุด: {new Date().toLocaleString('th-TH')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
    </div>
  );
};

export default AllCoursepage;