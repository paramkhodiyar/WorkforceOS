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

open class AttendanceWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId, R.layout.widget_standard_layout)
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)

        val action = intent.action ?: return
        if (action == ACTION_CLOCK_IN_WFO || action == ACTION_CLOCK_IN_WFH || action == ACTION_CLOCK_OUT) {
            triggerHapticFeedback(context)
            val mode = if (action == ACTION_CLOCK_IN_WFH) "WFH" else "WFO"
            val isClockOut = action == ACTION_CLOCK_OUT

            Thread {
                performAttendanceAction(context, mode, isClockOut)
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

    private fun performAttendanceAction(context: Context, workMode: String, isClockOut: Boolean) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val token = prefs.getString("auth_token", "") ?: ""
        val baseUrl = prefs.getString("api_base_url", "http://localhost:4000/api/v1") ?: "http://localhost:4000/api/v1"

        val endpoint = if (isClockOut) "$baseUrl/attendance/check-out" else "$baseUrl/attendance/check-in"

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
                put("workMode", workMode)
                put("latitude", prefs.getFloat("last_lat", 12.9716f).toDouble())
                put("longitude", prefs.getFloat("last_lng", 77.5946f).toDouble())
            }

            val writer = OutputStreamWriter(conn.outputStream)
            writer.write(jsonBody.toString())
            writer.flush()
            writer.close()

            val responseCode = conn.responseCode
            if (responseCode in 200..299) {
                val newStatus = if (isClockOut) "CLOCKED_OUT" else "CLOCKED_IN"
                prefs.edit().apply {
                    putString("attendance_status", newStatus)
                    putString("active_work_mode", workMode)
                    putLong("last_clock_time", System.currentTimeMillis())
                    apply()
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
            // Local optimistic update
            val newStatus = if (isClockOut) "CLOCKED_OUT" else "CLOCKED_IN"
            prefs.edit().apply {
                putString("attendance_status", newStatus)
                putString("active_work_mode", workMode)
                putLong("last_clock_time", System.currentTimeMillis())
                apply()
            }
        }

        refreshAllWidgets(context)
    }

    companion object {
        const val ACTION_CLOCK_IN_WFO = "com.workforceos.mobile.ACTION_CLOCK_IN_WFO"
        const val ACTION_CLOCK_IN_WFH = "com.workforceos.mobile.ACTION_CLOCK_IN_WFH"
        const val ACTION_CLOCK_OUT = "com.workforceos.mobile.ACTION_CLOCK_OUT"
        const val PREFS_NAME = "WorkforceOSWidgetPrefs"

        fun refreshAllWidgets(context: Context) {
            val mgr = AppWidgetManager.getInstance(context)

            val standardIds = mgr.getAppWidgetIds(ComponentName(context, AttendanceWidgetProvider::class.java))
            for (id in standardIds) {
                updateAppWidget(context, mgr, id, R.layout.widget_standard_layout)
            }

            val compactIds = mgr.getAppWidgetIds(ComponentName(context, AttendanceWidgetCompactProvider::class.java))
            for (id in compactIds) {
                updateAppWidget(context, mgr, id, R.layout.widget_compact_layout)
            }

            val dashboardIds = mgr.getAppWidgetIds(ComponentName(context, AttendanceWidgetDashboardProvider::class.java))
            for (id in dashboardIds) {
                updateAppWidget(context, mgr, id, R.layout.widget_dashboard_layout)
            }
        }

        fun updateAppWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int,
            layoutResId: Int
        ) {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val isLoggedIn = prefs.getBoolean("is_logged_in", false)
            val token = prefs.getString("auth_token", "") ?: ""

            // Handle Unauthenticated / Logged Out Graceful State
            if (!isLoggedIn || token.isEmpty()) {
                val loggedOutViews = RemoteViews(context.packageName, R.layout.widget_logged_out_layout)
                val openAppIntent = Intent(context, MainActivity::class.java).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                }
                val pendingOpen = PendingIntent.getActivity(
                    context,
                    0,
                    openAppIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )
                loggedOutViews.setOnClickPendingIntent(R.id.widget_login_button, pendingOpen)
                loggedOutViews.setOnClickPendingIntent(R.id.widget_logged_out_root, pendingOpen)
                appWidgetManager.updateAppWidget(appWidgetId, loggedOutViews)
                return
            }

            // Authenticated Widget View State
            val status = prefs.getString("attendance_status", "CLOCKED_OUT") ?: "CLOCKED_OUT"
            val workMode = prefs.getString("active_work_mode", "WFO") ?: "WFO"
            val userName = prefs.getString("user_name", "Staff Member") ?: "Staff Member"
            val lastTime = prefs.getLong("last_clock_time", 0L)

            val views = RemoteViews(context.packageName, layoutResId)
            views.setTextViewText(R.id.widget_user_name, userName)

            val isClockedIn = status == "CLOCKED_IN"

            // Mode Selector Pill Highlights (WFO / WFH)
            if (layoutResId == R.layout.widget_standard_layout || layoutResId == R.layout.widget_dashboard_layout) {
                if (workMode == "WFH") {
                    views.setInt(R.id.widget_btn_wfh, "setBackgroundResource", R.drawable.bg_pill_active)
                    views.setTextColor(R.id.widget_btn_wfh, 0xFFFFFFFF.toInt())

                    views.setInt(R.id.widget_btn_wfo, "setBackgroundResource", R.drawable.bg_pill_inactive)
                    views.setTextColor(R.id.widget_btn_wfo, 0xFF475569.toInt())
                } else {
                    views.setInt(R.id.widget_btn_wfo, "setBackgroundResource", R.drawable.bg_pill_active)
                    views.setTextColor(R.id.widget_btn_wfo, 0xFFFFFFFF.toInt())

                    views.setInt(R.id.widget_btn_wfh, "setBackgroundResource", R.drawable.bg_pill_inactive)
                    views.setTextColor(R.id.widget_btn_wfh, 0xFF475569.toInt())
                }

                // Pending intents for WFO / WFH Mode selection
                val wfoIntent = Intent(context, AttendanceWidgetProvider::class.java).apply {
                    action = ACTION_CLOCK_IN_WFO
                }
                views.setOnClickPendingIntent(
                    R.id.widget_btn_wfo,
                    PendingIntent.getBroadcast(context, 101, wfoIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
                )

                val wfhIntent = Intent(context, AttendanceWidgetProvider::class.java).apply {
                    action = ACTION_CLOCK_IN_WFH
                }
                views.setOnClickPendingIntent(
                    R.id.widget_btn_wfh,
                    PendingIntent.getBroadcast(context, 102, wfhIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
                )
            }

            // Action Button & Status Pill Update
            if (isClockedIn) {
                views.setTextViewText(R.id.widget_status_pill, "CLOCKED IN")
                views.setInt(R.id.widget_status_pill, "setBackgroundResource", R.drawable.bg_status_in)

                views.setTextViewText(R.id.widget_action_text, "CLOCK OUT")
                views.setInt(R.id.widget_action_button, "setBackgroundResource", R.drawable.bg_btn_clock_out)

                if (lastTime > 0) {
                    val diffMs = System.currentTimeMillis() - lastTime
                    val hours = diffMs / (1000 * 60 * 60)
                    val mins = (diffMs / (1000 * 60)) % 60
                    views.setTextViewText(R.id.widget_duration, String.format("%dh %02dm", hours, mins))
                } else {
                    views.setTextViewText(R.id.widget_duration, "Active")
                }

                // Clock out action pending intent
                val outIntent = Intent(context, AttendanceWidgetProvider::class.java).apply {
                    action = ACTION_CLOCK_OUT
                }
                views.setOnClickPendingIntent(
                    R.id.widget_action_button,
                    PendingIntent.getBroadcast(context, 103, outIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
                )
            } else {
                views.setTextViewText(R.id.widget_status_pill, "CLOCKED OUT")
                views.setInt(R.id.widget_status_pill, "setBackgroundResource", R.drawable.bg_status_out)

                views.setTextViewText(R.id.widget_action_text, "CLOCK IN ($workMode)")
                views.setInt(R.id.widget_action_button, "setBackgroundResource", R.drawable.bg_btn_clock_in)
                views.setTextViewText(R.id.widget_duration, "-- : --")

                // Clock in action pending intent (uses selected workMode)
                val inAction = if (workMode == "WFH") ACTION_CLOCK_IN_WFH else ACTION_CLOCK_IN_WFO
                val inIntent = Intent(context, AttendanceWidgetProvider::class.java).apply {
                    action = inAction
                }
                views.setOnClickPendingIntent(
                    R.id.widget_action_button,
                    PendingIntent.getBroadcast(context, 104, inIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
                )
            }

            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
    }
}

// Compact Bar Widget Provider
class AttendanceWidgetCompactProvider : AttendanceWidgetProvider() {
    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId, R.layout.widget_compact_layout)
        }
    }
}

// Full Dashboard Widget Provider
class AttendanceWidgetDashboardProvider : AttendanceWidgetProvider() {
    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId, R.layout.widget_dashboard_layout)
        }
    }
}
