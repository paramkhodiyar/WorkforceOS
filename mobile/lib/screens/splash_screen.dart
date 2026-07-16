import 'package:flutter/material.dart';
import 'package:local_auth/local_auth.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'webview_screen.dart';

// ─────────────────────────────────────────────────────────────────────────────
//  WorkforceOS Splash Screen
//
//  Animation mirrors the web splash exactly:
//
//   Phase 0  Pieces rendered at scattered isometric positions (instant)
//   Phase 1  Pieces fly together along isometric axes            ~650ms
//   Phase 2  Cube "lands" — squish scaleY 0.86 → spring rebound  ~90+380ms
//   Phase 3  Shadow ellipse pulses in then fades                  ~400ms
//   Phase 4  App name drops from above — heavy fall + bounce      ~520ms
//   Phase 5  Hold                                                 ~2600ms
//   Phase 6  Everything fades out                                 ~700ms
//
//  After the fade-out the existing _decideNavigation() logic runs
//  (biometric / token check → WebViewScreen).
// ─────────────────────────────────────────────────────────────────────────────

/// Isometric cube logo drawn with Flutter's CustomPainter.
/// Exactly matches the pixel-traced polygon coordinates from the web version
/// (viewBox 0 0 572 650), scaled to fit whatever size the widget is given.
class _CubePainter extends CustomPainter {
  final double topOpacity;
  final double stripOpacity;
  final double leftOpacity;
  final double rightOpacity;
  final Offset topOffset;
  final Offset stripOffset;
  final Offset leftOffset;
  final Offset rightOffset;

  const _CubePainter({
    this.topOpacity = 1,
    this.stripOpacity = 1,
    this.leftOpacity = 1,
    this.rightOpacity = 1,
    this.topOffset = Offset.zero,
    this.stripOffset = Offset.zero,
    this.leftOffset = Offset.zero,
    this.rightOffset = Offset.zero,
  });

  // Raw polygon points in SVG-space (viewBox 0 0 572 650)
  static const List<Offset> _topPts = [
    Offset(34, 166), Offset(26, 158), Offset(284, 12), Offset(543, 157),
    Offset(545, 162), Offset(460, 211), Offset(344, 146), Offset(333, 163),
    Offset(335, 167), Offset(436, 225), Offset(287, 312), Offset(135, 224),
    Offset(237, 166), Offset(227, 146), Offset(112, 210),
  ];

  static const List<Offset> _stripPts = [
    Offset(472, 335), Offset(471, 230), Offset(555, 181),
    Offset(559, 181), Offset(558, 285),
  ];

  static const List<Offset> _leftPts = [
    Offset(274, 639), Offset(12, 485), Offset(12, 181), Offset(21, 183),
    Offset(101, 229), Offset(102, 362), Offset(123, 356), Offset(123, 243),
    Offset(276, 332), Offset(275, 507), Offset(180, 453), Offset(162, 466),
    Offset(275, 533),
  ];

  static const List<Offset> _rightPts = [
    Offset(298, 638), Offset(297, 534), Offset(410, 466), Offset(396, 452),
    Offset(391, 453), Offset(297, 507), Offset(297, 331), Offset(449, 244),
    Offset(449, 358), Offset(470, 363), Offset(559, 312), Offset(560, 485),
  ];

  static const double _svgW = 572;
  static const double _svgH = 650;

  Path _scaledPath(List<Offset> pts, double sx, double sy, Offset offset) {
    final path = Path();
    final first = pts.first;
    path.moveTo(first.dx * sx + offset.dx, first.dy * sy + offset.dy);
    for (int i = 1; i < pts.length; i++) {
      path.lineTo(pts[i].dx * sx + offset.dx, pts[i].dy * sy + offset.dy);
    }
    path.close();
    return path;
  }

  @override
  void paint(Canvas canvas, Size size) {
    final sx = size.width / _svgW;
    final sy = size.height / _svgH;

    void drawPiece(List<Offset> pts, Color color, double opacity, Offset offset) {
      if (opacity <= 0) return;
      final paint = Paint()
        ..color = color.withOpacity(opacity)
        ..style = PaintingStyle.fill;
      canvas.drawPath(_scaledPath(pts, sx, sy, offset), paint);
    }

    // Back → front paint order
    drawPiece(_topPts,   const Color(0xFF028b61), topOpacity,   topOffset * (sx < sy ? sx : sy));
    drawPiece(_stripPts, const Color(0xFF028b61), stripOpacity, stripOffset * (sx < sy ? sx : sy));
    drawPiece(_leftPts,  const Color(0xFF59cb8f), leftOpacity,  leftOffset * (sx < sy ? sx : sy));
    drawPiece(_rightPts, const Color(0xFFfd8902), rightOpacity, rightOffset * (sx < sy ? sx : sy));
  }

