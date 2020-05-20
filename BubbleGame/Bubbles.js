'use strict'
var canvas = document.getElementById("cnvContainer");
var context = canvas.getContext("2d");
var animationId;
var userScore = 0;
var countdown = 10;
var gameEndClockId;
var countdownId;
var currentBubbleCnt = 0;
//create the array of Bubbles that will be animated
var Bubbles = [];

//create te container that will hold the boincing balls.
var container = {
    x: 3,
    y: 3,
    width: 450,
    height: 450,
    scale: 1,
    // the position of the canvas, in relation to the screen
    offset: { top: 0, left: 0 },
    //bubbleCount: (Math.random() * 10),//Math.round(Math.random()),
    createBubbleFlag: true,

    Init: function () {
        container.offset.top = canvas.offsetTop;
        container.offset.left = canvas.offsetLeft;
        container.Loop();

        canvas.addEventListener("click", function (event) {
            event.preventDefault();
            container.Input.set(event);
        }, false);

        setInterval(() => { container.createBubbleFlag = true; }, GetIncrementalRandom(1000, 3000, 500));
    },

    Loop: function () {
        container.GenerateTheBubbleAnimation();
        animationId = requestAnimationFrame(container.Loop);
        container.Refresh();
    },

    Refresh: function () {
        var checkCollision = false;

        if (Bubbles.length < 2) {
            container.createBubbleFlag = true;
        }

        if (container.Input.tapped) {
            Bubbles.push(new container.Touch(container.Input.x, container.Input.y));
            container.Input.tapped = false;
            checkCollision = true;
        }

        Bubbles.forEach(bubble => {
            if (bubble.type === 'bubble' && checkCollision) {
                var hit = bubble.TouchCheck({ x: container.Input.x, y: container.Input.y, r: 7 });
                if (hit) {
                    for (var n = 0; n < 4; n += 1) {
                        //Bubbles.push(new container.Particle(bubble.x, bubble.y, 5, 'rgba(125,125,155,' + Math.random() * 1 + ')'));
                        Bubbles.push(new container.Particle(bubble.x, bubble.y, 5, bubble.color));
                    }
                    userScore += bubble.value;
                    document.getElementById("score").innerText = userScore;
                }
                bubble.remove = hit;
            }
            // delete from array if remove property, flag is set to true
            if (bubble.remove) {
                var i = Bubbles.indexOf(bubble);
                Bubbles.splice(i, 1);
                CheckGameOverCondition();
            }
        });
    },

    GenerateTheBubbleAnimation: function () {
        if (container.createBubbleFlag) {
            CreateBubbleObjects();
        }
        context.clearRect(0, 0, 500, 600);
        for (var i = 0; i < Bubbles.length; i++) {
            Bubbles[i].Draw();
            Bubbles[i].Move();
        }
    }
};

container.Input = {
    x: 0,
    y: 0,
    tapped: false,
    set: function (data) {
        this.x = (data.pageX - container.offset.left) / container.scale;
        this.y = (data.pageY - container.offset.top) / container.scale;
        this.tapped = true;
    }
};

container.Touch = function (x, y) {
    this.type = 'touch';
    this.x = x;
    this.y = y;
    this.r = 7;
    this.opacity = 1;
    this.fade = 0.09;

    this.Move = function () {
        this.opacity -= this.fade;
        // if opacity if 0 or less, flag for removal
        this.remove = (this.opacity < 0) ? true : false;
    };

    this.Draw = function () {
        context.fillStyle = 'rgb(255,0,0,' + this.opacity + ')';
        context.beginPath();
        context.arc(x + 7, y + 7, this.r, 0, Math.PI * 2, true);
        context.closePath();
        context.fill();
    };
}

class Bubble {
    constructor(x, y, r) {
        this.x = x;
        this.y = y;
        this.r = r;

        this.velocity = {
            x: Math.random() * 2,
            y: Math.random() * 2
        };
        this.value = 5;
        this.mass = 1;
        this.type = 'bubble';
        this.color = 'rgb(' + RandomColor(0, 255) + ',' + RandomColor(0, 255) + ',' + RandomColor(0, 255) + ')';
        this.remove = false;
    }

    Draw = function () {
        context.strokeStyle = 'gray';
        context.fillStyle = this.color; //'hsl(' + this.color + ', 100%, 50%)';
        context.lineWidth = 1;
        context.beginPath();
        context.arc(this.x, this.y, this.r, 0, Math.PI * 2, true);
        context.fill();
        context.stroke();
    }

