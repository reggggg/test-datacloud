# CloudLedger

CloudLedger is a React and Vite dashboard for viewing cloud infrastructure and estimated monthly spend. It includes a Recharts cost trend and spend breakdown, a searchable resource inventory, and CSV exports.

## Run locally

Use Node.js 22.12 or newer.

```sh
npm ci
npm run dev
```

Open the URL printed by Vite and choose **Continue with Google**. CloudLedger uses the configured Supabase project by default.

Run `npm run build` to type-check and build the app. The production output is in `dist/`.

## Connect Supabase and Google sign-in

1. In **Supabase → Authentication → URL Configuration**, add the exact app URL to **Redirect URLs**, including its trailing slash (for example, `http://localhost:5173/`). Set **Site URL** to the deployed app URL when applicable. In Google Cloud, the OAuth client's authorized redirect URI is the Supabase callback shown in the Google provider settings, typically `https://<project-ref>.supabase.co/auth/v1/callback`. [Supabase Google sign-in setup](https://supabase.com/docs/guides/auth/social-sign-in/auth-google) · [Redirect URL setup](https://supabase.com/docs/guides/auth/redirect-urls).
2. In the Supabase project, enable Row Level Security for `public.cloud_sample_resources`. Give the `authenticated` role SELECT privileges and set a SELECT policy for the specific Google-authenticated users who should see the inventory. For example, once an admin has signed in, use their UUID from **Authentication → Users** in a policy targeting `authenticated` with `using ((select auth.uid()) = 'ADMIN_UUID'::uuid)`. Review existing policies because permissive policies combine with OR. [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security).
3. Start and finish sign-in on the same browser and app origin. Use **Sign out** in the dashboard header to end your session in that browser.

To override the project, copy `.env.example` to `.env.local` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` together. You can also use `VITE_SUPABASE_ANON_KEY` with a legacy anon key. Keep service-role and secret keys out of the frontend. Restart Vite after editing `.env.local`. For production, supply any overrides at build time.

To view sample data, leave both variables in `.env.local` empty, restart Vite, and choose **Explore demo**.

The app reads `resource_key`, `resource_type`, `service_name`, `region`, `monthly_cost`, `status`, and optional `created_at` from `public.cloud_sample_resources`. Use a unique `resource_key` for each resource so paginated reads have a stable order. No database changes are run by this app.

## Reading the charts

After sign-in, **Workspace home** at `/` links to **CloudLedger** at `/cloudledger` and **Psychographics** at `/psychographics`. Both workspaces can be opened directly. Keep the app root in the Supabase redirect allowlist. For production hosting, configure the web server to serve `index.html` for application routes such as `/cloudledger` and `/psychographics`.

Psychographics reads `segment_name`, `snapshot_date`, `trait_name`, `category`, `index_pct`, and `overlap_pct` from `public.psychographic_breakdown`. Use one row per segment, snapshot date, and trait. Store percentages as numbers on the same scale shown in the app, so `30` displays as `30%`. An index of zero matches the network baseline. To load live rows, give authorized accounts a SELECT policy on this table, following the same policy pattern above.

The dashboard displays costs in USD. The trend sums the current monthly cost of resources created by the end of each month, up to today for the current month. Resources with missing creation dates are excluded from the trend. If there are no usable creation dates, the dashboard charts current monthly costs by service instead. Monthly cost changes and deleted resources require a historical billing dataset.
