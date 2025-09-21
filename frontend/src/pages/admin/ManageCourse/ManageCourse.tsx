import React, { useState, useEffect } from "react";
import {
  postCreateCourse,
  getTypeofCourse,
  getTeachers,
  getCoursebyid,
  putUpdateCourse,
} from "../../../services/https/AdminPageServices";
import {
  getAllAcademicYears,
  getAllCurriculum,
  getMajorOfDepathment,
} from "../../../services/https/GetService";
import {
  CurriculumInterface,
  AcademicYearInterface,
  CreateCourseInteface,
  MajorInterface,
  DepartmentInterface,
  AllTeacher,
  CourseType,
} from "../../../interfaces/Adminpage";
import Swal from "sweetalert2";
import { useParams, useNavigate } from "react-router-dom";
import { Button, Input, Select, Card, Form, Row, Col, message } from "antd";
import { SaveOutlined, PlusOutlined, DeleteOutlined } from "@ant-design/icons";

const { Option } = Select;

const ManageCourse: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form] = Form.useForm();

  const [majors, setMajors] = useState<MajorInterface[]>([]);
  const [departments, setDepartments] = useState<DepartmentInterface[]>([]);
  const [selectedDepartmentID, setSelectedDepartmentID] = useState<
    number | null
  >(null);
  const [selectedMajorID, setSelectedMajorID] = useState<number | null>(null);
  const [filteredMajors, setFilteredMajors] = useState<MajorInterface[]>([]);
  const [allTeachers, setAllTeachers] = useState<AllTeacher[]>([]);
  const [teacherOptions, setTeacherOptions] = useState<AllTeacher[]>([]);
  const [teachers, setTeachers] = useState<AllTeacher[]>([]);
  const [curriculums, setCurriculums] = useState<CurriculumInterface[]>([]);
  const [selectedCurriculum, setSelectedCurriculum] =
    useState<CurriculumInterface | null>(null);
  const [academicYears, setAcademicYears] = useState<AcademicYearInterface[]>(
    []
  );
  const [selectedAcademicYear, setSelectedAcademicYear] =
    useState<AcademicYearInterface | null>(null);
  const [typeOfCoursesList, setTypeOfCoursesList] = useState<CourseType[]>([]);
  const [loading, setLoading] = useState(false);
  const [containerWidth, setContainerWidth] = useState(window.innerWidth);
  const [filteredTypeOfCourses, setFilteredTypeOfCourses] = useState<CourseType[]>([]);

  // console.log("Render id:", id);

  // Monitor container width for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setContainerWidth(window.innerWidth);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = containerWidth < 768;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const curriculum = await getAllCurriculum();
        const years = await getAllAcademicYears();
        setCurriculums(curriculum.data);
        setAcademicYears(years.data);
      } catch (error) {
        message.error("เกิดข้อผิดพลาดในการโหลดข้อมูล");
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const result = await getTypeofCourse();
        setTypeOfCoursesList(result.data);
      } catch (error) {
        message.error("เกิดข้อผิดพลาดในการโหลดข้อมูลประเภทรายวิชา");
      }
    };
    fetchTypes();
  }, []);

  useEffect(() => {
    const fetchMajors = async () => {
      try {
        const res = await getMajorOfDepathment();
        if (res.status === 200 && Array.isArray(res.data)) {
          const majorData = res.data as MajorInterface[];
          setMajors(majorData);

          const uniqueDepartments = Array.from(
            new Map(
              majorData.map((m) => [m.Department.ID, m.Department])
            ).values()
          );
          setDepartments(uniqueDepartments);
        }
      } catch (error) {
        message.error("เกิดข้อผิดพลาดในการโหลดข้อมูลสาขาวิชา");
      }
    };
    fetchMajors();
  }, []);

  useEffect(() => {
    const filtered = majors.filter(
      (m) => m.Department.ID === selectedDepartmentID
    );
    setFilteredMajors(filtered);
    setSelectedMajorID(0);
  }, [selectedDepartmentID, majors]);

  useEffect(() => {
    const fetchTeachers = async () => {
      if (selectedMajorID === 0) {
        setAllTeachers([]);
        setTeacherOptions([]);
        return;
      }

      try {
        const res = await getTeachers();
        if (res.status === 200) {
          const all: AllTeacher[] = res.data;
          const filtered = all.filter(
            (teacher: AllTeacher) => teacher.MajorID === selectedMajorID
          );

          setAllTeachers(filtered);
          setTeacherOptions(filtered);
        }
      } catch (error) {
        message.error("เกิดข้อผิดพลาดในการโหลดข้อมูลอาจารย์");
      }
    };

    fetchTeachers();
  }, [selectedMajorID]);

  const addTeacher = () => {
    setTeachers([
      ...teachers,
      {
        ID: 0,
        DeleteID: 0,
        Title: "",
        Firstname: "",
        Lastname: "",
        Email: "",
        EmpId: "",
        Department: "",
        Major: "",
        Position: "",
        Status: "",
        Role: "",
      },
    ]);
  };

  const removeTeacher = (index: number) => {
    setTeachers(teachers.filter((_, i) => i !== index));
  };

 const isFormValid = () => {
  const values = form.getFieldsValue();

  return (
    selectedCurriculum &&
    selectedAcademicYear &&
    values.TypeOfCoursesID &&
    values.Code &&
    values.Credit &&
    values.ThaiName &&
    values.EnglishName &&
    values.Lecture !== undefined &&
    values.Lab !== undefined &&
    values.Self !== undefined &&
    teachers.length > 0 &&
    teachers.every((t) => t.ID && t.ID > 0) // ตรวจสอบ ID > 0
  );
};

 useEffect(() => {
  const fetchCourseData = async () => {
    if (!id || curriculums.length === 0 || academicYears.length === 0) return;

    try {
      const res = await getCoursebyid(Number(id));
      if (res.status === 200 && res.data) {
        const data = res.data;

        // map teachers
        const fullTeacherObjects: AllTeacher[] =
          data.UserAllCourses?.map((item: { User: any }) => {
            const user = item.User!;
            const major = user.Major as MajorInterface;
            const department = major.Department as DepartmentInterface;

            return {
              ID: user.ID,
              Title: user.Title?.Title || "",
              Firstname: user.Firstname,
              Lastname: user.Lastname,
              Email: user.Email,
              EmpId: user.EmpId,
              Department: department,
              Major: major,
              Position: user.Position,
              Status: user.Status,
              Role: user.Role,
            };
          }) || [];

        setTeachers(fullTeacherObjects);
        setTeacherOptions(fullTeacherObjects);

       if (fullTeacherObjects.length > 0) {
  const firstTeacher = fullTeacherObjects[0];

  // บอก TypeScript ว่าเป็น object
  const department = firstTeacher.Department as unknown as { ID: number };
  const major = firstTeacher.Major as unknown as { ID: number };

  setSelectedDepartmentID(department.ID);
  setSelectedMajorID(major.ID);
}

        // set form values
        form.setFieldsValue({
          ThaiName: data.ThaiName,
          EnglishName: data.EnglishName,
          Code: data.Code,
          Credit: data.Credit?.Unit?.toString(),
          Lecture: data.Credit?.Lecture?.toString(),
          Lab: data.Credit?.Lab?.toString(),
          Self: data.Credit?.Self?.toString(),
          TypeOfCoursesID: data.TypeOfCoursesID?.toString(),
          CurriculumID: data.CurriculumID,
          AcademicYearID: data.AcademicYearID,
          UserIDs: fullTeacherObjects.map((t) => t.ID),
        });

        // Set selectedCurriculum & selectedAcademicYear หลัง curriculums/academicYears โหลดแล้ว
        const curriculumFound = curriculums.find(c => c.ID === data.CurriculumID);
        if (curriculumFound) setSelectedCurriculum(curriculumFound);

        const yearFound = academicYears.find(a => a.ID === data.AcademicYearID);
        if (yearFound) setSelectedAcademicYear(yearFound);
      }
    } catch (error) {
      message.error("เกิดข้อผิดพลาดในการโหลดข้อมูลรายวิชา");
      console.error(error);
    }
  };

  fetchCourseData();
}, [id, form, curriculums, academicYears]);


