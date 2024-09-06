const grid = document.getElementById('grid');
const colorPicker = document.getElementById('colorPicker');
const clearBtn = document.getElementById('clearBtn');
const saveBtn = document.getElementById('saveBtn');
const newBtn = document.getElementById('newBtn');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const designList = document.getElementById('designList');
const eraserBtn = document.getElementById('eraserBtn');
const undoBtn = document.getElementById('undoBtn');
const redoBtn = document.getElementById('redoBtn');
let isErasing = false;
let stateHistory = [];
let currentStateIndex = -1;

const GRID_SIZE = 16;
const DESIGNS_FOLDER = 'pixelArtDesigns';

let currentColor = '#000000';
let drawing = false;
let currentDesignId = null;
let currentArtworkData = null;

function createGrid() {
    grid.innerHTML = '';
    for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
        const pixel = document.createElement('div');
        pixel.classList.add('pixel');
        pixel.addEventListener('mousedown', startDrawing);
        pixel.addEventListener('mouseover', draw);
        grid.appendChild(pixel);
    }
    
    grid.addEventListener('mouseleave', stopDrawing);
    grid.addEventListener('mouseup', stopDrawing);
    saveState();
}

function startDrawing(e) {
    e.preventDefault(); // Prevent default dragging behavior
    drawing = true;
    draw(e);
}

function draw(e) {
    if (drawing && e.target.classList.contains('pixel')) {
        const oldColor = e.target.style.backgroundColor;
        const newColor = isErasing ? 'white' : currentColor;
        if (oldColor !== newColor) {
            e.target.style.backgroundColor = newColor;
            saveState();
        }
    }
}

function stopDrawing() {
    drawing = false;
}

function clearGrid() {
    document.querySelectorAll('.pixel').forEach(pixel => {
        pixel.style.backgroundColor = 'white';
    });
    currentArtworkData = null;
    saveState();
}

function getCurrentArtworkData() {
    return Array.from(document.querySelectorAll('.pixel')).map(pixel => pixel.style.backgroundColor || 'white');
}

function saveArtwork(designName = null) {
    const artworkData = getCurrentArtworkData();
    const designs = JSON.parse(localStorage.getItem(DESIGNS_FOLDER) || '{}');

    if (currentDesignId && designs[currentDesignId]) {
        designs[currentDesignId].data = artworkData;
    } else if (designName) {
        const id = Date.now().toString();
        designs[id] = { name: designName, data: artworkData };
        currentDesignId = id;
    } else {
        return false;
    }

    localStorage.setItem(DESIGNS_FOLDER, JSON.stringify(designs));
    currentArtworkData = artworkData;
    updateDesignList();
    return true;
}

function loadArtwork(id) {
    if (currentArtworkData && !arraysEqual(currentArtworkData, getCurrentArtworkData())) {
        saveArtwork();
    }

    const designs = JSON.parse(localStorage.getItem(DESIGNS_FOLDER) || '{}');
    const artworkData = designs[id].data;
    if (artworkData) {
        document.querySelectorAll('.pixel').forEach((pixel, index) => {
            pixel.style.backgroundColor = artworkData[index];
        });
        currentDesignId = id;
        currentArtworkData = artworkData;
        updateDesignList();
        saveState();
    }
}

function deleteArtwork(id, event) {
    event.stopPropagation();
    const designs = JSON.parse(localStorage.getItem(DESIGNS_FOLDER) || '{}');
    delete designs[id];
    localStorage.setItem(DESIGNS_FOLDER, JSON.stringify(designs));
    if (id === currentDesignId) {
        currentDesignId = null;
        currentArtworkData = null;
        clearGrid();
    }
    updateDesignList();
}

function renameArtwork(id, event) {
    event.stopPropagation();
    const designs = JSON.parse(localStorage.getItem(DESIGNS_FOLDER) || '{}');
    const newName = prompt('Enter a new name for your design:', designs[id].name);
    if (newName && newName !== designs[id].name) {
        designs[id].name = newName;
        localStorage.setItem(DESIGNS_FOLDER, JSON.stringify(designs));
        updateDesignList();
    }
}

