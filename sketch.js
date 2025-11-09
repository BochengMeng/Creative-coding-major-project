let sourceImage;
function preload() {
  img = loadImage('Street.png');
  // load image https://p5js.org/reference/p5/preload/
}
function setup() {
  createCanvas(1200, 1200);
}
function draw() {
  background(255);
  // Draw the image.
  image(img, 0, 0);
}