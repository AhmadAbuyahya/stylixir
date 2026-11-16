import { Alert, Platform, ToastAndroid } from 'react-native'

/** A message fit for an alert: our own errors read fine, native stack traces don't. */
export function readable(error: unknown) {
  console.warn(error)
  const message = error instanceof Error ? error.message : ''
  return message && !/Caused by|Call to function|Exception/.test(message) ? message : 'Something went wrong. Please try again.'
}

/** A short confirmation: a toast on Android, an alert on iPhone (it has no toasts). */
export function notify(message: string) {
  if (Platform.OS === 'android')
    ToastAndroid.show(message, ToastAndroid.SHORT)
  else
    Alert.alert(message)
}
