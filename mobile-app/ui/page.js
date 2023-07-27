function loadByKey(key){
	try{
		return JSON.parse(localStorage.getItem(key)??"null");
	}catch(e){
		return null;
	}
}
function saveByKey(key,data){
	localStorage.setItem(key,JSON.stringify(data));
}
function loadProgress(output){
	if(isSandboxMode){
		return output;
	}
	let loaded=loadByKey("progress");
	if(loaded==null){
		return output;
	}
	
	if(loaded.coins!=null){
		output.coins=loaded.coins;
	}
	if(loaded.unlocks!=null){
		planeSelection.forEach((plane,i)=>{
			let loadedPlane=loaded.unlocks[plane.id];
			if(loadedPlane!=null){
				let unlockedLevel=loadedPlane.unlockedLevel;
				let selectedLevel=loadedPlane.selectedLevel;
				let hidden=loadedPlane.hidden??false;
				output.unlocks[i]={
					unlockedLevel,
					selectedLevel,
					hidden
				};
			}
		});
	}
	return output;
}
function saveProgress(){
	if(isSandboxMode){
		return;
	}
	let toSave=loadByKey("progress")??{};
	if(typeof toSave.unlocks!="object"||Array.isArray(toSave.unlocks)){
		toSave.unlocks={};
	}

	toSave.coins=playerProgress.coins.data;
	planeSelection.forEach((plane,i)=>{
		let planeUnlock=playerProgress.unlocks[i];
		toSave.unlocks[plane.id]={
			unlockedLevel:planeUnlock.unlockedLevel.data,
			selectedLevel:planeUnlock.selectedLevel.data,
			hidden:planeUnlock.hidden?.data??false
		}
	});

	saveByKey("progress",toSave);
}
function clearProgress(){
	if(isSandboxMode){
		return;
	}
	localStorage.removeItem("progress");
}

