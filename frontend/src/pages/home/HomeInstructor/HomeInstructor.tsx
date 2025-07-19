import React, { useEffect, useState } from 'react';
import './HomeInstructor.css';
import { Clock } from 'lucide-react';

interface ScheduleItem {
  day: string;
  time: string;
  subject: string;
  room: string;
  students?: number;
}

interface InstructorDashboardProps {
  schedule: ScheduleItem[];
  todayClasses: ScheduleItem[];
}

const ScheduleCard = ({ schedule, title }: { schedule: ScheduleItem[]; title: string }) => (
  <div className="schedule-card">
    <h3 className="schedule-title">
      <Clock className="schedule-icon" />
      {title}
    </h3>
    <div className="schedule-list">
      {schedule.length === 0 ? (
        <p className="schedule-empty">ไม่มีข้อมูล</p>
      ) : (
        schedule.map((item, index) => (
          <div key={index} className="schedule-item">
            <div>
              <p className="schedule-subject">{item.subject}</p>
              <p className="schedule-time">{item.time} | {item.room}</p>
              {item.students && <p className="schedule-students">นักเรียน: {item.students} คน</p>}
            </div>
            <span className="schedule-day">{item.day}</span>
          </div>
        ))
      )}
    </div>
  </div>
);

const InstructorDashboard: React.FC<InstructorDashboardProps> = ({ schedule, todayClasses }) => {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const storedRole = localStorage.getItem('role');
    setRole(storedRole);
  }, []);

  return (
    <div className="instructor-dashboard">
      <h2 className="dashboard-title">Instructor Dashboard</h2>
      {role && <p className="dashboard-role">คุณกำลังเข้าสู่ระบบในบทบาท: <strong>{role}</strong></p>}

      <div className="instructor-grid">
        <ScheduleCard schedule={schedule} title="ตารางสอนประจำสัปดาห์" />
        <ScheduleCard schedule={todayClasses} title="วิชาที่สอนวันนี้" />
      </div>
    </div>
  );
};

export default InstructorDashboard;
