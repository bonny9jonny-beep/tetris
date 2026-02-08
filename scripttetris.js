const canvas = document.getElementById('tetris');
const ctx = canvas.getContext('2d');
const BS = 30;  // размер блока

let score = 0;
let level = 1;
let dropTime = 700;
let gameInterval = null;

const game = {
    board: Array(20).fill().map(() => Array(10).fill(0)),
    rows: 20,
    cols: 10
};

const shapes = [
    [[1,1,1,1]],               // I
    [[1,1],[1,1]],             // O
    [[0,1,0],[1,1,1]],         // T
    [[1,0,0],[1,1,1]],         // J
    [[0,0,1],[1,1,1]],         // L
    [[1,1,0],[0,1,1]],         // S
    [[0,1,1],[1,1,0]]          // Z
];

let piece = { shape: shapes[0], x: 4, y: 0 };

function rotate() {
    let h = piece.shape.length;
    let w = piece.shape[0].length;
    let newShape = Array(w).fill().map(() => Array(h).fill(0));
    for (let r = 0; r < h; r++) {
        for (let c = 0; c < w; c++) {
            newShape[c][h - 1 - r] = piece.shape[r][c];
        }
    }
    piece.shape = newShape;
}

function collides(dx = 0, dy = 0) {
    for (let r = 0; r < piece.shape.length; r++) {
        for (let c = 0; c < piece.shape[r].length; c++) {
            if (!piece.shape[r][c]) continue;
            let nx = piece.x + c + dx;
            let ny = piece.y + r + dy;
            if (nx < 0 || nx >= game.cols || ny >= game.rows || (ny >= 0 && game.board[ny][nx])) {
                return true;
            }
        }
    }
    return false;
}

function merge() {
    for (let r = 0; r < piece.shape.length; r++) {
        for (let c = 0; c < piece.shape[r].length; c++) {
            if (piece.shape[r][c]) {
                game.board[piece.y + r][piece.x + c] = 1;
            }
        }
    }
}

function clearLines() {
    let linesCleared = 0;
    game.board = game.board.filter(row => {
        if (row.every(cell => cell === 1)) {
            linesCleared++;
            return false;
        }
        return true;
    });

    while (game.board.length < game.rows) {
        game.board.unshift(Array(game.cols).fill(0));
    }

    if (linesCleared > 0) {
        score += linesCleared * 100 * level;
        level = Math.floor(score / 1000) + 1;
        dropTime = Math.max(100, 700 - (level - 1) * 50);
        updateUI();
    }
}

function newPiece() {
    const randomIndex = Math.floor(Math.random() * shapes.length);
    piece = {
        shape: shapes[randomIndex],
        x: 4,
        y: 0
    };

    if (collides()) {
        gameOver();
        return false;
    }
    return true;
}

function draw() {
    // фон
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // доска
    for (let y = 0; y < game.rows; y++) {
        for (let x = 0; x < game.cols; x++) {
            if (game.board[y][x]) {
                ctx.fillStyle = "#434cff";
                ctx.fillRect(x * BS, y * BS, BS, BS);
                ctx.strokeStyle = "#ffffff";
                ctx.lineWidth = 1;
                ctx.strokeRect(x * BS, y * BS, BS, BS);
            }
        }
    }

    // текущая фигура
    ctx.fillStyle = "rgb(86, 97, 255)";
    for (let r = 0; r < piece.shape.length; r++) {
        for (let c = 0; c < piece.shape[r].length; c++) {
            if (piece.shape[r][c]) {
                let px = (piece.x + c) * BS;
                let py = (piece.y + r) * BS;
                ctx.fillRect(px, py, BS, BS);
                ctx.strokeStyle = "#ffffff";
                ctx.strokeRect(px, py, BS, BS);
            }
        }
    }
}

function drop() {
    if (!collides(0, 1)) {
        piece.y++;
    } else {
        merge();
        clearLines();
        newPiece();
    }
    draw();
}

function updateUI() {
    document.getElementById('score').textContent = score;
    document.getElementById('level').textContent = level;
}

function gameOver() {
    if (gameInterval) clearInterval(gameInterval);
    ctx.fillStyle = "rgba(0,0,0,0.8)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ff4444";
    ctx.font = "bold 40px Courier New";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = "28px Courier New";
    ctx.fillText(`Счёт: ${score}`, canvas.width / 2, canvas.height / 2 + 30);
    ctx.fillText(`Уровень: ${level}`, canvas.width / 2, canvas.height / 2 + 70);
}

function resetGame() {
    score = 0;
    level = 1;
    dropTime = 700;
    game.board = Array(20).fill().map(() => Array(10).fill(0));
    
    if (gameInterval) {
        clearInterval(gameInterval);
        gameInterval = null;
    }

    newPiece();
    draw();
    updateUI();
    startGameLoop();
}

function startGameLoop() {
    if (gameInterval) clearInterval(gameInterval);
    gameInterval = setInterval(drop, dropTime);
}



document.getElementById('left')?.addEventListener('click', () => {
    if (!collides(-1, 0)) { piece.x--; draw(); }
});

document.getElementById('right')?.addEventListener('click', () => {
    if (!collides(1, 0)) { piece.x++; draw(); }
});

document.getElementById('down')?.addEventListener('click', () => {
    drop();
});

document.getElementById('rot')?.addEventListener('click', () => {
    rotate();
    if (collides()) {
        rotate(); rotate(); rotate();  
    }
    draw();
});


let touchStartX = 0, touchStartY = 0;
canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
});

canvas.addEventListener('touchend', e => {
    e.preventDefault();
    if (!touchStartX || !touchStartY) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const dx = touchEndX - touchStartX;
    const dy = touchEndY - touchStartY;

    if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 40) { if (!collides(1,0)) piece.x++; }
        else if (dx < -40) { if (!collides(-1,0)) piece.x--; }
    } else {
        if (dy > 40) drop();
        else if (dy < -40) {
            rotate();
            if (collides()) { rotate(); rotate(); rotate(); }
        }
    }
    draw();
    touchStartX = touchStartY = 0;
});

canvas.addEventListener('touchmove', e => e.preventDefault());


document.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft'  && !collides(-1,0)) { piece.x--; draw(); }
    if (e.key === 'ArrowRight' && !collides(1,0))  { piece.x++; draw(); }
    if (e.key === 'ArrowDown')                     { drop(); draw(); }
    if (e.key === 'ArrowUp') {
        rotate();
        if (collides()) { rotate(); rotate(); rotate(); }
        draw();
    }
});


if (window.Telegram?.WebApp) {
    Telegram.WebApp.ready();
    Telegram.WebApp.expand();
    Telegram.WebApp.disableVerticalSwipes();  // важно для свайпов!
    Telegram.WebApp.MainButton.setText("🔄 Перезапуск").show();
    Telegram.WebApp.MainButton.onClick(resetGame);
}


updateUI();
newPiece();
draw();
startGameLoop();