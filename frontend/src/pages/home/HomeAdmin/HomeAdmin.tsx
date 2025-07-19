import React, { useEffect, useState } from 'react';
import './HomeAdmin.css';
import { Users, BookOpen, Calendar } from 'lucide-react';

type StatCardProps = {
  title: string;
  value: number;
  growth: string;
  icon: React.ReactNode;
};

const StatCard: React.FC<StatCardProps> = ({ title, value, growth, icon }) => (
  <div className="stat-card border-purple">
    <div className="stat-header">
      <div>
        <p className="stat-title">{title}</p>
        <h3 className="stat-value">{value.toLocaleString()}</h3>
        <p className={`stat-growth ${growth.startsWith('+') ? 'growth-up' : 'growth-down'}`}>
          {growth} จากเดือนที่แล้ว
        </p>
      </div>
      <div className="stat-icon purple-bg">{icon}</div>
    </div>
  </div>
);

interface AdminDashboardProps {
  data: {
    totalUsers: number;
    totalCourses: number;
    activeTermCourses: number;
    userGrowth: string;
    courseGrowth: string;
    termGrowth: string;
  };
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ data }) => {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const storedRole = localStorage.getItem('role');
    setRole(storedRole);
  }, []);

  return (
    <div className="admin-dashboard">
      <h2 className="dashboard-title">Admin Dashboard</h2>
      {role && <p className="dashboard-role">คุณกำลังเข้าสู่ระบบในบทบาท: <strong>{role}</strong></p>}

      <div className="admin-grid">
        <StatCard
          title="จำนวน Users ทั้งหมด"
          value={data.totalUsers}
          growth={data.userGrowth}
          icon={<Users className="icon-size" />}
        />
        <StatCard
          title="จำนวน Course ทั้งหมด"
          value={data.totalCourses}
          growth={data.courseGrowth}
          icon={<BookOpen className="icon-size" />}
        />
        <StatCard
          title="วิชาเปิดสอนในเทอมนี้"
          value={data.activeTermCourses}
          growth={data.termGrowth}
          icon={<Calendar className="icon-size" />}
        />
      </div>
    </div>
  );
};

export default AdminDashboard;
