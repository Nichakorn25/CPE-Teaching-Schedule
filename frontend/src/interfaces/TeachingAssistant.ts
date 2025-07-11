export interface TeachingAssistantInterface {
  ID: number;
  Firstname: string;
  Lastname: string;
  Nickname: string;
  PhoneNumber: string;

  TitleID: number;
  // Title: TitleInterface;

  ScheduleTeachingAssistant: ScheduleTeachingAssistantIn[];
}

export interface ScheduleTeachingAssistantIn {
  ID: number;
  CreatedAt: string;
  UpdatedAt: string;
  DeletedAt?: string | null;

  TeachingAssistantID: number;
  TeachingAssistant: TeachingAssistantInterface;

  ScheduleID: number;
  Schedule: ScheduleInterfae;
}

export interface TitleInterface {
  ID: number;
  Title: string;

  TeachingAssistants: TeachingAssistantInterface[];
//   Users: User[];
}

export interface ScheduleInterfae {
  ID: number;
  NameTable: string;
  SectionNumber: number;
  DayOfWeek: string;
  StartTime: string; 
  EndTime: string;

//   OfferedCoursesID: number;
//   OfferedCourses: OfferedCourses;

//   TimeFixedCourses: TimeFixedCourse[];
//   ScheduleTeachingAssistant: ScheduleTeachingAssistant[];
}
