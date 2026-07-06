import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:webview_flutter_android/webview_flutter_android.dart';

class WebViewScreen extends StatefulWidget {
  const WebViewScreen({super.key});

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
    _requestRequiredPermissions();
    _initWebViewController();
  }

  Future<void> _requestRequiredPermissions() async {
    // Request location and camera permissions to ensure the webapp works seamlessly
    Map<Permission, PermissionStatus> statuses = await [
      Permission.locationWhenInUse,
      Permission.camera,
    ].request();

    // If permissions are denied, show a dialog or alert but still load the webview
    bool locationDenied = statuses[Permission.locationWhenInUse]?.isDenied ?? false;
    bool cameraDenied = statuses[Permission.camera]?.isDenied ?? false;

    if (locationDenied || cameraDenied) {
      // Permission denied, but we will still proceed.
      // The native OS will prompt again if the webapp requests it and we support it.
      debugPrint("Warning: Some permissions were denied. Location Denied: $locationDenied, Camera Denied: $cameraDenied");
    }
  }

  void _initWebViewController() {
    final WebViewController controller = WebViewController();

    controller
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(Colors.white)
      ..setNavigationDelegate(
        NavigationDelegate(
          onProgress: (int progress) {
            if (mounted) {
              setState(() {
                _loadingProgress = progress / 100.0;
              });
            }
          },
          onPageStarted: (String url) {
            if (mounted) {
              setState(() {
                _isLoading = true;
              });
            }
          },
          onPageFinished: (String url) {
            if (mounted) {
              setState(() {
                _isLoading = false;
              });
            }
          },
          onWebResourceError: (WebResourceError error) {
            debugPrint("WebView Resource Error: ${error.description}");
          },
        ),
      )
      ..loadRequest(Uri.parse('https://workforceos1.vercel.app/login'));

    // Android-specific WebView configurations (File selector upload support)
    if (controller.platform is AndroidWebViewController) {
      AndroidWebViewController.enableDebugging(true);
      (controller.platform as AndroidWebViewController)
          .setMediaPlaybackRequiresUserGesture(false);

      // Handle Android permission requests (location, camera, etc.) from the website
      (controller.platform as AndroidWebViewController).setOnPlatformPermissionRequest(
        (PlatformWebViewPermissionRequest request) {
          debugPrint("WebView requesting permissions: ${request.types}");
          request.grant(); // Auto-grant since we requested them natively at startup
        },
      );
    }

    _controller = controller;
  }

  Future<bool> _onWillPop() async {
    if (await _controller.canGoBack()) {
      await _controller.goBack();
      return false; // Prevent closing the app
    }
    return true; // Close the app
  }

  @override
  Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: _onWillPop,
      child: Scaffold(
        backgroundColor: Colors.white,
        body: SafeArea(
          child: Stack(
            children: [
              // WebView component
              WebViewWidget(controller: _controller),

              // Horizontal progress bar when loading
              if (_isLoading)
                Positioned(
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  child: LinearProgressIndicator(
                    value: _loadingProgress,
                    backgroundColor: Colors.transparent,
                    valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF3B82F6)),
                  ),
                ),

              // Smooth full-screen loader on first boot
              if (_isLoading && _loadingProgress < 0.3)
                Container(
                  color: Colors.white,
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        // Small branding logo representation
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
                            color: Color(0xFF475569), // Slate 600
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
