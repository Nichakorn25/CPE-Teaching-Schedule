import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { useNavigate, useLocation } from "react-router-dom";
import Sidebar from "../../../components/schedule-sidebar/Sidebar";
import Header from "../../../components/schedule-header/Header";
import "./AddConditionpage.css";
import { message } from 'antd';
import { putUpdateConditions, deleteConditionsByUser } from "../../../services/https/SchedulerPageService";
import { ConditionInterface, ConditionsRequestInterface, ConditionInputInterface } from "../../../interfaces/SchedulerIn";

const days = ["จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];

interface LocationState {
  userID: number;
  fullname: string;
  existingConditions: ConditionInterface[];
}

const EditConditionpage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;
  
  const [timeSlotsByDay, setTimeSlotsByDay] = useState<Record<number, ConditionInterface[]>>({});
  const [userID, setUserID] = useState<number | null>(null);
  const [fullname, setFullname] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  // โหลดข้อมูลเงื่อนไขเดิม
  useEffect(() => {
    if (state && state.userID && state.existingConditions) {
      setUserID(state.userID);
      setFullname(state.fullname);
      
      console.log('Loading existing conditions:', state.existingConditions);
      
      // แปลงข้อมูลเงื่อนไขเดิมไปยัง timeSlotsByDay format
      const conditionsByDay: Record<number, ConditionInterface[]> = {};
      
      state.existingConditions.forEach((condition) => {
        const dayIndex = days.indexOf(condition.DayOfWeek);
        if (dayIndex !== -1) {
          if (!conditionsByDay[dayIndex]) {
            conditionsByDay[dayIndex] = [];
          }
          conditionsByDay[dayIndex].push({
            ...condition,
            ID: condition.ID || Date.now() + Math.random() // ใช้ ID เดิมหรือสร้างใหม่
          });
        }
      });
      
      console.log('Processed conditions by day:', conditionsByDay);
      setTimeSlotsByDay(conditionsByDay);
    } else {
      // ถ้าไม่มีข้อมูล redirect กลับไปหน้า Condition
      message.error("ไม่พบข้อมูลเงื่อนไขที่ต้องการแก้ไข");
      navigate('/Conditionpage');
    }
  }, [state, navigate]);

  const addTimeSlot = (dayIndex: number) => {
    setTimeSlotsByDay((prev) => {
      const existing = prev[dayIndex] || [];
      const newSlot: ConditionInterface = {
        ID: Date.now() + Math.random(),
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
          message.error(`กรุณากำหนดเวลาให้ครบถ้วนสำหรับวัน ${days[parseInt(dayIndex)]}`);
          return false;
        }
        if (slot.Start >= slot.End) {
          message.error(`เวลาเริ่มต้นต้องน้อยกว่าเวลาสิ้นสุดสำหรับวัน ${days[parseInt(dayIndex)]}`);
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
      const conditionsToSave: ConditionInputInterface[] = [];

      Object.entries(timeSlotsByDay).forEach(([_, slots]) => {
        slots.forEach((slot) => {
          if (slot.Start && slot.End) {
            conditionsToSave.push({
              DayOfWeek: slot.DayOfWeek,
              StartTime: slot.Start,
              EndTime: slot.End,
            });
          }
        });
      });

      const payload: ConditionsRequestInterface = {
        UserID: userID,
        Conditions: conditionsToSave,
      };

      console.log("Updating conditions:", payload);

      const result = await putUpdateConditions(payload);

      if (result && (result.status === 200 || result.status === 201)) {
        message.success(`เงื่อนไขเวลาที่ไม่สะดวกของ ${fullname} ถูกอัปเดตเรียบร้อยแล้ว`);
        
        setTimeout(() => {
          navigate("/Conditionpage");
        }, 1000);
      } else {
        console.error("API Error:", result);
        message.error(result?.data?.error || "ไม่สามารถอัปเดตข้อมูลได้");
      }
    } catch (error) {
      console.error("Error updating conditions:", error);
      message.error("เกิดข้อผิดพลาดในการอัปเดตข้อมูล กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    const hasChanges = Object.keys(timeSlotsByDay).length > 0;
    
    if (hasChanges) {
      const confirmCancel = window.confirm(
        'การเปลี่ยนแปลงที่ยังไม่ได้บันทึกจะสูญหาย\nคุณต้องการยกเลิกการแก้ไขหรือไม่?'
      );
      
      if (confirmCancel) {
        navigate('/Conditionpage');
      }
    } else {
      navigate('/Conditionpage');
    }
  };

  const handleDeleteAll = async () => {
    if (!userID) return;
    
    const confirmDelete = window.confirm(
      `คุณต้องการลบเงื่อนไขทั้งหมดของ "${fullname}" หรือไม่?\n\n⚠️ การดำเนินการนี้ไม่สามารถยกเลิกได้`
    );
    
    if (confirmDelete) {
      try {
        setIsLoading(true);
        const deleteResult = await deleteConditionsByUser(userID.toString());
        
        if (deleteResult && (deleteResult.status === 200 || deleteResult.status === 204)) {
          message.success(`ลบเงื่อนไขทั้งหมดของ ${fullname} เรียบร้อยแล้ว`);
          
          setTimeout(() => {
            navigate("/Conditionpage");
          }, 1000);
        } else {
          message.error("ไม่สามารถลบเงื่อนไขได้");
        }
      } catch (error) {
        console.error("Error deleting conditions:", error);
        message.error("เกิดข้อผิดพลาดในการลบเงื่อนไข");
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <>
      <div className="addcondition-background" />

      <div className="addcondition-sidebar">
        <Sidebar />
      </div>

      <div className="addcondition-main-content">
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
              แก้ไขเงื่อนไขเวลาที่ไม่สะดวก
            </h2>
            <p style={{
              margin: '8px 0 0 0',
              color: '#666',
              fontSize: '14px'
            }}>
              แก้ไขช่วงเวลาที่ไม่สะดวกสำหรับการจัดตารางเรียน
            </p>
          </div>

          {/* User Info Display */}
          {userID && fullname && (
            <div style={{
              marginBottom: '20px',
              padding: '12px 16px',
              backgroundColor: '#fff3cd',
              borderRadius: '6px',
              border: '1px solid #ffeaa7'
            }}>
              <span style={{ fontSize: '14px', color: '#856404', fontWeight: '500' }}>
                กำลังแก้ไขเงื่อนไขของ: {fullname} (ID: {userID})
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

          {/* Action Buttons */}
          <div className="save-button-container" style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end', // เปลี่ยนจาก center เป็น flex-end
            flexWrap: 'wrap'
          }}>
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
                opacity: isLoading ? 0.7 : 1,
                backgroundColor: '#F26522'
              }}
            >
              {isLoading ? 'กำลังอัปเดต...' : 'อัปเดตข้อมูล'}
            </button>

            <button
              onClick={handleCancel}
              disabled={isLoading}
              style={{
                padding: '12px 32px',
                fontSize: '16px',
                fontWeight: 'bold',
                border: '2px solid #6c757d',
                borderRadius: '6px',
                backgroundColor: 'white',
                color: '#6c757d',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: isLoading ? 0.7 : 1
              }}
            >
              ยกเลิก
            </button>

            <button
              onClick={handleDeleteAll}
              disabled={isLoading}
              style={{
                padding: '12px 32px',
                fontSize: '16px',
                fontWeight: 'bold',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: '#dc3545',
                color: 'white',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: isLoading ? 0.7 : 1
              }}
            >
              ลบทั้งหมด
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
              คำแนะนำการแก้ไข:
            </h4>
            <ul style={{
              margin: 0,
              paddingLeft: '20px',
              color: '#666',
              fontSize: '13px',
              lineHeight: '1.6'
            }}>
              <li>แก้ไขเวลาที่ต้องการเปลี่ยนแปลง</li>
              <li>เพิ่มช่วงเวลาใหม่หรือลบช่วงเวลาที่ไม่ต้องการ</li>
              <li>คลิก "อัปเดตข้อมูล" เพื่อบันทึกการเปลี่ยนแปลง</li>
              <li>คลิก "ลบทั้งหมด" เพื่อลบเงื่อนไขทั้งหมดของผู้ใช้นี้</li>
              <li>คลิก "ยกเลิก" เพื่อกลับไปหน้าเงื่อนไขโดยไม่บันทึก</li>
            </ul>
          </div>

          {/* Summary */}
          {Object.keys(timeSlotsByDay).length > 0 && (
            <div style={{
              marginTop: '16px',
              padding: '12px 16px',
              backgroundColor: '#d1ecf1',
              borderRadius: '6px',
              border: '1px solid #bee5eb'
            }}>
              <h4 style={{
                margin: '0 0 8px 0',
                color: '#0c5460',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                สรุปเงื่อนไขปัจจุบัน:
              </h4>
              <div style={{ fontSize: '13px', color: '#0c5460' }}>
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

export default EditConditionpage;