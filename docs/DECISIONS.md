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

## 2. Direction: a calendar for your day, with fitness and wellness built in (2026-10-28)

**Status:** Accepted as the product direction. Not built yet.

**Decision.** goodays grows from a workout and wellness app into the place to
check your day and see what's coming. It shows one timeline of:

- the plan's stretches and workouts, meditation and goals
- your own events (games, runs, rides)
- appointments from Apple, Google and Outlook calendars

A simple filter hides the kinds you don't want to see, such as work meetings,
so the view shows your regular appointments and routines.

**How calendars connect, in order.**

1. **iPhone app first, through Apple's calendar access (EventKit).** It reads
   the calendars on the phone after a one-time permission prompt. Google and
   Outlook accounts added in iOS Settings → Calendar should come along, as far
   as we know; this needs testing on a real phone. Advantages: one
   integration, no sign-in, no server, no keys, and the data stays on the
   phone. Read-only at first.
2. **Web, later, direct sign-in to Google and Microsoft.**
   - Google Calendar API with a read-only scope.
   - Microsoft Graph's calendar view with a read-only calendar permission.
   - Both need registered apps and a sign-in flow, and likely a small server
     to keep tokens.
   - Google requires app verification for sensitive scopes before the
     "unverified app" warning goes away.
   - This waits for user accounts, which bring decision 1's sign-up
     protection with them.

**Filter.**

- Each connected calendar can be switched on or off; for example, hide the
  Work calendar.
- One switch hides **meetings**: events with other attendees or a video-call
  link.
- Optional keyword rules hide events whose title matches.
- The activity filter on the Plans calendar keeps working the same way: it
  only offers the kinds in view.

**Why.** Seeing training, wellness and appointments together answers "what
does my day look like?" in one place, which is what the app is opened for each
morning.