useEffect(() => {
  if (!selectedCurriculum || !typeOfCoursesList.length) {
    setFilteredTypeOfCourses([]);
    return;
  }

  const departmentID = selectedCurriculum.Major?.Department?.ID;
  if (!departmentID) {
    setFilteredTypeOfCourses([]);
    return;
  }

  // Mapping department → allowed Type numbers
  const departmentTypeMap: Record<number, number[]> = {
    1: [1, 2, 3, 4,7,8,9,10],       // คอม
    2: [5, 6],             // ไฟฟ้า
    3: [11],                // ภาษา
  };

  const allowedTypes = departmentTypeMap[departmentID] || [];

  const filtered = typeOfCoursesList.filter(tc => allowedTypes.includes(tc.Type));

  setFilteredTypeOfCourses(filtered);

  // Set default value ถ้า form ยังไม่มีค่า
  const currentTypeID = form.getFieldValue("TypeOfCoursesID");
  if (!currentTypeID && filtered.length > 0) {
    form.setFieldsValue({ TypeOfCoursesID: filtered[0].ID.toString() });
  }

  console.log("Department ID:", departmentID);
  console.log("Allowed Types:", allowedTypes);
  console.log("Filtered TypeOfCourses:", filtered);
}, [selectedCurriculum, typeOfCoursesList, form]);


  console.log("useParams id:", id);
  console.log("isFormValid:", isFormValid());
  console.log("selectedCurriculum", selectedCurriculum);
  console.log("selectedAcademicYear", selectedAcademicYear);
  console.log("form values", form.getFieldsValue());
  console.log("teachers", teachers);

 const handleCreateCourse = async (data: CreateCourseInteface) => {
  try {
    setLoading(true);
    const response = await postCreateCourse(data);

    if (response.status === 201) {
      await Swal.fire(
        "สำเร็จ",
        `เพิ่มรายวิชา ${data.Code} - ${data.EnglishName} ${data.ThaiName} เรียบร้อยแล้ว`,
        "success"
      );
      navigate("/all-course");
    }
  } catch (error: any) {
    console.error(error);

    // ตรวจสอบ duplicate key
    if (
      error.response?.data?.message?.includes("duplicate key") ||
      (error.response?.status === 500 &&
        error.response?.data?.includes("uni_all_courses_code"))
    ) {
      await Swal.fire(
        "รหัสวิชาซ้ำ",
        `รหัสวิชา ${data.Code} มีอยู่ในระบบแล้ว กรุณาเปลี่ยนรหัส`,
        "error"
      );
    } else {
      await Swal.fire(
        "ผิดพลาด",
        `ไม่สามารถเพิ่มรายวิชา ${data.Code} - ${data.EnglishName} ${data.ThaiName} ได้`,
        "error"
      );
    }
  } finally {
    setLoading(false);
  }
};

