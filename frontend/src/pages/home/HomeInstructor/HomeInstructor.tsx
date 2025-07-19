import React from 'react';
import ScheduleCard from '../ScheduleCard';

interface Class {
  day?: string;
  time: string;
  subject: string;
  room: string;
  students?: number;
}

interface InstructorData {
  schedule: Class[];
  todayClasses: Class[];
}

interface Props {
  data?: InstructorData; // ✅ เปลี่ยนเป็น optional
}

const InstructorDashboard: React.FC<Props> = ({ data }) => {
  // ✅ fallback data ถ้าไม่มี prop data ถูกส่งมา
  const defaultData: InstructorData = {
    schedule: [
      { day: 'Monday', time: '09:00', subject: 'Math', room: '101', students: 30 },
      { day: 'Tuesday', time: '11:00', subject: 'Physics', room: '202', students: 25 },
    ],
    todayClasses: [
      { time: '09:00', subject: 'Math', room: '101', students: 30 },
    ],
  };

  const finalData = data || defaultData;

  return (
    <div className="instructor-dashboard">
      <div className="instructor-schedule">
        <ScheduleCard schedule={finalData.schedule} title="ตารางสอนประจำสัปดาห์" />
        <ScheduleCard schedule={finalData.todayClasses} title="วิชาที่สอนวันนี้" />
      </div>
    </div>
  );
};

export default InstructorDashboard;
