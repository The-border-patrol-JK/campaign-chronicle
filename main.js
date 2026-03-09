import {
addMap,
createToken
} from "./map.js";

import {
createCampaign,
joinCampaign
} from "./campaign.js";

function get(id){
return document.getElementById(id);
}

/* CREATE CAMPAIGN */

get("createCampaignBtn").onclick = async ()=>{

const code = await createCampaign();

if(code){

alert("Campaign Code: " + code);

}

};

/* JOIN CAMPAIGN */

get("joinCampaignBtn").onclick = async ()=>{

const code = get("joinCodeInput").value;

const joined = await joinCampaign(code);

if(joined){

alert("Joined campaign " + code);

}

};

/* MAP UPLOAD */

get("addMapBtn").onclick = ()=>{

get("mapUpload").click();

};

get("mapUpload").onchange = (e)=>{

const file = e.target.files[0];

const reader = new FileReader();

reader.onload = ()=>{

addMap(reader.result);

};

reader.readAsDataURL(file);

};

/* TOKEN */

get("tokenBtn").onclick = ()=>{

createToken("https://cdn-icons-png.flaticon.com/512/3522/3522099.png");

};

/* MARKER UPLOAD */

get("uploadMarkerBtn").onclick = ()=>{

get("markerUpload").click();

};

get("markerUpload").onchange = (e)=>{

const file = e.target.files[0];

const reader = new FileReader();

reader.onload = ()=>{

createToken(reader.result);

};

reader.readAsDataURL(file);

};
