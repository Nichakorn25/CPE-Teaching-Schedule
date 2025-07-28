import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Input, Select, Card, Form, InputNumber, message } from "antd";
import {
  getAllCurriculum,
  getLaboratory,
} from "../../../services/https/GetService";
import {
  getCoursebyid,
  getAllCourses,
  postCreateOfferedCourse,
} from "../../../services/https/AdminPageServices";
import {
  CurriculumInterface,
  AllCourseinOpenCourseInterface,
  LaboratoryInterface,
} from "../../../interfaces/Adminpage";
import Swal from "sweetalert2";
import { upCreateOfferedCourse } from "../../../services/https/SchedulerPageService";
import { useParams } from "react-router-dom";

const { Option } = Select;

const AddCoursepage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [curriculums, setCurriculums] = useState<CurriculumInterface[]>([]);
  const [courses, setCourses] = useState<AllCourseinOpenCourseInterface[]>([]);
  const [lab, setLab] = useState<LaboratoryInterface[]>([]);
  const [selectedCurriculumID, setSelectedCurriculumID] = useState<
    number | null
  >(null);
  const [academicYear, setAcademicYear] = useState<number>(0);
  const [term, setTerm] = useState<number>(0);
  const [userID, setUserID] = useState<number>();

  useEffect(() => {
    const year = localStorage.getItem("academicYear");
    const semester = localStorage.getItem("term");
    const uid = localStorage.getItem("user_id");

    if (year) setAcademicYear(parseInt(year));
    if (semester) setTerm(parseInt(semester));
    if (uid) setUserID(parseInt(uid));
  }, []);

  useEffect(() => {
    if (id) {
      const fetchExistingCourse = async () => {
        const res = await getCoursebyid(Number(id));
        if (res.status === 200) {
          const course = res.data;
          form.setFieldsValue({
            curriculum: course.CurriculumID,
            courseCode: course.ID,
            courseNameTh: course.ThaiName,
            courseNameEn: course.EnglishName,
            credits: course.Credit?.Unit || 0,
            labRoom: course.Laboratory?.ID || null,
            groupCount: course.Section,
            studentsPerGroup: course.Capacity,
          });

          // โหลดรายวิชาทั้งหมดในหลักสูตรเดียวกันเพื่อใช้ใน dropdown
          await handleCurriculumChange(course.CurriculumID);
        }
      };
      fetchExistingCourse();
    }
  }, [id]);

  useEffect(() => {
    const fetchLab = async () => {
      const response = await getLaboratory();
      console.log("Lab: ", response);
      if (response.status === 200) {
        setLab(response.data);
      }
    };
    fetchLab();
  }, []);

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
          courseCode: selectedCourse.ID, // ใช้จาก courses
          courseNameTh: course.ThaiName,
          courseNameEn: course.EnglishName,
          credits: course.Credit?.Unit || 0,
          labRoom: course.Laboratory?.ID || null,
          groupCount: 0,
          studentsPerGroup: 0,
        });
      }
    }
  };

  const handleSubmit = async (values: any) => {
    const selectedCourse = courses.find((c) => c.ID === values.courseCode);
    if (!selectedCourse || selectedCourse.ID === undefined) {
      Swal.fire("ไม่พบข้อมูลรายวิชา", "กรุณาเลือกรายวิชาอีกครั้ง", "error");
      return;
    }

    const payload = {
      Year: academicYear,
      Term: term,
      Section: values.groupCount,
      Capacity: values.studentsPerGroup,
      UserID: userID!,
      AllCoursesID: selectedCourse.ID, 
      LaboratoryID: values.labRoom || undefined,
    };

    let res;
    if (id) {
      res = await upCreateOfferedCourse(Number(id), payload); // PUT
    } else {
      res = await postCreateOfferedCourse(payload); // POST
    }

    if (res.status === 200 || res.status === 201) {
      Swal.fire(
        "สำเร็จ",
        id ? `แก้ไขข้อมูลวิชา <b>${selectedCourse.CourseName}</b>  แล้ว` : `เพิ่มวิชา <b>${selectedCourse.CourseName}</b><br>เป็นรายวิชาที่เปิดสอนใน <b>เทอม ${term} ปีการศึกษา ${academicYear}</b> เรียบร้อยแล้ว`,
        "success"
      ).then(() => navigate("/all-open-course"));
    } else {
      Swal.fire("ผิดพลาด", "ไม่สามารถบันทึกข้อมูลได้", "error");
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
        <Form
          form={form}
          layout="vertical"
          style={{ width: "100%" }}
          onFinish={handleSubmit}
        >
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
                  placeholder="1"
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
              onClick={() => form.submit()}
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
