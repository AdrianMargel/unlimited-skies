const staticAppFiles = "unlimited-skies-v1";

let gl=document.getElementById("c").getContext("webgl2",{
	premultipliedAlpha: true
});
// gl.getExtension('EXT_color_buffer_float');

const MAX_SHADER_ITEMS=5000;
let sharedTextures=new TextureManager();
let cloudPaint=new CloudPaintShader();
let background=new BackgroundShader();
// let background=new TextureSaveShader();
let renderer=new RenderShader();
let bulletRenderer=new BulletShader();
let particleRenderer=new ParticleShader();

let gameDisplay=new Display();
gameDisplay.connect();
let gameRunner=new Game();
gameRunner.init();
let gameControl=new Control();
gameControl.connect(document.body);

var displaying=true;
var last;
var totalElapsed=0;
let dispT=new Date().getTime();
async function animation(timestamp) {
	if(last===undefined){
		last=timestamp;
	}
	let elapsed=timestamp-last;
	last=timestamp;
	let runSpeed=1000/60;
	let animAmount=Math.min(elapsed/runSpeed,3);
	totalElapsed+=animAmount;

	// console.log(animAmount);
	//run the game inside the animation loop to prevent frame skipping from framerate mismatch
	gameRunner.run(gameDisplay,gameControl,animAmount,runSpeed);
	// gameRunner.randomWaves(animAmount);

	// gameRunner.run(gameDisplay,gameControl,1);

	// gameRunner.run(gameDisplay,gameControl,.25);
	// gameRunner.run(gameDisplay,gameControl,.25);
	// gameRunner.run(gameDisplay,gameControl,.25);
	// gameRunner.run(gameDisplay,gameControl,.25);

	// gameRunner.run(gameDisplay,gameControl,PI/10);
	// gameRunner.run(gameDisplay,gameControl,.34);
	// gameRunner.run(gameDisplay,gameControl,.34);
	
	// if(Math.random()<.05)
	// await sleep(1000*(3/60));

	gameRunner.display(gameDisplay,gameControl,renderer,background,animAmount);
	if(displaying){
		// console.log("disp",new Date().getTime()-dispT);
		dispT=new Date().getTime();
		window.requestAnimationFrame(animation);
	}
}
window.requestAnimationFrame(animation);

function sleep(ms){
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function cacheFile(file){
	if(!navigator.onLine){
		return;
	}
	try{
		let cache=await caches.open(staticAppFiles);
		console.log('caching file '+file);
		await cache.add(file);
		console.log('caching complete');
	}catch(e){

	}
}

let showLoading=bind(true);
function completeShaderLoad(){
	showLoading.data=false;
}
let showPlaneSelector=bind(true);
let showGameOver=bind(false);
let showWin=bind(false);
let showSettings=bind(false);
let paused=bind(false);
let waveNum=bind(1);
let soundMuted=bind(true);
let soundVolume=bind(loadByKey("soundVolume")??.15);
let musicVolume=bind(loadByKey("musicVolume")??.5);
let playerHealth=bind(1);
let playerMaxHealth=bind(1);

let soundLink=link(()=>{
	saveByKey("soundVolume",soundVolume.data);
	gameRunner.sounds.setVolume(soundVolume.data)
},soundVolume);
let musicLink=link(()=>{
	saveByKey("musicVolume",musicVolume.data);
	gameRunner.music.setVolume(musicVolume.data)
},musicVolume);
soundLink();
musicLink();

// Populate page html
let uiBodyHtml=html`
	${new LoadingBar(showLoading)}
	${new TopDisplay(showPlaneSelector,waveNum,playerHealth,playerMaxHealth)}
	${new PlaneSelector(showPlaneSelector,soundMuted)}
	${new GameOverMenu(showGameOver,waveNum)}
	${new GameWinMenu(showWin,waveNum)}
	${new PauseMenu(paused,soundMuted)}
	${new SettingsMenu(showSettings,soundVolume,musicVolume)}
	
	<div class=${attr(()=>showPlaneSelector.data?"hidden":"")(showPlaneSelector)}>
		<button
			class="pause"
			onclick=${attr(act((e)=>{
				gameRunner.pause();
			}))}
		>
			<div class="left"></div><div class="right"></div>
		</button>
	</div>
`;
uiBody=uiBodyHtml().data
addElm(uiBody,document.body);
uiBody.disolve();

//cache music outside of the service worker
//this is lower priority and doesn't need to hold up the PWA install
let musicAssets=[
	"/music/special/nyan.mp3",
	"/music/Backbonebreaks.mp3",
	"/music/Beatfever.mp3",
	"/music/Clutterfunk, Pt. 2.mp3",
	"/music/Combo Breaker.mp3",
	"/music/Fireburst.mp3",
	"/music/Geometrical Dominator.mp3",
	"/music/Give Me a Break.mp3",
	"/music/Rocket Race.mp3",
	"/music/Run.mp3",
	"/music/Snow in the Air.mp3",
	"/music/Striker.mp3",
	"/music/Supra Zone.mp3",
];
(async ()=>{
	let cache=await caches.open(staticAppFiles);
	let cached=(await cache.keys()).map(x=>new URL(x.url).pathname);
	for(let i=0;i<musicAssets.length;i++){
		if(cached.includes(encodeURI(musicAssets[i]))){
			console.log("already cached "+musicAssets[i])
		}else{
			await cacheFile(musicAssets[i]);
		}
	}
})();


function gimmeMoney(){
	console.log(";)");
	gameRunner.pay(1000000000);
}
function immaBroke(){
	console.log(":(");
	playerProgress.coins.data=0;
}