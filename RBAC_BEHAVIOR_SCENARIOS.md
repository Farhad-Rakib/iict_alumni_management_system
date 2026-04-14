# RBAC Expected Behaviors - Scenarios

## Scenario 1: New Alumni User Created

**Initial State:**
- No Alumni users exist
- ALUMNI role in database has default permissions: `[alumni.create, alumni.read, alumni.update, alumni.delete, events.read, jobs.read, elections.vote]`

**Action:** Admin creates user "john@alumni.com" with role=ALUMNI

**Expected Flow:**

```
Step 1: User Creation
┌─────────────────────────────────────────┐
│ Admin: POST /api/v1/rbac/users          │
│ {                                        │
│   "email": "john@alumni.com",            │
│   "base_role": "ALUMNI",                 │
│   "password": "SecurePass@123"           │
│ }                                        │
└─────────────────────────────────────────┘
        ↓
Step 2: Backend Processing
┌─────────────────────────────────────────┐
│ RBACService.create_user():               │
│ - Create User row (role=ALUMNI)          │
│ - NO role_ids or permission_ids needed   │
│ - User automatically gets permissions    │
│   from the ALUMNI role default mapping   │
│ - Commit to database                     │
└─────────────────────────────────────────┘
        ↓
Step 3: John Logs In
┌─────────────────────────────────────────┐
│ POST /auth/login                         │
│ {                                        │
│   "email": "john@alumni.com",            │
│   "password": "SecurePass@123"           │
│ }                                        │
└─────────────────────────────────────────┘
        ↓
Step 4: Backend Permission Resolution
┌─────────────────────────────────────────┐
│ RBACService.get_effective_permissions(): │
│ - User.role = ALUMNI (static column)     │
│ - Check: Is SUPER_ADMIN? NO              │
│ - Query: SELECT permissions FROM        │
│   role_permissions WHERE role_id=ALUMNI │
│ - Found: [                               │
│     "alumni.create",                     │
│     "alumni.read",                       │
│     "alumni.update",                     │
│     "alumni.delete",                     │
│     "events.read",                       │
│     "jobs.read",                         │
│     "elections.vote"                     │
│   ]                                      │
│ - Return this set to /auth/me            │
└─────────────────────────────────────────┘
        ↓
Step 5: Frontend Receives Permissions
┌─────────────────────────────────────────┐
│ /auth/me response:                       │
│ {                                        │
│   "id": 42,                              │
│   "email": "john@alumni.com",            │
│   "role": "ALUMNI",                      │
│   "permissions": [                       │
│     "alumni.create",                     │
│     "alumni.read",                       │
│     "alumni.update",                     │
│     "alumni.delete",                     │
│     "events.read",                       │
│     "jobs.read",                         │
│     "elections.vote"                     │
│   ]                                      │
│ }                                        │
│                                          │
│ Zustand store updated:                   │
│ authStore.user.permissions = above       │
│ authStore.user.role = "ALUMNI"           │
└─────────────────────────────────────────┘
        ↓
Step 6: Menu Endpoint Called
┌─────────────────────────────────────────┐
│ GET /api/v1/menu                         │
│                                          │
│ Backend filters DEFAULT_MENU_ITEMS:     │
│ - Dashboard                              │
│   requires: ["dashboard.read"]           │
│   John has? NO → HIDDEN                  │
│                                          │
│ - Activity                               │
│   requires: ["activity.read"]            │
│   John has? NO → HIDDEN                  │
│                                          │
│ - Reports                                │
│   requires: ["reports.read"]             │
│   John has? NO → HIDDEN                  │
│                                          │
│ - Settings                               │
│   requires: ["settings.read"]            │
│   John has? NO → HIDDEN                  │
│                                          │
│ Response: [] (empty menu!)               │
└─────────────────────────────────────────┘
        ↓
Step 7: Frontend Sidebar Renders
┌─────────────────────────────────────────┐
│ Sidebar receives empty menu array        │
│ Result: Shows "Dashboard" or empty       │
│                                          │
│ ⚠️  ISSUE: Alumni can't see any menus!   │
│                                          │
│ Why? Because DEFAULT_MENU_ITEMS has:    │
│ - Dashboard (dashboard.read)             │
│ - Activity (activity.read)               │
│ - Reports (reports.read)                 │
│ - Settings (settings.read)               │
│                                          │
│ But ALUMNI role doesn't have these!      │
└─────────────────────────────────────────┘
```

