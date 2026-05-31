

# D.O.M.E. — Digital Onboarding Migration Ease

## Overview
A full-featured immigration practice management app with two portals: one for practitioners (case management, tasks, calendar) and one for clients (view case status, upload documents, stay informed). Modern & friendly design with warm colors, rounded corners, and an approachable feel.

---

## 1. Backend Setup (Supabase / Lovable Cloud)

- **Authentication**: Email/password login for both practitioners and clients, with role-based access
- **User roles table**: `user_roles` table with roles: `admin`, `practitioner`, `client`
- **Profiles table**: Name, avatar, phone, firm name (for practitioners), linked to auth.users
- **Cases table**: Case type (visa category), status, assigned practitioner, client, priority, deadlines, notes
- **Documents table**: File name, category, case reference, upload date, status (pending/approved/rejected), stored in Supabase Storage
- **Tasks table**: Title, description, due date, assigned to, case reference, status, priority
- **Calendar events table**: Title, date/time, type (hearing, deadline, meeting), case reference, attendees
- **Messages/notifications table**: For in-app updates between practitioner and client

## 2. Authentication & Role-Based Access

- **Login/signup pages** with a warm, welcoming design
- **Role-based routing**: Practitioners see the admin dashboard; clients see the client portal
- **Password reset flow** with dedicated reset page
- **Protected routes** for both portals

## 3. Practitioner Dashboard

- **Overview page**: Summary cards showing active cases, upcoming deadlines, pending documents, tasks due today
- **Case Management**: List/grid view of all cases with filters (status, visa type, priority). Click into a case to see full details, timeline, documents, and notes
- **Document Manager**: View all documents across cases, filter by status. Approve/reject client uploads
- **Calendar View**: Monthly/weekly view with deadlines, hearings, and appointments. Create and edit events
- **Task Board**: Kanban-style or list view of tasks, assignable to team members, linked to cases
- **Client List**: Directory of all clients with quick access to their cases

## 4. Client Portal

- **My Case view**: Clear status tracker (e.g., "Application Submitted → Under Review → Approved") showing where they are in the process
- **Document Upload**: Simple drag-and-drop upload area with a checklist of required documents and their status
- **Messages/Updates**: Timeline of updates from their practitioner
- **Upcoming Events**: Next appointment, deadline reminders

## 5. Design System

- **Modern & friendly**: Soft rounded corners, warm accent colors (e.g., teal/coral palette), clean typography
- **Responsive**: Works on desktop and tablet for practitioners, mobile-friendly for clients
- **Sidebar navigation** for practitioners, simplified top nav for clients
- **Status badges** with color coding throughout (green=approved, amber=pending, red=urgent)

## 6. Pages & Routes

| Route | Description |
|---|---|
| `/login` | Shared login page |
| `/signup` | Signup with role selection |
| `/dashboard` | Practitioner overview |
| `/cases` | Case list |
| `/cases/:id` | Case detail |
| `/documents` | Document manager |
| `/calendar` | Calendar view |
| `/tasks` | Task board |
| `/clients` | Client directory |
| `/portal` | Client portal home |
| `/portal/documents` | Client document upload |
| `/portal/messages` | Client updates |
| `/reset-password` | Password reset |

