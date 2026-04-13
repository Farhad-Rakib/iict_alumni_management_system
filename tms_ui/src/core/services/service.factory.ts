import { AppConfig } from '../config/app.config';
import { IAuthService } from './auth.service.interface';
import { IUserService } from './user.service.interface';
import { IDashboardService } from './dashboard.service.interface';
import { IMenuService } from './menu.service.interface';
import { IRbacService } from './rbac.service.interface';
import { ISiteSettingsService } from './site-settings.service.interface';
import { AuthService } from './impl/auth.service';
import { UserService } from './impl/user.service';
import { DashboardService } from './impl/dashboard.service';
import { RbacService } from './impl/rbac.service';
import { MenuService } from './impl/menu.service';
import { SiteSettingsService } from './impl/site-settings.service';
import { MockAuthService } from '../../mocks/services/auth.service';
import { MockUserService } from '../../mocks/services/user.service';
import { MockDashboardService } from '../../mocks/services/dashboard.service';
import { MockMenuService } from '../../mocks/services/menu.service';

class ServiceFactory {
  private authService: IAuthService | null = null;
  private userService: IUserService | null = null;
  private dashboardService: IDashboardService | null = null;
  private menuService: IMenuService | null = null;
  private rbacService: IRbacService | null = null;
  private siteSettingsService: ISiteSettingsService | null = null;

  private get useMock(): boolean {
    return AppConfig.api.useMockData;
  }

  getAuthService(): IAuthService {
    if (!this.authService) {
      this.authService = this.useMock ? new MockAuthService() : new AuthService();
    }
    return this.authService;
  }

  getUserService(): IUserService {
    if (!this.userService) {
      this.userService = this.useMock ? new MockUserService() : new UserService();
    }
    return this.userService;
  }

  getDashboardService(): IDashboardService {
    if (!this.dashboardService) {
      this.dashboardService = this.useMock ? new MockDashboardService() : new DashboardService();
    }
    return this.dashboardService;
  }

  getMenuService(): IMenuService {
    if (!this.menuService) {
      this.menuService = this.useMock ? new MockMenuService() : new MenuService();
    }
    return this.menuService;
  }

  getRbacService(): IRbacService {
    if (!this.rbacService) {
      this.rbacService = new RbacService();
    }
    return this.rbacService;
  }

  getSiteSettingsService(): ISiteSettingsService {
    if (!this.siteSettingsService) {
      this.siteSettingsService = new SiteSettingsService();
    }
    return this.siteSettingsService;
  }
}

export const serviceFactory = new ServiceFactory();
