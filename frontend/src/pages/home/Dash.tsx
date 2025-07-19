import React, { useState } from "react";
import {
  Calendar,
  Users,
  BookOpen,
  Clock,
  Plus,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  User,
  GraduationCap,
  CalendarDays,
  AlertCircle,
} from "lucide-react";
import "./Dash.css";

interface Task {
  id: number;
  title: string;
  time: string;
  type: "meeting" | "class" | "other";
  createdBy: string;
  isGlobal: boolean;
}

interface ScheduleItem {
  day?: string;
  time: string;
  subject?: string;
  task?: string;
  room?: string;
  location?: string;
  students?: number;
}

interface Notification {
  id: number;
  type: "urgent" | "reminder" | "info";
  title: string;
  time: string;
  message: string;
}

interface DashboardData {
  admin: {
    totalUsers: number;
    totalCourses: number;
    activeTermCourses: number;
    userGrowth: string;
    courseGrowth: string;
    termGrowth: string;
  };
  instructor: {
    todayClasses: ScheduleItem[];
  };
  scheduler: {
    activeTermCourses: number;
    termGrowth: string;
    schedule: ScheduleItem[];
  };
}

interface StatCardProps {
  title: string;
  value: number;
  growth: string;
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
  const [showTaskModal, setShowTaskModal] = useState<boolean>(false);
  const [globalTasks, setGlobalTasks] = useState<Record<string, Task[]>>({});
  const [personalTasks, setPersonalTasks] = useState<Record<string, Task[]>>(
    {}
  );
  const [newTask, setNewTask] = useState<{
    title: string;
    time: string;
    type: TaskType;
  }>({ title: "", time: "", type: "meeting" });

  // Mock data for different roles
  const dashboardData: DashboardData = {
    admin: {
      totalUsers: 1247,
      totalCourses: 89,
      activeTermCourses: 34,
      userGrowth: "+12%",
      courseGrowth: "+8%",
      termGrowth: "+15%",
    },
    instructor: {
      todayClasses: [
        {
          time: "08:00-10:00",
          subject: "คณิตศาสตร์ 101",
          room: "A-201",
          students: 45,
        },
        {
          time: "13:00-15:00",
          subject: "สถิติเบื้องต้น",
          room: "B-105",
          students: 32,
        },
      ],
    },
    scheduler: {
      activeTermCourses: 28,
      termGrowth: "+12%",
      schedule: [
        {
          day: "จันทร์",
          time: "09:00-11:00",
          subject: "ประชุมแผนการสอน",
          room: "Conference Room",
        },
        {
          day: "อังคาร",
          time: "14:00-15:00",
          subject: "ตรวจสอบตารางสอน",
          room: "Office",
        },
        {
          day: "พุธ",
          time: "10:00-12:00",
          subject: "ประชุมอาจารย์",
          room: "Conference Room",
        },
        {
          day: "ศุกร์",
          time: "13:00-14:00",
          subject: "วางแผนเทอมใหม่",
          room: "Office",
        },
      ],
    },
  };

  const notifications: Notification[] = [
    {
      id: 1,
      type: "urgent",
      title: "ประชุมฉุกเฉิน",
      time: "14:00 วันนี้",
      message: "ประชุมผู้บริหารเรื่องการปรับตารางเรียน",
    },
    {
      id: 2,
      type: "reminder",
      title: "เตือนส่งเอกสาร",
      time: "พรุ่งนี้",
      message: "ส่งแผนการสอนเทอมใหม่",
    },
    {
      id: 3,
      type: "info",
      title: "อัพเดทระบบ",
      time: "2 ชม. ที่แล้ว",
      message: "ระบบจะปิดปรับปรุงวันเสาร์ 02:00-04:00",
    },
  ];
  ////////////////////////////////////////////   dash-role

  const data = currentRole ? dashboardData[currentRole] : null;

  const adminData = currentRole === "Admin" ? dashboardData.admin : null;
  const schedulerData =
    currentRole === "Scheduler" ? dashboardData.scheduler : null;

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

