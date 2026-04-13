export interface SiteSettingResponse {
  setting_key: string;
  setting_value: Record<string, any>;
  description?: string | null;
  updated_by?: number | null;
  updated_at: string;
}

export interface UpdateSiteSettingRequest {
  setting_value: Record<string, any>;
  description?: string;
}
