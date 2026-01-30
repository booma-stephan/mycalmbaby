# CLAUDE.md - My Calm Baby

## Project Overview

**My Calm Baby – White Noise** is an iOS app designed to soothe babies to sleep using:
- Programmatically generated white noise (smooth, no harsh artifacts)
- Interactive calming visual animations
- Sleep timer with auto-stop
- Parental lock (4-corner tap sequence prevents accidental exits)

## Tech Stack

- **Framework**: React Native 0.79.5 + Expo SDK 53
- **Language**: TypeScript 5.8.3
- **Routing**: Expo Router (file-based)
- **Animations**: react-native-reanimated 3.17.4
- **Gestures**: react-native-gesture-handler 2.24.0
- **Audio**: expo-av with custom WhiteNoiseGenerator
- **Storage**: AsyncStorage for user preferences
- **Build**: EAS (Expo Application Services)

## Project Structure

```
app/
├── _layout.tsx          # Root layout with GestureHandlerRootView
├── index.tsx            # Entry point - routing logic
├── main-menu.tsx        # Settings screen
├── animation.tsx        # Main animation playback (673 lines, core file)
├── onboarding.tsx       # First-time setup, unlock sequence creation
├── animations/          # Plugin architecture for animations
│   ├── basic-shapes/    # Default: geometric shapes with physics
│   ├── space-journey/   # Parallax stars and planets
│   └── bursting-bubbles/# Interactive bubbles
├── components/          # UI components (UIComponents.tsx, AnimationCarousel.tsx)
├── utils/               # Business logic singletons
│   ├── AnimationManager.ts   # Animation discovery and selection
│   ├── AudioManager.ts       # Audio control wrapper
│   └── WhiteNoiseGenerator.ts # White noise synthesis
└── styles/
    └── designTokens.ts  # Design system (colors, spacing, typography)
```

## Key Patterns

### Singletons
- `AnimationManager` - Manages animation discovery/selection
- `AudioManager` - Centralized audio control
- `WhiteNoiseGenerator` - Audio synthesis with crossfading

### State Persistence (AsyncStorage keys)
- `hasCompletedOnboarding` - First-time setup flag
- `unlockSequence` - 4-corner tap pattern (parental lock)
- `whiteNoiseEnabled` - Sound toggle state
- `sleepTimer` - Auto-stop duration (15/30/60 min or null)
- `selectedAnimation` - Currently selected animation ID

### Animation Plugin System
Each animation is self-contained in `app/animations/<name>/`:
- `animation.tsx` - React component
- `animation.json` - Config (id, name, description, elements)
- `thumbnail.png` - Preview image

Animation components receive props: `animationValue`, `rotationValue`, `scaleValue`, `elements`, `width`, `height`, `onBackgroundTap`, `styles`

## Development Commands

```bash
npm install              # Install dependencies
npx expo start           # Start dev server
npx expo start --ios     # Run iOS simulator
npm run lint             # ESLint checks
npm run release          # Production release wizard
```

## Git Workflow & Branching Strategy

```
feature/* ──PR──► develop ──PR──► main ──manual──► production
                     │              │
                     ▼              ▼
              Development      Preview
                Build           Build
```

### Branches
- `develop` - Active development, auto-triggers development builds
- `main` - Stable code, auto-triggers preview builds
- `feature/*` - Feature branches, create from `develop`

### Workflow
1. Create feature branch from `develop`
2. PR to `develop` → runs lint & typecheck (must pass)
3. Merge to `develop` → triggers development build (simulator, hot reload)
4. PR from `develop` to `main` → runs lint & typecheck
5. Merge to `main` → triggers preview build (internal testing)
6. Manual trigger → production build & App Store submission

### GitHub Actions (`.github/workflows/`)
- `pr-check.yml` - Lint, typecheck, Expo export validation on PRs
- `development-build.yml` - Builds dev client on `develop` push
- `preview-build.yml` - Builds preview on `main` push
- `production-release.yml` - Manual trigger for production build & App Store submission

## Build & Deployment

### EAS Channels
- `development` - Dev client testing (simulator, hot reload)
- `preview` - Internal review (TestFlight-like)
- `production` - App Store releases

### Development Build (automatic)
Triggered automatically on push to `develop`. Build URL commented on commit.
```bash
# After build completes, install via Expo Orbit, then:
npx expo start --dev-client
```

### Preview Build (automatic)
Triggered automatically on push to `main` for internal testing.

### Production Release (manual)
**Option 1: Release Script (recommended)**
```bash
npm run release
```
The script will:
- Verify git is clean and on `main` branch
- Check last preview build succeeded
- Prompt for new version number
- Update `package.json` and `app.json`
- Commit and push version bump
- Offer to trigger build via EAS CLI or GitHub Actions

**Option 2: GitHub Actions UI**
1. Update version in `package.json` and `app.json`
2. Go to Actions → "Production Release" → Run workflow
3. Choose whether to auto-submit to App Store

**Option 3: Manual CLI**
```bash
# 1. Update version in package.json and app.json
# 2. Build for production
eas build --platform ios --profile production
# 3. Submit to App Store
eas submit --platform ios --profile production
```

### OTA Update (JS-only changes)
```bash
# Bump patch version (e.g., 1.2.1 → 1.2.2)
eas update --branch production --auto
```

## Critical Implementation Details

### White Noise Audio
- Dual Audio.Sound instances for seamless 2-second crossfading
- iOS: `playsInSilentModeIOS: true`, DoNotMix interruption
- Continues in background when app backgrounded

### Parental Lock
- 4-corner tap sequence created during onboarding
- Must tap corners in correct order to exit animation screen
- Validates against stored `unlockSequence`

### Gesture Blocking
- PanResponder blocks swipe-back gesture (15px threshold)
- iOS swipe-back disabled via `gestureEnabled: false`
- Hardware back button disabled on Android

### Screen Management
- Portrait orientation locked
- Screen kept awake during playback (expo-keep-awake)
- Status bar hidden during animation

### Haptic Feedback
- Minimal: 5ms vibration only on direct shape touch (iOS)
- Reduced to avoid disturbing sleeping babies

## Design Tokens

Colors defined in `app/styles/designTokens.ts`:
- Primary: `#4A90D9` (calm blue)
- Background: `#1A1A2E` (dark navy)
- Card: `#252547` (purple-navy)
- Text: `#E8E8F0` (light gray)

## Important Files

1. **`app/animation.tsx`** - Core screen: touch zones, sequence validation, sleep timer, UI hiding
2. **`app/utils/WhiteNoiseGenerator.ts`** - Audio synthesis and crossfading logic
3. **`app/utils/AnimationManager.ts`** - Animation discovery and persistence
4. **`app/animations/basic-shapes/animation.tsx`** - Default animation with physics

## Adding New Animations

1. Create folder: `app/animations/<kebab-case-name>/`
2. Add `animation.json` with id, name, description, elements array
3. Add `animation.tsx` component accepting standard props
4. Add `thumbnail.png` for carousel preview
5. AnimationManager auto-discovers at runtime

See `docs/ANIMATION_DEVELOPER_GUIDE.md` for details.

## Common Issues

- **Audio not playing**: Check AudioManager initialization, verify `playsInSilentModeIOS` setting
- **Gestures not working**: Ensure GestureHandlerRootView wraps component tree
- **Animation not loading**: Check animation.json format, verify AnimationManager.loadAnimations() called
