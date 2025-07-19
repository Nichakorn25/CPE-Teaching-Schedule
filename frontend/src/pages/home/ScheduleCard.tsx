import React from 'react';
import { Clock } from 'lucide-react';

interface ScheduleItem {
  day?: string;
  time: string;
  subject?: string;
  task?: string;
  room?: string;
  location?: string;
  students?: number;
}

interface Props {
  schedule: ScheduleItem[];
  title: string;
}

const ScheduleCard: React.FC<Props> = ({ schedule, title }) => {
  return (
    <div className="schedule-card">
      <h3 className="schedule-title">
        <Clock size={20} /> {title}
      </h3>
      <div className="schedule-items">
        {schedule.map((item, index) => (
          <div key={index} className="schedule-item">
            <div>
              <p>{item.subject || item.task}</p>
              <p>{item.time} | {item.room || item.location}</p>
              {item.students && <p>นักเรียน: {item.students} คน</p>}
            </div>
            <span>{item.day || 'วันนี้'}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScheduleCard;
