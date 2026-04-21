import { isMobile, handleResize } from "./utils.js";
import Network from "./brain.js";

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
        for(let layer = 0; layer < 5; layer++) { 
            this.bricks[layer] = [];
            for(let gridNumber = 0; gridNumber < 10; gridNumber++) {
                this.bricks[layer][gridNumber] = new Brick(layer, gridNumber);
            }
        }
        const keys = new Set();

        // window.addEventListener("keydown", (event) => {
        //     keys.add(event.key);
        //     this.updateDirection();
        // });

        // window.addEventListener("keyup", (event) => {
        //     keys.delete(event.key);
        //     this.updateDirection();
        // });

        // this.updateDirection = () => {
        //     if (keys.has("ArrowLeft") && !keys.has("ArrowRight")) {
        //         this.paddle.shouldMove = true;
        //         this.direction = -0.015;
        //     } else if (keys.has("ArrowRight") && !keys.has("ArrowLeft")) {
        //         this.paddle.shouldMove = true;
        //         this.direction = 0.015;
        //     } else {
        //         this.paddle.stop();
        //     }
        // };
        this.ball = new Ball()
    }

    update() {
        const { mobile, width, height } = handleResize();
        gameCanvas.width = width;
        gameCanvas.height = height;

        ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
        this.paddle.update();
        for(let layer = 0; layer < this.bricks.length; layer++) {
            for(let rowNumber = 0; rowNumber < this.bricks[layer].length; rowNumber++) {
                this.bricks[layer][rowNumber].draw()
            }
        }
        this.ball.update(this.bricks, this.paddle);

        this.paddle.decide(this.ball, this.bricks)
    }

    ballFailure() {
        this.ball = new Ball();
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
        this.radius = gameCanvas.width * 0.01;
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

    resetBall() {
        game.ballFailure();
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
        const withinYRange = (paddleStartYPixelPosition < ballYPixelPostion + this.radius) && (paddleEndYPixelPosition > ballYPixelPostion + this.radius);


        if(withinXRange && withinYRange) {
            const middleOfPaddlePixel = (paddleStartXPixelPosition + paddleEndXPixelPosition) / 2;
            if(middleOfPaddlePixel < ballXPixelPosition) { // Means ball hit right side of paddle
                if(this.xDirection < 0) {// ball going left
                    this.xDirection *= -1;
                }
                this.xDirection *= 1;
                console.log("Hit Right!")

                this.randomSlopeRise = 0.008 * ((ballXPixelPosition - middleOfPaddlePixel) / (paddleEndXPixelPosition - middleOfPaddlePixel)) + 0.002;
                this.randomSlopeRun = (0.008 - this.randomSlopeRise) + 0.004;
            }
            if(middleOfPaddlePixel > ballXPixelPosition) { // Means ball hit left side of paddle 
                console.log("Hit Left!")
                if(this.xDirection > 0) { // ball going right 
                    this.xDirection *= -1; 
                }
                this.randomSlopeRise = 0.008 * ((ballXPixelPosition - paddleStartXPixelPosition) / (middleOfPaddlePixel - paddleStartXPixelPosition)) + 0.002;
                this.randomSlopeRun = (0.008 - this.randomSlopeRise) + 0.004;
                this.xDirection *= 1
            }
            this.yDirection *= -1;
        }

        // Start checking brick collisions
        for(let layer = 0; layer < bricks.length; layer++) {
            for(let rowNumber = 0; rowNumber < bricks[layer].length; rowNumber++) {
                const brick = bricks[layer][rowNumber];
                if (brick.hitPoints < 0) {
                    continue;
                }
                // Calculate start of xPixel Pos (e.x, starts at 100 pixels)
                const brickStartXPixelPosition = brick.xPixelPosition;
                // Calculate where it ends (e.x, ends at pixel 110)
                const brickEndXPixelPosition = brickStartXPixelPosition + brick.brickWidth;
                // Checks if it falls with the range (e.x, 100-110);
                const ballWithinXBrickRange = ballXPixelPosition + this.radius > brickStartXPixelPosition && ballXPixelPosition - this.radius < brickEndXPixelPosition;
                
                const brickStartYPixelPosition = brick.yPixelPosition;
                const brickEndYPixelPosition = brickStartYPixelPosition + brick.brickHeight;
                const ballWithinYBrickRange = brickStartYPixelPosition < ballYPixelPostion + this.radius && ballYPixelPostion - this.radius < brickEndYPixelPosition;

                // console.log(`X: ${ballWithinXBrickRange} | Y: ${ballWithinYBrickRange}`)
                if(ballWithinXBrickRange && ballWithinYBrickRange) { // Check if it falls within x range
                    const hitSide = ballYPixelPostion - this.radius > brickStartYPixelPosition + 3  && ballYPixelPostion + this.radius < brickEndYPixelPosition -3 // the +- 3 is a pixel buffer
                    if(hitSide) {
                        this.xDirection *= -1;
                    } else {
                        this.yDirection *= -1;
                    }
                    // this.xDirection *= -1;
                    brick.hit();
                }
        }
        }

        if(this.yPosition <= 0) { // IF OVER TOP (need to add radius check)
            this.yDirection *= -1;
            console.log(`New Y Dir: ${this.yDirection} | Y POS: ${this.yPosition}`)
            return true;
        }
        if(this.yPosition >= 1) { // IF OVER BOTTOM 
            this.resetBall();
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
            this.radius,
            0,
            Math.PI * 2
        )
        ctx.stroke();
        ctx.fill();
    }
}
 
