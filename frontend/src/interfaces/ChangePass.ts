export interface ChangePassInterface {
    ID?: number;
    UsernameID?: string;
    Password?: string;
    Email?: string;
    StatusChangePasswordID?: number;
    StatusChangePassword?: StatusPassInterface;

    FirstName?: string;
    LastName?: string;
    StatusName: string;
}

export interface StatusPassInterface {
    ID?: number;
    StatusName?: string;
}

export interface NewPassInterface {
    UsernameID?: string;
    NewPassword?: string;
}