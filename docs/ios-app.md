# goodays on iPhone: first build

The iPhone app wraps the web app with Capacitor and adds the things a web app
can't do:

- **Haptics.** You feel set ticks, countdowns and finishes.
- **Notifications.** One fires when a rest, move or meditation ends with the phone
  locked. Another is the daily alarm.
- **A Live Activity.** The running session shows on the Lock Screen and in the
  Dynamic Island.
- **Widgets.** Today's numbers show on the home screen and Lock Screen.
- **Background sound.** The rain and meditation sound keeps playing with the
  screen locked.

Everything except the widget target is already in the repo. The steps below
need your Mac, Xcode and your Apple account.

> **Not built yet.** All of this was written on Linux, where it can't be compiled.
> Expect a few small Swift errors on the first build. Paste them to Claude and
> they're usually one-line fixes.

## 0. What you need

- A Mac with **Xcode** installed from the Mac App Store, opened once so it can
  finish installing its parts.
- **Node 20 or newer** (`node -v`). If it's missing, install it from nodejs.org.
- Your **Apple ID**.
  - A free Apple ID is enough to run the app on your own iPhone. With a free
    account the app stops opening after about 7 days (please verify this) and
    you rebuild it.
  - The **Apple Developer Program** (paid yearly) is needed for TestFlight and
    the App Store. App Groups may also need it; see step 4.

## 1. Get the code and open the project

In Terminal:

```sh
git clone https://github.com/leopthe-cpu/routin.fit.git goodays
cd goodays
npm install
npm run ios
```

`npm run ios` builds the web app, copies it into the iOS project and opens
Xcode.

## 2. Sign the app

1. In Xcode's left sidebar, click the blue **App** project, then the **App** target.
2. Open the **Signing & Capabilities** tab.
3. Tick **Automatically manage signing**.
4. Choose your **Team** (your Apple ID). If it isn't listed: Xcode →
   Settings → Accounts → **+**.
5. **Bundle Identifier** is `world.goodays.app`. Keep it if Xcode accepts it.
   It can't change after the first App Store upload, so this is the moment to
   pick another one if you want.

## 3. Run it on your iPhone (before the widgets)

1. Plug in the iPhone. On the phone, turn on Settings → Privacy & Security →
   **Developer Mode** (iOS asks for this on the first run) and trust the Mac.
2. At the top of Xcode, pick your iPhone as the run destination and press
   **▶ Run**.
3. The first time, the phone may refuse to open the app. Go to Settings →
   General → VPN & Device Management and trust your developer profile.

At this point the app works with haptics, notifications, the Live Activity
code and background sound. The Live Activity only appears once step 5 is
done, because its look lives in the widget extension.

**Your data:** the iPhone app has its own storage, separate from the website.
Export a backup from the web app (Settings → Export), send it to your phone,
and use Settings → Import in the iPhone app.

## 4. Add capabilities to the App target

Still under **App** target → **Signing & Capabilities**, click **+ Capability**
and add each of these:

| Capability | Setting |
|---|---|
| **App Groups** | Click **+** and add `group.world.goodays.app` |
| **Time Sensitive Notifications** | Nothing to set |
| **Background Modes** | Tick **Audio, AirPlay, and Picture in Picture**. It may already be ticked from Info.plist. |

The App Group is how the app hands today's numbers to the widgets.

## 5. Add the widget extension

1. Choose **File → New → Target…** → iOS → **Widget Extension** → Next.
2. Fill it in:
   - **Product Name:** `GoodaysWidgets`
   - Tick **Include Live Activity**.
   - Untick **Include Control** and **Include Configuration App Intent**, if
     they're shown.
3. Click **Finish**. If Xcode asks to **Activate** the scheme, say yes.
4. Xcode creates a `GoodaysWidgets` folder with its own sample `.swift`
   files. In Xcode's sidebar, select all the sample `.swift` files in that
   folder → Delete → **Move to Trash**. Keep `Info.plist` and
   `Assets.xcassets`.
5. Drag the three files from `ios/App/WidgetSources/` in Finder into the
   `GoodaysWidgets` folder in Xcode:
   - `GoodaysWidgetsBundle.swift`
   - `SessionLiveActivity.swift`
   - `TodayWidget.swift`

   In the dialog, tick **Copy items if needed** and add them only to the
   **GoodaysWidgets** target.
6. In the sidebar, select `App/GoodaysActivity.swift`. In the right-hand
   inspector, under **Target Membership**, tick **GoodaysWidgets** too, so it
   belongs to both.
7. Select the **GoodaysWidgets** target → **Signing & Capabilities**:
   - Set the same **Team**.
   - **+ Capability** → **App Groups** → tick `group.world.goodays.app`.
8. Select the **GoodaysWidgets** target → **General** → **Minimum
   Deployments:** iOS **17.0**, the same as the app.

Pick the **App** scheme again at the top of Xcode (not GoodaysWidgets) and
press **▶ Run**.

## 6. Try it

- **Live Activity:**
  1. Start a workout and tick a set so a rest starts.
  2. Lock the phone. The rest countdown shows on the Lock Screen.
  3. On an iPhone 14 Pro or newer, go to the home screen instead. The countdown
     shows in the Dynamic Island; long-press it for the expanded view.
- **Widgets:**
  1. Long-press the home screen → **Edit** → **Add Widget** → search
     **goodays** → **Today** (small or medium).
  2. For the Lock Screen: long-press it → **Customize** → Lock Screen → tap the
     widget area.
- **Alarm:** set it a couple of minutes ahead, lock the phone and wait for the
  notification.
- **Rain sound:** start stretches with sound on and lock the phone. The sound
  should keep playing (see the note at the end).

## After any change to the web app

```sh
git pull
npm install
npm run ios:sync
```

Then press **▶ Run** in Xcode again.

## Known limits

- **Live Activities end on their own** after several hours (about 8, as far as
  I know; please verify). They only update while the app is open or running in
  the background. Updating one with the app fully closed would need push
  notifications from a server.
- **Widgets refresh when the app changes something** and again at midnight.
  iOS rations widget refreshes, so they aren't live by the second.
- **The alarm is a notification.** It plays the standard notification sound
  once (a custom sound file can come later). It isn't a full alarm like the
  Clock app's. iOS 26 added an alarm feature for third-party apps (AlarmKit);
  using it is a possible later step and needs checking.
- **Background sound with the screen locked isn't tested yet.** Web Audio inside the
  app may still pause when the phone locks. If it does, the fix is to play the
  sound natively. Tell Claude.

## Files

| Where | What |
|---|---|
| `capacitor.config.json` | App id, name and plugin settings |
| `src/native/index.js` | The web app's calls into iOS (each one does nothing in the browser) |
| `src/native/NativeSync.jsx` | Keeps the Live Activity, notifications, alarm and widgets in step with the app |
| `ios/App/App/GoodaysNativePlugin.swift` | The iOS side of those calls |
| `ios/App/App/GoodaysActivity.swift` | What a Live Activity carries; shared with the widgets |
| `ios/App/WidgetSources/` | The Live Activity and Today widget designs (SwiftUI) |
