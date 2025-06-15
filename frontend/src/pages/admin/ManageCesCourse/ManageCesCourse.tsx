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
            <option value="">--</option>
            <option>หมวดวิชาเฉพาะ</option>
            <option>หมวดวิชาศึกษาทั่วไป</option>
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
            <option value="">--</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
          </select>
        </div>
        <div>
          <label className="text-[#f26522]">รูปแบบชั่วโมงการสอน</label>
          <div className="grid grid-cols-3 gap-2">
            {["lecture", "practice", "selfStudy"].map((type) => (
              <select
                key={type}
                className="border px-3 py-2 rounded-full w-full text-center"
                value={hours[type as keyof typeof hours]}
                onChange={(e) => handleChangeHours(type, e.target.value)}
              >
                <option value="">--</option>
                <option>1</option>
                <option>2</option>
                <option>3</option>
                <option>4</option>
              </select>
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
          <label className="text-[#f26522]">จำนวนผู้เรียนทั้งหมด</label>
          <input
            type="number"
            className="border px-3 py-2 rounded w-full"
            value={studentTotal}
            onChange={(e) => setStudentTotal(e.target.value)}
          />
        </div>
        <div>
          <label className="text-[#f26522]">
            จำนวนนักศึกษาที่คาดว่าจะเข้าเรียน
          </label>
          <input
            type="number"
            className="border px-3 py-2 rounded w-full"
            value={studentExpected}
            onChange={(e) => setStudentExpected(e.target.value)}
          />
        </div>
      </div>
      อาจารย์ผู้สอน 
      <div className="space-y-2">
        <h2 className="text-[#f26522] font-semibold text-lg">
          เพิ่มอาจารย์ผู้สอน
        </h2>
        {teachers.map((t, idx) => (
          <div key={t.id} className="grid grid-cols-12 gap-2 items-center">
            <div className="col-span-1">{idx + 1}</div>
            <select
              className="col-span-2 border px-2 py-1 rounded"
              value={t.title}
              onChange={(e) => {
                const updated = [...teachers];
                updated[idx].title = e.target.value;
                setTeachers(updated);
              }}
            >
              <option value="">--</option>
              <option>รศ.ดร.</option>
              <option>ผศ.ดร.</option>
            </select>
            <input
              className="col-span-2 border px-2 py-1 rounded"
              placeholder="ชื่อ"
              value={t.firstName}
              onChange={(e) => {
                const updated = [...teachers];
                updated[idx].firstName = e.target.value;
                setTeachers(updated);
              }}
            />
            <input
              className="col-span-2 border px-2 py-1 rounded"
              placeholder="นามสกุล"
              value={t.lastName}
              onChange={(e) => {
                const updated = [...teachers];
                updated[idx].lastName = e.target.value;
                setTeachers(updated);
              }}
            />
            <input
              className="col-span-1 border px-2 py-1 rounded"
              placeholder="หน่วยกิต"
              value={t.credit}
              onChange={(e) => {
                const updated = [...teachers];
                updated[idx].credit = e.target.value;
                setTeachers(updated);
              }}
            />
            <input
              className="col-span-2 border px-2 py-1 rounded"
              placeholder="จำนวนชั่วโมง"
              value={t.hours}
              onChange={(e) => {
                const updated = [...teachers];
                updated[idx].hours = e.target.value;
                setTeachers(updated);
              }}
            />
            <button
              type="button"
              onClick={() => removeTeacher(t.id)}
              className="col-span-1 text-red-500"
            >
              ลบ
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addTeacher}
          className="bg-orange-500 text-white px-4 py-2 rounded"
        >
          + เพิ่มอาจารย์ผู้สอน
        </button>
      </div>
      {/* วันเวลาเรียน + ผู้ช่วยสอนแต่ละกลุ่ม */}
      <div className="space-y-6">
        <h2 className="text-[#f26522] font-semibold text-lg">
          เพิ่มวันและเวลาที่สอน
        </h2>
        {classTimes.map((c, idx) => (
          <div key={c.id} className="space-y-2 border-t pt-4">
            <div className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-1">{idx + 1}</div>
              <select
                className="col-span-2 border px-2 py-1 rounded"
                value={c.day}
                onChange={(e) => {
                  const updated = [...classTimes];
                  updated[idx].day = e.target.value;
                  setClassTimes(updated);
                }}
              >
                <option value="">--</option>
                <option>จันทร์</option>
                <option>อังคาร</option>
                <option>พุธ</option>
                <option>พฤหัสบดี</option>
                <option>ศุกร์</option>
                <option>เสาร์</option>
                <option>อาทิตย์</option>
              </select>
              <input
                className="col-span-2 border px-2 py-1 rounded"
                type="time"
                value={c.start}
                onChange={(e) => {
                  const updated = [...classTimes];
                  updated[idx].start = e.target.value;
                  setClassTimes(updated);
                }}
              />
              <input
                className="col-span-2 border px-2 py-1 rounded"
                type="time"
                value={c.end}
                onChange={(e) => {
                  const updated = [...classTimes];
                  updated[idx].end = e.target.value;
                  setClassTimes(updated);
                }}
              />
              <input
                className="col-span-2 border px-2 py-1 rounded"
                placeholder="กลุ่มเรียน"
                value={c.group}
                onChange={(e) => {
                  const updated = [...classTimes];
                  updated[idx].group = e.target.value;
                  setClassTimes(updated);
                }}
              />
              <input
                className="col-span-2 border px-2 py-1 rounded"
                placeholder="ห้องเรียน"
                value={c.room}
                onChange={(e) => {
                  const updated = [...classTimes];
                  updated[idx].room = e.target.value;
                  setClassTimes(updated);
                }}
              />
              <button
                type="button"
                onClick={() => removeClassTime(c.id)}
                className="col-span-1 text-red-500"
              >
                ลบ
              </button>
            </div>

            {/* ผู้ช่วยสอนในเวลาเรียนนี้ */}
            <div className="col-span-12 ml-6 space-y-2">
              <h3 className="text-[#f26522] font-medium">เพิ่มผู้ช่วยสอน</h3>
              {c.assistants.map((a, aIdx) => (
                <div
                  key={a.id}
                  className="grid grid-cols-12 gap-2 items-center"
                >
                  <div className="col-span-1">{aIdx + 1}</div>
                  <select
                    className="col-span-2 border px-2 py-1 rounded"
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
                    <option value="">--</option>
                    <option>นาย</option>
                    <option>นางสาว</option>
                    <option>อ.ดร.</option>
                  </select>
                  <input
                    className="col-span-4 border px-2 py-1 rounded"
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
                    className="col-span-4 border px-2 py-1 rounded"
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
                    className="col-span-1 text-red-500"
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
          </div>
        ))}
        <button
          type="button"
          onClick={addClassTime}
          className="bg-orange-500 text-white px-4 py-2 rounded"
        >
          + เพิ่มวันเวลาเรียน
        </button>
      </div>
      <div className="text-right pt-6">
        <button
          type="submit"
          className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded"
        >
          บันทึก
        </button>
      </div>
    </div>
  );
};

export default ManageCesCourse;
