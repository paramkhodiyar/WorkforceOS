import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:webview_flutter_android/webview_flutter_android.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/attendance_widget_service.dart';

/// WebViewScreen — the main app shell.
///
/// [injectedToken]: When provided (after biometric unlock in SplashScreen),
///   this JWT is written into the web app's localStorage once the login page
///   finishes loading, immediately redirecting to /dashboard without a password.
/// [injectedRefreshToken]: The refresh token paired with the injectedToken.
///
/// Bridge messages from the web app (WorkforceOSBridge.postMessage):
///   { type: 'save_token',        token: '...', refreshToken: '...' }  → persist both tokens
///   { type: 'clear_token' }                                           → remove both tokens
///   { type: 'set_biometric_pref', enabled: bool }                     → save biometric toggle pref
///   { type: 'get_biometric_pref' }                                    → read pref and call back into JS
class WebViewScreen extends StatefulWidget {
  final String? injectedToken;
  final String? injectedRefreshToken;
  const WebViewScreen({super.key, this.injectedToken, this.injectedRefreshToken});

  @override
  State<WebViewScreen> createState() => _WebViewScreenState();
}

class _WebViewScreenState extends State<WebViewScreen> {
  late final WebViewController _controller;
  bool _isLoading = true;
  double _loadingProgress = 0.0;

  static const String _appUrl = 'https://workforceos1.vercel.app/login';

  @override
  void initState() {
    super.initState();
    _initController();
    _syncWidgetOnLaunch();
    _ensureLocationThenLoad();
  }

  Future<void> _syncWidgetOnLaunch() async {
    final prefs = await SharedPreferences.getInstance();
    final token = widget.injectedToken ?? prefs.getString('auth_token');
    final userName = prefs.getString('user_name') ?? 'Param Owner';
    if (token != null && token.isNotEmpty) {
      await AttendanceWidgetService.updateWidgetData(
        isLoggedIn: true,
        status: 'CLOCKED_OUT',
        userName: userName,
        token: token,
        apiBaseUrl: 'https://workforceos-backend.onrender.com/api/v1',
      );
    }
  }

  // ── Permission ────────────────────────────────────────────────────────────

  Future<void> _ensureLocationThenLoad() async {
    final status = await Permission.locationWhenInUse.status;

    if (status.isGranted) {
      _loadUrl();
      return;
    }

    if (status.isPermanentlyDenied) {
      if (mounted) _showLocationSettingsDialog();
      _loadUrl(); // load anyway, just without GPS
      return;
    }

    // First-time request
    final result = await Permission.locationWhenInUse.request();
    if (result.isPermanentlyDenied && mounted) {
      _showLocationSettingsDialog();
    }
    _loadUrl(); // always load, GPS optional
  }

  void _loadUrl() {
    _controller.loadRequest(Uri.parse(_appUrl));
  }

