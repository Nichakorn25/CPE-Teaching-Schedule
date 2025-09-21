import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { Button, Input, Card, Form, Row, Col, message } from "antd";
import { SaveOutlined } from "@ant-design/icons";
import {
  postCreateLaboratory,
  putUpdateLaboratory,
  getLaboratoryById,
} from "../../../services/https/AdminPageServices";
import { LaboratoryData } from "../../../interfaces/Lab";

const ManageLab: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [containerWidth, setContainerWidth] = useState(window.innerWidth);
  const [formData, setFormData] = useState<LaboratoryData>({
    id: undefined,
    room: "",
    building: "",
    capacity: "",
  });

  // Monitor container width for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setContainerWidth(window.innerWidth);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = containerWidth < 768;

  useEffect(() => {
    const fetchData = async () => {
      if (id) {
        setIsEditMode(true);
        try {
          const res = await getLaboratoryById(id);
          if (res.status === 200) {
            const data = res.data.data;
            setFormData({
              id: data.id,
              room: data.room || "",
              building: data.building || "",
              capacity: data.capacity || "",
            });
            form.setFieldsValue({
              room: data.room || "",
              building: data.building || "",
              capacity: data.capacity || "",
            });
          } else {
            message.error("ไม่สามารถโหลดข้อมูลห้องปฏิบัติการได้");
            navigate("/laboratory-list");
          }
        } catch (error) {
          message.error("เกิดข้อผิดพลาดในการโหลดข้อมูล");
        }
      }
    };
    fetchData();
  }, [id, form, navigate]);

  const handleChange = (field: keyof LaboratoryData, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const validateForm = () => {
    return formData.room && formData.building && formData.capacity;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      message.warning("กรุณากรอกข้อมูลให้ครบทุกช่อง");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        room: formData.room || "",
        building: formData.building || "",
        capacity: String(formData.capacity || ""),
      };

      let res;

      if (isEditMode && formData.id) {
        res = await putUpdateLaboratory(formData.id, payload);
      } else {
        res = await postCreateLaboratory(payload);
      }

      await Swal.fire({
        icon: "success",
        title: "สำเร็จ!",
        text: `${isEditMode ? "แก้ไข" : "เพิ่ม"}ห้องปฏิบัติการ ${payload.building} ${payload.room} เรียบร้อยแล้ว`,
        confirmButtonText: "ตกลง",
      });

      navigate("/laboratory-list");

    } catch (error: any) {
      console.error("Submit error:", error);

      await Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: `เกิดข้อผิดพลาดในการ${isEditMode ? "แก้ไข" : "บันทึก"}ข้อมูล`,
        confirmButtonText: "ตกลง",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        fontFamily: "Sarabun, sans-serif",
        padding: isMobile ? "16px" : "24px",
        backgroundColor: "#f5f5f5",
        minHeight: "100vh",
      }}
    >
      {/* Header */}
      <div
        style={{
          marginBottom: "24px",
          display: "flex",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              color: "#333",
              fontSize: isMobile ? "20px" : "24px",
              fontWeight: "bold",
            }}
          >
            {isEditMode ? "แก้ไขห้องปฏิบัติการ" : "เพิ่มห้องปฏิบัติการใหม่"}
          </h1>
          <p
            style={{
              margin: 0,
              color: "#666",
              fontSize: "14px",
            }}
          >
            {isEditMode
              ? "แก้ไขรายละเอียดห้องปฏิบัติการ"
              : "กรอกข้อมูลห้องปฏิบัติการใหม่ที่ต้องการเพิ่ม"}
          </p>
        </div>
      </div>

      {/* Main Form */}
      <Card
        style={{
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          borderRadius: "8px",
        }}
      >
        <Form
          form={form}
          layout="vertical"
          style={{ fontFamily: "Sarabun, sans-serif" }}
        >
          {/* Basic Laboratory Information */}
          <Card
            size="small"
            title={
              <span
                style={{
                  color: "#F26522",
                  fontSize: "16px",
                  fontWeight: "bold",
                }}
              >
                ข้อมูลพื้นฐานห้องปฏิบัติการ
              </span>
            }
            style={{ marginBottom: "24px" }}
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="ชื่ออาคาร"
                  name="building"
                  rules={[
                    { required: true, message: "กรุณากรอกชื่ออาคาร" },
                    {
                      validator: (_, value) => {
                        if (!value) return Promise.resolve();
                        if (value.trim().length === 0) {
                          return Promise.reject("ชื่ออาคารไม่สามารถเป็นช่องว่างได้");
                        }
                        return Promise.resolve();
                      },
                    },
                  ]}
                >
                  <Input
                    placeholder="กรอกชื่ออาคาร เช่น อาคาร A"
                    value={formData.building}
                    onChange={(e) => handleChange("building", e.target.value)}
                    size="large"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label="ชื่อห้อง"
                  name="room"
                  rules={[
                    { required: true, message: "กรุณากรอกชื่อห้อง" },
                    {
                      validator: (_, value) => {
                        if (!value) return Promise.resolve();
                        if (value.trim().length === 0) {
                          return Promise.reject("ชื่อห้องไม่สามารถเป็นช่องว่างได้");
                        }
                        return Promise.resolve();
                      },
                    },
                  ]}
                >
                  <Input
                    placeholder="กรอกชื่อห้อง เช่น 101, Lab1"
                    value={formData.room}
                    onChange={(e) => handleChange("room", e.target.value)}
                    size="large"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="ความจุ (จำนวนที่นั่ง)"
                  name="capacity"
                  rules={[
                    { required: true, message: "กรุณากรอกความจุ" },
                    {
                      pattern: /^[1-9]\d*$/,
                      message: "ความจุต้องเป็นตัวเลขที่มากกว่า 0",
                    },
                    {
                      validator: (_, value) => {
                        if (!value) return Promise.resolve();
                        const num = parseInt(value);
                        if (num > 1000) {
                          return Promise.reject("ความจุไม่ควรเกิน 1000 ที่นั่ง");
                        }
                        return Promise.resolve();
                      },
                    },
                  ]}
                >
                  <Input
                    placeholder="กรอกความจุ เช่น 60"
                    value={formData.capacity}
                    onChange={(e) => handleChange("capacity", e.target.value)}
                    size="large"
                    addonAfter="ที่นั่ง"
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* Action Buttons */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexDirection: isMobile ? "column" : "row",
              gap: "16px",
            }}
          >
            <Button
              size="large"
              onClick={() => navigate("/laboratory-list")}
              style={{ width: isMobile ? "100%" : "auto" }}
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
                backgroundColor: validateForm() ? "#F26522" : undefined,
                borderColor: validateForm() ? "#F26522" : undefined,
                width: isMobile ? "100%" : "auto",
              }}
            >
              {loading
                ? "กำลังบันทึก..."
                : isEditMode
                ? "บันทึกการแก้ไข"
                : "เพิ่มห้องปฏิบัติการ"}
            </Button>
          </div>
        </Form>
      </Card>

      {/* Help Text */}
      <Card 
        style={{ 
          marginTop: "16px", 
          backgroundColor: "#f8f9fa",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
        }}
      >
        <div style={{ fontSize: "12px", color: "#666" }}>
          <strong>💡 คำแนะนำ:</strong>
          <ul style={{ margin: "8px 0 0 20px", paddingLeft: 0 }}>
            <li>กรอกข้อมูลให้ครบถ้วนก่อนบันทึก</li>
            <li>ชื่ออาคารและห้องควรใช้รูปแบบที่เข้าใจง่าย เช่น "อาคาร A ห้อง 101"</li>
            <li>ความจุควรระบุจำนวนที่นั่งจริงที่สามารถรองรับได้</li>
            <li>ตรวจสอบข้อมูลให้ถูกต้องก่อนบันทึก เพื่อป้องกันการแก้ไขภายหลัง</li>
          </ul>
        </div>
      </Card>
    </div>
  );
};

export default ManageLab;