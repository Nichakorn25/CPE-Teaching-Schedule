import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Input, Select, Card, Form, InputNumber, message } from "antd";
import {
  getAllCurriculum,
  getLaboratory,
  getOfferedCoursesByMajorbyID,
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
  OfferedCourseDetailInterface,
} from "../../../interfaces/Adminpage";
import Swal from "sweetalert2";
import { upCreateOfferedCourse } from "../../../services/https/SchedulerPageService";

const { Option } = Select;

// เปรียบเทียบชื่อสาขา
const normalize = (s?: string | null) => (s ?? "").trim().toLowerCase();
// ดึงชื่อสาขาจาก curriculum
const getCurriculumMajorName = (c: any): string =>
  c?.Major?.MajorName ??
  c?.major?.MajorName ??
  c?.MajorName ??
  c?.Curriculum?.Major?.MajorName ??
  "";

const AddCoursepage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  // ───────────────── state ─────────────────
  const [allCurriculums, setAllCurriculums] = useState<CurriculumInterface[]>([]);
  const [curriculums, setCurriculums] = useState<CurriculumInterface[]>([]);
  const [courses, setCourses] = useState<AllCourseinOpenCourseInterface[]>([]);
  const [lab, setLab] = useState<LaboratoryInterface[]>([]);
  const [selectedCurriculumID, setSelectedCurriculumID] = useState<number | null>(null);

  const [academicYear, setAcademicYear] = useState<number>(0);
  const [term, setTerm] = useState<number>(0);
  const [userID, setUserID] = useState<number>();
  const [userMajor, setUserMajor] = useState<string | null>(null);

  // ───────────────── init from localStorage ─────────────────
  useEffect(() => {
    const year = localStorage.getItem("academicYear");
    const semester = localStorage.getItem("term");
    const uid = localStorage.getItem("user_id");
    const majorName = localStorage.getItem("major_name");

    if (year) setAcademicYear(parseInt(year));
    if (semester) setTerm(parseInt(semester));
    if (uid) setUserID(parseInt(uid));
    setUserMajor(majorName || null);

    if (!majorName) {
      message.info("ไม่พบสาขาของผู้ใช้ (major_name) — จะแสดงหลักสูตรทั้งหมด");
    } else {
      console.log("[DEBUG] userMajor:", majorName);
    }
  }, []);

  // ───────────────── โหลด Lab ─────────────────
  useEffect(() => {
    const fetchLab = async () => {
      const response = await getLaboratory();
      if (response.status === 200) setLab(response.data);
    };
    fetchLab();
  }, []);

  // ───────────────── โหลดหลักสูตรทั้งหมด ─────────────────
  useEffect(() => {
    const fetchCurriculums = async () => {
      const response = await getAllCurriculum();
      if (response.status === 200) setAllCurriculums(response.data);
    };
    fetchCurriculums();
  }, []);

  // ───────────────── กรองหลักสูตรตามสาขาผู้ใช้ ─────────────────
  useEffect(() => {
    if (!allCurriculums.length) return;

    const filtered =
      userMajor && normalize(userMajor).length > 0
        ? allCurriculums.filter(
            (c: any) => normalize(getCurriculumMajorName(c)) === normalize(userMajor)
          )
        : allCurriculums;

    setCurriculums(filtered);

    const current = form.getFieldValue("curriculum");
    if (current && !filtered.some((x) => x.ID === current)) {
      form.setFieldsValue({ curriculum: undefined, courseCode: undefined });
      setSelectedCurriculumID(null);
      setCourses([]);
    }

    if (!form.getFieldValue("curriculum") && filtered.length === 1) {
      form.setFieldsValue({ curriculum: filtered[0].ID });
      setSelectedCurriculumID(filtered[0].ID);
      handleCurriculumChange(filtered[0].ID);
    }
  }, [allCurriculums, userMajor]);

  // ───────────────── เปลี่ยนหลักสูตร → โหลดรายวิชา ─────────────────
  const handleCurriculumChange = async (value: number) => {
    setSelectedCurriculumID(value);
    const response = await getAllCourses();
    if (response.status === 200) {
      const filtered = response.data.filter(
        (course: AllCourseinOpenCourseInterface) =>
          course.CurriculumID === value && course.Ismain === false
      );
      setCourses(filtered);
      form.setFieldsValue({ courseCode: undefined });
    }
  };

  // ───────────────── เลือกรหัสวิชา → เติมชื่อ/credit ─────────────────
  const handleCourseCodeChange = async (courseId: number) => {
    const selectedCourse = courses.find((course) => course.ID === courseId);
    if (!selectedCourse) return;

    const response = await getCoursebyid(courseId);
    if (response.status === 200) {
      const course = response.data;
      form.setFieldsValue({
        courseCode: selectedCourse.ID,
        courseNameTh: course.ThaiName,
        courseNameEn: course.EnglishName,
        credits: course.Credit?.Unit || 0,
        labRoom: course.Laboratory?.ID || null,
        groupCount: 0,
        studentsPerGroup: 0,
      });
    }
  };

  // ───────────────── useEffect โหลดข้อมูลเก่า (edit mode) ─────────────────
  useEffect(() => {
    const fetchInitialCourse = async () => {
      if (!id) return;

      try {
        const res = await getOfferedCoursesByMajorbyID(Number(id));
        if (res.status === 200 && res.data?.length > 0) {
          const course: OfferedCourseDetailInterface = res.data[0];

          // โหลดรายวิชาใน Curriculum
          const allCoursesRes = await getAllCourses();
          let filteredCourses: AllCourseinOpenCourseInterface[] = [];
          if (allCoursesRes.status === 200) {
            filteredCourses = allCoursesRes.data.filter(
              (c: AllCourseinOpenCourseInterface) =>
                c.CurriculumID === course.CurriculumID && c.Ismain === false
            );
            setCourses(filteredCourses);
          }

          // หา selectedCourse → เอา ID
          const selectedCourse = filteredCourses.find(
            (c) => c.CourseCode === course.Code
          );

          setSelectedCurriculumID(course.CurriculumID);

          form.setFieldsValue({
            curriculum: course.CurriculumID ?? null,
            courseCode: selectedCourse?.ID,
            courseNameTh: course.ThaiCourseName ?? "",
            courseNameEn: course.EnglishCourseName ?? "",
            credits: parseInt(course.Credit, 10) || 0,
            labRoom: course.Laboratory,
            groupCount: course.TotalSections ?? 0,
            studentsPerGroup: course.Sections?.[0]?.Capacity ?? 0,
          });
        }
      } catch (error) {
        console.error("โหลดข้อมูลรายวิชาไม่สำเร็จ:", error);
      }
    };

    fetchInitialCourse();
  }, [id]);

  // ───────────────── บันทึก ─────────────────
