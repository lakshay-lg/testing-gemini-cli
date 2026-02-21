import React, { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';

const GRID_SIZE = 20;
const INITIAL_SNAKE = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 },
];
const INITIAL_DIRECTION = { x: 0, y: -1 };

type Difficulty = 'EASY' | 'NORMAL' | 'INSANE';
const SPEED_MAP: Record<Difficulty, number> = { EASY: 200, NORMAL: 120, INSANE: 60 };

interface Point {
  x: number;
  y: number;
}

interface PowerUp {
  pos: Point;
  type: 'SPEED' | 'MULTIPLIER';
  expires: number;
}

const playSound = (type: 'eat' | 'move' | 'gameover' | 'powerup') => {
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  if (type === 'eat') {
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(600, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.1);
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.1);
  } else if (type === 'gameover') {
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(200, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.5);
    gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.5);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.5);
  } else if (type === 'powerup') {
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(400, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.2);
    gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.2);
  }
};

const BackgroundMusic: React.FC<{ isPlaying: boolean; difficulty: Difficulty }> = ({ isPlaying, difficulty }) => {
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (isPlaying) {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      const freq = difficulty === 'INSANE' ? 60 : difficulty === 'NORMAL' ? 45 : 35;
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime); 
      
      const now = audioCtx.currentTime;
      const interval = difficulty === 'INSANE' ? 1 : difficulty === 'NORMAL' ? 1.5 : 2;
      for (let i = 0; i < 1000; i++) {
        oscillator.frequency.setValueAtTime(freq, now + i * interval);
        oscillator.frequency.exponentialRampToValueAtTime(freq + 10, now + i * interval + (interval/2));
      }

      gainNode.gain.setValueAtTime(0.015, audioCtx.currentTime);
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.start();
      audioCtxRef.current = audioCtx;
    } else if (audioCtxRef.current) {
      audioCtxRef.current.close();
    }
    return () => audioCtxRef.current?.close();
  }, [isPlaying, difficulty]);
  return null;
};

