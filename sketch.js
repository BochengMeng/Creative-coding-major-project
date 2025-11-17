let sourceImage;
let artCanvas; // off-screen buffer for Mondrian art
let ready = false; // track if art is ready

// Fixed design space (virtual canvas) for layout
const DESIGN_W = 1920; // design width
const DESIGN_H = 1080; // design height

// sampling parameters to control the size and ignore the imperfection of the map image
const SAMPLE_STEP = 25;
const UNIT_SIZE = 30;

// shadow movement
const SHADOW_MAX_OFFSET = 10;
const SHADOW_SMOOTHING = 0.06;
let currentShadowOffsetX = 0;
let currentShadowOffsetY = 0;

// ------------------- Block class --------------------
// use a class to store all rectangles (big blocks + road blocks)
class Block {
  constructor(x, y, w, h, c, ampScale = 1) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.c = c;
    this.ampScale = ampScale;
  }

  draw(g) {
    // use hand-drawn style rectangle
    feltingRect(g, this.x, this.y, this.w, this.h, this.c, this.ampScale);
  }
}

// store big Mondrian blocks
let bigBlocks = [];
// store road-based small blocks
let roadBlocks = [];

// base color like mondrian
let colors = {
  gray: '#d6d7d2',
  yellow: '#e1c927',
  red: '#ad372b',
  blue: '#314294',
  bg: '#EBEAE6'
};

function preload() {
  sourceImage = loadImage('Street.png');
  // load image https://p5js.org/reference/p5/preload/
}

function setup() {
  // canvas size follows the window
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);

  // content outside the element box is not shown https://www.w3schools.com/jsref/prop_style_overflow.asp
  document.body.style.overflow = 'hidden';

  // create graphics buffer for art generation
  artCanvas = createGraphics(600, 600);
  artCanvas.pixelDensity(1); // https://p5js.org/reference/p5/pixelDensity/

  generateArt();
  ready = true;
}

function draw() {
  // --- responsive scaling into a fixed 1920x1080 design space ---
  const s = Math.max(width / DESIGN_W, height / DESIGN_H);
  const offsetX = (width - DESIGN_W * s) / 2;
  const offsetY = (height - DESIGN_H * s) / 2;

  background(255);

  push();
  // move and scale the whole 1920x1080 "virtual wall" into the real window
  translate(offsetX, offsetY);
  scale(s);

  // --- camera zoom inside the design space (since the original one is too small) ---
  let zoom = 1.25;
  let zoomAnchorY = DESIGN_H * 0.75;
  push();
  translate(DESIGN_W / 2, zoomAnchorY / 2);
  scale(zoom);
  translate(-DESIGN_W / 2, -zoomAnchorY / 2);

  // calculate mouse position (still using real window size)
  let targetOffsetX = map(mouseX, 0, width, -SHADOW_MAX_OFFSET, SHADOW_MAX_OFFSET);
  let targetOffsetY = map(mouseY, 0, height, -SHADOW_MAX_OFFSET, SHADOW_MAX_OFFSET);

  // smoothly transition https://p5js.org/reference/p5/lerp/
  currentShadowOffsetX = lerp(currentShadowOffsetX, targetOffsetX, SHADOW_SMOOTHING);
  currentShadowOffsetY = lerp(currentShadowOffsetY, targetOffsetY, SHADOW_SMOOTHING);

  // pass offsets to the background function (draw gallery wall + frame)
  drawBackground(currentShadowOffsetX, currentShadowOffsetY);

  // display generated art in the frame
  if (ready) {
    image(artCanvas, 656, 152, 600, 600);
  }

  pop(); // end zoom
  pop(); // end responsive scaling
}

// Click to regenerate artwork
function mousePressed() {
  generateArt();
}

