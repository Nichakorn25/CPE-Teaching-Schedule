import React, { useState, useEffect } from "react";
import {
  postCreateCourse,
  getTypeofCourse,
  getTeachers,
  getCoursebyid,
  putUpdateCourse,
} from "../../../services/https/AdminPageServices";
import {
  getAllAcademicYears,
  getAllCurriculum,
  getMajorOfDepathment,
} from "../../../services/https/GetService";
import {
  CurriculumInterface,
  AcademicYearInterface,
  CreateCourseInteface,
  MajorInterface,
  DepartmentInterface,
  AllTeacher,
  CourseType,
} from "../../../interfaces/Adminpage";
import Swal from "sweetalert2";
import { useParams, useNavigate } from "react-router-dom";
import { Button, Input, Select, Card, Form, Row, Col, Divider, message } from 'antd';
import { SaveOutlined, PlusOutlined, DeleteOutlined, ArrowLeftOutlined } from '@ant-design/icons';

const { Option } = Select;

const ManageCourse: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form] = Form.useForm();
  
  const [majors, setMajors] = useState<MajorInterface[]>([]);
  const [departments, setDepartments] = useState<DepartmentInterface[]>([]);
  const [selectedDepartmentID, setSelectedDepartmentID] = useState<number>(0);
  const [filteredMajors, setFilteredMajors] = useState<MajorInterface[]>([]);
  const [selectedMajorName, setSelectedMajorName] = useState("");
  const [selectedMajorID, setSelectedMajorID] = useState<number>(0);
  const [allTeachers, setAllTeachers] = useState<AllTeacher[]>([]);
  const [teacherOptions, setTeacherOptions] = useState<AllTeacher[]>([]);
  const [teachers, setTeachers] = useState<AllTeacher[]>([]);
  const [curriculums, setCurriculums] = useState<CurriculumInterface[]>([]);
  const [selectedCurriculum, setSelectedCurriculum] = useState<CurriculumInterface | null>(null);
  const [academicYears, setAcademicYears] = useState<AcademicYearInterface[]>([]);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<AcademicYearInterface | null>(null);
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
  const [typeOfCoursesList, setTypeOfCoursesList] = useState<CourseType[]>([]);
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

  const isMobile = containerWidth < 768;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const curriculum = await getAllCurriculum();
        const years = await getAllAcademicYears();
        setCurriculums(curriculum.data);
        setAcademicYears(years.data);
      } catch (error) {
        message.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const result = await getTypeofCourse();
        setTypeOfCoursesList(result.data);
      } catch (error) {
        message.error('เกิดข้อผิดพลาดในการโหลดข้อมูลประเภทรายวิชา');
      }
    };
    fetchTypes();
  }, []);

  useEffect(() => {
    const fetchMajors = async () => {
      try {
        const res = await getMajorOfDepathment();
        if (res.status === 200 && Array.isArray(res.data)) {
          const majorData = res.data as MajorInterface[];
          setMajors(majorData);

          const uniqueDepartments = Array.from(
            new Map(majorData.map((m) => [m.Department.ID, m.Department])).values()
          );
          setDepartments(uniqueDepartments);
        }
      } catch (error) {
        message.error('เกิดข้อผิดพลาดในการโหลดข้อมูลสาขาวิชา');
      }
    };
    fetchMajors();
  }, []);

  useEffect(() => {
    const filtered = majors.filter((m) => m.Department.ID === selectedDepartmentID);
    setFilteredMajors(filtered);
    setSelectedMajorID(0);
  }, [selectedDepartmentID, majors]);

  useEffect(() => {
    const fetchTeachers = async () => {
      if (selectedMajorID === 0) {
        setAllTeachers([]);
        setTeacherOptions([]);
        return;
      }

      try {
        const res = await getTeachers();
        if (res.status === 200) {
          const all = res.data;
          const filtered = all.filter((teacher) => teacher.MajorID === selectedMajorID);
          setAllTeachers(filtered);
          setTeacherOptions(filtered);
        }
      } catch (error) {
        message.error('เกิดข้อผิดพลาดในการโหลดข้อมูลอาจารย์');
      }
    };

    fetchTeachers();
  }, [selectedMajorID]);

  const addTeacher = () => {
    setTeachers([
      ...teachers,
      {
        ID: 0,
        DeleteID: 0,
        Title: "",
        Firstname: "",
        Lastname: "",
        Email: "",
        EmpId: "",
        Department: "",
        Major: "",
        Position: "",
        Status: "",
        Role: "",
      },
    ]);
  };

  const removeTeacher = (index: number) => {
    setTeachers(teachers.filter((_, i) => i !== index));
  };

  const isFormValid = () => {
    if (id) return true;
    return (
      courseType &&
      courseCode &&
      credit &&
      thaiName &&
      englishName &&
      hours.lecture &&
      hours.practice &&
      hours.selfStudy &&
      teachers.length > 0 &&
      teachers.every((t) => t.ID)
    );
  };

  useEffect(() => {
    const fetchCourseData = async () => {
      if (!id) return;
      
      try {
        const res = await getCoursebyid(Number(id));
        if (res.status === 200 && res.data) {
          const data = res.data;

          setCourseCode(data.Code || "");
          setThaiName(data.ThaiName || "");
          setEnglishName(data.EnglishName || "");
          setCredit(data.Credit.Unit ? data.Credit.Unit.toString() : "");
          setCourseType(data.TypeOfCoursesID ? data.TypeOfCoursesID.toString() : "");
          setHours({
            lecture: data.Credit.Lecture ? data.Credit.Lecture.toString() : "",
            practice: data.Credit.Lab ? data.Credit.Lab.toString() : "",
            selfStudy: data.Credit.Self ? data.Credit.Self.toString() : "",
          });

          const foundCurriculum = curriculums.find((c) => c.ID === data.CurriculumID);
          if (foundCurriculum) setSelectedCurriculum(foundCurriculum);

          const foundAcademicYear = academicYears.find((a) => a.ID === data.AcademicYearID);
          if (foundAcademicYear) setSelectedAcademicYear(foundAcademicYear);

          const foundMajor = majors.find((m) => m.ID === data.Curriculum?.Major?.ID);
          if (foundMajor) {
            setSelectedDepartmentID(foundMajor.Department.ID);
            setSelectedMajorID(foundMajor.ID);
            setSelectedMajorName(foundMajor.MajorName);
          }

          if (data.UserAllCourses && Array.isArray(data.UserAllCourses)) {
            const fullTeacherObjects = data.UserAllCourses.map((item) => item.User).filter((user) => !!user);
            setTeachers(fullTeacherObjects);
          }
        }
      } catch (error) {
        message.error('เกิดข้อผิดพลาดในการโหลดข้อมูลรายวิชา');
      }
    };

    if (majors.length > 0 && curriculums.length > 0 && academicYears.length > 0) {
      fetchCourseData();
    }
  }, [id, majors, curriculums, academicYears]);

  const handleSubmit = async () => {
    if (!selectedCurriculum || !selectedAcademicYear) {
      message.error('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    const data: CreateCourseInteface = {
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
      UserIDs: teachers.map((t) => t.ID).filter((id) => id && id !== 0),
    };

    try {
      setLoading(true);
      let response;
      if (id) {
        response = await putUpdateCourse(Number(id), data);
      } else {
        response = await postCreateCourse(data);
      }

      if (response.status === 200) {
        message.success(id ? "แก้ไขรายวิชาเรียบร้อย" : "เพิ่มรายวิชาเรียบร้อย");
        navigate("/all-course");
      }
    } catch (error: any) {
      message.error(error?.response?.data?.message || "ไม่สามารถดำเนินการได้");
      console.error("Error submitting course", error);
    } finally {
      setLoading(false);
    }
  };

  // Generate number options
  const generateNumberOptions = (max: number) => {
    return Array.from({ length: max + 1 }, (_, i) => (
      <Option key={i} value={i.toString()}>{i}</Option>
    ));
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
            {id ? 'แก้ไขรายวิชา' : 'เพิ่มรายวิชาใหม่'}
          </h1>
          <p style={{ 
            margin: 0, 
            color: '#666',
            fontSize: '14px'
          }}>
            {id ? 'แก้ไขข้อมูลรายวิชา' : 'กรอกข้อมูลรายวิชาใหม่ที่ต้องการเพิ่ม'}
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
        >
          {/* Curriculum Selection */}
          <Card 
            size="small" 
            title={
              <span style={{ color: '#F26522', fontSize: '16px', fontWeight: 'bold' }}>
                โครงสร้างหลักสูตร
              </span>
            }
            style={{ marginBottom: '24px' }}
          >
            <Form.Item
              label="เลือกหลักสูตร"
              required
            >
              <Select
                placeholder="-- กรุณาเลือกหลักสูตร --"
                value={selectedCurriculum?.ID?.toString() || undefined}
                onChange={(value) => {
                  const found = curriculums.find((c) => c.ID === Number(value));
                  if (found) setSelectedCurriculum(found);
                }}
                size="large"
                style={{ fontFamily: 'Sarabun, sans-serif' }}
              >
                {curriculums.map((c) => (
                  <Option key={c.ID} value={c.ID.toString()}>
                    {c.CurriculumName}
                  </Option>
                ))}
              </Select>
            </Form.Item>
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
              <Col xs={24} md={8}>
                <Form.Item
                  label="หมวดวิชา"
                  required
                >
                  <Select
                    placeholder="-- กรุณาเลือกหมวดวิชา --"
                    value={courseType || undefined}
                    onChange={setCourseType}
                    size="large"
                  >
                    {typeOfCoursesList.map((type) => (
                      <Option key={type.ID} value={type.ID.toString()}>
                        {type.TypeName}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item
                  label="รหัสวิชา"
                  required
                >
                  <Input
                    placeholder="กรอกรหัสวิชา"
                    value={courseCode}
                    onChange={(e) => setCourseCode(e.target.value)}
                    size="large"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item
                  label="ชั้นปีที่สามารถเรียนได้"
                  required
                >
                  <Select
                    placeholder="-- กรุณาเลือกชั้นปี --"
                    value={selectedAcademicYear?.ID?.toString() || undefined}
                    onChange={(value) => {
                      const found = academicYears.find((a) => a.ID === Number(value));
                      if (found) setSelectedAcademicYear(found);
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
              <Col xs={24} md={12}>
                <Form.Item
                  label="หน่วยกิต"
                  required
                >
                  <Select
                    placeholder="เลือกหน่วยกิต"
                    value={credit || undefined}
                    onChange={setCredit}
                    size="large"
                  >
                    {generateNumberOptions(10)}
                  </Select>
                </Form.Item>
              </Col>
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
                          >
                            {generateNumberOptions(10)}
                          </Select>
                        </div>
                      </Col>
                    ))}
                  </Row>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="ชื่อวิชา (ภาษาไทย)"
                  required
                >
                  <Input
                    placeholder="กรอกชื่อวิชาภาษาไทย"
                    value={thaiName}
                    onChange={(e) => setThaiName(e.target.value)}
                    size="large"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label="ชื่อวิชา (ภาษาอังกฤษ)"
                  required
                >
                  <Input
                    placeholder="กรอกชื่อวิชาภาษาอังกฤษ"
                    value={englishName}
                    onChange={(e) => setEnglishName(e.target.value)}
                    size="large"
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* Department and Major */}
          <Card 
            size="small" 
            title={
              <span style={{ color: '#F26522', fontSize: '16px', fontWeight: 'bold' }}>
                สังกัดหน่วยงาน
              </span>
            }
            style={{ marginBottom: '24px' }}
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="สำนักวิชา"
                  required
                >
                  <Select
                    placeholder="-- กรุณาเลือกสำนักวิชา --"
                    value={selectedDepartmentID || undefined}
                    onChange={setSelectedDepartmentID}
                    size="large"
                  >
                    {departments.map((d) => (
                      <Option key={d.ID} value={d.ID}>
                        {d.DepartmentName}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label="สาขาวิชา"
                  required
                >
                  <Select
                    placeholder="-- กรุณาเลือกสาขาวิชา --"
                    value={selectedMajorID || undefined}
                    onChange={setSelectedMajorID}
                    size="large"
                    disabled={!selectedDepartmentID}
                  >
                    {filteredMajors.map((m) => (
                      <Option key={m.ID} value={m.ID}>
                        {m.MajorName}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* Teachers */}
          <Card 
            size="small" 
            title={
              <span style={{ color: '#F26522', fontSize: '16px', fontWeight: 'bold' }}>
                อาจารย์ผู้สอน
              </span>
            }
            style={{ marginBottom: '24px' }}
          >
            <div style={{ marginBottom: '16px' }}>
              {teachers.map((t, index) => (
                <div key={index} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px', 
                  marginBottom: '12px',
                  padding: '12px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '6px',
                  border: '1px solid #e9ecef'
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
                    fontWeight: 'bold',
                    fontSize: '14px',
                    flexShrink: 0
                  }}>
                    {index + 1}
                  </div>

                  <div style={{ flex: 1 }}>
                    <Select
                      placeholder="-- เลือกอาจารย์ --"
                      value={t.ID || undefined}
                      onChange={(value) => {
                        const selectedId = Number(value);
                        const selected = teacherOptions.find((opt) => opt.ID === selectedId);
                        if (!selected) return;

                        const updatedTeachers = [...teachers];
                        updatedTeachers[index] = selected;
                        setTeachers(updatedTeachers);
                      }}
                      size="large"
                      style={{ width: '100%' }}
                      disabled={!selectedMajorID}
                    >
                      {teacherOptions.map((teacher) => {
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
                  </div>

                  <Button
                    type="primary"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => removeTeacher(index)}
                    size="large"
                  >
                    ลบ
                  </Button>
                </div>
              ))}

              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={addTeacher}
                size="large"
                style={{ 
                  width: '100%',
                  height: '48px',
                  borderColor: '#F26522',
                  color: '#F26522'
                }}
                disabled={!selectedMajorID}
              >
                เพิ่มอาจารย์ผู้สอน
              </Button>
            </div>
            
            {!selectedMajorID && (
              <div style={{
                padding: '12px',
                backgroundColor: '#fff3cd',
                borderRadius: '6px',
                border: '1px solid #ffeaa7',
                color: '#856404',
                fontSize: '13px',
                textAlign: 'center'
              }}>
                💡 กรุณาเลือกสาขาวิชาก่อนเพื่อแสดงรายชื่ออาจารย์
              </div>
            )}
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
              onClick={() => navigate('/all-course')}
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
              disabled={!isFormValid()}
              style={{ 
                backgroundColor: isFormValid() ? '#F26522' : undefined,
                borderColor: isFormValid() ? '#F26522' : undefined,
                width: isMobile ? '100%' : 'auto'
              }}
            >
              {loading ? 'กำลังบันทึก...' : (id ? 'บันทึกการแก้ไข' : 'เพิ่มรายวิชา')}
            </Button>
          </div>
        </Form>
      </Card>

      {/* Help Text */}
      <Card style={{ marginTop: '16px', backgroundColor: '#f8f9fa' }}>
        <div style={{ fontSize: '12px', color: '#666' }}>
          <strong>💡 คำแนะนำ:</strong>
          <ul style={{ margin: '8px 0 0 20px', paddingLeft: 0 }}>
            <li>กรอกข้อมูลให้ครบถ้วนก่อนบันทึก</li>
            <li>รหัสวิชาควรใช้รูปแบบที่กำหนดโดยหลักสูตร</li>
            <li>จำนวนชั่วโมงรวม (บรรยาย + ปฏิบัติ + เรียนรู้ด้วยตนเอง) ควรสอดคล้องกับหน่วยกิต</li>
            <li>ต้องมีอาจารย์ผู้สอนอย่างน้อย 1 คน</li>
          </ul>
        </div>
      </Card>
    </div>
  );
};

export default ManageCourse;