let planeSelection=[
	{
		id:"jet",
		unlockPrice:0,
		upgradePrice:5000,
		levels:{
			0:{name:"Wright Flyer",description:"A little more complicated than a bicycle",spawnClass:WrightFlyer,baseLevel:1},
			1:{name:"Fighter Jet",description:"Cup holders not included",spawnClass:Jet},
			5:{name:"F-22 Raptor",description:"Just don't fly in the rain",spawnClass:Raptor,baseLevel:1},
		}
	},
	{
		id:"biplane",
		unlockPrice:0,
		upgradePrice:5000,
		spawnClass:Biplane,
		levels:{
			0:{name:"Nullplane",description:"Who needed wings anyway?"},
			1:{name:"Biplane",description:"Now with double the wings!"},
			2:{name:"Triplane",description:"Now with triple the wings!"},
			3:{name:"Tetraplane",description:"Now with x4 the wings!"},
			4:{name:"Pentaplane",description:"Now with x5 the wings!"},
			5:{name:"Hexaplane",description:"Now with x6 the wings!"},
			6:{name:"Heptaplane",description:"Now with x7 the wings!"},
			7:{name:"Octaplane",description:"Now with x8 the wings!"},
			8:{name:"Enneaplane",description:"Now with x9 the wings!"},
			9:{name:"Decaplane",description:"Now with x10 the wings!"},
			10:{name:"Pile of Wings",description:"Don't you think you have enough wings yet?"},
		}
	},
	{
		id:"warplane",
		unlockPrice:20000,
		upgradePrice:5000,
		levels:{
			0:{name:"Buzz Bomb",description:"You're the bomb!",spawnClass:BuzzBomb,isSpecial:true,baseLevel:1},
			1:{name:"War Plane",description:"They just don't make em' like they used to.",spawnClass:WarPlane},
			5:{name:"Corsair",description:"They just don't make em' like they used to.",spawnClass:Corsair,baseLevel:1},
		}
	},
	{
		id:"bomber",
		unlockPrice:24000,
		upgradePrice:6000,
		spawnClass:Bomber,
		levels:{
			0:{name:"Hippie Bomber",description:"The planet is your friend",rainbowExplosions:true},
			1:{name:"Bomber",description:"Gravity is your friend"},
			5:{name:"Black Bird",description:"You don't need friends.",spawnClass:BlackBird,baseLevel:1},
		}
	},
	{
		id:"helicopter",
		unlockPrice:28000,
		upgradePrice:7000,
		spawnClass:Helicopter,
		levels:{
			0:{name:"Helicopter?",description:"Something seems... wrong..."},
			1:{name:"Helicopter",description:"Everyone loves spinny things!"},
			5:{name:"Attack Helicopter",description:"Even the military loves spinny things!",spawnClass:Chopper,baseLevel:1},
		}
	},
	{
		id:"hotairballoon",
		unlockPrice:32000,
		upgradePrice:8000,
		levels:{
			0:{name:"Flying House",description:"A short-lived adventure",spawnClass:FlyingHouse,baseLevel:1},
			1:{name:"Hot Air Balloon",description:"Whimsical tranquility",spawnClass:HotAirBalloon},
			5:{name:"Zeppelin",description:"Just don't let it pop",spawnClass:Zeppelin,baseLevel:1},
		}
	},
	{
		id:"flyingfortress",
		unlockPrice:36000,
		upgradePrice:9000,
		levels:{
			0:{name:"Air Liner",description:"King of the skies!",spawnClass:AirLiner,baseLevel:1},
			1:{name:"Flying Fortress",description:"Like a castle in the sky",spawnClass:FlyingFortress},
			5:{name:"Flying Castle",description:"Literally a castle in the sky",spawnClass:FlyingCastle,baseLevel:1},
		}
	},
	{
		id:"triebflugel",
		unlockPrice:40000,
		upgradePrice:10000,
		levels:{
			0:{name:"???",description:"It looks hungry...",spawnClass:MadBall,isSpecial:true,baseLevel:1},
			1:{name:"Triebflugel",description:"German engineering at its finest",spawnClass:Triebflugel},
			5:{name:"Rocket",description:"Explore the infinite nothingness of space!",spawnClass:Rocket,baseLevel:1},
		}
	},
	{
		id:"podracer",
		unlockPrice:44000,
		upgradePrice:11000,
		spawnClass:PodRacer,
		levels:{
			0:{name:"Pod",description:"Good luck"},
			1:{name:"Pod Racer",description:"Rated safe for kids!"},
		}
	},
	{
		id:"nyancat",
		unlockPrice:50000,
		upgradePrice:12500,
		levels:{
			0:{name:"Flappy Bird",description:"Boing! Boing! Boing!",spawnClass:FlappyBird,baseLevel:1},
			1:{name:"Nyan Cat",description:"Nyan nyan nyan nyan nyan nyan...",spawnClass:NyanCat,rainbowExplosions:true},
		}
	},
	{
		id:"dragon",
		unlockPrice:1000000,
		upgradePrice:-1,//-1 used to indicate no upgrades
		spawnClass:Dragon,
		levels:{
			1:{name:"Dragon",description:"Let nothing stand in your way"},
		}
	},
	{
		id:"spaghetti",
		unlockPrice:0,
		upgradePrice:-1,//-1 used to indicate no upgrades
		spawnClass:SpaghettiMonster,
		levels:{
			1:{name:"Spagootz",description:""},
		}
	},
];
let playerProgress={
	coins:0,
	unlocks:[
		{//jet
			unlockedLevel:1,
			selectedLevel:1
		},
		{//biplane
			unlockedLevel:1,
			selectedLevel:1
		},
		{//warplane
			unlockedLevel:0,
			selectedLevel:1
		},
		{//bomber
			unlockedLevel:0,
			selectedLevel:1
		},
		{//helicopter
			unlockedLevel:0,
			selectedLevel:1
		},
		{//hotairballoon
			unlockedLevel:0,
			selectedLevel:1
		},
		{//flyingfortress
			unlockedLevel:0,
			selectedLevel:1
		},
		{//triebflugel
			unlockedLevel:0,
			selectedLevel:1
		},
		{//podracer
			unlockedLevel:0,
			selectedLevel:1
		},
		{//nyancat
			unlockedLevel:0,
			selectedLevel:1
		},
		{//dragon
			unlockedLevel:0,
			selectedLevel:1
		},
		{//spaghetti
			hidden:true,
			unlockedLevel:0,
			selectedLevel:1
		},
	],
};
let urlParams=new URLSearchParams(window.location.search);
let isSandboxMode=urlParams.get('sandbox')!=null;
playerProgress=bind(loadProgress(playerProgress));

if(isSandboxMode){
	playerProgress.coins.data+=1000000000000;
}
function unlockSpaghetti(){
	playerProgress.unlocks[11].hidden.data=false;
}

