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
///////////////////////////////////////////////////////////////////////