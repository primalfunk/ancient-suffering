// Player.js
import { useState } from 'react';

function usePlayer(initialPosition) {
  const [position, setPosition] = useState(initialPosition);

  const move = (direction, map) => {
    let { x, y } = position;
    const currentRoom = map.getRoom(x, y);

    if (!currentRoom.walls[direction]) {
      if (direction === 'north') y -= 1;
      else if (direction === 'south') y += 1;
      else if (direction === 'east') x += 1;
      else if (direction === 'west') x -= 1;

      setPosition({ x, y });
      return map.getRoom(x, y);
    } else {
      return null; // Movement blocked
    }
  };

  return { position, move };
}

export default usePlayer;
