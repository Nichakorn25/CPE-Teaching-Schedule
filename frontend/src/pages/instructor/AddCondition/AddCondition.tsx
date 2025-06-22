import React, { useState } from "react";

const days = ["จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"]; // ❌ เอาอาทิตย์ออก

interface TimeSlot {
  id: number;
  start: string;
  end: string;
}

const AddCondition: React.FC = () => {
  const [timeSlotsByDay, setTimeSlotsByDay] = useState<
    Record<number, TimeSlot[]>
  >({});

  const addTimeSlot = (dayIndex: number) => {
    setTimeSlotsByDay((prev) => {
      const existing = prev[dayIndex] || [];
      const newSlot: TimeSlot = {
        id: Date.now(),
        start: "",
        end: "",
      };
      return { ...prev, [dayIndex]: [...existing, newSlot] };
    });
  };

  const updateTime = (
    dayIndex: number,
    id: number,
    field: "start" | "end",
    value: string
  ) => {
    setTimeSlotsByDay((prev) => {
      const updated = prev[dayIndex].map((slot) =>
        slot.id === id ? { ...slot, [field]: value } : slot
      );
      return { ...prev, [dayIndex]: updated };
    });
  };

  const removeSlot = (dayIndex: number, id: number) => {
    setTimeSlotsByDay((prev) => {
      const filtered = prev[dayIndex].filter((slot) => slot.id !== id);
      return { ...prev, [dayIndex]: filtered };
    });
  };

  const handleSubmit = () => {
    console.log("ข้อมูลเวลาที่ไม่สะดวก:", timeSlotsByDay);
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen mt-10">
      <div className="bg-white rounded shadow p-4 overflow-x-auto">
        <table className="w-full table-auto border border-collapse text-sm">
          <thead>
            <tr className="bg-gray-400 text-white">
              <th className="border px-4 py-2">ลำดับที่</th>
              <th className="border px-4 py-2">วันที่ไม่สะดวก</th>
              <th className="border px-4 py-2">เวลาที่ไม่สะดวก</th>
            </tr>
          </thead>
          <tbody>
            {days.map((day, index) => (
              <tr key={index} className="border-t ">
                <td className="border px-4 py-2 text-center">{index + 1}</td>
                <td className="border px-4 py-2 text-center">{day}</td>
                <td className="border px-4 py-2">
                  <div className="flex flex-col items-center gap-4">
                    {(timeSlotsByDay[index] || []).map((slot, i) => (
                      <div key={slot.id} className="flex items-end gap-4">
                        {" "}
                        {/* ระยะห่างระหว่างชุด */}
                        <span className="w-8 h-8 bg-[#f26522] text-white rounded-full flex items-center justify-center font-semibold text-sm">
                          {i + 1}
                        </span>
                        <div className="flex flex-col items-start">
                          <label className="text-xs text-gray-500 mb-1">
                            เวลาเริ่มต้น
                          </label>
                          <input
                            type="time"
                            className="border rounded px-2 py-1"
                            value={slot.start}
                            onChange={(e) =>
                              updateTime(
                                index,
                                slot.id,
                                "start",
                                e.target.value
                              )
                            }
                          />
                        </div>
                        <span className="text-gray-600 pb-4">-</span>
                        <div className="flex flex-col items-start">
                          <label className="text-xs text-gray-500 mb-1">
                            เวลาสิ้นสุด
                          </label>
                          <input
                            type="time"
                            className="border rounded px-2 py-1"
                            value={slot.end}
                            onChange={(e) =>
                              updateTime(index, slot.id, "end", e.target.value)
                            }
                          />
                        </div>
                        <button
                          className="bg-red-500 text-white px-4 py-1 rounded hover:bg-red-600 h-8"
                          onClick={() => removeSlot(index, slot.id)}
                        >
                          ลบ
                        </button>
                      </div>
                    ))}

                    <button
                      onClick={() => addTimeSlot(index)}
                      className="bg-[#f26522] text-white text-sm px-3 py-1 rounded mt-2"
                    >
                      + เพิ่มช่วงเวลาไม่สะดวก
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="text-right mt-6">
          <button
            onClick={handleSubmit}
            className="bg-[#f26522] hover:bg-[#e0561a] text-white px-6 py-2 rounded"
          >
            บันทึก
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddCondition;
