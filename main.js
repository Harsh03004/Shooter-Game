// Initialize WebGL and game variables
let gl, program;
let blocks = [];
let projectiles = [];
let blockTextures = {};
let shooter = { x: 0, width: 0.1, height: 0.1, speed: 0.02, health: 3, texture: null };
let score = 0;
let currentLevel = 1;   

const BLOCK_WIDTH = 0.1;
const BLOCK_HEIGHT = 0.05;
const PROJECTILE_WIDTH = 0.02;
const PROJECTILE_HEIGHT = 0.05;
const PROJECTILE_SPEED = 0.02;
const SHOOTER_Y = -0.9;


function init() {
    const canvas = document.getElementById('gameCanvas');
    gl = canvas.getContext('webgl');
    if (!gl) {
        alert('WebGL not supported');
        return;
    }

    // Compile shaders and initialize WebGL program
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, document.getElementById('vertex-shader').text);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, document.getElementById('fragment-shader').text);
    program = createProgram(gl, vertexShader, fragmentShader);
    gl.useProgram(program);

    // Load block textures
    loadTexture('block1.jpg', (texture) => blockTextures['block1'] = texture);
    loadTexture('block2.jpg', (texture) => blockTextures['block2'] = texture);
    loadTexture('block3.jpg', (texture) => blockTextures['block3'] = texture);

    // Load the gun texture
    loadTexture('gun.jpeg', (texture) => {
        shooter.texture = texture;
        requestAnimationFrame(gameLoop);
    });

    // Start the game loop
    setInterval(spawnBlock, 1000); // Spawn a block every second

    // Listen for mouse clicks to shoot
    canvas.addEventListener('click', (event) => {
        const clickPos = getMousePosition(event, canvas);
        shootProjectile(clickPos);
    });

}

function gameLoop() {
    updateLevel();  // Update the level based on score
    updateBlocks();
    updateProjectiles();
    checkCollisions();
    render();

    // End the game if health is zero
    if (shooter.health <= 0) {
        alert('Game Over! Final Score: ' + score);
        document.location.reload();
    } else {
        requestAnimationFrame(gameLoop);
    }
}

function updateLevel() {
    if (score >= 10 && score < 20) {
        currentLevel = 2;
    } else if (score >= 20 && score < 30) {
        currentLevel = 3;
    } else if (score >= 30) {
        currentLevel = 4;
    }
    document.getElementById('levelDisplay').innerText = currentLevel;
}

function updateBlocks() {
    blocks = blocks.filter(block => block.y > -1.0);  // Keep blocks that haven't fallen off the bottom
    blocks.forEach(block => {
        block.x += block.velocityX;  // Move block horizontally
        block.y += block.velocityY;  // Move block downwards

        // Bounce if blocks move too far horizontally
        if (block.x <= -1 || block.x >= 1 - BLOCK_WIDTH) {
            block.velocityX = -block.velocityX;
        }
    });
}

function updateProjectiles() {
    projectiles = projectiles.filter(p => p.y < 1.0 && p.y > -1.0 && p.x < 1.0 && p.x > -1.0);
    projectiles.forEach(p => {
        p.x += p.velocityX;
        p.y += p.velocityY;
    });
}

function checkCollisions() {
    projectiles.forEach((p, pi) => {
        blocks.forEach((b, bi) => {
            if (p.x < b.x + BLOCK_WIDTH && p.x + PROJECTILE_WIDTH > b.x &&
                p.y < b.y + BLOCK_HEIGHT && p.y + PROJECTILE_HEIGHT > b.y) {
                b.hitPoints--;
                projectiles.splice(pi, 1);
                if (b.hitPoints <= 0) {
                    blocks.splice(bi, 1);
                    score++;
                    document.getElementById('scoreDisplay').innerText = score;

                    // Play block destroy sound
                    const blockDestroySound = document.getElementById('blockDestroySound');
                    blockDestroySound.play();
                }
            }
        });
    });

    blocks.forEach((b, bi) => {
        if (b.x < shooter.x + shooter.width && b.x + BLOCK_WIDTH > shooter.x &&
            b.y < SHOOTER_Y + shooter.height && b.y + BLOCK_HEIGHT > SHOOTER_Y) {
            shooter.health--;
            blocks.splice(bi, 1);
            document.getElementById('healthDisplay').innerText = shooter.health;
        }

        if (b.y <= -1.0) {
            shooter.health--;
            blocks.splice(bi, 1);
            document.getElementById('healthDisplay').innerText = shooter.health;
        }
    });
}

