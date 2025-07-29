import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Input, Select, Card, Form, InputNumber, message, Row, Col } from "antd";
import { SaveOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import {
  getAllCurriculum,
  getLaboratory,
} from "../../../services/https/GetService";
import {
  getCoursebyid,
  getAllCourses,
  postCreateTimeFixedCourses,
} from "../../../services/https/AdminPageServices";
import {
  CurriculumInterface,
  AllCourseinOpenCourseInterface,
  LaboratoryInterface,
} from "../../../interfaces/Adminpage";
import { TimeFixedCoursesIn } from "../../../interfaces/TimeFix";
import { getNameTable } from "../../../services/https/SchedulerPageService";

const { Option } = Select;

const ManageCesCourse: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [containerWidth, setContainerWidth] = useState(window.innerWidth);
  
  // Monitor container width for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setContainerWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = containerWidth < 768;

  const [curriculums, setCurriculums] = useState<CurriculumInterface[]>([]);
  const [courses, setCourses] = useState<AllCourseinOpenCourseInterface[]>([]);
  const [lab, setLab] = useState<LaboratoryInterface[]>([]);
  const [selectedCurriculumID, setSelectedCurriculumID] = useState<number | null>(null);
  const [academicYear, setAcademicYear] = useState<number>(0);
  const [term, setTerm] = useState<number>(0);
  const [userID, setUserID] = useState<number>();
  const [loading, setLoading] = useState(false);
  const [nameTables, setNameTables] = useState<string[]>([]);
  const [selectedNameTable, setSelectedNameTable] = useState<string>("");

  // Form data for class schedule
  const [dayOfWeek, setDayOfWeek] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [roomFix, setRoomFix] = useState<string>("");
  const [sectionInFixed, setSectionInFixed] = useState<number>(1);

  // Load data from localStorage - same as AddCoursepage
  useEffect(() => {
    const year = localStorage.getItem("academicYear");
    const semester = localStorage.getItem("term");
    const uid = localStorage.getItem("user_id");

    if (year) setAcademicYear(parseInt(year));
    if (semester) setTerm(parseInt(semester));
    if (uid) setUserID(parseInt(uid));
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [curriculumRes, labRes, nameTableRes] = await Promise.all([
          getAllCurriculum(),
          getLaboratory(),
          getNameTable()
        ]);

        if (curriculumRes.status === 200) {
          setCurriculums(curriculumRes.data);
        }

        if (labRes.status === 200) {
          setLab(labRes.data);
        }

        if (nameTableRes.status === 200) {
          setNameTables(nameTableRes.data.name_tables || []);
          // Set default NameTable if available
          if (nameTableRes.data.name_tables && nameTableRes.data.name_tables.length > 0) {
            setSelectedNameTable(nameTableRes.data.name_tables[0]);
          }
        }
      } catch (error) {
        message.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (id) {
      const fetchExistingCourse = async () => {
        try {
          const res = await getCoursebyid(Number(id));
          if (res.status === 200) {
            const course = res.data;
            form.setFieldsValue({
              curriculum: course.CurriculumID,
              courseCode: course.ID,
              courseNameTh: course.ThaiName,
              courseNameEn: course.EnglishName,
              labRoom: course.Laboratory?.ID || null,
              groupCount: course.Section || 1,
              studentsPerGroup: course.Capacity || 0,
            });

            await handleCurriculumChange(course.CurriculumID);
          }
        } catch (error) {
          message.error('ไม่สามารถโหลดข้อมูลรายวิชาได้');
          navigate("/all-open-course");
        }
      };
      fetchExistingCourse();
    }
  }, [id, form, navigate]);

  const handleCurriculumChange = async (value: number) => {
    setSelectedCurriculumID(value);
    try {
      const response = await getAllCourses();
      if (response.status === 200) {
        const filtered = response.data.filter(
          (course: AllCourseinOpenCourseInterface) =>
            course.CurriculumID === value
        );
        setCourses(filtered);
      }
    } catch (error) {
      message.error('เกิดข้อผิดพลาดในการโหลดรายวิชา');
    }
  };

  const handleCourseCodeChange = async (courseId: number) => {
    const selectedCourse = courses.find((course) => course.ID === courseId);
    if (selectedCourse) {
      try {
        const response = await getCoursebyid(courseId);
        if (response.status === 200) {
          const course = response.data;
          form.setFieldsValue({
            courseCode: selectedCourse.ID,
            courseNameTh: course.ThaiName,
            courseNameEn: course.EnglishName,
            labRoom: course.Laboratory?.ID || null,
          });
        }
      } catch (error) {
        message.error('เกิดข้อผิดพลาดในการโหลดรายละเอียดรายวิชา');
      }
    }
  };

  const validateForm = () => {
    const values = form.getFieldsValue();
    const requiredFields = ['curriculum', 'courseCode', 'courseNameTh', 'courseNameEn', 'groupCount', 'studentsPerGroup'];
    
    for (const field of requiredFields) {
      if (!values[field]) {
        return false;
      }
    }

    // Validate class schedule fields
    if (!selectedNameTable || !dayOfWeek || !startTime || !endTime || !roomFix) {
      return false;
    }

    return true;
  };

  const handleSubmit = async (values: any) => {
    if (!validateForm()) {
      message.warning('กรุณากรอกข้อมูลให้ครบถ้วนก่อนบันทึก');
      return;
    }

    const selectedCourse = courses.find((c) => c.ID === values.courseCode);
    if (!selectedCourse || selectedCourse.ID === undefined) {
      message.error('ไม่พบข้อมูลรายวิชา กรุณาเลือกรายวิชาอีกครั้ง');
      return;
    }

    // สร้าง payload ตาม interface TimeFixedCoursesIn
    // ใช้ NameTable ที่เลือกจาก dropdown
    const payload: TimeFixedCoursesIn = {
      Year: academicYear,
      Term: term,
      Section: values.groupCount,
      Capacity: values.studentsPerGroup,
      UserID: userID!,
      AllCoursesID: selectedCourse.ID,
      LaboratoryID: values.labRoom || null,
      SectionInFixed: sectionInFixed,
      DayOfWeek: dayOfWeek,
      StartTime: startTime,
      EndTime: endTime,
      RoomFix: roomFix,
      NameTable: selectedNameTable, // ใช้ NameTable ที่เลือก
    };

    try {
      setLoading(true);
      const res = await postCreateTimeFixedCourses(payload);

      if (res.status === 200 || res.status === 201) {
        message.success(
          `เพิ่มวิชา ${selectedCourse.CourseName} เป็นรายวิชาจากศูนย์บริการในเทอม ${term} ปีการศึกษา ${academicYear} เรียบร้อยแล้ว`
        );
        navigate("/all-open-course");
      } else {
        message.error(res?.data?.error || 'ไม่สามารถบันทึกข้อมูลได้');
      }
    } catch (error) {
      message.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setLoading(false);
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
            เพิ่มรายวิชาจากศูนย์บริการ
          </h1>
          <p style={{ 
            margin: 0, 
            color: '#666',
            fontSize: '14px'
          }}>
            กรอกข้อมูลรายวิชาที่เปิดสอนจากศูนย์บริการวิชาการ (มีเวลาเรียนคงที่)
          </p>
        </div>
      </div>

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
          onFinish={handleSubmit}
        >
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
              <Col xs={24}>
                <Form.Item
                  label="โครงสร้างหลักสูตร"
                  name="curriculum"
                  rules={[{ required: true, message: "กรุณาเลือกโครงสร้างหลักสูตร" }]}
                >
                  <Select
                    placeholder="เลือกโครงสร้างหลักสูตร"
                    size="large"
                    onChange={handleCurriculumChange}
                    allowClear
                  >
                    {curriculums.map((c) => (
                      <Option key={c.ID} value={c.ID}>
                        {c.CurriculumName}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              <Col xs={24}>
                <Form.Item
                  label="รหัสวิชา"
                  name="courseCode"
                  rules={[{ required: true, message: "กรุณาเลือกรหัสวิชา" }]}
                >
                  <Select
                    placeholder="เลือกรหัสวิชาตามหลักสูตร"
                    size="large"
                    onChange={handleCourseCodeChange}
                    showSearch
                    optionFilterProp="children"
                    allowClear
                    disabled={!selectedCurriculumID}
                  >
                    {courses.map((c) => (
                      <Option key={c.ID} value={c.ID}>
                        {c.CourseCode} - {c.CourseName}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="ชื่อวิชา (ภาษาไทย)"
                  name="courseNameTh"
                  rules={[{ required: true, message: "กรุณากรอกชื่อวิชาภาษาไทย" }]}
                >
                  <Input placeholder="ระบบฐานข้อมูล" size="large" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label="ชื่อวิชา (ภาษาอังกฤษ)"
                  name="courseNameEn"
                  rules={[{ required: true, message: "กรุณากรอกชื่อวิชาภาษาอังกฤษ" }]}
                >
                  <Input placeholder="Database System" size="large" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              <Col xs={24}>
                <Form.Item
                  label="ชื่อตารางเรียน"
                  required
                >
                  <Select
                    placeholder="เลือกชื่อตารางเรียน"
                    value={selectedNameTable || undefined}
                    onChange={setSelectedNameTable}
                    size="large"
                    allowClear
                  >
                    {nameTables.map((nameTable, index) => (
                      <Option key={index} value={nameTable}>
                        {nameTable}
                      </Option>
                    ))}
                  </Select>
                  {nameTables.length === 0 && (
                    <div style={{ 
                      marginTop: '8px', 
                      color: '#ff4d4f', 
                      fontSize: '12px' 
                    }}>
                      ⚠️ ไม่พบตารางเรียนในระบบ กรุณาสร้างตารางเรียนก่อน
                    </div>
                  )}
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="จำนวนกลุ่มเรียน"
                  name="groupCount"
                  rules={[{ required: true, message: "กรุณากรอกจำนวนกลุ่มเรียน" }]}
                >
                  <InputNumber
                    placeholder="1"
                    min={1}
                    max={50}
                    size="large"
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label="นักศึกษาต่อกลุ่ม"
                  name="studentsPerGroup"
                  rules={[{ required: true, message: "กรุณากรอกจำนวนนักศึกษาต่อกลุ่ม" }]}
                >
                  <InputNumber
                    placeholder="30"
                    min={1}
                    max={200}
                    size="large"
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              <Col xs={24}>
                <Form.Item
                  label="ห้องปฏิบัติการ (ถ้ามี)"
                  name="labRoom"
                >
                  <Select placeholder="เลือกห้องปฏิบัติการ" size="large" allowClear>
                    {lab.map((l) => (
                      <Option key={l.ID} value={l.ID}>
                        {l.Room} - {l.Building}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* Class Schedule Information */}
          <Card 
            size="small" 
            title={
              <span style={{ color: '#F26522', fontSize: '16px', fontWeight: 'bold' }}>
                กำหนดเวลาเรียน (สำหรับวิชาจากศูนย์บริการ)
              </span>
            }
            style={{ marginBottom: '24px' }}
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} md={8}>
                <Form.Item
                  label="วันที่เรียน"
                  required
                >
                  <Select
                    placeholder="เลือกวันที่เรียน"
                    value={dayOfWeek || undefined}
                    onChange={setDayOfWeek}
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
              <Col xs={12} md={4}>
                <Form.Item
                  label="เวลาเริ่ม"
                  required
                >
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    size="large"
                  />
                </Form.Item>
              </Col>
              <Col xs={12} md={4}>
                <Form.Item
                  label="เวลาสิ้นสุด"
                  required
                >
                  <Input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    size="large"
                  />
                </Form.Item>
              </Col>
              <Col xs={12} md={4}>
                <Form.Item
                  label="กลุ่มที่"
                  required
                >
                  <InputNumber
                    placeholder="1"
                    min={1}
                    max={50}
                    value={sectionInFixed}
                    onChange={(value) => setSectionInFixed(value || 1)}
                    size="large"
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Col>
              <Col xs={12} md={4}>
                <Form.Item
                  label="ห้องเรียน"
                  required
                >
                  <Input
                    placeholder="Lecture A"
                    value={roomFix}
                    onChange={(e) => setRoomFix(e.target.value)}
                    size="large"
                  />
                </Form.Item>
              </Col>
            </Row>

            <div style={{
              padding: '12px',
              backgroundColor: '#e6f7ff',
              borderRadius: '6px',
              border: '1px solid #91d5ff',
              fontSize: '13px',
              color: '#0958d9'
            }}>
              <strong>💡 หมายเหตุ:</strong> วิชาจากศูนย์บริการจะถูกเพิ่มเข้าในตารางเรียนที่เลือก 
              และจะมีเวลาเรียนคงที่ที่ไม่สามารถปรับเปลี่ยนผ่านระบบจัดตารางอัตโนมัติได้
            </div>
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
              onClick={() => form.submit()}
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
          <strong>💡 คำแนะนำการใช้งาน:</strong>
          <ul style={{ margin: '8px 0 0 20px', paddingLeft: 0 }}>
            <li>เลือกชื่อตารางเรียนที่ต้องการเพิ่มวิชาเข้าไป</li>
            <li>เลือกหลักสูตรก่อนเพื่อแสดงรายวิชาที่เกี่ยวข้อง</li>
            <li>รายวิชาจากศูนย์บริการจะมีการกำหนดเวลาเรียนคงที่</li>
            <li>ระบุวัน เวลา และห้องเรียนให้ชัดเจน</li>
            <li>ห้องปฏิบัติการเป็นข้อมูลเสริม ไม่จำเป็นต้องระบุ</li>
            <li>วิชาจากศูนย์บริการจะไม่สามารถเปลี่ยนเวลาเรียนได้ภายหลัง</li>
          </ul>
        </div>
      </Card>
    </div>
  );
};

export default ManageCesCourse;