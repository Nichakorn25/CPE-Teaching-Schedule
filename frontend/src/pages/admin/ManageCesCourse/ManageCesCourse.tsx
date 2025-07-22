import React, { useState } from "react";
import { Button, Input, Select, Card, Form, Row, Col, TimePicker, message } from 'antd';
import { SaveOutlined, ArrowLeftOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from "react-router-dom";
import dayjs from 'dayjs';

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

  type Assistant = {
    id: number;
    title: string;
    firstName: string;
    lastName: string;
  };

  type ClassTime = {
    id: number;
    day: string;
    start: string;
    end: string;
    group: string;
    room: string;
  };

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
      group: "",
      room: "",
    },
  ]);

  const [loading, setLoading] = useState(false);

  const addClassTime = () => {
    setClassTimes([
      ...classTimes,
      {
        id: Date.now(),
        day: "",
        start: "",
        end: "",
        group: "",
        room: "",
      },
    ]);
  };

  const removeClassTime = (id: number) => {
    setClassTimes(classTimes.filter((c) => c.id !== id));
  };

  const validateForm = () => {
    return courseType && courseCode && credit && thaiName && englishName && 
           hours.lecture && hours.practice && hours.selfStudy &&
           studentTotal && studentExpected && classTimes.length > 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      message.warning('กรุณากรอกข้อมูลให้ครบถ้วนก่อนบันทึก');
      return;
    }

    try {
      setLoading(true);
      // TODO: Implement API call
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      message.success('บันทึกข้อมูลรายวิชาจากศูนย์บริการสำเร็จ');
      // navigate to course list or wherever appropriate
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
            จัดการรายวิชาจากศูนย์บริการ
          </h1>
          <p style={{ 
            margin: 0, 
            color: '#666',
            fontSize: '14px'
          }}>
            กรอกข้อมูลรายวิชาที่เปิดสอนจากศูนย์บริการวิชาการ
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
                <Form.Item label="หมวดวิชา" required>
                  <Select
                    placeholder="-- เลือกหมวดวิชา --"
                    value={courseType || undefined}
                    onChange={setCourseType}
                    size="large"
                  >
                    <Option value="หมวดวิชาศึกษาทั่วไป">หมวดวิชาศึกษาทั่วไป</Option>
                    <Option value="หมวดวิชาเฉพาะ">หมวดวิชาเฉพาะ</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="รหัสวิชา" required>
                  <Input
                    placeholder="กรอกรหัสวิชา"
                    value={courseCode}
                    onChange={(e) => setCourseCode(e.target.value)}
                    size="large"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Form.Item label="หน่วยกิต" required>
                  <Select
                    placeholder="เลือกหน่วยกิต"
                    value={credit || undefined}
                    onChange={setCredit}
                    size="large"
                  >
                    <Option value="1">1</Option>
                    <Option value="2">2</Option>
                    <Option value="3">3</Option>
                    <Option value="4">4</Option>
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
                            <Option value="">--</Option>
                            <Option value="1">1</Option>
                            <Option value="2">2</Option>
                            <Option value="3">3</Option>
                            <Option value="4">4</Option>
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
                <Form.Item label="ชื่อวิชา (ภาษาไทย)" required>
                  <Input
                    placeholder="กรอกชื่อวิชาภาษาไทย"
                    value={thaiName}
                    onChange={(e) => setThaiName(e.target.value)}
                    size="large"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="ชื่อวิชา (ภาษาอังกฤษ)" required>
                  <Input
                    placeholder="กรอกชื่อวิชาภาษาอังกฤษ"
                    value={englishName}
                    onChange={(e) => setEnglishName(e.target.value)}
                    size="large"
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
          </Card>

          {/* Class Schedule */}
          <Card 
            size="small" 
            title={
              <span style={{ color: '#F26522', fontSize: '16px', fontWeight: 'bold' }}>
                วันและเวลาที่สอน
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
              onClick={() => navigate('/open-course')}
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
            <li>กรอกข้อมูลพื้นฐานของรายวิชาให้ครบถ้วน</li>
            <li>เพิ่มวันเวลาเรียนตามที่ต้องการ</li>
            <li>ระบุกลุ่มเรียนและห้องเรียนให้ชัดเจน</li>
            <li>ตรวจสอบความถูกต้องของเวลาเรียน</li>
            <li>รายวิชาจากศูนย์บริการมีการจัดตารางแยกต่างหาก</li>
          </ul>
        </div>
      </Card>
    </div>
  );
};

export default ManageCesCourse;