export default class Network { 
// We're going to want to have x inputs, but we output three states 0 -> left, 1 -> stay, 2-> right

    
    constructor() { 
        this.layers = [new Layer(64, "ReLU"), new Layer(64, "ReLU"), new Layer(3, "Linear")];
    }

    decide(inputValues) {
        // for (let layer of this.layers) {
        //     inputValues = layer.compute(inputValues);
        // }

        inputValues = this.layers[0].compute(inputValues); // Hidden Layer 1
        inputValues = this.layers[1].compute(inputValues) // Hidden Layer 2
        inputValues = this.layers[2].compute(inputValues) // Output Layer (3 Outputs)

        return inputValues;
    }

    


}


class Layer {
    constructor(neurons, type) {
        this.neurons = [];
        this.type = type; //ReLU or Linear
        for (let i = 0; i < neurons; i++) {
            this.neurons.push(new Neuron()) 
        }
    }

    compute(inputValues) {
        return this.neurons.map(neuron => neuron.process(inputValues, this.type)); // The array of values from each neuron
        /* 
        Hidden Layer 1: 5 inputs, 64 outputs
        Hidden Layer 2: 64 inputs, 64 outputs
        Output Layer: 64 inputs, 3 outputs.
        */
    }
}

class Neuron {
    constructor() {
        this.weights = []
        this.bias = (Math.random() * 0.2) - 0.1; // Min -0.1, Max 0.1
    }

    static createWeight() {
        return (Math.random() * 0.2) - 0.1 // -.1 to .1
    }
    // ReLU for hidden layers, Linear for 
    process(inputs, type = "ReLU") {
        if(inputs.length > this.weights.length) {
            for(let i = 0; i < inputs.length; i++) {
                this.weights.push(Neuron.createWeight());
            }
        }

        let weightTotal = 0;
        for (let i = 0; i < inputs.length; i++) {
            weightTotal += this.weights[i] * inputs[i];
        }
        weightTotal += this.bias;

        if(type === "ReLU") {
            return Math.max(0, weightTotal);
        }

        return weightTotal;
    }
}