const App: React.FC = () => {
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Point>(INITIAL_DIRECTION);
  const lastProcessedDirection = useRef<Point>(INITIAL_DIRECTION);
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [difficulty, setDifficulty] = useState<Difficulty>('NORMAL');
  const [powerUp, setPowerUp] = useState<PowerUp | null>(null);
  const [activeEffects, setActiveEffects] = useState({ speed: 0, multiplier: 0 });
  const [highScore, setHighScore] = useState(Number(localStorage.getItem(`snake-high-${difficulty}`)) || 0);

  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

  const generatePos = useCallback((currentSnake: Point[]) => {
    let newPos: Point;
    while (true) {
      newPos = { x: Math.floor(Math.random() * GRID_SIZE), y: Math.floor(Math.random() * GRID_SIZE) };
      if (!currentSnake.some(s => s.x === newPos.x && s.y === newPos.y)) return newPos;
    }
  }, []);

  const moveSnake = useCallback(() => {
    if (isGameOver || !gameStarted) return;
    lastProcessedDirection.current = direction;

    setSnake((prevSnake) => {
      const head = prevSnake[0];
      const newHead = { x: head.x + direction.x, y: head.y + direction.y };

      if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE || 
          prevSnake.some(s => s.x === newHead.x && s.y === newHead.y)) {
        setIsGameOver(true);
        playSound('gameover');
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore(s => s + (activeEffects.multiplier > 0 ? 20 : 10));
        playSound('eat');
        setFood(generatePos(newSnake));
        if (Math.random() < 0.2 && !powerUp) {
          setPowerUp({ pos: generatePos(newSnake), type: Math.random() > 0.5 ? 'SPEED' : 'MULTIPLIER', expires: Date.now() + 5000 });
        }
      } else if (powerUp && newHead.x === powerUp.pos.x && newHead.y === powerUp.pos.y) {
        playSound('powerup');
        if (powerUp.type === 'SPEED') setActiveEffects(e => ({ ...e, speed: 50 }));
        else setActiveEffects(e => ({ ...e, multiplier: 50 }));
        setPowerUp(null);
      } else {
        newSnake.pop();
      }
      return newSnake;
    });

    setActiveEffects(e => ({ speed: Math.max(0, e.speed - 1), multiplier: Math.max(0, e.multiplier - 1) }));
    if (powerUp && powerUp.expires < Date.now()) setPowerUp(null);
  }, [direction, food, gameStarted, isGameOver, generatePos, powerUp, activeEffects]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameStarted && !isGameOver) setGameStarted(true);
      const currentDir = lastProcessedDirection.current;
      if ((e.key === 'ArrowUp' || e.key === 'w') && currentDir.y === 0) setDirection({ x: 0, y: -1 });
      if ((e.key === 'ArrowDown' || e.key === 's') && currentDir.y === 0) setDirection({ x: 0, y: 1 });
      if ((e.key === 'ArrowLeft' || e.key === 'a') && currentDir.x === 0) setDirection({ x: -1, y: 0 });
      if ((e.key === 'ArrowRight' || e.key === 'd') && currentDir.x === 0) setDirection({ x: 1, y: 0 });
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStarted, isGameOver]);

  useEffect(() => {
    if (isGameOver || !gameStarted) {
      if (isGameOver && score > highScore) {
        setHighScore(score);
        localStorage.setItem(`snake-high-${difficulty}`, score.toString());
      }
      return;
    }
    const currentSpeed = SPEED_MAP[difficulty] - (activeEffects.speed > 0 ? 40 : 0);
    gameLoopRef.current = setInterval(moveSnake, Math.max(30, currentSpeed));
    return () => clearInterval(gameLoopRef.current!);
  }, [moveSnake, isGameOver, gameStarted, difficulty, score, activeEffects.speed]);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setScore(0);
    setIsGameOver(false);
    setGameStarted(true);
    setPowerUp(null);
    setActiveEffects({ speed: 0, multiplier: 0 });
    setFood({ x: 5, y: 5 });
  };

  return (
    <div className="game-container">
      <BackgroundMusic isPlaying={gameStarted && !isGameOver} difficulty={difficulty} />
      <div className="score-board">
        {difficulty} | SCORE: {score} | HIGH: {highScore}
      </div>
      {!gameStarted && !isGameOver && (
        <div className="difficulty-selector">
          {(['EASY', 'NORMAL', 'INSANE'] as Difficulty[]).map(d => (
            <button key={d} className={`difficulty-btn ${difficulty === d ? 'active' : ''}`} onClick={() => setDifficulty(d)}>{d}</button>
          ))}
        </div>
      )}
      {!gameStarted && !isGameOver && (
        <div className="game-over-overlay">
          <h1 style={{ color: 'var(--score-color)' }}>NEON SNAKE</h1>
          <p>PRESS ANY KEY TO START</p>
        </div>
      )}
      <div className={`game-board ${isGameOver ? 'dead' : ''}`}>
        {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
          const x = i % GRID_SIZE, y = Math.floor(i / GRID_SIZE);
          const isSnakeHead = snake[0].x === x && snake[0].y === y;
          const isSnakeBody = snake.slice(1).some(s => s.x === x && s.y === y);
          const isFood = food.x === x && food.y === y;
          const isPowerUp = powerUp?.pos.x === x && powerUp?.pos.y === y;

          return (
            <div key={i} className={`cell ${isSnakeHead ? 'snake-segment snake-head' : isSnakeBody ? 'snake-segment' : isFood ? 'food' : isPowerUp ? `power-up-${powerUp.type.toLowerCase()}` : ''}`} />
          );
        })}
      </div>
      {isGameOver && (
        <div className="game-over-overlay">
          <h1>GAME OVER</h1>
          <button className="restart-button" onClick={resetGame}>RESTART</button>
        </div>
      )}
      <div style={{ marginTop: '10px', display: 'flex', gap: '20px' }}>
        {activeEffects.speed > 0 && <span style={{ color: '#00ffea' }}>SPEED BOOST: {activeEffects.speed}</span>}
        {activeEffects.multiplier > 0 && <span style={{ color: '#ffea00' }}>2X MULTIPLIER: {activeEffects.multiplier}</span>}
      </div>
    </div>
  );
};

export default App;
