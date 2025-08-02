import React, { useEffect, useState } from "react";
import { Button, Select, Form, Card, message, Space } from "antd";
import { MinusCircleOutlined } from "@ant-design/icons";
import {
  getAllTeachers,
  getOpenCourses,
  getAllTeachingAssistants,
  //postAssignTeachingAssistants, // API สำหรับบันทึก
} from "../../../services/https/AdminPageServices";
import { AllTeacher } from "../../../interfaces/Adminpage";
import { TeachingAssistantInterface } from "../../../interfaces/TeachingAssistant";
import { OpenCourseInterface } from "../../../interfaces/OpenCourse";

const { Option } = Select;

const AddTeachingAssistant: React.FC = () => {
  const [form] = Form.useForm();
  const [teachers, setTeachers] = useState<AllTeacher[]>([]);
  const [courses, setCourses] = useState<OpenCourseInterface[]>([]);
  const [assistants, setAssistants] = useState<TeachingAssistantInterface[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<OpenCourseInterface[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const teacherRes = await getAllTeachers();
      if (teacherRes.status === 200 && Array.isArray(teacherRes.data)) {
        setTeachers(teacherRes.data);
      }

      const courseRes = await getOpenCourses();
      if (courseRes.status === 200 && Array.isArray(courseRes.data?.data)) {
        setCourses(courseRes.data.data); // ต้องมี Teachers: AllTeacher[]
      }

      const assistantRes = await getAllTeachingAssistants();
      if (assistantRes.status === 200 && Array.isArray(assistantRes.data)) {
        setAssistants(assistantRes.data);
      }
    };

    fetchData();
  }, []);

  // const handleTeacherChange = (teacherId: number) => {
  //   const filtered = courses.filter(course =>
  //     course.Teachers?.some((t: AllTeacher) => t.ID === teacherId)
  //   );
  //   setFilteredCourses(filtered);
  //   form.setFieldValue("courseID", undefined);
  // };

  // const handleSubmit = async (values: any) => {
  //   const payload = {
  //     courseID: values.courseID,
  //     assistants: values.assistants, // array of assistant IDs
  //   };

  //   const res = await postAssignTeachingAssistants(payload);

  //   if (res.status === 200 || res.status === 201) {
  //     message.success("บันทึกข้อมูลสำเร็จ");
  //     form.resetFields();
  //   } else {
  //     message.error("เกิดข้อผิดพลาดในการบันทึก");
  //   }
  // };

  return (
    <>
      <div style={{ marginBottom: "24px", paddingBottom: "16px", borderBottom: "2px solid #F26522" }}>
        <h2 style={{ margin: 0, color: "#333", fontSize: "24px", fontWeight: "bold" }}>
          เพิ่มผู้ช่วยสอน
        </h2>
        <p style={{ margin: "8px 0 0 0", color: "#666", fontSize: "14px" }}>
          เลือกอาจารย์ รายวิชา และผู้ช่วยสอน
        </p>
      </div>

      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
          padding: "24px",
          backgroundColor: "#fff",
          borderRadius: "8px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.05)",
        }}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Card title="ข้อมูลผู้สอน" style={{ marginBottom: "24px" }} headStyle={{ backgroundColor: "#f8f9fa", fontWeight: "bold" }}>
            <Form.Item
              label={<span style={{ color: "#F26522", fontWeight: "bold" }}>เลือกอาจารย์</span>}
              name="teacherID"
              rules={[{ required: true, message: "กรุณาเลือกอาจารย์" }]}
            >
              <Select placeholder="เลือกอาจารย์" size="large" onChange={handleTeacherChange}>
                {teachers.map((t) => (
                  <Option key={t.ID} value={t.ID}>
                    {t.Firstname} {t.Lastname}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label={<span style={{ color: "#F26522", fontWeight: "bold" }}>เลือกรายวิชา</span>}
              name="courseID"
              rules={[{ required: true, message: "กรุณาเลือกรายวิชา" }]}
            >
              <Select placeholder="เลือกรายวิชา" size="large">
                {filteredCourses.map((c) => (
                  <Option key={c.AllCoursesID} value={c.AllCoursesID}>
                    {c.AllCoursesID} - {c.AllCoursesID}{" "}
                    {c.UserID?.map((t) => `(${t.Firstname} ${t.Lastname})`).join(", ")}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Card>

          <Card title="ข้อมูลผู้ช่วยสอน" headStyle={{ backgroundColor: "#f8f9fa", fontWeight: "bold" }}>
            <Form.List name="assistants" initialValue={[undefined]}>
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Form.Item
                      key={key}
                      label={
                        <span style={{ color: "#F26522", fontWeight: "bold" }}>
                          ผู้ช่วยสอนคนที่ {name + 1}
                        </span>
                      }
                      required
                    >
                      <Space align="baseline">
                        <Form.Item
                          {...restField}
                          name={name}
                          rules={[{ required: true, message: "กรุณาเลือกผู้ช่วยสอน" }]}
                          noStyle
                        >
                          <Select placeholder="เลือกผู้ช่วยสอน" style={{ width: 300 }}>
                            {assistants.map((a) => (
                              <Option key={a.ID} value={a.ID}>
                                {a.Firstname} {a.Lastname}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                        {fields.length > 1 && (
                          <MinusCircleOutlined
                            onClick={() => remove(name)}
                            style={{ color: "red" }}
                          />
                        )}
                      </Space>
                    </Form.Item>
                  ))}
                  <Button type="dashed" onClick={() => add()} block>
                    + เพิ่มผู้ช่วยสอน
                  </Button>
                </>
              )}
            </Form.List>
          </Card>

          <div style={{ textAlign: "right", marginTop: "24px" }}>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              style={{ backgroundColor: "#F26522", borderColor: "#F26522" }}
            >
              บันทึก
            </Button>
          </div>
        </Form>
      </div>
    </>
  );
};

export default AddTeachingAssistant;
