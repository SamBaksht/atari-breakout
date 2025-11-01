import { isMobile, handleResize } from "./utils.js";


const gameCanvas = document.createElement("canvas");
gameCanvas.style = "position: fixed;";
gameCanvas.width = window.innerWidth;
gameCanvas.height = window.innerHeight;
document.body.appendChild(gameCanvas);
const ctx = gameCanvas.getContext("2d");
if(isMobile()) {
    console.log("This device is mobile")
}

class Game {
    constructor() {
        this.score = 0;
        this.paddle = new Paddle(); // Creates the main paddle that you use
        this.direction = 0; // paddle direction & speed

        this.bricks = [];
        for(let layer = 4; layer >= 0; layer--) {
            for(let gridNumber = 0; gridNumber < 10; gridNumber++) {
                this.bricks.push(new Brick(layer, gridNumber))
            }
        }
        const keys = new Set();

        window.addEventListener("keydown", (event) => {
            keys.add(event.key);
            this.updateDirection();
        });

        window.addEventListener("keyup", (event) => {
            keys.delete(event.key);
            this.updateDirection();
        });

        this.updateDirection = () => {
            if (keys.has("ArrowLeft") && !keys.has("ArrowRight")) {
                this.paddle.shouldMove = true;
                this.direction = -0.015;
            } else if (keys.has("ArrowRight") && !keys.has("ArrowLeft")) {
                this.paddle.shouldMove = true;
                this.direction = 0.015;
            } else {
                this.paddle.stop();
            }
        };
        this.ball = new Ball()
    }

    update() {
        const { mobile, width, height } = handleResize();
        gameCanvas.width = width;
        gameCanvas.height = height;

        ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
        this.paddle.move(this.direction);
        this.paddle.update()
        for(let brick of this.bricks) {
            brick.draw()
        }
        this.ball.update(this.bricks, this.paddle);
    }
}

class Ball {
    // static maxSpeed = 0.0065 - 0.0005; 

    constructor() {
        this.gravity = 1;
        this.horizontalVelocity = 0;
        this.xPosition = 0.5;
        this.yPosition = 0.5; 
        this.xDirection = (Math.random() * 2) - 1; // x > 0 means right, x < 0 means left
        this.yDirection = -1;
        // We want a max run of 0.01 and a min of 0.002 -> rise will depend on the x (min 0.002)
        this.randomSlopeRun = (Math.random() * 0.008) + 0.002;
        this.randomSlopeRise = (0.01 - this.randomSlopeRun) + 0.002;


    }
    
    update(bricks, paddle) {
        this.checkCollision(bricks, paddle);

        if(this.xDirection < 0) {
            this.xPosition -= this.randomSlopeRun;
        } else if (this.xDirection > 0) {
            this.xPosition += this.randomSlopeRun;
        }
        if (this.yDirection <= 0) {
            this.yPosition += this.randomSlopeRise;
        } else if (this.yDirection > 0) {
            this.yPosition -= this.randomSlopeRise;
        }

        this.draw()
    }

