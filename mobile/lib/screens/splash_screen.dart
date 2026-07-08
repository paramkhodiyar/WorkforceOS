import 'package:flutter/material.dart';
import 'package:local_auth/local_auth.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'webview_screen.dart';

/// SplashScreen — the ONLY entry point.
///
/// Decision tree:
///   1. Load SharedPreferences
///   2. If use_biometric=true AND auth_token exists:
///        → run LocalAuthentication.authenticate()
///        → SUCCESS: WebViewScreen(injectedToken: token) → lands on /dashboard
///        → FAILURE: WebViewScreen() → lands on /login (password required)
///   3. Otherwise:
///        → WebViewScreen() → /login
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _anim;
  late Animation<double> _fadeIn;
  late Animation<double> _scale;

  @override
  void initState() {
    super.initState();
    _anim = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 900));
    _fadeIn = CurvedAnimation(parent: _anim, curve: Curves.easeOut);
    _scale = Tween<double>(begin: 0.85, end: 1.0)
        .animate(CurvedAnimation(parent: _anim, curve: Curves.easeOut));
    _anim.forward();

    // Wait for logo to animate in, then decide where to go
    Future.delayed(const Duration(milliseconds: 1800), _decideNavigation);
  }

  @override
  void dispose() {
    _anim.dispose();
    super.dispose();
  }

  // ────────────────────────────────────────────────────────────────────────────

  Future<void> _decideNavigation() async {
    final prefs = await SharedPreferences.getInstance();

    final bool useBiometric = prefs.getBool('use_biometric') ?? false;
    final String? storedToken = prefs.getString('auth_token');
    final bool hasToken =
        storedToken != null && storedToken.trim().isNotEmpty;

    if (useBiometric && hasToken) {
      await _runBiometricThenNavigate(storedToken!, prefs);
    } else {
      _goToLogin();
    }
  }

  Future<void> _runBiometricThenNavigate(
      String token, SharedPreferences prefs) async {
    final auth = LocalAuthentication();

    // Check device capability first
    final bool capable =
        await auth.canCheckBiometrics || await auth.isDeviceSupported();
    if (!capable) {
      // Device can't do biometrics — fall back to password login
      _goToLogin();
      return;
    }

    try {
      final bool ok = await auth.authenticate(
        localizedReason: 'Scan your fingerprint to access WorkforceOS',
        options: const AuthenticationOptions(
          stickyAuth: true,
          biometricOnly: false, // allow device PIN as fallback
        ),
      );

      if (!mounted) return;

      if (ok) {
        // ✅ Biometric passed — inject token so WebView skips login
        _goToWebView(injectedToken: token);
      } else {
        // ❌ Biometric cancelled/failed — go to normal login
        _goToLogin();
      }
    } catch (e) {
      debugPrint('Biometric error: $e');
      _goToLogin();
    }
  }

  // ────────────────────────────────────────────────────────────────────────────

  void _goToLogin() {
    if (!mounted) return;
    Navigator.of(context).pushReplacement(
      PageRouteBuilder(
        pageBuilder: (_, __, ___) => const WebViewScreen(),
        transitionsBuilder: (_, animation, __, child) =>
            FadeTransition(opacity: animation, child: child),
        transitionDuration: const Duration(milliseconds: 500),
      ),
    );
  }

  void _goToWebView({String? injectedToken}) {
    if (!mounted) return;
    Navigator.of(context).pushReplacement(
      PageRouteBuilder(
        pageBuilder: (_, __, ___) =>
            WebViewScreen(injectedToken: injectedToken),
        transitionsBuilder: (_, animation, __, child) =>
            FadeTransition(opacity: animation, child: child),
        transitionDuration: const Duration(milliseconds: 500),
      ),
    );
  }

  // ────────────────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Center(
        child: FadeTransition(
          opacity: _fadeIn,
          child: ScaleTransition(
            scale: _scale,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 88,
                  height: 88,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(22),
                    color: Colors.white,
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF3B82F6).withOpacity(0.15),
                        blurRadius: 30,
                        spreadRadius: 4,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(22),
                    child: Image.asset(
                      'assets/logo.png',
                      fit: BoxFit.contain,
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                const Text(
                  'WorkforceOS',
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF0F172A),
                    letterSpacing: -0.3,
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Your workforce, unified.',
                  style: TextStyle(
                    fontSize: 13,
                    color: Color(0xFF94A3B8),
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
