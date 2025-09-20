import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { Button, Input, Card, Form, Row, Col, Select, message, Table } from "antd";
import { SaveOutlined, PlusOutlined } from "@ant-design/icons";
import {
  createCurriculum,
  updateCurriculum,
  getCurriculumById,
  duplicateAllCourses,
} from "../../../services/https/AdminPageServices";
import { getMajorOfDepathment } from "../../../services/https/GetService";

interface CurriculumFormData {
  id?: number;
  curriculumName: string;
  year: number | null;
  started: number | null;
  departmentId: number | null;
  majorId: number | null;
  categories: string[];
}

interface SimpleMajor {
  id: number;
  name: string;
}

interface Department {
  id: number;
  name: string;
  majors: SimpleMajor[];
}

const ManageCurriculum: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [form] = Form.useForm();
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<CurriculumFormData>({
    id: undefined,
    curriculumName: "",
    year: null,
    started: null,
    departmentId: null,
    majorId: null,
    categories: [],
  });

  const [departments, setDepartments] = useState<Department[]>([]);
  const [majors, setMajors] = useState<SimpleMajor[]>([]);
  const [duplicatedCourses, setDuplicatedCourses] = useState<
  { categoryName: string; courseName: string; credit: number }[]
>([]);
const [duplicateDecisionMade, setDuplicateDecisionMade] = useState(false);


  useEffect(() => {
    const fetchData = async () => {
      let groupedDepartments: Department[] = [];
      try {
        const depsRes: any = await getMajorOfDepathment();
        if (depsRes && depsRes.status === 200) {
          const majorsRaw = depsRes.data || [];
          groupedDepartments = majorsRaw.reduce((acc: Department[], major: any) => {
            const depId = major.Department?.ID;
            const depName = major.Department?.DepartmentName ?? `สำนักวิชา ${depId}`;
            let dep = acc.find((d) => d.id === depId);
            if (!dep) {
              dep = { id: depId, name: depName, majors: [] };
              acc.push(dep);
            }
            dep.majors.push({ id: major.ID, name: major.MajorName });
            return acc;
          }, []);
          setDepartments(groupedDepartments);
        }
      } catch (err) {
        console.error("getMajorOfDepathment error:", err);
      }

      if (id) {
        setIsEditMode(true);
        try {
          const curRes: any = await getCurriculumById(id);
          if (curRes && curRes.status === 200) {
            const data = curRes.data?.data || curRes.data;
            setFormData({
              id: data.id ?? data.ID,
              curriculumName: data.curriculumName ?? data.CurriculumName ?? "",
              year: data.year ?? data.Year ?? null,
              started: data.started ?? data.Started ?? null,
              departmentId: data.departmentId ?? data.DepartmentID ?? null,
              majorId: data.majorId ?? data.MajorID ?? null,
              categories: data.categories || [],
            });
            form.setFieldsValue({
              curriculumName: data.curriculumName ?? data.CurriculumName ?? "",
              year: data.year ?? data.Year ?? undefined,
              started: data.started ?? data.Started ?? undefined,
              departmentId: data.departmentId ?? data.DepartmentID ?? undefined,
              majorId: data.majorId ?? data.MajorID ?? undefined,
            });

            if (data.departmentId || data.DepartmentID) {
              const dep = groupedDepartments.find(
                (d) => d.id === (data.departmentId ?? data.DepartmentID)
              );
              setMajors(dep?.majors || []);
            }
          } else {
            message.error("ไม่สามารถโหลดข้อมูลหลักสูตรได้");
            navigate("/curriculum-list");
          }
        } catch (err) {
          console.error("getCurriculumById error:", err);
          message.error("เกิดข้อผิดพลาดในการโหลดข้อมูลหลักสูตร");
        }
      }
    };

    fetchData();
  }, [id]);

  const handleDepartmentChange = (value: number) => {
    setFormData({ ...formData, departmentId: value, majorId: null });
    const dep = departments.find((d) => d.id === value);
    setMajors(dep?.majors || []);
  };

  const handleChange = (field: keyof CurriculumFormData, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const addCategory = () =>
    setFormData({ ...formData, categories: [...formData.categories, ""] });

  const handleCategoryChange = (index: number, value: string) => {
    const newCategories = [...formData.categories];
    newCategories[index] = value;
    setFormData({ ...formData, categories: newCategories });
  };

  const removeCategory = (index: number) => {
    const newCategories = formData.categories.filter((_, i) => i !== index);
    setFormData({ ...formData, categories: newCategories });
  };

const handleSubmit = async () => {
  if (!formData.curriculumName || formData.year == null || formData.started == null || !formData.majorId) {
    message.warning("กรุณากรอกข้อมูลให้ครบทุกช่อง");
    return;
  }

  try {
    setLoading(true);
    const payload = {
      curriculumName: formData.curriculumName,
      year: Number(formData.year),
      started: Number(formData.started),
      majorId: Number(formData.majorId),
    };

    let res: any;

    if (!isEditMode) {
  // สร้างหลักสูตรใหม่
  res = await createCurriculum(payload);
  const newId = res.id;
  if (!newId) throw new Error("ไม่พบ ID ของหลักสูตรที่สร้าง");

  // ถาม duplicate
  const result = await Swal.fire({
    title: "ต้องการดึงวิชาจากหลักสูตรเดิม?",
    text: "คุณต้องการคัดลอกรายวิชาที่มีอยู่แล้วในสาขานี้มาหลักสูตรใหม่หรือไม่?",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "ใช่",
    cancelButtonText: "ไม่",
  });

  if (result.isConfirmed) {
    try {
      const dupRes: any[] = await duplicateAllCourses(newId);
      setDuplicatedCourses(
        dupRes.map((c) => ({
          categoryName: c.categoryName,
          courseName: c.courseName,
          credit: c.credit ?? 0,
        }))
      );
    } catch (err: any) {
      console.error("duplicateAllCourses error:", err);
      message.error("เกิดข้อผิดพลาดในการคัดลอกรายวิชา");
    }
  } else {
    // ถ้าไม่ duplicate → เปิดฟิลด์เพิ่มหมวดวิชาได้เลย
    setFormData({ ...formData, categories: [""] });
    setDuplicatedCourses([]); // ไม่ต้องแสดงตาราง
  }

  message.success("สร้างหลักสูตรสำเร็จ");
  // ไม่ต้อง navigate ทันที ให้ผู้ใช้กรอกหมวดวิชาต่อ
}
 else {
      // edit mode
      res = await updateCurriculum(formData.id!, payload);
    }

    if (res && (res.status === 200 || res.status === 201)) {
      message.success(isEditMode ? "แก้ไขหลักสูตรสำเร็จ" : "สร้างหลักสูตรสำเร็จ");
      if (!isEditMode && duplicatedCourses.length === 0) {
        // ถ้าไม่ duplicate ให้ยังอยู่หน้าเดียวกัน เพื่อเพิ่มหมวดวิชา
      } else {
        navigate("/curriculum-list");
      }
    } else {
      message.error(res?.data?.error || "ไม่สามารถบันทึกข้อมูลได้");
    }
  } catch (error: any) {
    message.error(error?.response?.data?.error || error?.message || "ไม่สามารถบันทึกข้อมูลได้");
  } finally {
    setLoading(false);
  }
};
  return (
    <div
      style={{
        fontFamily: "Sarabun, sans-serif",
        padding: 24,
        minHeight: "100vh",
        backgroundColor: "#f5f5f5",
      }}
    >
      <div style={{ marginBottom: 24 }}>
        <h1>{isEditMode ? "แก้ไขหลักสูตร" : "เพิ่มหลักสูตรใหม่"}</h1>
        <p>{isEditMode ? "แก้ไขข้อมูลหลักสูตร" : "กรอกข้อมูลหลักสูตรใหม่"}</p>
      </div>

      <Card>
        <Form form={form} layout="vertical">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item label="สำนักวิชา" name="departmentId" rules={[{ required: true }]}>
                <Select
                  placeholder="เลือกสำนักวิชา"
                  value={formData.departmentId ?? undefined}
                  onChange={handleDepartmentChange}
                  options={departments.map((d) => ({ label: d.name, value: d.id }))}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item label="สาขา" name="majorId" rules={[{ required: true }]}>
                <Select
                  placeholder="เลือกสาขา"
                  value={formData.majorId ?? undefined}
                  onChange={(v) => handleChange("majorId", v)}
                  options={majors.map((m) => ({ label: m.name, value: m.id }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item label="ชื่อหลักสูตร" name="curriculumName" rules={[{ required: true }]}>
                <Input
                  placeholder="กรอกชื่อหลักสูตร"
                  value={formData.curriculumName}
                  onChange={(e) => handleChange("curriculumName", e.target.value)}
                />
              </Form.Item>
            </Col>

            <Col xs={12} md={6}>
              <Form.Item label="ปีการศึกษา" name="year" rules={[{ required: true }]}>
                <Input
                  type="number"
                  value={formData.year ?? ""}
                  onChange={(e) => handleChange("year", Number(e.target.value))}
                />
              </Form.Item>
            </Col>

            <Col xs={12} md={6}>
              <Form.Item label="ปีเริ่ม" name="started" rules={[{ required: true }]}>
                <Input
                  type="number"
                  value={formData.started ?? ""}
                  onChange={(e) => handleChange("started", Number(e.target.value))}
                />
              </Form.Item>
            </Col>
          </Row>

          {formData.categories.length > 0 && (
            <>
              <p>หมวดวิชาในหลักสูตรใหม่</p>
              {formData.categories.map((c, i) => (
                <Row gutter={[8, 8]} key={i} style={{ marginBottom: 8 }}>
                  <Col span={20}>
                    <Input
                      value={c}
                      onChange={(e) => handleCategoryChange(i, e.target.value)}
                    />
                  </Col>
                  <Col span={4}>
                    <Button danger onClick={() => removeCategory(i)}>
                      ลบ
                    </Button>
                  </Col>
                </Row>
              ))}
              <Button icon={<PlusOutlined />} onClick={addCategory}>
                เพิ่มหมวดวิชา
              </Button>
            </>
          )}

           {duplicatedCourses.length > 0 && (
      <Card style={{ marginTop: 24 }}>
        <h3>รายวิชาที่คัดลอกจากหลักสูตรเดิม</h3>
        <Table
          rowKey={(record, index) => `${record.categoryName}-${record.courseName}-${index}`}
          dataSource={duplicatedCourses}
          pagination={false}
          bordered
          columns={[
            { title: "หมวดวิชา", dataIndex: "categoryName", key: "categoryName" },
            { title: "ชื่อวิชา", dataIndex: "courseName", key: "courseName" },
            { title: "หน่วยกิต", dataIndex: "credit", key: "credit" },
          ]}
        />
      </Card>
    )}

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
            <Button onClick={() => navigate("/curriculum-list")}>ยกเลิก</Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={loading}
              onClick={handleSubmit}
              style={{ marginLeft: 8 }}
            >
              {isEditMode ? "บันทึกการแก้ไข" : "สร้างหลักสูตร"}
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default ManageCurriculum;
