const canvas = document.getElementById('playbook-canvas');
const ctx = canvas.getContext('2d');
canvas.width = 600;
canvas.height = 800;

const moveArea = {
    minX: 10, // Coordina X minima
    maxX: 590, // Coordina X massima
    minY: 640, // Coordina Y minima
    maxY: 790  // Coordina Y massima
};


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
    return Math.hypot(player.x - mouseX, player.y - mouseY) < 15;
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
        if (highlightedPlayer) {
            isDrawing = true;
            if (!currentRoute || currentRoute.playerId !== highlightedPlayer.id) {
                currentRoute = { playerId: highlightedPlayer.id, color: highlightedPlayer.color, segments: [{ x: highlightedPlayer.x, y: highlightedPlayer.y }] };
                routes.push(currentRoute);
            }
            currentRoute.segments.push({ x: mouseX, y: mouseY });
        }
    }
    draw();
});

canvas.addEventListener('mousemove', (e) => {
    mouseX = e.offsetX;
    mouseY = e.offsetY;

    if (draggedPlayer && shiftPressed) {
        const dx = mouseX - draggedPlayer.x;
        const dy = mouseY - draggedPlayer.y;

        const newX = draggedPlayer.x + dx;
        const newY = draggedPlayer.y + dy;

        
        if (newX >= moveArea.minX && newX <= moveArea.maxX && newY >= moveArea.minY && newY <= moveArea.maxY) {
            draggedPlayer.x = newX;
            draggedPlayer.y = newY;

            routes.forEach(route => {
                if (route.playerId === draggedPlayer.id) {
                    route.segments.forEach(segment => {
                        segment.x += dx;
                        segment.y += dy;
                    });
                }
            });
            draw();
        }
    }

    if (isDrawing && !shiftPressed && highlightedPlayer) {
        const segments = currentRoute.segments;
        if (geometricMode) {
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
        } else {
            segments.push({ x: mouseX, y: mouseY });
        }
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

document.getElementById('save-play').addEventListener('click', () => {
    // Apri la modale di conferma
    const modal = document.getElementById('confirmation-modal');
    modal.style.display = 'block';
});

document.getElementById('save-black-white').addEventListener('click', () => {
    savePlay(true); // Salva in bianco e nero
    closeModal();
});

document.getElementById('save-color').addEventListener('click', () => {
    savePlay(false); // Salva a colori
    closeModal();
});

document.querySelector('.close-button').addEventListener('click', closeModal);

window.addEventListener('click', (event) => {
    const modal = document.getElementById('confirmation-modal');
    if (event.target === modal) {
        closeModal();
    }
});

function closeModal() {
    const modal = document.getElementById('confirmation-modal');
    modal.style.display = 'none';
}

function savePlay(saveInBlackAndWhite) {
    drawField(saveInBlackAndWhite);
    drawRoutes(saveInBlackAndWhite);
    drawPlayers(saveInBlackAndWhite);

    const index = getCurrentIndex(); // Ottieni l'indice corrente
    const dataURL = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = `playbook_play ${index}.png`; // Usa l'indice per il nome del file
    link.click();

    updateIndex(index + 1); // Incrementa e salva il nuovo indice

    // Ridisegna per la visualizzazione normale
    draw();
}

function draw() {
    drawField();
    drawRoutes();
    drawPlayers();
}

function drawField(saveMode = false) {
    ctx.fillStyle = saveMode ? '#ffffff' : '#1a1a1a'; // Bianco per il salvataggio, scuro per la visualizzazione normale
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = saveMode ? '#000000' : '#ffffff'; // Nero per il salvataggio, bianco per la visualizzazione normale
    ctx.lineWidth = 2;
    for (let i = 1; i <= 4; i++) {
        ctx.moveTo(0, (canvas.height / 5) * i);
        ctx.lineTo(canvas.width, (canvas.height / 5) * i);
        ctx.stroke();
    }
}

function drawPlayers(saveMode = false) {
    players.forEach(player => {
        ctx.beginPath();
        ctx.arc(player.x, player.y, 15, 0, Math.PI * 2, true);
        ctx.fillStyle = saveMode ? '#000000' : player.color; // Nero per il salvataggio, colore originale per la visualizzazione normale
        ctx.fill();
        if (player === highlightedPlayer) {
            ctx.strokeStyle = saveMode ? '#000000' : '#FFFF00'; // Nero per il salvataggio, giallo per la visualizzazione normale
            ctx.lineWidth = 4;
        } else {
            ctx.strokeStyle = saveMode ? '#000000' : '#ffffff'; // Nero per il salvataggio, bianco per la visualizzazione normale
            ctx.lineWidth = 2;
        }
        ctx.stroke();
        ctx.closePath();
    });
}

function drawRoutes(saveMode = false) {
    routes.forEach(route => {
        const segments = route.segments;
        if (segments.length > 1) {
            ctx.beginPath();
            ctx.moveTo(segments[0].x, segments[0].y);
            for (let i = 1; i < segments.length; i++) {
                ctx.lineTo(segments[i].x, segments[i].y);
            }
            ctx.strokeStyle = saveMode ? '#000000' : route.color; // Nero per il salvataggio, colore originale per la visualizzazione normale
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.stroke();
            ctx.closePath();

            drawArrow(segments[segments.length - 2], segments[segments.length - 1], saveMode ? '#000000' : route.color); // Nero per il salvataggio, colore originale per la visualizzazione normale
        }
    });
}

function drawArrow(start, end, color) {
    const headLength = 10;
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const angle = Math.atan2(dy, dx);
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(end.x - headLength * Math.cos(angle - Math.PI / 6), end.y - headLength * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(end.x - headLength * Math.cos(angle + Math.PI / 6), end.y - headLength * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
}

function getCurrentIndex() {
    return parseInt(localStorage.getItem('playbookIndex')) || 1;
}

function updateIndex(index) {
    localStorage.setItem('playbookIndex', index);
}

function highlightPlayer(player) {
    highlightedPlayer = player;
    draw();
}

document.getElementById('clear-canvas').addEventListener('click', () => {
    players = [
        { x: 125, y: 640, color: '#FF8000', id: 1 },
        { x: 220, y: 640, color: '#AD1EAD', id: 2 },
        { x: 300, y: 640, color: '#696161', id: 3 },
        { x: 450, y: 640, color: '#14C19C', id: 4 },
        { x: 300, y: 725, color: '#B50000', id: 5 }
    ];
    routes = [];
    highlightedPlayer = null;
    draw();
});

document.getElementById('delete-route').addEventListener('click', () => {
    if (highlightedPlayer) {
        routes = routes.filter(route => route.playerId !== highlightedPlayer.id);
        currentRoute = null;
        draw();
    }
});



draw();
