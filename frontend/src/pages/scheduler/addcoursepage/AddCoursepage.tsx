import React, { useState, useEffect } from "react";
import { Button, Input, Select, Card, Form, InputNumber, message } from "antd";
import {
  getAllCurriculum,
  getLaboratory,
} from "../../../services/https/GetService";
import {
  getCoursebyid,
  getAllCourses,
} from "../../../services/https/AdminPageServices";
import {
  CurriculumInterface,
  AllCourseinOpenCourseInterface,
  LaboratoryInterface,
} from "../../../interfaces/Adminpage";

const { Option } = Select;

const AddCoursepage: React.FC = () => {
  const [form] = Form.useForm();
  const [curriculums, setCurriculums] = useState<CurriculumInterface[]>([]);
  const [courses, setCourses] = useState<AllCourseinOpenCourseInterface[]>([]);
  const [lab, setLab] = useState<LaboratoryInterface[]>([]);
  const [selectedCurriculumID, setSelectedCurriculumID] = useState<
    number | null
  >(null);

  useEffect(() => {
    const fetchLab = async () => {
      const response = await getLaboratory();
      console.log("Lab: ", response);
      if (response.status === 200) {
        setLab(response.data);
      }
    };
    fetchLab();
  },[]);

  useEffect(() => {
    const fetchCurriculums = async () => {
      const response = await getAllCurriculum();
      if (response.status === 200) {
        setCurriculums(response.data);
      }
    };
    fetchCurriculums();
  }, []);

  const handleCurriculumChange = async (value: number) => {
    setSelectedCurriculumID(value);
    const response = await getAllCourses();
    console.log(response);
    if (response.status === 200) {
      const filtered = response.data.filter(
        (course: AllCourseinOpenCourseInterface) =>
          course.CurriculumID === value
      );
      setCourses(filtered);
    }
  };

  const handleCourseCodeChange = async (courseId: number) => {
    const selectedCourse = courses.find((course) => course.ID === courseId);
    if (selectedCourse) {
      const response = await getCoursebyid(courseId);
      console.log("data getCoursebyid: ", response);
      if (response.status === 200) {
        const course = response.data;
        form.setFieldsValue({
          courseCode: selectedCourse.CourseCode, // ใช้จาก courses
          courseNameTh: course.ThaiName,
          courseNameEn: course.EnglishName,
          credits: course.Credit?.Unit || 0,
          labRoom: course.Laboratory?.ID || null,
          groupCount: "",
          studentsPerGroup: 45,
        });
      }
    }
  };

  return (
    <>
      <div
        style={{
          marginBottom: "24px",
          paddingBottom: "16px",
          borderBottom: "2px solid #F26522",
        }}
      >
        <h2
          style={{
            margin: 0,
            color: "#333",
            fontSize: "24px",
            fontWeight: "bold",
          }}
        >
          เพิ่มรายวิชาใหม่
        </h2>
        <p style={{ margin: "8px 0 0 0", color: "#666", fontSize: "14px" }}>
          กรอกข้อมูลรายวิชาที่ต้องการเพิ่มเข้าสู่ระบบ
        </p>
      </div>

      <div
        style={{
          width: "100%",
          maxWidth: "1200px",
          margin: "0 auto",
          backgroundColor: "#ffffff",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
          border: "1px solid #e0e0e0",
          padding: "24px",
          borderRadius: "8px",
          minHeight: "calc(100vh - 200px)",
        }}
      >
        <Form form={form} layout="vertical" style={{ width: "100%" }}>
          <Card
            title="ข้อมูลพื้นฐานรายวิชา"
            style={{ marginBottom: "24px" }}
            headStyle={{ backgroundColor: "#f8f9fa", fontWeight: "bold" }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: "16px",
              }}
            >
              <Form.Item
                label={
                  <span style={{ color: "#F26522", fontWeight: "bold" }}>
                    โครงสร้างหลักสูตร
                  </span>
                }
                name="curriculum"
                rules={[
                  { required: true, message: "กรุณาเลือกโครงสร้างหลักสูตร" },
                ]}
              >
                <Select
                  placeholder="เลือกโครงสร้างหลักสูตร"
                  size="large"
                  onChange={handleCurriculumChange}
                  allowClear
                >
                  {curriculums.map((c) => (
                    <Option key={c.ID} value={c.ID}>
                      {c.ID}: {c.CurriculumName}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                label={
                  <span style={{ color: "#F26522", fontWeight: "bold" }}>
                    รหัสวิชา
                  </span>
                }
                name="courseCode"
                rules={[{ required: true, message: "กรุณากรอกรหัสวิชา" }]}
              >
                <Select
                  placeholder="เลือกรหัสวิชาตามหลักสูตร"
                  size="large"
                  onChange={handleCourseCodeChange}
                  showSearch
                  optionFilterProp="children"
                  allowClear
                >
                  {courses.map((c) => (
                    <Option key={c.ID} value={c.ID}>
                      {c.CourseCode} - {c.CourseName}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                }}
              >
                <Form.Item
                  label={
                    <span style={{ color: "#F26522", fontWeight: "bold" }}>
                      ชื่อวิชา (ภาษาไทย)
                    </span>
                  }
                  name="courseNameTh"
                  rules={[
                    { required: true, message: "กรุณากรอกชื่อวิชาภาษาไทย" },
                  ]}
                >
                  <Input placeholder="ระบบฐานข้อมูล" size="large" />
                </Form.Item>

                <Form.Item
                  label={
                    <span style={{ color: "#F26522", fontWeight: "bold" }}>
                      ชื่อวิชา (ภาษาอังกฤษ)
                    </span>
                  }
                  name="courseNameEn"
                  rules={[
                    { required: true, message: "กรุณากรอกชื่อวิชาภาษาอังกฤษ" },
                  ]}
                >
                  <Input placeholder="Database System" size="large" />
                </Form.Item>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                }}
              >
                <Form.Item
                  label={
                    <span style={{ color: "#F26522", fontWeight: "bold" }}>
                      หน่วยกิต
                    </span>
                  }
                  name="credits"
                  rules={[
                    { required: true, message: "กรุณากรอกจำนวนหน่วยกิต" },
                  ]}
                >
                  <InputNumber
                    placeholder="3"
                    min={1}
                    max={10}
                    size="large"
                    style={{ width: "100%" }}
                  />
                </Form.Item>

                <Form.Item
                  label={
                    <span style={{ color: "#F26522", fontWeight: "bold" }}>
                      ห้องปฏิบัติการ (ถ้ามี)
                    </span>
                  }
                  name="labRoom"
                >
                  <Select placeholder="เลือกห้องปฏิบัติการ" size="large">
                    {lab.map((l) => (
                      <Option key={l.ID} value={l.ID}>
                        {l.Room}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </div>
            </div>
          </Card>

          <Card
            title="ข้อมูลการจัดการเรียนการสอน"
            style={{ marginBottom: "24px" }}
            headStyle={{ backgroundColor: "#f8f9fa", fontWeight: "bold" }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
              }}
            >
              <Form.Item
                label={
                  <span style={{ color: "#F26522", fontWeight: "bold" }}>
                    จำนวนกลุ่มเรียน
                  </span>
                }
                name="groupCount"
                rules={[
                  { required: true, message: "กรุณากรอกจำนวนกลุ่มเรียน" },
                ]}
              >
                <InputNumber
                  placeholder="1"
                  min={1}
                  max={50}
                  size="large"
                  style={{ width: "100%" }}
                />
              </Form.Item>

              <Form.Item
                label={
                  <span style={{ color: "#F26522", fontWeight: "bold" }}>
                    นักศึกษาต่อกลุ่ม
                  </span>
                }
                name="studentsPerGroup"
                rules={[
                  { required: true, message: "กรุณากรอกจำนวนนักศึกษาต่อกลุ่ม" },
                ]}
              >
                <InputNumber
                  placeholder="45"
                  min={1}
                  max={200}
                  size="large"
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </div>
          </Card>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "12px",
              paddingTop: "16px",
              borderTop: "1px solid #e9ecef",
            }}
          >
            <Button size="large" style={{ minWidth: "100px" }}>
              ยกเลิก
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              style={{
                backgroundColor: "#F26522",
                borderColor: "#F26522",
                minWidth: "100px",
              }}
            >
              บันทึก
            </Button>
          </div>
        </Form>

        <div
          style={{
            marginTop: "24px",
            padding: "16px",
            backgroundColor: "#f8f9fa",
            borderRadius: "6px",
            border: "1px solid #e9ecef",
          }}
        >
          <h4
            style={{
              margin: "0 0 8px 0",
              color: "#333",
              fontSize: "14px",
              fontWeight: "bold",
            }}
          >
            คำแนะนำการใช้งาน:
          </h4>
          <ul
            style={{
              margin: 0,
              paddingLeft: "20px",
              color: "#666",
              fontSize: "13px",
              lineHeight: "1.6",
            }}
          >
            <li>กรอกข้อมูลในช่องที่มีเครื่องหมาย * ให้ครบถ้วน</li>
            <li>รหัสวิชาต้องไม่ซ้ำกับรายวิชาที่มีอยู่แล้วในระบบ</li>
            <li>รูปแบบชั่วโมงการสอนจะถูกนำไปคำนวณหน่วยกิตรวม</li>
            <li>ข้อมูลจะถูกบันทึกและสามารถแก้ไขได้ในภายหลัง</li>
          </ul>
        </div>
      </div>
    </>
  );
};

export default AddCoursepage;
