import React, { useState } from "react";

const AddCourse: React.FC = () => {
  const [assistants, setAssistants] = useState([
    { id: Date.now(), prefix: "", name: "" },
  ]);
  const [labRoom, setLabRoom] = useState("ไม่มีการเรียนการสอนในห้องปฏิบัติการ");
  const [hours, setHours] = useState({ lecture: "", practice: "", selfStudy: "" });

  const addAssistant = () => {
    setAssistants([...assistants, { id: Date.now(), prefix: "", name: "" }]);
  };

  const removeAssistant = (id: number) => {
    setAssistants(assistants.filter((a) => a.id !== id));
  };

  const updateAssistant = (
    id: number,
    field: "prefix" | "name",
    value: string
  ) => {
    setAssistants(
      assistants.map((a) => (a.id === id ? { ...a, [field]: value } : a))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("ส่งข้อมูลรายวิชา...");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-4xl mx-auto p-6 bg-white rounded shadow space-y-6 mt-20"
    >
      {/* ข้อมูลวิชา */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm  text-[#f26522] text-xl">
            โครงสร้างหลักสูตร
          </label>
          <select className="w-full border px-3 py-2 rounded ">
            <option>107050101650: วิศวกรรมคอมพิวเตอร์-2565</option>
          </select>
        </div>
      </div>

      <div>
        <label className="text-sm  text-[#f26522] text-xl">
          ค้นหารหัสวิชา
        </label>
        <input
          className="w-full border px-3 py-2 rounded "
          placeholder="ENG2311"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div>
          <label className="text-sm text-[#f26522] text-xl">
            ชื่อวิชา (ภาษาไทย)
          </label>
          <input
            className="w-full border px-3 py-2 rounded "
            placeholder="ระบบฐานข้อมูล"
          />
        </div>

        <div>
          <label className="text-sm text-[#f26522] text-xl">
            ชื่อวิชา (ภาษาอังกฤษ)
          </label>
          <input
            className="w-full border px-3 py-2 rounded "
            placeholder="Database System"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div>
          <label className="text-sm text-[#f26522] text-xl">
            หน่วยกิต
          </label>
          <input type="number" className="w-full border px-3 py-2 rounded " />
        </div>
        {/* รูปแบบชั่วโมงการสอน */}
         <div>
            <label className="text-[#f26522] font-medium text-xl block mb-2">รูปแบบชั่วโมงการสอน</label>
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
                    onChange={(e) => setHours({ ...hours, [key]: e.target.value })}
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

      <div>
        <label className="text-sm text-xl text-[#f26522]">ห้องปฏิบัติการ (ถ้ามี) </label>
        <select className="w-full border px-3 py-2 rounded ">
          <option>ไม่มีการเรียนการสอนในห้องปฏิบัติการ</option>
          <option>F11-421 Hardware</option>
          <option>F11-422 Software</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {" "}
        <div>
          <label className="text-sm text-xl text-[#f26522]">จำนวนกลุ่มเรียน</label>
          <input
            type="number"
            className="w-full border px-3 py-2 rounded text-[#f26522]"
          />
        </div>
        <div>
          <label className="text-sm text-xl text-[#f26522]">นักศึกษาต่อกลุ่ม</label>
          <input
            type="number"
            className="w-full border px-3 py-2 rounded text-[#f26522]"
          />
        </div>
      </div>

      {/* ผู้ช่วยสอน */}
      <div>
        <h3 className="text-[#f26522] font-semibold text-lg mb-2 text-xl">
          เพิ่มผู้ช่วยสอน
        </h3>
        <div className="space-y-3">
          {assistants.map((a, i) => (
            <div key={a.id} className="grid grid-cols-12 gap-2 items-center">
              <div className="w-8 h-8 bg-[#f26522] text-white rounded-full flex items-center justify-center font-semibold text-sm">{i + 1}.</div>
              <select
                className="col-span-2 border px-2 py-1 rounded"
                value={a.prefix}
                onChange={(e) =>
                  updateAssistant(a.id, "prefix", e.target.value)
                }
              >
                <option value="">คำนำหน้า</option>
                <option>นาย</option>
                <option>นางสาว</option>
              </select>
              <select
                className="col-span-8 border px-2 py-1 rounded"
                value={a.name}
                onChange={(e) => updateAssistant(a.id, "name", e.target.value)}
              >
                <option value="">เลือกชื่อ-นามสกุล</option>
                <option>ธนวัฒน์ สีแก้วสิ่ว</option>
                <option>ภูวดล  เดชารัมย์</option>
              </select>
              <button
                type="button"
                onClick={() => removeAssistant(a.id)}
                className="bg-red-500 text-white px-6 py-2 rounded hover:bg-orange-600"
              >
                ลบ
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addAssistant}
            className="bg-[#f26522] text-white px-4 py-2 rounded text-sm"
          >
            + เพิ่มผู้ช่วยสอน
          </button>
        </div>
      </div>

      {/* ปุ่มบันทึก */}
      <div className="text-right">
        <button
          type="submit"
          className="bg-[#f26522] text-white px-6 py-2 rounded hover:bg-orange-600"
        >
          บันทึก
        </button>
      </div>
    </form>
  );
};

export default AddCourse;
