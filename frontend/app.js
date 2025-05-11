document.addEventListener('DOMContentLoaded', function() {
    // API base URL - update with your actual backend URL
    const API_URL = 'http://localhost:8081';
    
    // Canvas elements
    const drawingCanvas = document.getElementById('drawingCanvas');
    const resultCanvas = document.getElementById('resultCanvas');
    const drawingCtx = drawingCanvas.getContext('2d');
    const resultCtx = resultCanvas.getContext('2d');
    
    // Buttons and UI elements
    const clearBtn = document.getElementById('clearBtn');
    const submitBtn = document.getElementById('submitBtn');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const resetBtn = document.getElementById('resetBtn');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const recentDrawingsList = document.getElementById('recentDrawingsList');
    
    // Drawing state
    let isDrawing = false;
    let points = [];
    let startTime = null;
    let animationId = null;
    let isAnimating = false;
    let currentDrawingId = null;
    let drawVectors = [];
    let lastDrawingResponse = null;
    let lastChangeTimestamp = null;
    let pollingIntervalId = null;
    let drawingScale = 1;
    const drawingsGallery = document.createElement('div');
    drawingsGallery.id = 'drawingsGallery';
    drawingsGallery.className = 'drawings-gallery';
    
    // Add these variables to track zoom and view state
    let zoomLevel = 1;
    let speedFactor = 1; // 1 = normal speed, higher = slower
    let panOffsetX = 0;
    let panOffsetY = 0;
    let isFollowMode = false;
    let isDragging = false;
    let lastMouseX = 0;
    let lastMouseY = 0;

    // Add this variable to track fullscreen state
    let isFullscreen = false;

    // Initialize with dark theme
    applyDarkTheme();
    initializeCanvases();
    createGalleryUI();
    loadRecentDrawings();
    
    function applyDarkTheme() {
        const style = document.createElement('style');
        style.textContent = `
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');
            
            body, html {
                background-color: #0a0a0a;
                color: #f2f2f2;
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
                margin: 0;
                padding: 0;
                line-height: 1.5;
                font-weight: 300;
                letter-spacing: 0.02em;
            }
            
            h1, h2, h3 {
                color: #ffffff;
                font-weight: 500;
                letter-spacing: -0.02em;
                margin-bottom: 1rem;
            }
            
            .container, .drawing-container, .result-container {
                background-color: #121212;
                border: none;
                border-radius: 12px;
                padding: 1.5rem;
                box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
                margin-bottom: 1.5rem;
            }
            
            canvas {
                background-color: #181818;
                border: none;
                border-radius: 8px;
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
                transition: all 0.3s ease;
            }
            
            button {
                background-color: #222;
                color: #fff;
                border: none;
                border-radius: 6px;
                padding: 10px 16px;
                font-family: 'Inter', sans-serif;
                font-weight: 500;
                font-size: 14px;
                cursor: pointer;
                transition: all 0.2s ease;
                letter-spacing: 0.02em;
            }
            
            button:hover {
                background-color: #333;
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            }
            
            button:active {
                transform: translateY(0);
            }
            
            #clearBtn, #resetBtn {
                background-color: #3d1d1d;
            }
            
            #clearBtn:hover, #resetBtn:hover {
                background-color: #4d2828;
            }
            
            #submitBtn {
                background-color: #1e3a5f;
            }
            
            #submitBtn:hover {
                background-color: #274a78;
            }
            
            #playPauseBtn {
                background-color: #1a472a;
            }
            
            #playPauseBtn:hover {
                background-color: #275e39;
            }
            
            #loadingIndicator {
                color: #ffffff;
                letter-spacing: 1px;
                animation: pulse 1.5s infinite;
                font-weight: 300;
            }
            
            @keyframes pulse {
                0% { opacity: 0.6; }
                50% { opacity: 1; }
                100% { opacity: 0.6; }
            }
            
            #recentDrawingsList {
                list-style: none;
                padding: 0;
                margin: 0;
                max-height: 200px;
                overflow-y: auto;
                border: none;
                border-radius: 8px;
                background-color: #1a1a1a;
            }
            
            #recentDrawingsList li {
                padding: 10px 14px;
                margin: 6px;
                background-color: #222;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            #recentDrawingsList li:hover {
                background-color: #2a2a2a;
                transform: translateX(4px);
            }
            
            .drawings-gallery {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
                gap: 12px;
                margin: 1rem 0;
            }
            
            .drawing-thumbnail {
                position: relative;
                border: 2px solid #2a2a2a;
                border-radius: 8px;
                overflow: hidden;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .drawing-thumbnail:hover {
                transform: scale(1.05);
                border-color: #5f9ea0;
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
            }
            
            .drawing-thumbnail.active {
                border-color: #00ccff;
                box-shadow: 0 0 0 2px rgba(0, 204, 255, 0.3);
            }
            
            .drawing-thumbnail .drawing-label {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                background-color: rgba(0,0,0,0.8);
                color: white;
                text-align: center;
                padding: 6px 4px;
                font-size: 12px;
                backdrop-filter: blur(4px);
            }
            
            /* Improved fullscreen mode styles */
            .fullscreen-container {
                position: relative;
                width: 100%;
                height: 100%;
            }
            
            .fullscreen-container.active {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                width: 100vw;
                height: 100vh;
                z-index: 9999;
                background-color: #000;
                margin: 0;
                padding: 0;
            }
            
            .fullscreen-container.active canvas {
                width: 100vw !important;
                height: 100vh !important;
                max-width: 100vw !important;
                max-height: 100vh !important;
                object-fit: contain;
                margin: 0;
                padding: 0;
                border-radius: 0;
                box-shadow: none;
            }
            
            .controls-overlay {
                position: absolute;
                bottom: 30px;
                left: 50%;
                transform: translateX(-50%);
                display: flex;
                gap: 10px;
                background-color: rgba(20, 20, 20, 0.7);
                padding: 10px 16px;
                border-radius: 40px;
                z-index: 9999;
                backdrop-filter: blur(8px);
                opacity: 0;
                transition: opacity 0.3s, transform 0.3s;
            }
            
            .fullscreen-container.active:hover .controls-overlay {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }
            
            .fullscreen-container.active .controls-overlay {
                bottom: 40px;
            }
            
            .indicator {
                position: absolute;
                top: 20px;
                left: 20px;
                background-color: rgba(0, 0, 0, 0.7);
                color: white;
                padding: 6px 12px;
                border-radius: 20px;
                font-size: 12px;
                opacity: 0.7;
                z-index: 100;
                backdrop-filter: blur(4px);
            }
        `;
        document.head.appendChild(style);
    }
    
    function createGalleryUI() {
        const previousDrawings = document.getElementById('previousDrawings');
        if (previousDrawings) {
            const galleryHeader = document.createElement('h3');
            galleryHeader.textContent = 'Drawing Gallery';
            previousDrawings.insertBefore(galleryHeader, recentDrawingsList);
            previousDrawings.insertBefore(drawingsGallery, recentDrawingsList);
        }
        
        // Create fullscreen container for result canvas if it doesn't exist
        let fullscreenContainer = document.querySelector('.fullscreen-container');
        
        // If fullscreen container already exists in HTML (as per our new structure)
        if (fullscreenContainer && fullscreenContainer.contains(resultCanvas)) {
            // Just add the fullscreen button and controls
        } else {
            // Legacy support: create and move canvas into fullscreen container
            const resultCanvasParent = resultCanvas.parentElement;
            fullscreenContainer = document.createElement('div');
            fullscreenContainer.className = 'fullscreen-container';
            resultCanvasParent.insertBefore(fullscreenContainer, resultCanvas);
            fullscreenContainer.appendChild(resultCanvas);
        }
        
        // Add fullscreen button
        const fullscreenBtn = document.createElement('button');
        fullscreenBtn.className = 'fullscreen-btn';
        fullscreenBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>';
        fullscreenBtn.title = 'Toggle Fullscreen';
        fullscreenBtn.addEventListener('click', toggleFullscreen);
        
        // Add controls overlay for fullscreen mode
        const controlsOverlay = document.createElement('div');
        controlsOverlay.className = 'controls-overlay';
        
        // Follow mode button
        const followBtn = document.createElement('button');
        followBtn.className = 'control-btn';
        followBtn.id = 'followOverlayBtn';
        followBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="4"></circle></svg>';
        followBtn.title = 'Follow Drawing Tip';
        followBtn.addEventListener('click', toggleFollowMode);
        
        // Zoom controls
        const zoomOutBtn = document.createElement('button');
        zoomOutBtn.className = 'control-btn';
        zoomOutBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line></svg>';
        zoomOutBtn.title = 'Zoom Out';
        zoomOutBtn.addEventListener('click', () => changeZoom(0.75));
        
        const zoomLabel = document.createElement('span');
        zoomLabel.className = 'zoom-label';
        zoomLabel.id = 'zoomOverlayLabel';
        zoomLabel.textContent = '100%';
        
        const zoomInBtn = document.createElement('button');
        zoomInBtn.className = 'control-btn';
        zoomInBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>';
        zoomInBtn.title = 'Zoom In';
        zoomInBtn.addEventListener('click', () => changeZoom(1.25));
        
        // Speed controls
        const speedSlowerBtn = document.createElement('button');
        speedSlowerBtn.className = 'control-btn';
        speedSlowerBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="11 17 6 12 11 7"></polyline><polyline points="18 17 13 12 18 7"></polyline></svg>';
        speedSlowerBtn.title = 'Slower';
        speedSlowerBtn.addEventListener('click', () => adjustSpeed(2));
        
        const speedLabel = document.createElement('span');
        speedLabel.className = 'speed-label';
        speedLabel.id = 'speedOverlayLabel';
        speedLabel.textContent = '1×';
        
        const speedFasterBtn = document.createElement('button');
        speedFasterBtn.className = 'control-btn';
        speedFasterBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="13 17 18 12 13 7"></polyline><polyline points="6 17 11 12 6 7"></polyline></svg>';
        speedFasterBtn.title = 'Faster';
        speedFasterBtn.addEventListener('click', () => adjustSpeed(0.5));
        
        // Reset view button
        const resetViewBtn = document.createElement('button');
        resetViewBtn.className = 'control-btn';
        resetViewBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0z"></path><path d="M17 12l-6-6v12l6-6z"></path></svg>';
        resetViewBtn.title = 'Reset View';
        resetViewBtn.addEventListener('click', resetZoomAndPan);
        
        // Add indicator for follow mode
        const indicator = document.createElement('div');
        indicator.className = 'indicator';
        indicator.id = 'followIndicator';
        indicator.textContent = 'Following Tip';
        indicator.style.display = 'none';
        
        // Add all controls to the overlay
        controlsOverlay.appendChild(followBtn);
        controlsOverlay.appendChild(document.createElement('div')).className = 'separator';
        controlsOverlay.appendChild(zoomOutBtn);
        controlsOverlay.appendChild(zoomLabel);
        controlsOverlay.appendChild(zoomInBtn);
        controlsOverlay.appendChild(document.createElement('div')).className = 'separator';
        controlsOverlay.appendChild(speedSlowerBtn);
        controlsOverlay.appendChild(speedLabel);
        controlsOverlay.appendChild(speedFasterBtn);
        controlsOverlay.appendChild(document.createElement('div')).className = 'separator';
        controlsOverlay.appendChild(resetViewBtn);
        
        // Add elements to container
        fullscreenContainer.appendChild(fullscreenBtn);
        fullscreenContainer.appendChild(controlsOverlay);
        fullscreenContainer.appendChild(indicator);
        
        // Add event listener for fullscreen change
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', handleFullscreenChange);
        document.addEventListener('MSFullscreenChange', handleFullscreenChange);
        
        // Add zoom and pan event listeners
        setupZoomAndPan();
        
        // Add existing controls with minimalist styling
        const advancedControls = document.createElement('div');
        advancedControls.className = 'advanced-controls';
        
        // Create existing controls with updated styling...
        // ...existing code for advanced controls...
    }
    
    function initializeCanvases() {
        // Set up high resolution canvas
        setupHighResCanvas(drawingCanvas);
        setupHighResCanvas(resultCanvas);
        
        // Clear canvases
        drawingCtx.fillStyle = '#2d2d2d';
        drawingCtx.fillRect(0, 0, drawingCanvas.width, drawingCanvas.height);
        resultCtx.fillStyle = '#2d2d2d';
        resultCtx.fillRect(0, 0, resultCanvas.width, resultCanvas.height);
        
        // Set line styles
        drawingCtx.lineWidth = 3;
        drawingCtx.lineCap = 'round';
        drawingCtx.lineJoin = 'round';
        drawingCtx.strokeStyle = '#e0e0e0';
        
        resultCtx.lineWidth = 2;
        resultCtx.lineCap = 'round';
        resultCtx.lineJoin = 'round';
    }
    
    function setupHighResCanvas(canvas) {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        
        // Set canvas dimensions to match display size * pixel ratio
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        
        // Set CSS dimensions to match desired display size
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
        
        // Scale the context to match the display pixel ratio
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
    }

    // Drawing event listeners
    drawingCanvas.addEventListener('mousedown', startDrawing);
    drawingCanvas.addEventListener('mousemove', draw);
    drawingCanvas.addEventListener('mouseup', stopDrawing);
    drawingCanvas.addEventListener('mouseout', stopDrawing);
    
    // Mobile touch support
    drawingCanvas.addEventListener('touchstart', function(e) {
        e.preventDefault();
        startDrawing(e.touches[0]);
    });
    drawingCanvas.addEventListener('touchmove', function(e) {
        e.preventDefault();
        draw(e.touches[0]);
    });
    drawingCanvas.addEventListener('touchend', stopDrawing);
    
    // Button event listeners
    clearBtn.addEventListener('click', clearDrawing);
    submitBtn.addEventListener('click', submitDrawing);
    playPauseBtn.addEventListener('click', toggleAnimation);
    resetBtn.addEventListener('click', resetAnimation);
    
    function startDrawing(e) {
        isDrawing = true;
        startTime = Date.now();
        points = [];
        
        // Get canvas position for accurate coordinates
        const rect = drawingCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        drawingCtx.beginPath();
        drawingCtx.moveTo(x, y);
        
        // Add first point
        points.push({
            x: x,
            y: y,
            time: 0
        });
    }
    
    function draw(e) {
        if (!isDrawing) return;
        
        const rect = drawingCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Draw line on canvas
        drawingCtx.lineTo(x, y);
        drawingCtx.stroke();
        
        // Add point to array with timestamp
        const time = (Date.now() - startTime) / 1000;
        points.push({
            x: x,
            y: y,
            time: time
        });
    }
    
    function stopDrawing() {
        isDrawing = false;
    }
    
    function clearDrawing() {
        drawingCtx.fillStyle = '#2d2d2d';
        drawingCtx.fillRect(0, 0, drawingCanvas.width, drawingCanvas.height);
        drawingCtx.beginPath();
        points = [];
    }
    
    // Normalize points by subtracting mean X and Y
    function normalizePoints(inputPoints) {
        if (inputPoints.length === 0) return [];
        
        // Calculate mean X and Y
        let sumX = 0, sumY = 0;
        inputPoints.forEach(point => {
            sumX += point.x;
            sumY += point.y;
        });
        
        const meanX = sumX / inputPoints.length;
        const meanY = sumY / inputPoints.length;
        
        // Normalize points by subtracting mean
        return inputPoints.map(point => ({
            x: Math.round(point.x - meanX),
            y: Math.round(point.y - meanY),
            time: point.time
        }));
    }
    
    async function submitDrawing() {
        if (points.length < 2) {
            alert('Please draw something first!');
            return;
        }
        
        loadingIndicator.classList.remove('hidden');
        
        try {
            // Get vector count from input
            const vectorCountInput = document.getElementById('vectorCount');
            let maxVectors = 100; // Default value
            
            if (vectorCountInput && !isNaN(parseInt(vectorCountInput.value))) {
                maxVectors = Math.max(10, Math.min(500, parseInt(vectorCountInput.value)));
            }
            
            // Normalize points before sending
            const normalizedPoints = normalizePoints(points);
            
            console.log('Submitting drawing:', normalizedPoints);
            const response = await fetch(`${API_URL}/drawing`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    points: normalizedPoints,
                    maxVectors: maxVectors
                })
            });
            
            const data = await response.json();
            console.log('Drawing submitted:', data);
            currentDrawingId = data.id;
            console.log('Current drawing ID:', currentDrawingId);
            // Wait for processing to complete and get results
            pollDrawingResults(currentDrawingId);
            
        } catch (error) {
            console.error('Error submitting drawing:', error);
            loadingIndicator.classList.add('hidden');
            alert('Failed to submit drawing. Please try again.');
        }
    }
    
    async function pollDrawingResults(drawingId) {
        // Clear any existing polling interval
        if (pollingIntervalId) {
            clearInterval(pollingIntervalId);
        }

        // Initialize lastChangeTimestamp to now
        lastChangeTimestamp = Date.now();
        
        // Setup polling interval
        pollingIntervalId = setInterval(async () => {
            try {
                const response = await fetch(`${API_URL}/drawing/${drawingId}`);
                const data = await response.json();
                console.log('Polling drawing results:', data);
                
                // Check if response has changed by comparing JSON strings
                const currentResponseStr = JSON.stringify(data);
                const hasChanged = lastDrawingResponse !== currentResponseStr || (data.drawVectors.length == 0);
                console.log('Response changed:', hasChanged);
                if (hasChanged) {
                    // Update last change time and response
                    lastChangeTimestamp = Date.now();
                    lastDrawingResponse = currentResponseStr;
                    
                    // Check if we have vectors to animate - handle both data structures
                    // The API might return vectors directly in drawVectors array or in drawVectors.calculated
                    const vectors = Array.isArray(data.drawVectors) ? data.drawVectors : 
                                   (data.drawVectors && data.drawVectors.calculated) ? data.drawVectors.calculated : null;
                    
                    if (vectors && vectors.length > 0) {
                        drawVectors = vectors;
                        
                        // Sort vectors by frequency (n)l
                        drawVectors.sort((a, b) => Math.abs(a.n) - Math.abs(b.n));
                        
                        // Start animation
                        startAnimation();
                        
                        // Hide loading indicator (but continue polling)
                        loadingIndicator.classList.add('hidden');
                    }
                } else {
                    // Check if 10 seconds have passed without changes
                    const timeSinceChange = Date.now() - lastChangeTimestamp;
                    if (timeSinceChange > 10000) {
                        // Stop polling after 10 seconds of no changes
                        clearInterval(pollingIntervalId);
                        loadingIndicator.classList.add('hidden');
                        
                        // Final check - if we don't have vectors yet, show message
                        const vectors = Array.isArray(data.drawVectors) ? data.drawVectors : 
                                      (data.drawVectors && data.drawVectors.calculated) ? data.drawVectors.calculated : null;
                        
                        if (!vectors || vectors.length === 0) {
                            console.log('Polling complete but no vectors available');
                            alert('Drawing saved, but Fourier vectors calculation appears to be incomplete.');
                        }
                        
                        // Refresh the recent drawings list
                        loadRecentDrawings();
                    }
                }
                
            } catch (error) {
                console.error('Error polling results:', error);
                clearInterval(pollingIntervalId);
                loadingIndicator.classList.add('hidden');
                alert('Failed to get processing results. Please try again.');
            }
        }, 1000); // Poll every second
    }
    
    function startAnimation() {
        if (animationId) {
            cancelAnimationFrame(animationId);
        }
        
        isAnimating = true;
        let time = 0;
        const period = 5; // Animation period in seconds
        
        // Store path points for drawing
        const pathHistory = [];
        const maxPathPoints = 1000; // Maximum points to store for the trail
        
        function animate() {
            if (!isAnimating) return;
            
            // Get device pixel ratio for proper scaling
            const dpr = window.devicePixelRatio || 1;
            const adjustedWidth = resultCanvas.width / dpr;
            const adjustedHeight = resultCanvas.height / dpr;
            
            // Clear canvas with improved dark background
            resultCtx.fillStyle = '#181818';
            resultCtx.fillRect(0, 0, adjustedWidth, adjustedHeight);
            
            // Save the current transform state
            resultCtx.save();
            
            // Apply zoom and pan transformations
            resultCtx.translate(adjustedWidth / 2, adjustedHeight / 2);
            resultCtx.scale(zoomLevel, zoomLevel);
            
            // Apply user panning or follow mode
            let viewOffsetX = panOffsetX;
            let viewOffsetY = panOffsetY;
            
            // Calculate current point position for follow mode
            let currentX = 0;
            let currentY = 0;
            
            drawVectors.forEach(vector => {
                const n = vector.n;
                const real = vector.real;
                const imaginary = vector.imaginary;
                
                const angle = (n * time * 2 * Math.PI) / period;
                const nextX = real * Math.cos(angle) - imaginary * Math.sin(angle);
                const nextY = real * Math.sin(angle) + imaginary * Math.cos(angle);
                
                currentX += nextX;
                currentY += nextY;
            });
            
            // In follow mode, adjust view to keep drawing tip centered
            if (isFollowMode) {
                viewOffsetX = -currentX;
                viewOffsetY = -currentY;
            }
            
            resultCtx.translate(viewOffsetX, viewOffsetY);
            
            // Draw grid with more subtle lines
            resultCtx.strokeStyle = 'rgba(60, 60, 60, 0.2)';
            drawGrid(resultCtx, adjustedWidth / zoomLevel, adjustedHeight / zoomLevel);
            
            // Draw axes with improved styling
            resultCtx.strokeStyle = 'rgba(100, 100, 100, 0.5)';
            resultCtx.lineWidth = 1 / zoomLevel;
            resultCtx.beginPath();
            resultCtx.moveTo(-adjustedWidth, 0);
            resultCtx.lineTo(adjustedWidth, 0);
            resultCtx.moveTo(0, -adjustedHeight);
            resultCtx.lineTo(0, adjustedHeight);
            resultCtx.stroke();
            
            // Start at center of transformed space
            let x = 0;
            let y = 0;
            
            // Define color gradient parameters
            const baseHue = 200; // Blue base
            const hueRange = 260; // Full color spectrum
            const baseSaturation = 80;
            const baseLightness = 60;
            const alpha = 0.5;
            
            // Draw epicycles with color gradient based on frequency
            resultCtx.lineWidth = 1 / zoomLevel;
            
            // First pass - draw circles
            for (let i = 0; i < drawVectors.length; i++) {
                const vector = drawVectors[i];
                const n = vector.n;
                const real = vector.real;
                const imaginary = vector.imaginary;
                
                // Calculate position
                const angle = (n * time * 2 * Math.PI) / period;
                const nextX = real * Math.cos(angle) - imaginary * Math.sin(angle);
                const nextY = real * Math.sin(angle) + imaginary * Math.cos(angle);
                
                // Calculate color based on vector's position in the sequence
                const normalizedIndex = i / drawVectors.length;
                const hue = (baseHue + normalizedIndex * hueRange) % 360;
                const saturation = baseSaturation - (normalizedIndex * 20);
                const lightness = baseLightness - (normalizedIndex * 10);
                
                // Set color for this circle
                resultCtx.strokeStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
                
                // Draw circle for this epicycle
                resultCtx.beginPath();
                resultCtx.arc(x, y, Math.sqrt(nextX*nextX + nextY*nextY), 0, 2 * Math.PI);
                resultCtx.stroke();
                
                // Move to next circle center
                x += nextX;
                y += nextY;
            }
            
            // Reset to center for second pass to draw the lines
            x = 0;
            y = 0;
            
            // Second pass - draw lines connecting circles
            resultCtx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            resultCtx.lineWidth = 0.8 / zoomLevel;
            
            for (let i = 0; i < drawVectors.length; i++) {
                const vector = drawVectors[i];
                const n = vector.n;
                const real = vector.real;
                const imaginary = vector.imaginary;
                
                // Calculate epicycle component
                const angle = (n * time * 2 * Math.PI) / period;
                const nextX = real * Math.cos(angle) - imaginary * Math.sin(angle);
                const nextY = real * Math.sin(angle) + imaginary * Math.cos(angle);
                
                // Draw line from center to edge of circle
                resultCtx.beginPath();
                resultCtx.moveTo(x, y);
                x += nextX;
                y += nextY;
                resultCtx.lineTo(x, y);
                resultCtx.stroke();
            }
            
            // Add current point to path history
            pathHistory.push({x: x, y: y});
            
            // Keep path history to maximum length
            while (pathHistory.length > maxPathPoints) {
                pathHistory.shift();
            }
            
            // Draw the path with vibrant color and glow
            if (pathHistory.length > 1) {
                resultCtx.strokeStyle = '#00e5ff';
                resultCtx.lineWidth = 2.5 / zoomLevel;
                
                // Use shadow for better visibility
                resultCtx.shadowColor = '#00e5ff';
                resultCtx.shadowBlur = 8 / zoomLevel;
                
                resultCtx.beginPath();
                resultCtx.moveTo(pathHistory[0].x, pathHistory[0].y);
                
                for (let i = 1; i < pathHistory.length; i++) {
                    resultCtx.lineTo(pathHistory[i].x, pathHistory[i].y);
                }
                
                resultCtx.stroke();
                
                // Reset shadow
                resultCtx.shadowColor = 'transparent';
                resultCtx.shadowBlur = 0;
                
                // Draw a glowing dot at the current point
                resultCtx.fillStyle = '#00e5ff';
                resultCtx.beginPath();
                resultCtx.arc(x, y, 4 / zoomLevel, 0, 2 * Math.PI);
                resultCtx.fill();
            }
            
            // Restore original transform
            resultCtx.restore();
            
            // Draw indicators
            const indicators = [];
            
            if (isFollowMode) {
                indicators.push('Following Tip');
            }
            
            if (speedFactor > 1) {
                indicators.push(`${speedFactor}× Slower`);
            }
            
            // Display indicators
            if (indicators.length > 0) {
                resultCtx.fillStyle = 'rgba(0,0,0,0.7)';
                resultCtx.fillRect(5, adjustedHeight - 25, 160, 20);
                resultCtx.fillStyle = '#29b6f6';
                resultCtx.font = '12px sans-serif';
                resultCtx.textAlign = 'left';
                resultCtx.fillText(indicators.join(' • '), 10, adjustedHeight - 10);
            }
            
            // Increment time (slower with higher speedFactor)
            time = (time + (0.01 / speedFactor)) % period;
            
            animationId = requestAnimationFrame(animate);
        }
        
        animate();
    }

    function resetAnimation() {
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
        
        // Reset zoom, pan, and speed when resetting animation
        resetZoomAndPan();
        setSpeedFactor(1);
        isFollowMode = false;
        
        const followBtn = document.getElementById('followModeBtn');
        if (followBtn) {
            followBtn.textContent = 'Follow Tip: OFF';
            followBtn.classList.remove('active');
        }
        
        // Updated background color to match the dark theme
        resultCtx.fillStyle = '#2d2d2d';
        resultCtx.fillRect(0, 0, resultCanvas.width, resultCanvas.height);
        isAnimating = false;
    }
    
    function drawGrid(ctx, width, height) {
        const gridSize = 25 / zoomLevel;
        
        // Adjust grid size based on zoom level for better visibility
        let stepSize = 25;
        if (zoomLevel < 0.5) stepSize = 50;
        if (zoomLevel > 2) stepSize = 10;
        if (zoomLevel > 5) stepSize = 5;
        
        // Calculate visible area boundaries
        const startX = -width / 2 - panOffsetX;
        const endX = width / 2 - panOffsetX;
        const startY = -height / 2 - panOffsetY;
        const endY = height / 2 - panOffsetY;
        
        // Round to nearest grid step to align grid properly
        const gridStartX = Math.floor(startX / stepSize) * stepSize;
        const gridStartY = Math.floor(startY / stepSize) * stepSize;
        
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 0.5 / zoomLevel;
        
        // Draw vertical grid lines
        for (let x = gridStartX; x <= endX; x += stepSize) {
            ctx.beginPath();
            ctx.moveTo(x, startY);
            ctx.lineTo(x, endY);
            ctx.stroke();
        }
        
        // Draw horizontal grid lines
        for (let y = gridStartY; y <= endY; y += stepSize) {
            ctx.beginPath();
            ctx.moveTo(startX, y);
            ctx.lineTo(endX, y);
            ctx.stroke();
        }
    }
    
    function toggleAnimation() {
        if (drawVectors.length === 0) {
            alert('No drawing data to animate.');
            return;
        }
        
        isAnimating = !isAnimating;
        if (isAnimating) {
            startAnimation();
        }
    }
    
    async function loadRecentDrawings() {
        try {
            const response = await fetch(`${API_URL}/drawings/recent`);
            const drawings = await response.json();
            
            // Clear existing list and gallery
            recentDrawingsList.innerHTML = '';
            drawingsGallery.innerHTML = '';
            
            // Add each drawing to the list
            drawings.forEach(drawing => {
                // Add to text list
                const li = document.createElement('li');
                li.textContent = `Drawing #${drawing.id}`;
                li.dataset.id = drawing.id;
                li.addEventListener('click', () => loadDrawing(drawing.id));
                recentDrawingsList.appendChild(li);
                
                // Create thumbnail
                createThumbnail(drawing);
            });
            
        } catch (error) {
            console.error('Failed to load recent drawings:', error);
        }
    }
    
    function createThumbnail(drawing) {
        // Create thumbnail container
        const thumbnail = document.createElement('div');
        thumbnail.className = 'drawing-thumbnail';
        thumbnail.dataset.id = drawing.id;
        
        // Create canvas for thumbnail
        const canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');
        
        // Fill background
        ctx.fillStyle = '#2d2d2d';
        ctx.fillRect(0, 0, 100, 100);
        
        // If SVG path is available, draw it
        if (drawing.svgPath) {
            ctx.strokeStyle = '#e0e0e0';
            ctx.lineWidth = 2;
            
            // Parse SVG path and draw on canvas
            const path = new Path2D(drawing.svgPath);
            ctx.stroke(path);
        } else {
            // If no SVG, just show the ID
            ctx.fillStyle = '#e0e0e0';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = '24px sans-serif';
            ctx.fillText(`#${drawing.id}`, 50, 50);
        }
        
        thumbnail.appendChild(canvas);
        
        // Add label
        const label = document.createElement('div');
        label.className = 'drawing-label';
        label.textContent = `Drawing #${drawing.id}`;
        thumbnail.appendChild(label);
        
        // Add click handler
        thumbnail.addEventListener('click', () => {
            // Highlight selected thumbnail
            document.querySelectorAll('.drawing-thumbnail').forEach(el => {
                el.classList.remove('active');
            });
            thumbnail.classList.add('active');
            
            // Load the drawing
            loadDrawing(drawing.id);
        });
        
        drawingsGallery.appendChild(thumbnail);
    }
    
    async function loadDrawing(id) {
        try {
            const response = await fetch(`${API_URL}/drawing/${id}`);
            const drawing = await response.json();
            
            // Update current drawing ID
            currentDrawingId = drawing.id;
            
            // Get vectors - handle both data structures
            const vectors = Array.isArray(drawing.drawVectors) ? drawing.drawVectors : 
                           (drawing.drawVectors && drawing.drawVectors.calculated) ? drawing.drawVectors.calculated : null;
            
            if (vectors && vectors.length > 0) {
                drawVectors = vectors;
                drawVectors.sort((a, b) => Math.abs(a.n) - Math.abs(b.n));
                
                // Draw the original points on the drawing canvas
                clearDrawing();
                if (drawing.points && drawing.points.length > 0) {
                    drawingCtx.strokeStyle = '#e0e0e0';
                    drawingCtx.lineWidth = 3;
                    drawingCtx.beginPath();
                    
                    // Get device pixel ratio for proper scaling
                    const dpr = window.devicePixelRatio || 1;
                    const centerX = (drawingCanvas.width / dpr) / 2;
                    const centerY = (drawingCanvas.height / dpr) / 2;
                    
                    // Center the drawing on the canvas
                    const points = normalizePoints(drawing.points);
                    const firstPoint = points[0];
                    drawingCtx.moveTo(firstPoint.x + centerX, firstPoint.y + centerY);
                    
                    points.forEach(point => {
                        drawingCtx.lineTo(point.x + centerX, point.y + centerY);
                    });
                    
                    // Add shadow for nicer look
                    drawingCtx.shadowColor = 'rgba(224, 224, 224, 0.5)';
                    drawingCtx.shadowBlur = 2;
                    drawingCtx.stroke();
                    drawingCtx.shadowColor = 'transparent';
                }
                
                // Start animation
                resetAnimation();
                startAnimation();
                
                // Highlight the selected thumbnail
                document.querySelectorAll('.drawing-thumbnail').forEach(el => {
                    el.classList.remove('active');
                });
                const selectedThumb = document.querySelector(`.drawing-thumbnail[data-id="${id}"]`);
                if (selectedThumb) selectedThumb.classList.add('active');
            } else {
                alert('This drawing does not have calculated vectors yet.');
            }
            
        } catch (error) {
            console.error('Failed to load drawing:', error);
            alert('Failed to load the drawing. Please try again.');
        }
    }

    function setupZoomAndPan() {
        // Mouse wheel zoom
        resultCanvas.addEventListener('wheel', function(e) {
            e.preventDefault();
            
            const rect = resultCanvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            // Determine zoom direction
            const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
            
            // Zoom centered on mouse position
            zoomAtPoint(mouseX, mouseY, zoomFactor);
        });
        
        // Mouse drag to pan
        resultCanvas.addEventListener('mousedown', function(e) {
            isDragging = true;
            resultCanvas.classList.add('panning');
            lastMouseX = e.clientX;
            lastMouseY = e.clientY;
        });
        
        resultCanvas.addEventListener('mousemove', function(e) {
            if (!isDragging) return;
            
            const dx = e.clientX - lastMouseX;
            const dy = e.clientY - lastMouseY;
            
            panOffsetX += dx / zoomLevel;
            panOffsetY += dy / zoomLevel;
            
            lastMouseX = e.clientX;
            lastMouseY = e.clientY;
            
            // Redraw if not animating
            if (!isAnimating && drawVectors.length > 0) {
                startAnimation();
            }
        });
        
        resultCanvas.addEventListener('mouseup', function() {
            isDragging = false;
            resultCanvas.classList.remove('panning');
        });
        
        resultCanvas.addEventListener('mouseleave', function() {
            isDragging = false;
            resultCanvas.classList.remove('panning');
        });
    }

    function zoomAtPoint(x, y, factor) {
        // Convert screen coordinates to canvas coordinates
        const dpr = window.devicePixelRatio || 1;
        const rect = resultCanvas.getBoundingClientRect();
        const canvasX = (x - rect.left) * dpr / zoomLevel;
        const canvasY = (y - rect.top) * dpr / zoomLevel;
        
        // Calculate new zoom level - increased maximum to 100000
        const newZoomLevel = Math.max(0.25, Math.min(100000, zoomLevel * factor));
        
        // Adjust pan offset to keep mouse point at the same position
        panOffsetX = (panOffsetX + canvasX) - (canvasX * zoomLevel / newZoomLevel);
        panOffsetY = (panOffsetY + canvasY) - (canvasY * zoomLevel / newZoomLevel);
        
        setZoomLevel(newZoomLevel);
    }

    function setZoomLevel(newLevel) {
        zoomLevel = newLevel;
        
        // Update zoom inputs
        const zoomInput = document.getElementById('zoomInput');
        if (zoomInput) {
            zoomInput.value = Math.round(zoomLevel * 100);
        }
        
        const zoomOverlayLabel = document.getElementById('zoomOverlayLabel');
        if (zoomOverlayLabel) {
            zoomOverlayLabel.textContent = `${Math.round(zoomLevel * 100)}%`;
        }
        
        // Redraw if not animating
        if (!isAnimating && drawVectors.length > 0) {
            startAnimation();
        }
    }

    function changeZoom(factor) {
        const rect = resultCanvas.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        zoomAtPoint(centerX, centerY, factor);
    }

    function resetZoomAndPan() {
        zoomLevel = 1;
        panOffsetX = 0;
        panOffsetY = 0;
        
        const zoomInput = document.getElementById('zoomInput');
        if (zoomInput) {
            zoomInput.value = 100;
        }
        
        // Redraw if not animating
        if (!isAnimating && drawVectors.length > 0) {
            startAnimation();
        }
    }

    function adjustSpeed(factor) {
        // Increased maximum slowdown to 500x
        const newSpeed = Math.min(500, Math.max(1, Math.round(speedFactor * factor)));
        setSpeedFactor(newSpeed);
    }

    function setSpeedFactor(newSpeed) {
        speedFactor = newSpeed;
        
        // Update speed inputs
        const speedInput = document.getElementById('speedInput');
        if (speedInput) {
            speedInput.value = speedFactor;
        }
        
        const speedOverlayLabel = document.getElementById('speedOverlayLabel');
        if (speedOverlayLabel) {
            speedOverlayLabel.textContent = `${speedFactor}×`;
        }
    }

    function toggleFollowMode() {
        isFollowMode = !isFollowMode;
        
        // Update both normal and overlay button
        const followBtn = document.getElementById('followModeBtn');
        const followOverlayBtn = document.getElementById('followOverlayBtn');
        const followIndicator = document.getElementById('followIndicator');
        
        if (followBtn) {
            followBtn.textContent = isFollowMode ? 'Follow Tip: ON' : 'Follow Tip: OFF';
            followBtn.classList.toggle('active', isFollowMode);
        }
        
        if (followOverlayBtn) {
            followOverlayBtn.classList.toggle('active', isFollowMode);
        }
        
        if (followIndicator) {
            followIndicator.style.display = isFollowMode ? 'block' : 'none';
        }
        
        if (isFollowMode) {
            // Reset pan offset when entering follow mode
            panOffsetX = 0;
            panOffsetY = 0;
        }
    }

    function toggleFullscreen() {
        const container = document.querySelector('.fullscreen-container');
        
        if (!isFullscreen) {
            // Enter fullscreen
            if (container.requestFullscreen) {
                container.requestFullscreen();
            } else if (container.mozRequestFullScreen) {
                container.mozRequestFullScreen();
            } else if (container.webkitRequestFullscreen) {
                container.webkitRequestFullscreen();
            } else if (container.msRequestFullscreen) {
                container.msRequestFullscreen();
            }
        } else {
            // Exit fullscreen
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
    }
    
    function handleFullscreenChange() {
        isFullscreen = !!(
            document.fullscreenElement ||
            document.webkitFullscreenElement ||
            document.mozFullScreenElement ||
            document.msFullscreenElement
        );
        
        const container = document.querySelector('.fullscreen-container');
        const fullscreenBtn = document.querySelector('.fullscreen-btn');
        
        if (isFullscreen) {
            container.classList.add('active');
            fullscreenBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 14h6m0 0v6m0-6L3 21m7-11h6m0 0V4m0 6l7-7"></path></svg>';
            
            // Resize canvas to fill screen
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            
            // Save original dimensions for restoration later
            if (!resultCanvas.originalWidth) {
                resultCanvas.originalWidth = resultCanvas.width;
                resultCanvas.originalHeight = resultCanvas.height;
                resultCanvas.originalStyleWidth = resultCanvas.style.width;
                resultCanvas.originalStyleHeight = resultCanvas.style.height;
            }
            
            // Update canvas display size
            resultCanvas.style.width = `${viewportWidth}px`;
            resultCanvas.style.height = `${viewportHeight}px`;
            
            // Then update the actual canvas dimensions
            const dpr = window.devicePixelRatio || 1;
            resultCanvas.width = viewportWidth * dpr;
            resultCanvas.height = viewportHeight * dpr;
            
            // Reset the scaling context
            resultCtx.setTransform(1, 0, 0, 1, 0, 0);
            resultCtx.scale(dpr, dpr);
            
        } else {
            container.classList.remove('active');
            fullscreenBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>';
            
            // Restore original canvas dimensions
            if (resultCanvas.originalWidth) {
                resultCanvas.width = resultCanvas.originalWidth;
                resultCanvas.height = resultCanvas.originalHeight;
                
                if (resultCanvas.originalStyleWidth) {
                    resultCanvas.style.width = resultCanvas.originalStyleWidth;
                    resultCanvas.style.height = resultCanvas.originalStyleHeight;
                } else {
                    // If no original style dimensions were saved, use a reasonable default
                    const rect = container.getBoundingClientRect();
                    resultCanvas.style.width = `${rect.width}px`;
                    resultCanvas.style.height = `${rect.width}px`; // Square canvas
                }
                
                // Reset the canvas context to correct scaling
                const dpr = window.devicePixelRatio || 1;
                resultCtx.setTransform(1, 0, 0, 1, 0, 0);
                resultCtx.scale(dpr, dpr);
            } else {
                // Fallback if original dimensions weren't saved
                setupHighResCanvas(resultCanvas);
            }
        }
        
        // Restart animation if active
        if (isAnimating) {
            cancelAnimationFrame(animationId);
            startAnimation();
        }
    }
    
    // Add window resize listener to handle orientation changes in fullscreen
    window.addEventListener('resize', function() {
        if (isFullscreen) {
            // Update canvas size to match the new viewport size
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            
            // Update canvas display size
            resultCanvas.style.width = `${viewportWidth}px`;
            resultCanvas.style.height = `${viewportHeight}px`;
            
            // Then update the actual canvas dimensions
            const dpr = window.devicePixelRatio || 1;
            resultCanvas.width = viewportWidth * dpr;
            resultCanvas.height = viewportHeight * dpr;
            
            // Reset the scaling context
            resultCtx.setTransform(1, 0, 0, 1, 0, 0); // Reset any existing transform
            resultCtx.scale(dpr, dpr);
            
            // Redraw if animating
            if (isAnimating) {
                cancelAnimationFrame(animationId);
                startAnimation();
            }
        }
    });
});
