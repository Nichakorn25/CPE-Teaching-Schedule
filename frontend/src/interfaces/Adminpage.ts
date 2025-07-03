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

