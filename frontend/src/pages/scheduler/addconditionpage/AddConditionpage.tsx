import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import "./AddConditionpage.css";
import { message } from "antd";
import {
  postCreateConditions,
  getConditionsByUserId,
  putUpdateConditions,
} from "../../../services/https/SchedulerPageService";
import {
  ConditionInterface,
  ConditionsRequestInterface,
  ConditionInputInterface,
} from "../../../interfaces/SchedulerIn";

const days = ["จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];

// Custom Time Input Component
const CustomTimeInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  label: string;
}> = ({ value, onChange, disabled = false, label }) => {
  const [hour, setHour] = useState(value.split(":")[0] || "00");
  const [minute, setMinute] = useState(value.split(":")[1] || "00");

  useEffect(() => {
    if (value) {
      const [h, m] = value.split(":");
      setHour(h || "00");
      setMinute(m || "00");
    }
  }, [value]);

  const handleHourChange = (newHour: string) => {
    const paddedHour = newHour.padStart(2, "0");
    setHour(paddedHour);
    onChange(`${paddedHour}:${minute}`);
  };

  const handleMinuteChange = (newMinute: string) => {
    const paddedMinute = newMinute.padStart(2, "0");
    setMinute(paddedMinute);
    onChange(`${hour}:${paddedMinute}`);
  };

  return (
    <div className="time-input-group">
      <label className="time-input-label">{label}</label>
      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        <select
          value={hour}
          onChange={(e) => handleHourChange(e.target.value)}
          disabled={disabled}
          style={{
            padding: "6px 8px",
            border: "1px solid #d9d9d9",
            borderRadius: "4px",
            fontSize: "14px",
            minWidth: "60px",
            textAlign: "center",
          }}
        >
          {Array.from({ length: 24 }, (_, i) => {
            const h = i.toString().padStart(2, "0");
            return (
              <option key={h} value={h}>
                {h}
              </option>
            );
          })}
        </select>
        <span style={{ fontSize: "16px", fontWeight: "bold" }}>:</span>
        <select
          value={minute}
          onChange={(e) => handleMinuteChange(e.target.value)}
          disabled={disabled}
          style={{
            padding: "6px 8px",
            border: "1px solid #d9d9d9",
            borderRadius: "4px",
            fontSize: "14px",
            minWidth: "60px",
            textAlign: "center",
          }}
        >
          {Array.from({ length: 60 }, (_, i) => {
            const m = i.toString().padStart(2, "0");
            return (
              <option key={m} value={m}>
                {m}
              </option>
            );
          })}
        </select>
      </div>
    </div>
  );
};

