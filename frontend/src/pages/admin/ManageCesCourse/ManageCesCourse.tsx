import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Button,
  Input,
  Select,
  Card,
  Form,
  InputNumber,
  message,
  Row,
  Col,
  TimePicker,
} from "antd";
import dayjs from "dayjs";
import { SaveOutlined, PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import {
  getAllCurriculum,
  getLaboratory,
  getOfferedCoursesByMajorbyID,
  getAllAcademicYears,
} from "../../../services/https/GetService";
import {
  putUpdateFixedCourse,
  getAllCourses,
  postCreateTimeFixedCourses,
} from "../../../services/https/AdminPageServices";
import {
  CurriculumInterface,
  AllCourseinOpenCourseInterface,
  LaboratoryInterface,
  AcademicYearInterface,
} from "../../../interfaces/Adminpage";
import { TimeFixedCoursesIn } from "../../../interfaces/TimeFix";
import { getNameTable } from "../../../services/https/SchedulerPageService";
import { UpdateFixedCourse } from "../../../interfaces/UpFixedCourse";
import Swal from "sweetalert2";

const { Option } = Select;

const ManageCesCourse: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [containerWidth, setContainerWidth] = useState(window.innerWidth);
  const [fixedSections, setFixedSections] = useState([
    {
      sectionInFixed: 1,
      dayOfWeek: "",
      startTime: "",
      endTime: "",
      roomFix: "",
    },
  ]);
  const [editingCourseID, setEditingCourseID] = useState<number | null>(null);

  // Monitor container width for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setContainerWidth(window.innerWidth);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = containerWidth < 768;

  const [curriculums, setCurriculums] = useState<CurriculumInterface[]>([]);
  const [courses, setCourses] = useState<AllCourseinOpenCourseInterface[]>([]);
  const [lab, setLab] = useState<LaboratoryInterface[]>([]);
  const [selectedCurriculumID, setSelectedCurriculumID] = useState<
    number | null
  >(null);
  const [academicYear, setAcademicYear] = useState<number>(0);
  const [term, setTerm] = useState<number>(0);
  const [userID, setUserID] = useState<number>();
  const [loading, setLoading] = useState(false);
  const [nameTables, setNameTables] = useState<string[]>([]);
  const [selectedNameTable, setSelectedNameTable] = useState<string>("");
  const [groupCount, setGroupCount] = useState<number>(1);
  const [academicYears, setAcademicYears] = useState<AcademicYearInterface[]>([]);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<AcademicYearInterface | null>(null);

  useEffect(() => {
    const year = localStorage.getItem("academicYear");
    const semester = localStorage.getItem("term");
    const uid = localStorage.getItem("user_id");

    if (year) setAcademicYear(parseInt(year));
    if (semester) setTerm(parseInt(semester));
    if (uid) setUserID(parseInt(uid));
  }, []);

  // ดึงชื่อจาก localStorage
  useEffect(() => {
    const year = localStorage.getItem("academicYear");
    const term = localStorage.getItem("term");

    if (year && term) {
      const autoNameTable = `ปีการศึกษา ${year} เทอม ${term}`;
      setSelectedNameTable(autoNameTable);
      form.setFieldsValue({ nameTable: autoNameTable });
    }
  }, [form]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [curriculumRes, labRes, nameTableRes, yearRes] = await Promise.all([
          getAllCurriculum(),
          getLaboratory(),
          getNameTable(),
          getAllAcademicYears(),
        ]);

        if (curriculumRes.status === 200) {
          setCurriculums(curriculumRes.data);
        }

        if (labRes.status === 200) {
          setLab(labRes.data);
        }

        if (nameTableRes.status === 200) {
          setNameTables(nameTableRes.data.name_tables || []);
          // Set default NameTable if available
          if (
            nameTableRes.data.name_tables &&
            nameTableRes.data.name_tables.length > 0
          ) {
            setSelectedNameTable(nameTableRes.data.name_tables[0]);
          }
        }

        if (yearRes.status === 200) {
          setAcademicYears(yearRes.data);
        }
      } catch (error) {
        message.error("เกิดข้อผิดพลาดในการโหลดข้อมูล");
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchCourseData = async () => {
      if (!id) return;

      try {
        const res = await getOfferedCoursesByMajorbyID(Number(id));
        if (res.status === 200 && res.data && res.data.length > 0) {
          const course = res.data[0]; // response เป็น array
          setEditingCourseID(course.ID); // <- บันทึก ID ที่จะแก้ไข
          setSelectedCurriculumID(course.CurriculumID);
          setCourses([course]);
          
          // เพิ่มการตั้งค่า AcademicYearID ถ้ามีข้อมูลใน course
          const academicYearID = course.AcademicYearID || 1; // fallback ไปปี 1
          
          // หา selectedAcademicYear จาก academicYears
          if (academicYears.length > 0) {
            const yearFound = academicYears.find(a => a.ID === academicYearID);
            if (yearFound) {
              setSelectedAcademicYear(yearFound);
            }
          }
          
          form.setFieldsValue({
            curriculum: course.CurriculumID,
            Code: course.ID,
            courseNameTh: course.ThaiCourseName,
            courseNameEn: course.EnglishCourseName,
            AcademicYearID: academicYearID,
            labRoom:
              course.Laboratory !== "ไม่มีการสอนปฏิบัติการ"
                ? course.Laboratory
                : "ไม่มีการสอนปฏิบัติการ",
            groupCount: course.TotalSections || 1,
            studentsPerGroup: course.Sections?.[0]?.Capacity || 30,
          });

          if (course.Sections && course.Sections.length > 0) {
            setFixedSections(
              course.Sections.map((s: any, index: number) => {
                const [startTime, endTime] = s.Time.split(" - ");
                return {
                  sectionInFixed: index + 1,
                  dayOfWeek: s.DayOfWeek,
                  startTime: startTime,
                  endTime: endTime,
                  roomFix: s.Room || "",
                };
              })
            );
          }
        }
      } catch (error) {
        message.error("เกิดข้อผิดพลาดในการโหลดข้อมูลรายวิชา");
        console.error(error);
      }
    };

    fetchCourseData();
  }, [id, form, academicYears]);

  const handleCurriculumChange = async (value: number) => {
    setSelectedCurriculumID(value);
    try {
      const response = await getAllCourses();
      if (response.status === 200) {
        const filtered = response.data.filter(
          (course: AllCourseinOpenCourseInterface) =>
            course.CurriculumID === value
        );
        setCourses(filtered);
      }
    } catch (error) {
      message.error("เกิดข้อผิดพลาดในการโหลดรายวิชา");
    }
  };

  // เมื่อ fixedSections เปลี่ยน ให้ซิงค์ groupCount
  useEffect(() => {
    setGroupCount(fixedSections.length);
  }, [fixedSections]);

 // เพิ่ม/ลบ section และซิงค์กับ groupCount
