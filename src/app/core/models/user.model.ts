export type UserType = 'client' | 'staff';
export type StaffRole = 'admin';

export interface UserInfo {
  id: number;
  name: string;
  last_name: string;
  email: string;
  type: UserType;
  role: StaffRole | null;
  profile_picture_url: string | null;
  is_profile_complete: boolean;
  is_active: boolean;
  meal_reminder_time?: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
  remember_me: boolean;
  user_type: 'auto';
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user_info: UserInfo;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface VerifyResetCodeRequest {
  email: string;
  reset_code: string;
  new_password: string;
}

export interface ResetPasswordRequest {
  email: string;
  reset_code: string;
  new_password: string;
}
