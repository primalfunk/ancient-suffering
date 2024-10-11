import Room from './Room';
import { shuffle } from '../utils/utils.js';
import { generatePrecomputedDescriptions, resetUsedElements, generateRoomDetails } from '../utils/RoomDescriptionGenerator';

class Map {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.grid = [];
    this.roomCounters = {};  // Track room counts by type
    this.roomTypes = ['castle', 'forest', 'underground', 'town', 'mountain', 'sanctuary', 'wetland', 'vale', 'abyss', 'labyrinth', 'haven'];
    this.availableRoomTypes = shuffle([...this.roomTypes]);  // Shuffle room types for randomness

    resetUsedElements(); // Reset for non-repeating description elements
    this.generateMap();

    // Log the number of rooms with valid descriptions
    this.logRoomDescriptionStats();
  }

  getRoomDescription(x, y) {
    const room = this.grid[y][x];
    
    // If the room already has a description, return it
    if (room.description) {
      return room.description;
    }
    
    // Otherwise, generate the description lazily
    const roomDetails = generateRoomDetails(room.type);
    
    // Store the description so it's not recalculated
    room.description = roomDetails.description;
    return room.description;
  }

  generateMap() {
    // Initialize grid and precompute descriptions
    for (let y = 0; y < this.height; y++) {
        this.grid[y] = Array(this.width).fill(null);
    }

    const precomputedDescriptions = {};
    this.roomTypes.forEach(type => {
        precomputedDescriptions[type] = generatePrecomputedDescriptions(type);
    });

    // Use all room types available
    const totalRooms = this.width * this.height;
    const roomsPerType = Math.floor(totalRooms / this.roomTypes.length);
    let leftoverRooms = totalRooms % this.roomTypes.length;

    // Create zones using all room types
    const zones = this.createZones(roomsPerType, leftoverRooms, totalRooms);

    // Assign room types to zones
    zones.forEach((zone) => {
        // Safeguard against empty availableRoomTypes by falling back to a random roomType
        const roomType = this.availableRoomTypes.pop() || this.roomTypes[Math.floor(Math.random() * this.roomTypes.length)];
        this.assignRoomTypeToZone(zone, roomType, precomputedDescriptions[roomType]);
    });

    // Make sure all rooms are initialized before carving passages
    this.ensureAllRoomsInitialized();

    // Start carving passages
    this.carvePassagesFrom(0, 0);
}

ensureAllRoomsInitialized() {
    let unassignedRooms = 0;
    for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
            if (!this.grid[y][x]) {
                unassignedRooms++;
                const roomType = this.availableRoomTypes[0];  // Assign the first available type if missing
                this.grid[y][x] = new Room(x, y, roomType);
                this.grid[y][x].name = `${roomType.charAt(0).toUpperCase() + roomType.slice(1)} ${String.fromCharCode(65 + x + y)}`;
                console.log(`Initialized missing room at (${x}, ${y}) with type ${roomType}`);
            }
        }
    }
    console.log(`Total unassigned rooms initialized: ${unassignedRooms}`);
}

  createZones(roomsPerType, leftoverRooms, minZones) {
    let zones = [];
    let currentX = 0;
    let currentY = 0;
    let totalRoomsAssigned = 0;

    // Calculate approximate size of each zone
    const zoneWidth = Math.floor(this.width / Math.sqrt(minZones));
    const zoneHeight = Math.floor(this.height / Math.sqrt(minZones));

    for (let i = 0; i < minZones; i++) {
        let adjustedZoneHeight = zoneHeight;

        // Distribute any leftover rooms by slightly increasing the zone size
        if (leftoverRooms > 0) {
            adjustedZoneHeight += 1;
            leftoverRooms--;
        }

        // Ensure zones don't overlap map boundaries
        if (currentX + zoneWidth > this.width) {
            currentX = 0;
            currentY += adjustedZoneHeight;
        }

        if (currentY + adjustedZoneHeight > this.height) {
            adjustedZoneHeight = this.height - currentY;  // Ensure we don't exceed height
        }

        const zone = {
            startX: currentX,
            startY: currentY,
            endX: currentX + zoneWidth - 1,
            endY: currentY + adjustedZoneHeight - 1,
        };

        const roomsInZone = (zone.endX - zone.startX + 1) * (zone.endY - zone.startY + 1);
        totalRoomsAssigned += roomsInZone;
        console.log(`Created zone ${i + 1}: ${JSON.stringify(zone)}, covering ${roomsInZone} rooms.`);

        zones.push(zone);

        // Move to the next zone position
        currentX += zoneWidth;
    }

    console.log(`Total rooms assigned to zones: ${totalRoomsAssigned}`);
    return zones;
}

