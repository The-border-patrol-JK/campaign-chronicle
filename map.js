export function addMap(src){

const board=document.getElementById("mapBoard");

const img=document.createElement("img");

img.src=src;

img.className="mapLayer";

board.appendChild(img);

}


export function createToken(src){

const board=document.getElementById("mapBoard");

const token=document.createElement("img");

token.src=src;

token.className="token";

token.style.left="200px";
token.style.top="200px";

board.appendChild(token);

drag(token);

}


export function uploadMarker(file){

const reader=new FileReader();

reader.onload=()=>{

createToken(reader.result);

};

reader.readAsDataURL(file);

}


/* =========================
DRAG
========================= */

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


/* =========================
DRAW SYSTEM
========================= */

export function enableDrawing(){

const board=document.getElementById("mapBoard");

const canvas=document.createElement("canvas");

canvas.width=board.clientWidth;
canvas.height=board.clientHeight;

canvas.className="drawLayer";

board.appendChild(canvas);

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


/* =========================
FOG
========================= */

export function createFog(){

const board=document.getElementById("mapBoard");

const fog=document.createElement("canvas");

fog.width=board.clientWidth;
fog.height=board.clientHeight;

fog.className="fogLayer";

board.appendChild(fog);

const ctx=fog.getContext("2d");

ctx.fillStyle="black";
ctx.fillRect(0,0,fog.width,fog.height);

fog.onmousemove=(e)=>{

if(e.buttons!==1)return;

ctx.globalCompositeOperation="destination-out";

ctx.beginPath();
ctx.arc(e.offsetX,e.offsetY,40,0,Math.PI*2);
ctx.fill();

};

}
