# Decisions

Product and engineering decisions for goodays, newest last. Each one says what
was decided, why, and what it means for the work.

## 1. Sign-up protection (2026-10-22)

**Status:** Accepted. It applies once user accounts exist. Today goodays has
no sign-up or sign-in (everything stays on the device), so there is nothing
to switch on yet.

**Decision.** The same rule applies across all of Oz's projects.

1. **CAPTCHA.** Cloudflare Turnstile protects sign-up, sign-in and password
   reset. It uses the auth provider's built-in CAPTCHA support rather than a
   custom check. With Supabase, that's Authentication → Bot and Abuse
   Protection.
2. **Passwords.** At least 8 characters, with a lowercase letter, an
   uppercase letter and a digit. These rules are set in the auth provider and
   shown in the sign-up form. If the provider's minimum is already higher
   than 8, keep it; never lower it.

**Why.** It's a standard baseline that keeps automated sign-ups and guessed
passwords out of user accounts, with little friction for real people.

**Rollout order.** Follow it every time. Switching CAPTCHA on before the code
that sends the token is live blocks every sign-in.

1. Ship the code that sends the Turnstile token with sign-up, sign-in and
   password reset.
2. Switch CAPTCHA on in **staging** and test all three flows.
3. Release that code to production.
4. Only then, switch CAPTCHA on in **production**.

**Who does what.**

- **@claude:** builds the Turnstile widget into the three forms, sends its
  token through the auth provider, and adds the password rules to the form
  with clear messages.
- **@me (Oz):** creates the Turnstile widget in Cloudflare and puts its keys
  in place. The site key goes in the app's environment settings; the secret
  key goes in the auth provider's CAPTCHA settings. Keys are never shared in
  chat or committed to the repo.
