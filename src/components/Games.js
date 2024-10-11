import React, { useState, useEffect, useRef } from 'react';
import Map from './Map';
import usePlayer from './Player';
import asciiArt from '../assets/asciiArt';
import '../App.css';

const introText = [
  "A retro MUD-style adventure by Jared Menard",
  "**************************************************",
];

const Games = () => {
  const gameTextRef = useRef(null);
  const mapWidth = 10; // Adjust map size as needed
  const mapHeight = 10;

  // Initialize map
  const [gameMap] = useState(() => new Map(mapWidth, mapHeight));

  // Generate ASCII map
  const asciiMap = gameMap.generateAsciiMap();

  // Randomize starting room position using getRandomStartPosition from Map.js
  const randomStart = gameMap.getRandomStartPosition();

  // Initialize player at the randomized position
  const { position, move } = usePlayer(randomStart);

  // Get starting room
  const startingRoom = gameMap.getRoom(randomStart.x, randomStart.y);

  // State to hold the game history log
  const [gameHistory, setGameHistory] = useState([
    <pre key="ascii-art">{asciiArt}</pre>,
    '\u00A0',
    '\u00A0',
    ...introText,
    '\u00A0',
    '\u00A0',
    <pre key="ascii-map">{asciiMap}</pre>,
    '\u00A0',
    '\u00A0',
    `${startingRoom.name}`,  // Random starting room name
    '\u00A0', // Add separation between entering room and description
    startingRoom.description,
  ]);

  // Auto-scroll to bottom when text updates
  useEffect(() => {
    if (gameTextRef.current) {
      gameTextRef.current.scrollTop = gameTextRef.current.scrollHeight;
    }
  }, [gameHistory]);

  const handleMove = (direction) => {
    const newRoom = move(direction, gameMap);
    if (newRoom) {
      setGameHistory((prev) => [
        ...prev,
        '\u00A0', // First blank line for separation
        `You move ${direction}.`,
        `${newRoom.name}`,
        '\u00A0', // Add separation between name and description
        newRoom.description,
      ]);
    } else {
      setGameHistory((prev) => [
        ...prev,
        '\u00A0',
        '\u00A0',
        "You can't go that way.",
      ]);
    }
  };

  // Get valid exits for the current room
  const currentRoom = gameMap.getRoom(position.x, position.y);
  const directions = ['north', 'south', 'east', 'west'];

  return (
    <div>
      <div id="game-text" ref={gameTextRef}>
        {gameHistory.map((line, index) => (
          <div key={index}>{line}</div>
        ))}
      </div>

      <div className="button-container">
        {/* Direction Buttons */}
        <div id="button-group">
          {directions.map((direction) => (
            <button
              key={direction}
              onClick={() => handleMove(direction)}
              disabled={!!currentRoom.walls[direction]}
              className={!!currentRoom.walls[direction] ? 'inactive-button' : 'active-button'}
            >
              Go {direction.charAt(0).toUpperCase() + direction.slice(1)}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div id="action-button-group">
          <button className="inactive-button" disabled>Examine</button>
          <button className="inactive-button" disabled>Get</button>
          <button className="inactive-button" disabled>Attack</button>
          <button className="inactive-button" disabled>Talk</button>
        </div>
      </div>
    </div>
  );
};

export default Games;
