export type ClassSummary = {
  id: string;
  display_name: string;
  whatsapp_number: string | null;
  whatsapp_channel_url: string | null;
  is_active: boolean;
};

export type ClassContextValue = {
  classId: string;
  displayName: string;
  whatsappNumber: string | null;
  whatsappChannelUrl: string | null;
};
