const gameCanvas = document.createElement("canvas");
gameCanvas.style = "position: fixed;";
gameCanvas.width = window.innerWidth;
gameCanvas.height = window.innerHeight;
document.body.appendChild(gameCanvas);
const ctx = gameCanvas.getContext("2d");

class Game {
    constructor() {
        this.score = 0;

    }
}

class Ball {

}
 
class Brick {
static colors = ["#0000FF", "#3333FF", "#6666FF", "#9999FF", "#FF0000"]
    constructor(hitPoints, xPosition, yPosition) {
        this.color = Brick.colors[hitPoints];
        
    }
}

class bottomMoveThing {
    constructor() {
        this.xPosition = 0.5; // Center Horizontally
        this.color = "blue";
    }

    update() {
        this.draw();
    }

    draw() {
        const bottomMoveThingWidth = gameCanvas.width * 0.1;
        const bottomMoveThingHeight = gameCanvas.height * 0.04;
        const xPixelPosition = (this.xPosition * gameCanvas.width) - (bottomMoveThingWidth / 2);
        const yPixelPosition = gameCanvas.height * 0.95;
        
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.fillRect(
            xPixelPosition,
            yPixelPosition,
            bottomMoveThingWidth,
            bottomMoveThingHeight
        );

    }
}


const thing = new bottomMoveThing() 
thing.update()



setInterval(() => loop(), 1000 / 60) // 60 FPS