import roomDescriptions from '../data/rooms.json';
import { shuffle } from '../utils/utils';

// Track used elements globally across the map
const usedElements = {
  base: new Set(),
  scenery: new Set(),
  atmosphere: new Set(),
};

export function generateRoomDetails(type) {
  const roomType = type ? roomDescriptions[type.toLowerCase()] : undefined;
  if (!roomType) {
      console.error(`Room type ${type} not recognized!`);
      return { name: "Unknown Room", description: "This room type is not recognized." };
  }

  // Randomly select base, scenery, and atmosphere elements without reuse
  const base = selectUniqueElement(roomType.base, 'base');
  const scenery = selectUniqueElement(roomType.scenery, 'scenery');
  const atmosphere = selectUniqueElement(roomType.atmosphere, 'atmosphere');

  // If any part of the description is missing, log the issue
  if (!base || !scenery || !atmosphere) {
      console.error(`Description generation failed for room type: ${type}`);
  }

  const description = `${base} ${scenery} ${atmosphere}`;
  const roomName = generateRoomName(base, scenery);

  return { name: roomName, description };
}

export function generatePrecomputedDescriptions(roomType) {
  const baseOptions = roomDescriptions[roomType.toLowerCase()].base;
  const sceneryOptions = roomDescriptions[roomType.toLowerCase()].scenery;
  const atmosphereOptions = roomDescriptions[roomType.toLowerCase()].atmosphere;

  const combinations = [];
  for (const base of baseOptions) {
      for (const scenery of sceneryOptions) {
          for (const atmosphere of atmosphereOptions) {
              combinations.push({ base, scenery, atmosphere });
          }
      }
  }

  // Shuffle combinations to ensure randomness
  return shuffle(combinations.length > 0 ? combinations : [{ base: "Unknown", scenery: "Unseen", atmosphere: "Silent" }]);
}
// Helper function to select unique element and track used values
function selectUniqueElement(array, type) {
  let choice;
  do {
    choice = randomChoice(array);
  } while (usedElements[type].has(choice));
  usedElements[type].add(choice);
  return choice;
}

// Generate more unique room names by combining base and scenery elements
function generateRoomName(base, scenery) {
  // Split base and scenery into words safely
  const baseWords = base.split(' ');
  const sceneryWords = scenery.split(' ');

  // Choose safe parts for the name, fallback to "Mysterious" or "Ancient" if no valid part found
  const basePart = baseWords[0] || "Mysterious";  // Fallback to 'Mysterious' if the base is empty
  const sceneryPart = sceneryWords[1] || "Ancient"; // Fallback to 'Ancient' if scenery is too short

  // Combine the two parts into a room name
  return `${basePart} ${sceneryPart} Chamber`;
}

// Helper function to randomly select an item from an array
function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

export function resetUsedElements() {
  usedElements.base.clear();
  usedElements.scenery.clear();
  usedElements.atmosphere.clear();
}