    Move = function () {
        for (var index = 0; index < Bubbles.length; index++) {
            if (this === Bubbles[index] || Bubbles[index].type == "touch" || Bubbles[index].type == "Particles") {
                continue;
            }
            var dist = GetDistance(this.x, this.y, Bubbles[index].x, Bubbles[index].y);
            if (dist < 50) {
                resolveCollision(this, Bubbles[index]);
            }
        }

        if (this.x - this.r + this.velocity.x < container.x || this.x + this.r + this.velocity.x > container.x + container.width) {
            this.velocity.x = -this.velocity.x;
        }

        if (this.y + this.r + this.velocity.y > container.y + container.height || this.y - this.r + this.velocity.y < container.y) {
            this.velocity.y = -this.velocity.y;
        }

        this.x += this.velocity.x;
        this.y += this.velocity.y;
    }

    TouchCheck = function (b) {
        var distance_squared = (((this.x - b.x) * (this.x - b.x)) + ((this.y - b.y) * (this.y - b.y)));
        var radii_squared = (this.r + b.r) * (this.r + b.r);

        if (distance_squared < radii_squared) {
            return true;
        } else {
            return false;
        }
    };
}

function CreateBubbleObjects() {
    for (let i = 0; i < GetIncrementalRandom(1, 15, 3); i++) {

        var xBoundaries = { min: 51, max: canvas.width - 51 };
        var yBoundaries = { min: 51, max: canvas.height - 51 };
        var x = Math.ceil(Math.random() * (xBoundaries.max - xBoundaries.min)) + xBoundaries.min;
        var y = Math.ceil(Math.random() * (yBoundaries.max - yBoundaries.min)) + yBoundaries.min;

        for (var index = 0; index < Bubbles.length; index++) {
            const element = Bubbles[index];
            var dist = GetDistance(x, y, element.x, element.y);
            if (dist < 50) {
                x = Math.ceil(Math.random() * (xBoundaries.max - xBoundaries.min)) + xBoundaries.min;
                y = Math.ceil(Math.random() * (yBoundaries.max - yBoundaries.min)) + yBoundaries.min;

                index -= 1;
            }
        }
        Bubbles.push(new Bubble(x, y, 25));
        container.createBubbleFlag = false;
    }
    CheckGameOverCondition();
}

function RandomColor(min, max) {
    var number = Math.floor(Math.random() * (max - min)) + min;
    return number;
}

function CheckGameOverCondition() {
    var progress = document.getElementById("myprogressBar");
    var currentBubbleCnt = 0;
    Bubbles.forEach(element => {
        if (element.type == "bubble") {
            ++currentBubbleCnt;
        }
    });

    if (currentBubbleCnt <= 48) {
        clearTimeout(countdownId);
        clearTimeout(gameEndClockId);
        document.getElementById("Timer").innerHTML = 0;
        gameEndClockId = -1;
        countdownId = -1;
        countdown = 10;
        progress.style.backgroundColor = 'green';
        document.getElementById("btnGame").disabled = false;
    }
    else if (currentBubbleCnt < 64) {
        progress.style.backgroundColor = 'orange';
        document.getElementById("btnGame").disabled = true;
        if (typeof gameEndClockId == "undefined" || gameEndClockId == -1) {
            gameEndClockId = setTimeout(() => {
                ShowGameOverMessage();
                cancelAnimationFrame(animationId);
            }, 10000);

            if (typeof countdownId == "undefined" || countdownId == -1) {
                countdownId = setInterval(function () {
                    countdown -= 1;
                    if (countdown <= 0) {
                        clearInterval(countdownId);
                        document.getElementById("Timer").innerHTML = "Finished";
                    } else {
                        document.getElementById("Timer").innerHTML = countdown + "s";
                    }
                }, 1000);
            }
        }
    }
    if (currentBubbleCnt < 64) {
        progress.style.width = currentBubbleCnt * 1.5625 + '%';
        progress.innerHTML = Math.ceil(currentBubbleCnt * 1.5625) + '%';
    }
    else{
        container.createBubbleFlag = false;
        progress.style.width = 100 + '%';
        progress.innerHTML = 100 + '%';
    }
}

