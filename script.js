const canvas = document.getElementById('playbook-canvas');
const ctx = canvas.getContext('2d');
canvas.width = 600;
canvas.height = 800;

let players = [
    { x: 125, y: 640, initialX: 125, initialY: 640, color: '#FF8000', id: 1 }, // Estrema sinistra
    { x: 220, y: 640, initialX: 220, initialY: 640, color: '#AD1EAD', id: 2 }, // Frazione sinistra
    { x: 300, y: 640, initialX: 300, initialY: 640, color: '#696161', id: 3 }, // Centro
    { x: 450, y: 640, initialX: 450, initialY: 640, color: '#14C19C', id: 4 }, // Frazione destra
    { x: 300, y: 725, initialX: 300, initialY: 725, color: '#B50000', id: 5 }  // QB
];
let routes = [];
let isDrawing = false;
let currentRoute = null;
let mouseX = 0;
let mouseY = 0;
let draggedPlayer = null;
let geometricMode = false;
let shiftPressed = false;
let highlightedPlayer = null;

function isMouseOverPlayer(player, mouseX, mouseY) {
    return Math.hypot(player.x - mouseX, player.y - mouseY) < 10;
}

canvas.addEventListener('mousedown', (e) => {
    mouseX = e.offsetX;
    mouseY = e.offsetY;

    if (shiftPressed) {
        draggedPlayer = players.find(player => isMouseOverPlayer(player, mouseX, mouseY));
        if (draggedPlayer) {
            highlightPlayer(draggedPlayer);
        }
    } else {
        if (geometricMode) {
            if (highlightedPlayer) {
                isDrawing = true;
                if (!currentRoute || currentRoute.playerId !== highlightedPlayer.id) {
                    currentRoute = { playerId: highlightedPlayer.id, color: highlightedPlayer.color, segments: [] };
                    routes.push(currentRoute);
                }
                currentRoute.segments.push({ x: mouseX, y: mouseY });
            }
        } else {
            if (highlightedPlayer) {
                isDrawing = true;
                currentRoute = { playerId: highlightedPlayer.id, color: highlightedPlayer.color, segments: [{ x: mouseX, y: mouseY }] };
                routes.push(currentRoute);
            }
        }
    }
    draw();
});

canvas.addEventListener('mousemove', (e) => {
    mouseX = e.offsetX;
    mouseY = e.offsetY;

    if (draggedPlayer && shiftPressed) {
        draggedPlayer.x = mouseX;
        draggedPlayer.y = mouseY;
        draw();
    }

    if (isDrawing && !shiftPressed && geometricMode && highlightedPlayer) {
        const segments = currentRoute.segments;
        const lastSegment = segments[segments.length - 1];
        const dx = mouseX - lastSegment.x;
        const dy = mouseY - lastSegment.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        const newX = lastSegment.x + Math.cos(angle) * length;
        const newY = lastSegment.y + Math.sin(angle) * length;
        if (segments.length < 2) {
            segments.push({ x: newX, y: newY });
        } else {
            segments[segments.length - 1] = { x: newX, y: newY };
        }
        draw();
    }

    if (isDrawing && !shiftPressed && !geometricMode && highlightedPlayer) {
        const segments = currentRoute.segments;
        segments.push({ x: mouseX, y: mouseY });
        draw();
    }
});

canvas.addEventListener('mouseup', () => {
    draggedPlayer = null;
    if (isDrawing && !shiftPressed) {
        isDrawing = false;
    }
});

window.addEventListener('keydown', (e) => {
    if (e.key === 'Shift') {
        shiftPressed = true;
    }
});

window.addEventListener('keyup', (e) => {
    if (e.key === 'Shift') {
        shiftPressed = false;
    }
});

document.getElementById('toggle-mode').addEventListener('click', () => {
    geometricMode = !geometricMode;
    document.getElementById('toggle-mode').textContent = `Mode: ${geometricMode ? 'Geometric' : 'Freehand'}`;
    draw();
});

document.getElementById('clear-canvas').addEventListener('click', () => {
    players.forEach(player => {
        player.x = player.initialX;
        player.y = player.initialY;
    });
    routes = [];
    highlightedPlayer = null;
    draw();
});
//salvataggio
// Funzione per ottenere l'indice corrente dal localStorage
function getCurrentIndex() {
    const currentIndex = localStorage.getItem('playIndex');
    return currentIndex ? parseInt(currentIndex, 10) : 1;
}

// Funzione per aggiornare l'indice nel localStorage
function updateIndex(index) {
    localStorage.setItem('playIndex', index.toString());
}

document.getElementById('save-play').addEventListener('click', () => {
    const index = getCurrentIndex(); // Ottieni l'indice corrente
    const dataURL = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = `playbook_play ${index}.png`; // Usa l'indice per il nome del file
    link.click();

    updateIndex(index + 1); // Incrementa e salva il nuovo indice
});







document.getElementById('delete-route').addEventListener('click', () => {
    if (highlightedPlayer) {
        routes = routes.filter(route => route.playerId !== highlightedPlayer.id);
        highlightedPlayer = null;
        draw();
    }
});

function highlightPlayer(player) {
    highlightedPlayer = player;
    draw();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawField();
    drawRoutes();
    drawPlayers();
}

function drawField() {
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    for (let i = 1; i <= 4; i++) {
        ctx.moveTo(0, (canvas.height / 5) * i);
        ctx.lineTo(canvas.width, (canvas.height / 5) * i);
        ctx.stroke();
    }
}

function drawPlayers() {
    players.forEach(player => {
        ctx.beginPath();
        ctx.arc(player.x, player.y, 10, 0, Math.PI * 2, true);
        ctx.fillStyle = player.color;
        ctx.fill();
        if (player === highlightedPlayer) {
            ctx.strokeStyle = '#FFFF00'; // Giallo
            ctx.lineWidth = 4;
        } else {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
        }
        ctx.stroke();
        ctx.closePath();
    });
}

function drawRoutes() {
    routes.forEach(route => {
        const segments = route.segments;
        if (segments.length > 1) {
            ctx.beginPath();
            ctx.moveTo(segments[0].x, segments[0].y);
            for (let i = 1; i < segments.length; i++) {
                ctx.lineTo(segments[i].x, segments[i].y);
            }
            ctx.strokeStyle = route.color;
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.stroke();
            ctx.closePath();

            drawArrow(segments[segments.length - 2], segments[segments.length - 1], route.color);
        }
    });
}

function drawArrow(start, end, color) {
    const headLength = 20;
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const angle = Math.atan2(dy, dx);
    ctx.beginPath();
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(end.x - headLength * Math.cos(angle - Math.PI / 6), end.y - headLength * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(end.x - headLength * Math.cos(angle + Math.PI / 6), end.y - headLength * Math.sin(angle + Math.PI / 6));
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.closePath();
}

draw();
