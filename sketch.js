let particles = [];
let speedSlider, huePosSlider, densitySlider;
let targetDensity;
let noiseOffset = 0;
let manualCheckbox;


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

  // 手動模式
  manualCheckbox = createCheckbox('Manual (use sliders)', false);
  manualCheckbox.position(20, 110);

  targetDensity = densitySlider.value();
  addParticles(targetDensity);
  // 啟動資料讀取輪詢
  setTimeout(dataPreceed, 1000);

  // 強制禁用快取
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', function() {
      // 清除快取
      if ('caches' in window) {
        caches.keys().then(function(names) {
          for (let name of names) caches.delete(name);
        });
      }
    });
  }
}

function draw() {
  background(0, 0, 100); // 白色背景

  let useManual = manualCheckbox && manualCheckbox.checked();

  let Pspeed = useManual
  ? speedSlider.value()
  : ((curHR !== undefined && curHR !== null)
    ? constrain(map(float(curHR), 40, 180, 0.1, 5), 0.1, 5)
    : speedSlider.value());
  Pspeed *= 1.5;

  let huePos = useManual
  ? huePosSlider.value()
  : ((curLF !== undefined && curLF !== null)
    ? constrain(map(float(curLF), 0, 100, 0, 1), 0, 1)
    : huePosSlider.value());

  targetDensity = useManual
  ? densitySlider.value()
  : ((curMF !== undefined && curMF !== null)
    ? Math.round(constrain(map(float(curMF), 0, 100, 200, 3000), 200, 3000))
    : densitySlider.value());
  

  
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
    // 綠到「更橘紅」
    let t = pow((huePos - 0.5) / 0.5, 0.6); // ease-out，加速靠近紅橘
    hueStart = lerp(120, 5, t);
    hueEnd = lerp(120, 5, t);
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
  try {
    // 加入時間戳避免快取
    const timestamp = Date.now();
    const url = `Starwalk.txt?t=${timestamp}`;
    
    loadStrings(url, function(data) {
      if (data && data.length > 0) {
        const text = Array.isArray(data) ? data.join(' ') : String(data);
        const tokens = text.split(/\s+/); // 以任意空白切分
        
        console.log("Raw data:", text); // 除錯用：看原始資料
        console.log("Tokens count:", tokens.length); // 除錯用：看切分後數量

        // 盡量維持原本邏輯，但加上安全檢查
        if (tokens.length > 16) {
          const t16 = String(tokens[16] || '');
          const parts = t16.split(';');
          if (parts[0]) {
            curHR = parts[0];
            console.log("Updated HR:", curHR);
          }
        }

        if (tokens.length > 9 && tokens[9] !== undefined) {
          curMF = tokens[9];
          console.log("Updated MF:", curMF);
        }
        if (tokens.length > 8 && tokens[8] !== undefined) {
          curLF = tokens[8];
          console.log("Updated LF:", curLF);
        }

        console.log("Final values - HR:"+curHR+", MF:"+curMF+", LF:"+curLF);
      } else {
        console.warn("Starwalk.txt is empty or failed to load");
      }
    });
  } catch (e) {
    console.error('dataPreceed error:', e);
  }
  
  // 設定下次執行
  setTimeout(dataPreceed, 1000);
}


function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}