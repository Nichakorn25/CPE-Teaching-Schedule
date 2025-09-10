// src/types/interface.ts

export type CreditInAllCourses = {
  ID: number;
  CreatedAt: string;
  UpdatedAt: string;
  DeletedAt: string | null;
  Unit: number;
  Lecture: number;
  Lab: number;
  Self: number;
  AllCourses: null;
};

export type TimeFixedCourse = {
  ID: number;
  Year: number;
  Term: number;
  DayOfWeek: string;
  StartTime: string;
  EndTime: string;
  RoomFix: string;
  Section: number;
};

export interface Schedule {
  ID: number;
  NameTable: string;
  SectionNumber: number;
  DayOfWeek: string;
  StartTime: string;
  EndTime: string;
  OfferedCoursesID: number;
  OfferedCourses: {
    ID: number;
    Year: number;
    Term: number;
    Section: number;
    Capacity: number;
    IsFixCourses: boolean;
    UserID: number;
    User: {
      ID: number;
      Firstname: string;
      Lastname: string;
      Title?: { Title: string } | null;
    };
    Laboratory?: {
      ID: number;
      Room?: string;
      Building?: string;
      Capacity?: string;
    } | null;
    AllCoursesID: number;
    AllCourses: {
      Code: string;
      EnglishName?: string;
      ThaiName?: string;
      Curriculum: {
        Major?: { MajorName: string } | null;
      };
      AcademicYear: { ID: number; Level: string };
      TypeOfCourses: { ID: number; Type: number; TypeName: string };
      CreditID: number;
      Credit: CreditInAllCourses;
    };
  };
  TimeFixedCourses?: TimeFixedCourse[];
}

export interface CourseTableData {
  key: string;
  order: number;
  ID: number;
  Code: string;
  CourseName: string;
  Credit: string;
  TypeOfCourse: string;
  Sections: any[];
  TotalSections: number;
  IsFixCourses: boolean;
  isChild?: boolean;
  isLastChild?: boolean;
  Section?: any;
}
