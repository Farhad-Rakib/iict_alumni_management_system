import { SiteSettingResponse, UpdateSiteSettingRequest } from '../../domain/models/siteSettings.model';

export interface ISiteSettingsService {
  getSetting(settingKey: string): Promise<SiteSettingResponse>;
  updateSetting(settingKey: string, payload: UpdateSiteSettingRequest): Promise<SiteSettingResponse>;
}