// When the window size changes, resize the canvas and redraw
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// ----------------------- Artwork generation -----------------------
function generateArt() {
  // setup artCanvas
  artCanvas.push();
  artCanvas.clear();
  artCanvas.background(colors.bg);
  artCanvas.noStroke();

  // First draw the large square layer
  drawSVGBlocks();

  // https://p5js.org/reference/p5/loadPixels/
  sourceImage.loadPixels();

  // scale & blocksize
  const scaleX = artCanvas.width / sourceImage.width;
  const scaleY = artCanvas.height / sourceImage.height;
  const blockSize = UNIT_SIZE * Math.min(scaleX, scaleY);

  // create grid for storing colors
  const rows = Math.ceil(sourceImage.height / SAMPLE_STEP);
  const cols = Math.ceil(sourceImage.width / SAMPLE_STEP);
  const grid = Array(rows).fill().map(function () {
    return Array(cols).fill(null);
  });

  // sample pixels and assign colors
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

  // clear old road blocks
  roadBlocks = [];

  // draw rectangles from grid (create Block objects first)
  for (let y = 0, row = 0; y < sourceImage.height; y += SAMPLE_STEP, row++) {
    for (let x = 0, col = 0; x < sourceImage.width; x += SAMPLE_STEP, col++) {
      if (grid[row][col]) {
        const bx = x * scaleX;
        const by = y * scaleY;
        const bw = blockSize;
        const bh = blockSize;
        // ampScale = 1.2 for smaller blocks
        roadBlocks.push(new Block(bx, by, bw, bh, grid[row][col], 1.2));
      }
    }
  }

  // draw all road blocks
  for (const block of roadBlocks) {
    block.draw(artCanvas);
  }

  artCanvas.pop();
}

// Mondrian-style big blocks
function drawSVGBlocks() {
  const g = artCanvas;
  g.noStroke();

  // Layout is designed in a 1600 x 1600 coordinate space,
  // then scaled down into the 600 x 600 artCanvas.
  const s = 1600 / 600; // canvas scale

  // clear old big blocks
  bigBlocks = [];

  // helper: create a big block and store it
  function R(x, y, w, h, c) {
    const bx = Math.round(x / s);
    const by = Math.round(y / s);
    const bw = Math.round(w / s);
    const bh = Math.round(h / s);
    // ampScale = 6 for smoother edges on big blocks
    bigBlocks.push(new Block(bx, by, bw, bh, c, 6));
  }

  R(910, 305, 275, 420, '#4267ba');
  R(910, 390, 275, 230, '#ad372b');
  R(960, 450, 160, 100, '#e1c927');
  R(80, 1160, 160, 140, '#e1c927');
  R(230, 960, 150, 130, "#4267ba");
  R(1450, 1450, 165, 165, '#e1c927');
  R(730, 280, 95, 95, '#e1c927');
  R(385, 1300, 195, 310, '#ad372b');
  R(450, 1360, 60, 60, '#d6d7d2');
  R(1005, 1060, 175, 390, "#4267ba");
  R(1025, 1295, 125, 100, '#e1c927');
  R(150, 455, 225, 120, "#4267ba");
  R(280, 160, 205, 85, '#ad372b');
  R(1380, 70, 180, 120, "#4267ba");
  R(1400, 625, 210, 210, '#ad372b');
  R(1270, 865, 130, 190, '#e1c927');
  R(610, 945, 215, 215, '#e1c927');
  R(385, 740, 220, 90, '#ad372b');
  R(830, 730, 155, 155, '#ad372b');
  R(1470, 700, 80, 60, '#d6d7d2');
  R(280, 1000, 50, 50, '#d6d7d2');
  R(670, 1020, 80, 80, '#d6d7d2');
  R(340, 160, 40, 85, '#d6d7d2');
  R(1295, 915, 75, 75, '#d6d7d2');
  R(750, 305, 45, 45, '#d6d7d2');

  // draw all big blocks
  for (const block of bigBlocks) {
    block.draw(g);
  }
}

// choose color with probability and neighbor checking
function chooseColor(grid, row, col) {
  const avoid = [];

  // top neighbor
  if (row > 0 && grid[row - 1][col] && grid[row - 1][col] !== colors.yellow) {
    avoid.push(grid[row - 1][col]);
  }

  // left neighbor
  if (col > 0 && grid[row][col - 1] && grid[row][col - 1] !== colors.yellow) {
    avoid.push(grid[row][col - 1]);
  }

  const weights = [
    { color: colors.gray, weight: 10 },
    { color: colors.yellow, weight: 60 },
    { color: colors.red, weight: 10 },
    { color: colors.blue, weight: 20 }
  ];

  const available = weights.filter(function (w) {
    return !avoid.includes(w.color);
  });

  if (available.length === 0) return colors.yellow;

  const total = available.reduce(function (sum, w) {
    return sum + w.weight;
  }, 0);

  let rand = random(total);

  for (let i = 0; i < available.length; i++) {
    if (rand < available[i].weight) {
      return available[i].color;
    }
    rand -= available[i].weight;
  }

  return available[0].color;
}