const AddConditionpage: React.FC = () => {
  const [timeSlotsByDay, setTimeSlotsByDay] = useState<
    Record<number, ConditionInterface[]>
  >({});
  const [userID, setUserID] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [deletedSlotIds, setDeletedSlotIds] = useState<number[]>([]);

  /////////////////////////////////////////////////////////////////// ดึงข้อมูลมาใช้จากการล็อกอิน
  const title = localStorage.getItem("title") || "";
  const firstName = localStorage.getItem("first_name") || "";
  const lastName = localStorage.getItem("last_name") || "";

  useEffect(() => {
    const storedUserID = localStorage.getItem("user_id");
    if (storedUserID) {
      const parsedUserID = parseInt(storedUserID);
      setUserID(parsedUserID);
      fetchConditions(parsedUserID); // โหลดเงื่อนไขผู้ใช้ปัจจุบัน
    } else {
      message.error("ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่");
    }
  }, []);

  const fetchConditions = async (uid: number) => {
    try {
      const res = await getConditionsByUserId(uid.toString());
      if (res && res.data) {
        const conditions: ConditionInterface[] = res.data.Conditions || [];
        const grouped: Record<number, ConditionInterface[]> = {};

        conditions.forEach((c) => {
          const dayIndex = days.findIndex(
            (d) => d.trim() === c.DayOfWeek.trim()
          );
          if (dayIndex !== -1) {
            if (!grouped[dayIndex]) grouped[dayIndex] = [];

            const uniqueID = `${c.DayOfWeek}-${c.Start}-${c.End}`;

            // ตรวจสอบก่อน push ว่า slot นี้ยังไม่มี
            if (
              !grouped[dayIndex].some((slot) => String(slot.ID) === uniqueID)
            ) {
              grouped[dayIndex].push({
                ID: c.ID, // ใช้ ID ของ API เดิม
                DayOfWeek: c.DayOfWeek,
                Start: c.Start,
                End: c.End,
              });
            }
          }
        });

        setTimeSlotsByDay(grouped);
      }
    } catch (err) {
      console.error("Error fetching conditions:", err);
    }
  };

  /////////////////////////////////////////////////////////////////// ส่วนการกรอกข้อมูลช่วงเวลา
  const addTimeSlot = (dayIndex: number) => {
    setTimeSlotsByDay((prev) => {
      const existing = prev[dayIndex] || [];
      const newSlot: ConditionInterface & { isNew?: boolean } = {
        ID: Date.now(),
        DayOfWeek: days[dayIndex],
        Start: "00:00",
        End: "01:00",
        isNew: true, // flag ว่าเป็น slot ใหม่
      };
      return { ...prev, [dayIndex]: [...existing, newSlot] };
    });
  };

  const updateTime = (
    dayIndex: number,
    slotId: number,
    field: "Start" | "End",
    value: string
  ) => {
    setTimeSlotsByDay((prev) => {
      const updated = [...(prev[dayIndex] || [])];
      const slotIndex = updated.findIndex((slot) => slot.ID === slotId);
      if (slotIndex !== -1) {
        updated[slotIndex] = { ...updated[slotIndex], [field]: value };
      }
      return { ...prev, [dayIndex]: updated };
    });
  };

  const removeSlot = (dayIndex: number, slotId: number) => {
  setTimeSlotsByDay((prev) => {
    const updated = [...(prev[dayIndex] || [])];
    const removedSlot = updated.find((slot) => slot.ID === slotId);

    // ถ้าเป็น slot เดิม (ไม่มี isNew) ให้เก็บ ID ไว้ลบ
    if (removedSlot && !(removedSlot as any).isNew) {
      setDeletedSlotIds((prevIds) => [...prevIds, slotId]);
    }

    // ลบ slot ออกจาก state
    const filteredSlots = updated.filter((slot) => slot.ID !== slotId);
    return { ...prev, [dayIndex]: filteredSlots };
  });
};


  //////////////////////////////////////////////////////////////////// ฟอร์มของเวลาถูกต้องไหมก่อนส่งไป API

  const validateTimeSlots = () => {
    for (const [dayIndex, slots] of Object.entries(timeSlotsByDay)) {
      for (const slot of slots) {
        if (!slot.Start || !slot.End) {
          Swal.fire({
            icon: "warning",
            title: "ข้อมูลไม่ครบถ้วน",
            text: `กรุณากำหนดเวลาให้ครบถ้วนสำหรับวัน ${
              days[parseInt(dayIndex)]
            }`,
          });
          return false;
        }
        if (slot.Start >= slot.End) {
          Swal.fire({
            icon: "error",
            title: "ช่วงเวลาไม่ถูกต้อง",
            text: `เวลาเริ่มต้นต้องน้อยกว่าเวลาสิ้นสุดสำหรับวัน ${
              days[parseInt(dayIndex)]
            }`,
          });
          return false;
        }
      }
    }
    return true;
  };

 const handleSubmit = async () => {
  if (!userID) {
    Swal.fire({
      icon: "error",
      title: "ไม่พบข้อมูลผู้ใช้",
      text: "กรุณาล็อกอินใหม่อีกครั้ง",
    });
    return;
  }

  if (!validateTimeSlots()) return;

  setIsLoading(true);

  try {
    const newSlots: ConditionInputInterface[] = [];
    const updateSlots: ConditionInputInterface[] = [];

    // แบ่ง slot ใหม่และ slot เดิม
    Object.entries(timeSlotsByDay).forEach(([_, slots]) => {
      slots.forEach((slot) => {
        if (!slot.Start || !slot.End) return;

        if ((slot as any).isNew) {
          newSlots.push({
            DayOfWeek: slot.DayOfWeek,
            StartTime: slot.Start,
            EndTime: slot.End,
          });
        } else {
          updateSlots.push({
            // ID: slot.ID,
            DayOfWeek: slot.DayOfWeek,
            StartTime: slot.Start,
            EndTime: slot.End,
          });
        }
      });
    });

    // 1️⃣ ส่ง POST สำหรับ slot ใหม่
    let postResult;
    if (newSlots.length > 0) {
      postResult = await postCreateConditions({
        UserID: userID,
        Conditions: newSlots,
      });
    }

    // 2️⃣ ส่ง PUT สำหรับ slot เดิม + slot ที่ถูกลบ
    let putResult;
    if (updateSlots.length > 0 || deletedSlotIds.length > 0) {
      putResult = await putUpdateConditions({
        UserID: userID,
        Conditions: updateSlots,
        DeletedConditionIDs: deletedSlotIds,
      });
    }

    // 3️⃣ ตรวจสอบผลลัพธ์
    if (
      (postResult?.status === 200 || postResult?.status === 201 || !postResult) &&
      (putResult?.status === 200 || putResult?.status === 201 || !putResult)
    ) {
      Swal.fire({
        icon: "success",
        title: "บันทึกสำเร็จ",
        text: `ข้อมูลเวลาที่ไม่สะดวกของคุณถูกบันทึกเรียบร้อยแล้ว (${newSlots.length} รายการใหม่)`,
      });

      // reset state
      setDeletedSlotIds([]);
      setTimeSlotsByDay((prev) => {
        const updated: Record<number, ConditionInterface[]> = {};
        Object.entries(prev).forEach(([dayIndex, slots]) => {
          updated[parseInt(dayIndex)] = slots.map((slot) => ({
            ...slot,
            isNew: false,
          }));
        });
        return updated;
      });

      fetchConditions(userID);
    } else {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถบันทึกข้อมูลได้",
      });
    }
  } catch (error) {
    console.error("Error saving conditions:", error);
    Swal.fire({
      icon: "error",
      title: "ข้อผิดพลาด",
      text: "เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง",
    });
  } finally {
    setIsLoading(false);
  }
};


  return (
    <>
      {/* Page Title */}
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
          เพิ่มเงื่อนไขเวลาที่ไม่สะดวก
        </h2>
        <p
          style={{
            margin: "8px 0 0 0",
            color: "#666",
            fontSize: "14px",
          }}
        >
          กำหนดช่วงเวลาที่ไม่สะดวกสำหรับการจัดตารางเรียน (รูปแบบ 24 ชั่วโมง:
          00:00 - 23:59)
        </p>
      </div>

      {/* Main Content Area */}
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
        {/* userID ที่ใช้งานอยู่ */}
        {userID && (
          <div
            style={{
              marginBottom: "20px",
              padding: "12px 16px",
              backgroundColor: "#e8f5e8",
              borderRadius: "6px",
              border: "1px solid #b8e6b8",
            }}
          >
            <span
              style={{ fontSize: "14px", color: "#2d5a2d", fontWeight: "500" }}
            >
              กำลังจัดการเงื่อนไขสำหรับ: {title} {firstName} {lastName}
            </span>
          </div>
        )}

        {/* Table Container */}
        <div
          style={{
            backgroundColor: "white",
            border: "1px solid #d9d9d9",
            borderRadius: "6px",
            overflow: "hidden",
            marginBottom: "24px",
          }}
        >
          <table className="addcondition-table">
            <thead>
              <tr>
                <th style={{ width: "80px" }}>ลำดับที่</th>
                <th style={{ width: "120px" }}>วันที่ไม่สะดวก</th>
                <th>เวลาที่ไม่สะดวก (24 ชั่วโมง)</th>
              </tr>
            </thead>
            <tbody>
              {days.map((day, index) => (
                <tr key={index}>
                  <td>
                    <span
                      style={{
                        fontWeight: "bold",
                        color: "#F26522",
                        fontSize: "16px",
                      }}
                    >
                      {index + 1}
                    </span>
                  </td>
                  <td>
                    <span
                      style={{
                        fontWeight: "600",
                        color: "#333",
                        fontSize: "14px",
                      }}
                    >
                      {day}
                    </span>
                  </td>
                  <td>
                    <div className="time-slot-container">
                      {(timeSlotsByDay[index] || []).map((slot, i) => (
                        <div key={`${slot.ID}-${index}`} className="time-slot-item">
                          <div className="time-slot-number">{i + 1}</div>
                          <CustomTimeInput
                            label="เวลาเริ่มต้น"
                            value={slot.Start}
                            onChange={(value) =>
                              updateTime(index, slot.ID, "Start", value)
                            }
                            disabled={isLoading}
                          />

                          <span className="time-separator">-</span>

                          <CustomTimeInput
                            label="เวลาสิ้นสุด"
                            value={slot.End}
                            onChange={(value) =>
                              updateTime(index, slot.ID, "End", value)
                            }
                            disabled={isLoading}
                          />

                          <button
                            className="remove-time-button"
                            onClick={() => removeSlot(index, slot.ID)}
                            title="ลบช่วงเวลานี้"
                            disabled={isLoading}
                          >
                            ลบ
                          </button>
                        </div>
                      ))}

                      <button
                        onClick={() => addTimeSlot(index)}
                        className="add-time-button"
                        disabled={isLoading}
                      >
                        + เพิ่มช่วงเวลาไม่สะดวก
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Save Button */}
        <div className="save-button-container">
          <button
            onClick={handleSubmit}
            className="addcondition-primary-button"
            disabled={isLoading || !userID}
            style={{
              padding: "12px 32px",
              fontSize: "16px",
              fontWeight: "bold",
              border: "none",
              borderRadius: "6px",
              cursor: isLoading ? "not-allowed" : "pointer",
              transition: "all 0.2s ease",
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
          </button>
        </div>

        {/* Instructions */}
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
            <li>
              คลิก "เพิ่มช่วงเวลาไม่สะดวก"
              เพื่อเพิ่มช่วงเวลาที่ไม่สะดวกในแต่ละวัน
            </li>
            <li>สามารถเพิ่มหลายช่วงเวลาในวันเดียวกันได้</li>
            <li>คลิก "ลบ" เพื่อลบช่วงเวลาที่ไม่ต้องการ</li>
            <li>เลือกชั่วโมงจาก 00-23 และนาทีจาก 00-59</li>
            <li>ช่วงเวลาเริ่มต้นจะถูกตั้งค่าเป็น 00:00 - 01:00</li>
            <li>กำหนดเวลาเริ่มต้นและเวลาสิ้นสุดให้ครบถ้วน</li>
            <li>เวลาเริ่มต้นต้องน้อยกว่าเวลาสิ้นสุด</li>
            <li>ข้อมูลจะถูกนำไปใช้ในการจัดตารางเรียนอัตโนมัติ</li>
            <li>หลังจากบันทึกสำเร็จ ระบบจะนำคุณไปยังหน้าดูเงื่อนไขทั้งหมด</li>
          </ul>
        </div>

        {/* สรุปเงื่อนไข */}
        {Object.keys(timeSlotsByDay).length > 0 && (
          <div
            style={{
              marginTop: "16px",
              padding: "12px 16px",
              backgroundColor: "#fff3cd",
              borderRadius: "6px",
              border: "1px solid #ffeaa7",
            }}
          >
            <h4
              style={{
                margin: "0 0 8px 0",
                color: "#856404",
                fontSize: "14px",
                fontWeight: "bold",
              }}
            >
              สรุปเงื่อนไขที่จะบันทึก:
            </h4>
            <div style={{ fontSize: "13px", color: "#856404" }}>
              {Object.entries(timeSlotsByDay).map(
                ([dayIndex, slots]) =>
                  slots.length > 0 && (
                    <div key={dayIndex} style={{ marginBottom: "4px" }}>
                      <strong>{days[parseInt(dayIndex)]}:</strong>{" "}
                      {slots.length} ช่วงเวลา
                    </div>
                  )
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AddConditionpage;
