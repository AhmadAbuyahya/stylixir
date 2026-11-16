# Stylixir mobile

The phone app: make a pattern wallpaper, save it, and let it change on its own.
Native screens (Expo Router native tabs and sheets, `@expo/ui` controls); the
patterns come from the website's own engine in `../src/lib`, so there is one set
of patterns for both.

## Run it

```bash
npm install
npx expo run:android   # or run:ios (needs CocoaPods)
```

A self-contained Android build that runs without the dev server:

```bash
npx expo prebuild -p android
cd android && ./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a
adb install -r app/build/outputs/apk/release/app-release.apk
```

## After changing the patterns or engine

From the repo root:

```bash
pnpm mobile:renderer   # rebuilds src/renderer/html.ts, the page that paints and exports
pnpm mobile:thumbs     # rebuilds the pattern picker thumbnails
```

## How it fits together

- `src/app/` screens: Create (`index`, the wallpaper full screen with one bar of actions), Library and Auto pushed on top of it, and the Patterns, Adjust and Save sheets.
- `src/components/ui.tsx` is the whole look: one dark, neutral theme and the few shared controls, so the wallpaper is the only color on screen.
- `src/components/pattern-canvas.tsx` paints the look in a chrome-less WebView and exports PNGs.
  CSS patterns need a browser engine to draw; everything around the canvas is native.
- `modules/stylixir-wallpaper` is a small Kotlin module that sets the Android wallpaper.
  iPhone apps can't do that, so the Auto tab walks through a Shortcuts automation instead.
- `src/lib/auto.ts` is the background task (WorkManager on Android) that rotates Library wallpapers.