  const handleDateClick = (day: number): void => {
    const clickedDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    );
    setSelectedDate(clickedDate);
    setShowTaskModal(true);
  };

  const addTask = (): void => {
    if (selectedDate && newTask.title) {
      const dateKey = selectedDate.toDateString();
      const taskWithRole: Task = {
        ...newTask,
        id: Date.now(),
        createdBy: currentRole ?? "unknown",
        isGlobal: currentRole === "admin",
      };

      if (currentRole === "admin") {
        setGlobalTasks((prev) => ({
          ...prev,
          [dateKey]: [...(prev[dateKey] || []), taskWithRole],
        }));
      } else {
        setPersonalTasks((prev) => ({
          ...prev,
          [`${currentRole}_${dateKey}`]: [
            ...(prev[`${currentRole}_${dateKey}`] || []),
            taskWithRole,
          ],
        }));
      }

      setNewTask({ title: "", time: "", type: "meeting" });
      setShowTaskModal(false);
    }
  };

  const hasTask = (day: number): boolean => {
    const date = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    );
    const dateKey = date.toDateString();
    const personalKey = `${currentRole}_${dateKey}`;

    const hasGlobalTask = (globalTasks[dateKey]?.length || 0) > 0;
    const hasPersonalTask = (personalTasks[personalKey]?.length || 0) > 0;

    return hasGlobalTask || hasPersonalTask;
  };

  const getTasksForDate = (date: Date): Task[] => {
    const dateKey = date.toDateString();
    const personalKey = `${currentRole}_${dateKey}`;

    const global = globalTasks[dateKey] || [];
    const personal = personalTasks[personalKey] || [];

    return [...global, ...personal];
  };

  const StatCard: React.FC<StatCardProps> = ({
    title,
    value,
    growth,
    icon,
    delay,
  }) => (
    <div 
      className={`stat-card accent-blue`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="stat-card-content">
        <div className="stat-info">
          <p className="stat-title">{title}</p>
          <h3 className="stat-value">{value.toLocaleString()}</h3>
          <p
            className={`stat-growth ${
              growth.startsWith("+") ? "positive" : "negative"
            }`}
          >
            {growth} จากเดือนที่แล้ว
          </p>
        </div>
        <div className={`stat-icon-container color-green`}>{icon}</div>
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
        {schedule.map((item, index) => (
          <div key={index} className="schedule-item">
            <div className="schedule-item-content">
              <p className="schedule-subject">{item.subject || item.task}</p>
              <p className="schedule-details">
                {item.time} | {item.room || item.location}
              </p>
              {item.students && (
                <p className="schedule-students">
                  นักเรียน: {item.students} คน
                </p>
              )}
            </div>
            <span className="schedule-day">{item.day || "วันนี้"}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const NotificationCard: React.FC = () => (
    <div className="notification-card">
      <h3 className="notification-title">
        <Bell className="notification-icon" />
        การแจ้งเตือน
      </h3>
      <div className="notification-list">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`notification-item ${notification.type}`}
          >
            <div className="notification-content">
              <div className="notification-header">
                <AlertCircle
                  className={`notification-alert-icon ${notification.type}`}
                />
                <h4 className="notification-item-title">
                  {notification.title}
                </h4>
              </div>
              <p className="notification-message">{notification.message}</p>
              <p className="notification-time">{notification.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const handleTaskTitleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    setNewTask({ ...newTask, title: e.target.value });
  };

  const handleTaskTimeChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    setNewTask({ ...newTask, time: e.target.value });
  };

  const handleTaskTypeChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ): void => {
    setNewTask({ ...newTask, type: e.target.value as TaskType });
  };

  return (
    <div className="dashboard">
      <div className="dashboard-content">
        <div className="dashboard-grid">
          {/* Left Side Content */}
          <div className="main-content">
            {currentRole === "Admin" && adminData && (
              <div className="stats-grid">
                <StatCard
                  title="จำนวน Users ทั้งหมด"
                  value={adminData.totalUsers}
                  growth={adminData.userGrowth}
                  icon={<Users className="stat-icon" />}
                  delay={0}
                />
                <StatCard
                  title="จำนวน Course ทั้งหมด"
                  value={adminData.totalCourses}
                  growth={adminData.courseGrowth}
                  icon={<BookOpen className="stat-icon" />}
                  delay={100}
                />
                <StatCard
                  title="วิชาเปิดสอนในเทอมนี้"
                  value={adminData.activeTermCourses}
                  growth={adminData.termGrowth}
                  icon={<Calendar className="stat-icon" />}
                  delay={200}
                />
              </div>
            )}

            {currentRole === "Scheduler" && schedulerData && (
              <div className="scheduler-stats">
                <StatCard
                  title="วิชาเปิดสอนในเทอมนี้"
                  value={schedulerData.activeTermCourses}
                  growth={schedulerData.termGrowth}
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

          {/* Right Side - Notifications and Calendar */}
          <div className="sidebar">
            {/* Notifications */}
            <NotificationCard />

            {/* Calendar */}
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

              {/* Calendar Grid */}
              <div className="calendar-grid">
                {["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"].map((day) => (
                  <div key={day} className="calendar-day-header">
                    {day}
                  </div>
                ))}

                {/* Empty cells for days before month starts */}
                {Array.from(
                  { length: getFirstDayOfMonth(currentDate) },
                  (_, i) => (
                    <div key={`empty-${i}`} className="calendar-empty"></div>
                  )
                )}

                {/* Days of the month */}
                {Array.from({ length: getDaysInMonth(currentDate) }, (_, i) => {
                  const day = i + 1;
                  const isToday =
                    new Date().toDateString() ===
                    new Date(
                      currentDate.getFullYear(),
                      currentDate.getMonth(),
                      day
                    ).toDateString();
                  const hasTaskToday = hasTask(day);

                  return (
                    <div
                      key={day}
                      onClick={() => handleDateClick(day)}
                      className={`
                        calendar-day
                        ${isToday ? "today bg-blue-500 text-white" : ""}
                        ${hasTaskToday && !isToday ? "has-task" : ""}
                      `}
                    >
                      {day}
                      {hasTaskToday && <div className="task-indicator"></div>}
                    </div>
                  );
                })}
              </div>

              {/* Task Display */}
              {selectedDate && getTasksForDate(selectedDate).length > 0 && (
                <div className="task-display">
                  <h4 className="task-display-title">
                    Tasks - {selectedDate.getDate()}/
                    {selectedDate.getMonth() + 1}:
                  </h4>
                  <div className="task-list">
                    {getTasksForDate(selectedDate).map((task) => (
                      <div key={task.id} className="task-item">
                        <div className="task-header">
                          <div className="task-title">{task.title}</div>
                          {task.isGlobal && (
                            <span className="global-badge">Global</span>
                          )}
                        </div>
                        {task.time && (
                          <div className="task-time">เวลา: {task.time}</div>
                        )}
                        <div className="task-footer">
                          <span className={`task-type-badge ${task.type}`}>
                            {task.type === "meeting"
                              ? "ประชุม"
                              : task.type === "class"
                              ? "สอน"
                              : "อื่นๆ"}
                          </span>
                          {task.createdBy && (
                            <span className="task-creator">
                              โดย:{" "}
                              {task.createdBy === "admin"
                                ? "Admin"
                                : task.createdBy === "instructor"
                                ? "อาจารย์"
                                : "ผู้จัดตาราง"}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Task Modal */}
      {showTaskModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">
              เพิ่ม Task - {selectedDate?.getDate()}{" "}
              {selectedDate?.toLocaleDateString("th-TH", { month: "long" })}
              {currentRole === "Admin" && (
                <div className="modal-subtitle">
                  * Task ที่ Admin เพิ่มจะแสดงให้ทุก role เห็น
                </div>
              )}
              {currentRole !== "Admin" && (
                <div className="modal-subtitle">
                  * Task นี้จะแสดงเฉพาะคุณเท่านั้น
                </div>
              )}
            </h3>
            <div className="modal-form">
              <input
                type="text"
                placeholder="ชื่อ Task"
                value={newTask.title}
                onChange={handleTaskTitleChange}
                className="modal-input"
              />
              <input
                type="time"
                value={newTask.time}
                onChange={handleTaskTimeChange}
                className="modal-input"
              />
              <select
                value={newTask.type}
                onChange={handleTaskTypeChange}
                className="modal-select"
              >
                <option value="meeting">ประชุม</option>
                <option value="class">สอน</option>
                <option value="other">อื่นๆ</option>
              </select>
            </div>
            <div className="modal-actions">
              <button
                onClick={addTask}
                className={"modal-button primary bg-blue-500"}
              >
                เพิ่ม Task
              </button>
              <button
                onClick={() => setShowTaskModal(false)}
                className="modal-button secondary"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
