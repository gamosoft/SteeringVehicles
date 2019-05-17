

let walls = [];
let ray;
let particle;
let start, end;

const TOTAL = 100; // Total population
const MUTATION_RATE = 0.1;
const LIFESPAN = 50;
const SIGHT = 50;
let population = [];
let savedParticles = [];

let speedSlider;
let checkpointsSlider;
let noiseSlider;
let widthSlider;

let inside = [];
let outside = [];
let checkpoints = [];

function buildTrack() {
    checkpoints = [];
    inside = [];
    outside = [];
    walls = [];
    // Track generation
    // let noiseMax = 25;
    // const total = 100; // # checkpoints, higher = smoother track
    // const pathWidth = 30;
    let noiseMax = noiseSlider.value();
    const total = checkpointsSlider.value();
    const pathWidth = widthSlider.value();
    let startX = random(1000);
    let startY = random(1000);
    for (let i = 0; i < total; i++) {
        let a = map(i, 0, total, 0, TWO_PI);
        let xoff = map(cos(a), -1, 1, 0, noiseMax) + startX;
        let yoff = map(sin(a), -1, 1, 0, noiseMax) + startY;
        let r = map(noise(xoff, yoff), 0, 1, 100, height / 2);
        let x1 = width / 2 + (r - pathWidth) * cos(a);
        let y1 = height / 2 + (r - pathWidth) * sin(a);
        let x2 = width / 2 + (r + pathWidth) * cos(a);
        let y2 = height / 2 + (r + pathWidth) * sin(a);
        checkpoints.push(new Boundary(x1, y1, x2, y2));
        inside.push(createVector(x1, y1));
        outside.push(createVector(x2, y2));
    }

    for (let i = 0; i < checkpoints.length; i++) {
        let a1 = inside[i];
        let b1 = inside[(i + 1) % checkpoints.length]; // Last one connecting with the first one
        walls.push(new Boundary(a1.x, a1.y, b1.x, b1.y));

        let a2 = outside[i];
        let b2 = outside[(i + 1) % checkpoints.length]; // Last one connecting with the first one
        walls.push(new Boundary(a2.x, a2.y, b2.x, b2.y));
    }

    start = checkpoints[0].midpoint();
    end = checkpoints[checkpoints.length - 1].midpoint();

}

function changeTrack() {
    buildTrack();
    for (let i = 0; i < TOTAL; i++) {
        population[i] = new Particle();        
    }
}

function setup() {
    createCanvas(900, 900);
    tf.setBackend('cpu'); // Calculations in the CPU

    speedSlider = createSlider(1, 10, 1);
    checkpointsSlider = createSlider(20, 200, 30);
    noiseSlider = createSlider(2, 50, 2);
    widthSlider = createSlider(10, 100, 30);

    checkpointsSlider.changed(changeTrack);
    noiseSlider.changed(changeTrack);
    widthSlider.changed(changeTrack);

    buildTrack();
    // let a = inside[inside.length-1];
    // let b = outside[outside.length-1];
    // walls.push(new Boundary(a.x, a.y, b.x, b.y));

    for (let i = 0; i < TOTAL; i++) {
        population[i] = new Particle();        
    }
}



function draw() {
    background(0);

    const cycles = speedSlider.value();
    let bestP = population[0];
    for (let n = 0; n < cycles; n++) {
        for (let particle of population) {
            particle.look(walls);
            particle.check(checkpoints);
            particle.bounds();
            particle.update();
            // particle.show();

             // Get the best one
            if (particle.fitness > bestP.fitness) {
                bestP = particle;
            }
        }

        for (let i = population.length-1; i >= 0; i--) {
            const particle = population[i];
            if (particle.dead || particle.finished) {
                savedParticles.push(population.splice(i, 1)[0]);
            }
        }

        if (population.length == 0) {
            buildTrack();
            nextGeneration();
        }
    }

    stroke(255);
    for (let cp of checkpoints) {
        // strokeWeight(2);
        // // point(v.x, v.y);
        // cp.show();
    }

    ellipse(start.x, start.y, 10);
    ellipse(end.x, end.y, 10);

    for (let wall of walls) {
        wall.show();
    }

    for (let particle of population) {
        particle.show();
    }

    bestP.highlight();

    fill(255);
    textSize(24);
    noStroke();
    text('Steering vehicles', 30, 50);
  

}
