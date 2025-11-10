let sourceImage;
let artCanvas; // define artCanvas
let ready = false; // track if art is ready

//  sampling parameters to control the size and ignore the imperfection of the map image
const SAMPLE_STEP = 25;
const UNIT_SIZE = 30;

function preload() {
  sourceImage = loadImage('Street.png'); 
  // load image https://p5js.org/reference/p5/preload/
}

function setup() {
  createCanvas(1920, 1080); // create main canvas
  
  // create graphics buffer for art generation
  artCanvas = createGraphics(600, 600);
  artCanvas.pixelDensity(1); // https://p5js.org/reference/p5/loadPixels/ // Get the pixel density.
  
  noLoop(); // stop continuous drawing
  generateArt();
  ready = true;
}

function draw() {
  background(255);
  // Draw the image.
  drawBackground();
  
  // display generated art in frame if ready
  if (ready) {
    image(artCanvas, 656, 152, 600, 600);
  }
}

// Click to regenerate artwork
function mousePressed() {
  generateArt();
  redraw();
}

// base color like mondrian
let colors = {
  gray: '#d6d7d2',
  yellow: '#e1c927',
  red: '#ad372b',
  blue: '#314294',
  bg: '#f3f4ef'
};

function generateArt() {
  // setup artCanvas 
  artCanvas.push();
  artCanvas.clear();
  artCanvas.background(colors.bg);
  artCanvas.noStroke();

    // First draw the large square layer
  drawSVGBlocks();

  // Then draw the road sampling layer.
  
  // https://p5js.org/reference/p5/loadPixels/
  sourceImage.loadPixels();
  
  // scale & blocksize
  const scaleX = artCanvas.width / sourceImage.width;
  const scaleY = artCanvas.height / sourceImage.height;
  const blockSize = UNIT_SIZE * Math.min(scaleX, scaleY);
  
  // create grid for storing colors
  const rows = Math.ceil(sourceImage.height / SAMPLE_STEP);
  const cols = Math.ceil(sourceImage.width / SAMPLE_STEP);
  const grid = Array(rows).fill().map(function() {
    return Array(cols).fill(null);
  });
  
  // sample pixels and draw colored squares
  for (let y = 0, row = 0; y < sourceImage.height; y += SAMPLE_STEP, row++) {
    for (let x = 0, col = 0; x < sourceImage.width; x += SAMPLE_STEP, col++) {
      // Get pixel color
      const idx = (y * sourceImage.width + x) * 4;
      const r = sourceImage.pixels[idx];
      const g = sourceImage.pixels[idx + 1];
      const b = sourceImage.pixels[idx + 2];
      
      // Check if it's a road pixel (white color)
      if (r > 240 && g > 240 && b > 240) {
        grid[row][col] = chooseColor(grid, row, col);
      }
    }
  }
  
  // draw rectangles from grid
  for (let y = 0, row = 0; y < sourceImage.height; y += SAMPLE_STEP, row++) {
    for (let x = 0, col = 0; x < sourceImage.width; x += SAMPLE_STEP, col++) {
      if (grid[row][col]) {
        // Draw colored rectangle
        artCanvas.fill(grid[row][col]);
        artCanvas.rect(x * scaleX, y * scaleY, blockSize, blockSize);
      }
    }
  }
  
  artCanvas.pop();
}

// Mondrian-style big blocks
function drawSVGBlocks() {
  const g = artCanvas;
  g.noStroke();

  const cls1 = '#314294';
  const cls2 = '#ad372b';
  const cls3 = '#e1c927';
  const cls4 = '#d6d7d2';

  const s = 1600 / 600;

  function R(x, y, w, h, c) {
    g.fill(c);
    g.rect(Math.round(x / s), Math.round(y / s), Math.round(w / s), Math.round(h / s));
  }

  R(910, 305, 275, 420, cls1);
  R(910, 390, 275, 230, cls2);
  R(960, 450, 160, 100, cls3);
  R(80, 1160, 160, 140, cls3);
  R(230, 960, 150, 130, cls1);
  R(1450, 1450, 165, 165, cls3);
  R(730, 280, 95, 95, cls3);
  R(385, 1300, 195, 310, cls2);
  R(450, 1360, 60, 60, cls4);
  R(1005, 1060, 175, 390, cls1);
  R(1025, 1295, 125, 100, cls3);
  R(150, 455, 225, 120, cls1);
  R(280, 160, 205, 85, cls2);
  R(1380, 70, 180, 120, cls1);
  R(1400, 625, 210, 210, cls2);
  R(1270, 865, 130, 190, cls3);
  R(610, 945, 215, 215, cls3);
  R(385, 740, 220, 90, cls2);
  R(830, 730, 155, 155, cls2);
  R(1470, 700, 80, 60, cls4);
  R(280, 1000, 50, 50, cls4);
  R(670, 1020, 80, 80, cls4);
  R(320, 160, 80, 85, cls4);
  R(1295, 915, 75, 75, cls4);
  R(750, 305, 45, 45, cls4);
}

// choose color with probability and neighbor checking （like in mondian’s work）
function chooseColor(grid, row, col) {
  const avoid = [];
  
  // Check top neighbor（&& is like and in python）
  if (row > 0 && grid[row - 1][col] && grid[row - 1][col] !== colors.yellow) {
    avoid.push(grid[row - 1][col]);
  }
  
  // Check left neighbor  
  if (col > 0 && grid[row][col - 1] && grid[row][col - 1] !== colors.yellow) {
    avoid.push(grid[row][col - 1]);
  }
  
  // color weights
  const weights = [
    { color: colors.gray, weight: 10 },
    { color: colors.yellow, weight: 60 },
    { color: colors.red, weight: 10 },
    { color: colors.blue, weight: 20 }
  ];
  
  // filter out avoided colors
  const available = weights.filter(function(w) {
    return !avoid.includes(w.color);
  });
  
  // default to yellow if no colors available（since the original work has lots of yellow）
  if (available.length === 0) return colors.yellow;
  
  // calculate total weight
  const total = available.reduce(function(sum, w) {
    return sum + w.weight;
  }, 0);
  
  // weighted random selection
  let rand = random(total);
  
  for (let i = 0; i < available.length; i++) {
    if (rand < available[i].weight) {
      return available[i].color;
    }
    rand -= available[i].weight;
  }
  
  return available[0].color;
}

// Background drawing function
function drawBackground() {
  noStroke();
  
  // Wall
  fill('#F5F4F0');
  rect(0, 2, 1920, 910);
  
  // Floor line
  fill('#6C4D38');
  rect(0, 913, 1920, 8);

  // Floor strips
  fill('#A88974');
  rect(0, 920, 1920, 8);
  fill('#DBBDA5');
  rect(0, 930, 1920, 12);
  fill('#CEB1A1');
  rect(0, 940, 1920, 20);
  fill('#DDC3AC');
  rect(0, 960, 1920, 30);
  fill('#DDBFA7');
  rect(0, 990, 1920, 40);
  fill('#E4C9B4');
  rect(0, 1030, 1920, 50);

  // layered rectangles to create a shadow effect
  fill('#A88974');
  rect(630, 132, 670, 677);
  fill('#E1E0DC');
  rect(620, 120, 666, 664);
  fill('#BFA89A');
  rect(656, 152, 606, 622);
  fill('#A88974');
  rect(656, 750, 600, 21);
}