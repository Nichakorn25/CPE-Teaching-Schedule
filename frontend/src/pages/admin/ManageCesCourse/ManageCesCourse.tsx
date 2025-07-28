import React, { useState, useEffect } from "react";
import { Button, Input, Select, Card, Form, Row, Col, TimePicker, message } from 'antd';
import { SaveOutlined, ArrowLeftOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from "react-router-dom";
import dayjs from 'dayjs';
import {
  getAllAcademicYears,
  getAllCurriculum,
  getMajorOfDepathment,
  getTypeofCourse,
} from "../../../services/https/GetService";
import {
  getTeachers,
  postCreateTimeFixedCourses,
  getAllCourses,
} from "../../../services/https/AdminPageServices";
import {
  getNameTable,
} from "../../../services/https/SchedulerPageService";

const { Option } = Select;

const ManageCesCourse: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [containerWidth, setContainerWidth] = useState(window.innerWidth);

  React.useEffect(() => {
    const handleResize = () => {
      setContainerWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = containerWidth < 768;

  type ClassTime = {
    id: number;
    day: string;
    start: string;
    end: string;
    group: string;
    room: string;
  };

  // States สำหรับ API
  const [nameTable, setNameTable] = useState("");
  const [nameTables, setNameTables] = useState<string[]>([]);
  const [curriculums, setCurriculums] = useState<any[]>([]);
  const [selectedCurriculum, setSelectedCurriculum] = useState<any>(null);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<any>(null);
  const [typeOfCoursesList, setTypeOfCoursesList] = useState<any[]>([]);
  const [majors, setMajors] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDepartmentID, setSelectedDepartmentID] = useState<number>(0);
  const [filteredMajors, setFilteredMajors] = useState<any[]>([]);
  const [selectedMajorID, setSelectedMajorID] = useState<number>(0);
  const [allTeachers, setAllTeachers] = useState<any[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [year, setYear] = useState<number>(new Date().getFullYear() + 543);
  const [term, setTerm] = useState<number>(1);

  // States สำหรับรายวิชา
  const [allCourses, setAllCourses] = useState<any[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);

  // States เดิม
  const [courseType, setCourseType] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [credit, setCredit] = useState("");
  const [hours, setHours] = useState({
    lecture: "",
    practice: "",
    selfStudy: "",
  });
  const [thaiName, setThaiName] = useState("");
  const [englishName, setEnglishName] = useState("");
  const [studentTotal, setStudentTotal] = useState("0");
  const [studentExpected, setStudentExpected] = useState("0");

  const [classTimes, setClassTimes] = useState<ClassTime[]>([
    {
      id: 1,
      day: "",
      start: "",
      end: "",
      group: "1",
      room: "",
    },
  ]);

  const [loading, setLoading] = useState(false);

  // Load ข้อมูลเริ่มต้น
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const [
          curriculumRes,
          academicYearRes,
          typeRes,
          majorRes,
          nameTableRes,
          coursesRes
        ] = await Promise.all([
          getAllCurriculum(),
          getAllAcademicYears(),
          getTypeofCourse(),
          getMajorOfDepathment(),
          getNameTable(),
          getAllCourses()
        ]);

        // Set curriculums
        if (curriculumRes.status === 200 && curriculumRes.data) {
          setCurriculums(curriculumRes.data);
        }

        // Set academic years
        if (academicYearRes.status === 200 && academicYearRes.data) {
          setAcademicYears(academicYearRes.data);
        }

        // Set course types
        if (typeRes.status === 200 && typeRes.data) {
          setTypeOfCoursesList(typeRes.data);
        }
        
        // Set majors and departments
        if (majorRes.status === 200 && Array.isArray(majorRes.data)) {
          const majorData = majorRes.data;
          setMajors(majorData);
          
          const uniqueDepartments = Array.from(
            new Map(majorData.map((m: any) => [m.Department.ID, m.Department])).values()
          );
          setDepartments(uniqueDepartments);
        }

        // Set name tables
        if (nameTableRes.status === 200 && nameTableRes.data && nameTableRes.data.name_tables) {
          setNameTables(nameTableRes.data.name_tables);
        }

        // Set all courses
        if (coursesRes.status === 200 && coursesRes.data) {
          console.log("📚 All courses loaded:", coursesRes.data.length, "courses");
          setAllCourses(coursesRes.data);
        }

      } catch (error) {
        message.error("เกิดข้อผิดพลาดในการโหลดข้อมูล");
        console.error("Error fetching initial data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // กรองรายวิชาตามหลักสูตรที่เลือก
  useEffect(() => {
    if (selectedCurriculum && allCourses.length > 0) {
      console.log("🔍 Filtering courses for curriculum:", selectedCurriculum.CurriculumName, "ID:", selectedCurriculum.ID);
      console.log("🔍 Total courses available:", allCourses.length);
      
      const filtered = allCourses.filter((course: any) => {
        // ลองหาด้วย field names ที่เป็นไปได้
        const curriculumId = course.CurriculumID || course.curriculum_id || course.curriculumId;
        const match = curriculumId === selectedCurriculum.ID;
        
        if (match) {
          console.log("✅ Found matching course:", course);
        }
        
        return match;
      });
      
      console.log("🎯 Filtered courses:", filtered.length, "courses found");
      setFilteredCourses(filtered);
      
      if (filtered.length === 0) {
        message.warning(`ไม่พบรายวิชาในหลักสูตร "${selectedCurriculum.CurriculumName}"`);
        console.log("❌ Sample course structure:", allCourses[0]);
      } else {
        message.success(`พบรายวิชา ${filtered.length} รายวิชาในหลักสูตร "${selectedCurriculum.CurriculumName}"`);
      }
    } else {
      setFilteredCourses([]);
    }
    
    // รีเซ็ตการเลือกรายวิชาเมื่อเปลี่ยนหลักสูตร
    setSelectedCourse(null);
    resetCourseFields();
  }, [selectedCurriculum, allCourses]);

  // ฟังก์ชันรีเซ็ตฟิลด์รายวิชา
  const resetCourseFields = () => {
    setCourseCode("");
    setThaiName("");
    setEnglishName("");
    setCredit("");
    setHours({ lecture: "", practice: "", selfStudy: "" });
    setCourseType("");
  };

  // เมื่อเลือกรายวิชา จะกรอกข้อมูลอัตโนมัติ
  useEffect(() => {
    if (selectedCourse) {
      console.log("📝 Auto-filling course data:", selectedCourse);
      
      // ลองหา field names ที่เป็นไปได้สำหรับแต่ละข้อมูล
      const courseCode = selectedCourse.Code || selectedCourse.code || selectedCourse.CourseCode || selectedCourse.course_code || "";
      const thaiName = selectedCourse.ThaiName || selectedCourse.thai_name || selectedCourse.CourseName || selectedCourse.course_name || "";
      const englishName = selectedCourse.EnglishName || selectedCourse.english_name || selectedCourse.CourseNameEng || selectedCourse.course_name_eng || "";
      const unit = selectedCourse.Unit || selectedCourse.unit || selectedCourse.Credit || selectedCourse.credit || "";
      const lecture = selectedCourse.Lecture || selectedCourse.lecture || selectedCourse.LectureHours || selectedCourse.lecture_hours || "";
      const lab = selectedCourse.Lab || selectedCourse.lab || selectedCourse.LabHours || selectedCourse.lab_hours || "";
      const self = selectedCourse.Self || selectedCourse.self || selectedCourse.SelfStudy || selectedCourse.self_study || "";
      const typeId = selectedCourse.TypeOfCoursesID || selectedCourse.type_of_courses_id || selectedCourse.TypeId || selectedCourse.type_id || "";

      setCourseCode(courseCode);
      setThaiName(thaiName);
      setEnglishName(englishName);
      setCredit(unit.toString());
      
      // ตรวจสอบว่าเป็นเลขหรือไม่ ถ้าไม่ใช่ให้ใส่ 0
      const lectureHours = isNaN(Number(lecture)) ? "0" : lecture.toString();
      const labHours = isNaN(Number(lab)) ? "0" : lab.toString();
      const selfHours = isNaN(Number(self)) ? "0" : self.toString();
      
      setHours({
        lecture: lectureHours,
        practice: labHours,
        selfStudy: selfHours,
      });
      
      // ตรวจสอบ TypeId ให้แน่ใจว่ามีค่า
      if (typeId && typeId !== "" && typeId !== "0") {
        setCourseType(typeId.toString());
      } else {
        // หาจากชื่อหมวดวิชาหรือกำหนดค่า default
        const defaultTypeId = typeOfCoursesList.length > 0 ? typeOfCoursesList[0].ID.toString() : "1";
        setCourseType(defaultTypeId);
        console.log("⚠️ TypeId not found, using default:", defaultTypeId);
      }

      console.log("✅ Course data filled:", {
        courseCode,
        thaiName,
        englishName,
        unit,
        lecture: lectureHours,
        lab: labHours,
        self: selfHours,
        typeId: typeId || "default"
      });
    }
  }, [selectedCourse, typeOfCoursesList]);

  // Filter majors by department
  useEffect(() => {
    const filtered = majors.filter((m: any) => m.Department.ID === selectedDepartmentID);
    setFilteredMajors(filtered);
    setSelectedMajorID(0);
    setSelectedTeacher(null);
  }, [selectedDepartmentID, majors]);

  // Fetch teachers by major
  useEffect(() => {
    const fetchTeachers = async () => {
      if (selectedMajorID === 0) {
        setAllTeachers([]);
        return;
      }

      try {
        const res = await getTeachers();
        if (res.status === 200) {
          const filtered = res.data.filter(
            (teacher: any) => teacher.MajorID === selectedMajorID
          );
          setAllTeachers(filtered);
        }
      } catch (error) {
        message.error("เกิดข้อผิดพลาดในการโหลดข้อมูลอาจารย์");
      }
    };

    fetchTeachers();
  }, [selectedMajorID]);

  const addClassTime = () => {
    setClassTimes([
      ...classTimes,
      {
        id: Date.now(),
        day: "",
        start: "",
        end: "",
        group: (classTimes.length + 1).toString(),
        room: "",
      },
    ]);
  };

  const removeClassTime = (id: number) => {
    if (classTimes.length <= 1) {
      message.warning("ต้องมีอย่างน้อย 1 ช่วงเวลาเรียน");
      return;
    }
    setClassTimes(classTimes.filter((c) => c.id !== id));
  };

  const validateForm = () => {
    console.log("🔍 Validating form...");
    console.log("Current values:", {
      nameTable,
      courseType,
      courseCode,
      credit,
      thaiName,
      englishName,
      hours,
      selectedCurriculum: selectedCurriculum?.ID,
      selectedAcademicYear: selectedAcademicYear?.ID,
      selectedTeacher: selectedTeacher?.ID,
      year,
      term,
      studentTotal,
      studentExpected
    });

    const basicValidation = nameTable && 
                          courseType && 
                          courseCode && 
                          credit && 
                          thaiName && 
                          englishName && 
                          hours.lecture && 
                          hours.practice && 
                          hours.selfStudy &&
                          selectedCurriculum &&
                          selectedAcademicYear &&
                          selectedTeacher &&
                          year &&
                          term &&
                          studentTotal && 
                          studentExpected;

    const classTimeValidation = classTimes.every(ct => 
      ct.day && ct.start && ct.end && ct.group && ct.room
    );

    console.log("Validation results:", {
      basicValidation,
      classTimeValidation,
      overall: basicValidation && classTimeValidation
    });

    return basicValidation && classTimeValidation;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      message.warning('กรุณากรอกข้อมูลให้ครบถ้วนก่อนบันทึก');
      return;
    }

    try {
      setLoading(true);

      // สร้างข้อมูลสำหรับแต่ละช่วงเวลา
      const promises = classTimes.map(async (classTime) => {
        const timeFixedData = {
          Year: year,
          Term: term,
          Section: parseInt(studentTotal),
          Capacity: parseInt(studentExpected),
          UserID: selectedTeacher.ID,
          AllCoursesID: selectedCourse?.ID || 0,
          LaboratoryID: null,
          SectionInFixed: parseInt(classTime.group),
          DayOfWeek: classTime.day,
          StartTime: classTime.start,
          EndTime: classTime.end,
          RoomFix: classTime.room,
          NameTable: nameTable,
          Code: courseCode,
          EnglishName: englishName,
          ThaiName: thaiName,
          CurriculumID: selectedCurriculum.ID,
          AcademicYearID: selectedAcademicYear.ID,
          TypeOfCoursesID: parseInt(courseType),
          Unit: parseInt(credit),
          Lecture: parseInt(hours.lecture),
          Lab: parseInt(hours.practice),
          Self: parseInt(hours.selfStudy),
        };

        return postCreateTimeFixedCourses(timeFixedData);
      });

      const responses = await Promise.all(promises);
      
      const allSuccess = responses.every(response => response.status === 200);
      
      if (allSuccess) {
        message.success('บันทึกข้อมูลรายวิชาจากศูนย์บริการสำเร็จ');
        message.info(`วิชา ${courseCode} จะปรากฏในตาราง "${nameTable}" แล้ว`);
        
        // รีเซ็ตฟอร์ม
        form.resetFields();
        resetAllFields();
        
        // ไปหน้าตารางสอน
        setTimeout(() => {
          navigate('/schedule-page');
        }, 2000);
      } else {
        message.error('เกิดข้อผิดพลาดในการบันทึกบางช่วงเวลา');
      }
    } catch (error: any) {
      message.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + (error?.response?.data?.error || error.message));
      console.error("Error submitting course:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetAllFields = () => {
    setCourseType("");
    setCourseCode("");
    setCredit("");
    setHours({ lecture: "", practice: "", selfStudy: "" });
    setThaiName("");
    setEnglishName("");
    setStudentTotal("0");
    setStudentExpected("0");
    setNameTable("");
    setSelectedCurriculum(null);
    setSelectedAcademicYear(null);
    setSelectedTeacher(null);
    setSelectedCourse(null);
    setFilteredCourses([]);
    setSelectedDepartmentID(0);
    setSelectedMajorID(0);
    setClassTimes([{
      id: 1,
      day: "",
      start: "",
      end: "",
      group: "1",
      room: "",
    }]);
  };

  // Generate number options
  const generateNumberOptions = (max: number) => {
    return Array.from({ length: max + 1 }, (_, i) => (
      <Option key={i} value={i.toString()}>
        {i}
      </Option>
    ));
  };

  // จัดการเมื่อเลือกรายวิชา
  const handleCourseSelect = (courseId: number) => {
    const course = filteredCourses.find((c: any) => c.ID === courseId);
    if (course) {
      console.log("🎯 Selected course:", course);
      setSelectedCourse(course);
    }
  };

  return (
    <div style={{ 
      fontFamily: 'Sarabun, sans-serif',
      padding: isMobile ? '16px' : '24px',
      backgroundColor: '#f5f5f5',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{ 
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        <div>
          <h1 style={{ 
            margin: 0, 
            color: '#333',
            fontSize: isMobile ? '20px' : '24px',
            fontWeight: 'bold'
          }}>
            จัดการรายวิชาจากศูนย์บริการ
          </h1>
          <p style={{ 
            margin: 0, 
            color: '#666',
            fontSize: '14px'
          }}>
            กรอกข้อมูลรายวิชาที่เปิดสอนจากศูนย์บริการวิชาการ (เวลาคงที่)
          </p>
        </div>
      </div>

      {/* Loading Indicator */}
      {loading && allCourses.length === 0 && (
        <Card style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div>กำลังโหลดข้อมูล...</div>
        </Card>
      )}

      {/* Main Form */}
      <Card 
        style={{ 
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          borderRadius: '8px'
        }}
      >
        <Form
          form={form}
          layout="vertical"
          style={{ fontFamily: 'Sarabun, sans-serif' }}
        >
          {/* Schedule Information */}
          <Card 
            size="small" 
            title={
              <span style={{ color: '#F26522', fontSize: '16px', fontWeight: 'bold' }}>
                ข้อมูลตารางสอน
              </span>
            }
            style={{ marginBottom: '24px' }}
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} md={8}>
                <Form.Item label="ชื่อตารางสอน" required>
                  <Select
                    placeholder="-- เลือกตารางสอน หรือพิมพ์ชื่อใหม่ --"
                    value={nameTable || undefined}
                    onChange={setNameTable}
                    size="large"
                    showSearch
                    allowClear
                  >
                    {nameTables.map((table) => (
                      <Option key={table} value={table}>
                        {table}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item label="ปีการศึกษา" required>
                  <Select
                    placeholder="เลือกปีการศึกษา"
                    value={year}
                    onChange={setYear}
                    size="large"
                  >
                    {Array.from({ length: 5 }, (_, i) => {
                      const yearValue = new Date().getFullYear() + 543 + i - 2;
                      return (
                        <Option key={yearValue} value={yearValue}>
                          {yearValue}
                        </Option>
                      );
                    })}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item label="ภาคเรียน" required>
                  <Select
                    placeholder="เลือกภาคเรียน"
                    value={term}
                    onChange={setTerm}
                    size="large"
                  >
                    <Option value={1}>ภาคเรียนที่ 1</Option>
                    <Option value={2}>ภาคเรียนที่ 2</Option>
                    <Option value={3}>ภาคเรียนที่ 3</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* Curriculum Selection */}
          <Card
            size="small"
            title={
              <span style={{ color: "#F26522", fontSize: "16px", fontWeight: "bold" }}>
                โครงสร้างหลักสูตร
              </span>
            }
            style={{ marginBottom: "24px" }}
          >
            <Form.Item label="เลือกหลักสูตร" required>
              <Select
                placeholder="-- กรุณาเลือกหลักสูตร --"
                value={selectedCurriculum?.ID?.toString() || undefined}
                onChange={(value) => {
                  const found = curriculums.find((c) => c.ID === Number(value));
                  setSelectedCurriculum(found || null);
                }}
                size="large"
                showSearch
                optionFilterProp="children"
              >
                {curriculums.map((c) => (
                  <Option key={c.ID} value={c.ID.toString()}>
                    {c.CurriculumName}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {/* แสดงสถานะการดึงข้อมูล */}
            {selectedCurriculum && (
              <div style={{ 
                marginTop: '16px', 
                padding: '12px', 
                backgroundColor: filteredCourses.length > 0 ? '#f0f9ff' : '#fff7e6', 
                borderRadius: '6px',
                border: `1px solid ${filteredCourses.length > 0 ? '#0ea5e9' : '#ffd666'}`,
                fontSize: '12px'
              }}>
                <strong>📊 สถานะข้อมูล:</strong><br/>
                • หลักสูตรที่เลือก: {selectedCurriculum.CurriculumName} (ID: {selectedCurriculum.ID})<br/>
                • รายวิชาทั้งหมดในระบบ: {allCourses.length} รายวิชา<br/>
                • รายวิชาที่ตรงกับหลักสูตร: {filteredCourses.length} รายวิชา<br/>
                {filteredCourses.length > 0 && (
                  <span style={{ color: '#059669' }}>✅ พร้อมเลือกรายวิชาได้</span>
                )}
                {filteredCourses.length === 0 && allCourses.length > 0 && (
                  <span style={{ color: '#dc2626' }}>❌ ไม่พบรายวิชาในหลักสูตรนี้</span>
                )}
              </div>
            )}
          </Card>

          {/* Basic Course Information */}
          <Card 
            size="small" 
            title={
              <span style={{ color: '#F26522', fontSize: '16px', fontWeight: 'bold' }}>
                ข้อมูลพื้นฐานรายวิชา
              </span>
            }
            style={{ marginBottom: '24px' }}
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Form.Item label="เลือกรายวิชา" required>
                  <Select
                    placeholder="-- เลือกรายวิชา --"
                    value={selectedCourse?.ID || undefined}
                    onChange={handleCourseSelect}
                    size="large"
                    showSearch
                    optionFilterProp="children"
                    disabled={!selectedCurriculum || filteredCourses.length === 0}
                  >
                    {filteredCourses.map((course: any) => {
                      const courseCode = course.Code || course.code || course.CourseCode || course.course_code || `ID:${course.ID}`;
                      const courseName = course.ThaiName || course.thai_name || course.CourseName || course.course_name || 'ไม่มีชื่อ';
                      const credit = course.Unit || course.unit || course.Credit || course.credit || '?';
                      
                      return (
                        <Option key={course.ID} value={course.ID}>
                          {courseCode} - {courseName} ({credit} หน่วยกิต)
                        </Option>
                      );
                    })}
                  </Select>
                  {selectedCurriculum && filteredCourses.length === 0 && (
                    <div style={{ fontSize: '12px', color: '#ff4d4f', marginTop: '4px' }}>
                      ไม่พบรายวิชาในหลักสูตรนี้ กรุณาติดต่อผู้ดูแลระบบ
                    </div>
                  )}
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="ชั้นปีที่สามารถเรียนได้" required>
                  <Select
                    placeholder="-- กรุณาเลือกชั้นปี --"
                    value={selectedAcademicYear?.ID?.toString() || undefined}
                    onChange={(value) => {
                      const found = academicYears.find((a) => a.ID === Number(value));
                      setSelectedAcademicYear(found || null);
                    }}
                    size="large"
                  >
                    {academicYears.map((a) => (
                      <Option key={a.ID} value={a.ID.toString()}>
                        {a.Level}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              <Col xs={24} md={8}>
                <Form.Item label="หมวดวิชา" required>
                  <Select
                    placeholder="-- เลือกหมวดวิชา --"
                    value={courseType || undefined}
                    onChange={setCourseType}
                    size="large"
                    disabled={selectedCourse !== null}
                    allowClear
                  >
                    {typeOfCoursesList.map((type) => (
                      <Option key={type.ID} value={type.ID.toString()}>
                        {type.TypeName}
                      </Option>
                    ))}
                  </Select>
                  {selectedCourse && !courseType && (
                    <div style={{ fontSize: '12px', color: '#ff4d4f', marginTop: '4px' }}>
                      กรุณาเลือกหมวดวิชา หรือติดต่อผู้ดูแลระบบหากข้อมูลไม่ถูกต้อง
                    </div>
                  )}
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item label="รหัสวิชา" required>
                  <Input
                    placeholder="รหัสวิชาจะถูกกรอกอัตโนมัติ"
                    value={courseCode}
                    onChange={(e) => setCourseCode(e.target.value)}
                    size="large"
                    disabled={selectedCourse !== null}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item label="หน่วยกิต" required>
                  <Select
                    placeholder="เลือกหน่วยกิต"
                    value={credit || undefined}
                    onChange={setCredit}
                    size="large"
                    disabled={selectedCourse !== null}
                  >
                    {generateNumberOptions(10)}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Form.Item label="รูปแบบชั่วโมงการสอน" required>
                  <Row gutter={[8, 8]}>
                    {[
                      { label: "บรรยาย", key: "lecture" },
                      { label: "ปฏิบัติ", key: "practice" },
                      { label: "เรียนรู้ด้วยตนเอง", key: "selfStudy" },
                    ].map(({ label, key }) => (
                      <Col xs={8} key={key}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ 
                            color: '#F26522', 
                            fontWeight: 'bold', 
                            marginBottom: '4px',
                            fontSize: '12px'
                          }}>
                            {label}
                          </div>
                          <Select
                            value={hours[key as keyof typeof hours] || undefined}
                            onChange={(value) =>
                              setHours({ ...hours, [key]: value })
                            }
                            size="large"
                            style={{ width: '100%' }}
                            disabled={selectedCourse !== null}
                            placeholder="0"
                          >
                            {generateNumberOptions(10)}
                          </Select>
                        </div>
                      </Col>
                    ))}
                  </Row>
                  {selectedCourse && (!hours.lecture || !hours.practice || !hours.selfStudy) && (
                    <div style={{ fontSize: '12px', color: '#ff4d4f', marginTop: '4px' }}>
                      กรุณากรอกจำนวนชั่วโมงให้ครบทุกประเภท (ใส่ 0 หากไม่มี)
                    </div>
                  )}
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="รายละเอียดเพิ่มเติม">
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#666',
                    backgroundColor: '#f9f9f9',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #e9ecef'
                  }}>
                    <strong>หมายเหตุ:</strong><br/>
                    • หากไม่มีชั่วโมงในประเภทใด ให้เลือก "0"<br/>
                    • ข้อมูลจากหลักสูตรอาจไม่ครบถ้วน สามารถแก้ไขได้<br/>
                    • ตรวจสอบความถูกต้องก่อนบันทึก
                  </div>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Form.Item label="ชื่อวิชา (ภาษาไทย)" required>
                  <Input
                    placeholder="ชื่อวิชาจะถูกกรอกอัตโนมัติ"
                    value={thaiName}
                    onChange={(e) => setThaiName(e.target.value)}
                    size="large"
                    disabled={selectedCourse !== null}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="ชื่อวิชา (ภาษาอังกฤษ)" required>
                  <Input
                    placeholder="ชื่อวิชาจะถูกกรอกอัตโนมัติ"
                    value={englishName}
                    onChange={(e) => setEnglishName(e.target.value)}
                    size="large"
                    disabled={selectedCourse !== null}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Form.Item label="จำนวนกลุ่มเรียนทั้งหมด" required>
                  <Input
                    type="number"
                    placeholder="กรอกจำนวนกลุ่มเรียน"
                    value={studentTotal}
                    onChange={(e) => setStudentTotal(e.target.value)}
                    size="large"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="จำนวนนักศึกษาต่อกลุ่มเรียน" required>
                  <Input
                    type="number"
                    placeholder="กรอกจำนวนนักศึกษา"
                    value={studentExpected}
                    onChange={(e) => setStudentExpected(e.target.value)}
                    size="large"
                  />
                </Form.Item>
              </Col>
            </Row>

            {/* แสดงข้อมูลเพิ่มเติมเมื่อเลือกรายวิชา */}
            {selectedCourse && (
              <div style={{ 
                marginTop: '16px', 
                padding: '16px', 
                backgroundColor: '#f0f9ff', 
                borderRadius: '8px',
                border: '1px solid #0ea5e9'
              }}>
                <div style={{ fontSize: '14px', color: '#0369a1' }}>
                  <strong>📚 ข้อมูลรายวิชาที่เลือก:</strong>
                  <div style={{ marginTop: '8px' }}>
                    • รหัสวิชา: {courseCode}<br/>
                    • ชื่อวิชา (ไทย): {thaiName}<br/>
                    • ชื่อวิชา (อังกฤษ): {englishName}<br/>
                    • หน่วยกิต: {credit}<br/>
                    • ชั่วโมง: บรรยาย {hours.lecture} ปฏิบัติ {hours.practice} เรียนรู้ด้วยตนเอง {hours.selfStudy}
                  </div>
                </div>
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#0369a1' }}>
                  <em>หมายเหตุ: ข้อมูลจากหลักสูตรจะถูกกรอกอัตโนมัติ และไม่สามารถแก้ไขได้</em>
                </div>
              </div>
            )}
          </Card>

          {/* Teacher Selection */}
          <Card
            size="small"
            title={
              <span style={{ color: "#F26522", fontSize: "16px", fontWeight: "bold" }}>
                อาจารย์ผู้สอน
              </span>
            }
            style={{ marginBottom: "24px" }}
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Form.Item label="สำนักวิชา" required>
                  <Select
                    placeholder="-- กรุณาเลือกสำนักวิชา --"
                    value={selectedDepartmentID || undefined}
                    onChange={setSelectedDepartmentID}
                    size="large"
                  >
                    {departments.map((d: any) => (
                      <Option key={d.ID} value={d.ID}>
                        {d.DepartmentName}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="สาขาวิชา" required>
                  <Select
                    placeholder="-- กรุณาเลือกสาขาวิชา --"
                    value={selectedMajorID || undefined}
                    onChange={setSelectedMajorID}
                    size="large"
                    disabled={!selectedDepartmentID}
                  >
                    {filteredMajors.map((m: any) => (
                      <Option key={m.ID} value={m.ID}>
                        {m.MajorName}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label="เลือกอาจารย์ผู้สอน" required>
              <Select
                placeholder="-- เลือกอาจารย์ผู้สอน --"
                value={selectedTeacher?.ID || undefined}
                onChange={(value) => {
                  const selected = allTeachers.find((t: any) => t.ID === Number(value));
                  setSelectedTeacher(selected || null);
                }}
                size="large"
                disabled={!selectedMajorID}
              >
                {allTeachers.map((teacher: any) => {
                  const titleStr = typeof teacher.Title === "string" 
                    ? teacher.Title 
                    : teacher.Title?.Title || "";
                  
                  return (
                    <Option key={teacher.ID} value={teacher.ID}>
                      {`${titleStr} ${teacher.Firstname} ${teacher.Lastname}`}
                    </Option>
                  );
                })}
              </Select>
            </Form.Item>
          </Card>

          {/* Class Schedule */}
          <Card 
            size="small" 
            title={
              <span style={{ color: '#F26522', fontSize: '16px', fontWeight: 'bold' }}>
                วันและเวลาที่สอน (เวลาคงที่)
              </span>
            }
            style={{ marginBottom: '24px' }}
          >
            {classTimes.map((classTime, index) => (
              <div key={classTime.id} style={{ 
                marginBottom: '24px',
                padding: '16px',
                border: '1px solid #e9ecef',
                borderRadius: '8px',
                backgroundColor: '#f8f9fa'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  marginBottom: '16px'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px' 
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      backgroundColor: '#F26522',
                      color: 'white',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold'
                    }}>
                      {index + 1}
                    </div>
                    <h4 style={{ margin: 0, color: '#333' }}>
                      ช่วงเวลาที่ {index + 1}
                    </h4>
                  </div>
                  <Button
                    type="primary"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => removeClassTime(classTime.id)}
                    size="small"
                    disabled={classTimes.length <= 1}
                  >
                    ลบ
                  </Button>
                </div>

                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12} md={6}>
                    <Form.Item label="วัน" style={{ marginBottom: '16px' }}>
                      <Select
                        placeholder="เลือกวัน"
                        value={classTime.day || undefined}
                        onChange={(value) => {
                          const updated = [...classTimes];
                          updated[index].day = value;
                          setClassTimes(updated);
                        }}
                        size="large"
                      >
                        <Option value="จันทร์">จันทร์</Option>
                        <Option value="อังคาร">อังคาร</Option>
                        <Option value="พุธ">พุธ</Option>
                        <Option value="พฤหัสบดี">พฤหัสบดี</Option>
                        <Option value="ศุกร์">ศุกร์</Option>
                        <Option value="เสาร์">เสาร์</Option>
                        <Option value="อาทิตย์">อาทิตย์</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={12} sm={6} md={4}>
                    <Form.Item label="เวลาเริ่ม" style={{ marginBottom: '16px' }}>
                      <Input
                        type="time"
                        value={classTime.start}
                        onChange={(e) => {
                          const updated = [...classTimes];
                          updated[index].start = e.target.value;
                          setClassTimes(updated);
                        }}
                        size="large"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={12} sm={6} md={4}>
                    <Form.Item label="เวลาสิ้นสุด" style={{ marginBottom: '16px' }}>
                      <Input
                        type="time"
                        value={classTime.end}
                        onChange={(e) => {
                          const updated = [...classTimes];
                          updated[index].end = e.target.value;
                          setClassTimes(updated);
                        }}
                        size="large"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={12} sm={6} md={4}>
                    <Form.Item label="กลุ่ม" style={{ marginBottom: '16px' }}>
                      <Input
                        placeholder="1"
                        value={classTime.group}
                        onChange={(e) => {
                          const updated = [...classTimes];
                          updated[index].group = e.target.value;
                          setClassTimes(updated);
                        }}
                        size="large"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={12} sm={6} md={8}>
                    <Form.Item label="ห้องเรียน" style={{ marginBottom: '16px' }}>
                      <Input
                        placeholder="DIGITAL TECH LAB"
                        value={classTime.room}
                        onChange={(e) => {
                          const updated = [...classTimes];
                          updated[index].room = e.target.value;
                          setClassTimes(updated);
                        }}
                        size="large"
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </div>
            ))}

            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={addClassTime}
              size="large"
              style={{ 
                width: '100%', 
                height: '48px',
                borderColor: '#F26522',
                color: '#F26522'
              }}
            >
              เพิ่มวันเวลาเรียน
            </Button>
          </Card>

          {/* Action Buttons */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexDirection: isMobile ? 'column' : 'row',
            gap: '16px'
          }}>
            <Button
              size="large"
              onClick={() => navigate('/all-open-course')}
              style={{ width: isMobile ? '100%' : 'auto' }}
            >
              ยกเลิก
            </Button>

            <Button
              type="primary"
              size="large"
              icon={<SaveOutlined />}
              onClick={handleSubmit}
              loading={loading}
              disabled={!validateForm()}
              style={{ 
                backgroundColor: validateForm() ? '#F26522' : undefined,
                borderColor: validateForm() ? '#F26522' : undefined,
                width: isMobile ? '100%' : 'auto'
              }}
            >
              {loading ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
            </Button>
          </div>
        </Form>
      </Card>

      {/* Help Text */}
      <Card style={{ marginTop: '16px', backgroundColor: '#f8f9fa' }}>
        <div style={{ fontSize: '12px', color: '#666' }}>
          <strong>💡 คำแนะนำ:</strong>
          <ul style={{ margin: '8px 0 0 20px', paddingLeft: 0 }}>
            <li>เลือกตารางสอนที่ต้องการเพิ่มวิชา หรือสร้างตารางใหม่</li>
            <li><strong>เลือกหลักสูตรก่อน</strong> จากนั้นเลือกรายวิชาจาก dropdown</li>
            <li>ข้อมูลรายวิชาจากหลักสูตรจะถูกกรอกอัตโนมัติ และไม่สามารถแก้ไขได้</li>
            <li>เลือกอาจารย์ผู้สอนจากสาขาวิชาที่เกี่ยวข้อง</li>
            <li>เพิ่มวันเวลาเรียนตามที่ต้องการ (สามารถมีหลายช่วงเวลาได้)</li>
            <li>ระบุกลุ่มเรียนและห้องเรียนให้ชัดเจน</li>
            <li>ตรวจสอบความถูกต้องของเวลาเรียน</li>
            <li>รายวิชาจากศูนย์บริการจะมีเวลาคงที่และจะปรากฏในตารางทันที</li>
            <li>หลังบันทึกสำเร็จ ระบบจะนำไปยังหน้าตารางสอนเพื่อตรวจสอบผลลัพธ์</li>
          </ul>
        </div>
      </Card>

      {/* Status Information */}
      {!validateForm() && (selectedCourse || nameTable) && (
        <Card style={{ marginTop: '16px', backgroundColor: '#fff2f0', borderColor: '#ff7875' }}>
          <div style={{ fontSize: '12px', color: '#cf1322' }}>
            <strong>⚠️ ข้อมูลที่ยังไม่ครบถ้วน:</strong>
            <ul style={{ margin: '8px 0 0 20px', paddingLeft: 0 }}>
              {!nameTable && <li>ชื่อตารางสอน</li>}
              {!courseType && <li>หมวดวิชา</li>}
              {!courseCode && <li>รหัสวิชา</li>}
              {!credit && <li>หน่วยกิต</li>}
              {!thaiName && <li>ชื่อวิชา (ภาษาไทย)</li>}
              {!englishName && <li>ชื่อวิชา (ภาษาอังกฤษ)</li>}
              {!hours.lecture && <li>ชั่วโมงบรรยาย</li>}
              {!hours.practice && <li>ชั่วโมงปฏิบัติ</li>}
              {!hours.selfStudy && <li>ชั่วโมงเรียนรู้ด้วยตนเอง</li>}
              {!selectedCurriculum && <li>หลักสูตร</li>}
              {!selectedAcademicYear && <li>ชั้นปีที่สามารถเรียนได้</li>}
              {!selectedTeacher && <li>อาจารย์ผู้สอน</li>}
              {classTimes.some(ct => !ct.day || !ct.start || !ct.end || !ct.group || !ct.room) && <li>วันและเวลาเรียน (ครบทุกช่อง)</li>}
            </ul>
          </div>
        </Card>
      )}

      {validateForm() && (
        <Card style={{ marginTop: '16px', backgroundColor: '#f0f9ff', borderColor: '#0ea5e9' }}>
          <div style={{ fontSize: '12px', color: '#0369a1' }}>
            <strong>✅ ข้อมูลพร้อมบันทึก:</strong>
            <ul style={{ margin: '8px 0 0 20px', paddingLeft: 0 }}>
              <li>ตารางสอน: {nameTable}</li>
              <li>รายวิชา: {courseCode} - {thaiName}</li>
              <li>อาจารย์: {selectedTeacher?.Title || ''} {selectedTeacher?.Firstname || ''} {selectedTeacher?.Lastname || ''}</li>
              <li>จำนวนช่วงเวลา: {classTimes.length} ช่วงเวลา</li>
              <li>ปีการศึกษา: {year} ภาคเรียนที่ {term}</li>
            </ul>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ManageCesCourse;