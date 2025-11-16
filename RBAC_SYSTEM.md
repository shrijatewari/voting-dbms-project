# 🔐 Complete RBAC (Role-Based Access Control) System

## Overview

This system implements a comprehensive, database-backed RBAC system matching real Election Commission of India (ECI) standards. Every admin action is protected by permissions, and the UI dynamically shows/hides modules based on user roles.

---

## 🎯 Roles & Hierarchy

| Role | Level | Description | Email Mapping |
|------|-------|-------------|---------------|
| **SUPERADMIN** | 10 | Full system access. Manages roles, AI thresholds, security. | `admin1@election.gov.in` |
| **CEO** | 9 | State-level chief officer; approves revisions, large-scale actions. | `admin5@election.gov.in` |
| **DEO** | 8 | District officer; manages BLOs, tasks, district operations. | `admin4@election.gov.in` |
| **ERO** | 7 | Electoral registration officer; approves voter changes. | `admin3@election.gov.in` |
| **CRO** | 7 | Chief Returning Officer; in charge of counting & results. | - |
| **DOC_VERIFIER** | 6 | Document Verification Officer; manages document OCR approvals. | - |
| **AI_AUDITOR** | 6 | AI Auditor; reviews AI scores, fraud flags. | - |
| **BLO** | 5 | Booth Level Officer; handles field verification, biometric recapture. | `admin2@election.gov.in` |
| **PRESIDING_OFFICER** | 5 | Presiding Officer; manages polling station operations. | - |
| **HELPDESK** | 4 | Helpdesk Officer; only grievance management. | - |
| **VIEW_ONLY** | 1 | Read-only access for audits. | - |
| **CITIZEN** | 1 | Public access only. | `citizen1@example.com` |

---

## 📋 Permission Matrix

### Dashboard
- `dashboard.view` - View dashboard overview
  - ✅ All roles

### Voter Management
- `voters.view` - View voter records
  - ✅ BLO, ERO, DEO, CEO, SUPERADMIN
- `voters.edit` - Edit voter records
  - ✅ ERO, DEO, CEO, SUPERADMIN
- `voters.approve` - Approve voter updates
  - ✅ ERO, DEO, CEO, SUPERADMIN
- `voters.assign_blo` - Assign BLO to voters
  - ✅ DEO, CEO, SUPERADMIN
- `voters.delete` - Delete voter records
  - ✅ DEO, CEO, SUPERADMIN

### Roll Revision
- `revision.view_flags` - View revision flags
  - ✅ ERO, DEO, CEO, SUPERADMIN
- `revision.approve_flags` - Approve revision flags
  - ✅ ERO, DEO, CEO, SUPERADMIN
- `revision.dry_run` - Run dry-run revision
  - ✅ DEO, CEO, SUPERADMIN
- `revision.commit` - Commit revision batch
  - ✅ CEO, SUPERADMIN

### Duplicate Detection
- `duplicates.view` - View duplicate records
  - ✅ ERO, DEO, CEO, SUPERADMIN, AI_AUDITOR
- `duplicates.resolve` - Resolve duplicates (merge/mark ghost)
  - ✅ ERO, DEO, CEO, SUPERADMIN

### Death Records
- `death_records.view` - View death records
  - ✅ ERO, DEO, CEO, SUPERADMIN
- `death_records.upload` - Upload death record CSV
  - ✅ DEO, CEO, SUPERADMIN
- `death_records.approve` - Approve death record removal
  - ✅ ERO, DEO, CEO, SUPERADMIN

### BLO Tasks
- `blo_tasks.view` - View BLO tasks
  - ✅ BLO, ERO, DEO, CEO, SUPERADMIN, CRO, PRESIDING_OFFICER, VIEW_ONLY
- `blo_tasks.submit` - Submit BLO task completion
  - ✅ BLO only
- `blo_tasks.assign` - Assign BLO tasks
  - ✅ DEO, CEO, SUPERADMIN

