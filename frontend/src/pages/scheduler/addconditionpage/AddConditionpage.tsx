import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../../components/schedule-sidebar/Sidebar";
import Header from "../../../components/schedule-header/Header";
import "./AddConditionpage.css";
import { message } from 'antd';
import { postCreateConditions } from "../../../services/https/SchedulerPageService";
import { ConditionInterface } from "../../../interfaces/SchedulerIn";

const days = ["จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];

const AddConditionpage: React.FC = () => {
  const navigate = useNavigate();
  const [timeSlotsByDay, setTimeSlotsByDay] = useState<Record<number, ConditionInterface[]>>({});
  const [userID, setUserID] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Get user ID from localStorage
  useEffect(() => {
    const storedUserID = localStorage.getItem("user_id");
    if (storedUserID) {
      const parsedUserID = parseInt(storedUserID);
      setUserID(parsedUserID);
    } else {
      message.error("ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่");
    }
  }, []);

  const addTimeSlot = (dayIndex: number) => {
    setTimeSlotsByDay((prev) => {
      const existing = prev[dayIndex] || [];
      const newSlot: ConditionInterface = {
        ID: Date.now(), // temporary unique ID
        DayOfWeek: days[dayIndex],
        Start: "",
        End: "",
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
      const slotIndex = updated.findIndex(slot => slot.ID === slotId);
      if (slotIndex !== -1) {
        updated[slotIndex] = { ...updated[slotIndex], [field]: value };
      }
      return { ...prev, [dayIndex]: updated };
    });
  };

  const removeSlot = (dayIndex: number, slotId: number) => {
    setTimeSlotsByDay((prev) => {
      const updated = [...(prev[dayIndex] || [])];
      const filteredSlots = updated.filter(slot => slot.ID !== slotId);
      return { ...prev, [dayIndex]: filteredSlots };
    });
  };

  const validateTimeSlots = () => {
    for (const [dayIndex, slots] of Object.entries(timeSlotsByDay)) {
      for (const slot of slots) {
        if (!slot.Start || !slot.End) {
          message.error(`กรุณากำหนดเวลาให้ครบถ้วนสำหรับวัน${days[parseInt(dayIndex)]}`);
          return false;
        }
        if (slot.Start >= slot.End) {
          message.error(`เวลาเริ่มต้นต้องน้อยกว่าเวลาสิ้นสุดสำหรับวัน${days[parseInt(dayIndex)]}`);
          return false;
        }
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!userID) {
      message.error("ไม่พบข้อมูลผู้ใช้");
      return;
    }

    if (!validateTimeSlots()) {
      return;
    }

    setIsLoading(true);

    try {
      // แปลงข้อมูลเป็นรูปแบบที่ API ต้องการ
      const conditionsToSave: any[] = [];
      
      Object.entries(timeSlotsByDay).forEach(([dayIndex, slots]) => {
        slots.forEach((slot) => {
          if (slot.Start && slot.End) {
            conditionsToSave.push({
              DayOfWeek: slot.DayOfWeek,
              StartTime: slot.Start,
              EndTime: slot.End
            });
          }
        });
      });

      if (conditionsToSave.length === 0) {
        message.warning("กรุณาเพิ่มช่วงเวลาที่ไม่สะดวกอย่างน้อย 1 ช่วงเวลา");
        setIsLoading(false);
        return;
      }

      console.log('Sending to API:', { userID, conditions: conditionsToSave });

      const result = await postCreateConditions(userID, conditionsToSave);
      
      if (result && result.status === 200) {
        message.success(`บันทึกข้อมูลเวลาที่ไม่สะดวกสำเร็จ! (${conditionsToSave.length} รายการ)`);
        
        // รอ 1 วินาทีแล้วไปหน้า Condition
        setTimeout(() => {
          navigate('/Conditionpage');
        }, 1000);
      } else {
        console.error('API Error:', result);
        message.error(result?.data?.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      }

    } catch (error) {
      console.error("Error saving conditions:", error);
      message.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsLoading(false);
    }
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

          {/* User Info Display */}
          {userID && (
            <div style={{
              marginBottom: '20px',
              padding: '12px 16px',
              backgroundColor: '#e8f5e8',
              borderRadius: '6px',
              border: '1px solid #b8e6b8'
            }}>
              <span style={{ fontSize: '14px', color: '#2d5a2d', fontWeight: '500' }}>
                กำลังจัดการเงื่อนไขสำหรับผู้ใช้ ID: {userID}
              </span>
            </div>
          )}

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
                          <div key={slot.ID} className="time-slot-item">
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
                                value={slot.Start}
                                onChange={(e) =>
                                  updateTime(
                                    index,
                                    slot.ID,
                                    "Start",
                                    e.target.value
                                  )
                                }
                                disabled={isLoading}
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
                                value={slot.End}
                                onChange={(e) =>
                                  updateTime(index, slot.ID, "End", e.target.value)
                                }
                                disabled={isLoading}
                              />
                            </div>
                            
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
                padding: '12px 32px',
                fontSize: '16px',
                fontWeight: 'bold',
                border: 'none',
                borderRadius: '6px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: isLoading ? 0.7 : 1
              }}
            >
              {isLoading ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
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
              <li>เวลาเริ่มต้นต้องน้อยกว่าเวลาสิ้นสุด</li>
              <li>ข้อมูลจะถูกนำไปใช้ในการจัดตารางเรียนอัตโนมัติ</li>
              <li>หลังจากบันทึกสำเร็จ ระบบจะนำคุณไปยังหน้าดูเงื่อนไขทั้งหมด</li>
            </ul>
          </div>

          {/* Summary */}
          {Object.keys(timeSlotsByDay).length > 0 && (
            <div style={{
              marginTop: '16px',
              padding: '12px 16px',
              backgroundColor: '#fff3cd',
              borderRadius: '6px',
              border: '1px solid #ffeaa7'
            }}>
              <h4 style={{ 
                margin: '0 0 8px 0', 
                color: '#856404',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                สรุปเงื่อนไขที่จะบันทึก:
              </h4>
              <div style={{ fontSize: '13px', color: '#856404' }}>
                {Object.entries(timeSlotsByDay).map(([dayIndex, slots]) => (
                  slots.length > 0 && (
                    <div key={dayIndex} style={{ marginBottom: '4px' }}>
                      <strong>{days[parseInt(dayIndex)]}:</strong> {slots.length} ช่วงเวลา
                    </div>
                  )
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AddConditionpage;