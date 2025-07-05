export interface ConditionInterface {
  ID?: number;
  DayOfWeek: string;
  StartTime: string; // เวลาในรูปแบบ "HH:mm"
  EndTime: string;
  UserID: number;
}