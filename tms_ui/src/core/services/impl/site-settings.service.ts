import { BaseRepository } from '../../api/base.repository';
import { SiteSettingResponse, UpdateSiteSettingRequest } from '../../../domain/models/siteSettings.model';
import { ISiteSettingsService } from '../site-settings.service.interface';

export class SiteSettingsService extends BaseRepository implements ISiteSettingsService {
  constructor() {
    super('/site-settings');
  }

  async getSetting(settingKey: string): Promise<SiteSettingResponse> {
    return this.get<SiteSettingResponse>(`/${settingKey}`);
  }

  async updateSetting(settingKey: string, payload: UpdateSiteSettingRequest): Promise<SiteSettingResponse> {
    return this.put<SiteSettingResponse>(`/${settingKey}`, payload);
  }
}
