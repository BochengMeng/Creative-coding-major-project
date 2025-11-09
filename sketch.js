let sourceImage;
function preload() {
  img = loadImage('Street.png');
  // load image https://p5js.org/reference/p5/preload/
}
function setup() {
  createCanvas(600, 600);
}
function draw() {
  background(255);
  // Draw the image.
  image(img, 0, 0);
}