import React, { useState, useEffect } from "react";
import { Button, Spin, message } from "antd";
import dayjs from "dayjs";
import { getSchedulesBynameTable, postAutoGenerateSchedule } from "./SchedulerPageService";

const days = ["จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์"];
const startHour = 8;
const endHour = 21;

interface Schedule {
  ID: number;
  NameTable: string;
  DayOfWeek: string;
  StartTime: string;
  EndTime: string;
  SectionNumber: number;
  OfferedCoursesID: number;
  IsFixCourses: boolean;
  LaboratoryID?: number | null;
  Laboratory?: {
    ID: number;
    Room: string;
  };
  OfferedCourses: {
    ID: number;
    Section: number;
    IsFixCourses: boolean;
    Capacity?: number;
    Year: number;
    Term: number;
    UserID: number;
    User?: {
      ID: number;
      Username: string;
    };
    UserAllCourses?: Array<{
      ID: number;
      UserID: number;
      User?: {
        ID: number;
        Username: string;
      };
    }>;
    AllCourses: {
      ID: number;
      Code: string;
      ThaiName: string;
      EnglishName: string;
      CreditID?: number;
      Credit?: {
        ID: number;
        Unit: number;
      };
      CurriculumID?: number;
      Curriculum?: {
        ID: number;
        CurriculumName: string;
        Major?: {
          ID: number;
          MajorName: string;
        };
      };
      AcademicYearID?: number;
      AcademicYear?: {
        ID: number;
        Level: string;
      };
      TypeOfCoursesID?: number;
      TypeOfCourses?: {
        ID: number;
        Type: number;
      };
      CreatedAt: string;
      UpdatedAt: string;
      DeletedAt?: string | null;
    };
    LaboratoryID?: number | null;
    Laboratory?: {
      ID: number;
      Room: string;
    };
    CreatedAt: string;
    UpdatedAt: string;
    DeletedAt?: string | null;
  };
  CreatedAt: string;
  UpdatedAt: string;
  DeletedAt?: string | null;
}

export default function ScheduleGrid() {
  const [academicYear] = useState(localStorage.getItem("academicYear") || "");
  const [term] = useState(localStorage.getItem("term") || "");
  const [major_name] = useState(localStorage.getItem("major_name") || "");
  const [loading, setLoading] = useState(false);
  const [schedules, setSchedules] = useState<any[]>([]);

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const res = await getSchedulesBynameTable(major_name, academicYear, term);
      if (res?.status === 200) {
        setSchedules(res.data);
      } else {
        message.error("ไม่สามารถดึงข้อมูลตารางได้");
      }
    } catch {
      message.error("เกิดข้อผิดพลาดในการโหลดตาราง");
    }
    setLoading(false);
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await postAutoGenerateSchedule(
        Number(academicYear),
        Number(term),
        major_name
      );
      if (res?.status === 200) {
        message.success("สร้างตารางเรียบร้อยแล้ว");
        fetchSchedules();
      } else {
        message.error("ไม่สามารถสร้างตารางได้");
      }
    } catch {
      message.error("เกิดข้อผิดพลาดในการสร้างตาราง");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const getClassesAt = (day: string, hour: number) => {
    return schedules.filter((s) => {
      if (s.DayOfWeek !== day) return false;
      const start = dayjs(s.StartTime).hour();
      const end = dayjs(s.EndTime).hour();
      return hour >= start && hour < end;
    });
  };

  return (
    <div className="p-4">
      <div className="flex justify-between mb-4">
        <h2 className="text-lg font-bold">
          ตารางสอน ปี {academicYear} เทอม {term} ({major_name})
        </h2>
        <Button type="primary" onClick={handleGenerate}>
          สร้างตารางอัตโนมัติ
        </Button>
      </div>

      {loading ? (
        <Spin />
      ) : (
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border p-2 w-24">วัน/เวลา</th>
                {Array.from({ length: endHour - startHour }, (_, i) => startHour + i).map(
                  (hour) => (
                    <th key={hour} className="border p-2 text-center">
                      {hour}:00 - {hour + 1}:00
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {days.map((day) => (
                <tr key={day}>
                  <td className="border p-2 font-semibold text-center">{day}</td>
                  {Array.from({ length: endHour - startHour }, (_, i) => startHour + i).map(
                    (hour) => {
                      const classes = getClassesAt(day, hour);
                      return (
                        <td key={hour} className="border p-1 align-top space-y-1">
                          {classes.map((cls) => (
                            <div
                              key={cls.ID}
                              className="bg-blue-100 p-1 rounded shadow text-xs"
                            >
                              <div className="font-semibold">
                                {cls.OfferedCourses?.AllCourses?.Code}
                              </div>
                              <div className="font-medium">
                                {cls.OfferedCourses?.AllCourses?.ThaiName}
                              </div>
                              <div>Section {cls.OfferedCourses?.Section}</div>
                              <div className="text-gray-700">
                                {cls.OfferedCourses?.UserAllCourses
                                  ?.map((u) => u.User?.Username)
                                  .join(", ")}
                              </div>
                              <div className="text-gray-500">
                                {dayjs(cls.StartTime).format("HH:mm")} -{" "}
                                {dayjs(cls.EndTime).format("HH:mm")}
                              </div>
                            </div>
                          ))}
                        </td>
                      );
                    }
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
