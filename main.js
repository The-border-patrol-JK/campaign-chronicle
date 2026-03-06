import { setupMap,setTool,clearMap,addMap } from "./map.js";

const mapUpload = document.getElementById("mapUpload");

const addMapBtn=document.getElementById("addMapBtn");

/* MAP SYSTEM */

setupMap();

document.getElementById("drawTool").onclick=()=>setTool("draw");
document.getElementById("tokenTool").onclick=()=>setTool("token");
document.getElementById("fogTool").onclick=()=>setTool("fog");
document.getElementById("markerTool").onclick=()=>setTool("marker");

document.getElementById("clearTool").onclick=clearMap;

/* ADD MAP */

addMapBtn.onclick=()=>{

mapUpload.click();

};

mapUpload.onchange=(e)=>{

const file=e.target.files[0];

if(!file) return;

const reader=new FileReader();

reader.onload=()=>{

addMap(reader.result);

};

reader.readAsDataURL(file);

};
