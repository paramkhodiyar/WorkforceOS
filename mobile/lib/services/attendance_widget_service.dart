import 'package:flutter/services.dart';

class AttendanceWidgetService {
  static const MethodChannel _channel = MethodChannel('com.workforceos.mobile/widget');

  /// Syncs live user token, attendance status, and coordinates to Android Home Screen Widget
  static Future<void> updateWidgetData({
    required String status,
    required String userName,
    required String token,
    required String apiBaseUrl,
    int? lastClockTimeMs,
    double? lat,
    double? lng,
  }) async {
    try {
      await _channel.invokeMethod('updateWidgetData', {
        'attendance_status': status,
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
}
