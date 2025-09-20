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
  const [formData, setFormData] = useState<LaboratoryData>({
    id: undefined,
    room: "",
    building: "",
    capacity: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      if (id) {
        setIsEditMode(true);
        try {
          const res = await getLaboratoryById(id);
          if (res.status === 200) {
            const data = res.data.data; // backend ส่งใน data
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

    // เตรียม payload ให้ type-safe
    const payload = {
      room: formData.room || "",
      building: formData.building || "",
      capacity: String(formData.capacity || ""),
    };

    let res;

    if (isEditMode && formData.id) {
      // อัพเดต
      res = await putUpdateLaboratory(formData.id, payload);
    } else {
      // เพิ่ม
      res = await postCreateLaboratory(payload);
    }

    // แสดง success เสมอถ้าไม่มี error
    await Swal.fire({
      icon: "success",
      title: "สำเร็จ!",
      text: `${isEditMode ? "แก้ไข" : "เพิ่ม"}ห้องปฏิบัติการ ${payload.building} ${payload.room} เรียบร้อยแล้ว`,
      confirmButtonText: "ตกลง",
    });

    // กลับไปหน้า list
    navigate("/laboratory-list");

  } catch (error: any) {
    console.error("Submit error:", error);

    // แสดง error ก็ต่อเมื่อ axios throw
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
        padding: "24px",
        backgroundColor: "#f5f5f5",
        minHeight: "100vh",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ margin: 0, color: "#333" }}>
          {isEditMode ? "แก้ไขห้องปฏิบัติการ" : "เพิ่มห้องปฏิบัติการใหม่"}
        </h1>
        <p style={{ margin: 0, color: "#666" }}>
          {isEditMode
            ? "แก้ไขรายละเอียดห้องปฏิบัติการ"
            : "กรอกรายละเอียดห้องปฏิบัติการใหม่"}
        </p>
      </div>

      {/* Form */}
      <Card>
        <Form form={form} layout="vertical">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                label="ชื่ออาคาร"
                name="building"
                rules={[{ required: true, message: "กรุณากรอกชื่ออาคาร" }]}
              >
                <Input
                  placeholder="กรอกชื่ออาคาร"
                  value={formData.building}
                  onChange={(e) => handleChange("building", e.target.value)}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="ชื่อห้อง"
                name="room"
                rules={[{ required: true, message: "กรุณากรอกชื่อห้อง" }]}
              >
                <Input
                  placeholder="กรอกชื่อห้อง"
                  value={formData.room}
                  onChange={(e) => handleChange("room", e.target.value)}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                label="ความจุ"
                name="capacity"
                rules={[
                  { required: true, message: "กรุณากรอกความจุ" },
                  {
                    pattern: /^[0-9]+$/,
                    message: "กรุณากรอกความจุเป็นตัวเลข",
                  },
                ]}
              >
                <Input
                  placeholder="กรอกความจุ (เช่น 60)"
                  value={formData.capacity}
                  onChange={(e) => handleChange("capacity", e.target.value)}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Action Buttons */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 16 }}>
            <Button onClick={() => navigate("/laboratory-list")}>ยกเลิก</Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSubmit}
              loading={loading}
              disabled={!validateForm()}
              style={{
                backgroundColor: validateForm() ? "#F26522" : undefined,
                borderColor: validateForm() ? "#F26522" : undefined,
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
    </div>
  );
};

export default ManageLab;
