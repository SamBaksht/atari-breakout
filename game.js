import { isMobile, handleResize } from "./utils.js";
import Network from "./brain.js";
import Buffer from "./replayBuffer.js";

const gameCanvas = document.createElement("canvas");
gameCanvas.style = "position: absolute;";
gameCanvas.width = window.innerWidth;
gameCanvas.height = window.innerHeight;
document.body.appendChild(gameCanvas);




const ctx = gameCanvas.getContext("2d");
if(isMobile()) {
    console.log("This device is mobile")
}

const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

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
                this.paddle.move("left")
            } else if (keys.has("ArrowRight") && !keys.has("ArrowLeft")) {
                this.paddle.move("right")
            }
        };
        this.ball = new Ball()
    }

    adjustSizes() {
        gameCanvas.width = window.innerWidth;
        gameCanvas.height = window.innerHeight;

        console.log("Sizes Adjusted")
    }
    update() {
        ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
        this.paddle.update();
        for(let layer = 0; layer < this.bricks.length; layer++) {
            for(let rowNumber = 0; rowNumber < this.bricks[layer].length; rowNumber++) {
                this.bricks[layer][rowNumber].draw()
            }
        }
        this.paddle.decide(this.ball, this.bricks)
    }

    ballFailure() {
        for (let brick of this.bricks.flat()) {
            brick.reset();
        }
        this.paddle.newEpisode();
    }
}

class Ball {
    // static maxSpeed = 0.0065 - 0.0005; 

    constructor() {
        this.setupBall()
    }

    setupBall() {
        this.xPosition = 0.5;
        this.yPosition = 0.5;
        // We want a max rise of 0.01 and a min of -0.01 ; This needs to start as negative 
        // When we start we set a default min of 0.3 rise
        this.randomSlopeRise = clamp(Math.abs((Math.random() * 0.02) - 0.01), 0.003, 0.008) * -1;
        // a max of 0.01 and min of -0.01

        // -1 or 1 to determine start direction
        const randInt = Math.random() < 0.5 ? -1 : 1;
   
        this.randomSlopeRun = (0.01 - Math.abs(this.randomSlopeRise)) * randInt;
        this.radius = gameCanvas.width * 0.01;
    }
    
    update(bricks, paddle) {
        let reward = this.checkCollision(bricks, paddle);
        this.lastXPosition = this.xPosition;
        this.lastYPosition = this.yPosition;
        this.xPosition += this.randomSlopeRun;
        this.yPosition -= this.randomSlopeRise;

        this.draw()

        return reward; 
    }

    resetBall() {
        game.ballFailure();
        this.setupBall();
    }

