import 'package:flutter/services.dart';

class AttendanceWidgetService {
  static const MethodChannel _channel = MethodChannel('com.workforceos.mobile/widget');

  /// Syncs live user token, attendance status, work mode, and coordinates to Android Home Screen Widgets
  static Future<void> updateWidgetData({
    required bool isLoggedIn,
    required String status,
    required String userName,
    required String token,
    required String apiBaseUrl,
    String workMode = 'WFO',
    int? lastClockTimeMs,
    double? lat,
    double? lng,
  }) async {
    try {
      await _channel.invokeMethod('updateWidgetData', {
        'is_logged_in': isLoggedIn,
        'attendance_status': status,
        'active_work_mode': workMode,
        'user_name': userName,
        'auth_token': token,
        'api_base_url': apiBaseUrl,
        'last_clock_time': lastClockTimeMs ?? DateTime.now().millisecondsSinceEpoch,
        'last_lat': lat ?? 12.9716,
        'last_lng': lng ?? 77.5946,
      });
    } on PlatformException catch (e) {
      print("Failed to sync attendance widget state: ${e.message}");
    }
  }

  /// Clears widget state gracefully on user logout
  static Future<void> clearWidgetData() async {
    try {
      await _channel.invokeMethod('clearWidgetData');
    } on PlatformException catch (e) {
      print("Failed to clear attendance widget state: ${e.message}");
    }
  }
}