function spawnBlock() {
    let x = Math.random() * 2 - 1;
    let y = 1;
    let blockTypes = ['block1', 'block2', 'block3'];
    let blockType = blockTypes[Math.floor(Math.random() * blockTypes.length)];
    let hitPoints = Math.floor(Math.random() * 3) + 1;

    let velocityX = 0;
    let velocityY = -0.005;

    if (currentLevel === 1) {
        velocityX = 0;
        velocityY = -0.005;
    } else if (currentLevel === 2) {
        velocityX = 0;
        velocityY = -0.01;
    } else if (currentLevel === 3) {
        velocityX = (Math.random() - 0.5) * 0.01;
        velocityY = -0.005;
    } else if (currentLevel === 4) {
        velocityX = (Math.random() - 0.5) * 0.02;
        velocityY = -0.01;
    }

    blocks.push({ 
        x: x, 
        y: y, 
        texture: blockTextures[blockType], 
        hitPoints: hitPoints, 
        velocityX: velocityX, 
        velocityY: velocityY 
    });
}

function shootProjectile(target) {
    let directionX = target.x - (shooter.x + shooter.width / 2);
    let directionY = target.y - SHOOTER_Y;
    let magnitude = Math.sqrt(directionX * directionX + directionY * directionY);

    let velocityX = (directionX / magnitude) * PROJECTILE_SPEED;
    let velocityY = (directionY / magnitude) * PROJECTILE_SPEED;

    // The projectile should start at the center of the shooter
    projectiles.push({ 
        x: shooter.x + shooter.width / 2 - PROJECTILE_WIDTH / 2,
        y: SHOOTER_Y, 
        velocityX: velocityX, 
        velocityY: velocityY 
    });

    // Play shoot sound
    const shootSound = document.getElementById('shootSound');
    shootSound.play();
}


function getMousePosition(event, canvas) {
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / canvas.width * 2 - 1;
    const y = (rect.bottom - event.clientY) / canvas.height * 2 - 1;
    return { x: x, y: y };
}

document.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') {
        shooter.x -= shooter.speed;
    } else if (event.key === 'ArrowRight') {
        shooter.x += shooter.speed;
    }
});

function loadTexture(url, callback) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    const placeholderPixel = new Uint8Array([255, 255, 255, 255]); 
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, placeholderPixel);

    const image = new Image();
    image.onload = function () {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

        if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
            gl.generateMipmap(gl.TEXTURE_2D);
        } else {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        }

        callback(texture);
    };

    image.src = url;
}

function isPowerOf2(value) {
    return (value & (value - 1)) === 0;
}

function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

function createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Program link error:', gl.getProgramInfoLog(program));
        return null;
    }
    return program;
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Draw shooter
    drawTexture(shooter.texture, shooter.x, SHOOTER_Y, shooter.width, shooter.height);

    // Draw blocks
    blocks.forEach(block => {
        drawTexture(block.texture, block.x, block.y, BLOCK_WIDTH, BLOCK_HEIGHT);
    });

    // Draw projectiles
    projectiles.forEach(p => {
        drawRect(p.x, p.y, PROJECTILE_WIDTH, PROJECTILE_HEIGHT, [0.0, 0.0, 1.0, 1.0]);
    });
}

function drawTexture(texture, x, y, width, height) {
    gl.bindTexture(gl.TEXTURE_2D, texture);

    const positions = new Float32Array([
        x, y,
        x + width, y,
        x, y + height,
        x + width, y + height,
    ]);

    const texCoords = new Float32Array([
        0, 0,
        1, 0,
        0, 1,
        1, 1,
    ]);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    const positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);
    const texCoordLocation = gl.getAttribLocation(program, 'a_texCoord');
    gl.enableVertexAttribArray(texCoordLocation);
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

function drawRect(x, y, width, height, color) {
    const positions = new Float32Array([
        x, y,
        x + width, y,
        x, y + height,
        x + width, y + height,
    ]);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    const positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    gl.uniform4fv(gl.getUniformLocation(program, 'u_color'), color);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

init();