  @override
  bool shouldRepaint(_CubePainter old) =>
      old.topOpacity != topOpacity ||
      old.stripOpacity != stripOpacity ||
      old.leftOpacity != leftOpacity ||
      old.rightOpacity != rightOpacity ||
      old.topOffset != topOffset ||
      old.stripOffset != stripOffset ||
      old.leftOffset != leftOffset ||
      old.rightOffset != rightOffset;
}

// ─────────────────────────────────────────────────────────────────────────────

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with TickerProviderStateMixin {

  // ── Controllers ────────────────────────────────────────────────────────────

  /// Drives the "fly-together" assembly of the cube pieces.
  late final AnimationController _assembleCtrl;

  /// Drives the squish-then-rebound of the cube wrapper.
  late final AnimationController _squishCtrl;

  /// Drives the shadow ring fade-in then fade-out.
  late final AnimationController _shadowCtrl;

  /// Drives the app-name falling in from above.
  late final AnimationController _nameCtrl;

  /// Drives the final full-screen fade-out.
  late final AnimationController _fadeOutCtrl;

  // ── Derived animations ──────────────────────────────────────────────────────

  // Piece offsets — each piece starts offset in an isometric direction and
  // animates toward Offset.zero (assembled position).
  // Offsets are in "SVG canvas units" so they scale with the logo size.
  // At 160×182 CSS-px the SVG is 572×650 → scale ≈ 0.28
  // We want ~68px screen separation → 68 / 0.28 ≈ 243 SVG units
  static const double _scatter = 243.0;

  // Isometric directions:
  //   top   → straight up
  //   left  → left + 0.5×down  (iso-left)
  //   right → right + 0.5×down (iso-right)
  static const Offset _topDir   = Offset(0, -_scatter);
  static const Offset _leftDir  = Offset(-_scatter, _scatter * 0.5);
  static const Offset _rightDir = Offset(_scatter, _scatter * 0.5);
  static const Offset _stripDir = Offset(_scatter * 1.1, _scatter * 0.3);

  late final Animation<Offset> _topAnim;
  late final Animation<Offset> _leftAnim;
  late final Animation<Offset> _rightAnim;
  late final Animation<Offset> _stripAnim;

  // Squish
  late final Animation<double> _squishY;
  late final Animation<double> _squishX;

  // Shadow
  late final Animation<double> _shadowOpacity;

  // Name position & opacity
  late final Animation<double> _nameY;   // translateY in logical pixels
  late final Animation<double> _nameOpacity;

  // Final fade-out
  late final Animation<double> _fadeOut;

  // ── Lifecycle ───────────────────────────────────────────────────────────────

  @override
  void initState() {
    super.initState();

    // Assembly: 650ms
    _assembleCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 650),
    );

    // Squish: 90ms squish + 380ms rebound (controlled sequentially below)
    _squishCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 470),
    );

    // Shadow: 520ms total (in 120ms, hold, out 400ms)
    _shadowCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 520),
    );

    // Name drop: 520ms (320ms fall + 200ms bounce-back)
    _nameCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 520),
    );

    // Fade-out: 700ms
    _fadeOutCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 700),
    );

    // ── Piece offset animations (scatter → zero) ──
    final assemble = CurvedAnimation(
      parent: _assembleCtrl,
      curve: const Cubic(0.32, 0.72, 0, 1), // fast start, decelerate
    );

    _topAnim   = Tween<Offset>(begin: _topDir,   end: Offset.zero).animate(assemble);
    _leftAnim  = Tween<Offset>(begin: _leftDir,  end: Offset.zero).animate(assemble);
    _rightAnim = Tween<Offset>(begin: _rightDir, end: Offset.zero).animate(assemble);
    _stripAnim = Tween<Offset>(begin: _stripDir, end: Offset.zero).animate(assemble);

    // ── Squish ──
    // First 90/470 of the animation → squish down
    // Remaining 380/470 → spring rebound
    _squishY = TweenSequence<double>([
      TweenSequenceItem(
        tween: Tween(begin: 1.0, end: 0.86)
            .chain(CurveTween(curve: const Cubic(0.55, 0, 1, 0.45))),
        weight: 90,
      ),
      TweenSequenceItem(
        tween: Tween(begin: 0.86, end: 1.0)
            .chain(CurveTween(curve: const Cubic(0.34, 1.6, 0.64, 1))),
        weight: 380,
      ),
    ]).animate(_squishCtrl);

    _squishX = TweenSequence<double>([
      TweenSequenceItem(
        tween: Tween(begin: 1.0, end: 1.08)
            .chain(CurveTween(curve: const Cubic(0.55, 0, 1, 0.45))),
        weight: 90,
      ),
      TweenSequenceItem(
        tween: Tween(begin: 1.08, end: 1.0)
            .chain(CurveTween(curve: const Cubic(0.34, 1.6, 0.64, 1))),
        weight: 380,
      ),
    ]).animate(_squishCtrl);

    // ── Shadow opacity ──
    _shadowOpacity = TweenSequence<double>([
      TweenSequenceItem(
        tween: Tween(begin: 0.0, end: 1.0)
            .chain(CurveTween(curve: Curves.easeOut)),
        weight: 120,
      ),
      TweenSequenceItem(tween: ConstantTween(1.0), weight: 0),
      TweenSequenceItem(
        tween: Tween(begin: 1.0, end: 0.0)
            .chain(CurveTween(curve: Curves.easeIn)),
        weight: 400,
      ),
    ]).animate(_shadowCtrl);

    // ── Name drop ──
    // Starts at -110px (above logo), drops to +6px (overshoot), settles at 0
    const double nameStart = -110;
    _nameY = TweenSequence<double>([
      TweenSequenceItem(
        tween: Tween(begin: nameStart, end: 6.0)
            .chain(CurveTween(curve: const Cubic(0.55, 0, 0.75, 0))),
        weight: 320,
      ),
      TweenSequenceItem(
        tween: Tween(begin: 6.0, end: 0.0)
            .chain(CurveTween(curve: const Cubic(0.34, 1.4, 0.64, 1))),
        weight: 200,
      ),
    ]).animate(_nameCtrl);

    _nameOpacity = TweenSequence<double>([
      TweenSequenceItem(
        tween: Tween(begin: 0.0, end: 1.0)
            .chain(CurveTween(curve: Curves.easeOut)),
        weight: 80,
      ),
      TweenSequenceItem(tween: ConstantTween(1.0), weight: 440),
    ]).animate(_nameCtrl);

    // ── Fade-out ──
    _fadeOut = Tween<double>(begin: 1.0, end: 0.0)
        .animate(CurvedAnimation(parent: _fadeOutCtrl, curve: Curves.easeIn));

    _runAnimation();
  }

  Future<void> _runAnimation() async {
    // Brief hold showing scattered state (300ms)
    await Future.delayed(const Duration(milliseconds: 300));

    // Phase 1: Assemble
    await _assembleCtrl.forward();
    await Future.delayed(const Duration(milliseconds: 30));

    // Phase 2: Squish + shadow (run together)
    _squishCtrl.forward();
    await Future.delayed(const Duration(milliseconds: 90));
    _shadowCtrl.forward();
    await _squishCtrl.forward(from: _squishCtrl.value);
    await Future.delayed(const Duration(milliseconds: 180));

    // Phase 3: Name drops in
    await _nameCtrl.forward();

    // Phase 4: Hold
    await Future.delayed(const Duration(milliseconds: 2600));

    // Phase 5: Fade out
    await _fadeOutCtrl.forward();

    // Navigate
    if (mounted) _decideNavigation();
  }

  // ── Navigation ──────────────────────────────────────────────────────────────

  Future<void> _decideNavigation() async {
    final prefs = await SharedPreferences.getInstance();
    final bool useBiometric = prefs.getBool('use_biometric') ?? false;
    final String? storedToken = prefs.getString('auth_token');
    final String? storedRefresh = prefs.getString('refresh_token');
    final bool hasToken = storedToken != null && storedToken.trim().isNotEmpty;

    if (useBiometric && hasToken) {
      await _runBiometricThenNavigate(storedToken!, storedRefresh);
    } else {
      _goToLogin();
    }
  }

  Future<void> _runBiometricThenNavigate(
      String token, String? refreshToken) async {
    final auth = LocalAuthentication();
    final bool capable =
        await auth.canCheckBiometrics || await auth.isDeviceSupported();
    if (!capable) { _goToLogin(); return; }

    try {
      final bool ok = await auth.authenticate(
        localizedReason: 'Scan your fingerprint to access WorkforceOS',
        options: const AuthenticationOptions(
          stickyAuth: true,
          biometricOnly: false,
        ),
      );
      if (!mounted) return;
      if (ok) {
        _goToWebView(injectedToken: token, injectedRefreshToken: refreshToken);
      } else {
        _goToLogin();
      }
    } catch (e) {
      debugPrint('Biometric error: $e');
      _goToLogin();
    }
  }

  void _goToLogin() {
    if (!mounted) return;
    Navigator.of(context).pushReplacement(PageRouteBuilder(
      pageBuilder: (_, __, ___) => const WebViewScreen(),
      transitionsBuilder: (_, animation, __, child) =>
          FadeTransition(opacity: animation, child: child),
      transitionDuration: const Duration(milliseconds: 500),
    ));
  }

  void _goToWebView(
      {String? injectedToken, String? injectedRefreshToken}) {
    if (!mounted) return;
    Navigator.of(context).pushReplacement(PageRouteBuilder(
      pageBuilder: (_, __, ___) => WebViewScreen(
          injectedToken: injectedToken,
          injectedRefreshToken: injectedRefreshToken),
      transitionsBuilder: (_, animation, __, child) =>
          FadeTransition(opacity: animation, child: child),
      transitionDuration: const Duration(milliseconds: 500),
    ));
  }

  @override
  void dispose() {
    _assembleCtrl.dispose();
    _squishCtrl.dispose();
    _shadowCtrl.dispose();
    _nameCtrl.dispose();
    _fadeOutCtrl.dispose();
    super.dispose();
  }

  // ── Build ───────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: AnimatedBuilder(
        animation: Listenable.merge([
          _assembleCtrl,
          _squishCtrl,
          _shadowCtrl,
          _nameCtrl,
          _fadeOutCtrl,
        ]),
        builder: (context, _) {
          final fadeOpacity = _fadeOut.value;

          return Opacity(
            opacity: fadeOpacity,
            child: Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // ── Cube + shadow ──────────────────────────────────────────
                  SizedBox(
                    width: 160,
                    height: 182 + 22, // extra for shadow below
                    child: Stack(
                      alignment: Alignment.topCenter,
                      children: [
                        // The cube wrapper (squish applied here)
                        Positioned(
                          top: 0,
                          left: 0,
                          right: 0,
                          height: 182,
                          child: Transform(
                            alignment: Alignment.bottomCenter,
                            transform: Matrix4.identity()
                              ..scale(_squishX.value, _squishY.value, 1.0),
                            child: CustomPaint(
                              size: const Size(160, 182),
                              painter: _CubePainter(
                                topOffset:   _topAnim.value,
                                stripOffset: _stripAnim.value,
                                leftOffset:  _leftAnim.value,
                                rightOffset: _rightAnim.value,
                              ),
                            ),
                          ),
                        ),

                        // Shadow ellipse (below cube)
                        Positioned(
                          bottom: 0,
                          left: 0,
                          right: 0,
                          child: Opacity(
                            opacity: _shadowOpacity.value,
                            child: Center(
                              child: Container(
                                width: 120,
                                height: 14,
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(50),
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.black.withOpacity(0.14),
                                      blurRadius: 12,
                                      spreadRadius: 2,
                                    ),
                                  ],
                                  color: Colors.transparent,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 16),

                  // ── App name ───────────────────────────────────────────────
                  Transform.translate(
                    offset: Offset(0, _nameY.value),
                    child: Opacity(
                      opacity: _nameOpacity.value,
                      child: RichText(
                        text: const TextSpan(
                          children: [
                            TextSpan(
                              text: 'workforce',
                              style: TextStyle(
                                fontFamily: 'Plus Jakarta Sans',
                                fontSize: 34,
                                fontWeight: FontWeight.w800,
                                color: Color(0xFF111827),
                                letterSpacing: -1.0,
                                height: 1,
                              ),
                            ),
                            TextSpan(
                              text: 'os',
                              style: TextStyle(
                                fontFamily: 'Plus Jakarta Sans',
                                fontSize: 34,
                                fontWeight: FontWeight.w300,
                                color: Color(0xFF59cb8f),
                                letterSpacing: -1.0,
                                height: 1,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
