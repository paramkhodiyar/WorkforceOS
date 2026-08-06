package com.workforceos.mobile

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
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

                call.argument<String>("attendance_status")?.let { editor.putString("attendance_status", it) }
                call.argument<String>("user_name")?.let { editor.putString("user_name", it) }
                call.argument<String>("auth_token")?.let { editor.putString("auth_token", it) }
                call.argument<String>("api_base_url")?.let { editor.putString("api_base_url", it) }
                call.argument<Number>("last_clock_time")?.let { editor.putLong("last_clock_time", it.toLong()) }
                call.argument<Number>("last_lat")?.let { editor.putFloat("last_lat", it.toFloat()) }
                call.argument<Number>("last_lng")?.let { editor.putFloat("last_lng", it.toFloat()) }
                editor.apply()

                // Refresh Android Home Screen Widget
                val appWidgetManager = AppWidgetManager.getInstance(applicationContext)
                val componentName = ComponentName(applicationContext, AttendanceWidgetProvider::class.java)
                val ids = appWidgetManager.getAppWidgetIds(componentName)
                for (id in ids) {
                    AttendanceWidgetProvider.updateAppWidget(applicationContext, appWidgetManager, id)
                }

                result.success(true)
            } else {
                result.notImplemented()
            }
        }
    }
}
