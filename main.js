import {
addMap,
createToken,
startSync
} from "./map.js";

import {
createCampaign,
joinCampaign
} from "./campaign.js";

function get(id){
return document.getElementById(id);
}

/* CREATE CAMPAIGN */

get("createCampaignBtn").onclick=async()=>{

const code=await createCampaign();

alert("Campaign Code: "+code);

startSync();

};

/* JOIN CAMPAIGN */

get("joinCampaignBtn").onclick=async()=>{

const code=get("joinCodeInput").value;

const result=await joinCampaign(code);

if(result){
startSync();
}

};

/* MAP */

get("addMapBtn").onclick=()=>{
get("mapUpload").click();
};

get("mapUpload").onchange=(e)=>{

const file=e.target.files[0];

const reader=new FileReader();

reader.onload=()=>{
addMap(reader.result);
};

reader.readAsDataURL(file);

};

/* TOKEN */

get("tokenBtn").onclick=()=>{
createToken("https://cdn-icons-png.flaticon.com/512/3522/3522099.png");
};

/* DICE */

get("diceBtn").onclick=()=>{

const roll=Math.floor(Math.random()*20)+1;

const log=document.createElement("div");
log.innerText="🎲 "+roll;

document.getElementById("diceLog").prepend(log);

};