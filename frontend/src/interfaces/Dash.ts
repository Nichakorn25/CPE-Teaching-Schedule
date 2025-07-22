export interface ScheduleInterface {
    ID?: number;
    NameTable: string;
    SectionNumber: number;
    DayOfWeek: string;
    StartTime: Date;
    EndTime: Date;

    OfferedCoursesID: number;
    OfferedCourses?: OfferedCoursesInterface;

    TimeFixedCourses?: TimeFixedCoursesInterface[];
}

export interface OfferedCoursesInterface {
    ID?: number;
    Year: number;
    Term: number;
    Section: number;
    Capacity: number;
    IsFixCourses: boolean;

    UserID: number;
    User?: UserInterface;

    AllCoursesID: number;
    AllCourses?: AllCoursesInterface;

    LaboratoryID?: number;
    Laboratory?: LaboratoryInterface;

    Schedule?: ScheduleInterface[];
}

export interface TimeFixedCoursesInterface {
    ID?: number;
    Year: number;
    Term: number;
    DayOfWeek: string;
    StartTime: Date;
    EndTime: Date;
    RoomFix: string;
    Section: number;
    Capacity: number;

    AllCoursesID: number;
    AllCourses?: AllCoursesInterface;

    ScheduleID: number;
    Schedule?: ScheduleInterface;
}

export interface AllCoursesInterface {
    ID?: number;

    Code: string;
    EnglishName: string;
    ThaiName: string;

    OfferedCourses?: OfferedCoursesInterface[];
    TimeFixedCourses?: TimeFixedCoursesInterface[];
}

export interface LaboratoryInterface {
    ID?: number;
    Room: string;
    Building: string;
    Capacity: string;

    OfferedCourses?: OfferedCoursesInterface[];
}

export interface UserInterface {
    ID?: number;
    Username: string;
    Password: string;
    Firstname: string;
    Lastname: string;
    Image: string;
    Email: string;
    PhoneNumber: string;
    Address: string;
    FirstPassword: boolean;

    OfferedCourses?: OfferedCoursesInterface[];
}