class CoinDisplay extends CustomElm{
	constructor(coins,useLetters=true){
		super();
		coins=bind(coins);
		this.define(html`
			${html`${()=>this.formatNum(coins.data,useLetters)}`(coins)}<div class="coin"></div>
		`);
	}
	formatNum(x,useLetters){
		let letter="";
		if(useLetters){
			if(x>=1000000000){
				x/=1000000000;
				letter=" B";
			}else if(x>=1000000){
				x/=1000000;
				letter=" M";
			}else if(x>=100000){
				x/=1000;
				letter=" K";
			}
		}
		x=Math.ceil(x*100)/100;
		return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")+letter;
	}
	getCoins(){
		return playerProgress.coins;
	}
}
defineElm(CoinDisplay,scss`&{
	font-family: 'Nunito', sans-serif;
	font-weight:700;
	font-size: 20px;
	${theme.center}
	white-space: nowrap;
	.coin{
		display:inline-block;
		margin-left:5px;
		width:30px;
		height:30px;
		border-radius:15px;
		border: 5px solid ${hsv(.12,1,.9)};
		background-color:${hsv(.15,1,1)};
		box-sizing:border-box;
	}
}`);
class ButtonPrice extends CustomElm{
	constructor(price,event){
		super();
		price=bind(price);
		event=bind(event);
		let coins=this.getCoins();
		let cDisp=new CoinDisplay(price);
		this.define(html`
			<button
				onclick=${attr(act(()=>{
					if(coins.data>=price.data){
						coins.data-=price.data;
						event.data();
					}
				}))(event)}
				class=${attr(()=>coins.data<price.data?"locked":"")(coins,price)}
			>
				<div class="surface">
					${html`${()=>price.data==0?"Free":cDisp}`(coins,price)}
				</div>
			</button>
		`);
	}
	getCoins(){
		return playerProgress.coins;
	}
}
defineElm(ButtonPrice,scss`&{
	display:block;
	>button{
		position: relative;
		padding: 0;
		border: none;
		border-radius: 100px;
		${theme.boxShadowStep(-2)}
		.surface{
			height:30px;
			font-weight: 700;
			font-size: 20px;
			color: white;
			border: none;
			padding: 10px 30px;
			${theme.superShort}{
				padding: 5px 30px;
			}
			border-radius: 100px;
			position: relative;
			bottom: 10px;
			transition: bottom 0.1s;
			${theme.center};
		}
		&:active .surface{
			bottom: 4px;
		}
		&:active .selector{
			bottom: -12px;
		}
		
		&.locked{
			background-color: ${rgb(.3)} !important;
			>.surface{
				color: ${rgb(.6)};
				background-color: ${rgb(.4)} !important;
			}
		}
	}
}`);