    checkCollision(bricks, paddle) {
        let reward = 0;
        this.radius = gameCanvas.width * 0.01;
        
        
        // Pixel coordinate points of the ball
        const ballXPixelPosition = this.xPosition * gameCanvas.width;
        const ballYPixelPosition = this.yPosition * gameCanvas.height;
        
        // Calculate if the ball falls within the X pixel range of the paddle
        const paddleStartXPixelPosition = paddle.xPosition * gameCanvas.width - (paddle.paddleWidth / 2);
        const paddleEndXPixelPosition = paddleStartXPixelPosition + paddle.paddleWidth;
        const withinXRange = (paddleStartXPixelPosition < ballXPixelPosition) && (paddleEndXPixelPosition > ballXPixelPosition);
        
        // Calculate if the balls falls within the Y pixel range of the paddle
        const paddleStartYPixelPosition = paddle.yPixelPosition;
        const paddleEndYPixelPosition = paddleStartYPixelPosition + paddle.paddleHeight;
        const withinYRange = (paddleStartYPixelPosition < ballYPixelPosition + this.radius) && (paddleEndYPixelPosition > ballYPixelPosition + this.radius);


        if(withinXRange && withinYRange) {
            const middleOfPaddlePixel = (paddleStartXPixelPosition + paddleEndXPixelPosition) / 2;
            if(middleOfPaddlePixel < ballXPixelPosition) { // Means ball hit right side of paddle
                if(this.randomSlopeRun < 0) {// ball going left
                    this.randomSlopeRun *= -1;
                }
                console.log("Hit Right!")

                this.randomSlopeRise = 0.008 * ((ballXPixelPosition - middleOfPaddlePixel) / (paddleEndXPixelPosition - middleOfPaddlePixel)) + 0.002;
                this.randomSlopeRun = (0.008 - this.randomSlopeRise) + 0.004;
            }
            if(middleOfPaddlePixel > ballXPixelPosition) { // Means ball hit left side of paddle 
                console.log("Hit Left!")
                if(this.randomSlopeRun > 0) { // ball going right 
                    this.randomSlopeRun *= -1; 
                }
                this.randomSlopeRise = 0.008 * ((ballXPixelPosition - paddleStartXPixelPosition) / (middleOfPaddlePixel - paddleStartXPixelPosition)) + 0.002;
                this.randomSlopeRun = (0.008 - this.randomSlopeRise) + 0.004;
            }
            
            // The reward for hitting the paddle
            reward+=2;
        }

        // Start checking brick collisions
        for(let layer = 0; layer < bricks.length; layer++) {
            if(hitBrick) {
                break;
            }
            for(let rowNumber = 0; rowNumber < bricks[layer].length; rowNumber++) {
                const brick = bricks[layer][rowNumber];
                if (brick.hitPoints < 0) {
                    continue;
                }
                if(hitBrick) {
                    break;
                }

                // Calculate start of xPixel Pos (e.x, starts at 100 pixels)
                const brickStartXPixelPosition = brick.xPixelPosition;
                // Calculate where it ends (e.x, ends at pixel 110)
                const brickEndXPixelPosition = brickStartXPixelPosition + brick.brickWidth;
                // Checks if it falls with the range (e.x, 100-110);
                const ballWithinXBrickRange = ballXPixelPosition + this.radius > brickStartXPixelPosition && ballXPixelPosition - this.radius < brickEndXPixelPosition;
                
                const brickStartYPixelPosition = brick.yPixelPosition;
                const brickEndYPixelPosition = brickStartYPixelPosition + brick.brickHeight;
                const ballWithinYBrickRange = brickStartYPixelPosition < ballYPixelPosition + this.radius && ballYPixelPosition - this.radius < brickEndYPixelPosition;

                // console.log(`X: ${ballWithinXBrickRange} | Y: ${ballWithinYBrickRange}`)
                if(ballWithinXBrickRange && ballWithinYBrickRange) { // Check if it falls within x range
                    const overlapY = (brickEndYPixelPosition - brickStartYPixelPosition) > (ballYPixelPosition - brickStartYPixelPosition) ? ballYPixelPosition - brickStartYPixelPosition : 0;
                    const overlapX = (brickEndXPixelPosition - brickStartXPixelPosition) > ballXPixelPosition - brickStartXPixelPosition ? ballXPixelPosition - brickStartXPixelPosition : 0;
                    const hitSide = overlapY > overlapX
                    console.log(`overlap Y: ${overlapY} | overlap X: ${overlapX}`);
                    if(hitSide) {
                        this.randomSlopeRun *= -1;
                        console.log("hit side");
                    } else {

                        this.randomSlopeRise *= -1;
                    }
                    // this.xDirection *= -1;
                    brick.hit();
                    var hitBrick = true;
                    reward += 5;
                }
            }  
        }

        if(this.yPosition - 0.01 <= 0) { // IF OVER TOP (need to add radius check)
            this.randomSlopeRise *= -1;
            console.log(`New Y Dir: ${(this.randomSlopeRise > 0 ? "Up" : "Down")} | Y POS: ${this.yPosition}`)
        }
        if(this.yPosition >= 1) { // IF OVER BOTTOM 
            reward -= 5        }
        // includes radius
        if(this.xPosition + 0.01 >= 1 || this.xPosition - 0.01 <= 0) { // IF OVER LEFT / RIGHT OF SCREEN
            this.randomSlopeRun *= -1;
            this.xPosition = this.lastXPosition;
            this.yPosition = this.lastYPosition; // To push it back into frame bc it gets stuck sometimes
        }
        return reward;
    }