    checkCollision(bricks, paddle) {
        // Pixel coordinate points of the ball
        const ballXPixelPosition = this.xPosition * gameCanvas.width;
        const ballYPixelPostion = this.yPosition * gameCanvas.height;
        
        // Calculate if the ball falls within the X pixel range of the paddle
        const paddleStartXPixelPosition = paddle.xPosition * gameCanvas.width - (paddle.paddleWidth / 2);
        const paddleEndXPixelPosition = paddleStartXPixelPosition + paddle.paddleWidth;
        const withinXRange = (paddleStartXPixelPosition < ballXPixelPosition) && (paddleEndXPixelPosition > ballXPixelPosition);
        
        // Calculate if the balls falls within the Y pixel range of the paddle
        const paddleStartYPixelPosition = paddle.yPixelPosition;
        const paddleEndYPixelPosition = paddleStartYPixelPosition + paddle.paddleHeight;
        const withinYRange = (paddleStartYPixelPosition < ballYPixelPostion) && (paddleEndYPixelPosition > ballYPixelPostion);


        if(withinXRange && withinYRange) {
            console.log("Hit paddle!")
            const middleOfPaddlePixel = (paddleStartXPixelPosition + paddleEndXPixelPosition) / 2;
            if(middleOfPaddlePixel < ballXPixelPosition && this.xDirection < 0) { // Means ball hit right side of paddle and direction is going left
                this.xDirection *= -1;
                console.log("Passed");
            }
            if(middleOfPaddlePixel > ballXPixelPosition && this.xDirection > 0) { // Means ball hit left side of paddle and direction is going right
                this.xDirection *= -1;
            }
            this.yDirection *= -1;
        }

        // Start checking brick collisions
        for(let brick of bricks) {
            // Calculate start of xPixel Pos (e.x, starts at 100 pixels)
            const brickStartXPixelPosition = brick.gridNumber * (gameCanvas.width / 10);
            // Calculate where it ends (e.x, ends at pixel 110)
            const brickEndXPixelPosition = brickStartXPixelPosition + brick.brickWidth;
            // Checks if it falls with the range (e.x, 100-110);
            const ballWithinXBrickRange = ballXPixelPosition > brickStartXPixelPosition && ballXPixelPosition < brickEndXPixelPosition;
            
            const brickStartYPixelPosition = brick.gridLayer * (gameCanvas.height / 10);
            const brickEndYPixelPosition = brickStartYPixelPosition + brick.brickHeight;
            const ballWithinYBrickRange = brickStartYPixelPosition < ballYPixelPostion && ballYPixelPostion < brickEndYPixelPosition;

            // console.log(`X: ${ballWithinXBrickRange} | Y: ${ballWithinYBrickRange}`)
            if(ballWithinXBrickRange && ballWithinYBrickRange) { // Check if it falls within x range
                this.yDirection *= -1;
                this.xDirection *= -1;
                brick.hit();
            }
        }

        if(this.yPosition >= 1 || this.yPosition <= 0) { // IF OVER TOP / BOTTOM OF SCREN
            this.yDirection *= -1;
            console.log(`New Y Dir: ${this.yDirection} | Y POS: ${this.yPosition}`)
            return true;
        } 
        if(this.xPosition >= 1 || this.xPosition <= 0) { // IF OVER LEFT / RIGHT OF SCREEN
            this.xDirection *= -1;
            return true;
        }
        return false;
    }

    adjustDirection() {
        
    }
    draw() {
        const xPixelPosition = this.xPosition * gameCanvas.width;
        const yPixelPosition = this.yPosition * gameCanvas.height;
        ctx.beginPath();
        ctx.fillStyle = 'white';
        ctx.arc(
            xPixelPosition,
            yPixelPosition,
            gameCanvas.width * 0.01,
            0,
            Math.PI * 2
        )
        ctx.stroke();
        ctx.fill();
    }
}
 
class Brick {
static colors = ["#FF0000", "#9999FF", "#6666FF", "#3333FF", "#0000FF"];
    constructor(hitPoints, gridNumber) {
        this.hitPoints = hitPoints;
        this.gridLayer = hitPoints;
        this.gridNumber = gridNumber;

    }

    hit() {
        this.hitPoints--;
        return;
    }

    draw() {
        const xPixelPosition = this.gridNumber * (gameCanvas.width / 10);
        const yPixelPosition = this.gridLayer * (gameCanvas.height / 10);
        this.brickHeight = gameCanvas.height * 0.05;
        this.brickWidth = gameCanvas.width * 0.08;

        ctx.beginPath();
        ctx.fillStyle = Brick.colors[this.hitPoints];
        ctx.fillRect(
            xPixelPosition,
            yPixelPosition,
            this.brickWidth,
            this.brickHeight
        );
        ctx.fillStyle = "yellow";
        ctx.fillRect(
            xPixelPosition,
            yPixelPosition,
            20,
            this.brickHeight
        );
        ctx.closePath();
        return;
    }
}

class Paddle {
    constructor() {
        this.xPosition = 0.5; // Center Horizontally
        this.color = "blue";
        this.yPixelPosition = gameCanvas.height * 0.95;
        this.paddleWidth = gameCanvas.width * 0.1;
        this.paddleHeight = gameCanvas.height * 0.04;
        this.shouldMove = false;

    }
    // Paddle = 0.45 

    move(direction) {
        if(this.xPosition + direction > 0.04 && this.xPosition + direction < 0.96) { // Basically 
            if(this.shouldMove) {
                this.xPosition += direction;
                console.log(this.xPosition)
                return;
            }
        }
        this.stop();
    }

    stop() {
        this.shouldMove = false;
    }
    update() {
        this.draw();
    }

    draw() {
        this.paddleWidth = gameCanvas.width * 0.1;
        this.paddleHeight = gameCanvas.height * 0.04;
        const xPixelPosition = (this.xPosition * gameCanvas.width) - (this.paddleWidth / 2);
        this.yPixelPosition = gameCanvas.height * 0.95;
        
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.fillRect(
            xPixelPosition,
            this.yPixelPosition,
            this.paddleWidth,
            this.paddleHeight
        );
        ctx.closePath();
    }
}


const game = new Game();

function loop() {
    game.update();
}

setInterval(() => loop(), 1000 / 60) // 60 FPS