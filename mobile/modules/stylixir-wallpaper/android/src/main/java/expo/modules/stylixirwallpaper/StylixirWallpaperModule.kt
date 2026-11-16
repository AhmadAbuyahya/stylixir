package expo.modules.stylixirwallpaper

import android.app.WallpaperManager
import android.net.Uri
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.FileNotFoundException

class StylixirWallpaperModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("StylixirWallpaper")

    // Sets an image file as the wallpaper. `screen` is "home", "lock" or "both".
    AsyncFunction("setWallpaper") { uri: String, screen: String ->
      val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()
      val which = when (screen) {
        "home" -> WallpaperManager.FLAG_SYSTEM
        "lock" -> WallpaperManager.FLAG_LOCK
        else -> WallpaperManager.FLAG_SYSTEM or WallpaperManager.FLAG_LOCK
      }
      val stream = context.contentResolver.openInputStream(Uri.parse(uri))
        ?: throw FileNotFoundException(uri)
      stream.use { WallpaperManager.getInstance(context).setStream(it, null, true, which) }
    }
  }
}
