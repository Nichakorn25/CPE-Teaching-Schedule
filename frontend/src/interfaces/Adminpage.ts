
// แก้ไขใช้ได้เลยนะคับ

export interface CreateCourseInteface {
  Code: string;
  EnglishName: string;
  ThaiName: string;
  CurriculumID: number;
  AcademicYearID: number;
  TypeOfCoursesID: number;
  Unit: number;
  Lecture:number;
  Lab:number;
  Self:number;
  UserIDs: number[]; 
}

export interface AllCourseInterface {
  seq:number;
  id: number;
  code: string;
  name: string;
  credit: string;
  category: string;
  instructors: string[];
}

export interface CreateUserInterface {
  Username: string;
  Password: string;
  Firstname: string;
  Lastname: string;
  Image: string;
  Email: string;
  PhoneNumber: string;
  Address: string;
  TitleID: number;
  PositionID: number;
  MajorID: number;
  RoleID: number;
}

export interface AllTeacher {
  ID: number,
  DeleteID: number,
  Title?: string | { Title: string };
  Firstname: string,
  Lastname: string,
  Email: string,
  EmpId: string,
  Department: string,
  Major: string,
  Position: string,
  Status: string,
  Role: string,
}

export interface Alltitles {
  ID: number;
  Title: string,
}

export interface Allposition {
  ID: number;
  Position: string,
}

export interface AllRoleInterface {
  ID: number;
  Role: string,
}

export interface DepartmentInterface {
  ID: number;
  DepartmentName: string;
}

export interface MajorInterface {
  ID: number;
  MajorName: string;
  DepartmentID: number;
  Department: DepartmentInterface;
}

export interface OpenCourseInterface {
  ID: number;
  Year: number;
  Term: number;
  Code: string;
  Name: string;
  Credit: string;
  TypeName: string;
  Teacher: string;
  GroupInfos: {
    Room: string;
    Group: string;
    Day: string;
    Time: string;
  }[];
  GroupTotal: number;
  CapacityPer: number;
  Remark: string;
  IsFixCourses: boolean;
}

export interface MenuItem {
  id: number;
  label: string;
  icon: string;
  path: string;
  roles: string[];
};

export interface CurriculumInterface{
  ID: number;
  CurriculumName: string;
}

export interface AcademicYearInterface{
  ID: number;
  Level: string;
}

export interface CourseType{
  ID: number;
  TypeName: string;
}


//////////////////////////////////// ด้านล่างนี้ยังไม่เช็ค //////////////////////////////////
export interface OfferedCourseInterface {
  Year: number;
  Term: number;
  Section: number;
  Capacity: number;
  IsFixCourses: boolean;

  UserID: number;
  AllCoursesID: number;
  LaboratoryID?: number;

  Schedule: CreateScheduleInterface[];
}

export interface CreateLaboratoryInterface {
  ID:number;
  Room: string;
  Building: string;
  Capacity: string;
}

export interface CreateScheduleInterface {
  NameTable: string;
  SectionNumber: number;
  DayOfWeek: string;
  StartTime: string; 
  EndTime: string;

  TimeFixedCourses?: TimeFixedCoursesInterface[];

}

export interface TimeFixedCoursesInterface {
  Year: number;
  Term: number;
  DayOfWeek: string;
  StartTime: string;
  EndTime: string;
  RoomFix: string;
  Section: number;
  Capacity: number;

  AllCoursesID: number;
}
