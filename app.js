document.onreadystatechange = function() { 
  if (document.readyState !== "complete") { 
    document.querySelector(".loading-circle").style.visibility = "visible"; 
  } else { 
    document.querySelector(".loading-circle").style.display = "none"; 
  } 
};


const canvasWidth = 800;
const canvasHeight = 600;

// VBCanvas
//destructure as a parameter ctx is a property of VBCanvas
const { ctx } = VBCanvas.createCanvas({
  viewBox: [0, 0, canvasWidth, canvasHeight],
  target: '.canvas-wrapper',
  scaleMode: 'fit'
});

const infoBtn = document.getElementById('info-btn')
const closeBtn = document.getElementById('close-btn')
const startBtn = document.getElementById('start-btn')
const scoreDisplay = document.getElementById('score-display')

const infoPanel = document.getElementById('info-panel')

const brickRowCount = 9
const brickColumnCount = 5

let score = 0
let isPaused = true







// classes ===========================================

class Point {
  constructor(x,y) {
    this.x = x
    this.y = y
  }
  
  getHypotenuse() {
    return Math.sqrt(this.x * this.x + this.y * this.y)
  }
  
  subtract(otherPoint) {
    this.x -= otherPoint.x
    this.y -= otherPoint.y
    return this 
  }
  
  clone() {
    return new Point(this.x, this.y)
  }
}

// class Circle {
//   constructor(position, radius) {
//     this.position = position
//     this.radius = radius
//     this.speed = 4
//     this.dx = 4
//     this.dy = -4
//     this.fillColor = '#da4565' 
//   }
// }

// props ===========================================

// const ball = new Circle(new Point(canvasWidth / 2, canvasHeight / 2), 20)

const ball = {
  position: new Point(canvasWidth / 2, canvasHeight / 2),
  radius: 20,
  speed: 4,
  dx: 4,
  dy: -4,
  fillColor: '#da4565' 
}

const curtain = {
  position: new Point(canvasWidth / 2, canvasHeight + 60),
  radius: 1500,
  dx: 0,
  fillColor: '#000',
  visible: false
}

//paddle props 
const paddle = {
 position: new Point(canvasWidth / 2 - 40, canvasHeight - 50),
 paddlePoint: new Point(canvasWidth / 2 - 40, canvasHeight - 20),
 ballToPaddlePoint: 0,
 w: 80,
 h: 10,
 speed: 9,
 dx: 0
}

//brick props
const brick = {
  w: 70,
  h: 20,
  padding: 10,
  offsetX: 45,
  offsetY: 60,
  visible: true
}

// create bricks
const bricks = []
 for(let i = 0; i < brickRowCount; i++) {
   bricks[i] = []
   for(let j = 0; j < brickColumnCount; j++) {
     const position = new Point(
      i * (brick.w + brick.padding) + brick.offsetX, 
      j * (brick.h + brick.padding) + brick.offsetY
    )
     let pointOnBrick = position.clone()
     let ballToBrickPoint 
     bricks[i][j] = { position, pointOnBrick, ballToBrickPoint, ...brick }
   }
 }
 
// console.log(bricks)
 
 //draw bricks
function drawBricks() {
  bricks.forEach(column => {
    column.forEach(brick => {
      ctx.beginPath()
      ctx.rect(brick.position.x, brick.position.y, brick.w, brick.h)
      ctx.fillStyle = brick.visible ? '#0095dd' : 'transparent'
      ctx.fill()
      ctx.closePath()
    })
  })
}

//draw paddle
function drawPaddle() {
  ctx.beginPath()
  ctx.rect(paddle.position.x, paddle.position.y, paddle.w, paddle.h)
  ctx.fillStyle = '#0095dd'
  ctx.fill()
  ctx.closePath()
}

//draw ball on canvas 
function drawBall() {
  ctx.beginPath()
  ctx.arc(ball.position.x, ball.position.y, ball.radius, 0, Math.PI * 2)
  ctx.fillStyle = '#da4565'
  ctx.fill()
  ctx.closePath()
}

//draw ball on canvas 
function drawCurtain() {
  ctx.beginPath()
  ctx.arc(curtain.position.x, curtain.position.y, curtain.radius, 0, Math.PI * 2)
  ctx.arc(curtain.position.x, curtain.position.y + 40, curtain.radius / 4 * 3 , 0, Math.PI * 2) 
  ctx.arc(curtain.position.x, curtain.position.y + 80, curtain.radius / 2, 0, Math.PI * 2)
  ctx.arc(curtain.position.x, curtain.position.y + 120, curtain.radius / 4, 0, Math.PI * 2)
  ctx.fillStyle = curtain.visible ? '#0095dd' : 'transparent'
  // ctx.strokeStyle = curtain.visible ? '#f0f0f0' : 'transparent'
  ctx.lineWidth = 8;
  ctx.fill()
  // ctx.stroke()
  ctx.closePath()
}

// ===========================================
function clamp(min, max, value) {
  if(value < min){
    return min 
  } else if(value > max) {
    return max
  } else {
    return value
  }
}

// ===========================================
function clampV2(min, max, value){
  return Math.max(min, Math.min(max, value))
}
// ===========================================

