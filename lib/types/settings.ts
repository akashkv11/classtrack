export type SettingsData = {
  academic_years: { id: string; name: string; is_active: boolean }[];
  settings: {
    message_signature: string;
    late_counts_as_present: boolean;
  };
};
