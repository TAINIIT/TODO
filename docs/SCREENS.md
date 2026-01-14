# TaskFlow - Screens & Features Documentation

## Overview

TaskFlow is a multi-tenant work assignment application with role-based access control (RBAC).

**Roles:** Admin > Manager > Employee

---

## 🔐 Authentication Module

### Login (`/login`)

| Feature | Description |
|---------|-------------|
| Email/Password Login | Firebase Authentication |
| Domain Restriction | Only `@tsb.com.vn` emails |
| Remember Session | Persistent login state |
| Navigation | Links to Register, Forgot Password |

**Validations:**

- Email format validation
- Password required
- Invalid credentials error display

---

### Register (`/register`)

| Feature | Description |
|---------|-------------|
| Account Creation | New user signup |
| Domain Check | Must use `@tsb.com.vn` |
| Password Rules | Minimum 8 characters |
| Auto-login | Redirects to dashboard after success |

---

### Forgot Password (`/forgot-password`)

| Feature | Description |
|---------|-------------|
| Email Input | Enter registered email |
| Reset Link | Firebase sends password reset email |
| Success Message | Confirmation after sending |

---

### Organization Onboarding (`/onboarding`)

Multi-step wizard for new organization setup.

| Step | Fields |
|------|--------|
| **1. Organization** | Name, Email Domain |
| **2. Admin Account** | Name, Email, Password |
| **3. Invite Team** | Add team member emails |
| **4. Complete** | Success confirmation |

---

## 📊 Dashboard Module

### Main Dashboard (`/dashboard`)

#### Employee View

| Widget | Description |
|--------|-------------|
| Welcome Banner | Personalized greeting |
| Due Today | Tasks due today count |
| Overdue | Overdue tasks count |
| In Progress | Active tasks count |
| Upcoming | Tasks due soon |
| Today's Tasks | List of today's tasks |
| Overdue Alert | Red-bordered urgent section |

#### Manager/Admin View

| Widget | Description |
|--------|-------------|
| Stats Cards | Active, Completed Today, Overdue, Team Members |
| Status Pie Chart | Task distribution by status |
| Priority Bar Chart | Active tasks by priority |
| Quick Actions | Links to Tasks, Teams, Projects |
| Overdue Alert | Team-wide overdue tasks |

---

### Advanced Analytics (`/analytics`) - Admin Only

| Widget | Description |
|--------|-------------|
| Completion Rate | % of completed tasks |
| Avg Completion Time | Average days to complete |
| Active Users | Users with activity |
| Tasks This Period | Created in selected period |
| Productivity Trend | Line chart: created vs completed |
| Project Status | Pie chart by project status |
| Team Performance | Bar chart by team |
| User Activity | Bar chart by user |

**Filters:** Last 7/30/90 days

---

## ✅ Task Management Module

### Tasks List (`/tasks`)

| Feature | Description |
|---------|-------------|
| Task Cards | Title, status badge, priority, due date, assignee |
| Create Task | Modal form (Manager+ only) |
| Filter by Status | All, Backlog, In Progress, Blocked, Done |
| Filter by Priority | All, Low, Medium, High, Urgent |
| Search | Search by title/description |
| Sort | By due date, priority, created date |
| Export Excel | Download .xlsx with all tasks |

**Create Task Form:**

- Title (required)
- Description
- Priority (Low/Medium/High/Urgent)
- Due Date
- Assignee
- Project
- Team
- Checklist Items

---

### Task Detail (`/tasks/[id]`)

| Section | Features |
|---------|----------|
| **Header** | Title (editable), Back button |
| **Status** | Current status, transition buttons |
| **Details** | Priority, Due Date, Assignee, Project, Team |
| **Description** | Rich text, editable |
| **Checklist** | Add/toggle/delete items |
| **Comments** | Add/edit/delete comments, timestamps |
| **Attachments** | Upload/download files |
| **Meta Info** | Created/Updated by, timestamps |

**Status Transitions:**

- Backlog → In Progress
- In Progress → Done / Blocked
- Blocked → In Progress
- Done → Reopen (to Backlog)

---

## 📅 Calendar Module

### Calendar View (`/calendar`)

| Feature | Description |
|---------|-------------|
| Monthly Grid | Calendar with navigation |
| Task Dots | Colored dots on dates with tasks |
| Date Selection | Click date to view tasks |
| Task Sidebar | List of tasks for selected date |
| Legend | Priority color coding |

