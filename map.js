export function addMap(src){

const board=document.getElementById("mapBoard");

const img=document.createElement("img");

img.src=src;
img.className="mapLayer";

board.appendChild(img);

}


/* TOKEN */

export function createToken(src){

const board=document.getElementById("mapBoard");

const token=document.createElement("img");

token.src=src;

token.className="token";

token.style.left="200px";
token.style.top="200px";

board.appendChild(token);

drag(token);

resize(token);

}


/* DRAG */

function drag(el){

let x=0;
let y=0;

el.onmousedown=(e)=>{

x=e.clientX-el.offsetLeft;
y=e.clientY-el.offsetTop;

document.onmousemove=(e)=>{

el.style.left=(e.clientX-x)+"px";
el.style.top=(e.clientY-y)+"px";

};

document.onmouseup=()=>{

document.onmousemove=null;

};

};

}


/* RESIZE */

function resize(el){

el.onwheel=(e)=>{

e.preventDefault();

let w=el.offsetWidth;

if(e.deltaY<0) w+=10;
else w-=10;

el.style.width=w+"px";

};

}


/* DRAW */

export function enableDrawing(){

const canvas=document.getElementById("drawCanvas");

const ctx=canvas.getContext("2d");

let drawing=false;

canvas.onmousedown=()=>drawing=true;

canvas.onmouseup=()=>drawing=false;

canvas.onmousemove=(e)=>{

if(!drawing)return;

ctx.fillStyle="red";

ctx.beginPath();
ctx.arc(e.offsetX,e.offsetY,3,0,Math.PI*2);
ctx.fill();

};

}


/* GRID */

export function drawGrid(){

const canvas=document.getElementById("gridCanvas");

const ctx=canvas.getContext("2d");

const size=50;

for(let x=0;x<canvas.width;x+=size){

ctx.moveTo(x,0);
ctx.lineTo(x,canvas.height);

}

for(let y=0;y<canvas.height;y+=size){

ctx.moveTo(0,y);
ctx.lineTo(canvas.width,y);

}

ctx.strokeStyle="#333";
ctx.stroke();

}


/* DISTANCE */

export function measure(){

const canvas=document.getElementById("drawCanvas");

const ctx=canvas.getContext("2d");

let start=null;

canvas.onclick=(e)=>{

if(!start){

start=[e.offsetX,e.offsetY];

}else{

const dx=e.offsetX-start[0];
const dy=e.offsetY-start[1];

const dist=Math.sqrt(dx*dx+dy*dy);

ctx.fillStyle="white";
ctx.fillText(dist.toFixed(0)+"px",e.offsetX,e.offsetY);

start=null;

}

};

}
