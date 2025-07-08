export interface ConditionInterface {
  ID?: number;
  DayOfWeek: string;
  StartTime: string; // เวลาในรูปแบบ "HH:mm"
  EndTime: string;
  UserID: number;
}

//////////////////////// GetAllConditions //////////////////////////////
export interface GetAllConditionInterface {
  DayOfWeek: string;
  Start: string;
  End: string;
}

export interface UserConInterface {
  UserID: number;
  Code: string;
  Fullname: string;
  Major: string;
  Email: string;
  Phone: string;
  ItemCount: number;
  Conditions: ConditionInterface[];
  CreatedAt: string;
  LastUpdatedAt: string;
}
///////////////////////////////////////////////////////////////////////