  void _showLocationSettingsDialog() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape:
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Location Permission',
            style:
                TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        content: const Text(
          'WorkforceOS uses GPS to verify attendance check-ins.\n\n'
          'Without it, clock-in still works but without location verification.\n\n'
          'To enable: App Settings → Permissions → Location.',
          style: TextStyle(fontSize: 13, height: 1.5),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Continue without GPS'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              openAppSettings();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF3B82F6),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10)),
            ),
            child: const Text('Open Settings'),
          ),
        ],
      ),
    );
  }

  // ── WebView Controller ────────────────────────────────────────────────────

  void _initController() {
    final controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(Colors.white)
      ..addJavaScriptChannel(
        'WorkforceOSBridge',
        onMessageReceived: _onBridgeMessage,
      )
      ..setNavigationDelegate(NavigationDelegate(
        onProgress: (progress) {
          if (mounted) {
            setState(() => _loadingProgress = progress / 100.0);
          }
        },
        onPageStarted: (_) {
          if (mounted) setState(() => _isLoading = true);
        },
        onPageFinished: (url) async {
          if (mounted) setState(() => _isLoading = false);
          // If we arrived here with an injectedToken and the login page loaded,
          // silently put the token in localStorage and redirect to dashboard.
          if (widget.injectedToken != null && url.contains('/login')) {
            final escapedToken = widget.injectedToken!
                .replaceAll("'", "\\'").replaceAll('"', '\\"');
            final escapedRefresh = (widget.injectedRefreshToken ?? '')
                .replaceAll("'", "\\'").replaceAll('"', '\\"');
            await _controller.runJavaScript(
              "window.localStorage.setItem('token','$escapedToken');"
              "window.localStorage.setItem('refreshToken','$escapedRefresh');"
              "window.location.replace('/dashboard');",
            );
          }
        },
        onWebResourceError: (e) =>
            debugPrint('WebView error: ${e.description}'),
      ));

    // Android: auto-grant geolocation/camera once native permission is held
    if (controller.platform is AndroidWebViewController) {
      AndroidWebViewController.enableDebugging(false);
      final androidController = controller.platform as AndroidWebViewController;
      
      androidController
        ..setMediaPlaybackRequiresUserGesture(false)
        ..setOnPlatformPermissionRequest(
          (PlatformWebViewPermissionRequest req) {
            debugPrint('WebView permission request: ${req.types}');
            req.grant();
          },
        )
        ..setGeolocationPermissionsPromptCallbacks(
          onShowPrompt: (request) async {
            debugPrint('WebView geolocation request origin: ${request.origin}');
            final status = await Permission.locationWhenInUse.request();
            return GeolocationPermissionsResponse(
              allow: status.isGranted,
              retain: true,
            );
          },
        );
    }

    _controller = controller;
    // NOTE: URL is NOT loaded here — _ensureLocationThenLoad() calls _loadUrl()
  }

  // ── Bridge message handler ────────────────────────────────────────────────

  Future<void> _onBridgeMessage(JavaScriptMessage message) async {
    try {
      final data = jsonDecode(message.message) as Map<String, dynamic>;
      final type = data['type'] as String?;
      final prefs = await SharedPreferences.getInstance();

      switch (type) {
        case 'save_token':
          final token = data['token'] as String?;
          final refreshToken = data['refreshToken'] as String?;
          final userName = data['userName'] as String? ?? 'Staff Member';
          if (token != null && token.isNotEmpty) {
            await prefs.setString('auth_token', token);
            if (refreshToken != null && refreshToken.isNotEmpty) {
              await prefs.setString('refresh_token', refreshToken);
            }
            await prefs.setString('user_name', userName);
            await AttendanceWidgetService.updateWidgetData(
              isLoggedIn: true,
              status: 'CLOCKED_OUT',
              userName: userName,
              token: token,
              apiBaseUrl: 'https://workforceos-backend.onrender.com/api/v1',
            );
            debugPrint('Bridge: access token saved & Android widget state synced for $userName');
          }

        case 'clear_token':
          await prefs.remove('auth_token');
          await prefs.remove('refresh_token');
          await prefs.remove('user_name');
          await AttendanceWidgetService.clearWidgetData();
          debugPrint('Bridge: tokens cleared & Android widget reset');

        // Haptic feedback trigger from web app clock-in/out button press
        case 'haptic_feedback':
          final style = data['style'] as String? ?? 'medium';
          switch (style) {
            case 'light':
              await HapticFeedback.lightImpact();
            case 'heavy':
              await HapticFeedback.heavyImpact();
            case 'selection':
              await HapticFeedback.selectionClick();
            default:
              await HapticFeedback.mediumImpact();
          }
          debugPrint('Bridge: haptic feedback → $style');

        // Attendance action completed — sync widget state
        case 'attendance_action':
          final newStatus = data['status'] as String? ?? 'CLOCKED_OUT';
          final workMode = data['workMode'] as String? ?? 'WFO';
          final savedToken = prefs.getString('auth_token') ?? '';
          final savedUserName = prefs.getString('user_name') ?? 'Staff Member';
          if (savedToken.isNotEmpty) {
            await AttendanceWidgetService.updateWidgetData(
              isLoggedIn: true,
              status: newStatus,
              userName: savedUserName,
              token: savedToken,
              workMode: workMode,
              apiBaseUrl: 'https://workforceos-backend.onrender.com/api/v1',
              lastClockTimeMs: DateTime.now().millisecondsSinceEpoch,
            );
          }
          // Success haptic
          await HapticFeedback.heavyImpact();
          debugPrint('Bridge: attendance_action → status=$newStatus mode=$workMode');

        case 'set_biometric_pref':
          final enabled = data['enabled'] as bool? ?? false;
          await prefs.setBool('use_biometric', enabled);
          debugPrint('Bridge: biometric pref → $enabled');

        case 'get_biometric_pref':
          final bioPref = prefs.getBool('use_biometric') ?? false;
          await _controller.runJavaScript(
            'if(window.__workforceBiometricPref) window.__workforceBiometricPref($bioPref);'
          );
          debugPrint('Bridge: returned biometric pref → $bioPref');

        default:
          debugPrint('Bridge: unknown message type "$type"');
      }
    } catch (e) {
      debugPrint('Bridge parse error: $e  |  raw=${message.message}');
    }
  }

  // ── Back button → WebView history → exit dialog ───────────────────────────

  Future<void> _handlePop(bool didPop) async {
    if (didPop) return;

    final String? currentUrl = await _controller.currentUrl();
    
    // Check if we are on dashboard or login or root pages where pressing back should exit the app
    final bool isRootOrDashboard = currentUrl == null || 
        currentUrl.isEmpty || 
        currentUrl.endsWith('/dashboard') || 
        currentUrl.endsWith('/dashboard/') ||
        currentUrl.endsWith('/login') ||
        currentUrl.endsWith('/login/') ||
        currentUrl == 'https://workforceos1.vercel.app/'; // Root URL fallback

    if (!isRootOrDashboard && await _controller.canGoBack()) {
      await _controller.goBack();
      return;
    }

    if (!mounted) return;

    final bool? exit = await showDialog<bool>(
      context: context,
      barrierColor: Colors.black.withOpacity(0.4),
      builder: (ctx) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        backgroundColor: Colors.white,
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(14),
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  color: Color(0xFFEFF6FF),
                ),
                child: const Icon(Icons.exit_to_app_rounded,
                    color: Color(0xFF3B82F6), size: 28),
              ),
              const SizedBox(height: 16),
              const Text('Exit WorkforceOS?',
                  style: TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF0F172A),
                  )),
              const SizedBox(height: 8),
              const Text(
                'Are you sure you want to close the app?',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 13, color: Color(0xFF64748B)),
              ),
              const SizedBox(height: 24),
              Row(children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.of(ctx).pop(false),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: const Color(0xFF475569),
                      side: const BorderSide(color: Color(0xFFCBD5E1)),
                      padding: const EdgeInsets.symmetric(vertical: 13),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
                    ),
                    child: const Text('Stay',
                        style: TextStyle(fontWeight: FontWeight.w600)),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () => Navigator.of(ctx).pop(true),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF3B82F6),
                      foregroundColor: Colors.white,
                      elevation: 0,
                      padding: const EdgeInsets.symmetric(vertical: 13),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
                    ),
                    child: const Text('Exit',
                        style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ),
              ]),
            ],
          ),
        ),
      ),
    );

    if (exit == true) {
      await SystemNavigator.pop();
    }
  }

  // ── UI ────────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) => _handlePop(didPop),
      child: Scaffold(
        backgroundColor: Colors.white,
        body: Stack(
          children: [
            SafeArea(child: WebViewWidget(controller: _controller)),
            if (_isLoading)
              Positioned(
                top: 0,
                left: 0,
                right: 0,
                child: LinearProgressIndicator(
                  value: _loadingProgress > 0 ? _loadingProgress : null,
                  backgroundColor: Colors.transparent,
                  color: const Color(0xFF3B82F6),
                  minHeight: 3,
                ),
              ),
          ],
        ),
      ),
    );
  }
}