class PlaneSelector extends CustomElm{
	constructor(show,muted){
		super();
		show=bind(show);
		let level=bind(1);
		let idx=bind(0);
		let coins=this.getCoins();
		let unlocked=bind(true);

		let spawnPlane=()=>{
			let [plane,planeLevel,baseSpawnClass]=this.getPlaneFull(idx.data,level.data);
			let realLevel=level.data;
			if(plane.baseLevel){
				realLevel=(level.data-planeLevel)+plane.baseLevel;
			}
			gameRunner.spawnPlayer(plane.spawnClass??baseSpawnClass,realLevel,plane.isSpecial??false,plane.rainbowExplosions??false);
		}
		let levelDown=()=>{
			let progress=this.getProgress(idx.data);
			level.data=Math.max(level.data-1,0);
			progress.selectedLevel.data=level.data;
			spawnPlane();

			saveProgress();
		};
		let levelUp=()=>{
			let progress=this.getProgress(idx.data);
			progress.selectedLevel.data=level.data+1;
			progress.unlockedLevel.data=Math.max(level.data+1,progress.unlockedLevel.data);
			level.data+=1;
			spawnPlane();

			saveProgress();
		};
		let prevIdx=()=>{
			idx.lock();
			idx.data=mod(idx.data-1,planeSelection.length);
			let progress=this.getProgress(idx.data);
			level.data=progress.selectedLevel.data;
			idx.unlock();
			spawnPlane();
		}
		let nextIdx=()=>{
			idx.lock();
			idx.data=mod(idx.data+1,planeSelection.length);
			let progress=this.getProgress(idx.data);
			level.data=progress.selectedLevel.data;
			idx.unlock();
			spawnPlane();
		}
		let unlock=()=>{
			let progress=this.getProgress(idx.data);
			progress.unlockedLevel.data=1;
			progress.selectedLevel.data=1;
			unlocked.data=true;
			saveProgress();
		}
		let tryPlay=()=>{
			let progress=this.getProgress(idx.data);
			if(progress.unlockedLevel.data>=level.data){
				gameRunner.start();
				show.data=false;
			}
		}
		let openSettings=()=>{
			showSettings.data=true;
		}
		let toggleVolume=()=>{
			muted.data=!muted.data;
			if(muted.data){
				gameRunner.sounds.mute();
				gameRunner.music.mute();
			}else{
				gameRunner.sounds.unmute();
				gameRunner.music.unmute();
			}
		}
		let toggleFullscreen=()=>{
			if(document.fullscreenElement==null){
				document.body.requestFullscreen();
			}else{
				document.exitFullscreen();
			}
		};

		{
			let progress=this.getProgress(idx.data);
			level.data=progress.selectedLevel.data;
			spawnPlane();
		}

		let unlockPrice=bind(0);
		let upgradePrice=bind(0);
		let downgradePrice=bind(0);
		let unlockBtn=new ButtonPrice(unlockPrice,unlock);
		let upgradeBtn=new ButtonPrice(upgradePrice,levelUp);
		let downgradeBtn=new ButtonPrice(downgradePrice,levelDown);

		this.attr("class",()=>show.data?"":"hidden")(show);
		this.define(html`
			${()=>{
				let plane=this.getPlane(idx.data,level.data);
				let progress=this.getProgress(idx.data);

				let upPrice=level.data*(level.data+1)*planeSelection[idx.data].upgradePrice/2;
				if(level.data>5){
					upPrice=(level.data-5)*10000;
				}else if(level.data==5){
					upPrice*=4;
				}
				let noUpgrades=planeSelection[idx.data].upgradePrice==-1;

				unlocked.data=progress.unlockedLevel.data>0;
				unlockPrice.data=planeSelection[idx.data].unlockPrice;
				upgradePrice.data=(progress.unlockedLevel.data-1)<level.data?upPrice:0;

				return html`
				<div>
					<div class="top">
						<div>
							<img src="/img/logo.png"/>
							<div class="settings">
								<button onclick=${attr(act(toggleVolume))} class=${attr(()=>muted.data?"muted":"unmuted")}></button>
								<button onclick=${attr(act(openSettings))} class="gear"></button>
								<button onclick=${attr(act(toggleFullscreen))} class="fullscreen"></button>
							</div>
							<div class="play ${!unlocked.data?"locked":""}">
								${new ButtonClickable("PLAY",tryPlay)}
							</div>
						</div>
					</div>
					<div class="prev">
						<button
							onclick=${attr(act(prevIdx))}
							class="${idx.data==0?"hidden":""}"
						>
							<
						</button>
					</div>
					<div class="next">
						<button
							onclick=${attr(act(nextIdx))}
							class="${(idx.data==planeSelection.length-1||(this.getProgress(idx.data+1).hidden?.data??false))?"hidden":""}"
						>
							>
						</button>
					</div>
					<div class="bottom">
						<span class="level"><span>lv ${level}</span></span>
						<span class="name">${plane.name}</span>
						<span class="description">${plane.description}</span>
						${()=>{
							if(!unlocked.data){
								return html`
								<div class="unlock">
									Unlock
									${unlockBtn}
								</div>`
							}else if(!noUpgrades){
								return html`
								<div class="bar">
									${()=>Array(Math.max(5,progress.unlockedLevel.data)).fill().map((_,i,arr)=>
										html`
										<div
											class="segment
												${(level.data>=i+1)?"filled":""}
												${i==0?"first":""}
												${i==arr.length-1?"last":""}
											"
										></div>`	
									)}
								</div>
								<div class="upgrades">
									<div class="down">
										<span class="${level.data==0?"hidden":""}">
											Level Down
											${downgradeBtn}
										</span>
									</div>
									<div class="up">
										${level.data>5?"; )":"Level Up"}
										${upgradeBtn}
									</div>
								</div>`;
							}
						}}
					</div>
				<div>`;
			}}
		`(idx,level,coins,unlocked,muted));
	}
	getPlane(idx,level){
		let levels=planeSelection[idx].levels;
		let opts=Object.keys(levels).map(o=>Number(o));
		opts.sort((a,b)=>a-b);
		let closest=0;
		for(let i=0;i<opts.length;i++){
			let o=opts[i];
			if(o==level){
				return planeSelection[idx].levels[level];
			}else if(o<level){
				closest=o;
			}else{
				break;
			}
		}
		return planeSelection[idx].levels[closest];
	}
	getPlaneFull(idx,level){
		let levels=planeSelection[idx].levels;
		let opts=Object.keys(levels).map(o=>Number(o));
		opts.sort((a,b)=>a-b);
		let closest=0;
		for(let i=0;i<opts.length;i++){
			let o=opts[i];
			if(o==level){
				return [planeSelection[idx].levels[level],level,planeSelection[idx].spawnClass];
			}else if(o<level){
				closest=o;
			}else{
				break;
			}
		}
		return [planeSelection[idx].levels[closest],closest,planeSelection[idx].spawnClass];
	}
	getProgress(idx){
		return playerProgress.unlocks[idx];
	}
	getCoins(){
		return playerProgress.coins;
	}
}
defineElm(PlaneSelector,scss`&{
	overflow:hidden;
	position: absolute;
	display: block;
	inset:0;
	z-index:10;
	${theme.center}
	.locked{
		${ButtonClickable}{
			>button{
				background-color: ${rgb(.3)} !important;
				>.surface{
					color: ${rgb(.6)};
					background-color: ${rgb(.4)} !important;
				}
			}
		}
	}
	>div{
		position:relative;
		${theme.center}
		height:200px;
		flex-grow:1;
		>.prev{
			margin-right:200px;
			${theme.mobile}{
				margin-right:75px;
			}
			width:100px;
			${theme.center}
			button{
				font-family: 'Fredoka One', sans-serif;
				font-size:100px;
				border:none;
				background:none;
				${theme.short}{
					font-size:50px;
				}
			}
		}
		>.next{
			margin-left:200px;
			${theme.mobile}{
				margin-left:75px;
			}
			width:100px;
			${theme.center}
			button{
				font-family: 'Fredoka One', sans-serif;
				font-size:100px;
				border:none;
				background:none;
				${theme.short}{
					font-size:50px;
				}
			}
		}
	
		>.top{
			position:absolute;
			bottom:200px;
			${theme.short}{
				bottom:150px;
			}
			${theme.center}
			>div{
				text-align:center;
				>img{
					max-width:calc(100vw - 200px);
					${theme.mobile}{
						position:fixed;
						left:20px;
						top:20px;
					}
					${theme.short}{
						display:none;
					}
				}
				>.settings{
					${theme.center}
					>button{
						&.muted{
							background-image:url("/img/volume-xmark.svg");
							background-position:center;
							background-repeat:no-repeat;
							background-size:30px;
						}
						&.unmuted{
							background-image:url("/img/volume-high.svg");
							background-position:center;
							background-repeat:no-repeat;
							background-size:34px;
						}
						&.gear{
							background-image:url("/img/gear.svg");
							background-position:center;
							background-repeat:no-repeat;
							background-size:26px;
						}
						&.fullscreen{
							background-image:url("/img/expand.svg");
							background-position:center;
							background-repeat:no-repeat;
							background-size:24px;
						}
						width:50px;
						height:50px;
						${theme.center}
						font-size:30px;
						background:none;
						border:none;
						&:hover{
							background-color:#00000050;
						}
					}
				}
				>.play{
					margin-top:20px;
					>${ButtonClickable}{
						>button{
							background-color: ${hsv(.35,.7,.6)};
							>.surface{
								font-weight:900;
								width:100px;
								background-color: ${hsv(.35,.7,.8)};
							}
						}
					}
				}
			}
		}
		>.bottom{
			position:absolute;
			top:200px;
			${theme.mobile}{
				top:150px;
			}
			${theme.short}{
				top:150px;
			}
			${theme.superShort}{
				top:125px;
			}
			>.unlock{
				text-align:center;
				font-weight:700;
				font-size: 20px;
				text-shadow:
					0 0 4px #ffffff,
					0 0 3px #ffffff;

				>${ButtonPrice}{
					margin-top:20px;
					>button{
						background-color: ${hsv(.35,.7,.6)};
						>.surface{
							width:100px;
							background-color: ${hsv(.35,.7,.8)};
						}
					}
				}
			}
			>.bar{
				width:420px;
				${theme.mobile}{
					width:320px;
				}
				height:20px;
				margin-bottom:20px;
				${theme.short}{
					height:10px;
					margin-bottom:5px;
				}
				border-radius:10px;
				box-sizing:border-box;
				${theme.center}
				align-items:stretch;
				overflow:hidden;
				${theme.boxShadowStep(-3)}
				>.segment{
					background:white;
					flex-grow:1;
					border-right:4px solid ${rgb(.7)};
					&.filled{
						background-color: ${hsv(.35,.7,.8)};
						border-color: ${hsv(.35,.7,.6)};
					}
					&.last{
						border-right:none;
					}
				}
			}
			>.upgrades{
				${theme.center}
				>.up{
					width:200px;
					${theme.mobile}{
						width:150px;
					}
					font-weight:700;
					font-size: 20px;
					text-align:center;
					text-shadow:
						0 0 4px #ffffff,
						0 0 3px #ffffff;
					>${ButtonPrice}{
						margin-top:20px;
						${theme.short}{
							margin-top:15px;
						}
						>button{
							background-color: ${hsv(.35,.7,.6)};
							>.surface{
								width:100px;
								background-color: ${hsv(.35,.7,.8)};
								${theme.mobile}{
									width:75px;
								}
							}
						}
					}
				}
				>.down{
					width:200px;
					margin-right:20px;
					${theme.mobile}{
						width:150px;
					}

					font-weight:700;
					font-size: 20px;
					text-align:center;
					text-shadow:
						0 0 4px #ffffff,
						0 0 3px #ffffff;
					${ButtonPrice}{
						margin-top:20px;
						${theme.short}{
							margin-top:15px;
						}
						>button{
							background-color: ${hsv(0,.6,.6)};
							>.surface{
								width:100px;
								background-color: ${hsv(0,.6,.8)};
								${theme.mobile}{
									width:75px;
								}
							}
						}
					}
				}
			}
			button{
				font-family: 'Nunito', sans-serif;
				font-weight:700;
				font-size: 20px;
			}
			>span{
				display:block;
				text-align:center;
				&.description{
					font-size: 20px;
					margin-bottom:20px;
					text-shadow:
						0 0 4px #ffffff,
						0 0 3px #ffffff;
				}
				&.name{
					font-size: 40px;
					font-family: 'Fredoka One', sans-serif;
					margin-bottom:20px;
					margin-top:5px;
					color:white;
					text-shadow:
						0 0 5px #000;
				}
				&.level{
					font-size: 20px;
					font-family: 'Fredoka One', sans-serif;
					>span{
						background-color:white;
						border-radius:8px;
						padding: 0px 10px;
					}
				}
				${theme.mobile}{
					&.description{
						font-size: 15px;
						margin-bottom:15px;
					}
					&.name{
						font-size: 30px;
						margin-bottom:15px;
					}
					&.level{
						font-size: 15px;
					}
				}
				${theme.short}{
					&.description{
						font-size: 15px;
						margin-bottom:15px;
					}
					&.name{
						font-size: 30px;
						margin-bottom:15px;
					}
					&.level{
						font-size: 15px;
					}
				}
				${theme.superShort}{
					&.description{
						font-size: 10px;
						margin-bottom:5px;
					}
					&.name{
						font-size: 20px;
						margin-bottom:5px;
					}
					&.level{
						font-size: 10px;
					}
				}
			}
		}
	}
}`);