function updateDesignList() {
    designList.innerHTML = '';
    const designs = JSON.parse(localStorage.getItem(DESIGNS_FOLDER) || '{}');
    for (const [id, design] of Object.entries(designs)) {
        const designItem = document.createElement('div');
        designItem.classList.add('design-item');
        if (id === currentDesignId) {
            designItem.classList.add('current-design');
        }
        designItem.innerHTML = `
            <span>${design.name}${id === currentDesignId ? ' (current)' : ''}</span>
            <div>
                <button onclick="renameArtwork('${id}', event)">Rename</button>
                <button onclick="deleteArtwork('${id}', event)">Delete</button>
            </div>
        `;
        designItem.addEventListener('click', () => loadArtwork(id));
        designList.appendChild(designItem);
    }
}

function newDesign() {
    if (currentArtworkData && !arraysEqual(currentArtworkData, getCurrentArtworkData())) {
        saveArtwork();
    }
    currentDesignId = null;
    currentArtworkData = null;
    clearGrid();
    updateDesignList();
    stateHistory = [];
    currentStateIndex = -1;
    saveState();
}

function exportDesigns() {
    const designs = localStorage.getItem(DESIGNS_FOLDER) || '{}';
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(designs);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "pixel_art_designs.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

function importDesigns() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = function(event) {
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const designs = JSON.parse(event.target.result);
                localStorage.setItem(DESIGNS_FOLDER, JSON.stringify(designs));
                updateDesignList();
                alert('Designs imported successfully!');
            } catch (error) {
                alert('Error importing designs. Please make sure the file is correct.');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

function arraysEqual(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; ++i) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

function toggleEraser() {
    isErasing = !isErasing;
    eraserBtn.classList.toggle('active');
    if (isErasing) {
        eraserBtn.textContent = 'Brush';
    } else {
        eraserBtn.textContent = 'Eraser';
    }
}

colorPicker.addEventListener('input', (e) => {
    currentColor = e.target.value;
    if (isErasing) {
        toggleEraser();
    }
});
clearBtn.addEventListener('click', clearGrid);
saveBtn.addEventListener('click', () => {
    const designName = prompt('Enter a name for your design:');
    if (designName) {
        saveArtwork(designName);
        alert('Design saved!');
    }
});
newBtn.addEventListener('click', newDesign);
exportBtn.addEventListener('click', exportDesigns);
importBtn.addEventListener('click', importDesigns);
eraserBtn.addEventListener('click', toggleEraser);

// Modify the existing event listener
document.addEventListener('mouseup', stopDrawing);

// Remove this line if it exists
// document.addEventListener('dragstart', (e) => e.preventDefault());

// Add these event listeners
undoBtn.addEventListener('click', undo);
redoBtn.addEventListener('click', redo);

// Modify the createGrid() call at the end of the file
createGrid();
updateDesignList();
updateUndoRedoButtons();

function saveState() {
    const currentState = getCurrentArtworkData();
    if (currentStateIndex < stateHistory.length - 1) {
        stateHistory = stateHistory.slice(0, currentStateIndex + 1);
    }
    stateHistory.push(currentState);
    currentStateIndex = stateHistory.length - 1;
    updateUndoRedoButtons();
}

function undo() {
    if (currentStateIndex > 0) {
        currentStateIndex--;
        loadState(stateHistory[currentStateIndex]);
    }
}

function redo() {
    if (currentStateIndex < stateHistory.length - 1) {
        currentStateIndex++;
        loadState(stateHistory[currentStateIndex]);
    }
}

function loadState(state) {
    document.querySelectorAll('.pixel').forEach((pixel, index) => {
        pixel.style.backgroundColor = state[index];
    });
    updateUndoRedoButtons();
}

function updateUndoRedoButtons() {
    undoBtn.disabled = currentStateIndex <= 0;
    redoBtn.disabled = currentStateIndex >= stateHistory.length - 1;
}