//move paddle on canvas 
function movePaddle() {
  paddle.position.x += paddle.dx
  
  //wall detection
  if (paddle.position.x + paddle.w > canvasWidth) {
    paddle.position.x = canvasWidth - paddle.w
  }
  
  if (paddle.position.x < 0) {
    paddle.position.x = 0
  }
}

// ===========================================
//move ball on canvas
function moveBall() {
  ball.position.x += ball.dx
  ball.position.y += ball.dy
  
  curtain.position.x = ball.position.x
  
  // collision detection wall right/left
  if (ball.position.x + ball.radius > canvasWidth || ball.position.x - ball.radius < 0) {
    ball.dx *= -1 
  }
  
  // collision detection wall bottom/top
  if (
    // ball.position.y + ball.radius > canvasHeight || 
    ball.position.y - ball.radius < 0) {
    ball.dy *= -1
  }
  
  
  // collision detection paddle  
  paddle.paddlePoint.x = clamp(paddle.position.x, paddle.position.x + paddle.w, ball.position.x)
  paddle.paddlePoint.y = clamp(paddle.position.y, paddle.position.y + paddle.h, ball.position.y)
  paddle.ballToPaddlePoint = paddle.paddlePoint.clone().subtract(ball.position)
  if (paddle.ballToPaddlePoint.getHypotenuse() < ball.radius) {
    ball.dy = -ball.speed
  }
  
  // brick collision
  bricks.forEach(column => {
    column.forEach(brick => {
      if (brick.visible) {
        brick.pointOnBrick.x = clamp(brick.position.x, brick.position.x + brick.w, ball.position.x)
        brick.pointOnBrick.y = clamp(brick.position.y, brick.position.y + brick.h, ball.position.y)
        brick.ballToBrickPoint = brick.pointOnBrick.clone().subtract(ball.position)
        if (
          brick.ballToBrickPoint.getHypotenuse() < ball.radius
        ) { 
          ball.dy *= -1
          brick.visible = false
          
          increaseScore()
        }
      }
    })
  })
  
  
  // hit bottom lose
  if(ball.position.y > canvasHeight + ball.radius + 50) {
    // thats all folks
    // disable pause btn
    startBtn.disabled = true
    
    // curtain is visible 
    curtain.visible = true
    
    ball.dx = 0
    
    
    if(curtain.radius > 10){
      curtain.radius -= 38
      // console.log(curtain.radius)
    }
    
    resetBricksAndPaddle()
    
    // resetAll()
  }
  
  if(curtain.radius < 11) {
    startBtn.disabled = false
    resetBall()
    ball.dx = 4
    startBtn.classList.add('pulse')
  }
}



//===============================================================

//increase score
function increaseScore() {
  score++
  scoreDisplay.textContent = score
  if(score % (brickRowCount * brickColumnCount) === 0) {
    resetBricksAndPaddle() 
    
  }
}

// reset bricks
function resetBricksAndPaddle() {
  bricks.forEach(column => {
    column.forEach(brick => brick.visible = true)
  })
  
  paddle.position.x = canvasWidth / 2 - 40
}

//reset all
function resetBall(){
  isPaused = true
  
  ball.dy *= -1
  ball.dx *= -1
  ball.position.x = canvasWidth / 2
  ball.position.y = canvasHeight / 2
  
  curtain.visible = false 
  curtain.radius = 1500
  
  score = 0 
  scoreDisplay.textContent = 0
  startBtn.textContent = 'start'
}

//----------------------------------------------
//----------------------------------------------
// Draw everything
function draw() {
  //clear canvas 
  ctx.clearRect(0, 0, canvasWidth, canvasHeight)
  // reset canvas size
  
  drawBall()
  drawPaddle()  
  drawBricks()
  drawCurtain()
}

// Update canvas drawing and animation
function play() {
  draw()
  if(!isPaused){
    movePaddle()
    moveBall()
    requestAnimationFrame(play)
  } 
}

function pause() {
  draw()
  if(isPaused){
    requestAnimationFrame(pause)
  } 
}

function togglePause() {
  startBtn.classList.remove('pulse')
  isPaused = !isPaused
  if(!isPaused){
    startBtn.textContent = 'pause'
    play()
  } else {
    startBtn.textContent = 'play'
    pause()
  }
  
}


//key events
function keyDown(e) {
  if (e.key === 'Right' || e.key === 'ArrowRight') {
    paddle.dx = paddle.speed
  } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
    paddle.dx = -paddle.speed
  }
}

function keyUp(e) {
  if (e.key === 'Right' || e.key === 'ArrowRight' || e.key === 'Left' || e.key === 'ArrowLeft') {
    paddle.dx = 0
  }
} 


// Keyboard event handlers
document.addEventListener('keydown', keyDown)
document.addEventListener('keyup', keyUp)

startBtn.addEventListener('click', togglePause)


window.addEventListener('resize', function() {
  doneResizing()
  // clearTimeout(resizeTimer)
  // resizeTimer = setTimeout(doneResizing, 750)
})

function doneResizing() {
  if(isPaused){
    pause()
  }
}

infoBtn.addEventListener('click', () => {
  infoPanel.style.clipPath = 'circle(50% at 100% 0%)'
})

closeBtn.addEventListener('click', () => {
  infoPanel.style.clipPath = 'circle(0% at 100% 0%)'
})


draw()



