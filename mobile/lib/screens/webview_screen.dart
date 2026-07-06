import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:webview_flutter_android/webview_flutter_android.dart';
import 'package:shared_preferences/shared_preferences.dart';

class WebViewScreen extends StatefulWidget {
  /// If provided, this token is injected into localStorage so the user
  /// is automatically logged-in after a successful biometric unlock.
  final String? injectedToken;

  const WebViewScreen({super.key, this.injectedToken});

  @override
  State<WebViewScreen> createState() => _WebViewScreenState();
}

class _WebViewScreenState extends State<WebViewScreen> {
  late final WebViewController _controller;
  bool _isLoading = true;
  double _loadingProgress = 0.0;

  @override
  void initState() {
    super.initState();
    _ensurePermissions();
    _initWebViewController();
  }

  // ── Permissions ──────────────────────────────────────────────────────────

  Future<void> _ensurePermissions() async {
    final locationStatus = await Permission.locationWhenInUse.status;
    final cameraStatus = await Permission.camera.status;

    // Request only what isn't granted yet (avoid bothering the user twice)
    if (!locationStatus.isGranted) {
      final result = await Permission.locationWhenInUse.request();
      if (result.isPermanentlyDenied && mounted) {
        _showPermissionSettingsDialog(
          'Location Permission Required',
          'WorkforceOS needs your location to record attendance check-ins. '
          'Please enable "Location" in App Settings.',
        );
        return;
      }
    }
    if (!cameraStatus.isGranted) {
      await Permission.camera.request();
    }
  }

  void _showPermissionSettingsDialog(String title, String message) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Not Now'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              openAppSettings();
            },
            child: const Text('Open Settings'),
          ),
        ],
      ),
    );
  }

  // ── WebView ───────────────────────────────────────────────────────────────

  void _initWebViewController() {
    final WebViewController controller = WebViewController();

    controller
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(Colors.white)
      // Bridge: web JS calls WorkforceOSBridge.postMessage(json)
      ..addJavaScriptChannel(
        'WorkforceOSBridge',
        onMessageReceived: (JavaScriptMessage message) async {
          try {
            final data = jsonDecode(message.message) as Map<String, dynamic>;
            final type = data['type'] as String?;
            final prefs = await SharedPreferences.getInstance();
            if (type == 'save_token') {
              final token = data['token'] as String?;
              if (token != null && token.isNotEmpty) {
                await prefs.setString('auth_token', token);
                debugPrint('WorkforceOSBridge: token saved');
              }
            } else if (type == 'clear_token') {
              await prefs.remove('auth_token');
              debugPrint('WorkforceOSBridge: token cleared');
            }
          } catch (e) {
            debugPrint('WorkforceOSBridge parse error: $e');
          }
        },
      )
      ..setNavigationDelegate(
        NavigationDelegate(
          onProgress: (int progress) {
            if (mounted) {
              setState(() => _loadingProgress = progress / 100.0);
            }
          },
          onPageStarted: (String url) {
            if (mounted) setState(() => _isLoading = true);
          },
          onPageFinished: (String url) async {
            if (mounted) setState(() => _isLoading = false);
            // After page loads, if we have an injected token AND the page is
            // the login page, push the token into localStorage and redirect.
            if (widget.injectedToken != null && url.contains('/login')) {
              final escaped = widget.injectedToken!
                  .replaceAll("'", "\\'")
                  .replaceAll('"', '\\"');
              await controller.runJavaScript(
                "window.localStorage.setItem('token', '$escaped');"
                "window.location.replace('/dashboard');",
              );
            }
          },
          onWebResourceError: (WebResourceError error) {
            debugPrint('WebView error: ${error.description}');
          },
        ),
      )
      ..loadRequest(Uri.parse('https://workforceos1.vercel.app/login'));

    // ── Android-specific setup ──────────────────────────────────────────────
    if (controller.platform is AndroidWebViewController) {
      AndroidWebViewController.enableDebugging(false);
      (controller.platform as AndroidWebViewController)
          .setMediaPlaybackRequiresUserGesture(false);

      // Auto-grant any permissions the website requests (location, camera)
      // because we already obtained native permission above.
      (controller.platform as AndroidWebViewController)
          .setOnPlatformPermissionRequest(
        (PlatformWebViewPermissionRequest request) {
          debugPrint('WebView requesting permissions: ${request.types}');
          request.grant();
        },
      );
    }

    _controller = controller;
  }

  // ── Back navigation ────────────────────────────────────────────────────────

  Future<bool> _onWillPop() async {
    if (await _controller.canGoBack()) {
      await _controller.goBack();
      return false; // handled — don't close app
    }

    // Nothing to go back to — ask the user
    final bool? shouldExit = await showDialog<bool>(
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
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: const Color(0xFFEFF6FF), // blue-50
                ),
                child: const Icon(Icons.exit_to_app_rounded,
                    color: Color(0xFF3B82F6), size: 28),
              ),
              const SizedBox(height: 16),
              const Text(
                'Exit WorkforceOS?',
                style: TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF0F172A),
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Are you sure you want to close the app?',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 13,
                  color: Color(0xFF64748B),
                  height: 1.4,
                ),
              ),
              const SizedBox(height: 24),
              Row(
                children: [
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
                ],
              ),
            ],
          ),
        ),
      ),
    );

    return shouldExit ?? false;
  }

  // ── UI ────────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: _onWillPop,
      child: Scaffold(
        backgroundColor: Colors.white,
        body: SafeArea(
          child: Stack(
            children: [
              WebViewWidget(controller: _controller),

              // Thin progress indicator across the top
              if (_isLoading)
                Positioned(
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  child: LinearProgressIndicator(
                    value: _loadingProgress,
                    backgroundColor: Colors.transparent,
                    valueColor: const AlwaysStoppedAnimation<Color>(
                        Color(0xFF3B82F6)),
                  ),
                ),

              // Full-screen branded loader on first boot
              if (_isLoading && _loadingProgress < 0.3)
                Container(
                  color: Colors.white,
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        ClipRRect(
                          borderRadius: BorderRadius.circular(20),
                          child: Image.asset(
                            'assets/logo.png',
                            width: 64,
                            height: 64,
                            fit: BoxFit.contain,
                          ),
                        ),
                        const SizedBox(height: 24),
                        const SizedBox(
                          width: 32,
                          height: 32,
                          child: CircularProgressIndicator(
                            color: Color(0xFF3B82F6),
                            strokeWidth: 3,
                          ),
                        ),
                        const SizedBox(height: 16),
                        const Text(
                          'Loading WorkforceOS...',
                          style: TextStyle(
                            color: Color(0xFF475569),
                            fontSize: 13,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
