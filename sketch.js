let particles = [];
let speedSlider, huePosSlider, densitySlider;
let targetDensity;
let noiseOffset = 0;


let curHR, curMF, curLF;  
let result;
function preload() {
  
  result  = loadStrings("Starwalk.txt");
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  colorMode(HSB, 360, 100, 100, 100);
  noStroke();

  // 速度控制
  speedSlider = createSlider(0.1, 8, 2, 0.1);
  speedSlider.position(20, 20);

  // 顏色位置控制（0 ~ 1）
  huePosSlider = createSlider(0, 1, 0.5, 0.01);
  huePosSlider.position(20, 50);

  // 密度控制
  densitySlider = createSlider(200, 3000, 1500, 10);
  densitySlider.position(20, 80);

  targetDensity = densitySlider.value();
  addParticles(targetDensity);
  // 啟動資料讀取輪詢
  setTimeout(dataPreceed, 1000);
}

function draw() {
  background(0, 0, 100); // 白色背景

  //let Pspeed = speedSlider.value();
  //let huePos = huePosSlider.value(); // 0 ~ 1，控制顏色
  //targetDensity = densitySlider.value();

  let Pspeed = (curHR !== undefined && curHR !== null)
  ? constrain(map(float(curHR), 40, 180, 0.1, 5), 0.1, 5)
  : speedSlider.value();
  Pspeed *= 1.5;

let huePos = (curLF !== undefined && curLF !== null)
  ? constrain(map(float(curLF), 0, 100, 0, 1), 0, 1)
  : huePosSlider.value();

targetDensity = (curMF !== undefined && curMF !== null)
  ? Math.round(constrain(map(float(curMF), 0, 100, 200, 3000), 200, 3000))
  : densitySlider.value();
  
    // 更新變數值
  //curHR = speedSlider.value(); // 從 speedSlider 更新 curHR
  //curLF = huePosSlider.value(); // 從 huePosSlider 更新 curLF
 //curMF = densitySlider.value(); // 從 densitySlider 更新 curMF
  
  // 漸補 / 漸減
  if (particles.length < targetDensity) {
    addParticles(min(50, targetDensity - particles.length));
  } else if (particles.length > targetDensity) {
    particles.splice(particles.length - min(50, particles.length - targetDensity));
  }

  noiseOffset += 0.005;

  // 計算顏色範圍（藍紫 250 → 綠 120 → 紅橙 20）
  let hueStart, hueEnd;
  if (huePos < 0.5) {
    // 藍紫到綠
    let t = huePos / 0.5;
    hueStart = lerp(250, 120, t);
    hueEnd = lerp(250, 120, t);
  } else {
    // 綠到紅橙
    let t = (huePos - 0.5) / 0.5;
    hueStart = lerp(120, 20, t);
    hueEnd = lerp(120, 20, t);
  }

  for (let p of particles) {
    let hueShift = lerp(hueStart, hueEnd, (p.colorOffset + 30) / 60.0);
    fill(hueShift % 360, 85, 100, p.alpha);

    push();
    let nx = noise(p.x * 0.002, frameCount * 0.002 + p.noiseSeed) * 50 - 25;
    let ny = noise(p.y * 0.002, frameCount * 0.002 + p.noiseSeed + 100) * 50 - 25;
    translate(p.x + nx, p.y + ny, p.z);
    sphere(p.size);
    pop();

    p.z += Pspeed;
    if (p.z > 100) {
      p.z = -2000;
      p.x = random(-width, width);
      p.y = random(-height, height);
      p.noiseSeed = random(1000);
    }
  }
}

function addParticles(num) {
  for (let i = 0; i < num; i++) {
    particles.push({
      x: random(-width, width),
      y: random(-height, height),
      z: random(-2000, 100),
      size: random(2, 8),
      alpha: random(40, 80),
      colorOffset: random(-30, 30),
      noiseSeed: random(1000)
    });
  }
}

function dataPreceed(){
  //let splitString = split(result, ' ');
let splitString = split(result.toString(),"  ");
let len = splitString[16].length;
let substr = split(splitString[16],";");
//console.log(split(substr[0],";"));
curHR = substr[0];
//gui.SDNN = splitString[15];
curMF = splitString[9];
curLF = splitString[8];
console.log("HR:"+curHR+", MF:"+curMF+", LF:"+curLF);

result  = loadStrings("Starwalk.txt");
setTimeout(dataPreceed,1000);
}


function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}