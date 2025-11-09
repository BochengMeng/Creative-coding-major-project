let sourceImage;
let artCanvas; // define artCanvas

function preload() {
  sourceImage = loadImage('Street.png'); 
  // load image https://p5js.org/reference/p5/preload/
}

function setup() {
  createCanvas(1920, 1080); // create main canvas
  
  // fit the wall background
  artCanvas = createGraphics(600, 600);
  
  generateArt();
}

function draw() {
  background(255);
  drawBackground();
  
  // display generated art in frame（fit the wall background）
  image(artCanvas, 656, 152);
}

// base color like Mondrian
let colors = {
  yellow: '#e1c927',
  red: '#ad372b',
  blue: '#314294',
  gray: '#d6d7d2',
  bg: '#f3f4ef'
};

function generateArt() {
  // setup artCanvas 
  artCanvas.push();
  artCanvas.background(colors.bg);
  artCanvas.noStroke();
  
  // https://p5js.org/reference/p5/loadPixels/
  sourceImage.loadPixels();
  const UNIT_SIZE = 25; 
  const SAMPLE_STEP = 30; 
  
  // scale & blocksize
  const scaleX = artCanvas.width / sourceImage.width;
  const scaleY = artCanvas.height / sourceImage.height;
  const blockSize = UNIT_SIZE * Math.min(scaleX, scaleY);

  // sample pixels and draw colored squares
  for (let y = 0; y < sourceImage.height; y += SAMPLE_STEP) {
    for (let x = 0; x < sourceImage.width; x += SAMPLE_STEP) {
      // Get pixel color from source image
      const idx = (y * sourceImage.width + x) * 4;
      const r = sourceImage.pixels[idx];
      const g = sourceImage.pixels[idx + 1];
      const b = sourceImage.pixels[idx + 2];
      
      // Check if it's a road pixel (white)
      if (r > 240 && g > 240 && b > 240) {
        // randomly choose a color with weighted probability (like mondiran's work)
        const colorChoice = random(100);
        let chosenColor;
        
        if (colorChoice < 10) {
          chosenColor = colors.gray;
        } else if (colorChoice < 70) {
          chosenColor = colors.yellow;
        } else if (colorChoice < 80) {
          chosenColor = colors.red;
        } else {
          chosenColor = colors.blue;
        }
        
        // Draw colored rectangle
        artCanvas.fill(chosenColor);
        artCanvas.rect(x * scaleX, y * scaleY, blockSize, blockSize);
      }
    }
  }

  artCanvas.pop();
}

// Background drawing function
function drawBackground() {
  noStroke();
  
  // Wall
  fill('#F5F4F0');
  rect(0, 2, 1920, 911);
  
  // Floor line
  fill('#6C4D38');
  rect(0, 913, 1920, 8);

  // Floor strips
  fill('#A88974');
  rect(1, 921, 1920, 8);
  fill('#DBBDA5');
  rect(1, 929, 1920, 12);
  fill('#CEB1A1');
  rect(1, 941, 1920, 20);
  fill('#DDC3AC');
  rect(1, 961, 1920, 30);
  fill('#DDBFA7');
  rect(1, 991, 1920, 40);
  fill('#E4C9B4');
  rect(1, 1031, 1920, 50);

  // layered rectangles to create a 3D frame effect shadow
  fill('#A88974');
  rect(630, 132, 670, 677);
  fill('#E1E0DC');
  rect(620, 120, 666, 664);
  fill('#BFA89A');
  rect(655, 150, 606, 622);
  fill('#A88974');
  rect(656, 751, 600, 21);
}