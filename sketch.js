let sourceImage;
function preload() {
  img = loadImage('Street.png');
  // load image https://p5js.org/reference/p5/preload/
}
function setup() {
  createCanvas(1920, 1200);
}
function draw() {
  background(255);
  // Draw the image.
  image(img, 0, 0);
  drawBackground()
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