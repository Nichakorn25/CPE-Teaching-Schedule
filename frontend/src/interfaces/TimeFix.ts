export interface TimeFixedCoursesIn {
  Year: number;
  Term: number;
  Section: number;
  Capacity: number;
  UserID: number;
  AllCoursesID: number;
  LaboratoryID: number | null;
  SectionInFixed: number;
  DayOfWeek: string; 
  StartTime: string; // รูปแบบเวลา: "HH:mm"
  EndTime: string;   // รูปแบบเวลา: "HH:mm"
  RoomFix: string;
  NameTable: string;
}
