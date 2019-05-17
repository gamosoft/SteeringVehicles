function pldistance(p1, p2, x, y) {
    // point to line distance
    // https://en.wikipedia.org/wiki/Distance_from_a_point_to_a_line
    const num = abs((p2.y - p1.y)*x - (p2.x - p1.x)*y + p2.x*p1.y - p2.y*p1.x);
    const den = p5.Vector.dist(p1, p2);
    return num / den;
}

// A function to get the normal point from a point (p) to a line segment (a-b)
// This function could be optimized to make fewer new Vector objects
function getNormalPoint(p, a, b) {
    // Vector from a to p
    let ap = p5.Vector.sub(p, a);
    // Vector from a to b
    let ab = p5.Vector.sub(b, a);
    ab.normalize(); // Normalize the line
    // Project vector "diff" onto line by using the dot product
    ab.mult(ap.dot(ab));
    let normalPoint = p5.Vector.add(a, ab);
    return normalPoint;
}


class Particle {
    constructor(brain) {
        this.fitness = 0;
        this.dead = false;
        this.finished = false;
        this.pos = createVector(start.x, start.y);
        this.vel = createVector(); // Velocity
        this.acc = createVector(); // Acceleration
        this.maxspeed = 4;
        this.maxforce = 0.5; // Higher allows for sharper turns
        this.sight = SIGHT; // Maximum distance that a sensor can see, "ray length"
        this.rays = [];
        this.index = 0;
        this.counter = 0; // Time to live, to avoid blocks
        // 45 degrees creates 8 rays or "sensors"
        //for (let a = 0; a < 360; a += 45) {
        for (let a = -45; a < 45; a += 5) {            
            this.rays.push(new Ray(this.pos, radians(a)));
        }

        if (brain) {
            this.brain = brain.copy();
        } else {
            // 8 inputs, 8 hidden, 1 output
            this.brain = new NeuralNetwork(this.rays.length, this.rays.length, 1);
        }
    }

    dispose() {
        this.brain.dispose();
    }

    mutate() {
        this.brain.mutate(MUTATION_RATE);
    }

    applyForce(force) {
        this.acc.add(force); // Add forces to get resulting acceleration
    }

    // check(target) {
    //     const d = p5.Vector.dist(this.pos, target);
    //     if (d < 10) {
    //         this.finished = true;
    //     }
    // }

    check(checkpoints) {
        if (!this.finished) {
            // const goal = checkpoints[this.index].midpoint();
            // const d = p5.Vector.dist(this.pos, goal);

            this.goal = checkpoints[this.index];
            const d = pldistance(this.goal.a, this.goal.b, this.pos.x, this.pos.y); 
            if (d < 5) {
                if (this.index == checkpoints.length-1) {
                    ding.play();
                }
                this.index = (this.index + 1 ) % checkpoints.length;
                this.counter = 0; // Extend life
                // if (this.index == checkpoints.length - 1) {
                //     this.finished = true;
                // }
            }
        }

        // for (let i = 0; i < this.index; i++) {
        //     checkpoints[i].show();          
        // }

    }


    update() {
        if (!this.dead && !this.finished) {
            this.pos.add(this.vel);
            this.vel.add(this.acc);
            this.vel.limit(this.maxspeed);
            this.acc.set(0, 0);
            this.counter++;
            if (this.counter  > LIFESPAN) {
                this.dead = true;
            }
            // Rotate the rays
            for (let i = 0; i < this.rays.length; i++) {
                this.rays[i].rotate(this.vel.heading());
            }
        }
    }

    calculateFitness(target) {
        this.fitness = pow (2, this.index);
        // if (this.finished) {
        //     this.fitness = 1;
        // } else {
        //     const d= p5.Vector.dist(this.pos, target);
        //     this.fitness = constrain(1 / d, 0, 1);
        // }
    }

    look(walls) {
        const inputs = []; // For the brain
        for (let i = 0; i < this.rays.length; i++) {
            const ray = this.rays[i];
            let closest = null;
            let record = this.sight; // Max sight
            for (let wall of walls) {
                const pt = ray.cast(wall);
                if (pt) {
                    const d = p5.Vector.dist(this.pos, pt);
                    if (d < record && d < this.sight) {
                        record = d;
                        closest = pt;
                    }
                }
            }

            if (record < 5) { // Hits a wall
                this.dead = true;
            }

            inputs[i] = map(record, 0, 50, 1, 0);

            if (closest && showRaysCB.checked()) {
                // rays of "vision"
                stroke(255, 200);
                line(this.pos.x, this.pos.y, closest.x, closest.y);
            }
        }
        // const vel = this.vel.copy(); // Adding velocity to the neural network
        // vel.normalize();
        // inputs.push(vel.x);
        // inputs.push(vel.y);

        const output = this.brain.predict(inputs);
        let angle = map(output[0], 0, 1, -PI, PI);
        angle += this.vel.heading();

        const steering = p5.Vector.fromAngle(angle);
        steering.setMag(this.maxspeed); // Magnitude
        steering.sub(this.vel); // Substract
        steering.limit(this.maxforce);
        this.applyForce(steering);
        // console.log(angle);
    }

    bounds() {
        if (this.pos.x > width || this.pos.x < 0 || this.pos.y > height || this.pos.y < 0) {
            this.dead = true;
        }
    }

    show() {
        push();
        translate(this.pos.x, this.pos.y);
        rotate(this.vel.heading());
        fill(255, 100);
        rectMode(CENTER);
        rect(0, 0, 20, 10);
        pop();
        //ellipse(this.pos.x, this.pos.y, 8);
        for (let ray of this.rays) {
            // ray.show();
        }
        if (this.goal && showGoalsCB.checked()) {
            this.goal.show();
        }
    }

    highlight() {
        push();
        translate(this.pos.x, this.pos.y);
        const heading = this.vel.heading();
        rotate(heading);
        stroke(0, 255, 0);
        fill(0, 255, 0);
        rectMode(CENTER);
        rect(0, 0, 20, 10);
        pop();
        for (let ray of this.rays) {
          // ray.show();
        }
        if (this.goal && showGoalsCB.checked()) {
          this.goal.show();
        }
      }
}