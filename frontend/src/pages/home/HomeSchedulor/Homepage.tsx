import React, { useEffect, useState } from 'react';
import './Homepage.css';
import { Clock } from 'lucide-react';

interface ScheduleItem {
  day: string;
  time: string;
  subject: string;
  room: string;
  students?: number;
}

interface SchedulerDashboardProps {
  schedule: ScheduleItem[];
  todayTasks: ScheduleItem[];
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

const SchedulerDashboard: React.FC<SchedulerDashboardProps> = ({ schedule, todayTasks }) => {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const storedRole = localStorage.getItem('role');
    setRole(storedRole);
  }, []);

  return (
    <div className="scheduler-dashboard">
      <h2 className="dashboard-title">Scheduler Dashboard</h2>
      {role && <p className="dashboard-role">คุณกำลังเข้าสู่ระบบในบทบาท: <strong>{role}</strong></p>}

      <div className="scheduler-grid">
        <ScheduleCard schedule={schedule} title="รายการตารางที่จัดไว้" />
        <ScheduleCard schedule={todayTasks} title="งานที่ต้องจัดวันนี้" />
      </div>
    </div>
  );
};

export default SchedulerDashboard;
