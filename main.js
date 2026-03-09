import { initAuth } from "./auth.js"

import {
addMap,
createToken,
enableDrawing,
drawGrid,
measure
} from "./map.js"



/* =========================
HELPERS
========================= */

function get(id){
return document.getElementById(id)
}



/* =========================
AUTH SYSTEM
========================= */

initAuth((user)=>{

get("authSection").classList.add("hidden")

get("appLayout").classList.remove("hidden")

})



/* =========================
MAP UPLOAD
========================= */

get("addMapBtn").onclick = () => {

get("mapUpload").click()

}


get("mapUpload").onchange = (e) => {

const file = e.target.files[0]

const reader = new FileReader()

reader.onload = () => {

addMap(reader.result)

}

reader.readAsDataURL(file)

}



/* =========================
TOKEN
========================= */

get("tokenBtn").onclick = () => {

createToken("https://cdn-icons-png.flaticon.com/512/3522/3522099.png")

}



/* =========================
DRAW
========================= */

get("drawBtn").onclick = () => {

enableDrawing()

}



/* =========================
GRID
========================= */

drawGrid()



/* =========================
MEASURE
========================= */

get("measureBtn").onclick = () => {

measure()

}



/* =========================
UPLOAD MARKER
========================= */

get("uploadMarkerBtn").onclick = () => {

get("markerUpload").click()

}


get("markerUpload").onchange = (e) => {

const file = e.target.files[0]

const reader = new FileReader()

reader.onload = () => {

createToken(reader.result)

}

reader.readAsDataURL(file)

}



/* =========================
🔥 FIRE IDEA GENERATOR
========================= */

get("fireBtn").onclick = () => {

const subjects = [

"a dragon",
"a cult",
"a mysterious traveler",
"a magical artifact",
"a noble",
"a forgotten god",
"a rival adventuring party",
"a cursed relic",
"a secret society"

]

const actions = [

"awakens",
"betrays the party",
"asks for help",
"attacks the town",
"reveals a hidden dungeon",
"starts a war",
"opens a portal",
"steals a sacred item"

]

const locations = [

"in the capital city",
"in an ancient forest",
"inside a hidden temple",
"in a haunted castle",
"inside a collapsing dungeon",
"beneath the royal palace",
"inside a forbidden ruin"

]

const idea =
subjects[Math.floor(Math.random()*subjects.length)]
+" "+
actions[Math.floor(Math.random()*actions.length)]
+" "+
locations[Math.floor(Math.random()*locations.length)]

alert("🔥 Story Idea:\n\n"+idea)

}



/* =========================
🧙 BACKSTORY GENERATOR
========================= */

get("backstoryBtn").onclick = () => {

const origins = [

"You were once a knight",
"You were raised by thieves",
"You escaped a magical prison",
"You grew up in a cursed village",
"You were trained by a legendary warrior"

]

const secrets = [

"but you hide a dangerous secret",
"but your family betrayed you",
"but you owe a dragon a favor",
"but you are hunted by assassins",
"but you carry a cursed weapon"

]

const goals = [

"and now you seek redemption",
"and now you search for revenge",
"and now you hunt a lost artifact",
"and now you protect an ancient secret",
"and now you seek a lost kingdom"

]

const backstory =
origins[Math.floor(Math.random()*origins.length)]
+" "+
secrets[Math.floor(Math.random()*secrets.length)]
+" "+
goals[Math.floor(Math.random()*goals.length)]

alert("🧙 Character Backstory:\n\n"+backstory)

}
