import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');
const LANE_WIDTH = width / 2;
const GAME_SPEED = 3;
const BARRIER_INTERVAL = 400;
const FINAL_GATE_Y = height * 0.3;

// Block size for army representation
const BLOCK_SIZE = 16;
const BLOCK_GAP = 2;
const BLOCKS_PER_ROW = 6;

const LANE_POSITIONS = {
  left: 0,
  right: LANE_WIDTH,
};

// Math operations for barriers
const MATH_OPERATIONS = [
  { label: '+10', operation: (count: number) => count + 10 },
  { label: '+20', operation: (count: number) => count + 20 },
  { label: '+5', operation: (count: number) => count + 5 },
  { label: '×2', operation: (count: number) => count * 2 },
  { label: '×3', operation: (count: number) => Math.floor(count * 1.5) },
  { label: '−5', operation: (count: number) => Math.max(0, count - 5) },
  { label: '−10', operation: (count: number) => Math.max(0, count - 10) },
  { label: '÷2', operation: (count: number) => Math.floor(count / 2) },
];

interface Barrier {
  id: number;
  y: number;
  leftOp: typeof MATH_OPERATIONS[0];
  rightOp: typeof MATH_OPERATIONS[0];
}

interface FinalGate {
  y: number;
  enemyCount: number;
  reached: boolean;
}

