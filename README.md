# 🎖️ Army Runner

A React Native endless runner game built with Expo. Run, dodge obstacles, and survive as long as you can!

## 🎮 Features

- **Endless Runner Gameplay** - Keep running and avoid obstacles
- **Touch Controls** - Simple tap/swipe controls for movement
- **Score Tracking** - Track your distance and high score
- **Progressive Difficulty** - Game gets harder as you progress
- **Obstacle Variety** - Multiple types of obstacles to avoid

## 📱 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo Go app (for testing on device)

### Installation

```bash
# Install dependencies
npm install

# Start the development server
npx expo start
```

### Running on Device

1. Install the **Expo Go** app from App Store (iOS) or Google Play (Android)
2. Scan the QR code displayed in the terminal
3. The game will load in Expo Go

### Running on Simulator

```bash
# iOS Simulator (macOS only)
npm run ios

# Android Emulator
npm run android
```

## 🎯 How to Play

1. Tap the screen to start running
2. Swipe or tap to move left/right
3. Avoid obstacles in your path
4. Survive as long as possible to get a high score

## 📁 Project Structure

```
army-runner/
├── app/
│   ├── _layout.tsx      # Root layout
│   ├── index.tsx        # Start screen
│   └── game.tsx         # Game screen
├── app.json             # Expo configuration
├── package.json         # Dependencies
└── tsconfig.json        # TypeScript config
```

## 🛠️ Technologies Used

- **Expo** - React Native framework
- **TypeScript** - Type safety
- **React Native** - Mobile app framework

## 📝 License

MIT