**Key Issue Identified:** 
Menu items don't match Alumni permissions! Need to assign appropriate permissions to menu items.

---

## Scenario 2: Permission Removed from User

**Initial State:**
- User john@alumni.com has been logged in for 30 minutes
- Browser tab is open, navigation is responsive
- Zustand store has cached permissions: `[alumni.*, events.read, jobs.read, elections.vote]`

**Action:** Superadmin removes "alumni.read" permission from user (in another browser tab)

**Expected Behavior (Timeline):**

```
12:00 PM - John logged in
┌─────────────────────────────────────────┐
│ Zustand store:                           │
│ {                                        │
│   permissions: ["alumni.create",         │
│                 "alumni.read",    ◄─────── HAS THIS
│                 "alumni.update",         │
│                 "alumni.delete",         │
│                 "events.read",           │
│                 "jobs.read",             │
│                 "elections.vote"]        │
│ }                                        │
│                                          │
│ Sidebar shows: Alumni menu item          │
│                                          │
│ localStorage: same permissions persisted │
└─────────────────────────────────────────┘

12:15 PM - Admin removes alumni.read
┌─────────────────────────────────────────┐
│ In another tab (superadmin logged in):   │
│ RBAC Panel → Users → john@alumni.com     │
│ Remove permission: "alumni.read"         │
│ Click SAVE                               │
│                                          │
│ Backend:                                 │
│ DELETE FROM user_permissions             │
│ WHERE user_id=42 AND                     │
│       permission_id=(alumni.read)        │
│                                          │
│ Database updated immediately             │
└─────────────────────────────────────────┘

12:15 PM (30 sec later) - John's browser still shows old data
┌─────────────────────────────────────────┐
│ John's original tab (not touched):       │
│                                          │
│ Zustand store: STILL has alumni.read     │
│ localStorage: STILL has alumni.read      │
│ Sidebar: STILL shows Alumni item         │
│                                          │
│ Why? Permission change is in DB, but     │
│ frontend cached it at login time         │
│                                          │
│ ⚠️  STALE STATE for John's session       │
└─────────────────────────────────────────┘

12:16 PM - John navigates to different route
┌─────────────────────────────────────────┐
│ John clicks: Settings tab                │
│                                          │
│ Frontend: Route is changing → trigger    │
│ RefreshPermissionGuard (Phase 5)         │
│                                          │
│ RefreshPermissionGuard calls:            │
│ GET /auth/me (with John's token)         │
│                                          │
│ Backend resolves permissions fresh:      │
│ - Query user_permissions table           │
│ - Returns: ["alumni.create",             │
│            "alumni.update",              │
│            "alumni.delete",              │ ◄─── NO alumni.read anymore!
│            "events.read",                │
│            "jobs.read",                  │
│            "elections.vote"]             │
│                                          │
│ Frontend compares:                       │
│ Old: [..., "alumni.read", ...]           │
│ New: [..., (no alumni.read), ...]        │
│ MISMATCH DETECTED!                       │
└─────────────────────────────────────────┘

12:16 PM (3 sec after navigation) - Zustand updated
┌─────────────────────────────────────────┐
│ authStore.setUser(newUser)               │
│                                          │
│ Zustand store updated:                   │
│ {                                        │
│   permissions: ["alumni.create",         │
│                 "alumni.update",         │
│                 "alumni.delete",         │
│                 "events.read",           │
│                 "jobs.read",             │
│                 "elections.vote"]        │
│ }  ◄─── alumni.read REMOVED              │
│                                          │
│ localStorage: updated with new perms     │
│                                          │
│ React re-renders! Components that check   │
│ hasPermission("alumni.read") now return  │
│ false instead of true                    │
│                                          │
│ Sidebar updates: Alumni menu items that  │
│ require "alumni.read" → HIDDEN           │
└─────────────────────────────────────────┘

12:16 PM - John sees result immediately
┌─────────────────────────────────────────┐
│ Frontend automatically updates:          │
│ ✓ Sidebar hides/shows menu items         │
│ ✓ Permission checks fail for restricted  │
│   features                               │
│ ✓ Page transitions smoothly (no F5 req)  │
│                                          │
│ If John tries to access alumni data:     │
│ - Frontend: Check hasPermission("alumni  │
│   .read") → false                        │
│ - PermissionGuard triggers               │
│ - Toast: "You don't have permission"     │
│ - Redirect to / (home)                   │
│                                          │
│ No 403 page shown to user ✓              │
└─────────────────────────────────────────┘
```