**Color Coding:**

- 🔴 Red: Urgent/Overdue
- 🟠 Orange: High priority
- 🟡 Yellow: Medium priority
- ⚪ Gray: Low priority

---

## 📈 Reporting Module

### Reports (`/reports`) - Manager+

| Widget | Description |
|--------|-------------|
| KPI Cards | Created, Completed, Overdue, Active Team |
| Status Distribution | Pie chart |
| Priority Distribution | Bar chart |
| Top Performers | Ranked user list by completion |
| Quick Stats | Active projects, teams |

**Features:**

- Period Filter: Last 7/30/90 days
- Export Excel: Multi-sheet report

---

### Audit Logs (`/audit-logs`) - Admin Only

| Feature | Description |
|---------|-------------|
| Log List | Timestamp, Action, Entity, Actor |
| Filter by Entity | Task, User, Team, Project |
| Filter by Actor | User who performed action |
| Expandable Details | Before/After changes JSON |
| Export CSV | Download all logs |

**Tracked Actions:**

- CREATE, UPDATE, DELETE for all entities
- Status changes, assignments, etc.

---

## 👥 Management Module

### Teams (`/teams`) - Manager+

| Feature | Description |
|---------|-------------|
| Team List | Name, member count, leader |
| Create Team | Name, description, leader |
| Edit Team | Update details |
| Manage Members | Add/remove team members |
| Delete Team | With confirmation |

---

### Projects (`/projects`) - Manager+

| Feature | Description |
|---------|-------------|
| Project List | Name, status, task count |
| Create Project | Name, description, team |
| Edit Project | Update details |
| Status Management | Active/Completed/On Hold |
| Delete Project | With confirmation |

---

### Users (`/users`) - Admin Only

| Feature | Description |
|---------|-------------|
| User List | Name, email, role, status |
| Create User | Invite new user |
| Edit User | Update role, team |
| Enable/Disable | Toggle user access |
| Role Assignment | Employee/Manager/Admin |

---

## ⚙️ Settings Module

### Settings (`/settings`)

#### Profile Tab

| Field | Description |
|-------|-------------|
| Display Name | Editable |
| Email | Read-only |
| Avatar | Upload/change |
| Save Button | Persist changes |

#### Security Tab

| Feature | Description |
|---------|-------------|
| Current Password | Required for change |
| New Password | Minimum 8 characters |
| Confirm Password | Must match |
| Change Button | Update password |

#### Notifications Tab

| Setting | Description |
|---------|-------------|
| Email Notifications | Toggle on/off |
| Due Soon Reminders | Toggle + timing |
| Overdue Alerts | Toggle on/off |
| Daily Summary | Toggle on/off |

#### Appearance Tab

| Setting | Description |
|---------|-------------|
| Theme | Light/Dark/System |
| Language | (Future) |

---

## 📧 Email Reminder System

### Backend Service (`emailReminders.ts`)

| Function | Description |
|----------|-------------|
| `queueEmailReminder` | Add reminder to Firestore queue |
| `checkAndQueueDueSoonReminders` | Detect tasks due in 24h |
| `checkAndQueueOverdueReminders` | Detect overdue tasks |
| `generateDailySummary` | Create daily digest |

### Email Templates

| Template | Content |
|----------|---------|
| Due Soon | Task title, due date, link |
| Overdue | Urgent alert with task link |
| Daily Summary | Count of tasks by status |

---

## 📱 Mobile Support

### iOS (`docs/IOS_BUILD.md`)

- Capacitor integration
- Deep links: `taskflow://`
- App icons & splash screen config

### Android (`docs/ANDROID_BUILD.md`)

- Capacitor integration
- Play Store ready (AAB)
- Deep links: `taskflow://`

---

## 🧪 Testing

### Playwright E2E (`tests/workflow.spec.ts`)

| Suite | Tests |
|-------|-------|
| Authentication | 4 |
| Task Management | 5 |
| Navigation | 4 |
| Dashboard | 2 |
| Calendar | 3 |
| Settings | 3 |
| Reports | 1 |

**Total: 22 tests** (49 seconds)

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React, TypeScript |
| Styling | TailwindCSS |
| Charts | Recharts |
| Backend | Firebase (Auth, Firestore, Storage) |
| Mobile | Capacitor (iOS, Android) |
| Testing | Playwright |
| Export | SheetJS (xlsx) |