class HealthBar extends CustomElm{
	constructor(hp,maxHp){
		super();
		hp=bind(hp);
		maxHp=bind(maxHp);
		this.define(html`
			<div class="health">
				<div style=${attr(()=>"width:"+Math.max(hp.data/maxHp.data*100,0)+"%")(hp,maxHp)}></div>
			</div>
		`);
	}
}
defineElm(HealthBar,scss`&{
	display:flex;
	.health{
		flex-grow:1;
		border-right:4px solid black;
		border-left:4px solid black;
		background: #00000050;
		>div{
			width:50%;
			height:10px;
			background-color: ${hsv(.35,.7,.8)};
			border-bottom: 4px solid ${hsv(.35,.7,.6)};
		}
	}
}`);
class TopDisplay extends CustomElm{
	constructor(selecting,waveNum,hp,maxHp){
		super();
		waveNum=bind(waveNum);
		let coins=this.getCoins();
		this.define(html`
			<div class=${attr(()=>selecting.data?"hidden":"")(selecting)}>
				<div class="wave"><span>wave</span> ${html`${waveNum}`(waveNum)}/20</div>
				${new HealthBar(hp,maxHp)}
			</div>
			${new CoinDisplay(coins,false)}
		`);
	}
	getCoins(){
		return playerProgress.coins;
	}
}
defineElm(TopDisplay,scss`&{
	pointer-events:none;
	user-select:none;
	position: absolute;
	top:20px;
	right:20px;
	left:20px;
	font-family: 'Nunito', sans-serif;
	font-weight:700;
	font-size: 20px;
	>div{
		height:30px;
		>.wave{
			position:absolute;
			top:30px;
			left:0;
			>span{
				font-size:16px;
			}
		}
		>${HealthBar}{
			position:absolute;
			width:100%;
			top:0;
		}
	}
	>${CoinDisplay}{
		position:absolute;
		right:0;
	}
}`);

