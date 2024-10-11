// Room.js
class Room {
    constructor(x, y, type) {
      this.x = x;
      this.y = y;
      this.type = type;
      this.visited = false;
      this.walls = { north: true, south: true, east: true, west: true };
      this.name = '';
      this.description = '';
    }
  }
  
  export default Room;