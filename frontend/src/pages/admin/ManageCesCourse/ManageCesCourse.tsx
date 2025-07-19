import React, { useState } from "react";

const ManageCesCourse: React.FC = () => {
  type Assistant = {
    id: number;
    title: string;
    firstName: string;
    lastName: string;
  };

  type ClassTime = {
    id: number;
    day: string;
    start: string;
    end: string;
    group: string;
    room: string;
    assistants: Assistant[];
  };

  const [courseType, setCourseType] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [credit, setCredit] = useState("");
  const [hours, setHours] = useState({
    lecture: "",
    practice: "",
    selfStudy: "",
  });
  const [thaiName, setThaiName] = useState("");
  const [englishName, setEnglishName] = useState("");
  const [studentTotal, setStudentTotal] = useState("0");
  const [studentExpected, setStudentExpected] = useState("0");

  const [teachers, setTeachers] = useState([
    { id: 1, title: "", firstName: "", lastName: "", credit: "", hours: "" },
  ]);

  const [classTimes, setClassTimes] = useState<ClassTime[]>([
    {
      id: 1,
      day: "",
      start: "",
      end: "",
      group: "",
      room: "",
      assistants: [],
    },
  ]);

  const handleChangeHours = (key: string, value: string) => {
    setHours({ ...hours, [key]: value });
  };

  const addTeacher = () => {
    setTeachers([
      ...teachers,
      {
        id: Date.now(),
        title: "",
        firstName: "",
        lastName: "",
        credit: "",
        hours: "",
      },
    ]);
  };

  const removeTeacher = (id: number) => {
    setTeachers(teachers.filter((t) => t.id !== id));
  };

  const addClassTime = () => {
    setClassTimes([
      ...classTimes,
      {
        id: Date.now(),
        day: "",
        start: "",
        end: "",
        group: "",
        room: "",
        assistants: [],
      },
    ]);
  };

  const removeClassTime = (id: number) => {
    setClassTimes(classTimes.filter((c) => c.id !== id));
  };

  const addAssistantToClassTime = (classTimeId: number) => {
    setClassTimes((prev) =>
      prev.map((c) =>
        c.id === classTimeId
          ? {
              ...c,
              assistants: [
                ...c.assistants,
                { id: Date.now(), title: "", firstName: "", lastName: "" },
              ],
            }
          : c
      )
    );
  };

  const removeAssistantFromClassTime = (
    classTimeId: number,
    assistantId: number
  ) => {
    setClassTimes((prev) =>
      prev.map((c) =>
        c.id === classTimeId
          ? {
              ...c,
              assistants: c.assistants.filter((a) => a.id !== assistantId),
            }
          : c
      )
    );
  };

  const updateAssistantInClassTime = (
    classTimeId: number,
    index: number,
    field: string,
    value: string
  ) => {
    setClassTimes((prev) =>
      prev.map((c) => {
        if (c.id === classTimeId) {
          const newAssistants = [...c.assistants];
          newAssistants[index] = { ...newAssistants[index], [field]: value };
          return { ...c, assistants: newAssistants };
        }
        return c;
      })
    );
  };

  return (
    <>
    <div className="p-8 space-y-10 bg-white font-sarabun mt-20">
      {/* หมวดวิชา + รหัสวิชา */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="text-[#f26522]">หมวดวิชา</label>
          <select
            className="border px-3 py-2 rounded w-full"
            value={courseType}
            onChange={(e) => setCourseType(e.target.value)}
          >
            <option>หมวดวิชาศึกษาทั่วไป</option>
            <option>หมวดวิชาเฉพาะ</option>
          </select>
        </div>
        <div>
          <label className="text-[#f26522]">รหัสวิชา</label>
          <input
            className="border px-3 py-2 rounded w-full"
            value={courseCode}
            onChange={(e) => setCourseCode(e.target.value)}
          />
        </div>
      </div>
      {/* หน่วยกิต + ชั่วโมงการสอน */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="text-[#f26522]">หน่วยกิต</label>
          <select
            className="border px-3 py-2 rounded w-full"
            value={credit}
            onChange={(e) => setCredit(e.target.value)}
          >
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
          </select>
        </div>

        <div>
          <label className="text-[#f26522] font-medium text-xl block mb-2">
            รูปแบบชั่วโมงการสอน
          </label>
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { label: "บรรยาย", key: "lecture" },
              { label: "ปฏิบัติ", key: "practice" },
              { label: "เรียนรู้ด้วยตนเอง", key: "selfStudy" },
            ].map(({ label, key }) => (
              <div key={key}>
                <div className="text-[#f26522] font-medium mb-1">{label}</div>
                <select
                  className="border px-3 py-2 rounded-full w-20 mx-auto text-center"
                  value={hours[key as keyof typeof hours]}
                  onChange={(e) =>
                    setHours({ ...hours, [key]: e.target.value })
                  }
                >
                  <option value="">--</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                </select>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* ชื่อวิชา */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="text-[#f26522]">ชื่อภาษาไทย</label>
          <input
            className="border px-3 py-2 rounded w-full"
            value={thaiName}
            onChange={(e) => setThaiName(e.target.value)}
          />
        </div>
        <div>
          <label className="text-[#f26522]">ชื่อภาษาอังกฤษ</label>
          <input
            className="border px-3 py-2 rounded w-full"
            value={englishName}
            onChange={(e) => setEnglishName(e.target.value)}
          />
        </div>
      </div>
      {/* จำนวนนักศึกษา */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="text-[#f26522]">จำนวนกลุ่มเรียนทั้งหมด</label>
          <input
            type="number"
            className="border px-3 py-2 rounded w-full"
            value={studentTotal}
            onChange={(e) => setStudentTotal(e.target.value)}
          />
        </div>
        <div>
          <label className="text-[#f26522]">จำนวนนักศึกษาต่อกลุ่มเรียน</label>
          <input
            type="number"
            className="border px-3 py-2 rounded w-full"
            value={studentExpected}
            onChange={(e) => setStudentExpected(e.target.value)}
          />
        </div>
      </div>

      {/* อาจารย์ผู้สอน */}
      <div className="space-y-4">
        <h2 className="text-orange-500 font-semibold text-xl">
          เพิ่มอาจารย์ผู้สอน
        </h2>
        {teachers.map((t, index) => (
          <div key={t.id} className="grid grid-cols-12 gap-4 items-center">
            <div className="w-8 h-8 bg-[#f26522] text-white rounded-full flex items-center justify-center font-semibold text-sm">
              {index + 1}
            </div>
            <div className="col-span-2">
              <select className="border px-3 py-2 rounded w-full">
                <option>อ.ดร.</option>
                <option>ผศ.ดร.</option>
                <option>รศ.ดร.</option>
                <option>ศ.ดร.</option>
              </select>
            </div>
            <div className="col-span-4">
              <input
                className="border px-3 py-2 rounded w-full"
                defaultValue={t.firstName}
                placeholder="ชื่อ"
              />
            </div>
            <div className="col-span-4">
              <input
                className="border px-3 py-2 rounded w-full"
                defaultValue={t.lastName}
                placeholder="นามสกุล"
              />
            </div>
            <div className="col-span-1 text-center">
              <button
                type="button"
                onClick={() => removeTeacher(t.id)}
                className="bg-red-500 text-white px-6 py-2 rounded hover:bg-orange-600"
              >
                ลบ
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={addTeacher}
          className="bg-orange-500 text-white px-6 py-2 rounded hover:bg-orange-600"
        >
          + เพิ่มอาจารย์ผู้สอน
        </button>
      </div>

      <div className="space-y-6">
        <h2 className="text-[#f26522] font-semibold text-lg">
          เพิ่มวันและเวลาที่สอน
        </h2>

        {classTimes.map((c, idx) => (
          <div key={c.id} className="space-y-4">
            <div className="grid grid-cols-12 gap-3 items-start mt-10">
              {/* ลำดับ */}
              <div className="col-span-1 flex items-center mt-6">
                <div className="w-8 h-8 bg-[#f26522] text-white rounded-full flex items-center justify-center font-semibold text-sm">
                  {idx + 1}.
                </div>
              </div>

              {/* วัน */}
              <div className="col-span-2 -ml-0">
                <label className="block text-sm text-gray-600 mb-1">วัน</label>
                <select
                  className="w-full border rounded px-2 py-1"
                  value={c.day}
                  onChange={(e) => {
                    const updated = [...classTimes];
                    updated[idx].day = e.target.value;
                    setClassTimes(updated);
                  }}
                >
                  <option>จันทร์</option>
                  <option>อังคาร</option>
                  <option>พุธ</option>
                  <option>พฤหัสบดี</option>
                  <option>ศุกร์</option>
                  <option>เสาร์</option>
                  <option>อาทิตย์</option>
                </select>
              </div>

              {/* เวลาเริ่มต้น */}
              <div className="col-span-2">
                <label className="block text-sm text-gray-600 mb-1">
                  เวลาเริ่มต้น
                </label>
                <input
                  type="time"
                  className="w-full border rounded px-2 py-1"
                  value={c.start}
                  onChange={(e) => {
                    const updated = [...classTimes];
                    updated[idx].start = e.target.value;
                    setClassTimes(updated);
                  }}
                />
              </div>

              {/* คั่นกลาง */}
              <div className="mt-7 col-span-1 flex items-end justify-center pb-1 text-gray-500">
                -
              </div>

              {/* เวลาสิ้นสุด */}
              <div className="col-span-2">
                <label className="block text-sm text-gray-600 mb-1">
                  เวลาสิ้นสุด
                </label>
                <input
                  type="time"
                  className="w-full border rounded px-2 py-1"
                  value={c.end}
                  onChange={(e) => {
                    const updated = [...classTimes];
                    updated[idx].end = e.target.value;
                    setClassTimes(updated);
                  }}
                />
              </div>

              {/* กลุ่มเรียน */}
              <div className="col-span-1">
                <label className="block text-sm text-gray-600 mb-1">
                  กลุ่ม
                </label>
                <input
                  className="w-full border px-2 py-1 rounded text-center"
                  placeholder="1"
                  value={c.group}
                  onChange={(e) => {
                    const updated = [...classTimes];
                    updated[idx].group = e.target.value;
                    setClassTimes(updated);
                  }}
                />
              </div>

              {/* ห้อง */}
              <div className="col-span-2">
                <label className="block text-sm text-gray-600 mb-1">
                  ห้องเรียน
                </label>
                <input
                  className="w-full border px-2 py-1 rounded"
                  placeholder="DIGITAL TECH LAB"
                  value={c.room}
                  onChange={(e) => {
                    const updated = [...classTimes];
                    updated[idx].room = e.target.value;
                    setClassTimes(updated);
                  }}
                />
              </div>

              {/* ปุ่มลบ */}
              <div className="col-span-1 flex mt-5 items-end">
                <button
                  type="button"
                  onClick={() => removeClassTime(c.id)}
                  className="bg-red-500 text-white px-6 py-2 rounded hover:bg-orange-600"
                >
                  ลบ
                </button>
              </div>
            </div>

            {/* เพิ่มผู้ช่วยสอน */}
            <div className="ml-8 space-y-6 mt-10">
              <h3 className="text-[#f26522] font-medium">เพิ่มผู้ช่วยสอน</h3>
              {c.assistants.map((a, aIdx) => (
                <div
                  key={a.id}
                  className="grid grid-cols-12 gap-3 items-center"
                >
                  <div className="w-8 h-8 bg-[#f26522] text-white rounded-full flex items-center justify-center font-semibold text-sm">
                    {aIdx + 1}.
                  </div>

                  <select
                    className="col-span-2 border rounded px-2 py-1"
                    value={a.title}
                    onChange={(e) =>
                      updateAssistantInClassTime(
                        c.id,
                        aIdx,
                        "title",
                        e.target.value
                      )
                    }
                  >
                    <option>นาย</option>
                    <option>นางสาว</option>
                    <option>อ.ดร.</option>
                    <option>ผศ.ดร.</option>
                    <option>รศ.ดร.</option>
                    <option>ศ.ดร.</option>
                  </select>

                  <input
                    className="col-span-4 border rounded px-2 py-1"
                    placeholder="ชื่อ"
                    value={a.firstName}
                    onChange={(e) =>
                      updateAssistantInClassTime(
                        c.id,
                        aIdx,
                        "firstName",
                        e.target.value
                      )
                    }
                  />
                  <input
                    className="col-span-4 border rounded px-2 py-1"
                    placeholder="นามสกุล"
                    value={a.lastName}
                    onChange={(e) =>
                      updateAssistantInClassTime(
                        c.id,
                        aIdx,
                        "lastName",
                        e.target.value
                      )
                    }
                  />

                  <button
                    type="button"
                    onClick={() => removeAssistantFromClassTime(c.id, a.id)}
                    className="bg-red-500 text-white px-6 py-2 rounded hover:bg-orange-600"
                  >
                    ลบ
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => addAssistantToClassTime(c.id)}
                className="bg-orange-500 text-white px-4 py-2 rounded"
              >
                + เพิ่มผู้ช่วยสอน
              </button>
            </div>

            <hr className="border-t mt-4" />
          </div>
        ))}

        {/* ปุ่มเพิ่มวันเวลาเรียน */}
        <button
          type="button"
          onClick={addClassTime}
          className="bg-orange-500 text-white px-4 py-2 rounded"
        >
          + เพิ่มวันเวลาเรียน
        </button>

        {/* ปุ่มบันทึก */}
        <div className="text-right pt-6">
          <button
            type="submit"
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded"
          >
            บันทึก
          </button>
        </div>
      </div>
    </div>
    </>
  );
};

export default ManageCesCourse;