class PauseMenu extends CustomElm{
	constructor(show,muted){
		super();
		show=bind(show);

		let resume=()=>{
			gameRunner.resume();
		};
		let end=()=>{
			gameRunner.resume();
			gameRunner.end();
		};

		let toggleVolume=()=>{
			muted.data=!muted.data;
			if(muted.data){
				gameRunner.sounds.mute();
				gameRunner.music.mute();
			}else{
				gameRunner.sounds.unmute();
				gameRunner.music.unmute();
			}
		}
		let openSettings=()=>{
			showSettings.data=true;
		}
		let toggleFullscreen=()=>{
			if(document.fullscreenElement==null){
				document.body.requestFullscreen();
			}else{
				document.exitFullscreen();
			}
		};

		this.attr("class",()=>show.data?"":"hidden")(show);
		this.define(html`
			<div>
				<span class="title">PAUSED</span>
				<div class="settings">
					<button onclick=${attr(act(toggleVolume))} class=${attr(()=>muted.data?"muted":"unmuted")(muted)}></button>
					<button onclick=${attr(act(openSettings))} class="gear"></button>
					<button onclick=${attr(act(toggleFullscreen))} class="fullscreen"></button>
				</div>
				${new ButtonClickable("Resume",resume)}
				${addClass("bad",new ButtonClickable("End Game",end))}
			</div>
		`);
	}
}
defineElm(PauseMenu,scss`&{
	position: absolute;
	display: block;
	inset:0;
	z-index:10;
	${theme.center}
	color:white;

	>div{
		${theme.center}
		flex-direction:column;
		background-color:#000000D0;
		padding:50px 100px;
		${theme.mobile}{
			padding:25px 50px;
		}
		border-radius:20px;
	
		>.settings{
			${theme.center}
			>button{
				&.muted{
					background-image:url("/img/volume-xmark-white.svg");
					background-position:center;
					background-repeat:no-repeat;
					background-size:30px;
				}
				&.unmuted{
					background-image:url("/img/volume-high-white.svg");
					background-position:center;
					background-repeat:no-repeat;
					background-size:34px;
				}
				&.gear{
					background-image:url("/img/gear-white.svg");
					background-position:center;
					background-repeat:no-repeat;
					background-size:26px;
				}
				&.fullscreen{
					background-image:url("/img/expand-white.svg");
					background-position:center;
					background-repeat:no-repeat;
					background-size:24px;
				}
				width:50px;
				height:50px;
				${theme.center}
				font-size:30px;
				background:none;
				border:none;
				margin-bottom:10px;
				margin-top:10px;
				&:hover{
					background-color:#ffffff50;
				}
			}
		}
		>span{
			display:block;
			text-align:center;
			&.text{
				margin-bottom:10px;
				font-size: 20px;
				margin-bottom:20px;
				user-select:none;
			}
			&.title{
				font-size: 40px;
				font-family: 'Fredoka One', sans-serif;
				user-select:none;
			}
		}
		>${ButtonClickable}{
			margin-top:20px;
			margin-bottom:20px;
			>button{
				background-color: ${hsv(.35,.7,.6)};
				>.surface{
					width:100px;
					background-color: ${hsv(.35,.7,.8)};
					white-space: nowrap;
				}
			}
			&.bad>button{
				background-color: ${hsv(0,.6,.6)};
				>.surface{
					background-color: ${hsv(0,.6,.8)};
				}
			}
		}
	}
}`);

