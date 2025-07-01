export interface SignInInterface {
    Username?: string;
    Password?: string;
}

export interface ChangePasswordInterface {
  Email: string;
  NewPassword: string;
  ConfirmPassword: string;
}