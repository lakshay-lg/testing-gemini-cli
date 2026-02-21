import React, { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';

const GRID_SIZE = 20;
const INITIAL_SNAKE = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 },
];
const INITIAL_DIRECTION = { x: 0, y: -1 };
const INITIAL_SPEED = 150;

interface Point {
  x: number;
  y: number;
}

const playSound = (type: 'eat' | 'move' | 'gameover') => {
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
  } else if (type === 'move') {
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(100, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0.01, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.05);
  }
};

const BackgroundMusic: React.FC<{ isPlaying: boolean }> = ({ isPlaying }) => {
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (isPlaying) {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(40, audioCtx.currentTime); 
      
      // Simple rhythmic pulse
      const now = audioCtx.currentTime;
      for (let i = 0; i < 1000; i++) {
        oscillator.frequency.setValueAtTime(40, now + i * 2);
        oscillator.frequency.exponentialRampToValueAtTime(50, now + i * 2 + 0.5);
      }

      gainNode.gain.setValueAtTime(0.015, audioCtx.currentTime);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.start();

      audioCtxRef.current = audioCtx;
    } else {
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    }

    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, [isPlaying]);

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
  const [highScore, setHighScore] = useState(
    Number(localStorage.getItem('snake-high-score')) || 0
  );

  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

  const generateFood = useCallback((currentSnake: Point[]) => {
    let newFood: Point;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      // Ensure food doesn't spawn on snake
      if (!currentSnake.some((segment) => segment.x === newFood.x && segment.y === newFood.y)) {
        break;
      }
    }
    setFood(newFood);
  }, []);

  const moveSnake = useCallback(() => {
    if (isGameOver || !gameStarted) return;

    lastProcessedDirection.current = direction;

    setSnake((prevSnake) => {
      const head = prevSnake[0];
      const newHead = {
        x: head.x + direction.x,
        y: head.y + direction.y,
      };

      // Check collision with walls
      if (
        newHead.x < 0 ||
        newHead.x >= GRID_SIZE ||
        newHead.y < 0 ||
        newHead.y >= GRID_SIZE
      ) {
        setIsGameOver(true);
        playSound('gameover');
        return prevSnake;
      }

      // Check collision with self
      if (prevSnake.some((segment) => segment.x === newHead.x && segment.y === newHead.y)) {
        setIsGameOver(true);
        playSound('gameover');
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Check if food eaten
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore((prev) => prev + 10);
        playSound('eat');
        generateFood(newSnake);
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [direction, food, generateFood, isGameOver, gameStarted]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameStarted && !isGameOver) setGameStarted(true);
      const currentDir = lastProcessedDirection.current;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
          if (currentDir.y === 0) setDirection({ x: 0, y: -1 });
          break;
        case 'ArrowDown':
        case 's':
          if (currentDir.y === 0) setDirection({ x: 0, y: 1 });
          break;
        case 'ArrowLeft':
        case 'a':
          if (currentDir.x === 0) setDirection({ x: -1, y: 0 });
          break;
        case 'ArrowRight':
        case 'd':
          if (currentDir.x === 0) setDirection({ x: 1, y: 0 });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStarted, isGameOver]);

  useEffect(() => {
    if (isGameOver || !gameStarted) {
      if (isGameOver && score > highScore) {
        setHighScore(score);
        localStorage.setItem('snake-high-score', score.toString());
      }
      return;
    }

    gameLoopRef.current = setInterval(moveSnake, INITIAL_SPEED - Math.min(score / 5, 100));
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [moveSnake, isGameOver, score, highScore, gameStarted]);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setScore(0);
    setIsGameOver(false);
    setGameStarted(true);
    setFood({ x: 5, y: 5 });
  };

  return (
    <div className="game-container">
      <BackgroundMusic isPlaying={gameStarted && !isGameOver} />
      <div className="score-board">
        SCORE: {score} | HIGH SCORE: {highScore}
      </div>
      {!gameStarted && !isGameOver && (
        <div className="game-over-overlay">
          <h1 style={{ color: 'var(--score-color)' }}>NEON SNAKE</h1>
          <p>PRESS ANY KEY TO START</p>
        </div>
      )}
      <div className="game-board">
        {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
          const x = i % GRID_SIZE;
          const y = Math.floor(i / GRID_SIZE);
          const isSnakeHead = snake[0].x === x && snake[0].y === y;
          const isSnakeBody = snake.slice(1).some((s) => s.x === x && s.y === y);
          const isFood = food.x === x && food.y === y;

          return (
            <div
              key={i}
              className={`cell ${isSnakeHead ? 'snake-segment snake-head' : isSnakeBody ? 'snake-segment' : isFood ? 'food' : ''}`}
            />
          );
        })}
      </div>
      {isGameOver && (
        <div className="game-over-overlay">
          <h1>GAME OVER</h1>
          <button className="restart-button" onClick={resetGame}>
            RESTART
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