class GameOverMenu extends CustomElm{
	constructor(show,waveNum){
		super();
		show=bind(show);
		waveNum=bind(waveNum);

		let end=()=>{
			gameRunner.end();
		};

		let text=def(()=>{
			if(waveNum.data>20){
				return "Nice!";
			}else if(waveNum.data==20){
				return "SO CLOSE!";
			}else if(waveNum.data>10){
				return ":(";
			}
			return "Darn it...";
		},waveNum);

		this.attr("class",()=>show.data?"":"hidden")(show);
		this.define(html`
			<div>
				<span class="title">Game Over</span>
				<span class="subTitle">You survived to wave ${html`${waveNum}`(waveNum)}</span>

				${new ButtonClickable(text,end)}
				
			</div>
		`);
	}
}
defineElm(GameOverMenu,scss`&{
	position: absolute;
	display: block;
	inset:0;
	z-index:10;
	${theme.center}
	color:white;

	>div{
		${theme.center}
		flex-direction:column;
		background-color:#000000D0;
		padding:50px 100px;
		${theme.mobile}{
			padding:25px 50px;
		}
		border-radius:20px;
	
		>span{
			display:block;
			text-align:center;
			&.subTitle{
				font-size: 20px;
				margin-bottom:20px;
				user-select:none;
			}
			&.title{
				font-size: 40px;
				font-family: 'Fredoka One', sans-serif;
				margin-bottom:20px;
				user-select:none;
			}
		}
		>${ButtonClickable}{
			margin-top:20px;
			>button{
				background-color: ${hsv(.35,.7,.6)};
				>.surface{
					width:100px;
					background-color: ${hsv(.35,.7,.8)};
					white-space: nowrap;
				}
			}
		}
	}

}`);

class GameWinMenu extends CustomElm{
	constructor(show,waveNum){
		super();
		show=bind(show);
		waveNum=bind(waveNum);

		let end=()=>{
			gameRunner.end();
		};
		let endless=()=>{
			gameRunner.endless();
		};

		this.attr("class",()=>show.data?"":"hidden")(show);
		this.define(html`
			<div>
				<span class="title">You Win</span>
				<span class="subTitle">Humanity is saved!</span>
				<span class="subTitle">But what's this? There's a mysterious glowing button lying in the wreckage of a destroyed alien space craft.</span>
				<span class="subTitle">It seems to be a distress beacon to summon reinforcements. Thank goodness they didn't manage to press it in time.</span>

				${new ButtonClickable("Take the Win",end)}
				<span class="subTitle">(end game)</span>
				${addClass("bad",new ButtonClickable("Press the Button",endless))}
				<span class="subTitle">(continue in endless)</span>
				
			</div>
		`);
	}
}
defineElm(GameWinMenu,scss`&{
	position: absolute;
	display: block;
	inset:0;
	z-index:10;
	${theme.center}
	color:white;

	>div{
		max-width:400px;
		${theme.centerY}
		flex-direction:column;
		background-color:#000000D0;
		padding:50px 100px;
		${theme.mobile}{
			padding:25px 50px;
		}
		border-radius:20px;
		max-height:100vh;
		overflow-y:auto;
	
		>span{
			display:block;
			text-align:center;
			&.subTitle{
				font-size: 20px;
				margin-bottom:20px;
				margin-top:10px;
				user-select:none;
			}
			&.title{
				font-size: 40px;
				font-family: 'Fredoka One', sans-serif;
				margin-bottom:20px;
				user-select:none;
			}
		}
		>${ButtonClickable}{
			margin-top:20px;
			>button{
				background-color: ${hsv(.35,.7,.6)};
				>.surface{
					width:200px;
					${theme.mobile}{
						width:unset;
					}
					background-color: ${hsv(.35,.7,.8)};
					white-space: nowrap;
				}
			}
			&.bad>button{
				background-color: ${hsv(0,.6,.6)};
				>.surface{
					background-color: ${hsv(0,.6,.8)};
				}
			}
		}
	}
}`);

