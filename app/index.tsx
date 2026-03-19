import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function StartScreen() {
  const router = useRouter();

  const handleStartPress = () => {
    router.push('/game');
  };

  return (
    <LinearGradient
      colors={['#1a1a2e', '#16213e', '#0f3460']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Mathematical decorations */}
        <View style={styles.mathSymbolsTop}>
          <Text style={styles.mathSymbol}>+</Text>
          <Text style={styles.mathSymbol}>×</Text>
          <Text style={styles.mathSymbol}>÷</Text>
          <Text style={styles.mathSymbol}>−</Text>
        </View>

        {/* Main content */}
        <View style={styles.content}>
          {/* Game title with mathematical theme */}
          <View style={styles.titleContainer}>
            <View style={styles.titleRow}>
              <MaterialCommunityIcons name="sword-cross" size={40} color="#e94560" />
              <Text style={styles.title}>ARMY</Text>
            </View>
            <View style={styles.titleRow}>
              <Text style={styles.titleAccent}>RUNNER</Text>
              <MaterialCommunityIcons name="calculator-variant" size={40} color="#e94560" />
            </View>
          </View>

          {/* Subtitle */}
          <Text style={styles.subtitle}>Lead your army through math!</Text>

          {/* Math equation decoration */}
          <View style={styles.equationContainer}>
            <Text style={styles.equation}>1 + 10 × 2 − 5 ÷ 2 = ?</Text>
          </View>

          {/* Army visualization */}
          <View style={styles.armyContainer}>
            <View style={styles.armyRow}>
              <View style={styles.soldier}>
                <MaterialCommunityIcons name="human-handsup" size={30} color="#4ecca3" />
              </View>
              <View style={styles.soldier}>
                <MaterialCommunityIcons name="human-handsup" size={30} color="#4ecca3" />
              </View>
              <View style={styles.soldier}>
                <MaterialCommunityIcons name="human-handsup" size={30} color="#4ecca3" />
              </View>
            </View>
            <Text style={styles.armyText}>Your Army</Text>
          </View>

          {/* Start Button */}
          <TouchableOpacity style={styles.startButton} onPress={handleStartPress}>
            <LinearGradient
              colors={['#e94560', '#c73659']}
              style={styles.startButtonGradient}
            >
              <MaterialCommunityIcons name="play-circle" size={28} color="#fff" />
              <Text style={styles.startButtonText}>START</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Instructions */}
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionText}>⟨⟨ Swipe or tap arrows to move ⟩⟩</Text>
            <Text style={styles.instructionText}>⟨⟨ Cross math gates to grow army ⟩⟩</Text>
          </View>
        </View>

        {/* Bottom math symbols */}
        <View style={styles.mathSymbolsBottom}>
          <Text style={styles.mathSymbolSmall}>Σ</Text>
          <Text style={styles.mathSymbolSmall}>∞</Text>
          <Text style={styles.mathSymbolSmall}>π</Text>
          <Text style={styles.mathSymbolSmall}>√</Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
  },
  mathSymbolsTop: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 30,
  },
  mathSymbol: {
    fontSize: 32,
    color: '#e94560',
    fontWeight: 'bold',
    opacity: 0.6,
  },
  mathSymbolSmall: {
    fontSize: 24,
    color: '#4ecca3',
    fontWeight: 'bold',
    opacity: 0.5,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 8,
    textShadowColor: '#e94560',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 10,
  },
  titleAccent: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#e94560',
    letterSpacing: 8,
    textShadowColor: '#fff',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#4ecca3',
    marginBottom: 30,
    fontStyle: 'italic',
  },
  equationContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 15,
    marginBottom: 30,
    borderWidth: 2,
    borderColor: '#e94560',
  },
  equation: {
    fontSize: 20,
    color: '#fff',
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  armyContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  armyRow: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 10,
  },
  soldier: {
    backgroundColor: 'rgba(78, 204, 163, 0.2)',
    padding: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#4ecca3',
  },
  armyText: {
    color: '#4ecca3',
    fontSize: 14,
    fontWeight: 'bold',
  },
  startButton: {
    borderRadius: 30,
    overflow: 'hidden',
    marginBottom: 30,
    shadowColor: '#e94560',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 60,
    paddingVertical: 18,
    gap: 10,
  },
  startButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 4,
  },
  instructionsContainer: {
    alignItems: 'center',
  },
  instructionText: {
    color: '#888',
    fontSize: 14,
    marginVertical: 3,
    textAlign: 'center',
  },
  mathSymbolsBottom: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 40,
  },
});
