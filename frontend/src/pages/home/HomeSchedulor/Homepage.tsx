import React from 'react';
import ScheduleCard from '../ScheduleCard';
import StatCard from '../StatCard';
import { Calendar } from 'lucide-react';

interface Task {
  day?: string;
  time: string;
  subject?: string;
  task?: string;
  room?: string;
  location?: string;
}

interface SchedulerData {
  activeTermCourses: number;
  termGrowth: string;
  schedule: Task[];
  todayTasks: Task[];
  accent: string;
  color: string;
}

interface Props {
  data?: SchedulerData;
}

const SchedulerDashboard: React.FC<Props> = ({ data }) => {
  const fallbackData: SchedulerData = {
    activeTermCourses: 0,
    termGrowth: '0%',
    schedule: [],
    todayTasks: [],
    accent: 'gray',
    color: 'lightgray'
  };

  const finalData = data || fallbackData;

  return (
    <div className="scheduler-dashboard">
      <div className="scheduler-stats">
        <StatCard
          title="วิชาเปิดสอนในเทอมนี้"
          value={finalData.activeTermCourses}
          growth={finalData.termGrowth}
          icon={<Calendar size={32} />}
          accent={finalData.accent}
          color={finalData.color}
        />
      </div>
      <div className="scheduler-schedule">
        <ScheduleCard schedule={finalData.schedule} title="ตารางงานประจำสัปดาห์" />
        <ScheduleCard schedule={finalData.todayTasks} title="งานวันนี้" />
      </div>
    </div>
  );
};


export default SchedulerDashboard;
