import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getAllTitle,
  getAllPosition,
  getMajorOfDepathment,
  getAllRoles,
} from "../../../services/https/GetService";
import {
  Alltitles,
  Allposition,
  CreateUserInterface,
  DepartmentInterface,
  MajorInterface,
  AllRoleInterface,
} from "../../../interfaces/Adminpage";
import {
  postCreateUser,
  putUpdateUser,
  getUserById,
} from "../../../services/https/AdminPageServices";
import Swal from "sweetalert2";
import { Button, Input, Select, Card, Form, Row, Col, message } from "antd";
import {
  SaveOutlined,
  ArrowLeftOutlined,
  UserOutlined,
} from "@ant-design/icons";

const { Option } = Select;

const ManageTeacher: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form] = Form.useForm();

  const [title, setTitle] = useState<Alltitles[]>([]);
  const [position, setPosition] = useState<Allposition[]>([]);
  const [roles, setRole] = useState<AllRoleInterface[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [departments, setDepartments] = useState<DepartmentInterface[]>([]);
  const [majors, setMajors] = useState<MajorInterface[]>([]);
  const [selectedDepartmentID, setSelectedDepartmentID] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [containerWidth, setContainerWidth] = useState(window.innerWidth);

  // Monitor container width for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setContainerWidth(window.innerWidth);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = containerWidth < 768;

  const filteredMajors = majors.filter(
    (m) => m.DepartmentID === selectedDepartmentID
  );

  const isEdit = Boolean(id);

  const [formData, setFormData] = useState<CreateUserInterface>({
    Username: "",
    Password: isEdit ? "" : "123456",
    Firstname: "",
    Lastname: "",
    Image: "",
    Email: "",
    PhoneNumber: "",
    Address: "",
    TitleID: 0,
    PositionID: 0,
    MajorID: 0,
    RoleID: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [titleResponse, positionResponse, majorResponse, roleResponse] =
          await Promise.all([
            getAllTitle(),
            getAllPosition(),
            getMajorOfDepathment(),
            getAllRoles(),
          ]);

        if (titleResponse.status === 200 && Array.isArray(titleResponse.data)) {
          setTitle(titleResponse.data);
        }

        if (
          positionResponse.status === 200 &&
          Array.isArray(positionResponse.data)
        ) {
          setPosition(positionResponse.data);
        }

        if (majorResponse.status === 200 && Array.isArray(majorResponse.data)) {
          setMajors(majorResponse.data);
          const uniqueDepartments = Array.from(
            new Map(
              majorResponse.data.map((m: MajorInterface) => [
                m.Department.ID,
                m.Department,
              ])
            ).values()
          ) as DepartmentInterface[];
          setDepartments(uniqueDepartments);
        }

        if (roleResponse.status === 200 && Array.isArray(roleResponse.data)) {
          setRole(roleResponse.data);
        }
      } catch (error) {
        message.error("เกิดข้อผิดพลาดในการโหลดข้อมูล");
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      if (!id) return;

      try {
        const res = await getUserById(id);
        if (res.status === 200 && res.data) {
          const data = res.data;
          const userData = {
            Username: data.username,
            Password: "****",
            Firstname: data.firstname,
            Lastname: data.lastname,
            Image: data.image || "",
            Email: data.email,
            PhoneNumber: data.phone_number,
            Address: data.address || "",
            TitleID: Number(data.title_id),
            PositionID: Number(data.position_id),
            MajorID: Number(data.major_id),
            RoleID: Number(data.role_id),
          };

          setFormData(userData);
          form.setFieldsValue(userData);

          const foundMajor = majors.find((m) => m.ID === Number(data.major_id));
          setSelectedDepartmentID(foundMajor?.DepartmentID || 0);
          setImagePreview(data.image || null);
        }
      } catch (error) {
        message.error("ไม่สามารถโหลดข้อมูลผู้ใช้ได้");
      }
    };

    if (majors.length > 0) {
      fetchUser();
    }
  }, [id, majors, form]);

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setFormData({ ...formData, Image: base64 });
        setImagePreview(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const {
      Username,
      Password,
      Firstname,
      Lastname,
      Image,
      Address,
      Email,
      PhoneNumber,
      TitleID,
      PositionID,
      RoleID,
    } = formData;

    if (id) {
      // สำหรับการแก้ไข - ไม่ต้องตรวจสอบรหัสผ่าน
      return (
        Username &&
        Firstname &&
        Lastname &&
        Email &&
        Address &&
        PhoneNumber &&
        TitleID !== 0 &&
        PositionID !== 0 &&
        RoleID !== 0
      );
    }

    // สำหรับการเพิ่มใหม่
    return (
      Username &&
      Password &&
      Firstname &&
      Lastname &&
      Image &&
      Email &&
      Address &&
      PhoneNumber &&
      TitleID !== 0 &&
      PositionID !== 0 &&
      RoleID !== 0
    );
  };

  const handleUpdate = async () => {
    const selectedTitle =
      title.find((t) => t.ID === formData.TitleID)?.Title || "";
    const fullname = `${formData.Firstname} ${formData.Lastname}`;

    const result = await Swal.fire({
      title: "ยืนยันการแก้ไข",
      text: `คุณต้องการอัปเดตข้อมูล ${selectedTitle} ${fullname} หรือไม่?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#f26522",
      cancelButtonColor: "#d33",
      confirmButtonText: "ตกลง",
      cancelButtonText: "ยกเลิก",
    });

    if (!result.isConfirmed) return;

    try {
      setLoading(true);
      const response = await putUpdateUser(Number(id), formData);

      if (response.status === 200) {
        message.success(`อัปเดตข้อมูลของ ${fullname} เสร็จสิ้น`);
        navigate("/teacher-list");
      } else {
        message.error(response.data?.error || "ไม่สามารถอัปเดตข้อมูลได้");
      }
    } catch (error) {
      message.error("เกิดข้อผิดพลาดในการอัปเดตข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      message.warning("กรุณากรอกข้อมูลให้ครบทุกช่องก่อนบันทึก");
      return;
    }

    const selectedTitle =
      title.find((t) => t.ID === formData.TitleID)?.Title || "";
    const fullname = `${formData.Firstname} ${formData.Lastname}`;

    if (id) {
      await handleUpdate();
      return;
    }

    const result = await Swal.fire({
      title: "ยืนยันการบันทึก",
      text: `คุณต้องการบันทึกข้อมูล ${selectedTitle} ${fullname} หรือไม่?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#f26522",
      cancelButtonColor: "#d33",
      confirmButtonText: "ตกลง",
      cancelButtonText: "ยกเลิก",
    });

    if (!result.isConfirmed) return;

    try {
      setLoading(true);
      const dataToSubmit = {
        ...formData,
        Address: formData.Address || "N/A",
      };

      const res = await postCreateUser(dataToSubmit);

      if (res.status === 201 || res.status === 200) {
        message.success(
          `ข้อมูล ${selectedTitle} ${fullname} ถูกบันทึกเรียบร้อยแล้ว`
        );
        navigate("/teacher-list");
      } else {
        message.error(res?.data?.error || "ไม่สามารถบันทึกข้อมูลได้");
      }
    } catch (error) {
      message.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
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
            {id ? "แก้ไขข้อมูลอาจารย์" : "เพิ่มอาจารย์ใหม่"}
          </h1>
          <p
            style={{
              margin: 0,
              color: "#666",
              fontSize: "14px",
            }}
          >
            {id ? "แก้ไขข้อมูลอาจารย์ผู้สอน" : "กรอกข้อมูลอาจารย์ผู้สอนใหม่"}
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
          {/* Profile Image Section */}
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
                รูปภาพประจำตัว
              </span>
            }
            style={{ marginBottom: "24px" }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                alignItems: "center",
                gap: "16px",
              }}
            >
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  style={{
                    width: "120px",
                    height: "120px",
                    borderRadius: "8px",
                    objectFit: "cover",
                    border: "2px solid #f0f0f0",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "120px",
                    height: "120px",
                    borderRadius: "8px",
                    backgroundColor: "#f0f0f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "2px dashed #d9d9d9",
                    color: "#999",
                  }}
                >
                  <UserOutlined style={{ fontSize: "48px" }} />
                </div>
              )}
              <div style={{ flex: 1 }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        const base64 = reader.result as string;
                        setFormData({ ...formData, Image: base64 });
                        setImagePreview(base64);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  style={{
                    padding: "8px 12px",
                    border: "1px solid #d9d9d9",
                    borderRadius: "4px",
                    width: "100%",
                    fontSize: "14px",
                  }}
                />
                <div
                  style={{
                    marginTop: "8px",
                    color: "#666",
                    fontSize: "12px",
                  }}
                >
                  รองรับไฟล์ JPG, PNG ขนาดไม่เกิน 5MB
                </div>
              </div>
            </div>
          </Card>

          {/* Personal Information */}
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
                ข้อมูลส่วนตัว
              </span>
            }
            style={{ marginBottom: "24px" }}
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Form.Item label="ตำแหน่งทางวิชาการ" required>
                  <Select
                    placeholder="-- เลือกคำนำหน้า --"
                    value={formData.TitleID || undefined}
                    onChange={(value) => handleChange("TitleID", value)}
                    size="large"
                  >
                    {title.map((t) => (
                      <Option key={t.ID} value={t.ID}>
                        {t.Title}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="ตำแหน่งที่ได้รับการแต่งตั้ง" required>
                  <Select
                    placeholder="-- เลือกตำแหน่ง --"
                    value={formData.PositionID || undefined}
                    onChange={(value) => handleChange("PositionID", value)}
                    size="large"
                  >
                    {position.map((p) => (
                      <Option key={p.ID} value={p.ID}>
                        {p.Position}
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
                    onChange={(e) => handleChange("Firstname", e.target.value)}
                    size="large"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="นามสกุล" required>
                  <Input
                    placeholder="กรอกนามสกุล"
                    value={formData.Lastname}
                    onChange={(e) => handleChange("Lastname", e.target.value)}
                    size="large"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="อีเมล"
                  required
                  validateStatus={
                    formData.Email &&
                    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.Email)
                      ? "error"
                      : ""
                  }
                  help={
                    formData.Email &&
                    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.Email)
                      ? "รูปแบบอีเมลไม่ถูกต้อง"
                      : ""
                  }
                >
                  <Input
                    type="email"
                    placeholder="กรอกอีเมล"
                    value={formData.Email}
                    onChange={(e) => handleChange("Email", e.target.value)}
                    size="large"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label="หมายเลขโทรศัพท์"
                  required
                  validateStatus={
                    formData.PhoneNumber &&
                    !/^\d{9,10}$/.test(formData.PhoneNumber)
                      ? "error"
                      : ""
                  }
                  help={
                    formData.PhoneNumber &&
                    !/^\d{9,10}$/.test(formData.PhoneNumber)
                      ? "เบอร์โทรต้องเป็นตัวเลข 10 หลัก"
                      : ""
                  }
                >
                  <Input
                    placeholder="กรอกเบอร์โทรศัพท์"
                    value={formData.PhoneNumber}
                    onChange={(e) =>
                      handleChange("PhoneNumber", e.target.value)
                    }
                    size="large"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="ที่อยู่" required>
                  <Input
                    type="address"
                    placeholder="อาคารบริการ 1 ชั้น 4 ห้อง CPE01"
                    value={formData.Address}
                    onChange={(e) => handleChange("Address", e.target.value)}
                    size="large"
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* Academic Information */}
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
                ข้อมูลทางวิชาการ
              </span>
            }
            style={{ marginBottom: "24px" }}
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Form.Item label="คณะ/สำนักวิชา" required>
                  <Select
                    placeholder="-- เลือกคณะ --"
                    value={selectedDepartmentID || undefined}
                    onChange={(value) => {
                      setSelectedDepartmentID(value);
                      handleChange("MajorID", 0); // Reset major when department changes
                    }}
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
                <Form.Item label="สาขาวิชา" required>
                  <Select
                    placeholder="-- เลือกสาขา --"
                    value={formData.MajorID || undefined}
                    onChange={(value) => handleChange("MajorID", value)}
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

            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Form.Item label="บทบาท" required>
                  <Select
                    placeholder="-- เลือกบทบาท --"
                    value={formData.RoleID || undefined}
                    onChange={(value) => handleChange("RoleID", value)}
                    size="large"
                  >
                    {roles.map((r) => (
                      <Option key={r.ID} value={r.ID}>
                        {r.Role}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* Account Information */}
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
                ข้อมูลบัญชีผู้ใช้
              </span>
            }
            style={{ marginBottom: "24px" }}
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Form.Item label="รหัสพนักงาน" required>
                  <Input
                    placeholder="กรอกรหัสพนักงาน"
                    value={formData.Username}
                    onChange={(e) => handleChange("Username", e.target.value)}
                    size="large"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label="รหัสผ่าน"
                  required={!id}
                  help={id ? "เว้นว่างหากไม่ต้องการเปลี่ยนรหัสผ่าน" : ""}
                >
                  <Input.Password
                    placeholder={id ? "เว้นว่างหากไม่เปลี่ยน" : "กรอกรหัสผ่าน"}
                    value={formData.Password}
                    onChange={(e) => handleChange("Password", e.target.value)}
                    size="large"
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
              onClick={() => navigate("/teacher-list")}
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
                : id
                ? "บันทึกการแก้ไข"
                : "เพิ่มอาจารย์"}
            </Button>
          </div>
        </Form>
      </Card>

      {/* Help Text */}
      <Card style={{ marginTop: "16px", backgroundColor: "#f8f9fa" }}>
        <div style={{ fontSize: "12px", color: "#666" }}>
          <strong>💡 คำแนะนำ:</strong>
          <ul style={{ margin: "8px 0 0 20px", paddingLeft: 0 }}>
            <li>กรอกข้อมูลให้ครบถ้วนและถูกต้อง</li>
            <li>รูปภาพควรเป็นภาพถ่ายที่ชัดเจน</li>
            <li>อีเมลจะใช้สำหรับการติดต่อและการรับรหัสผ่านใหม่</li>
            <li>รหัสพนักงานต้องไม่ซ้ำกับที่มีอยู่แล้ว</li>
            {!id && <li>รหัสผ่านควรมีความปลอดภัยสูง</li>}
          </ul>
        </div>
      </Card>
    </div>
  );
};

export default ManageTeacher;
