//////////////////////// GetAllConditions //////////////////////////////
export interface ConditionInterface {
  ID: number;
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
////////////////////////////////   เพิ่ม แก้ไขเงื่อนไข   ///////////////////////////////////////
export interface ConditionInputInterface {
  DayOfWeek: string;   
  StartTime: string;   
  EndTime: string;     
}

export interface ConditionsRequestInterface {
  UserID: number;
  Conditions: ConditionInputInterface[];
  DeletedConditionIDs?: number[];
}

export interface ScheduleIn {
  DayOfWeek: string;   
  StartTime: string;   
  EndTime: string;     
}