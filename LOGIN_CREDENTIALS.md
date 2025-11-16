# Login Credentials

## ✅ GUARANTEED WORKING CREDENTIALS

These users are automatically seeded when the backend starts and assigned to specific roles via RBAC system.

### 🔐 Admin Users (RBAC-Based Access)

#### SUPERADMIN (Highest Level - Full Access)
- **Email:** `admin1@election.gov.in`
- **Password:** `admin1`
- **Role:** `SUPERADMIN`
- **Access:** **EVERYTHING** - Full system access, all modules, all permissions
- **Can Do:** Manage roles, change AI thresholds, commit revisions, delete voters, manage security

#### CEO Officer (State Level)
- **Email:** `admin5@election.gov.in`
- **Password:** `admin5`
- **Role:** `CEO` (Chief Electoral Officer)
- **Access:** State-level management, revision commit, AI services (all), security view
- **Can Do:** Commit revision batches, change AI thresholds, retrain models, view security logs
- **Cannot Do:** Manage roles/permissions (SUPERADMIN only)

#### DEO Officer (District Level)
- **Email:** `admin4@election.gov.in`
- **Password:** `admin4`
- **Role:** `DEO` (District Election Officer)
- **Access:** District management, BLO assignment, roll revision (dry-run), AI logs, biometric operations
- **Can Do:** Run dry-run revisions, assign BLO tasks, approve biometrics, view AI logs
- **Cannot Do:** Commit revisions, change AI thresholds, manage security

#### ERO Officer (Constituency Level)
- **Email:** `admin3@election.gov.in`
- **Password:** `admin3`
- **Role:** `ERO` (Electoral Registration Officer)
- **Access:** Voter management, EPIC generation, duplicate resolution, grievance management
- **Can Do:** Edit voters, approve voter updates, generate EPIC, resolve duplicates, approve death records
- **Cannot Do:** Run dry-run revisions, assign BLO tasks, access AI services

#### BLO Officer (Booth Level)
- **Email:** `admin2@election.gov.in`
- **Password:** `admin2`
- **Role:** `BLO` (Booth Level Officer)
- **Access:** BLO tasks (own tasks only), view assigned voters, submit task completion
- **Can Do:** View own tasks, submit task completion, view assigned voters
- **Cannot Do:** Edit voters, assign tasks, access any other admin modules

### 👤 Citizen Users

#### Test Citizen
- **Email:** `citizen1@example.com`
- **Password:** `any` (any password works in demo mode)
- **Role:** `CITIZEN`
- **Access:** Citizen dashboard only - NO admin access
- **Can Do:** View own profile, create grievances, download own EPIC
- **Cannot Do:** Access any `/admin/*` routes

## 🎯 Quick Test Credentials

**For Full System Access (SUPERADMIN):**
```
Email: admin1@election.gov.in
Password: admin1
```

**For State-Level Operations (CEO):**
```
Email: admin5@election.gov.in
Password: admin5
```

**For District Operations (DEO):**
```
Email: admin4@election.gov.in
Password: admin4
```

**For Constituency Operations (ERO):**
```
Email: admin3@election.gov.in
Password: admin3
```

**For Booth-Level Operations (BLO):**
```
Email: admin2@election.gov.in
Password: admin2
```

**For Citizen Dashboard:**
```
Email: citizen1@example.com
Password: any
```

## 🔒 Complete RBAC System

### Role Hierarchy (Highest to Lowest):
1. **SUPERADMIN** (Level 10) - Full system access, manage roles
2. **CEO** (Level 9) - State-level operations, commit revisions
3. **DEO** (Level 8) - District operations, BLO management
4. **ERO** (Level 7) - Constituency operations, voter approval
5. **CRO** (Level 7) - Chief Returning Officer
6. **DOC_VERIFIER** (Level 6) - Document verification
7. **AI_AUDITOR** (Level 6) - AI audit and review
8. **BLO** (Level 5) - Booth-level field verification
9. **PRESIDING_OFFICER** (Level 5) - Polling station operations
10. **HELPDESK** (Level 4) - Grievance management only
11. **VIEW_ONLY** (Level 1) - Read-only audit access
12. **CITIZEN** (Level 1) - Public access only

### Permission-Based Access:
- ✅ **Database-backed permissions** - Stored in `roles`, `permissions`, `role_permissions` tables
- ✅ **JWT tokens include permissions** - Frontend receives permissions on login
- ✅ **UI dynamically filters** - Sidebar only shows modules user can access
- ✅ **Buttons disabled with tooltips** - Clear feedback when permission denied
- ✅ **Backend enforces permissions** - All routes protected with `requirePermission()`

### What Each Role Sees:

**BLO Dashboard:**
- Dashboard Overview
- BLO Tasks (own tasks)
- Submit Task button

**ERO Dashboard:**
- Dashboard Overview
- Voter Management (View + Edit)
- Roll Revision (View Flags)
- Duplicate Detection (View + Resolve)
- Death Records (View + Approve)
- EPIC Management
- Grievance Management
- Document Verification

**DEO Dashboard:**
- Everything ERO sees PLUS:
- Roll Revision (Dry-run)
- BLO Task Assignment
- AI Services (View Logs)
- Biometric Operations

**CEO Dashboard:**
- Everything DEO sees PLUS:
- Roll Revision (Commit)
- AI Services (All)
- Security & Audit

**SUPERADMIN Dashboard:**
- **EVERYTHING** - All modules visible

## 📝 Notes

- ✅ Users are automatically seeded on backend startup
- ✅ Roles are assigned via `role_id` foreign key in `users` table
- ✅ Permissions are loaded from database on login
- ✅ JWT tokens include role + permissions array
- ✅ Frontend filters UI based on permissions
- ✅ Backend middleware checks permissions on every request
- ✅ System is backward compatible with legacy role enum

## 🔄 Setup

RBAC is automatically set up when you run:
```bash
cd backend
node src/db/migrate_rbac_complete.js
node src/db/seed_rbac_complete.js
```

See `RBAC_SYSTEM.md` for complete documentation.

