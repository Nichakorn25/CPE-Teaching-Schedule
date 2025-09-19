export interface GroupInfo {
  DayOfWeek: string;
  StartTime: string;
  EndTime: string;
  RoomFix: string;
  Section: number;
  Capacity: number;
}

export interface UpdateFixedCourse {
  TotalSection: number;
  Capacity: number;
  LaboratoryID?: number | null;
  Groups: GroupInfo[];
}