### Document Verification
- `documents.view_ocr` - View OCR results
  - ✅ ERO, DEO, CEO, SUPERADMIN, DOC_VERIFIER
- `documents.approve` - Approve documents
  - ✅ ERO, DEO, CEO, SUPERADMIN, DOC_VERIFIER

### AI Services
- `ai.view_logs` - View AI service logs
  - ✅ DEO, CEO, SUPERADMIN, AI_AUDITOR
- `ai.change_thresholds` - Change AI thresholds
  - ✅ CEO, SUPERADMIN
- `ai.retrain` - Retrain AI models
  - ✅ CEO, SUPERADMIN

### Grievances
- `grievances.view` - View grievances
  - ✅ All admin roles, VIEW_ONLY
- `grievances.manage` - Manage grievances (assign/respond)
  - ✅ ERO, DEO, CEO, SUPERADMIN, HELPDESK

### EPIC Management
- `epic.view` - View EPIC records
  - ✅ ERO, DEO, CEO, SUPERADMIN
- `epic.generate` - Generate EPIC
  - ✅ ERO, DEO, CEO, SUPERADMIN

### Biometric Operations
- `biometric.view` - View biometric operations
  - ✅ DEO, CEO, SUPERADMIN, AI_AUDITOR
- `biometric.approve` - Approve biometric verification
  - ✅ DEO, CEO, SUPERADMIN
- `biometric.compare` - Compare biometrics
  - ✅ DEO, CEO, SUPERADMIN

### Security & Audit
- `security.view` - View security logs
  - ✅ CEO, SUPERADMIN
- `security.manage` - Manage security settings
  - ✅ CEO, SUPERADMIN

### System Settings
- `settings.view` - View system settings
  - ✅ CEO, SUPERADMIN
- `settings.manage` - Manage system settings
  - ✅ CEO, SUPERADMIN
- `settings.manage_roles` - Manage roles and permissions
  - ✅ SUPERADMIN only

---

## 🔑 Login Credentials

### Admin Users (Seeded Automatically)

| Email | Password | Role | Access Level |
|-------|----------|------|--------------|
| `admin1@election.gov.in` | `admin1` | SUPERADMIN | Full system access - all modules |
| `admin2@election.gov.in` | `admin2` | BLO | BLO tasks, assigned voters only |
| `admin3@election.gov.in` | `admin3` | ERO | Voter management, EPIC, duplicates, grievances |
| `admin4@election.gov.in` | `admin4` | DEO | District operations, BLO assignment, roll revision |
| `admin5@election.gov.in` | `admin5` | CEO | State-level operations, revision commit |

### Citizen User

| Email | Password | Role | Access Level |
|-------|----------|------|--------------|
| `citizen1@example.com` | `any` | CITIZEN | Citizen dashboard only - NO admin access |

---

## 🏗️ Database Structure

### Tables

1. **`roles`** - Defines all roles with hierarchy levels
2. **`permissions`** - Defines all permissions with module grouping
3. **`role_permissions`** - Junction table linking roles to permissions
4. **`users`** - Updated with `role_id` foreign key

### Seeding

Run these commands to set up RBAC:

```bash
cd backend
node src/db/migrate_rbac_complete.js
node src/db/seed_rbac_complete.js
```

---

## 🔧 Backend Implementation

### Middleware

- `requirePermission(permission)` - Checks if user has specific permission
- `requireRole(...roles)` - Checks if user has one of the specified roles
- `requireMinimumRole(role)` - Checks if user role level >= minimum

### Usage Example

```javascript
const { requirePermission } = require('../middleware/rbac');

// Protect route with permission
router.put('/voters/:id', requirePermission('voters.edit'), voterController.updateVoter);

// Protect route with role
router.post('/revision/commit', requireRole('CEO', 'SUPERADMIN'), revisionController.commit);
```

### JWT Token