assignRoomTypeToZone(zone, roomType) {
    let roomLetterIndex = 0;

    console.log(`Assigning room type: ${roomType} to zone: ${JSON.stringify(zone)}`);
    for (let y = zone.startY; y <= zone.endY; y++) {
        for (let x = zone.startX; x <= zone.endX; x++) {
            const roomLetter = String.fromCharCode(65 + roomLetterIndex);
            this.grid[y][x] = new Room(x, y, roomType);
            this.grid[y][x].name = `${roomType.charAt(0).toUpperCase() + roomType.slice(1)} ${roomLetter}`;
            console.log(`Room assigned at (${x}, ${y}) with type ${roomType} and name ${this.grid[y][x].name}`);

            // Add walls and track initialization
            if (!this.grid[y][x].walls) {
                this.grid[y][x].walls = { north: true, south: true, east: true, west: true };
            }

            // Generate room details and handle missing data
            let roomDetails = generateRoomDetails(roomType);
            if (!roomDetails || !roomDetails.description) {
                roomDetails = { name: "Mysterious Room", description: "The description is missing." };
                console.log("Failed to generate room details, using fallback.");
            }
            this.grid[y][x].description = roomDetails.description;

            roomLetterIndex++;
        }
    }
}
  carvePassagesFrom(cx, cy) {
    // Guard clause: Check if the room exists before proceeding
    const currentRoom = this.grid[cy][cx];
    if (!currentRoom) return;  // Prevent accessing null room

    let directions = ['north', 'south', 'east', 'west'];
    directions = shuffle(directions);

    currentRoom.visited = true;

    for (let direction of directions) {
      let nx = cx;
      let ny = cy;

      if (direction === 'north') ny -= 1;
      else if (direction === 'south') ny += 1;
      else if (direction === 'east') nx += 1;
      else if (direction === 'west') nx -= 1;

      if (ny >= 0 && ny < this.height && nx >= 0 && nx < this.width && !this.grid[ny][nx]?.visited) {
        currentRoom.walls[direction] = false;
        const opposite = this.getOppositeDirection(direction);
        this.grid[ny][nx].walls[opposite] = false;

        this.carvePassagesFrom(nx, ny);
      }
    }
  }

  getOppositeDirection(direction) {
    const opposites = {
      north: 'south',
      south: 'north',
      east: 'west',
      west: 'east',
    };
    return opposites[direction];
  }

  generateAsciiMap() {
    let asciiMap = '';

    for (let y = 0; y < this.height; y++) {
        let roomRow = '';
        let connectionRow = '';

        for (let x = 0; x < this.width; x++) {
            const room = this.grid[y][x];

            // Safeguard: If the room is undefined or its type is missing, skip it or assign a default
            if (!room || !room.type) {
                console.log(`Room at (${x}, ${y}) is missing a type. Skipping.`);
                roomRow += '?';  // Add a placeholder for missing rooms
                continue;
            }

            const roomTypeLetter = room.type.charAt(0).toUpperCase();
            roomRow += roomTypeLetter;

            if (room.walls['east'] === false) {
                roomRow += '-';
            } else {
                roomRow += ' ';
            }

            if (x === this.width - 1) {
                roomRow += ' ';
            }

            if (y < this.height - 1) {
                const southConnection = room.walls['south'] === false ? '|' : ' ';
                connectionRow += southConnection;

                if (room.walls['east'] === false && x < this.width - 1) {
                    connectionRow += ' ';
                } else {
                    connectionRow += ' ';
                }
            }
        }

        asciiMap += roomRow + '\n';

        if (y < this.height - 1) {
            asciiMap += connectionRow + '\n';
        }
    }

    return asciiMap;
}


  getRoom(x, y) {
    return this.grid[y][x];
  }

  getRandomStartPosition() {
    let randomX = Math.floor(Math.random() * this.width);
    let randomY = Math.floor(Math.random() * this.height);

    return { x: randomX, y: randomY };
  }

  // Function to validate room descriptions and log counts
  logRoomDescriptionStats() {
    let roomsWithDescriptions = 0;
    let roomsWithoutDescriptions = 0;

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const room = this.grid[y][x];
        if (room && room.description) {
          roomsWithDescriptions++;
        } else {
          roomsWithoutDescriptions++;
        }
      }
    }

    console.log(`Rooms with descriptions: ${roomsWithDescriptions}`);
    console.log(`Rooms without descriptions: ${roomsWithoutDescriptions}`);
  }
}

export default Map;
