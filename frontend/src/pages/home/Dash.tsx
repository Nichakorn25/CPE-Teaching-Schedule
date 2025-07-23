import React, { useState } from "react";
import {
  Calendar,
  Users,
  BookOpen,
  Clock,
  ChevronLeft,
  ChevronRight,
  User,
} from "lucide-react";
import "./Dash.css";

interface ScheduleItem {
  day?: string;
  time: string;
  subject?: string;
  task?: string;
  room?: string;
  location?: string;
}

interface DashboardData {
  Admin: {
    totalUsers: number;
    totalCourses: number;
    activeTermCourses: number;
  };
  Instructor: {
    todayClasses: ScheduleItem[];
  };
  Scheduler: {
    activeTermCourses: number;
    todayClasses: ScheduleItem[];
  };
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  delay: number;
}

interface ScheduleCardProps {
  schedule: ScheduleItem[];
  title: string;
}

type TaskType = "meeting" | "class" | "other";

const Dashboard: React.FC = () => {
  const curRole = localStorage.getItem("role");
  const [currentRole, setCurrentRole] = useState(curRole);

  ///////////////////////////////// ด้านบนแก้แล้ว
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Mock data for different roles
  const dashboardData: DashboardData = {
    Admin: {
      totalUsers: 1247,
      totalCourses: 89,
      activeTermCourses: 34,
    },
    Instructor: {
      todayClasses: [
        {
          time: "08:00-10:00",
          subject: "คณิตศาสตร์ 101",
          room: "A-201",
        },
        {
          time: "13:00-15:00",
          subject: "สถิติเบื้องต้น",
          room: "B-105",
        },
      ],
    },
    Scheduler: {
      activeTermCourses: 28,
      todayClasses: [
        {
          time: "08:00-10:00",
          subject: "คณิตศาสตร์ 101",
          room: "A-201",
        },
        {
          time: "13:00-15:00",
          subject: "สถิติเบื้องต้น",
          room: "B-105",
        },
      ],
    },
  };

  const user = {
    Username: "jdoe",
    Firstname: "John",
    Lastname: "Doe",
    Email: "jdoe@example.com",
    PhoneNumber: "0912345678",
    Address: "123 ถนนมหาวิทยาลัย กรุงเทพฯ",
    Image: "https://via.placeholder.com/100", // หรือ URL จริง
    Title: { Name: "อาจารย์" },
    Position: { Name: "อาจารย์ประจำ" },
    Major: { Name: "วิทยาการคอมพิวเตอร์" },
    Role: { Name: currentRole },
  };

  ////////////////////////////////////////////   dash-role

  const data = currentRole ? dashboardData[currentRole] : null;

  const adminData = currentRole === "Admin" ? dashboardData.Admin : null;
  const schedulerData =
    currentRole === "Scheduler" ? dashboardData.Scheduler : null;

  // Calendar functions
  const getDaysInMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
    });
  };

  const navigateMonth = (direction: number): void => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const StatCard: React.FC<StatCardProps> = ({ title, value, icon, delay }) => (
    <div
      className={`stat-card bg-red-500 text-green`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="stat-card-content">
        <div className="stat-info">
          <p className="stat-title">{title}</p>
          <h3 className="stat-value">{value.toLocaleString()}</h3>
        </div>
        <div className="stat-icon-container">{icon}</div>
      </div>
    </div>
  );

  const ScheduleCard: React.FC<ScheduleCardProps> = ({ schedule, title }) => (
    <div className="schedule-card">
      <h3 className="schedule-title">
        <Clock className="schedule-icon" />
        {title}
      </h3>
      <div className="schedule-list">
        {Array.isArray(schedule) &&
          schedule.map((item, index) => (
            <div key={index} className="schedule-item">
              <div className="schedule-item-content">
                <p className="schedule-subject">{item.subject || item.task}</p>
                <p className="schedule-details">
                  {item.time} | {item.room || item.location}
                </p>
              </div>
              <span className="schedule-day">{item.day || "วันนี้"}</span>
            </div>
          ))}
      </div>
    </div>
  );

  const UserProfileCard: React.FC = () => (
    <div className="user-profile-card">
      <h3 className="profile-title">
        <User className="profile-icon" />
        ข้อมูลผู้ใช้
      </h3>
      <div className="profile-content">
        <img src={user.Image} alt="User Profile" className="profile-image" />
        <div className="profile-info">
          <p>
            <strong>ชื่อ:</strong> {user.Title.Name} {user.Firstname}{" "}
            {user.Lastname}
          </p>
          <p>
            <strong>ตำแหน่ง:</strong> {user.Position.Name}
          </p>
          <p>
            <strong>สาขา:</strong> {user.Major.Name}
          </p>
          <p>
            <strong>Email:</strong> {user.Email}
          </p>
          <p>
            <strong>เบอร์โทร:</strong> {user.PhoneNumber}
          </p>
          <p>
            <strong>ที่อยู่:</strong> {user.Address}
          </p>
          <p>
            <strong>บทบาท:</strong> {user.Role.Name}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="dashboard">
      <div className="dashboard-content">
        <div className="dashboard-grid">
          <div className="main-content">
            {currentRole === "Admin" && adminData && (
              <div className="flex flex-col md:flex-column gap-4">
                <StatCard
                  title="จำนวน Users ทั้งหมด"
                  value={adminData.totalUsers}
                  icon={<div className="stat-icon"><Users /></div>}
                  delay={0}
                />
                <StatCard
                  title="จำนวน Course ทั้งหมด"
                  value={adminData.totalCourses}
                  icon={<div className="stat-icon"><BookOpen /></div>}
                  delay={100}
                />
                <StatCard
                  title="วิชาเปิดสอนในเทอมนี้"
                  value={adminData.activeTermCourses}
                  icon={<div className="stat-icon"><Calendar /></div>}
                  delay={200}
                />
              </div>
            )}

            {currentRole === "Scheduler" && schedulerData && (
              <div className="scheduler-stats">
                <StatCard
                  title="วิชาเปิดสอนในเทอมนี้"
                  value={schedulerData.activeTermCourses}
                  icon={<Calendar className="stat-icon" />}
                  delay={0}
                />
              </div>
            )}

            {currentRole === "Instructor" && (
              <div className="schedule-grid">
                <ScheduleCard
                  schedule={data.todayClasses}
                  title="วิชาที่สอนวันนี้"
                />
              </div>
            )}

            {currentRole === "Scheduler" && (
              <div className="schedule-grid">
                <ScheduleCard
                  schedule={data.todayClasses}
                  title="วิชาที่สอนวันนี้"
                />
              </div>
            )}
          </div>

          <div className="sidebar">
            <UserProfileCard />

            <div className="calendar-card">
              <div className="calendar-header">
                <h2 className="calendar-title">
                  <Calendar className="calendar-icon" />
                  ปฏิทิน
                </h2>
                <div className="calendar-navigation">
                  <button
                    onClick={() => navigateMonth(-1)}
                    className="nav-button"
                  >
                    <ChevronLeft className="nav-icon" />
                  </button>
                  <h3 className="calendar-month">{formatDate(currentDate)}</h3>
                  <button
                    onClick={() => navigateMonth(1)}
                    className="nav-button"
                  >
                    <ChevronRight className="nav-icon" />
                  </button>
                </div>
              </div>

              <div className="calendar-grid">
                {["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"].map((day) => (
                  <div key={day} className="calendar-day-header">
                    {day}
                  </div>
                ))}

                {Array.from(
                  { length: getFirstDayOfMonth(currentDate) },
                  (_, i) => (
                    <div key={`empty-${i}`} className="calendar-empty"></div>
                  )
                )}

                {Array.from({ length: getDaysInMonth(currentDate) }, (_, i) => {
                  const day = i + 1;
                  const isToday =
                    new Date().toDateString() ===
                    new Date(
                      currentDate.getFullYear(),
                      currentDate.getMonth(),
                      day
                    ).toDateString();

                  return (
                    <div
                      key={day}
                      className={`calendar-day ${
                        isToday ? "today bg-blue-500 text-white" : ""
                      }`}
                    >
                      {day}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