export default function GameScreen() {
  const router = useRouter();
  
  // Game state
  const [armyCount, setArmyCount] = useState(1);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [isAtFinalGate, setIsAtFinalGate] = useState(false);
  
  // Player position
  const [currentLane, setCurrentLane] = useState<'left' | 'right'>('left');
  const [playerY, setPlayerY] = useState(height * 0.82);
  
  // Game objects
  const [barriers, setBarriers] = useState<Barrier[]>([]);
  const [finalGate, setFinalGate] = useState<FinalGate | null>(null);
  
  // Refs for animation
  const gameLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const objectIdRef = useRef(0);
  const scrollOffsetRef = useRef(0);
  const gameStoppedRef = useRef(false);
  
  // Animation for player
  const playerX = useRef(new Animated.Value(LANE_WIDTH / 2)).current;

  // Load high score
  useEffect(() => {
    const loadHighScore = async () => {
      try {
        const stored = await AsyncStorage.getItem('armyRunnerHighScore');
        if (stored) setHighScore(parseInt(stored, 10));
      } catch (e) {
        console.log('Error loading high score');
      }
    };
    loadHighScore();
  }, []);

  // Initialize game
  const initGame = useCallback(() => {
    setArmyCount(1);
    setScore(0);
    setGameOver(false);
    setGameWon(false);
    setIsAtFinalGate(false);
    setCurrentLane('left');
    setPlayerY(height * 0.82);
    setBarriers([]);
    setFinalGate(null);
    scrollOffsetRef.current = 0;
    gameStoppedRef.current = false;
    playerX.setValue(LANE_POSITIONS.left);
  }, [playerX]);

  // Start game loop
  useEffect(() => {
    initGame();
    startGameLoop();
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [initGame]);

  const startGameLoop = () => {
    if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    
    gameLoopRef.current = setInterval(() => {
      if (gameOver || gameWon || gameStoppedRef.current) return;
      
      scrollOffsetRef.current += GAME_SPEED;
      
      // Update barriers
      setBarriers(prev => {
        const updated = prev
          .map(b => ({ ...b, y: b.y + GAME_SPEED }))
          .filter(b => b.y < height + 50);
        
        // Spawn new barriers
        const lastBarrier = updated[updated.length - 1];
        if (!lastBarrier || lastBarrier.y > BARRIER_INTERVAL) {
          const op1 = MATH_OPERATIONS[Math.floor(Math.random() * MATH_OPERATIONS.length)];
          let op2 = MATH_OPERATIONS[Math.floor(Math.random() * MATH_OPERATIONS.length)];
          while (op2.label === op1.label) {
            op2 = MATH_OPERATIONS[Math.floor(Math.random() * MATH_OPERATIONS.length)];
          }
          updated.push({
            id: objectIdRef.current++,
            y: -50,
            leftOp: op1,
            rightOp: op2,
          });
        }
        return updated;
      });
      
      // Check for final gate (after certain scroll distance)
      if (scrollOffsetRef.current > 6000 && !finalGate) {
        setFinalGate({
          y: -150,
          enemyCount: Math.max(10, Math.floor(armyCount * 0.6) + Math.floor(Math.random() * 5) + 5),
          reached: false,
        });
      }
      
      // Move final gate
      if (finalGate && !finalGate.reached) {
        setFinalGate(prev => {
          if (!prev) return null;
          const newY = prev.y + GAME_SPEED;
          
          // Check if player reached the final gate
          if (newY >= FINAL_GATE_Y && !prev.reached) {
            gameStoppedRef.current = true;
            setIsAtFinalGate(true);
            setScore(prevScore => prevScore + armyCount * 20);
            saveHighScore();
            return { ...prev, y: FINAL_GATE_Y, reached: true };
          }
          
          return { ...prev, y: newY };
        });
      }
      
      // Collision detection with barriers
      if (!gameStoppedRef.current) {
        setBarriers(prev => {
          const remaining: Barrier[] = [];
          prev.forEach(barrier => {
            if (barrier.y > playerY - 60 && barrier.y < playerY + 60) {
              // Army passes through barrier
              const selectedOp = currentLane === 'left' ? barrier.leftOp : barrier.rightOp;
              setArmyCount(prevCount => {
                const newCount = selectedOp.operation(prevCount);
                return newCount;
              });
              setScore(prevScore => prevScore + 10);
            } else if (barrier.y < height + 50) {
              remaining.push(barrier);
            }
          });
          return remaining;
        });
      }
      
      // Game over check
      setArmyCount(prevCount => {
        if (prevCount <= 0 && !gameOver && !isAtFinalGate) {
          setGameOver(true);
          saveHighScore();
        }
        return prevCount;
      });
      
    }, 16);
  };

  const saveHighScore = async () => {
    try {
      const currentScore = score + armyCount * 10;
      if (currentScore > highScore) {
        await AsyncStorage.setItem('armyRunnerHighScore', currentScore.toString());
        setHighScore(currentScore);
      }
    } catch (e) {
      console.log('Error saving high score');
    }
  };


  const moveLeft = () => {
    if (currentLane === 'right') {
      setCurrentLane('left');
      Animated.timing(playerX, {
        toValue: LANE_POSITIONS.left,
        duration: 150,
        useNativeDriver: false,
      }).start();
    }
  };

  const moveRight = () => {
    if (currentLane === 'left') {
      setCurrentLane('right');
      Animated.timing(playerX, {
        toValue: LANE_POSITIONS.right,
        duration: 150,
        useNativeDriver: false,
      }).start();
    }
  };

  const handleBackPress = () => {
    if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    router.back();
  };

  const handleRestart = () => {
    initGame();
    startGameLoop();
  };

  // Render army blocks
  const renderArmyBlocks = (count: number, color: string, isEnemy: boolean = false) => {
    const blocks = [];
    const maxDisplay = Math.min(count, 48); // Max 48 blocks visible
    
    for (let i = 0; i < maxDisplay; i++) {
      const row = Math.floor(i / BLOCKS_PER_ROW);
      const col = i % BLOCKS_PER_ROW;
      blocks.push(
        <View
          key={i}
          style={[
            styles.armyBlock,
            {
              backgroundColor: color,
              left: col * (BLOCK_SIZE + BLOCK_GAP),
              top: row * (BLOCK_SIZE + BLOCK_GAP),
              borderColor: isEnemy ? '#ff4757' : '#4ecca3',
            },
          ]}
        />
      );
    }
    return blocks;
  };

  // Render math barrier
  const renderBarrier = (barrier: Barrier) => {
    return (
      <View key={barrier.id} style={[styles.barrier, { top: barrier.y }]}>
        <View style={styles.barrierLeft}>
          <Text style={styles.barrierText}>{barrier.leftOp.label}</Text>
        </View>
        <View style={styles.barrierDivider} />
        <View style={styles.barrierRight}>
          <Text style={styles.barrierText}>{barrier.rightOp.label}</Text>
        </View>
      </View>
    );
  };

  // Render final gate with both armies
  const renderFinalGate = () => {
    if (!finalGate) return null;
    
    return (
      <View style={[styles.finalGateContainer, { top: finalGate.y }]}>
        {/* Final Gate Banner */}
        <LinearGradient
          colors={['#ff4757', '#c0392b']}
          style={styles.finalGateBanner}
        >
          <MaterialCommunityIcons name="gate" size={30} color="#fff" />
          <Text style={styles.finalGateTitle}>FINAL GATE</Text>
          <MaterialCommunityIcons name="gate" size={30} color="#fff" />
        </LinearGradient>
        
        {/* Battle Arena */}
        <View style={styles.battleArena}>
          {/* Enemy Army Side (top) */}
          <View style={styles.armySideTop}>
            <Text style={[styles.armySideLabel, styles.enemyLabel]}>ENEMY BOTS</Text>
            <View style={styles.blocksContainer}>
              {renderArmyBlocks(finalGate.enemyCount, '#ff4757', true)}
            </View>
            <View style={[styles.armyCountBadge, styles.enemyBadge]}>
              <Text style={styles.armyCountBadgeText}>{finalGate.enemyCount}</Text>
            </View>
          </View>
          
          {/* VS Divider */}
          <View style={styles.vsDivider}>
            <Text style={styles.vsText}>VS</Text>
          </View>
          
          {/* Player Army Side (bottom) */}
          <View style={styles.armySideBottom}>
            <Text style={styles.armySideLabel}>YOUR ARMY</Text>
            <View style={styles.blocksContainer}>
              {renderArmyBlocks(armyCount, '#4ecca3', false)}
            </View>
            <View style={styles.armyCountBadge}>
              <Text style={styles.armyCountBadgeText}>{armyCount}</Text>
            </View>
          </View>
        </View>
        
        {/* Battle Status */}
        <View style={styles.battleStatus}>
          <Text style={styles.battleStatusText}>
            {isAtFinalGate ? '⚔️ ARMIES ARE FACING EACH OTHER ⚔️' : '→ MARCHING TO FINAL GATE →'}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <LinearGradient
      colors={['#0a0a1a', '#1a1a3e', '#0f0f2e']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* HUD */}
        <View style={styles.hudContainer}>
          <View style={styles.scoreItem}>
            <MaterialCommunityIcons name="trophy" size={20} color="#ffd700" />
            <Text style={styles.scoreLabel}>HIGH</Text>
            <Text style={styles.scoreValue}>{highScore}</Text>
          </View>
          <View style={styles.scoreItem}>
            <MaterialCommunityIcons name="star" size={20} color="#4ecca3" />
            <Text style={styles.scoreLabel}>SCORE</Text>
            <Text style={styles.scoreValue}>{score}</Text>
          </View>
          <View style={styles.scoreItem}>
            <MaterialCommunityIcons name="cube" size={20} color="#4ecca3" />
            <Text style={styles.scoreLabel}>BLOCKS</Text>
            <Text style={styles.scoreValue}>{armyCount}</Text>
          </View>
        </View>

        {/* Path */}
        <View style={styles.pathContainer}>
          <View style={styles.clusterShadow} />
          <View style={styles.clusterPath} />
          
          {/* Lane divider */}
          <View style={styles.laneDivider} />
          
          {/* Math barriers */}
          {barriers.map(renderBarrier)}
          
          {/* Final gate with armies */}
          {renderFinalGate()}
          
          {/* Army group with block display */}
          {!isAtFinalGate && (
            <Animated.View
              style={[
                styles.playerContainer,
                { transform: [{ translateX: Animated.subtract(playerX, LANE_POSITIONS.left) }] },
              ]}
            >
              {/* Army count display */}
              <View style={styles.armyCountDisplay}>
                <Text style={styles.armyCountText}>{armyCount}</Text>
              </View>
              
              {/* Army blocks */}
              <View style={styles.armyGroup}>
                {renderArmyBlocks(armyCount, '#4ecca3', false)}
              </View>
              
              {/* Leader block */}
              <View style={styles.leaderBlock}>
                <View style={styles.leaderBlockInner} />
              </View>
            </Animated.View>
          )}
        </View>

        {/* Game over / Win overlay */}
        {(gameOver || gameWon) && (
          <View style={styles.overlay}>
            <View style={styles.overlayContent}>
              <MaterialCommunityIcons
                name={gameWon ? 'trophy-award' : 'skull'}
                size={80}
                color={gameWon ? '#ffd700' : '#ff4757'}
              />
              <Text style={styles.overlayTitle}>
                {gameWon ? 'VICTORY!' : 'GAME OVER'}
              </Text>
              <Text style={styles.overlayScore}>Final Score: {score}</Text>
              <Text style={styles.overlayArmy}>Blocks Remaining: {Math.max(0, armyCount)}</Text>
              <TouchableOpacity style={styles.restartButton} onPress={handleRestart}>
                <LinearGradient
                  colors={['#e94560', '#c73659']}
                  style={styles.restartButtonGradient}
                >
                  <MaterialCommunityIcons name="refresh" size={24} color="#fff" />
                  <Text style={styles.restartButtonText}>PLAY AGAIN</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
                <Text style={styles.backButtonText}>BACK TO MENU</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}


        {/* Controls */}
        {!isAtFinalGate && (
          <View style={styles.controlsContainer}>
            <TouchableOpacity style={styles.controlButton} onPress={moveLeft}>
              <MaterialCommunityIcons name="arrow-left" size={40} color="#fff" />
            </TouchableOpacity>
            <View style={styles.controlsInfo}>
              <Text style={styles.controlsInfoText}>Swipe or tap arrows</Text>
            </View>
            <TouchableOpacity style={styles.controlButton} onPress={moveRight}>
              <MaterialCommunityIcons name="arrow-right" size={40} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {/* Back button */}
        <TouchableOpacity style={styles.menuBackButton} onPress={handleBackPress}>
          <MaterialCommunityIcons name="arrow-left" size={20} color="#888" />
          <Text style={styles.menuBackButtonText}>MENU</Text>
        </TouchableOpacity>
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
  },
  hudContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderBottomWidth: 2,
    borderBottomColor: '#e94560',
  },
  scoreItem: {
    alignItems: 'center',
  },
  scoreLabel: {
    color: '#888',
    fontSize: 9,
    fontWeight: 'bold',
    marginTop: 2,
    letterSpacing: 1,
  },
  scoreValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  pathContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#16213e',
    overflow: 'hidden',
  },
  laneDivider: {
    position: 'absolute',
    left: LANE_WIDTH - 2,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#4ecca3',
    opacity: 0.5,
  },
  barrier: {
    position: 'absolute',
    left: 0,
    width: width,
    height: 60,
    flexDirection: 'row',
    backgroundColor: 'rgba(233, 69, 96, 0.3)',
    borderWidth: 2,
    borderColor: '#e94560',
    borderRadius: 8,
  },
  barrierLeft: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(78, 204, 163, 0.2)',
  },
  barrierRight: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 165, 2, 0.2)',
  },
  barrierDivider: {
    width: 4,
    backgroundColor: '#fff',
  },
  barrierText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  obstacle: {
    position: 'absolute',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  enemy: {
    position: 'absolute',
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  enemyCount: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ff4757',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  enemyCountText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  movingGate: {
    position: 'absolute',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  finalBattle: {
    position: 'absolute',
    left: 0,
    width: width,
    height: 100,
  },
  finalBattleGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 15,
  },
  finalBattleText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 3,
  },
  finalBattleEnemyCount: {
    fontSize: 14,
    color: '#fff',
    position: 'absolute',
    bottom: 10,
  },
  playerContainer: {
    position: 'absolute',
    top: height * 0.82,
    width: LANE_WIDTH,
    alignItems: 'flex-start',
    paddingLeft: 10,
  },
  armyCountDisplay: {
    backgroundColor: 'rgba(78, 204, 163, 0.9)',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 5,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#4ecca3',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  armyCountText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  armyGroup: {
    position: 'relative',
    width: BLOCKS_PER_ROW * (BLOCK_SIZE + BLOCK_GAP),
    height: 80,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  armyBlock: {
    position: 'absolute',
    width: BLOCK_SIZE,
    height: BLOCK_SIZE,
    borderWidth: 1,
    borderRadius: 2,
  },
  leaderBlock: {
    position: 'absolute',
    bottom: -25,
    width: 30,
    height: 30,
    backgroundColor: '#e94560',
    borderRadius: 4,
    borderWidth: 3,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  leaderBlockInner: {
    width: 12,
    height: 12,
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  overlayContent: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: 'rgba(26, 26, 62, 0.9)',
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#e94560',
  },
  overlayTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 15,
    letterSpacing: 4,
  },
  overlayScore: {
    fontSize: 20,
    color: '#4ecca3',
    marginTop: 15,
  },
  overlayArmy: {
    fontSize: 16,
    color: '#e94560',
    marginTop: 5,
  },
  restartButton: {
    marginTop: 30,
    borderRadius: 25,
    overflow: 'hidden',
  },
  restartButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 15,
    gap: 10,
  },
  restartButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 2,
  },
  backButton: {
    marginTop: 15,
    padding: 10,
  },
  backButtonText: {
    color: '#888',
    fontSize: 14,
    letterSpacing: 1,
  },
  battleOverlay: {
    position: 'absolute',
    top: height * 0.35,
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 50,
  },
  battleProgressText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  battleProgressBar: {
    width: '100%',
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 5,
    overflow: 'hidden',
  },
  battleProgressFill: {
    height: '100%',
    backgroundColor: '#e94560',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderTopWidth: 2,
    borderTopColor: '#4ecca3',
  },
  controlButton: {
    backgroundColor: 'rgba(78, 204, 163, 0.3)',
    padding: 15,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#4ecca3',
  },
  controlsInfo: {
    alignItems: 'center',
  },
  controlsInfoText: {
    color: '#888',
    fontSize: 12,
  },
  menuBackButton: {
    position: 'absolute',
    top: 70,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 15,
    gap: 5,
  },
  menuBackButtonText: {
    color: '#888',
    fontSize: 12,
    letterSpacing: 1,
  },
  // Final Gate Styles
  finalGateContainer: {
    position: 'absolute',
    left: 0,
    width: width,
    height: 320,
    backgroundColor: 'rgba(255, 71, 87, 0.15)',
    borderTopWidth: 4,
    borderTopColor: '#ff4757',
  },
  finalGateBanner: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  finalGateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 3,
  },
  battleArena: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    gap: 10,
  },
  armySideTop: {
    alignItems: 'center',
    flex: 1,
  },
  armySideBottom: {
    alignItems: 'center',
    flex: 1,
  },
  armySide: {
    alignItems: 'center',
    flex: 1,
  },
  armySideLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4ecca3',
    marginBottom: 8,
    letterSpacing: 1,
  },
  enemyLabel: {
    color: '#ff4757',
  },
  blocksContainer: {
    position: 'relative',
    width: BLOCKS_PER_ROW * (BLOCK_SIZE + BLOCK_GAP),
    height: 90,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
    padding: 4,
  },
  armyCountBadge: {
    marginTop: 8,
    backgroundColor: 'rgba(78, 204, 163, 0.9)',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#fff',
  },
  enemyBadge: {
    backgroundColor: 'rgba(255, 71, 87, 0.9)',
  },
  armyCountBadgeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  vsDivider: {
    width: 50,
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  vsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e94560',
  },
  battleStatus: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  battleStatusText: {
    fontSize: 12,
    color: '#ffd700',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  clusterPath: {
    position: 'absolute',
    left: 10,
    right: 10,
    top: 0,
    bottom: 0,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(78, 204, 163, 0.2)',
  },
  clusterShadow: {
    position: 'absolute',
    left: 12,
    right: 12,
    top: 5,
    bottom: 5,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
});