Tokens now include:
```json
{
  "id": 1,
  "email": "admin1@election.gov.in",
  "role": "SUPERADMIN",
  "permissions": ["voters.view", "voters.edit", "revision.commit", ...]
}
```

---

## 🎨 Frontend Implementation

### Permission Checking

```typescript
const hasPermission = (permission: string): boolean => {
  if (userRole === 'SUPERADMIN') return true;
  if (userPermissions.includes(permission)) return true;
  // Check wildcard permissions (e.g., 'voters.*' matches 'voters.view')
  for (const perm of userPermissions) {
    if (perm.endsWith('.*')) {
      const prefix = perm.replace('.*', '');
      if (permission.startsWith(prefix + '.')) {
        return true;
      }
    }
  }
  return false;
};
```

### UI Filtering

- **Sidebar Navigation**: Only shows modules user has permission to access
- **Metric Cards**: Filtered based on permissions
- **Action Buttons**: Disabled with tooltip if permission denied
- **Edit Buttons**: Hidden or disabled based on `voters.edit` permission

---

## 📊 Role-Specific Views

### BLO (Booth Level Officer)
**Sees:**
- Dashboard Overview
- BLO Tasks (own tasks only)
- Submit Task button enabled

**Cannot See:**
- Voter Management (Edit)
- Roll Revision
- Duplicate Detection
- Death Records
- AI Services
- Security & Audit

### ERO (Electoral Registration Officer)
**Sees:**
- Dashboard Overview
- Voter Management (View + Edit)
- Roll Revision (View + Approve Flags)
- Duplicate Detection (View + Resolve)
- Death Records (View + Approve)
- EPIC Management (View + Generate)
- Grievance Management
- Document Verification

**Cannot See:**
- Roll Revision (Dry-run + Commit)
- AI Services (Change Thresholds)
- Security & Audit

### DEO (District Election Officer)
**Sees:**
- Everything ERO sees PLUS:
- Roll Revision (Dry-run)
- BLO Task Assignment
- AI Services (View Logs)
- Biometric Operations

**Cannot See:**
- Roll Revision (Commit)
- AI Services (Change Thresholds + Retrain)
- Security & Audit (Manage)

### CEO (Chief Electoral Officer)
**Sees:**
- Everything DEO sees PLUS:
- Roll Revision (Commit)
- AI Services (All)
- Security & Audit (View)

**Cannot See:**
- System Settings (Manage Roles)

### SUPERADMIN
**Sees:**
- **EVERYTHING** - Full system access

---

## 🚀 Features

✅ Database-backed permissions  
✅ JWT tokens include role + permissions  
✅ Frontend UI dynamically filters based on permissions  
✅ Backend routes protected with permission middleware  
✅ Role hierarchy support  
✅ Wildcard permissions (e.g., `voters.*`)  
✅ Permission denied tooltips on disabled buttons  
✅ Role badge displayed on dashboard  
✅ Seeded users automatically assigned roles  

---

## 🔄 Migration & Setup

1. **Run migrations:**
   ```bash
   cd backend
   node src/db/migrate_rbac_complete.js
   ```

2. **Seed RBAC data:**
   ```bash
   node src/db/seed_rbac_complete.js
   ```

3. **Restart backend server**

4. **Login with seeded credentials**

---

## 📝 Notes

- All existing functionality remains unchanged
- UI adapts to show only relevant modules per role
- Backend enforces permissions on all admin routes
- Frontend provides visual feedback for permission-denied actions
- System is backward compatible with legacy role enum

---

## 🎯 Testing

Test each role by logging in with:
- `admin1@election.gov.in` → Should see ALL modules
- `admin2@election.gov.in` → Should see ONLY BLO tasks
- `admin3@election.gov.in` → Should see voter management, EPIC, duplicates
- `admin4@election.gov.in` → Should see district-level operations
- `admin5@election.gov.in` → Should see state-level operations + commit

---

**System Status:** ✅ Production Ready  
**RBAC Level:** ECI-Grade  
**Last Updated:** 2025-11-16

