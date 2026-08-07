package com.workforceos.mobile

import android.content.Context
import android.media.AudioAttributes
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.view.HapticFeedbackConstants
import io.flutter.embedding.android.FlutterFragmentActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterFragmentActivity() {
    private val CHANNEL = "com.workforceos.mobile/widget"

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)

        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL).setMethodCallHandler { call, result ->
            if (call.method == "updateWidgetData") {
                val prefs = getSharedPreferences("WorkforceOSWidgetPrefs", Context.MODE_PRIVATE)
                val editor = prefs.edit()

                call.argument<Boolean>("is_logged_in")?.let { editor.putBoolean("is_logged_in", it) }
                call.argument<String>("attendance_status")?.let { editor.putString("attendance_status", it) }
                call.argument<String>("active_work_mode")?.let { editor.putString("active_work_mode", it) }
                call.argument<String>("user_name")?.let { editor.putString("user_name", it) }
                call.argument<String>("auth_token")?.let { editor.putString("auth_token", it) }
                call.argument<String>("api_base_url")?.let { editor.putString("api_base_url", it) }
                call.argument<Number>("last_clock_time")?.let { editor.putLong("last_clock_time", it.toLong()) }
                call.argument<Number>("last_lat")?.let { editor.putFloat("last_lat", it.toFloat()) }
                call.argument<Number>("last_lng")?.let { editor.putFloat("last_lng", it.toFloat()) }
                editor.apply()

                // Refresh all Home Screen Widget variations
                AttendanceWidgetProvider.refreshAllWidgets(applicationContext)

                result.success(true)
            } else if (call.method == "clearWidgetData") {
                val prefs = getSharedPreferences("WorkforceOSWidgetPrefs", Context.MODE_PRIVATE)
                prefs.edit().clear().apply()
                AttendanceWidgetProvider.refreshAllWidgets(applicationContext)
                result.success(true)
            } else if (call.method == "vibrate") {
                val duration = call.argument<Number>("duration")?.toLong() ?: 60L
                triggerHardwareVibration(duration)
                result.success(true)
            } else {
                result.notImplemented()
            }
        }
    }

    private fun triggerHardwareVibration(durationMs: Long) {
        try {
            // 1. Force DecorView haptic feedback ignoring global touch setting (Works on Nothing OS / Pixel / Samsung)
            window.decorView.post {
                window.decorView.performHapticFeedback(
                    HapticFeedbackConstants.KEYBOARD_TAP,
                    HapticFeedbackConstants.FLAG_IGNORE_GLOBAL_SETTING
                )
            }

            // 2. Hardware Vibrator API with USAGE_TOUCH AudioAttributes for Nothing OS Linear Resonant Actuators
            val vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val vm = getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
                vm?.defaultVibrator
            } else {
                @Suppress("DEPRECATION")
                getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
            }

            if (vibrator != null && vibrator.hasVibrator()) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    val attributes = AudioAttributes.Builder()
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .setUsage(AudioAttributes.USAGE_ASSISTANCE_SONIFICATION)
                        .build()

                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                        vibrator.vibrate(
                            VibrationEffect.createPredefined(VibrationEffect.EFFECT_HEAVY_CLICK),
                            attributes
                        )
                    } else {
                        vibrator.vibrate(
                            VibrationEffect.createOneShot(durationMs, VibrationEffect.DEFAULT_AMPLITUDE),
                            attributes
                        )
                    }
                } else {
                    @Suppress("DEPRECATION")
                    vibrator.vibrate(durationMs)
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
