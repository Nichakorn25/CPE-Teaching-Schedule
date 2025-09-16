export interface SectionInterface {
  ID: number;
  SectionNumber: number;
  Room: string;
  DayOfWeek: string;
  Time: string;
  Capacity: number;
  ID_user: number;
  InstructorNames: string[];
}

export interface CourseInterface {
  ID: number;
  Code: string;
  CurriculumID: number;
  Curriculum: string;
  ThaiCourseName: string;
  EnglishCourseName: string;
  Laboratory:string;
  Credit: string;
  TypeOfCourse: string;
  TotalSections: number;
  Sections: SectionInterface[];
  IsFixCourses?: boolean;
}
