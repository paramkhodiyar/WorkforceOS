package com.workforceos.mobile

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
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
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

        when (action) {
            ACTION_SELECT_MODE_WFO -> {
                triggerHapticFeedback(context, 35)
                prefs.edit().putString("active_work_mode", "WFO").apply()
                refreshAllWidgets(context)
            }
            ACTION_SELECT_MODE_WFH -> {
                triggerHapticFeedback(context, 35)
                prefs.edit().putString("active_work_mode", "WFH").apply()
                refreshAllWidgets(context)
            }
            ACTION_CLOCK_IN_WFO, ACTION_CLOCK_IN_WFH, ACTION_CLOCK_OUT -> {
                // Debounce guard: 1.5 second rate limit
                val now = System.currentTimeMillis()
                if (now - lastActionTime < 1500) return
                lastActionTime = now

                triggerHapticFeedback(context, 60)

                val workMode = if (action == ACTION_CLOCK_IN_WFH) "WFH" 
                              else if (action == ACTION_CLOCK_IN_WFO) "WFO" 
                              else prefs.getString("active_work_mode", "WFO") ?: "WFO"
                
                val isClockOut = action == ACTION_CLOCK_OUT

                // Show immediate processing state across all widgets
                showProcessingState(context)

                // Perform network call on background thread
                Thread {
                    performAttendanceAction(context, workMode, isClockOut)
                }.start()
            }
        }
    }

    // ─── Processing State ──────────────────────────────────────────────────────

    private fun showProcessingState(context: Context) {
        try {
            val mgr = AppWidgetManager.getInstance(context)

            val standardIds = mgr.getAppWidgetIds(ComponentName(context, AttendanceWidgetProvider::class.java))
            for (id in standardIds) {
                val views = RemoteViews(context.packageName, R.layout.widget_standard_layout)
                views.setTextViewText(R.id.widget_action_text, "PROCESSING…")
                views.setInt(R.id.widget_action_button, "setBackgroundResource", R.drawable.bg_pill_inactive)
                mgr.updateAppWidget(id, views)
            }

            val compactIds = mgr.getAppWidgetIds(ComponentName(context, AttendanceWidgetCompactProvider::class.java))
            for (id in compactIds) {
                val views = RemoteViews(context.packageName, R.layout.widget_compact_layout)
                views.setTextViewText(R.id.widget_action_text, "LOADING…")
                views.setInt(R.id.widget_action_button, "setBackgroundResource", R.drawable.bg_pill_inactive)
                mgr.updateAppWidget(id, views)
            }

            val dashboardIds = mgr.getAppWidgetIds(ComponentName(context, AttendanceWidgetDashboardProvider::class.java))
            for (id in dashboardIds) {
                val views = RemoteViews(context.packageName, R.layout.widget_dashboard_layout)
                views.setTextViewText(R.id.widget_action_text, "PROCESSING…")
                views.setInt(R.id.widget_action_button, "setBackgroundResource", R.drawable.bg_pill_inactive)
                mgr.updateAppWidget(id, views)
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    // ─── Haptic Feedback ───────────────────────────────────────────────────────

    private fun triggerHapticFeedback(context: Context, durationMs: Long = 50) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val vm = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
                val vibrator = vm?.defaultVibrator
                vibrator?.vibrate(VibrationEffect.createOneShot(durationMs, VibrationEffect.DEFAULT_AMPLITUDE))
            } else {
                @Suppress("DEPRECATION")
                val vibrator = context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
                if (vibrator != null && vibrator.hasVibrator()) {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        vibrator.vibrate(VibrationEffect.createOneShot(durationMs, VibrationEffect.DEFAULT_AMPLITUDE))
                    } else {
                        @Suppress("DEPRECATION")
                        vibrator.vibrate(durationMs)
                    }
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    // ─── Network Call ──────────────────────────────────────────────────────────

    private fun performAttendanceAction(context: Context, workMode: String, isClockOut: Boolean) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val token = prefs.getString("auth_token", "") ?: ""
        var rawBaseUrl = prefs.getString("api_base_url", "https://workforceos-backend.onrender.com/api/v1")
            ?: "https://workforceos-backend.onrender.com/api/v1"

        // Sanitize and format URL endpoint cleanly
        if (rawBaseUrl.endsWith("/")) {
            rawBaseUrl = rawBaseUrl.substring(0, rawBaseUrl.length - 1)
        }
        val baseUrl = if (rawBaseUrl.endsWith("/api/v1")) rawBaseUrl
                      else if (rawBaseUrl.endsWith("/api")) "$rawBaseUrl/v1"
                      else "$rawBaseUrl/api/v1"

        val endpoint = if (isClockOut) "$baseUrl/attendance/check-out" else "$baseUrl/attendance/check-in"
        var success = false

        try {
            val url = URL(endpoint)
            val conn = url.openConnection() as HttpURLConnection
            conn.requestMethod = "POST"
            conn.setRequestProperty("Content-Type", "application/json")
            conn.setRequestProperty("Accept", "application/json")
            if (token.isNotEmpty()) {
                conn.setRequestProperty("Authorization", "Bearer $token")
            }
            conn.connectTimeout = 15000
            conn.readTimeout = 15000
            conn.doOutput = true

            if (!isClockOut) {
                val jsonBody = JSONObject().apply {
                    put("workMode", workMode)
                    put("gpsLat", prefs.getFloat("last_lat", 12.9716f).toDouble())
                    put("gpsLng", prefs.getFloat("last_lng", 77.5946f).toDouble())
                }
                val writer = OutputStreamWriter(conn.outputStream)
                writer.write(jsonBody.toString())
                writer.flush()
                writer.close()
            } else {
                conn.outputStream.close()
            }

            val responseCode = conn.responseCode
            success = responseCode in 200..299
        } catch (e: Exception) {
            e.printStackTrace()
            // Local optimistic state update on network failure so user isn't stuck
            success = true
        }

        if (success) {
            val newStatus = if (isClockOut) "CLOCKED_OUT" else "CLOCKED_IN"
            prefs.edit().apply {
                putString("attendance_status", newStatus)
                putString("active_work_mode", workMode)
                putLong("last_clock_time", System.currentTimeMillis())
                apply()
            }
            triggerHapticFeedback(context, 70)
        }

        refreshAllWidgets(context)
    }

    companion object {
        const val ACTION_SELECT_MODE_WFO = "com.workforceos.mobile.ACTION_SELECT_MODE_WFO"
        const val ACTION_SELECT_MODE_WFH = "com.workforceos.mobile.ACTION_SELECT_MODE_WFH"
        const val ACTION_CLOCK_IN_WFO = "com.workforceos.mobile.ACTION_CLOCK_IN_WFO"
        const val ACTION_CLOCK_IN_WFH = "com.workforceos.mobile.ACTION_CLOCK_IN_WFH"
        const val ACTION_CLOCK_OUT = "com.workforceos.mobile.ACTION_CLOCK_OUT"
        const val PREFS_NAME = "WorkforceOSWidgetPrefs"

        private var lastActionTime = 0L

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

            // Open app intent if not authenticated
            if (!isLoggedIn || token.isEmpty()) {
                val loggedOutViews = RemoteViews(context.packageName, R.layout.widget_logged_out_layout)
                val openAppIntent = Intent(context, MainActivity::class.java).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                }
                val pendingOpen = PendingIntent.getActivity(
                    context, 0, openAppIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )
                loggedOutViews.setOnClickPendingIntent(R.id.widget_login_button, pendingOpen)
                loggedOutViews.setOnClickPendingIntent(R.id.widget_logged_out_root, pendingOpen)
                appWidgetManager.updateAppWidget(appWidgetId, loggedOutViews)
                return
            }

            val status = prefs.getString("attendance_status", "CLOCKED_OUT") ?: "CLOCKED_OUT"
            val workMode = prefs.getString("active_work_mode", "WFO") ?: "WFO"
            val userName = prefs.getString("user_name", "Staff Member") ?: "Staff Member"
            val lastTime = prefs.getLong("last_clock_time", 0L)

            val views = RemoteViews(context.packageName, layoutResId)

            // User name
            views.setTextViewText(R.id.widget_user_name, userName)

            val isClockedIn = status == "CLOCKED_IN"

            // ── Mode Selector (standard & dashboard only) ──────────────────
            val hasModePills = layoutResId == R.layout.widget_standard_layout ||
                    layoutResId == R.layout.widget_dashboard_layout

            if (hasModePills) {
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

                // WFO mode selection pending intent
                val wfoIntent = Intent(context, AttendanceWidgetProvider::class.java).apply {
                    action = ACTION_SELECT_MODE_WFO
                }
                views.setOnClickPendingIntent(
                    R.id.widget_btn_wfo,
                    PendingIntent.getBroadcast(context, 101, wfoIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
                )

                // WFH mode selection pending intent
                val wfhIntent = Intent(context, AttendanceWidgetProvider::class.java).apply {
                    action = ACTION_SELECT_MODE_WFH
                }
                views.setOnClickPendingIntent(
                    R.id.widget_btn_wfh,
                    PendingIntent.getBroadcast(context, 102, wfhIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
                )
            }

            // ── Status Pill ────────────────────────────────────────────────
            if (isClockedIn) {
                views.setTextViewText(R.id.widget_status_pill, "✓ CLOCKED IN")
                views.setInt(R.id.widget_status_pill, "setBackgroundResource", R.drawable.bg_status_in)
                views.setTextColor(R.id.widget_status_pill, 0xFF047857.toInt())
            } else {
                views.setTextViewText(R.id.widget_status_pill, "CLOCKED OUT")
                views.setInt(R.id.widget_status_pill, "setBackgroundResource", R.drawable.bg_status_out)
                views.setTextColor(R.id.widget_status_pill, 0xFF475569.toInt())
            }

            // ── Duration (standard & dashboard only) ───────────────────────
            if (layoutResId != R.layout.widget_compact_layout) {
                if (isClockedIn && lastTime > 0) {
                    val diffMs = System.currentTimeMillis() - lastTime
                    val hours = diffMs / (1000 * 60 * 60)
                    val mins = (diffMs / (1000 * 60)) % 60
                    views.setTextViewText(R.id.widget_duration, String.format("%dh %02dm", hours, mins))
                } else {
                    views.setTextViewText(R.id.widget_duration, if (isClockedIn) "Active" else "--:--")
                }
            }

            // ── Action Button ──────────────────────────────────────────────
            if (isClockedIn) {
                views.setTextViewText(R.id.widget_action_text, "CLOCK OUT")
                views.setInt(R.id.widget_action_button, "setBackgroundResource", R.drawable.bg_btn_clock_out)

                val outIntent = Intent(context, AttendanceWidgetProvider::class.java).apply {
                    action = ACTION_CLOCK_OUT
                }
                views.setOnClickPendingIntent(
                    R.id.widget_action_button,
                    PendingIntent.getBroadcast(context, 103, outIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
                )
            } else {
                val modeLabel = if (layoutResId == R.layout.widget_compact_layout) {
                    if (workMode == "WFH") "CLOCK IN (WFH)" else "CLOCK IN (WFO)"
                } else {
                    if (workMode == "WFH") "QUICK CLOCK IN (WFH)" else "QUICK CLOCK IN (WFO)"
                }
                views.setTextViewText(R.id.widget_action_text, modeLabel)
                views.setInt(R.id.widget_action_button, "setBackgroundResource", R.drawable.bg_btn_clock_in)

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

// ─── Sub-providers ─────────────────────────────────────────────────────────────

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
