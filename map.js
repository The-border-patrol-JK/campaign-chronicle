let activeTool="none"


export function addMap(src){

const board=document.getElementById("mapBoard")

const img=document.createElement("img")

img.src=src
img.className="mapLayer"

board.appendChild(img)

}


export function createToken(src){

const board=document.getElementById("mapBoard")

const token=document.createElement("img")

token.src=src
token.className="token"

token.style.left="200px"
token.style.top="200px"

board.appendChild(token)

drag(token)
resize(token)

}


function drag(el){

let offsetX=0
let offsetY=0

el.onmousedown=(e)=>{

offsetX=e.clientX-el.offsetLeft
offsetY=e.clientY-el.offsetTop

document.onmousemove=(e)=>{

el.style.left=(e.clientX-offsetX)+"px"
el.style.top=(e.clientY-offsetY)+"px"

}

document.onmouseup=()=>{

document.onmousemove=null

}

}

}


function resize(el){

el.onwheel=(e)=>{

e.preventDefault()

let size=el.offsetWidth

if(e.deltaY<0) size+=10
else size-=10

if(size<20) size=20

el.style.width=size+"px"

}

}


export function enableDrawing(){

activeTool="draw"

const canvas=document.getElementById("drawCanvas")
const ctx=canvas.getContext("2d")

let drawing=false

canvas.onmousedown=()=>drawing=true
canvas.onmouseup=()=>drawing=false

canvas.onmousemove=(e)=>{

if(activeTool!=="draw") return
if(!drawing) return

ctx.fillStyle="red"

ctx.beginPath()
ctx.arc(e.offsetX,e.offsetY,3,0,Math.PI*2)
ctx.fill()

}

}


export function drawGrid(){

const canvas=document.getElementById("gridCanvas")

canvas.width=3000
canvas.height=2000

const ctx=canvas.getContext("2d")

const size=50

ctx.beginPath()

for(let x=0;x<canvas.width;x+=size){

ctx.moveTo(x,0)
ctx.lineTo(x,canvas.height)

}

for(let y=0;y<canvas.height;y+=size){

ctx.moveTo(0,y)
ctx.lineTo(canvas.width,y)

}

ctx.strokeStyle="#333"
ctx.stroke()

}


export function measure(){

activeTool="measure"

const canvas=document.getElementById("drawCanvas")
const ctx=canvas.getContext("2d")

let start=null

canvas.onclick=(e)=>{

if(activeTool!=="measure") return

if(!start){

start=[e.offsetX,e.offsetY]

}else{

const dx=e.offsetX-start[0]
const dy=e.offsetY-start[1]

const dist=Math.sqrt(dx*dx+dy*dy)

ctx.fillStyle="white"
ctx.font="16px Arial"

ctx.fillText(dist.toFixed(0)+"px",e.offsetX,e.offsetY)

start=null

}

}

}