    episodeOver(bricks) {
        if (this.yPosition >= 1 || !bricks.flat().some(brick => brick.hitPoints > 0)) { // IF OVER BOTTOM or no bricks left with health
            this.resetBall();
            return true;
        }
        return false;
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

    reset() {
        this.hitPoints = 4 - this.gridLayer;
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
    static gemma = 0.95;
    constructor() {
        this.xPosition = 0.5; // Center Horizontally
        this.color = "blue";
        this.yPixelPosition = gameCanvas.height * 0.95;
        this.paddleWidth = gameCanvas.width * 0.1;
        this.paddleHeight = gameCanvas.height * 0.04;
        this.shouldMove = false;

        this.moveSpeed = 0.015;
        this.brain = new Network();
        this.replayBuffer = new Buffer();
        this.epsilon = 1; // Start with 100%, decrease by 1 each ep
    }

    move(direction, ball) { 
       const PHYSICS_TEST = false; // true means paddle will just follow the ball so we cant die
       
       if(PHYSICS_TEST) {
        this.xPosition = ball.xPosition;
        return;
       }
        
        
        if(this.xPosition - this.moveSpeed < 0.04 && direction === "left") {
            return;
        } else if (this.xPosition + this.moveSpeed > 0.96 && direction === "right") { 
            return;
        }
            // Basically
            let multiplier = 1;
            if(direction === "left") {
                multiplier *= -1;
            } 
                this.xPosition += this.moveSpeed * multiplier;
                //console.log(this.xPosition)
                return;
        }


    decide(ball, bricks) {
        // Initially lets just focus on ball state so we hit (not focused on accuracy atm)

        /* State variables that are important :
        Paddle xPos, // 0-1
        Ball xPos, // 0 - 1
        Ball yPos, // 0 - 1
        Ball Slope Rise,
        Ball Slope Run - Add Bricks later
        
        
        */

        const inputs = this.getState(ball);
        
        const qValues = this.brain.decide(inputs);

        let chosenAction;

        if(Math.random() > this.epsilon) { // IF we dont want to explore
            chosenAction = qValues.indexOf(Math.max(...qValues)); // Best Action
        } else {
            chosenAction = Math.floor(Math.random() * qValues.length); // Random Action
        }

        if(chosenAction === 0) {
            this.move("left", ball);
        } else if (chosenAction === 1) {
            // Do nothing (realistically if reward gets calculated based on following the ball this state wont really happen)
        } else {
            this.move("right", ball);
        }

        const reward = ball.update(bricks, this);
        const done = ball.episodeOver(bricks);
	
        if(done) {
            // We do this because theres no future goal
	        var target = reward;
        } else {
            var nextState = this.getState(ball);
            var nextStateQValues = this.brain.decide(nextState);
            var bestQValue = Math.max(...nextStateQValues);
            var target = reward + Paddle.gemma * bestQValue;
	    }

        const replay = {
            state: inputs,
            action: chosenAction,
            reward: reward,
            nextState: this.getState(ball),
            done: done
        };
	// const targetVector = [...qValues];
	// targetVector[nextStateQValues.indexOf(bestQValue)] = bestQValue;
    this.replayBuffer.addIntoBuffer(replay);
    }

    getState(ball) {
        return [
            this.xPosition,
            ball.xPosition,
            ball.yPosition,
            ball.randomSlopeRise / 0.01,
            ball.randomSlopeRun / 0.01
        ];
    }

    newEpisode() {
        this.xPosition = 0.5;
        this.epsilon = Math.max(0.05, this.epsilon-.01);
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

window.addEventListener("resize", () => {game.adjustSizes()});