const handleAddSection = () => {
  const newSection = {
    sectionInFixed: fixedSections.length + 1,
    dayOfWeek: "",
    startTime: "",
    endTime: "",
    roomFix: "",
  };
  const updated = [...fixedSections, newSection];
  setFixedSections(updated);
  setGroupCount(updated.length); // ซิงค์กับ groupCount
};

const handleRemoveSection = (index: number) => {
  const updated = fixedSections.filter((_, i) => i !== index)
    .map((sec, i) => ({ ...sec, sectionInFixed: i + 1 })); // รีอัพเดตหมายเลขกลุ่ม
  setFixedSections(updated);
  setGroupCount(updated.length); // ซิงค์กับ groupCount
};

// เมื่อเปลี่ยนจำนวนกลุ่มเรียน ให้ซิงค์ fixedSections
const handleGroupCountChange = (value: number | null) => {
  if (value === null) return;

  const currentLength = fixedSections.length;
  if (value > currentLength) {
    // เพิ่ม section
    const newSections = Array.from(
      { length: value - currentLength },
      (_, i) => ({
        sectionInFixed: currentLength + i + 1,
        dayOfWeek: "",
        startTime: "",
        endTime: "",
        roomFix: "",
      })
    );
    setFixedSections([...fixedSections, ...newSections]);
  } else if (value < currentLength) {
    // ลด section
    const updated = fixedSections.slice(0, value);
    setFixedSections(updated);
  }
  setGroupCount(value); // อัปเดต groupCount
};

  const handleCourseCodeChange = (courseId: number) => {
    const selectedCourse = courses.find((course) => course.ID === courseId);
    if (selectedCourse) {
      form.setFieldsValue({
        Code: selectedCourse.ID,
        courseNameTh: selectedCourse.ThaiCourseName,
        courseNameEn: selectedCourse.EnglishCourseName,
        labRoom:
          selectedCourse.Laboratory !== "ไม่มีการสอนปฏิบัติการ"
            ? selectedCourse.Laboratory
            : "ไม่มีการสอนปฏิบัติการ",
      });
    }
  };

  const validateForm = () => {
    const values = form.getFieldsValue();
    const requiredFields = [
      "curriculum",
      "Code",
      "courseNameTh",
      "courseNameEn",
      "AcademicYearID",
      "groupCount",
      "studentsPerGroup",
    ];

    for (const field of requiredFields) {
      if (!values[field]) return false;
    }

    if (!selectedNameTable) return false;
    if (!selectedAcademicYear) return false;

    for (const sec of fixedSections) {
      if (!sec.dayOfWeek || !sec.startTime || !sec.endTime || !sec.roomFix) {
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (values: any) => {
    if (!validateForm()) {
      Swal.fire({
        icon: "warning",
        title: "กรุณากรอกข้อมูลให้ครบถ้วนก่อนบันทึก",
      });
      return;
    }

    const selectedCourse = courses.find((c) => c.ID === values.Code);
    if (!selectedCourse || selectedCourse.ID === undefined) {
      Swal.fire({
        icon: "error",
        title: "ไม่พบข้อมูลรายวิชา",
        text: "กรุณาเลือกรายวิชาอีกครั้ง",
      });
      return;
    }

    try {
      setLoading(true);
      let successCount = 0;

      for (const section of fixedSections) {
        const payload: TimeFixedCoursesIn = {
          Year: academicYear,
          Term: term,
          Section: section.sectionInFixed,
          Capacity: values.studentsPerGroup,
          UserID: userID!,
          AllCoursesID: selectedCourse.ID,
          LaboratoryID: values.labRoom || null,
          SectionInFixed: section.sectionInFixed,
          DayOfWeek: section.dayOfWeek,
          StartTime: section.startTime,
          EndTime: section.endTime,
          RoomFix: section.roomFix,
          NameTable: selectedNameTable,
          // ลบ YearLevel ออกเพราะ interface ไม่มี property นี้
        };

        const res = await postCreateTimeFixedCourses(payload);
        if (res.status === 200 || res.status === 201) {
          successCount++;
        }
      }

      if (successCount === fixedSections.length) {
        await Swal.fire({
          icon: "success",
          title: `เพิ่มรายวิชา ${selectedCourse.CourseCode} - ${selectedCourse.EnglishCourseName} ${selectedCourse.ThaiCourseName} เรียบร้อยแล้ว`,
        });
        navigate("/all-open-course");
      } else {
        Swal.fire({
          icon: "warning",
          title: "บางกลุ่มไม่สามารถเพิ่มได้",
          text: "กรุณาตรวจสอบ",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาดในการบันทึกข้อมูล",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (values: any, courseID: number) => {
    if (!validateForm()) {
      Swal.fire({
        icon: "warning",
        title: "กรุณากรอกข้อมูลให้ครบถ้วนก่อนบันทึก",
      });
      return;
    }

    const selectedCourse = courses.find((c) => c.ID === courseID);

    try {
      setLoading(true);

      const payload: UpdateFixedCourse = {
        TotalSection: fixedSections.length,
        Capacity: values.studentsPerGroup,
        // ลบ YearLevel ออกเพราะ interface ไม่มี property นี้
        LaboratoryID:
          values.labRoom === "ไม่มีการสอนปฏิบัติการ" ? null : values.labRoom,
        Groups: fixedSections.map((section, index) => ({
          DayOfWeek: section.dayOfWeek,
          StartTime: section.startTime,
          EndTime: section.endTime,
          RoomFix: section.roomFix,
          Section: index + 1,
          Capacity: values.studentsPerGroup,
        })),
      };

      const res = await putUpdateFixedCourse(courseID, payload);

      if (res && !res.error) {
        await Swal.fire({
          icon: "success",
          title: `แก้ไขรายวิชา ${selectedCourse?.CourseCode} ${selectedCourse?.EnglishCourseName} - ${selectedCourse?.ThaiCourseName} เรียบร้อยแล้ว`,
        });
        navigate("/all-open-course");
      } else {
        Swal.fire({
          icon: "error",
          title: "เกิดข้อผิดพลาดในการอัพเดต",
          text: res.error || "",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาดในการอัพเดต",
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
            เพิ่มรายวิชาจากศูนย์บริการ
          </h1>
          <p
            style={{
              margin: 0,
              color: "#666",
              fontSize: "14px",
            }}
          >
            กรอกข้อมูลรายวิชาที่เปิดสอนจากศูนย์บริการวิชาการ (มีเวลาเรียนคงที่)
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
          onFinish={handleSubmit}
        >
          {/* Basic Course Information */}
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
                ข้อมูลพื้นฐานรายวิชา
              </span>
            }
            style={{ marginBottom: "24px" }}
          >
            <Row gutter={[16, 16]}>
              <Col xs={24}>
                <Form.Item
                  label="โครงสร้างหลักสูตร"
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
                        {c.CurriculumName}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              <Col xs={24}>
                <Form.Item
                  label="รหัสวิชา"
                  name="Code"
                  rules={[{ required: true, message: "กรุณาเลือกรหัสวิชา" }]}
                >
                  <Select
                    placeholder="เลือกรหัสวิชาตามหลักสูตร"
                    size="large"
                    onChange={handleCourseCodeChange}
                    showSearch
                    optionFilterProp="children"
                    allowClear
                    disabled={!selectedCurriculumID}
                  >
                    {courses.map((c) => (
                      <Option key={c.ID} value={c.ID}>
                        {c.CourseCode} - {c.EnglishCourseName} {c.ThaiCourseName}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="ชื่อวิชา (ภาษาไทย)"
                  name="courseNameTh"
                  rules={[
                    { required: true, message: "กรุณากรอกชื่อวิชาภาษาไทย" },
                    {
                      validator: (_, value) => {
                        if (!value) return Promise.resolve();
                        // ตรวจสอบตัวอักษรไทยและเว้นวรรค
                        return /^[ก-๙\s]+$/.test(value)
                          ? Promise.resolve()
                          : Promise.reject(
                              new Error(
                                "ชื่อวิชา (ภาษาไทย) ต้องเป็นตัวอักษรไทยเท่านั้น"
                              )
                            );
                      },
                    },
                  ]}
                >
                  <Input placeholder="ระบบฐานข้อมูล" size="large" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label="ชื่อวิชา (ภาษาอังกฤษ)"
                  name="courseNameEn"
                  rules={[
                    { required: true, message: "กรุณากรอกชื่อวิชาภาษาอังกฤษ" },
                    {
                      validator: (_, value) => {
                        if (!value) return Promise.resolve();
                        // ตรวจสอบตัวอักษรอังกฤษและเว้นวรรค
                        return /^[A-Za-z\s]+$/.test(value)
                          ? Promise.resolve()
                          : Promise.reject(
                              new Error(
                                "ชื่อวิชา (ภาษาอังกฤษ) ต้องเป็นตัวอักษรอังกฤษเท่านั้น"
                              )
                            );
                      },
                    },
                  ]}
                >
                  <Input placeholder="Database System" size="large" />
                </Form.Item>
              </Col>
            </Row>

            {/* เพิ่มฟิลด์ชั้นปี */}
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="ชั้นปีที่สามารถเรียนได้"
                  name="AcademicYearID"
                  rules={[
                    { required: true, message: "กรุณาเลือกชั้นปีที่สามารถเรียนได้" },
                  ]}
                >
                  <Select
                    placeholder="เลือกชั้นปีที่สามารถเรียนได้"
                    size="large"
                    value={selectedAcademicYear?.ID?.toString() || undefined}
                    onChange={(value) => {
                      const found = academicYears.find(
                        (a) => a.ID === Number(value)
                      );
                      if (found) setSelectedAcademicYear(found);
                    }}
                  >
                    {academicYears.map((a) => (
                      <Option key={a.ID} value={a.ID.toString()}>
                        {a.Level}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label="ชื่อตารางเรียน"
                  name="nameTable"
                  rules={[
                    { required: true, message: "กรุณากรอกชื่อตารางเรียน" },
                  ]}
                >
                  <Input
                    value={selectedNameTable}
                    readOnly
                    size="large"
                    style={{
                      backgroundColor: "#f0f0f0", // สีเทาอ่อน
                      cursor: "not-allowed", // เปลี่ยน cursor เพื่อบอกว่าไม่สามารถแก้ไข
                    }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="จำนวนกลุ่มเรียน"
                  name="groupCount"
                  rules={[
                    { required: true, message: "กรุณาระบุจำนวนกลุ่มเรียน" },
                  ]}
                >
                  <InputNumber
                    min={1}
                    max={50}
                    size="large"
                    style={{ width: "100%" }}
                    onChange={handleGroupCountChange}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label="นักศึกษาต่อกลุ่ม"
                  name="studentsPerGroup"
                  rules={[
                    {
                      required: true,
                      message: "กรุณากรอกจำนวนนักศึกษาต่อกลุ่ม",
                    },
                  ]}
                >
                  <InputNumber
                    placeholder="30"
                    min={1}
                    max={200}
                    size="large"
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              <Col xs={24}>
                <Form.Item label="ห้องปฏิบัติการ (ถ้ามี)" name="labRoom">
                  <Select
                    placeholder="เลือกห้องปฏิบัติการ"
                    size="large"
                    allowClear
                  >
                    {lab.map((l) => (
                      <Option key={l.ID} value={l.ID}>
                        {l.Room} - {l.Building}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </Card>

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
                กำหนดเวลาเรียน (สำหรับวิชาจากศูนย์บริการ)
              </span>
            }
            style={{ marginBottom: "24px" }}
          >
            {fixedSections.map((section, index) => (
              <Row gutter={[16, 16]} key={index} align="middle">
                <Col span={24}>
                  <h4 style={{ marginBottom: 8, color: "#333" }}>
                    กลุ่มที่ {section.sectionInFixed}
                  </h4>
                </Col>

                <Col xs={24} md={6}>
                  <Form.Item label="วันที่เรียน" required>
                    <Select
                      placeholder="เลือกวันที่เรียน"
                      value={section.dayOfWeek}
                      onChange={(val: string | string[]) => {
                        const updated = [...fixedSections];
                        updated[index].dayOfWeek = Array.isArray(val)
                          ? val[0]
                          : val; // บังคับเป็น string
                        setFixedSections(updated);
                      }}
                      size="large"
                    >
                      {[
                        "จันทร์",
                        "อังคาร",
                        "พุธ",
                        "พฤหัสบดี",
                        "ศุกร์",
                        "เสาร์",
                        "อาทิตย์",
                      ].map((day) => (
                        <Option key={day} value={day}>
                          {day}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={12} md={4}>
                  <Form.Item label="เวลาเริ่ม" required>
                    <TimePicker
                      value={
                        section.startTime
                          ? dayjs(section.startTime, "HH:mm")
                          : null
                      }
                      onChange={(time, timeString) => {
                        const updated = [...fixedSections];
                        // ตรวจสอบว่า timeString เป็น array หรือไม่
                        updated[index].startTime = Array.isArray(timeString)
                          ? timeString[0]
                          : timeString || "";
                        setFixedSections(updated);
                      }}
                      format="HH:mm"
                      size="large"
                      style={{ width: "100%" }}
                    />
                  </Form.Item>
                </Col>

                <Col xs={12} md={4}>
                  <Form.Item label="เวลาสิ้นสุด" required>
                    <TimePicker
                      value={
                        section.endTime ? dayjs(section.endTime, "HH:mm") : null
                      }
                      onChange={(time, timeString) => {
                        const updated = [...fixedSections];
                        updated[index].endTime = Array.isArray(timeString)
                          ? timeString[0]
                          : timeString || "";
                        setFixedSections(updated);
                      }}
                      format="HH:mm"
                      size="large"
                      style={{ width: "100%" }}
                    />
                  </Form.Item>
                </Col>

                <Col xs={12} md={6}>
                  <Form.Item label="ห้องเรียน" required>
                    <Input
                      placeholder="Lecture A"
                      value={section.roomFix}
                      onChange={(e) => {
                        const updated = [...fixedSections];
                        updated[index].roomFix = e.target.value;
                        setFixedSections(updated);
                      }}
                      size="large"
                    />
                  </Form.Item>
                </Col>

                <Col xs={4}>
                  {fixedSections.length > 1 && (
                    <Button
                      icon={<DeleteOutlined />}
                      danger
                      onClick={() => handleRemoveSection(index)}
                      style={{ marginTop: "30px" }}
                    />
                  )}
                </Col>
              </Row>
            ))}

            <div
              style={{
                marginTop: "16px",
                padding: "12px",
                backgroundColor: "#e6f7ff",
                borderRadius: "6px",
                border: "1px solid #91d5ff",
                fontSize: "13px",
                color: "#F26522",
              }}
            >
              <strong>💡 หมายเหตุ:</strong>{" "}
              วิชาจากศูนย์บริการจะถูกเพิ่มเข้าในตารางเรียนที่เลือก
              และจะมีเวลาเรียนคงที่ที่ไม่สามารถปรับเปลี่ยนผ่านระบบจัดตารางอัตโนมัติได้
            </div>
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
              onClick={() => navigate("/all-open-course")}
              style={{ width: isMobile ? "100%" : "auto" }}
            >
              ยกเลิก
            </Button>

            <Button
              type="primary"
              size="large"
              icon={<SaveOutlined />}
              onClick={async () => {
                const values = form.getFieldsValue();
                if (editingCourseID) {
                  await handleUpdate(values, editingCourseID);
                } else {
                  await handleSubmit(values);
                }
              }}
              loading={loading}
              style={{
                backgroundColor: "#F26522",
                borderColor: "#F26522",
                color: "#fff",
              }}
            >
              {loading ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
            </Button>
          </div>
        </Form>
      </Card>

      {/* Help Text */}
      <Card style={{ marginTop: "16px", backgroundColor: "#f8f9fa" }}>
        <div style={{ fontSize: "12px", color: "#666" }}>
          <strong>💡 คำแนะนำการใช้งาน:</strong>
          <ul style={{ margin: "8px 0 0 20px", paddingLeft: 0 }}>
            <li>เลือกชื่อตารางเรียนที่ต้องการเพิ่มวิชาเข้าไป</li>
            <li>เลือกหลักสูตรก่อนเพื่อแสดงรายวิชาที่เกี่ยวข้อง</li>
            <li>เลือกชั้นปีให้ตรงกับกลุ่มนักศึกษาที่จะเรียน</li>
            <li>รายวิชาจากศูนย์บริการจะมีการกำหนดเวลาเรียนคงที่</li>
            <li>ระบุวัน เวลา และห้องเรียนให้ชัดเจน</li>
            <li>ห้องปฏิบัติการเป็นข้อมูลเสริม ไม่จำเป็นต้องระบุ</li>
            <li>วิชาจากศูนย์บริการจะไม่สามารถเปลี่ยนเวลาเรียนได้ ภายหลัง</li>
          </ul>
        </div>
      </Card>
    </div>
  );
};

export default ManageCesCourse;