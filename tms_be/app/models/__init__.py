"""Models module initialization."""
from app.models.user import User, LoginLog, Permission, RoleEnum
from app.models.alumni import Alumni, AlumniSearch, PrivacyLevel
from app.models.event import Event, EventRSVP, EventPayment, EventType
from app.models.job import Job, JobApplication
from app.models.notice import Notice, NoticeCategory, NoticeNotification
from app.models.election import Election, ElectionPosition, Candidate, Vote, VotingLog
from app.models.cms import CMSPage, Slider, Committee, Gallery, ContactInfo
from app.models.rbac import Role, RolePermission, UserRole, UserPermission
from app.models.site_settings import SiteSetting

__all__ = [
    "User",
    "LoginLog",
    "Permission",
    "RoleEnum",
    "Alumni",
    "AlumniSearch",
    "PrivacyLevel",
    "Event",
    "EventRSVP",
    "EventPayment",
    "EventType",
    "Job",
    "JobApplication",
    "Notice",
    "NoticeCategory",
    "NoticeNotification",
    "Election",
    "ElectionPosition",
    "Candidate",
    "Vote",
    "VotingLog",
    "CMSPage",
    "Slider",
    "Committee",
    "Gallery",
    "ContactInfo",
    "Role",
    "RolePermission",
    "UserRole",
    "UserPermission",
    "SiteSetting",
]
