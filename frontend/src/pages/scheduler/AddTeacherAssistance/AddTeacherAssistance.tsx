import React, { useEffect, useState } from "react";
import { Button, Select, Form, Card, message, Space } from "antd";
import {
  getAllTeachers,
  getOpenCourses,
  getAllTeachingAssistants,
  // postAssignTeachingAssistants,
} from "../../../services/https/AdminPageServices";
import { TeachingAssistantInterface } from "../../../interfaces/TeachingAssistant";
import { OpenCourseInterface } from "../../../interfaces/Adminpage";
import { MinusCircleOutlined } from "@ant-design/icons";

const { Option } = Select;

const AddTeachingAssistant: React.FC = () => {
  const [form] = Form.useForm();
  const [courses, setCourses] = useState<OpenCourseInterface[]>([]);
  const [assistants, setAssistants] = useState<TeachingAssistantInterface[]>(
    []
  );
  const [selectedCourse, setSelectedCourse] =
    useState<OpenCourseInterface | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const courseRes = await getOpenCourses();
      if (courseRes.status === 200 && Array.isArray(courseRes.data?.data)) {
        setCourses(courseRes.data.data);
      }

      const assistantRes = await getAllTeachingAssistants();
      if (assistantRes.status === 200 && Array.isArray(assistantRes.data)) {
        setAssistants(assistantRes.data);
      }
    };

    fetchData();
  }, []);


  const handleCourseChange = (courseID: number) => {
    const course = courses.find((c) => c.ID === courseID) || null;
    console.log("เลือกวิชา:", course);
    setSelectedCourse(course);
    form.setFieldValue("assistantsPerGroup", []);
  };

  const handleSubmit = async (values: any) => {
    const payload = values.assistantsPerGroup.map((group: any) => ({
      courseID: values.courseID,
      group: group.group,
      assistantIDs: group.assistantIDs,
    }));

    console.log("Payload ที่จะส่ง:", payload);

    // const res = await postAssignTeachingAssistants(payload);
    // if (res.status === 200 || res.status === 201) {
    //   message.success("บันทึกข้อมูลสำเร็จ");
    //   form.resetFields();
    //   setSelectedCourse(null);
    // } else {
    //   message.error("เกิดข้อผิดพลาดในการบันทึก");
    // }
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
          เพิ่มผู้ช่วยสอน
        </h2>
        <p style={{ margin: "8px 0 0 0", color: "#666", fontSize: "14px" }}>
          เลือกรายวิชา แล้วเพิ่มผู้ช่วยสอนแยกตามกลุ่มเรียน
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
          <Card
            title="เลือกรายวิชา"
            style={{ marginBottom: "24px" }}
            headStyle={{ backgroundColor: "#f8f9fa", fontWeight: "bold" }}
          >
            <Form.Item
              label={
                <span style={{ color: "#F26522", fontWeight: "bold" }}>
                  รายวิชา
                </span>
              }
              name="courseID"
              rules={[{ required: true, message: "กรุณาเลือกรายวิชา" }]}
            >
              <Select
                placeholder="เลือกรายวิชา"
                size="large"
                onChange={handleCourseChange}
              >
                {courses.map((c) => (
                  <Option key={c.ID} value={c.ID}>
                    {c.Code} - {c.Name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Card>

          {selectedCourse && (
            <>
              <Card
                title="อาจารย์ผู้สอน"
                style={{ marginBottom: "24px" }}
                headStyle={{ backgroundColor: "#f8f9fa", fontWeight: "bold" }}
              >
                {selectedCourse.Teachers &&
                selectedCourse.Teachers.length > 0 ? (
                  <ul>
                    {selectedCourse?.Teachers.map((t) => (
                      <li key={t.ID}>
                        {t.Title} {t.Firstname} {t.Lastname}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ color: "#999" }}>ไม่มีข้อมูลอาจารย์ผู้สอน</p>
                )}
              </Card>

              <Card
                title="ข้อมูลผู้ช่วยสอนแยกตามกลุ่มเรียน"
                headStyle={{ backgroundColor: "#f8f9fa", fontWeight: "bold" }}
              >
                <Form.List name="assistantsPerGroup">
                  {(fields, { add, remove }) => (
                    <>
                      {selectedCourse.GroupInfos.map((group, groupIdx) => (
                        <div
                          key={groupIdx}
                          style={{
                            marginBottom: 24,
                            borderBottom: "1px solid #eee",
                            paddingBottom: 16,
                          }}
                        >
                          <p style={{ fontWeight: "bold", color: "#F26522" }}>
                            กลุ่ม {group.Group} - {group.Day} {group.TimeSpan}{" "}
                            ห้อง {group.Room}
                          </p>

                          {/* ซ่อนข้อมูลกลุ่ม */}
                          <Form.Item
                            name={[groupIdx, "group"]}
                            initialValue={group.Group}
                            hidden
                          >
                            <input />
                          </Form.Item>

                          <Form.List name={[groupIdx, "assistantIDs"]}>
                            {(
                              assistantFields,
                              { add: addAssistant, remove: removeAssistant }
                            ) => (
                              <>
                                {assistantFields.map((field, idx) => (
                                  <div
                                    key={field.key}
                                    style={{
                                      display: "flex",
                                      marginBottom: 8,
                                      gap: 8,
                                    }}
                                  >
                                    <Form.Item
                                      {...field}
                                      name={[field.name]}
                                      rules={[
                                        {
                                          required: true,
                                          message: "กรุณาเลือกผู้ช่วยสอน",
                                        },
                                      ]}
                                      style={{ flex: 1, marginBottom: 0 }} // ✅ ทำให้เต็ม
                                    >
                                      <Select
                                        placeholder="เลือกผู้ช่วยสอน"
                                        style={{ width: "100%" }} // ✅ เต็มแนวกว้าง
                                        showSearch
                                        optionFilterProp="children"
                                        filterOption={(input, option) =>
                                          String(option?.children)
                                            .toLowerCase()
                                            .includes(input.toLowerCase())
                                        }
                                      >
                                        {assistants.map((a) => (
                                          <Option key={a.ID} value={a.ID}>
                                            {a.Title?.Title} {a.Firstname}{" "}
                                            {a.Lastname}
                                          </Option>
                                        ))}
                                      </Select>
                                    </Form.Item>

                                    <Button
                                      icon={<MinusCircleOutlined />}
                                      onClick={() =>
                                        removeAssistant(field.name)
                                      }
                                      danger
                                      type="text"
                                    />
                                  </div>
                                ))}

                                <Form.Item style={{ marginTop: 8 }}>
                                  <Button
                                    type="dashed"
                                    onClick={() => addAssistant()}
                                    block
                                    icon="＋"
                                  >
                                    เพิ่มผู้ช่วยสอนสำหรับกลุ่มนี้
                                  </Button>
                                </Form.Item>
                              </>
                            )}
                          </Form.List>
                        </div>
                      ))}
                    </>
                  )}
                </Form.List>
              </Card>
            </>
          )}

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
