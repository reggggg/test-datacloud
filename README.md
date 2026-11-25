# CloudLedger

CloudLedger is a React and Vite dashboard for viewing cloud infrastructure and estimated monthly spend. It includes a Recharts cost trend and spend breakdown, a searchable resource inventory, and CSV exports.

## Run locally

Use Node.js 22.12 or newer.

```sh
npm ci
npm run dev
```

Open the URL printed by Vite to see the sign-in page. Without Supabase settings, choose **Explore demo** to view sample data. Use **Exit demo** to return to the sign-in page.

Run `npm run build` to type-check and build the app. The production output is in `dist/`.

## Connect Supabase and Google sign-in

1. Copy `.env.example` to `.env.local`. Set `VITE_SUPABASE_URL` to the project's URL and `VITE_SUPABASE_PUBLISHABLE_KEY` to its publishable key. A legacy anon key can also be set as `VITE_SUPABASE_ANON_KEY`. Keep service-role and secret keys out of the frontend.
2. In **Supabase → Authentication → URL Configuration**, add the exact app URL to **Redirect URLs**, including its trailing slash (for example, `http://localhost:5173/`). Set **Site URL** to the deployed app URL when applicable. In Google Cloud, the OAuth client's authorized redirect URI is the Supabase callback shown in the Google provider settings, typically `https://<project-ref>.supabase.co/auth/v1/callback`. [Supabase Google sign-in setup](https://supabase.com/docs/guides/auth/social-sign-in/auth-google) · [Redirect URL setup](https://supabase.com/docs/guides/auth/redirect-urls).
3. In the Supabase project, enable Row Level Security for `public.cloud_sample_resources`. Give the `authenticated` role SELECT privileges and set a SELECT policy for the specific Google-authenticated users who should see the inventory. For example, once an admin has signed in, use their UUID from **Authentication → Users** in a policy targeting `authenticated` with `using ((select auth.uid()) = 'ADMIN_UUID'::uuid)`. Review existing policies because permissive policies combine with OR. [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security).
4. Restart Vite after editing `.env.local`, then select **Continue with Google**. Start and finish sign-in on the same browser and app origin. Use **Sign out** in the dashboard header to end your session in that browser. For production, supply the same Vite environment variables at build time.

The app reads `resource_key`, `resource_type`, `service_name`, `region`, `monthly_cost`, `status`, and `created_at` from `public.cloud_sample_resources`. Use a unique `resource_key` for each resource so paginated reads have a stable order. No database changes are run by this app.

## Reading the charts

The dashboard displays costs in USD. The trend sums the current monthly cost of resources created by the end of each month, up to today for the current month. Resources with missing creation dates are excluded from the trend. Monthly cost changes and deleted resources require a historical billing dataset.
