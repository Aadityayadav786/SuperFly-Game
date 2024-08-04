class Game {
    constructor(canvas, context) {
        this.canvas = canvas;
        this.ctx = context;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.baseHeight = 720;
        this.ratio = this.height / this.baseHeight;
        this.player = new Player(this);
        this.sound = new AudioControl();
        this.obstacles = [];
        this.numberofObstacles = 100;
        this.gravity = 0.15 * this.ratio;
        this.flapSpeed = 5 * this.ratio;
        this.background = new Background(this);
        this.speed = 5 * this.ratio;
        this.minSpeed = this.speed;
        this.maxSpeed = this.speed * 5;
        this.score = 0;
        this.gameOver = false;
        this.bottomMargin = 50 * this.ratio;
        this.timer = 0;
        this.message1 = '';
        this.message2 = '';
        this.eventTimer = 0;
        this.eventInterval = 250;
        this.eventUpdate = false;
        this.touchStartX = 0;
        this.swipeDistance = 50;
        this.debug = true;

        this.resize(window.innerWidth, window.innerHeight);

        window.addEventListener('resize', (e) => {
            this.resize(e.currentTarget.innerWidth, e.currentTarget.innerHeight);
        });

        this.canvas.addEventListener('mousedown', () => {
            this.player.flap();
        });

        this.canvas.addEventListener('mouseup', () => {
            setTimeout(() => {
                this.player.wingsUp();
            }, 100);
        });

        window.addEventListener('keydown', (e) => {
            if (e.key === ' ' || e.key === 'Enter') this.player.flap();
            if (e.key === 'Shift' || e.key.toLowerCase() === 'c') this.player.startCharge();
            if (e.key.toLowerCase() === 'r') this.resetGame();
        });

        window.addEventListener('keyup', () => {
            this.player.wingsUp();
        });

        this.canvas.addEventListener('touchstart', (e) => {
            this.player.flap();
            this.touchStartX = e.changedTouches[0].pageX;
        });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
        });

        this.canvas.addEventListener('touchend', (e) => {
            if (e.changedTouches[0].pageX - this.touchStartX > this.swipeDistance) {
                this.player.startCharge();
            } else {
                this.player.flap();
                setTimeout(() => {
                    this.player.wingsUp();
                }, 100);
            }
        });
    }

    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.ctx.font = "15px Bungee";
        this.ctx.textAlign = 'right';
        this.ctx.lineWidth = 1;
        this.ctx.strokeStyle = 'white';
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.ratio = this.height / this.baseHeight;

        this.bottomMargin = Math.floor(50 * this.ratio);
        this.gravity = 0.15 * this.ratio;
        this.speed = 2 * this.ratio;
        this.minSpeed = this.speed;
        this.maxSpeed = this.speed * 5;
        this.background.resize();
        this.player.resize();
        this.createObstacles();
        this.obstacles.forEach((obstacle) => {
            obstacle.resize();
        });
        this.score = 0;
        this.gameOver = false;
        this.timer = 0;
    }

    render(deltaTime) {
        if (!this.gameOver) this.timer += deltaTime;
        this.handlePeriodicEvent(deltaTime);
        this.background.update();
        this.background.draw();
        this.drawStatusText();
        this.player.update();
        this.player.draw();
        this.obstacles.forEach((obstacle) => {
            obstacle.update();
            obstacle.draw();
        });
        this.obstacles = this.obstacles.filter((obstacle) => !obstacle.markedForDeletion);
        
        // Check if all obstacles are cleared
        if (this.obstacles.length <= 0 && !this.gameOver) {
            this.triggerGameOver();
        }
    }

    createObstacles() {
        this.obstacles = [];
        const firstX = this.baseHeight * this.ratio;
        const obstaclesSpacing = 600 * this.ratio;
        for (let i = 0; i < this.numberofObstacles; i++) {
            this.obstacles.push(new Obstacle(this, firstX + i * obstaclesSpacing));
        }
    }

    checkCollision(a, b) {
        const dx = a.collisionX - b.collisionX;
        const dy = a.collisionY - b.collisionY;
        const distance = Math.hypot(dx, dy);
        const sumRadii = a.collisionRadius + b.collisionRadius;
        return distance <= sumRadii;
    }

    formatTimer() {
        return (this.timer * 0.001).toFixed(2);
    }

    handlePeriodicEvent(deltaTime) {
        if (this.eventTimer < this.eventInterval) {
            this.eventTimer += deltaTime;
            this.eventUpdate = false;
        } else {
            this.eventTimer = this.eventTimer % this.eventInterval;
            this.eventUpdate = true;
        }
    }

    triggerGameOver() {
        if (!this.gameOver) {
            this.gameOver = true;
            if (this.obstacles.length <= 0) {
                this.sound.play(this.sound.win);
                this.message1 = "You Won!";
                this.message2 = "Can you do it faster in " + this.formatTimer() + ' seconds?';
            } else {
                this.sound.play(this.sound.lose);
                this.message1 = "Restart Again";
                this.message2 = "Collision Time " + this.formatTimer() + ' seconds!';
            }
        }
    }

    resetGame() {
        this.gameOver = false;
        this.timer = 0;
        this.message1 = '';
        this.message2 = '';
        this.player.reset();
        this.createObstacles();
    }

    drawStatusText() {
        this.ctx.save();
        this.ctx.fillText('Score: ' + this.score, this.width - 10, 30);
        this.ctx.textAlign = 'left';
        this.ctx.fillText('Timer: ' + this.formatTimer(), 10, 30);
        if (this.gameOver) {
            this.ctx.textAlign = 'center';
            this.ctx.font = '30px Bungee';
            this.ctx.fillText(this.message1, this.width * 0.5, this.height * 0.5 - 40);
            this.ctx.font = '15px Bungee';
            this.ctx.fillText(this.message2, this.width * 0.5, this.height * 0.5 - 20);
            this.ctx.fillText("Target Score = 100", this.width * 0.5, this.height * 0.5);
        }
        if (this.player.energy <= this.player.minEnergy) this.ctx.fillStyle = 'red';
        else if (this.player.energy >= this.player.maxEnergy) this.ctx.fillStyle = 'red';
        for (let i = 0; i < this.player.energy; i++) {
            this.ctx.fillRect(10, this.height - 10 - this.player.barSize * i, this.player.barSize * 5, this.player.barSize);
        }
        this.ctx.restore();
    }
}

window.addEventListener('load', function () {
    const canvas = document.getElementById('canvas1');
    const ctx = canvas.getContext('2d');
    canvas.width = 720;
    canvas.height = 720;

    const game = new Game(canvas, ctx);

    let lastTime = 0;
    function animate(timeStamp) {
        const deltaTime = timeStamp - lastTime;
        lastTime = timeStamp;
        game.render(deltaTime);
        requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
});
