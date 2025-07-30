export interface ScheduleInterface {
  ID?: number;
  NameTable: string;
  SectionNumber?: number;
  DayOfWeek: string;
  StartTime: Date;
  EndTime: Date;

  OfferedCoursesID: number;
  OfferedCourses?: OfferedCoursesInterface;

  TimeFixedCourses?: TimeFixedCoursesInterface[];
}

export interface OfferedCoursesInterface {
  ID?: number;
  Year: number;
  Term: number;
  Section: number;
  Capacity: number;
  IsFixCourses: boolean;

  UserID: number;
  User?: UserInterface;

  AllCoursesID: number;
  AllCourses?: AllCoursesInterface;

  LaboratoryID?: number;
  Laboratory?: LaboratoryInterface;

  Schedule?: ScheduleInterface[];
}

export interface TimeFixedCoursesInterface {
  ID?: number;
  Year: number;
  Term: number;
  DayOfWeek: string;
  StartTime: Date;
  EndTime: Date;
  RoomFix: string;
  Section: number;
  Capacity: number;

  AllCoursesID: number;
  AllCourses?: AllCoursesInterface;

  ScheduleID: number;
  Schedule?: ScheduleInterface;
}

export interface AllCoursesInterface {
  ID?: number;

  Code?: string;
  EnglishName?: string;
  ThaiName?: string;

  OfferedCourses?: OfferedCoursesInterface[];
  TimeFixedCourses?: TimeFixedCoursesInterface[];
}

export interface LaboratoryInterface {
  ID?: number;
  Room: string;
  Building: string;
  Capacity: string;

  OfferedCourses?: OfferedCoursesInterface[];
}

export interface UserInterface {
  ID?: number;
  Username: string;
  Password: string;
  Firstname: string;
  Lastname: string;
  Image: string;
  Email: string;
  PhoneNumber: string;
  Address: string;
  FirstPassword: boolean;

  OfferedCourses?: OfferedCoursesInterface[];
}

///////////////////////////////////////////////////////////////////////
export interface UserProfile {
  id: number;
  username: string;
  title_id: number;
  title_name: string;
  firstname: string;
  lastname: string;
  email: string;
  phone_number: string;
  address: string;
  image: string;
  major: string;
  major_id: number;
  position: string;
  position_id: number;
  role: string;
  role_id: number;
}

export interface CourseIn {
  ID: number;
  No: number;
  CourseCode: string;
  CourseName: string;
  CourseType: string;
  Credit: string;
  CurriculumID: number;
  Instructor: string;
}

export interface ScheduleCardProps {
  schedules: ScheduleCardIn[];
}

export interface ScheduleCardIn {
  time: string;
  section: string;
  code: string;
  subject_Eng: string;
  subject_Thai: string;
  room: string;
}

export interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  delay: number;
}