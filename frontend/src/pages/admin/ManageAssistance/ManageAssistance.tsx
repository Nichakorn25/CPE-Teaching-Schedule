import React, { useState, useEffect } from "react";
import { getAllTitle } from "../../../services/https/GetService";
import {
  TitleInterface,
  TeachingAssistantInterface,
} from "../../../interfaces/TeachingAssistant";
import { 
  postCreateTeachingAssistant,
  putUpdateTeachingAssistant,
  getTeachingAssistantsById 
} from "../../../services/https/AdminPageServices";
import Swal from "sweetalert2";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Input, Select, Card, Form, Row, Col, message } from 'antd';
import { SaveOutlined, ArrowLeftOutlined, UserOutlined } from '@ant-design/icons';

const { Option } = Select;

const ManageAssistance: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [form] = Form.useForm();
  
  const [title, setTitle] = useState<TitleInterface[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
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

  const [formData, setFormData] = useState<TeachingAssistantInterface>({
    ID: 0,
    Firstname: "",
    Lastname: "",
    Email: "",
    PhoneNumber: "",
    TitleID: 0,
    Title: {
      ID: 0,
      Title: "",
      TeachingAssistants: [],
    },
    ScheduleTeachingAssistant: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // โหลดข้อมูล titles
        const titleResponse = await getAllTitle();
        if (titleResponse.status === 200 && Array.isArray(titleResponse.data)) {
          setTitle(titleResponse.data);
        }

        // ถ้ามี id ให้โหลดข้อมูลผู้ช่วยสอนสำหรับแก้ไข
        if (id) {
          setIsEditMode(true);
          const assistantResponse = await getTeachingAssistantsById(id);
          if (assistantResponse.status === 200) {
            const assistantData = assistantResponse.data;
            const data = {
              ID: assistantData.ID,
              Firstname: assistantData.Firstname || "",
              Lastname: assistantData.Lastname || "",
              Email: assistantData.Email || "",
              PhoneNumber: assistantData.PhoneNumber || "",
              TitleID: assistantData.TitleID || 0,
              Title: assistantData.Title,
              ScheduleTeachingAssistant: assistantData.ScheduleTeachingAssistant || [],
            };
            
            setFormData(data);
            form.setFieldsValue(data);
            
            if (assistantData.ProfileImage) {
              setImagePreview(assistantData.ProfileImage);
            }
          } else {
            message.error('ไม่สามารถโหลดข้อมูลผู้ช่วยสอนได้');
            navigate("/assistance-list");
          }
        }
      } catch (error) {
        message.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
      }
    };
    fetchData();
  }, [id, navigate, form]);

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    return formData.Firstname && formData.Lastname && formData.Email && 
           formData.PhoneNumber && formData.TitleID !== 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      message.warning('กรุณากรอกข้อมูลให้ครบทุกช่องก่อนบันทึก');
      return;
    }

    const selectedTitle = title.find((t) => t.ID === formData.TitleID)?.Title || "";
    const fullname = `${formData.Firstname} ${formData.Lastname}`;

    try {
      setLoading(true);
      let res;
      
      if (isEditMode && formData.ID) {
        res = await putUpdateTeachingAssistant(formData.ID, formData);
      } else {
        res = await postCreateTeachingAssistant(formData);
      }

      if (res.status === 201 || res.status === 200) {
        message.success(`${isEditMode ? 'แก้ไข' : 'บันทึก'}ข้อมูล ${selectedTitle} ${fullname} เรียบร้อยแล้ว`);
        navigate("/assistance-list");
      } else {
        message.error(res?.data?.error || `ไม่สามารถ${isEditMode ? 'แก้ไข' : 'บันทึก'}ข้อมูลได้`);
      }
    } catch (error) {
      message.error(`เกิดข้อผิดพลาดในการ${isEditMode ? 'แก้ไข' : 'บันทึก'}ข้อมูล`);
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
            {isEditMode ? 'แก้ไขข้อมูลผู้ช่วยสอน' : 'เพิ่มผู้ช่วยสอนใหม่'}
          </h1>
          <p style={{ 
            margin: 0, 
            color: '#666',
            fontSize: '14px'
          }}>
            {isEditMode ? 'แก้ไขข้อมูลผู้ช่วยสอน' : 'กรอกข้อมูลผู้ช่วยสอนใหม่'}
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
          {/* Profile Image Section */}
          <Card 
            size="small" 
            title={
              <span style={{ color: '#F26522', fontSize: '16px', fontWeight: 'bold' }}>
                รูปภาพประจำตัว
              </span>
            }
            style={{ marginBottom: '24px' }}
          >
            <div style={{ 
              display: 'flex', 
              flexDirection: isMobile ? 'column' : 'row',
              alignItems: 'center', 
              gap: '16px' 
            }}>
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '8px',
                    objectFit: 'cover',
                    border: '2px solid #f0f0f0'
                  }}
                />
              ) : (
                <div style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '8px',
                  backgroundColor: '#f0f0f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px dashed #d9d9d9',
                  color: '#999'
                }}>
                  <UserOutlined style={{ fontSize: '48px' }} />
                </div>
              )}
              <div style={{ flex: 1 }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #d9d9d9',
                    borderRadius: '4px',
                    width: '100%',
                    fontSize: '14px'
                  }}
                />
                <div style={{ 
                  marginTop: '8px', 
                  color: '#666', 
                  fontSize: '12px' 
                }}>
                  รองรับไฟล์ JPG, PNG ขนาดไม่เกิน 5MB
                </div>
              </div>
            </div>
          </Card>

          {/* Personal Information */}
          <Card 
            size="small" 
            title={
              <span style={{ color: '#F26522', fontSize: '16px', fontWeight: 'bold' }}>
                ข้อมูลส่วนตัว
              </span>
            }
            style={{ marginBottom: '24px' }}
          >
            <Row gutter={[16, 16]}>
              <Col xs={24}>
                <Form.Item label="คำนำหน้า" required>
                  <Select
                    placeholder="-- เลือกคำนำหน้า --"
                    value={formData.TitleID || undefined}
                    onChange={(value) => handleChange('TitleID', value)}
                    size="large"
                    style={{ width: isMobile ? '100%' : '200px' }}
                  >
                    {title.map((t) => (
                      <Option key={t.ID} value={t.ID}>
                        {t.Title}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Form.Item label="ชื่อ" required>
                  <Input
                    placeholder="กรอกชื่อ"
                    value={formData.Firstname}
                    onChange={(e) => handleChange('Firstname', e.target.value)}
                    size="large"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="นามสกุล" required>
                  <Input
                    placeholder="กรอกนามสกุล"
                    value={formData.Lastname}
                    onChange={(e) => handleChange('Lastname', e.target.value)}
                    size="large"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Form.Item label="อีเมล" required>
                  <Input
                    type="email"
                    placeholder="กรอกอีเมล"
                    value={formData.Email}
                    onChange={(e) => handleChange('Email', e.target.value)}
                    size="large"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="หมายเลขโทรศัพท์" required>
                  <Input
                    placeholder="กรอกเบอร์โทรศัพท์"
                    value={formData.PhoneNumber}
                    onChange={(e) => handleChange('PhoneNumber', e.target.value)}
                    size="large"
                  />
                </Form.Item>
              </Col>
            </Row>
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
              onClick={() => navigate('/assistance-list')}
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
              {loading ? 'กำลังบันทึก...' : (isEditMode ? 'บันทึกการแก้ไข' : 'เพิ่มผู้ช่วยสอน')}
            </Button>
          </div>
        </Form>
      </Card>

      {/* Help Text */}
      <Card style={{ marginTop: '16px', backgroundColor: '#f8f9fa' }}>
        <div style={{ fontSize: '12px', color: '#666' }}>
          <strong>💡 คำแนะนำ:</strong>
          <ul style={{ margin: '8px 0 0 20px', paddingLeft: 0 }}>
            <li>กรอกข้อมูลให้ครบถ้วนและถูกต้อง</li>
            <li>รูปภาพควรเป็นภาพถ่ายที่ชัดเจน</li>
            <li>อีเมลจะใช้สำหรับการติดต่อ</li>
            <li>หมายเลขโทรศัพท์ให้กรอกแบบ 10 หลัก</li>
            <li>คำนำหน้าต้องเลือกให้ถูกต้อง</li>
          </ul>
        </div>
      </Card>
    </div>
  );
};

export default ManageAssistance;