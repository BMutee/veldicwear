# Implementation Plan

## 1. Admin-Only Layout (No Navbar/Footer)
- The root layout (`app/layout.tsx`) always renders Navbar + Footer
- Admin pages need to NOT show these
- Solution: add a `hidePublicUI` flag or restructure with a group route

## 2. 2FA (Two-Factor Authentication)
- Better Auth has a `twoFactor` plugin
- Add server-side: `twoFactor` with TOTP
- Add client-side: `twoFactor` plugin to auth client
- Create `/admin/security` page to set up 2FA
- Create `/verify-2fa` page for after-login verification

## 3. Forgot / Reset Password
- Better Auth has built-in `forgotPassword` / `resetPassword` 
- Create `/forgot-password` page
- Create `/reset-password` page
- Configure email sending for reset links

## 4. Admin-only Account Page
- Redirect `/account` to `/admin/account` for admin users
- Show security settings (2FA setup) there