class Brick {
static colors = ["#C0C0FF", "#9999FF", "#6666FF", "#3333FF", "#0000FF"];
    constructor(layer, gridNumber) {
        this.hitPoints = 4 - layer;
        this.gridLayer = layer;
        this.gridNumber = gridNumber;

    }

    hit() {
        this.hitPoints--;
        return;
    }

    draw() {
        if(this.hitPoints < 0) {
            return;
        }
        const Q1Percent = (gameCanvas.width * 0.1); // Define left limit 0.2
        const Q3Percent = (gameCanvas.width * 0.8) + Q1Percent; // Define right limit 0.8
        const QuartilePixelRange = Q3Percent - Q1Percent; // Bricks will go within this range
        this.xPixelPosition = this.gridNumber * (QuartilePixelRange / 10) + Q1Percent; // 

        // this.xPixelPostition = this.gridNumber * (gameCanvas.width / 10) ;
        
        const marginOf10 = gameCanvas.height * 0.1; 
        this.yPixelPosition = marginOf10 + ((gameCanvas.height / 20)* this.gridLayer)
        this.brickHeight = gameCanvas.height * 0.045;
        this.brickWidth = gameCanvas.width * 0.075;

        ctx.beginPath();
        ctx.fillStyle = Brick.colors[this.hitPoints];
        ctx.fillRect(
            this.xPixelPosition,
            this.yPixelPosition,
            this.brickWidth,
            this.brickHeight
        );
        // ctx.fillStyle = "yellow";
        // ctx.fillRect(
        //     xPixelPosition,
        //     yPixelPosition,
        //     20,
        //     this.brickHeight
        // );
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

        this.moveSpeed = 0.015;
        this.brain = new Network(8);

    }
    // Paddle = 0.45 

    move(direction) {
        if(this.xPosition + this.moveSpeed > 0.04 && this.xPosition + this.moveSpeed < 0.96) { // Basically
            let multiplier = 1;
            if(direction === "left") {
                multiplier *= -1;
            }
                this.xPosition += this.moveSpeed * multiplier;
                console.log(this.xPosition)
                return;
            }
        }


    decide(ball, bricks) {
        // Initially lets just focus on ball state so we hit (not focused on accuracy atm)

        /* State variables that are important :
        Paddle xPos,
        Ball xPos,
        Ball yPos,
        Ball X Direction (Left or Right).
        Ball Y Direction (Up or Down)
        Ball Slope Rise,
        Ball Slope Run - Add Bricks later
        
        
        */
        const inputs = [this.xPosition, ball.xPosition, ball.yPosition, ball.xDirection, ball.yDirection, ball.randomSlopeRise, ball.randomSlopeRun];

        const qValues = this.brain.decide(inputs);
        console.log(qValues);

        const bestAction = qValues.indexOf(Math.max(...qValues));

        if(bestAction === 0) {
            this.move("left")
        } else if (bestAction === 1) {
            // Do nothing
        } else {
            this.move("right")
        }

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