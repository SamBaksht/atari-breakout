export default class Buffer {
    constructor() {
        this.replayArray = [];
        this.maxSize = 4000;
        this.batchSize = 16;
    }

    addIntoBuffer(replay) {
        if(this.replayArray.length >= this.maxSize) { // Remove oldest replay
            this.replayArray.shift() // In the future I may want to adjust for time complexity
        };
        this.replayArray.push(replay);
        return;
    }

    fetchRandomBatch() {
        if(this.replayArray.length < this.batchSize) { // If not enough replays
            return false;
        }
        const randomIndexes = [];
        const randomReplays = [];
        while (randomIndexes.length < this.batchSize) { // Select the amount for the batch
            let index = Math.floor(Math.random() * this.replayArray.length);
            if (randomIndexes.includes(index)) continue;
            randomIndexes.push(index);
            randomReplays.push(this.replayArray[index]);
        }
        return randomReplays;
        
    }

    fetchSize() {
        return this.replayArray.length;
    }

}