class VolumeControl extends CustomElm{
	constructor(vol){
		super();
		this.attr("onclick",act((e)=>{
			let toSet=e.layerX/this.offsetWidth;
			if(toSet<.05){
				toSet=0;
			}else if(toSet>.95){
				toSet=1;
			}
			vol.data=toSet;
			gameRunner.sounds.laser.play(null,0,1,toSet,true);
		}))();
		this.define(html`<div style=${attr(()=>`width:${vol.data*100}%`)}></div>`(vol));
	}
}
defineElm(VolumeControl,scss`&{
	${theme.elementReset}
	user-select:none;
	cursor:pointer;
	position: relative;
	border:2px solid white;
	border-radius:20px;
	overflow:hidden;
	height:20px;
	>div{
		height:20px;
		background-color:${hsv(.35,.7,.8)};
	}
	&:hover{
		border-color:${hsv(.35,.7,.8)};
	}
}`);

class SettingsMenu extends CustomElm{
	constructor(show,soundVolume,musicVolume){
		super();
		show=bind(show);

		let close=()=>{
			show.data=false;
		};
		let reset=()=>{
			clearProgress();
			location.reload();
		};

		this.attr("class",()=>show.data?"":"hidden")(show);
		this.define(html`
			<div>
				<button class="close" onclick=${attr(act(close))}>X</button>
				<span class="title">SETTINGS</span>
				<div>
					<span class="subTitle">Effects Volume</span>
					${new VolumeControl(soundVolume)}
					<span class="subTitle">Music Volume</span>
					${new VolumeControl(musicVolume)}
					<span class="subTitle">Delete Saved Data (cannot be undone)</span>
					<div class="center">${addClass("bad",new ButtonClickable("DELETE",reset,true))}</div>
				</div>
			</div>
		`);
	}
}
defineElm(SettingsMenu,scss`&{
	position: absolute;
	display: block;
	inset:0;
	z-index:10;
	${theme.center}
	color:white;
	background-color:#00000050;

	>div{
		background-color:#000000D0;
		border-radius:20px;
		position:relative;
		padding-top:20px;
		
		span{
			display:block;
			text-align:center;
			&.subTitle{
				font-size: 20px;
				margin-bottom:20px;
				user-select:none;
			}
			&.title{
				font-size: 40px;
				font-family: 'Fredoka One', sans-serif;
				padding-bottom:20px;
				border-bottom:2px solid white;
			}
		}
		>.close{
			position: absolute;
			top:5px;
			right:10px;
			font-size: 40px;
			font-family: 'Fredoka One', sans-serif;
			background:0;
			border:0;
			color: ${hsv(0,.6,.8)};
		}
		>div{
			padding:50px 100px;
			${theme.mobile}{
				padding:25px 50px;
			}
			padding-top:20px;
			overflow-y:auto;
			box-sizing:border-box;
			max-height:calc(100vh - 200px);

			.center{
				${theme.center}
			}
			${VolumeControl}{
				margin-bottom:40px;
			}
			${ButtonClickable}{
				>button{
					background-color: ${hsv(.35,.7,.6)};
					>.surface{
						width:100px;
						background-color: ${hsv(.35,.7,.8)};
						white-space: nowrap;
					}
				}
				&.bad>button{
					background-color: ${hsv(0,.6,.6)};
					>.surface{
						background-color: ${hsv(0,.6,.8)};
					}
				}
			}
		}
	}
}`);
class LoadingBar extends CustomElm{
	constructor(show){
		super();
		show=bind(show);

		let rot=bind(90);

		this.rotAnim=animate((t,tDiff)=>rot.data+=tDiff*360,1,true);
		this.rotAnim.start();

		this.stopSub=link(()=>{
			if(show.data){
				this.rotAnim.start();
			}else{
				this.rotAnim.stop();
			}
		},show);
		
		this.attr("class",()=>show.data?"":"hidden")(show);
		this.define(html`
			<div class="spinner2" style=${attr(()=>"transform:rotate(-"+rot.data*.75+"deg);")(rot)}>
				<div class="cover"></div>
			</div>
			<div class="spinner" style=${attr(()=>"transform:rotate("+rot.data+"deg);")(rot)}>
				<div class="cover"></div>
			</div>
			<div class="text">
				LOADING
			</div>
		`);
	}
}
defineElm(LoadingBar,scss`&{
	position:fixed;
	z-index:100;
	inset:0;
	background-color:white;
	${theme.center}
	font-family: 'Fredoka One', sans-serif;
	font-size:30px;
	.spinner{
		position: absolute;
		width:100px;
		height:100px;
		border:3px solid black;
		border-radius:100px;
		${theme.center}
		>.cover{
			position:relative;
			top:27.5px;
			min-width:110px;
			min-height:55px;
			background-color:white;
		}
	}
	.spinner2{
		position: absolute;
		width:160px;
		height:160px;
		border:4px solid black;
		border-radius:150px;
		${theme.center}
		>.cover{
			position:relative;
			top:60px;
			min-width:170px;
			min-height:120px;
			background-color:white;
		}
	}
	>.text{
		position:relative;
		background-color:white;
	}
}`);