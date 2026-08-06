package com.workforceos.mobile

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.widget.RemoteViews
import org.json.JSONObject
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL

class AttendanceWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)

        if (ACTION_TOGGLE_ATTENDANCE == intent.action) {
            // Trigger haptic feedback
            triggerHapticFeedback(context)

            // Execute toggle in background thread
            Thread {
                performAttendanceToggle(context)
            }.start()
        }
    }

    private fun triggerHapticFeedback(context: Context) {
        try {
            val vibrator = context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
            if (vibrator != null && vibrator.hasVibrator()) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    vibrator.vibrate(VibrationEffect.createOneShot(50, VibrationEffect.DEFAULT_AMPLITUDE))
                } else {
                    @Suppress("DEPRECATION")
                    vibrator.vibrate(50)
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun performAttendanceToggle(context: Context) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val token = prefs.getString("auth_token", "") ?: ""
        val baseUrl = prefs.getString("api_base_url", "http://localhost:4000/api/v1") ?: "http://localhost:4000/api/v1"
        val currentStatus = prefs.getString("attendance_status", "CLOCKED_OUT") ?: "CLOCKED_OUT"

        val isClockingIn = currentStatus != "CLOCKED_IN"
        val endpoint = if (isClockingIn) "$baseUrl/attendance/check-in" else "$baseUrl/attendance/check-out"

        try {
            val url = URL(endpoint)
            val conn = url.openConnection() as HttpURLConnection
            conn.requestMethod = "POST"
            conn.setRequestProperty("Content-Type", "application/json")
            if (token.isNotEmpty()) {
                conn.setRequestProperty("Authorization", "Bearer $token")
            }
            conn.doOutput = true

            val jsonBody = JSONObject().apply {
                put("source", "ANDROID_WIDGET")
                put("latitude", prefs.getFloat("last_lat", 12.9716f).toDouble())
                put("longitude", prefs.getFloat("last_lng", 77.5946f).toDouble())
            }

            val writer = OutputStreamWriter(conn.outputStream)
            writer.write(jsonBody.toString())
            writer.flush()
            writer.close()

            val responseCode = conn.responseCode
            if (responseCode in 200..299) {
                val newStatus = if (isClockingIn) "CLOCKED_IN" else "CLOCKED_OUT"
                prefs.edit().apply {
                    putString("attendance_status", newStatus)
                    putLong("last_clock_time", System.currentTimeMillis())
                    apply()
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
            // Local state optimistic fallback
            val newStatus = if (isClockingIn) "CLOCKED_IN" else "CLOCKED_OUT"
            prefs.edit().apply {
                putString("attendance_status", newStatus)
                putLong("last_clock_time", System.currentTimeMillis())
                apply()
            }
        }

        // Broadcast widget update
        val appWidgetManager = AppWidgetManager.getInstance(context)
        val componentName = ComponentName(context, AttendanceWidgetProvider::class.java)
        val appWidgetIds = appWidgetManager.getAppWidgetIds(componentName)
        for (id in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, id)
        }
    }

    companion object {
        const val ACTION_TOGGLE_ATTENDANCE = "com.workforceos.mobile.ACTION_TOGGLE_ATTENDANCE"
        const val PREFS_NAME = "WorkforceOSWidgetPrefs"

        fun updateAppWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int
        ) {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val status = prefs.getString("attendance_status", "CLOCKED_OUT") ?: "CLOCKED_OUT"
            val userName = prefs.getString("user_name", "Staff Member") ?: "Staff Member"
            val lastTime = prefs.getLong("last_clock_time", 0L)

            val views = RemoteViews(context.packageName, R.layout.attendance_widget_layout)

            views.setTextViewText(R.id.widget_user_name, userName)

            if (status == "CLOCKED_IN") {
                views.setTextViewText(R.id.widget_status_pill, "CLOCKED IN")
                views.setInt(R.id.widget_status_pill, "setBackgroundResource", R.drawable.bg_status_in)

                views.setTextViewText(R.id.widget_action_text, "⚡ ONE-TAP CLOCK OUT")
                views.setInt(R.id.widget_action_button, "setBackgroundResource", R.drawable.bg_btn_clock_out)

                if (lastTime > 0) {
                    val diffMs = System.currentTimeMillis() - lastTime
                    val hours = diffMs / (1000 * 60 * 60)
                    val mins = (diffMs / (1000 * 60)) % 60
                    views.setTextViewText(R.id.widget_duration, String.format("%dh %02dm", hours, mins))
                } else {
                    views.setTextViewText(R.id.widget_duration, "Active")
                }
            } else {
                views.setTextViewText(R.id.widget_status_pill, "CLOCKED OUT")
                views.setInt(R.id.widget_status_pill, "setBackgroundResource", R.drawable.bg_status_out)

                views.setTextViewText(R.id.widget_action_text, "⚡ ONE-TAP CLOCK IN")
                views.setInt(R.id.widget_action_button, "setBackgroundResource", R.drawable.bg_btn_clock_in)
                views.setTextViewText(R.id.widget_duration, "-- : --")
            }

            // PendingIntent for action button
            val intent = Intent(context, AttendanceWidgetProvider::class.java).apply {
                action = ACTION_TOGGLE_ATTENDANCE
            }
            val pendingIntent = PendingIntent.getBroadcast(
                context,
                0,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_action_button, pendingIntent)

            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
    }
}
