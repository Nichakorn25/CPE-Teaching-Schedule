import React, { useState } from "react";
import Sidebar from "../../../components/schedule-sidebar/Sidebar";
import Header from "../../../components/header/Header";
import "./AddCoursepage.css";
import { Button, Input, Select, Card, Form, InputNumber, message } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';

const { Option } = Select;

interface Assistant {
  id: number;
  prefix: string;
  name: string;
}

interface CourseHours {
  lecture: string;
  practice: string;
  selfStudy: string;
}

const AddCoursepage: React.FC = () => {
  const [form] = Form.useForm();
  const [assistants, setAssistants] = useState<Assistant[]>([
    { id: Date.now(), prefix: "", name: "" },
  ]);
  const [hours, setHours] = useState<CourseHours>({ 
    lecture: "", 
    practice: "", 
    selfStudy: "" 
  });

  const addAssistant = () => {
    setAssistants([...assistants, { id: Date.now(), prefix: "", name: "" }]);
  };

  const removeAssistant = (id: number) => {
    if (assistants.length > 1) {
      setAssistants(assistants.filter((a) => a.id !== id));
    } else {
      message.warning('ต้องมีผู้ช่วยสอนอย่างน้อย 1 คน');
    }
  };

  const updateAssistant = (
    id: number,
    field: "prefix" | "name",
    value: string
  ) => {
    setAssistants(
      assistants.map((a) => (a.id === id ? { ...a, [field]: value } : a))
    );
  };

  const handleSubmit = (values: any) => {
    console.log("ข้อมูลรายวิชา:", values);
    console.log("ผู้ช่วยสอน:", assistants);
    console.log("ชั่วโมงการสอน:", hours);
    
    message.success('บันทึกข้อมูลรายวิชาสำเร็จ!');
  };

  const handleCancel = () => {
    form.resetFields();
    setAssistants([{ id: Date.now(), prefix: "", name: "" }]);
    setHours({ lecture: "", practice: "", selfStudy: "" });
    message.info('ยกเลิกการเพิ่มรายวิชา');
  };

  return (
    <div className="p-6 font-sarabun mt-16">
      <Header />
      
      {/* Background Layer */}
      <div className="addcourse-background" />
      
      {/* Sidebar */}
      <div className="addcourse-sidebar">
        <Sidebar />
      </div>
      
      {/* Main Content */}
      <div className="addcourse-main-content">        
        {/* White Content Area */}
        <div className="addcourse-content-area">
          {/* Page Title */}
          <div style={{ 
            marginBottom: '24px',
            paddingBottom: '16px',
            borderBottom: '2px solid #F26522'
          }}>
            <h2 style={{ 
              margin: 0, 
              color: '#333',
              fontSize: '24px',
              fontWeight: 'bold'
            }}>
              เพิ่มรายวิชาใหม่
            </h2>
            <p style={{ 
              margin: '8px 0 0 0', 
              color: '#666',
              fontSize: '14px'
            }}>
              กรอกข้อมูลรายวิชาที่ต้องการเพิ่มเข้าสู่ระบบ
            </p>
          </div>

          {/* Form Content */}
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            style={{ width: '100%' }}
          >
            {/* ข้อมูลพื้นฐาน */}
            <Card 
              title="ข้อมูลพื้นฐานรายวิชา" 
              style={{ marginBottom: '24px' }}
              headStyle={{ backgroundColor: '#f8f9fa', fontWeight: 'bold' }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                <Form.Item
                  label={<span style={{ color: '#F26522', fontWeight: 'bold' }}>โครงสร้างหลักสูตร</span>}
                  name="curriculum"
                  rules={[{ required: true, message: 'กรุณาเลือกโครงสร้างหลักสูตร' }]}
                >
                  <Select placeholder="เลือกโครงสร้างหลักสูตร" size="large">
                    <Option value="107050101650">107050101650: วิศวกรรมคอมพิวเตอร์-2565</Option>
                    <Option value="107050101651">107050101651: เทคโนโลยีสารสนเทศ-2565</Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  label={<span style={{ color: '#F26522', fontWeight: 'bold' }}>รหัสวิชา</span>}
                  name="courseCode"
                  rules={[{ required: true, message: 'กรุณากรอกรหัสวิชา' }]}
                >
                  <Input placeholder="ENG2311" size="large" />
                </Form.Item>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <Form.Item
                    label={<span style={{ color: '#F26522', fontWeight: 'bold' }}>ชื่อวิชา (ภาษาไทย)</span>}
                    name="courseNameTh"
                    rules={[{ required: true, message: 'กรุณากรอกชื่อวิชาภาษาไทย' }]}
                  >
                    <Input placeholder="ระบบฐานข้อมูล" size="large" />
                  </Form.Item>

                  <Form.Item
                    label={<span style={{ color: '#F26522', fontWeight: 'bold' }}>ชื่อวิชา (ภาษาอังกฤษ)</span>}
                    name="courseNameEn"
                    rules={[{ required: true, message: 'กรุณากรอกชื่อวิชาภาษาอังกฤษ' }]}
                  >
                    <Input placeholder="Database System" size="large" />
                  </Form.Item>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <Form.Item
                    label={<span style={{ color: '#F26522', fontWeight: 'bold' }}>หน่วยกิต</span>}
                    name="credits"
                    rules={[{ required: true, message: 'กรุณากรอกจำนวนหน่วยกิต' }]}
                  >
                    <InputNumber 
                      placeholder="3" 
                      min={1} 
                      max={10} 
                      size="large" 
                      style={{ width: '100%' }}
                    />
                  </Form.Item>

                  <Form.Item
                    label={<span style={{ color: '#F26522', fontWeight: 'bold' }}>ห้องปฏิบัติการ (ถ้ามี)</span>}
                    name="labRoom"
                  >
                    <Select placeholder="เลือกห้องปฏิบัติการ" size="large">
                      <Option value="none">ไม่มีการเรียนการสอนในห้องปฏิบัติการ</Option>
                      <Option value="F11-421">F11-421 Hardware</Option>
                      <Option value="F11-422">F11-422 Software</Option>
                      <Option value="F11-423">F11-423 Network</Option>
                    </Select>
                  </Form.Item>
                </div>
              </div>
            </Card>

            {/* รูปแบบชั่วโมงการสอน */}
            <Card 
              title="รูปแบบชั่วโมงการสอน" 
              style={{ marginBottom: '24px' }}
              headStyle={{ backgroundColor: '#f8f9fa', fontWeight: 'bold' }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', textAlign: 'center' }}>
                {[
                  { label: "บรรยาย", key: "lecture" },
                  { label: "ปฏิบัติ", key: "practice" },
                  { label: "เรียนรู้ด้วยตนเอง", key: "selfStudy" },
                ].map(({ label, key }) => (
                  <div key={key}>
                    <div style={{ color: '#F26522', fontWeight: 'bold', marginBottom: '8px', fontSize: '16px' }}>
                      {label}
                    </div>
                    <Select
                      style={{ width: 80 }}
                      size="large"
                      value={hours[key as keyof typeof hours]}
                      onChange={(value) => setHours({ ...hours, [key]: value })}
                      placeholder="--"
                    >
                      <Option value="">--</Option>
                      <Option value="1">1</Option>
                      <Option value="2">2</Option>
                      <Option value="3">3</Option>
                      <Option value="4">4</Option>
                    </Select>
                  </div>
                ))}
              </div>
            </Card>

            {/* ข้อมูลการจัดการเรียนการสอน */}
            <Card 
              title="ข้อมูลการจัดการเรียนการสอน" 
              style={{ marginBottom: '24px' }}
              headStyle={{ backgroundColor: '#f8f9fa', fontWeight: 'bold' }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <Form.Item
                  label={<span style={{ color: '#F26522', fontWeight: 'bold' }}>จำนวนกลุ่มเรียน</span>}
                  name="groupCount"
                  rules={[{ required: true, message: 'กรุณากรอกจำนวนกลุ่มเรียน' }]}
                >
                  <InputNumber 
                    placeholder="1" 
                    min={1} 
                    max={50} 
                    size="large" 
                    style={{ width: '100%' }}
                  />
                </Form.Item>

                <Form.Item
                  label={<span style={{ color: '#F26522', fontWeight: 'bold' }}>นักศึกษาต่อกลุ่ม</span>}
                  name="studentsPerGroup"
                  rules={[{ required: true, message: 'กรุณากรอกจำนวนนักศึกษาต่อกลุ่ม' }]}
                >
                  <InputNumber 
                    placeholder="45" 
                    min={1} 
                    max={200} 
                    size="large" 
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </div>
            </Card>

            {/* ผู้ช่วยสอน */}
            <Card 
              title="ผู้ช่วยสอน" 
              style={{ marginBottom: '24px' }}
              headStyle={{ backgroundColor: '#f8f9fa', fontWeight: 'bold' }}
              extra={
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={addAssistant}
                  style={{ backgroundColor: '#F26522', borderColor: '#F26522' }}
                  size="small"
                >
                  เพิ่มผู้ช่วยสอน
                </Button>
              }
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {assistants.map((assistant, index) => (
                  <div key={assistant.id} style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'auto 1fr 2fr auto', 
                    gap: '12px', 
                    alignItems: 'center',
                    padding: '12px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
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
                      fontWeight: 'bold'
                    }}>
                      {index + 1}
                    </div>

                    <Select
                      placeholder="คำนำหน้า"
                      value={assistant.prefix}
                      onChange={(value) => updateAssistant(assistant.id, "prefix", value)}
                      size="large"
                    >
                      <Option value="">เลือกคำนำหน้า</Option>
                      <Option value="นาย">นาย</Option>
                      <Option value="นางสาว">นางสาว</Option>
                      <Option value="นาง">นาง</Option>
                      <Option value="อ.">อ.</Option>
                      <Option value="ผศ.">ผศ.</Option>
                      <Option value="รศ.">รศ.</Option>
                    </Select>

                    <Select
                      placeholder="เลือกชื่อ-นามสกุล"
                      value={assistant.name}
                      onChange={(value) => updateAssistant(assistant.id, "name", value)}
                      size="large"
                      showSearch
                      optionFilterProp="children"
                    >
                      <Option value="">เลือกชื่อ-นามสกุล</Option>
                      <Option value="ธนวัฒน์ สีแก้วสิ่ว">ธนวัฒน์ สีแก้วสิ่ว</Option>
                      <Option value="ภูวดล เดชารัมย์">ภูวดล เดชารัมย์</Option>
                      <Option value="สมชาย รักการสอน">สมชาย รักการสอน</Option>
                      <Option value="วิมลา เก่งการสอน">วิมลา เก่งการสอน</Option>
                      <Option value="อนันต์ มานะเรียน">อนันต์ มานะเรียน</Option>
                    </Select>

                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => removeAssistant(assistant.id)}
                      disabled={assistants.length === 1}
                      size="large"
                    >
                      ลบ
                    </Button>
                  </div>
                ))}
              </div>
            </Card>

            {/* ปุ่มบันทึก */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'flex-end', 
              gap: '12px',
              paddingTop: '16px',
              borderTop: '1px solid #e9ecef'
            }}>
              <Button 
                size="large" 
                onClick={handleCancel}
                style={{ minWidth: '100px' }}
              >
                ยกเลิก
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                style={{ 
                  backgroundColor: '#F26522', 
                  borderColor: '#F26522',
                  minWidth: '100px'
                }}
              >
                บันทึก
              </Button>
            </div>
          </Form>

          {/* Instructions */}
          <div style={{
            marginTop: '24px',
            padding: '16px',
            backgroundColor: '#f8f9fa',
            borderRadius: '6px',
            border: '1px solid #e9ecef'
          }}>
            <h4 style={{ 
              margin: '0 0 8px 0', 
              color: '#333',
              fontSize: '14px',
              fontWeight: 'bold'
            }}>
              คำแนะนำการใช้งาน:
            </h4>
            <ul style={{ 
              margin: 0, 
              paddingLeft: '20px',
              color: '#666',
              fontSize: '13px',
              lineHeight: '1.6'
            }}>
              <li>กรอกข้อมูลในช่องที่มีเครื่องหมาย * ให้ครบถ้วน</li>
              <li>รหัสวิชาต้องไม่ซ้ำกับรายวิชาที่มีอยู่แล้วในระบบ</li>
              <li>สามารถเพิ่มผู้ช่วยสอนได้หลายคน</li>
              <li>รูปแบบชั่วโมงการสอนจะถูกนำไปคำนวณหน่วยกิตรวม</li>
              <li>ข้อมูลจะถูกบันทึกและสามารถแก้ไขได้ในภายหลัง</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddCoursepage;