export type Student = {
  id: string;
  roll_no: number;
  full_name: string;
  admission_no: string | null;
  email: string | null;
  parent_phone: string | null;
  is_active: boolean;
};

export type StudentFormData = {
  roll_no: number;
  full_name: string;
  admission_no: string;
  email: string;
  parent_phone: string;
  is_active: boolean;
};