**Expected Timeline Summary:**
| Time | State | John's Frontend | Action |
|------|-------|-----------------|--------|
| 12:00 | John logged in | alumni.read CACHED | - |
| 12:15 | Admin removes alumni.read | alumni.read STALE | Database updated |
| 12:15:30 | John browsing | alumni.read STALE | Still viewing old data |
| 12:16 | John clicks Settings | alumni.read STALE → FRESH | /auth/me called |
| 12:16:03 | RefreshPermissionGuard processes | Permission SYNCED | Zustand updated |
| 12:16:05 | React re-renders | alumni.read GONE | Sidebar refreshes |

---

## Scenario 3: Permission Removed - No Route Change

**Question:** What if John removes "alumni.read" and John stays on the same page (doesn't navigate)?

**Answer:**
```
Superadmin removes alumni.read at 12:15 PM
  ↓
John's page: STILL shows alumni menu (no route change = no refresh)
  ↓
John stays on same page for 5 minutes
  ↓
At 12:20 PM, John clicks to a different route
  ↓
RefreshPermissionGuard triggers
  ↓
Permission cache updated
  ↓
Alumni menu disappears

Alternative (if WebSocket added later):
  Superadmin removes permission
  ↓
  Backend sends WebSocket event: permission_changed
  ↓
  Frontend receives event (in real-time, without waiting for route change)
  ↓
  Zustand updates immediately
  ↓
  Menu disappears WITHOUT needing to navigate
```

**For now (Phase 5):** Permission refresh only on route change (~1-2 second max staleness per route)

---

## Scenario 4: Admin Removes ALL Permissions from Alumni Role

**Initial State:**
- 50 alumni users all have role=ALUMNI
- ALUMNI role has default permissions: `[alumni.*, events.read, jobs.read, elections.vote]`

**Action:** Superadmin removes all permissions from ALUMNI role (via RBAC UI)

**Expected Behavior:**

```
Superadmin action:
RBAC Panel → Roles → ALUMNI
Remove all entries in "role_permissions" table for ALUMNI
Click SAVE
  ↓
Database: DELETE all rows where role_id = ALUMNI_ROLE_ID
  ↓
All 50 alumni users NOW have ZERO permissions (inherited from role)
  ↓
Next time each alumni user:
1. Logs in → /auth/me returns empty permissions [] ←─ PROBLEM!
2. Frontend: mapBackendUser() checks permissions.length === 0
   → Throws error OR fallback (depending on implementation)
   
After Phase 4 (hardcoded perms deleted):
- /auth/me returns permissions: []
- Frontend: mapBackendUser() expects non-empty array
- Throws error: "Backend returned empty permissions"
- User sees error screen OR forced logout

Before Phase 4:
- /auth/me returns permissions: []
- Frontend: Falls back to hardcoded ROLE_PERMISSIONS["ALUMNI"]
- User still has permissions (from fallback)
- Inconsistent state
```

**Key Point:** Removing ALL permissions from a role is dangerous! 
- Should add warning: "This will remove access for X users"
- Consider making it a destructive operation (requires confirmation)

---

## Scenario 5: Alumni User Needs Dashboard Access

**Current Problem:**
```
ALUMNI role has: [alumni.*, events.read, jobs.read, elections.vote]
Menu requires Dashboard? dashboard.read

Result: Alumni can never see Dashboard (no permission)
```

**Solution Options:**

### Option A: Add to ALUMNI role default
```python
# Phase 1 migration: Add to ALUMNI default permissions
ALUMNI→[alumni.*, events.read, jobs.read, elections.vote, dashboard.read]
```

### Option B: Grant individual permission
```
Superadmin logs in → RBAC UI → Users → john@alumni.com
Add individual permission: dashboard.read
Click SAVE
  ↓
Next route change by John:
RefreshPermissionGuard triggers
...
Dashboard menu appears
```

### Option C: Create Alumni+ role
```
Create new role: ALUMNI_PLUS
  Permissions: [alumni.*, events.read, jobs.read, elections.vote, dashboard.read]
  
Update john@alumni.com: role=ALUMNI_PLUS
  ↓
John's next login:
/auth/me returns permissions from ALUMNI_PLUS role
Dashboard accessible
```

**Recommended:** Option A (if dashboard is core feature) or Option B (if selective).

---

## Summary Table: Permission Removal Behavior

| Scenario | Where Removed | Effect | When Detected | User Experience |
|----------|---------------|--------|---------------|-----------------|
| Individual permission from user | user_permissions table | User loses specific ability | Next route change (~1-2 sec) | Menu item hidden, redirected if accessed |
| Permission from role | role_permissions table | All users with role lose it | Next login + next route change | Same as above for all affected users |
| All permissions from role | role_permissions table | Role becomes useless | Next login + route change | Users see error (empty permissions) |
| User role changed to no-permission role | User.role column | User loses all role permissions | Next login + route change | Redirected when accessing restricted areas |

---

## Key Design Points

### ✅ What Works Well
1. **Centralized:** All permissions from role_permissions table
2. **Automatic:** New users inherit from role automatically
3. **Auditable:** Can see who has what permission
4. **Flexible:** Can adjust individual user OR role permissions

### ⚠️ What Needs Attention
1. **Menu item permissions:** Must match what roles have (coordination needed)
2. **Default role permissions:** Must align with business logic (Alumni shouldn't see admin menus)
3. **Permission removal:** No warnings if removing from role affects X users
4. **Empty permissions:** Should never happen; frontend should handle gracefully

### 🔄 Permission Refresh Timing (Phase 5)
- **Best case:** 0-30 seconds (user navigates within that time window)
- **Average case:** 1-2 seconds (route change detected, /auth/me called, store updated)
- **Worst case:** Until next page refresh or logout/login (if user never navigates)

---

## Expected Behavior Summary

**New Alumni User:**
```
Create(role=ALUMNI)
  → Inherits ALUMNI role permissions
  → /auth/me returns [alumni.*, events.read, jobs.read, elections.vote]
  → Menu shows: Alumni, Events (read-only), Jobs (read-only), Elections (vote)
  → Dashboard/Settings/Reports hidden (no permission)
```

**Permission Removed:**
```
Database updated immediately
  → Frontend cached (stale for 0-30 sec)
  → Next navigation triggers refresh
  → /auth/me returns updated permissions
  → Frontend detects change → Zustand updated
  → UI re-renders with new visibility
  → Menu items hidden if no longer accessible
```

This ensures **consistency** and **responsiveness** while keeping the system simple!