// Background space drawing function
function drawBackground(shadowOffsetX = 0, shadowOffsetY = 0) {
  noStroke();

  // wall
  fill('#F5F4F0');
  rect(0, 2, DESIGN_W, 910);

  // floor line
  fill('#6C4D38');
  rect(0, 868, DESIGN_W, 8);

  // floor strips
  fill('#A88974');
  rect(0, 875, DESIGN_W, 8);
  fill('#DBBDA5');
  rect(0, 883, DESIGN_W, 12);
  fill('#CEB1A1');
  rect(0, 895, DESIGN_W, 20);
  fill('#DDC3AC');
  rect(0, 915, DESIGN_W, 30);
  fill('#DDBFA7');
  rect(0, 945, DESIGN_W, 40);
  fill('#E4C9B4');
  rect(0, 985, DESIGN_W, 50);

  // layered rectangles to create a shadow effect
  fill('#A88974'); // deepest shadow (move)
  rect(630 + shadowOffsetX * 0.6, 132 + shadowOffsetY * 0.6, 670, 677);

  fill('#E1E0DC'); // light edge of the frame
  rect(620, 120, 666, 664);

  fill('#BFA89A'); // frame border (move)
  rect(658 + shadowOffsetX * 0.2, 153 + shadowOffsetY * 0.1, 606, 622);

  fill('#A88974'); // shadow at the bottom of the frame (move)
  rect(658 + shadowOffsetX * 0.1, 153 + shadowOffsetY * 0.1, 604, 612);
}

// Hand-drawn style in visuals
function feltingRect(g, x, y, w, h, c, ampScale = 1) {
  // main color block
  g.noStroke();
  g.fill(c);
  g.rect(x, y, w, h);

  // slight shaking outline
  const amp = 0.36 * ampScale;
  const freq = 0.1;
  const layers = 6;

  for (let l = 0; l < layers; l++) {
    g.noFill();
    g.stroke(red(c), green(c), blue(c), map(l, 0, layers - 1, 100, 50));
    g.strokeWeight(map(l, 0, layers - 1, 2.2, 1));

    g.beginShape();

    // up
    for (let i = 0; i <= 1; i += 0.02) {
      const n = noise((x + i * w) * freq, (y + l * 50) * freq);
      const offset = map(n, 0, 1, -amp, amp);
      g.vertex(x + i * w, constrain(y + offset, y - amp, y + amp));
    }

    // right
    for (let i = 0; i <= 1; i += 0.02) {
      const n = noise((x + w + l * 20) * freq, (y + i * h) * freq);
      const offset = map(n, 0, 1, -amp, amp);
      g.vertex(
        constrain(x + w + offset, x + w - amp, x + w + amp),
        y + i * h
      );
    }

    // down
    for (let i = 1; i >= 0; i -= 0.02) {
      const n = noise((x + i * w) * freq, (y + h + l * 40) * freq);
      const offset = map(n, 0, 1, -amp, amp);
      g.vertex(
        x + i * w,
        constrain(y + h + offset, y + h - amp, y + h + amp)
      );
    }

    // left
    for (let i = 1; i >= 0; i -= 0.02) {
      const n = noise((x + l * 30) * freq, (y + i * h) * freq);
      const offset = map(n, 0, 1, -amp, amp);
      g.vertex(
        constrain(x + offset, x - amp, x + amp),
        y + i * h
      );
    }

    g.endShape(CLOSE);
  }

  // soft glow outline
  g.stroke(red(c), green(c), blue(c), 40);
  g.strokeWeight(3);
  g.noFill();
  g.rect(x, y, w, h);
}