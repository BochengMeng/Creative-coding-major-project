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

  // layered rectangles to create a 3D frame effect shadow
  fill('#A88974');
  rect(630, 132, 670, 677);
  fill('#E1E0DC');
  rect(620, 120, 666, 664);
  fill('#BFA89A');
  rect(656, 152, 606, 622);
  fill('#A88974');
  rect(656, 750, 600, 21);
}