# ABCMA Website & Admin CMS — Supabase + Vercel Setup Guide

This application uses **React + Vite + Tailwind CSS + Supabase** (Auth, PostgreSQL with Row Level Security, and Storage) and is configured for zero-config deployment on **Vercel** (`vercel.json` SPA rewrites included).

---

## 1. Required Environment Variables

Create a `.env.local` file locally (and configure the exact same variables in **Vercel Dashboard → Project Settings → Environment Variables**):

```env
VITE_SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY"
```

> **Security Warning:** Never place `SUPABASE_SERVICE_ROLE_KEY` in any `VITE_*` variable or frontend source file. Only the public publishable (`sb_publishable_...`) or `anon` key is used in browser code, with permissions strictly enforced by PostgreSQL Row Level Security (RLS).

---

## 2. How to Execute Migrations in the Supabase SQL Editor

Run both SQL scripts in order inside your Supabase project:

1. Log into the **Supabase Dashboard** and open your project.
2. In the left sidebar, click **SQL Editor → + New query**.
3. **Run Migration 1 (`001_abcma_cms_schema.sql`)**:
   - Open `supabase/migrations/001_abcma_cms_schema.sql` from this project.
   - Copy the **entire** SQL script, paste it into the Supabase SQL Editor, and click **Run** (or press `Ctrl+Enter` / `Cmd+Enter`).
   - What this creates:
     - All **15 tables**: `admin_roles`, `admin_profiles`, `pages`, `news`, `announcements`, `departments`, `staff_profiles`, `events`, `gallery_albums`, `gallery_images`, `documents`, `navigation_items`, `website_settings`, `media_library`, and `activity_logs`.
     - **Indexes & Triggers**: Foreign keys, lookup indexes, automatic `updated_at` triggers, and privilege-column protection on `admin_profiles`.
     - **Row Level Security (RLS)**: Public website visitors (`anon`) can only read published/visible records; authenticated administrators are gated by role (`super_admin`, `content_admin`, `editor`).
     - **Storage Bucket (`abcma-media`)**: Public bucket with a `15 MB` limit per file and authenticated admin upload/update/delete policies.
   - *Note:* This script is **idempotent** (`IF NOT EXISTS`, `DROP ... IF EXISTS`, `ON CONFLICT`), so it is safe to rerun if interrupted.
4. **Run Migration 2 (`002_seed_initial_abcma_content.sql`)**:
   - Click **+ New query** again in the Supabase SQL Editor.
   - Copy the **entire** contents of `supabase/migrations/002_seed_initial_abcma_content.sql`, paste it into the editor, and click **Run**.
   - What this seeds without duplicating records on rerun:
     - Singleton `website_settings` (`id = 1`)
     - All 8 header `navigation_items` (`Home`, `News`, `Departments`, `Service`, `Projects`, `Documents`, `Gallery`, `The Assembly`)
     - All **10 statutory `departments`** (`Central Admin`, `HR`, `MIS`, `Works`, `Social Welfare`, `Physical Planning`, `Finance`, `EHSU`, `NADMO`, `Agriculture`)
     - Senior management `staff_profiles`
     - All **12 `news` articles** (`local` and `other` scopes, with homepage highlights)
     - Initial public `announcements`, consultative town hall `events`, `gallery_albums` + `gallery_images`, all **16 `documents`**, and a starter published CMS page (`/page/client-service-charter`).
5. **Run Migration 3 (`003_abcma_projects_cms.sql`)**:
   - Click **+ New query** in the Supabase SQL Editor.
   - Copy the **entire** contents of `supabase/migrations/003_abcma_projects_cms.sql`, paste it into the editor, and click **Run**.
   - What this creates idempotently:
     - The `public.projects` table (linked to `public.departments` and `public.admin_profiles`), indexes, automatic `updated_at` trigger, and Row Level Security policies (public visitors read `publication_status = 'published'` only; active admins manage projects according to role).
     - All **8 initial ABCMA Capital Projects** (`on conflict (slug) do nothing`).

---

## 3. Create Your First Super Administrator Account

Public self-registration is intentionally disabled. Your `/admin/login` page verifies **both** a valid Supabase Auth session **and** an active row in `public.admin_profiles`.

1. In Supabase Dashboard → **Authentication → Sign In / Providers → Email**, verify **Email** is enabled.
   - *(Optional hardening)* Disable **Allow new users to sign up** so only admins you create in the dashboard can ever register Auth accounts.
2. Go to **Authentication → Users → Add user → Create new user**:
   - Enter the administrator email (e.g., `admin@abcma.gov.gh`) and a strong password.
   - Check **Auto Confirm User**.
   - Click **Create user** and copy the generated **User UID** (`uuid`).
3. Open **SQL Editor → + New query** and run the following query, replacing `<AUTH_USER_UUID>`, email, and full name:

```sql
insert into public.admin_profiles (id, email, full_name, role_id, department, is_active)
values (
  '<AUTH_USER_UUID>',
  'admin@abcma.gov.gh',
  'System Super Administrator',
  (select id from public.admin_roles where slug = 'super_admin'),
  'Management Information Systems (MIS)',
  true
)
on conflict (id) do update set
  role_id = excluded.role_id,
  is_active = true;
```

Once created, that Super Administrator can log in at `/admin/login` and authorize additional **Content Administrators** or **Editors** directly from the **Administrator Accounts** section of the Admin Dashboard (after creating their Supabase Auth users).

---

## 4. Configure Auth URLs & Password Reset Redirects

In Supabase Dashboard → **Authentication → URL Configuration**:
- Set **Site URL** to your production domain (e.g., `https://abcma-web-emb-o5li.vercel.app`).
- Under **Redirect URLs**, add:
  - `https://abcma-web-emb-o5li.vercel.app/admin/login`
  - `https://ais-dev-zyv3v27lxcodagydrb6ygj-73510279812.europe-west1.run.app/admin/login`
  - `http://localhost:3000/admin/login`

---

## 5. Role Permissions Matrix (Enforced by RLS)

| Role (`admin_roles.slug`) | Create & Edit Drafts / Upload Media | Publish, Unpublish & Delete Content | Homepage, Navigation & Site Settings | Manage Admin Accounts & Roles | View Activity Logs |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Super Administrator** (`super_admin`) | Yes | Yes | Yes | Yes | Yes |
| **Content Administrator** (`content_admin`) | Yes | Yes | Yes | No | Yes |
| **Editor** (`editor`) | Yes | No | No | No | Yes |

---

## 6. Verification Checklist

1. In Supabase **Table Editor**, confirm all 15 tables exist and `website_settings` has 1 row, `departments` has 10 rows, `news` has 12 rows, and `documents` has 16 rows.
2. In Supabase **Storage → Buckets**, confirm `abcma-media` exists and is marked **Public**.
3. Open `/admin/login` in the browser, sign in with your Super Administrator credentials, and verify you land on the Admin Dashboard with full access.
4. Ordinary visitors without an `admin_profiles` record (or with `is_active = false`) are automatically signed out and blocked at `/admin/login`.
