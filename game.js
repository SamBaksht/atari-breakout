const gameCanvas = document.createElement("canvas");
gameCanvas.style = "position: fixed;";
gameCanvas.width = window.innerWidth;
gameCanvas.height = window.innerHeight;
document.body.appendChild(gameCanvas);
const ctx = gameCanvas.getContext("2d");

class Game {
    constructor() {
        this.score = 0;
        this.paddle = new Paddle();

        this.bricks = [];
        for(let layer = 4; layer >= 0; layer--) {
            for(let gridNumber = 0; gridNumber < 10; gridNumber++) {
                this.bricks.push(new Brick(layer, gridNumber))
            }
        }
        window.addEventListener("keydown", (event) => {
            if (event.key === "ArrowLeft" && this.paddle.xPosition > 0.1) {
                this.paddle.xPosition -= 0.05;
            } else if (event.key === "ArrowRight" && this.paddle.xPosition < 0.95) {
                this.paddle.xPosition += 0.05;
            }
        });
    }

    update() {
        gameCanvas.width = window.innerWidth;
        gameCanvas.height = window.innerHeight;

        ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
        this.paddle.update()
        for(let brick of this.bricks) {
            brick.draw()
        }
    }
}

class Ball {
    constructor() {
        
    }
}
 
class Brick {
static colors = ["#FF0000", "#9999FF", "#6666FF", "#3333FF", "#0000FF"];
    constructor(hitPoints, gridNumber) {
        this.color = Brick.colors[hitPoints];
        this.hitPoints = hitPoints;
        this.gridNumber = gridNumber;

    }

    draw() {
        const xPixelPosition = this.gridNumber * (gameCanvas.width / 10)
        const yPixelPosition = this.hitPoints * (gameCanvas.height / 10)
        const brickHeight = gameCanvas.height * 0.05;
        const brickWidth = gameCanvas.width * 0.08

        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.fillRect(
            xPixelPosition,
            yPixelPosition,
            brickWidth,
            brickHeight
        );
        ctx.closePath();

    }
}

class Paddle {
    constructor() {
        this.xPosition = 0.5; // Center Horizontally
        this.color = "blue";
    }

    update() {
        this.draw();
    }

    draw() {
        const paddleWidth = gameCanvas.width * 0.1;
        const paddleHeight = gameCanvas.height * 0.04;
        const xPixelPosition = (this.xPosition * gameCanvas.width) - (paddleWidth / 2);
        const yPixelPosition = gameCanvas.height * 0.95;
        
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.fillRect(
            xPixelPosition,
            yPixelPosition,
            paddleWidth,
            paddleHeight
        );
        ctx.closePath();
    }
}


const game = new Game();

function loop() {
    game.update();
}

setInterval(() => loop(), 1000 / 60) // 60 FPS