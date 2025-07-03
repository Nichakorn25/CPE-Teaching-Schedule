import React, { useState } from "react";
import Sidebar from "../../../components/schedule-sidebar/Sidebar";
import Header from "../../../components/schedule-header/Header";
import "./AddConditionpage.css";

const days = ["จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];

interface TimeSlot {
  id: number;
  start: string;
  end: string;
}

const AddConditionpage: React.FC = () => {
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
    alert("บันทึกข้อมูลเวลาที่ไม่สะดวกสำเร็จ!");
  };

  return (
    <>
      {/* Background Layer */}
      <div className="addcondition-background" />
      
      {/* Sidebar */}
      <div className="addcondition-sidebar">
        <Sidebar />
      </div>
      
      {/* Main Content */}
      <div className="addcondition-main-content">
        {/* Header */}
        <div style={{
          position: 'absolute',
          top: '15px',
          right: '0px',
          zIndex: 999
        }}>
          <Header />
        </div>
        
        {/* White Content Area */}
        <div className="addcondition-content-area">
          {/* Page Title */}
          <div style={{ 
            marginBottom: '24px',
            paddingBottom: '16px',
            borderBottom: '2px solid #F26522'
          }}>
            <h2 style={{ 
              margin: 0, 
              color: '#333',
              fontSize: '24px',
              fontWeight: 'bold'
            }}>
              เพิ่มเงื่อนไขเวลาที่ไม่สะดวก
            </h2>
            <p style={{ 
              margin: '8px 0 0 0', 
              color: '#666',
              fontSize: '14px'
            }}>
              กำหนดช่วงเวลาที่ไม่สะดวกสำหรับการจัดตารางเรียน
            </p>
          </div>

          {/* Table Container */}
          <div style={{ 
            backgroundColor: 'white',
            border: '1px solid #d9d9d9',
            borderRadius: '6px',
            overflow: 'hidden',
            marginBottom: '24px'
          }}>
            <table className="addcondition-table">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>ลำดับที่</th>
                  <th style={{ width: '120px' }}>วันที่ไม่สะดวก</th>
                  <th>เวลาที่ไม่สะดวก</th>
                </tr>
              </thead>
              <tbody>
                {days.map((day, index) => (
                  <tr key={index}>
                    <td>
                      <span style={{ 
                        fontWeight: 'bold',
                        color: '#F26522',
                        fontSize: '16px'
                      }}>
                        {index + 1}
                      </span>
                    </td>
                    <td>
                      <span style={{ 
                        fontWeight: '600',
                        color: '#333',
                        fontSize: '14px'
                      }}>
                        {day}
                      </span>
                    </td>
                    <td>
                      <div className="time-slot-container">
                        {(timeSlotsByDay[index] || []).map((slot, i) => (
                          <div key={slot.id} className="time-slot-item">
                            <div className="time-slot-number">
                              {i + 1}
                            </div>
                            
                            <div className="time-input-group">
                              <label className="time-input-label">
                                เวลาเริ่มต้น
                              </label>
                              <input
                                type="time"
                                className="time-input"
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
                            
                            <span className="time-separator">-</span>
                            
                            <div className="time-input-group">
                              <label className="time-input-label">
                                เวลาสิ้นสุด
                              </label>
                              <input
                                type="time"
                                className="time-input"
                                value={slot.end}
                                onChange={(e) =>
                                  updateTime(index, slot.id, "end", e.target.value)
                                }
                              />
                            </div>
                            
                            <button
                              className="remove-time-button"
                              onClick={() => removeSlot(index, slot.id)}
                              title="ลบช่วงเวลานี้"
                            >
                              ลบ
                            </button>
                          </div>
                        ))}

                        <button
                          onClick={() => addTimeSlot(index)}
                          className="add-time-button"
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
              style={{
                padding: '12px 32px',
                fontSize: '16px',
                fontWeight: 'bold',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              บันทึกข้อมูล
            </button>
          </div>

          {/* Instructions */}
          <div style={{
            marginTop: '24px',
            padding: '16px',
            backgroundColor: '#f8f9fa',
            borderRadius: '6px',
            border: '1px solid #e9ecef'
          }}>
            <h4 style={{ 
              margin: '0 0 8px 0', 
              color: '#333',
              fontSize: '14px',
              fontWeight: 'bold'
            }}>
              คำแนะนำการใช้งาน:
            </h4>
            <ul style={{ 
              margin: 0, 
              paddingLeft: '20px',
              color: '#666',
              fontSize: '13px',
              lineHeight: '1.6'
            }}>
              <li>คลิก "เพิ่มช่วงเวลาไม่สะดวก" เพื่อเพิ่มช่วงเวลาที่ไม่สะดวกในแต่ละวัน</li>
              <li>สามารถเพิ่มหลายช่วงเวลาในวันเดียวกันได้</li>
              <li>คลิก "ลบ" เพื่อลบช่วงเวลาที่ไม่ต้องการ</li>
              <li>กำหนดเวลาเริ่มต้นและเวลาสิ้นสุดให้ครบถ้วน</li>
              <li>ข้อมูลจะถูกนำไปใช้ในการจัดตารางเรียนอัตโนมัติ</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddConditionpage;