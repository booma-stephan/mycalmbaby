# My Calm Baby 🍼

A soothing, interactive baby app built with React Native and Expo. Features gentle animations, calming colors, and baby-friendly interactions designed to engage and soothe little ones.

## 🎯 Features

- **Basic Shapes Animation**: Interactive geometric shapes with gentle physics
- **Touch Interactions**: Drag and drop shapes with reduced sensitivity for babies
- **Calming Visuals**: Soft color palettes that change slowly (1-minute cycles)
- **Particle Effects**: Beautiful explosion effects on interactions
- **Audio Feedback**: Musical notes on shape interactions
- **Minimal Haptic Feedback**: Ultra-gentle 5ms vibrations only on shape touch (iOS only)
- **Baby-Friendly Physics**: Gentle floating motion instead of harsh falling

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or later)
- Expo CLI (`npm install -g @expo/cli`)
- EAS CLI (`npm install -g eas-cli`)
- iOS Simulator (for development)

### Installation

1. **Clone and install dependencies**

   ```bash
   git clone <repository-url>
   cd my-calm-baby
   npm install
   ```

2. **Start development server**

   ```bash
   npx expo start
   ```

3. **Run on iOS Simulator**
   ```bash
   npx expo start --ios
   ```

## 📱 Release Management

### Git Workflow

This project uses a **production-first** Git workflow aligned with EAS channels:

- **`main`** → Development and feature work
- **`production`** → Production releases (matches EAS production channel)

#### Development Workflow

```bash
# 1. Work on features in main branch
git checkout main
git pull origin main
# ... make changes ...
git add .
git commit -m "feat: new functionality"
git push origin main

# 2. Release to production
git checkout production
git pull origin production
git merge main
git push origin production

# 3. Deploy via EAS
npx eas update --branch production --auto
```

### App Store Releases (Native Builds)

Use this for major versions, native code changes, or new app store submissions.

#### Step 1: Update Version Numbers

```bash
# Update both files to match (e.g., 1.3.0)
# package.json: "version": "1.3.0"
# app.json: "version": "1.3.0"
```

#### Step 2: Build for iOS App Store

```bash
# Ensure you're on production branch
git checkout production

# Build production binary
eas build --platform ios --profile production

# Check build status
eas build:list --platform ios --limit 5
```

#### Step 3: Submit to App Store

```bash
# Submit to App Store Connect
eas submit --platform ios --profile production

# Or submit specific build
eas submit --platform ios --profile production --id <BUILD_ID>
```

#### Step 4: App Store Connect

1. Wait for processing (10-60 minutes)
2. Add app metadata, screenshots, descriptions
3. Submit for review
4. Release when approved

### Over-The-Air (OTA) Updates

Use this for JavaScript changes, bug fixes, and UX improvements.

#### Step 1: Update Version (Patch)

```bash
# For patch updates (e.g., 1.2.0 → 1.2.1)
# Update both:
# package.json: "version": "1.2.1"
# app.json: "version": "1.2.1"
```

#### Step 2: Test Update (Optional)

```bash
# Publish to preview channel first
eas update --branch preview --message "v1.2.1: Testing new features"

# Test the preview build
# Download preview build from EAS dashboard
```

#### Step 3: Publish Production Update

```bash
# Ensure you're on production branch
git checkout production

# Publish to production channel
eas update --branch production --message "v1.2.1: Gentler animations and improved UX"

# Check update status
eas update:list --branch production
```

#### Step 4: Monitor Deployment

```bash
# View update analytics
eas update:list --branch production --limit 10
```

## 🔄 Update Channels

| Channel       | Purpose         | Command                           |
| ------------- | --------------- | --------------------------------- |
| `development` | Local testing   | `eas update --branch development` |
| `preview`     | Internal review | `eas update --branch preview`     |
| `production`  | Live users      | `eas update --branch production`  |

## 📋 Release Checklist

### Before Any Release:

- [ ] Test on iOS Simulator
- [ ] Verify all animations work smoothly
- [ ] Check for console errors/warnings
- [ ] Test touch interactions
- [ ] Verify audio feedback

### App Store Release:

- [ ] Update version in both `package.json` and `app.json`
- [ ] Build with `eas build --platform ios --profile production`
- [ ] Submit with `eas submit --platform ios --profile production`
- [ ] Update App Store Connect metadata
- [ ] Submit for review

### OTA Update:

- [ ] Update patch version (e.g., 1.2.0 → 1.2.1)
- [ ] Test on preview channel first (optional)
- [ ] Publish to production with descriptive message
- [ ] Monitor update adoption

## 🛠️ Development

### Project Structure

```
app/
├── animations/
│   └── basic-shapes/
│       └── animation.tsx    # Main shapes animation
├── _layout.tsx              # Root layout
└── animation.tsx            # Animation screen
```

### Key Files

- `eas.json` - EAS build and update configuration
- `app.json` - Expo app configuration
- `package.json` - Dependencies and version

### Environment

- **Target Platform**: iOS only
- **Expo SDK**: 53
- **React Native**: 0.79.5
- **Node**: 19.0.0

## 🎨 Animation Features

### Basic Shapes Animation

- **Gentle Physics**: Reduced gravity (0.05) for floating effect
- **Calm Interactions**: 60% reduced drag sensitivity
- **Soothing Colors**: 1-minute background cycles
- **Particle Effects**: Explosion animations on interactions
- **Audio Feedback**: Musical notes on shape interactions
- **Minimal Haptic**: 5ms vibration only on direct shape touch (no collision haptics)

## 📱 App Configuration

### iOS Settings

- **Bundle ID**: `com.susv.mycalmbaby`
- **Apple ID**: `seider.steph@me.com`
- **Team ID**: `ZZQXC2XZXZ`
- **App Store ID**: `6737749838`

### Update Configuration

- **Runtime Version**: Based on app version
- **Update URL**: `https://u.expo.dev/c4a55db1-191f-4c15-8004-142ebae2976d`
- **Owner**: `thestephse`

## 🐛 Troubleshooting

### Common Issues

**Metro Cache Issues:**

```bash
npx expo start --clear
```

**Build Failures:**

```bash
# Check build logs
eas build:list --platform ios --limit 5
```

**Update Not Appearing:**

- Check update channel matches build channel
- Verify app is connected to internet
- Updates apply on next app restart

### Performance

- All animations use optimized physics
- Particle system uses efficient cleanup
- No memory leaks in gesture handlers

## 📞 Support

- **EAS Dashboard**: [expo.dev](https://expo.dev)
- **App Store Connect**: [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
- **Expo Documentation**: [docs.expo.dev](https://docs.expo.dev)

---

**Current Version**: 1.2.1  
**Last Updated**: August 2025  
**Platform**: iOS Only  
**Git Workflow**: Production-first (main → production)  
**EAS Channel**: production