const handleUpdateCourse = async (
  courseId: number,
  data: CreateCourseInteface
) => {
  try {
    setLoading(true);
    const response = await putUpdateCourse(courseId, data);

    if (response.status === 200) {
      await Swal.fire(
        "สำเร็จ",
        `แก้ไขรายวิชา ${data.Code} - ${data.EnglishName} ${data.ThaiName} เรียบร้อยแล้ว`,
        "success"
      );
      navigate("/all-course");
    }
  } catch (error: any) {
    console.error(error);

    if (
      error.response?.data?.message?.includes("duplicate key") ||
      (error.response?.status === 500 &&
        error.response?.data?.includes("uni_all_courses_code"))
    ) {
      await Swal.fire(
        "รหัสวิชาซ้ำ",
        `รหัสวิชา ${data.Code} มีอยู่ในระบบแล้ว กรุณาเปลี่ยนรหัส`,
        "error"
      );
    } else {
      await Swal.fire(
        "ผิดพลาด",
        `ไม่สามารถแก้ไขรายวิชา ${data.Code} - ${data.EnglishName} ${data.ThaiName} ได้`,
        "error"
      );
    }
  } finally {
    setLoading(false);
  }
};

const handleSubmit = async () => {
  if (!selectedCurriculum || !selectedAcademicYear) {
    message.error("กรุณากรอกข้อมูลให้ครบถ้วน");
    return;
  }

  const values = form.getFieldsValue();
  const validTeachers = teachers.filter((t) => t.ID > 0);

  if (validTeachers.length === 0) {
    message.error("กรุณาเลือกอาจารย์ผู้สอนอย่างน้อย 1 คน");
    return;
  }

  const data: CreateCourseInteface = {
    Code: values.Code || "",
    ThaiName: values.ThaiName || "",
    EnglishName: values.EnglishName || "",
    CurriculumID: Number(values.CurriculumID),
    AcademicYearID: Number(values.AcademicYearID),
    TypeOfCoursesID: Number(values.TypeOfCoursesID),
    Unit: Number(values.Credit),
    Lecture: Number(values.Lecture),
    Lab: Number(values.Lab),
    Self: Number(values.Self),
    UserIDs: validTeachers.map((t) => Number(t.ID)),
  };

  console.log("Data to submit:", data);

  if (id) {
    await handleUpdateCourse(Number(id), data);
  } else {
    await handleCreateCourse(data);
  }
};

  // Generate number options
  const generateNumberOptions = (max: number) => {
    return Array.from({ length: max + 1 }, (_, i) => (
      <Option key={i} value={i.toString()}>
        {i}
      </Option>
    ));
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
            {id ? "แก้ไขรายวิชา" : "เพิ่มรายวิชาใหม่"}
          </h1>
          <p
            style={{
              margin: 0,
              color: "#666",
              fontSize: "14px",
            }}
          >
            {id ? "แก้ไขข้อมูลรายวิชา" : "กรอกข้อมูลรายวิชาใหม่ที่ต้องการเพิ่ม"}
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
          {/* Curriculum Selection */}
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
                โครงสร้างหลักสูตร
              </span>
            }
            style={{ marginBottom: "24px" }}
          >
            <Form.Item label="เลือกหลักสูตร" name="CurriculumID" required>
              <Select
                placeholder="-- กรุณาเลือกหลักสูตร --"
                onChange={(value) => {
                  const found = curriculums.find((c) => c.ID === Number(value));
                  if (found) setSelectedCurriculum(found); // เก็บ state เฉพาะ logic ภายใน
                }}
                size="large"
              >
                {curriculums.map((c) => (
                  <Option key={c.ID} value={c.ID}>
                    {c.CurriculumName} {/* แสดงชื่อหลักสูตร */}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Card>

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
              <Col xs={24} md={8}>
              <Form.Item label="หมวดวิชา" name="TypeOfCoursesID" required>
  <Select
    placeholder="-- กรุณาเลือกหมวดวิชา --"
    value={form.getFieldValue("TypeOfCoursesID")}
    onChange={(val) => form.setFieldsValue({ TypeOfCoursesID: val })}
    size="large"
  >
    {filteredTypeOfCourses.map((type) => (
      <Option key={type.ID} value={type.ID.toString()}>
        {type.TypeName}
      </Option>
    ))}
  </Select>
</Form.Item>

              </Col>
              <Col xs={24} md={8}>
                <Form.Item
                  label="รหัสวิชา"
                  name="Code"
                  rules={[{ required: true }]}
                >
                  <Input placeholder="กรอกรหัสวิชา" size="large" />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item
                  label="ชั้นปีที่สามารถเรียนได้"
                  name="AcademicYearID"
                  required
                >
                  <Select
                    placeholder="-- กรุณาเลือกชั้นปี --"
                    value={selectedAcademicYear?.ID?.toString() || undefined}
                    onChange={(value) => {
                      const found = academicYears.find(
                        (a) => a.ID === Number(value)
                      );
                      if (found) setSelectedAcademicYear(found);
                    }}
                    size="large"
                  >
                    {academicYears.map((a) => (
                      <Option key={a.ID} value={a.ID.toString()}>
                        {a.Level}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="หน่วยกิต"
                  name="Credit"
                  rules={[{ required: true }]}
                >
                  <Input placeholder="หน่วยกิต" size="large" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="รูปแบบชั่วโมงการสอน" required>
                  <Row gutter={[8, 8]}>
                    {[
                      { label: "บรรยาย", key: "Lecture" },
                      { label: "ปฏิบัติ", key: "Lab" },
                      { label: "เรียนรู้ด้วยตนเอง", key: "Self" },
                    ].map(({ label, key }) => (
                      <Col xs={8} key={key}>
                        <div style={{ textAlign: "center" }}>
                          <div
                            style={{
                              color: "#F26522",
                              fontWeight: "bold",
                              marginBottom: "4px",
                              fontSize: "12px",
                            }}
                          >
                            {label}
                          </div>
                          <Form.Item name={key} noStyle>
                            <Select size="large" style={{ width: "100%" }}>
                              {generateNumberOptions(10)}
                            </Select>
                          </Form.Item>
                        </div>
                      </Col>
                    ))}
                  </Row>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="ชื่อวิชา (ภาษาไทย)"
                  name="ThaiName"
                  rules={[
                    { required: true, message: "กรุณากรอกชื่อวิชา (ภาษาไทย)" },
                    {
                      validator: (_, value) => {
                        if (!value) return Promise.resolve();
                        return /^[ก-๙\s]+$/.test(value)
                          ? Promise.resolve()
                          : Promise.reject(
                              "ชื่อวิชา (ภาษาไทย) ต้องเป็นตัวอักษรไทยเท่านั้น"
                            );
                      },
                    },
                  ]}
                >
                  <Input placeholder="กรอกชื่อวิชาภาษาไทย" size="large" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label="ชื่อวิชา (ภาษาอังกฤษ)"
                  name="EnglishName"
                  rules={[
                    {
                      required: true,
                      message: "กรุณากรอกชื่อวิชา (ภาษาอังกฤษ)",
                    },
                    {
                      validator: (_, value) => {
                        if (!value) return Promise.resolve();
                        return /^[A-Za-z\s]+$/.test(value)
                          ? Promise.resolve()
                          : Promise.reject(
                              "ชื่อวิชา (ภาษาอังกฤษ) ต้องเป็นตัวอักษรอังกฤษเท่านั้น"
                            );
                      },
                    },
                  ]}
                >
                  <Input placeholder="กรอกชื่อวิชาภาษาอังกฤษ" size="large" />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* Teachers */}
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
                เพิ่มอาจารย์ผู้สอน
              </span>
            }
            style={{ marginBottom: "24px" }}
          >
            {/* Department and Major */}
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
                  สังกัดหน่วยงานของอาจารย์ผู้สอน
                </span>
              }
              style={{ marginBottom: "24px" }}
            >
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Form.Item label="สำนักวิชา">
                    <Select
                      placeholder="-- สำนักวิชา --"
                      value={selectedDepartmentID || undefined}
                      size="large"
                      onChange={(val) => setSelectedDepartmentID(val as number)}
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
                      placeholder="-- สาขาวิชา --"
                      value={selectedMajorID || undefined}
                      size="large"
                      onChange={(val) => setSelectedMajorID(val as number)}
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
            </Card>

            {!selectedMajorID && (
              <div
                style={{
                  padding: "12px",
                  backgroundColor: "#fff3cd",
                  borderRadius: "6px",
                  border: "1px solid #ffeaa7",
                  color: "#856404",
                  fontSize: "13px",
                  textAlign: "center",
                }}
              >
                💡 กรุณาเลือกสาขาวิชาก่อนเพื่อแสดงรายชื่ออาจารย์
              </div>
            )}

            <div style={{ marginBottom: "16px" }}>
              {teachers.map((t, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "12px",
                    padding: "12px",
                    backgroundColor: "#f8f9fa",
                    borderRadius: "6px",
                    border: "1px solid #e9ecef",
                  }}
                >
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      backgroundColor: "#F26522",
                      color: "white",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "bold",
                      fontSize: "14px",
                      flexShrink: 0,
                    }}
                  >
                    {index + 1}
                  </div>

                  <div style={{ flex: 1 }}>
                    <Select
                      placeholder="-- เลือกอาจารย์ --"
                      value={t.ID} // ต้องเป็น ID
                      onChange={(value) => {
                        const selectedId = Number(value);
                        const selected = teacherOptions.find(
                          (opt) => opt.ID === selectedId
                        );
                        if (!selected) return;

                        const updatedTeachers = [...teachers];
                        updatedTeachers[index] = selected;
                        setTeachers(updatedTeachers);
                      }}
                      size="large"
                      style={{ width: "100%" }}
                      disabled={!selectedMajorID}
                    >
                      {teacherOptions.map((teacher) => {
                        const titleStr =
                          typeof teacher.Title === "string"
                            ? teacher.Title
                            : teacher.Title?.Title || "";
                        return (
                          <Option key={teacher.ID} value={teacher.ID}>
                            {`${titleStr} ${teacher.Firstname} ${teacher.Lastname}`}
                          </Option>
                        );
                      })}
                    </Select>
                  </div>

                  <Button
                    type="primary"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => removeTeacher(index)}
                    size="large"
                  >
                    ลบ
                  </Button>
                </div>
              ))}

              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={addTeacher}
                size="large"
                style={{
                  width: "100%",
                  height: "48px",
                  borderColor: "#F26522",
                  color: "#F26522",
                  marginTop: "20px",
                }}
                disabled={!selectedMajorID}
              >
                เพิ่มอาจารย์ผู้สอน
              </Button>
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
              onClick={() => navigate("/all-course")}
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
              disabled={!isFormValid()}
              style={{
                backgroundColor: isFormValid() ? "#F26522" : undefined,
                borderColor: isFormValid() ? "#F26522" : undefined,
                width: isMobile ? "100%" : "auto",
              }}
            >
              {loading
                ? "กำลังบันทึก..."
                : id
                ? "บันทึกการแก้ไข"
                : "เพิ่มรายวิชา"}
            </Button>
          </div>
        </Form>
      </Card>

      {/* Help Text */}
      <Card style={{ marginTop: "16px", backgroundColor: "#f8f9fa" }}>
        <div style={{ fontSize: "12px", color: "#666" }}>
          <strong>💡 คำแนะนำ:</strong>
          <ul style={{ margin: "8px 0 0 20px", paddingLeft: 0 }}>
            <li>กรอกข้อมูลให้ครบถ้วนก่อนบันทึก</li>
            <li>รหัสวิชาควรใช้รูปแบบที่กำหนดโดยหลักสูตร</li>
            <li>
              จำนวนชั่วโมงรวม (บรรยาย + ปฏิบัติ + เรียนรู้ด้วยตนเอง)
              ควรสอดคล้องกับหน่วยกิต
            </li>
            <li>ต้องมีอาจารย์ผู้สอนอย่างน้อย 1 คน</li>
          </ul>
        </div>
      </Card>
    </div>
  );
};

export default ManageCourse;
