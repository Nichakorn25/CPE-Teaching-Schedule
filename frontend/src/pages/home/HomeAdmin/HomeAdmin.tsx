import React from 'react';
import { Users, BookOpen, Calendar } from 'lucide-react';
import StatCard from '../StatCard';

interface AdminData {
  totalUsers: number;
  totalCourses: number;
  activeTermCourses: number;
  userGrowth: string;
  courseGrowth: string;
  termGrowth: string;
  accent: string;
  color: string;
}

interface Props {
  data?: AdminData;
}

const AdminDashboard: React.FC<Props> = ({ data }) => {
  const defaultData: AdminData = {
    totalUsers: 0,
    totalCourses: 0,
    activeTermCourses: 0,
    userGrowth: '0%',
    courseGrowth: '0%',
    termGrowth: '0%',
    accent: 'blue',
    color: 'blue',
  };

  const finalData = data || defaultData;

  return (
    <div className="admin-dashboard">
      <div className="admin-stats">
        <StatCard
          title="จำนวน Users ทั้งหมด"
          value={finalData.totalUsers}
          growth={finalData.userGrowth}
          icon={<Users size={32} />}
          accent={finalData.accent}
          color={finalData.color}
        />
        <StatCard
          title="จำนวน Course ทั้งหมด"
          value={finalData.totalCourses}
          growth={finalData.courseGrowth}
          icon={<BookOpen size={32} />}
          accent={finalData.accent}
          color={finalData.color}
        />
        <StatCard
          title="วิชาเปิดสอนในเทอมนี้"
          value={finalData.activeTermCourses}
          growth={finalData.termGrowth}
          icon={<Calendar size={32} />}
          accent={finalData.accent}
          color={finalData.color}
        />
      </div>
    </div>
  );
};

export default AdminDashboard;