container.Particle = function (x, y, r, col) {
    this.type = "Particles";
    this.x = x;
    this.y = y;
    this.r = r;
    this.col = col;

    // determines whether particle will travel to the right of left 50% chance of either happening
    this.dir = (Math.random() * 2 > 1) ? 1 : -1;

    // random values so particles do no
    // travel at the same speeds
    this.vx = ~~(Math.random() * 3) * this.dir;
    this.vy = ~~(Math.random() * 13);

    this.remove = false;

    this.Move = function () {

        // update coordinates
        this.x += this.vx;
        this.y += this.vy;

        // increase velocity so particle accelerates off screen
        this.vx *= 0.9;
        this.vy *= 1;

        // adding this negative amount to the y velocity exerts an upward pull on
        // the particle, as if drawn to the surface
        this.vy += 0.21;

        // offscreen
        if (this.y > 530) {
            this.remove = true;
        }
    };

    this.Draw = function () {
        context.fillStyle = this.col;
        context.beginPath();
        context.arc(this.x, this.y, this.r, 0, Math.PI * 2, true);
        context.closePath();
        context.fill();
    };

};

function PlayOrPause(e) {
    if (e.innerHTML == "Pause") {
        cancelAnimationFrame(animationId);
        e.innerHTML = "Play";
    } else if (e.innerHTML == "Play") {
        animationId = requestAnimationFrame(container.Loop);
        e.innerHTML = "Pause";
    } else {
        location.reload();
    }
}

function WaitTimer(ms) {
    var timeleft = ms / 1000;
    countdown = setInterval(function () {
        if (timeleft <= 0) {
            clearInterval(countdown);
            document.getElementById("Timer").innerHTML = "Finished";
        } else {
            document.getElementById("Timer").innerHTML = timeleft + "s";
        }
        timeleft -= 1;
    }, 1000);
}

function ShowGameOverMessage() {
    context.clearRect(0, 0, 500, 600);
    context.font = 'bold ' + 44 + 'px Monospace';
    context.fillStyle = 'red';
    context.fillText("Game Over", (canvas.width / 4), (canvas.height / 2));

    var btnGame = document.getElementById("btnGame");
    btnGame.innerHTML = "Retry";
    btnGame.disabled = false;
}

function GetIncrementalRandom(min, max, inc) {
    //return Math.floor(Math.random() * (max - min + 1)) + min;
    var min = min || 0;
    var inc = inc || 1;
    if (!max) { return new Error('need to define a max'); }

    return Math.floor(Math.random() * (max - min) / inc) * inc + min;
}

function GetDistance(x, y, sx, sy) {
    return Math.sqrt(Math.pow(x - sx, 2) + Math.pow(y - sy, 2));
}

function rotate(velocity, angle) {
    const rotatedVelocities = {
        x: velocity.x * Math.cos(angle) - velocity.y * Math.sin(angle),
        y: velocity.x * Math.sin(angle) + velocity.y * Math.cos(angle)
    };

    return rotatedVelocities;
}

function resolveCollision(particle, otherParticle) {

    const xVelocityDiff = particle.velocity.x - otherParticle.velocity.x;
    const yVelocityDiff = particle.velocity.y - otherParticle.velocity.y;

    const xDist = otherParticle.x - particle.x;
    const yDist = otherParticle.y - particle.y;

    // Prevent accidental overlap of particles
    if (xVelocityDiff * xDist + yVelocityDiff * yDist >= 0) {

        // Grab angle between the two colliding particles
        const angle = -Math.atan2(otherParticle.y - particle.y, otherParticle.x - particle.x);

        // Store mass in var for better readability in collision equation
        const m1 = particle.mass;
        const m2 = otherParticle.mass;

        // Velocity before equation
        const u1 = rotate(particle.velocity, angle);
        const u2 = rotate(otherParticle.velocity, angle);

        // Velocity after 1d collision equation
        const v1 = { x: u1.x * (m1 - m2) / (m1 + m2) + u2.x * 2 * m2 / (m1 + m2), y: u1.y };
        const v2 = { x: u2.x * (m1 - m2) / (m1 + m2) + u1.x * 2 * m2 / (m1 + m2), y: u2.y };

        // Final velocity after rotating axis back to original location
        const vFinal1 = rotate(v1, -angle);
        const vFinal2 = rotate(v2, -angle);

        // Swap particle velocities for realistic bounce effect
        particle.velocity.x = vFinal1.x;
        particle.velocity.y = vFinal1.y;

        otherParticle.velocity.x = vFinal2.x;
        otherParticle.velocity.y = vFinal2.y;
    }
}

window.addEventListener('load', container.Init, false);