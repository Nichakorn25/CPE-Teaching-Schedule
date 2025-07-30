import React, { useState, useEffect } from "react";
import {
  Calendar,
  Users,
  BookOpen,
  Clock,
  ChevronLeft,
  ChevronRight,
  User,
} from "lucide-react";
import {
  getUserById,
  getAllTeachers,
  getAllCourses,
} from "../../services/https/AdminPageServices";
import { getSchedulesBynameTableid } from "../../services/https/SchedulerPageService";
import {
  UserProfile,
  CourseIn,
  ScheduleInterface,
  ScheduleCardProps,
} from "../../interfaces/Dash";
import "./Dash.css";

interface DashboardData {
  Admin: {
    totalUsers: number;
    totalCourses: number;
    activeTermCourses: number;
  };
  Scheduler: {
    activeTermCourses: number;
  };
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  delay: number;
}

const Dashboard: React.FC = () => {
  const curRole = localStorage.getItem("role");
  const [currentRole, setCurrentRole] = useState(curRole);

  const [userid, setUserid] = useState<UserProfile | null>(null);
  async function fetchUser() {
    const user_id = localStorage.getItem("user_id");
    if (!user_id) return;

    try {
      const userData = await getUserById(user_id);
      setUserid(userData.data);
      console.log("ข้อมูลผู้ใช้งาน:", userData.data);
    } catch (error) {
      console.error("ไม่สามารถดึงข้อมูลผู้ใช้ได้:", error);
    }
  }

  const [allinstructor, setallinstructor] = useState<UserProfile[]>([]);
  const getallinstructor = async () => {
    let res = await getAllTeachers();
    if (res && Array.isArray(res.data)) {
      setallinstructor(res.data);
    }
  };

  const [allCourses, setallCourses] = useState<CourseIn[]>([]);
  const getallCourses = async () => {
    let res = await getAllCourses();
    if (res && Array.isArray(res.data)) {
      setallCourses(res.data);
    }
  };

  useEffect(() => {
    getallinstructor();
    getallCourses();
    fetchUser();
  }, []);

  ////////////////////////////////////////// global
  const [academicYear, setAcademicYear] = useState(() => {
    return localStorage.getItem("academicYear") || "";
  });

  const [term, setTerm] = useState(() => {
    return localStorage.getItem("term") || "";
  });
  ////////////////////////////////////////อย่าลืมว่า USERID ด้วย
  useEffect(() => {
    if (academicYear && term) {
      const nameTable = `ปีการศึกษา ${academicYear} เทอม ${term}`;
      getSchedules(nameTable);
    }
  }, [academicYear, term]);

  const [allSchedule, setallSchedule] = useState<ScheduleInterface[]>([]);
  const getSchedules = async (nameTable: string) => {
    const user_id = localStorage.getItem("user_id");
    let res = await getSchedulesBynameTableid(nameTable, String(user_id));
    if (res && Array.isArray(res.data)) {
      setallSchedule(res.data);
      console.log("sdfghjkl;", res.data);
    }
  };

  const getThaiDayName = (): string => {
    const daysInThai = [
      "อาทิตย์",
      "จันทร์",
      "อังคาร",
      "พุธ",
      "พฤหัสบดี",
      "ศุกร์",
      "เสาร์",
    ];
    const today = new Date();
    return daysInThai[today.getDay()];
  };

  const todayName = getThaiDayName();
  const todaySchedule = allSchedule.filter(
    (sch) => sch.DayOfWeek === todayName
  );

  const mapToSchedule = (schedule: ScheduleInterface[]) => {
    const now = new Date();
    const mapped = schedule.map((item) => {
      const startDate = new Date(item.StartTime);
      const start = startDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      const end = new Date(item.EndTime).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });

      return {
        time: `${start}-${end}`,
        section:
          item.SectionNumber !== undefined && item.SectionNumber !== null
            ? String(item.SectionNumber)
            : "ไม่ทราบกลุ่มเรียน",
        code: item.OfferedCourses?.AllCourses?.Code || "ไม่ทราบชื่อวิชา",
        subject_Eng:
          item.OfferedCourses?.AllCourses?.EnglishName || "ไม่ทราบชื่อวิชา",
        subject_Thai:
          item.OfferedCourses?.AllCourses?.ThaiName || "ไม่ทราบชื่อวิชา",
        room: item.OfferedCourses?.Laboratory?.Room || "ไม่ทราบห้อง",

        _startDate: startDate,
      };
    });

    // sort ใกล้เคียงกับ now มากที่สุดขึ้นก่อน
    mapped.sort((a, b) => {
      const diffA = Math.abs(a._startDate.getTime() - now.getTime());
      const diffB = Math.abs(b._startDate.getTime() - now.getTime());
      return diffA - diffB;
    });
    return mapped.map(({ _startDate, ...rest }) => rest);
  };

  const displaySchedule = mapToSchedule(todaySchedule); // แสดง
  console.log("hj", displaySchedule);

  ////////////////////////////////////////////// global
  const [isEditing, setIsEditing] = useState(false);

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAcademicYear(e.target.value);
  };

  const handleTermChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTerm(e.target.value);
  };

  const handleSave = () => {
    localStorage.setItem("academicYear", academicYear);
    localStorage.setItem("term", term);
    setIsEditing(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  ///////////////////////////////// ด้านบนแก้แล้ว
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  const dashboardData: DashboardData = {
    Admin: {
      totalUsers: 1247,
      totalCourses: 89,
      activeTermCourses: 34,
    },
    Scheduler: {
      activeTermCourses: 28,
    },
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
  ////////////////////////////////////////////////////////////////////////////////////////////////////
  const ScheduleCard: React.FC<ScheduleCardProps> = ({ schedules }) => {
    const now = new Date();

    return (
      <div className="schedule-card">
        <h3 className="schedule-title">
          <Clock className="schedule-icon" />
          ตารางสอนวันนี้
        </h3>
        <div className="schedule-list">
          {Array.isArray(schedules) && schedules.length > 0 ? (
            schedules.map((item, index) => {
              const [startStr, endStr] = item.time.split("-");
              const [endHour, endMinute] = endStr.split(":").map(Number);
              const endDateTime = new Date();
              endDateTime.setHours(endHour, endMinute, 0, 0);

              const isPast = now > endDateTime;

              return (
                <div
                  key={index}
                  className={`schedule-item ${isPast ? "schedule-past" : ""}`}
                >
                  <div className="schedule-item-content">
                    <p className="schedule-subject">
                      {item.code} - {item.subject_Thai} ({item.subject_Eng})
                    </p>
                    <p className="schedule-details">
                      เวลา: {item.time} | ห้อง: {item.room} | กลุ่ม:{" "}
                      {item.section}
                    </p>
                  </div>
                  <span className="schedule-day">วันนี้</span>
                </div>
              );
            })
          ) : (
            <p>ไม่มีตารางเรียนสำหรับวันนี้</p>
          )}
        </div>
      </div>
    );
  };

  ////////////////////////////////////////////////////////////////////////////////////////////////////
  const UserProfileCard: React.FC = () => (
    <div className="user-profile-card">
      <h3 className="profile-title">
        <User className="profile-icon" />
        ข้อมูลผู้ใช้
      </h3>
      <div className="profile-content">
        {userid?.image ? (
          <img
            src={userid.image}
            alt="User Profile"
            className="profile-image"
          />
        ) : (
          <User className="profile-image" />
        )}
        <div className="profile-info">
          <p>
            <strong>ชื่อ:</strong> {userid?.title_name} {userid?.firstname}{" "}
            {userid?.lastname}
          </p>
          <p>
            <strong>ตำแหน่ง:</strong> {userid?.position}
          </p>
          <p>
            <strong>สาขา:</strong> {userid?.major}
          </p>
          <p>
            <strong>Email:</strong> {userid?.email}
          </p>
          <p>
            <strong>เบอร์โทร:</strong> {userid?.phone_number}
          </p>
          <p>
            <strong>ที่อยู่:</strong> {userid?.address}
          </p>
          <p>
            <strong>บทบาท:</strong> {userid?.role}
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
            <h2 className="dashboard-title">
              ปีการศึกษา {academicYear || "----"} เทอม {term || "----"}
            </h2>
            {currentRole === "Admin" && (
              <div className={`term-form ${!isEditing ? "disabled-form" : ""}`}>
                <h3>ตั้งค่าปีการศึกษา / เทอม</h3>
                <div className="form-group">
                  <label>ปีการศึกษา:</label>
                  <input
                    type="text"
                    value={academicYear}
                    onChange={handleYearChange}
                    placeholder="เช่น 2568"
                    disabled={!isEditing}
                  />
                </div>
                <div className="form-group">
                  <label>เทอม:</label>
                  <input
                    type="text"
                    value={term}
                    onChange={handleTermChange}
                    placeholder="เช่น 1"
                    disabled={!isEditing}
                  />
                </div>

                <div className="form-actions">
                  {isEditing ? (
                    <button onClick={handleSave}>ตกลง</button>
                  ) : (
                    <button onClick={handleEdit}>แก้ไข</button>
                  )}
                </div>
              </div>
            )}

            {currentRole === "Admin" && adminData && (
              <div className="flex flex-col md:flex-column gap-4">
                <StatCard
                  title="จำนวน Instrutor ทั้งหมด"
                  value={allinstructor.length}
                  icon={
                    <div className="stat-icon">
                      <Users />
                    </div>
                  }
                  delay={0}
                />
                <StatCard
                  title="จำนวน Course ทั้งหมด"
                  value={allCourses.length}
                  icon={
                    <div className="stat-icon">
                      <BookOpen />
                    </div>
                  }
                  delay={100}
                />
                <StatCard
                  title="วิชาเปิดสอนในเทอมนี้"
                  value={adminData.activeTermCourses}
                  icon={
                    <div className="stat-icon">
                      <Calendar />
                    </div>
                  }
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
                <ScheduleCard schedules={displaySchedule} />
              </div>
            )}

            {currentRole === "Scheduler" && (
              <div className="schedule-grid">
                <ScheduleCard schedules={displaySchedule} />
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
