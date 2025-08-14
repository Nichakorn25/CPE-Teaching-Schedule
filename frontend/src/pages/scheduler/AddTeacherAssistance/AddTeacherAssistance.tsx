// pages/Admin/AddTeacherAssistance.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Button, Select, Form, Card } from "antd";
import Swal from "sweetalert2";
import { MinusCircleOutlined } from "@ant-design/icons";

import {
  getAllTeachers,
  getOpenCourses,
  getAllTeachingAssistants,
} from "../../../services/https/AdminPageServices";

import { postCreateTA } from "../../../services/https/SchedulerPageService";
import { TeachingAssistantInterface } from "../../../interfaces/TeachingAssistant";
import { OpenCourseInterface } from "../../../interfaces/Adminpage";

const { Option } = Select;

const AddTeachingAssistant: React.FC = () => {
  const [form] = Form.useForm();
  const [courses, setCourses] = useState<OpenCourseInterface[]>([]);
  const [assistants, setAssistants] = useState<TeachingAssistantInterface[]>(
    []
  );
  const [selectedCourse, setSelectedCourse] =
    useState<OpenCourseInterface | null>(null);

  // อ่านปี/เทอมจาก localStorage เพื่อสร้าง name_table อัตโนมัติ
  const [academicYear, setAcademicYear] = useState<string>(
    () => localStorage.getItem("academicYear") || ""
  );
  const [term, setTerm] = useState<string>(
    () => localStorage.getItem("term") || ""
  );

  // ถ้ามีการเปลี่ยนค่าใน localStorage (เช่นหน้าอื่นอัปเดต) จะ sync ให้ด้วย
  useEffect(() => {
    const onStorage = () => {
      setAcademicYear(localStorage.getItem("academicYear") || "");
      setTerm(localStorage.getItem("term") || "");
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // สร้างชื่อตารางจากปี/เทอม
  const nameTable = useMemo(() => {
    if (!academicYear || !term) return "";
    return `ปีการศึกษา ${academicYear} เทอม ${term}`;
  }, [academicYear, term]);

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

      // ไม่จำเป็นในหน้านี้ แต่มีในระบบอยู่แล้ว
      await getAllTeachers().catch(() => {});
    };

    fetchData();
  }, []);

  const handleCourseChange = (courseID: number) => {
    const course = courses.find((c) => c.ID === courseID) || null;
    setSelectedCourse(course);

    // เตรียมค่าเริ่มต้นให้ครบทุกกลุ่ม (กัน undefined ตอน submit)
    if (course) {
      const init = (course.GroupInfos || []).map((g: any) => ({
        group: g.Group,
        assistantIDs: [],
      }));
      form.setFieldsValue({ assistantsPerGroup: init });
    } else {
      form.setFieldsValue({ assistantsPerGroup: [] });
    }
  };

  const handleSubmit = async (values: any) => {
    if (!selectedCourse) {
      Swal.fire({
        icon: "warning",
        title: "กรุณาเลือกรายวิชา",
        confirmButtonText: "ตกลง",
      });
      return;
    }

    if (!nameTable) {
      Swal.fire({
        icon: "warning",
        title: "ยังไม่มีปี/เทอม",
        text: "กรุณาตั้งค่า academicYear และ term ในระบบก่อน",
        confirmButtonText: "ตกลง",
      });
      return;
    }

    const list = Array.isArray(values.assistantsPerGroup)
      ? values.assistantsPerGroup
      : [];

    // รวม TA จากทุกกลุ่มให้เหลือชุดเดียว (unique) และแปลงเป็น number
    const teachingAssistantIDs: number[] = Array.from(
      new Set(
        list.flatMap((g: any) =>
          Array.isArray(g?.assistantIDs) ? g.assistantIDs : []
        )
      )
    ).map((id: any) => Number(id));

    if (teachingAssistantIDs.length === 0) {
      Swal.fire({
        icon: "info",
        title: "ยังไม่ได้เลือกผู้ช่วยสอน",
        text: "กรุณาเพิ่มผู้ช่วยอย่างน้อย 1 คน",
        confirmButtonText: "ตกลง",
      });
      return;
    }

    const payload = {
      offered_courses_id: Number(selectedCourse.ID),
      name_table: nameTable,
      teaching_assistant_ids: teachingAssistantIDs,
    };

    console.log("Assign TA payload >>", payload);

    const res = await postCreateTA(payload);
    if (res?.status === 200 || res?.status === 201) {
      Swal.fire({
        icon: "success",
        title: "บันทึกข้อมูลสำเร็จ",
        showConfirmButton: false,
        timer: 1500,
      });
      form.resetFields();
      setSelectedCourse(null);
    } else {
      const detail =
        (res?.data &&
          (res.data.details || res.data.error || res.data.message)) ||
        (res ? JSON.stringify(res.data) : "ไม่ทราบสาเหตุ");
      console.error("postCreateTA error:", res?.status, res?.data);
      Swal.fire({
        icon: "error",
        title: `บันทึกล้มเหลว${res?.status ? ` (${res.status})` : ""}`,
        confirmButtonText: "ตกลง",
      });
    }
  };

  return (
    <>
      <div
        style={{
          marginBottom: 24,
          paddingBottom: 16,
          borderBottom: "2px solid #F26522",
        }}
      >
        <h2
          style={{ margin: 0, color: "#333", fontSize: 24, fontWeight: "bold" }}
        >
          เพิ่มผู้ช่วยสอน
        </h2>
        <p style={{ margin: "8px 0 0 0", color: "#666", fontSize: 14 }}>
          เลือกรายวิชา ระบบจะใช้ชื่อตารางตามปี/เทอมปัจจุบันให้อัตโนมัติ
        </p>
        {nameTable && (
          <div style={{ marginTop: 8, fontWeight: 600, color: "#16a34a" }}>
            ชื่อตารางปัจจุบัน: {nameTable}
          </div>
        )}
      </div>

      <div
        style={{
          maxWidth: 1000,
          margin: "0 auto",
          padding: 24,
          backgroundColor: "#fff",
          borderRadius: 8,
          boxShadow: "0 8px 32px rgba(0,0,0,0.05)",
        }}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Card
            title="เลือกรายวิชา"
            style={{ marginBottom: 24 }}
            styles={{
              header: { backgroundColor: "#f8f9fa", fontWeight: "bold" },
            }} // แทน headStyle
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
                style={{ marginBottom: 24 }}
                styles={{
                  header: { backgroundColor: "#f8f9fa", fontWeight: "bold" },
                }}
              >
                {selectedCourse.Teachers?.length ? (
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {selectedCourse.Teachers.map((t) => (
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
                styles={{
                  header: { backgroundColor: "#f8f9fa", fontWeight: "bold" },
                }}
              >
                {(selectedCourse.GroupInfos || []).map((group, groupIdx) => (
                  <div
                    key={groupIdx}
                    style={{
                      marginBottom: 24,
                      borderBottom: "1px solid #eee",
                      paddingBottom: 16,
                    }}
                  >
                    <p
                      style={{
                        fontWeight: "bold",
                        color: "#F26522",
                        marginBottom: 12,
                      }}
                    >
                      กลุ่ม {group.Group} - {group.Day} {group.TimeSpan} ห้อง{" "}
                      {group.Room}
                    </p>

                    {/* เก็บหมายเลขกลุ่มแบบ hidden */}
                    <Form.Item
                      name={["assistantsPerGroup", groupIdx, "group"]}
                      hidden
                    >
                      <input />
                    </Form.Item>

                    <Form.List
                      name={["assistantsPerGroup", groupIdx, "assistantIDs"]}
                    >
                      {(assistantFields, { add, remove }) => (
                        <>
                          {assistantFields.map((field) => (
                            <div
                              key={field.key}
                              style={{
                                display: "flex",
                                marginBottom: 8,
                                gap: 8,
                              }}
                            >
                              <Form.Item
                                name={[field.name]}
                                rules={[
                                  {
                                    required: true,
                                    message: "กรุณาเลือกผู้ช่วยสอน",
                                  },
                                ]}
                                style={{ flex: 1, marginBottom: 0 }}
                              >
                                <Select
                                  placeholder="เลือกผู้ช่วยสอน"
                                  style={{ width: "100%" }}
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
                                onClick={() => remove(field.name)}
                                danger
                                type="text"
                              />
                            </div>
                          ))}

                          <Form.Item style={{ marginTop: 8 }}>
                            <Button type="dashed" onClick={() => add()} block>
                              เพิ่มผู้ช่วยสอนสำหรับกลุ่มนี้
                            </Button>
                          </Form.Item>
                        </>
                      )}
                    </Form.List>
                  </div>
                ))}
              </Card>
            </>
          )}

          <div style={{ textAlign: "right", marginTop: 24 }}>
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
