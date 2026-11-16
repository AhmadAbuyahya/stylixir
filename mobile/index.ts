// When Android wakes the app for a background task, nothing renders, so no route file loads.
// The auto-change task is defined here instead, before Expo Router takes over.
import './src/lib/auto'
import 'expo-router/entry'
