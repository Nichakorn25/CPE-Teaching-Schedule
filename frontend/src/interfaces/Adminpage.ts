export interface CreateCourseInteface {
  Code: string;
  EnglishName: string;
  ThaiName: string;
  CurriculumID: number;
  AcademicYearID: number;
  TypeOfCoursesID: number;
  CreditID: number;
  UserIDs: number[]; 
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