const handleSubmit = async (values: any) => {
  try {
    const selectedCourse = courses.find((c) => c.ID === values.courseCode);
    if (!selectedCourse || selectedCourse.ID === undefined) {
      Swal.fire("ไม่พบข้อมูลรายวิชา", "กรุณาเลือกรายวิชาอีกครั้ง", "error");
      return;
    }

    // ตรวจสอบหลักสูตรตรงกับสาขาผู้ใช้
    const selectedCurric = curriculums.find((c) => c.ID === values.curriculum);
    if (
      userMajor &&
      selectedCurric &&
      normalize(getCurriculumMajorName(selectedCurric)) !== normalize(userMajor)
    ) {
      Swal.fire("ไม่อนุญาต", "หลักสูตรที่เลือกไม่ตรงกับสาขาของคุณ", "warning");
      return;
    }

    // เตรียม payload
    const payload = {
      Year: academicYear,
      Term: term,
      Section: values.groupCount, // จำนวนกลุ่มเรียน
      Capacity: values.studentsPerGroup, // นักศึกษาต่อกลุ่ม
      UserID: userID!,
      AllCoursesID: selectedCourse.ID,
      LaboratoryID: selectedCourse.Laboratory || undefined,
      Sections: selectedCourse.Sections?.map((s:any) => ({
        SectionNumber: s.SectionNumber,
        DayOfWeek: s.DayOfWeek,
        Time: s.Time,
        Capacity: s.Capacity,
        Room: s.Room,
        InstructorNames: s.InstructorNames,
      })),
    };

    console.log("Payload จะส่ง:", payload);

    // ส่งไป backend
    let res;
    if (id) {
      res = await upCreateOfferedCourse(Number(id), payload); // PUT
    } else {
      res = await postCreateOfferedCourse(payload); // POST
    }

    if (res.status === 200 || res.status === 201) {
      Swal.fire(
        "สำเร็จ",
        id
          ? `แก้ไขข้อมูลวิชา <b>${selectedCourse.EnglishCourseName} - ${selectedCourse.ThaiCourseName}</b> แล้ว`
          : `เพิ่มวิชา <b>${selectedCourse.EnglishCourseName} - ${selectedCourse.ThaiCourseName}</b><br>เป็นรายวิชาที่เปิดสอนใน <b>เทอม ${term} ปีการศึกษา ${academicYear}</b> เรียบร้อยแล้ว`,
        "success"
      ).then(() => navigate("/all-open-course"));
    } else {
      Swal.fire("ผิดพลาด", "ไม่สามารถบันทึกข้อมูลได้", "error");
    }
  } catch (error) {
    console.error("Error handleSubmit:", error);
    Swal.fire("ผิดพลาด", "เกิดข้อผิดพลาดระหว่างบันทึกข้อมูล", "error");
  }
};


  // ───────────────── UI ─────────────────
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
          เพิ่มรายวิชาที่ต้องการเปิดสอน
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
              {/* ── Curriculum (กรองตามสาขาผู้ใช้) ── */}
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
                  notFoundContent={
                    userMajor
                      ? "ไม่พบหลักสูตรที่ตรงกับสาขาของคุณ"
                      : "ไม่พบข้อมูลหลักสูตร"
                  }
                >
                  {curriculums.map((c: any) => (
                    <Option key={c.ID} value={c.ID}>
                      {c.CurriculumName}
                      {getCurriculumMajorName(c)
                        ? ` — ${getCurriculumMajorName(c)}`
                        : ""}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              {/* ── Course Code ── */}
              <Form.Item
  label="รหัสวิชา"
  name="courseCode"
  rules={[{ required: true, message: "กรุณาเลือกรหัสวิชา" }]}
>
  <Select
    placeholder={selectedCurriculumID ? "เลือกรหัสวิชาตามหลักสูตร" : "กรุณาเลือกหลักสูตรก่อน"}
    size="large"
    onChange={handleCourseCodeChange}
    showSearch
    optionFilterProp="children"
    allowClear
    disabled={!selectedCurriculumID}
  >
    {courses.map((c) => (
      <Option key={c.ID} value={c.ID}>
        {c.CourseCode} - {c.EnglishCourseName} {c.ThaiCourseName} {/* ข้อความแสดง */}
      </Option>
    ))}
  </Select>
</Form.Item>


              {/* ── Names ── */}
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

              {/* ── Credit & Lab ── */}
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
            <Button
              size="large"
              style={{ minWidth: "100px" }}
              onClick={() => navigate("/all-open-course")}
            >
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
