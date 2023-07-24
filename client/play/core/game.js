class Game{
	constructor(){
		this.time=0;
		this.avgZoom=0.2;
		this.size=new Vector(20000,8000);

		this.planes=[];
		this.aliens=[];
		this.pBullets=[];
		this.aBullets=[];
		this.particles=[];
		this.specials=[];

		this.difficultyScale=1;//TODO (also remember to scale money gained)
		this.playerHealthScale=.5;
		this.alienHealthScale=1;

		this.director=new Director(this);

		this.map=new HitMap(this.size);
		this.cloudMap=new CloudMap(this.size);
		this.effects=new EffectManager(this);
		this.sounds=new SoundManager();
		this.music=new MusicManager();
		this.waterLine=new WaterLine(this);
		this.shadowLine=new ShadowLine(this);
		this.cloudSeedOffset=Math.random()*100000;

		this.screenStart=Vec(0,0);
		this.screenEnd=Vec(0,0);

		this.rainbowExplosions=false;
		this.canControl=false;
		this.paused=false;
		this.runSpeed=1;

		this.spawnClass=Jet;
		this.spawnLevel=1;
		this.spawnSpecial=false;
		this.spawnRainbowExplosions=false;

		this.messageText="";
		this.messageTime=0;
		this.messageCallback=null;

		this.escDown=false;
		this.spaceDown=false;
		this.queuedActions=[];
	}
	init(){
		// this.player=new WrightFlyer(Vec(0,-400),-0.5);
		// this.player=new Jet(Vec(0,-400),-0.5,1);
		// this.player=new Raptor(Vec(0,-400),-0.5,1);

		// this.player=new Biplane(Vec(30,0),0.1,1);

		// this.player=new Bomber(Vec(30,0),0.1,0);
		// this.player=new BlackBird(Vec(30,0),0.1,1);

		// this.player=new BuzzBomb(Vec(30,0),0.1,1);
		// this.specials.push(this.player);
		// this.player=new WarPlane(Vec(30,0),0.1,1);
		// this.player=new Corsair(Vec(30,0),0.1,1);

		// this.player=new MadBall(Vec(30,0),0.1);
		// this.specials.push(this.player);
		// this.player=new Triebflugel(Vec(30,0),0.1,1);
		// this.player=new Rocket(Vec(30,0),0.1,1);

		// this.player=new Helicopter(Vec(30,0),0.1,1);
		// this.player=new Chopper(Vec(30,0),0.1);

		// this.player=new AirLiner(Vec(30,0),0.1);
		// this.player=new FlyingFortress(Vec(30,0),0.1,1);
		// this.player=new FlyingCastle(Vec(30,0),0.1);

		// this.player=new FlyingHouse(Vec(30,0),0.1);
		// this.player=new HotAirBalloon(Vec(30,0),0.1);
		// this.player=new Zeppelin(Vec(30,0),0.1);

		// this.player=new NyanCat(Vec(30,0),0.1,1);
		// this.player=new FlappyBird(Vec(30,0),0.1);

		// this.player=new PodRacer(Vec(0,-400),-0.5,1);

		// this.player=new Shield(Vec(30,0),0.1);
		// this.player=new Swarmer(Vec(30,0),0.1);
		// this.player=new Dart(Vec(30,0),0.1);
		// this.player=new Arrow(Vec(30,0),0.1);
		// this.player=new Shell(Vec(30,0),0.1);
		// this.player=new StarGunner(Vec(30,0),0.1);
		// this.player=new Wrecker(Vec(30,0),0.1);

		// this.player=new BossSpike(Vec(30,0),0.1);
		// this.player=new BossDrill(Vec(30,0),0.1);
		// this.player=new BossAxe(Vec(30,0),0.1);
		// this.player=new BossYarn(Vec(30,0),0.1);

		// this.player=new Mothership(Vec(30,0),0.1);

		// this.player.init();
		// this.planes.push(this.player);
		this.spawnPlayer(Jet,1);
		// this.spawnPlayer(HotAirBalloon,4);

		sharedTextures.init(this.cloudMap);
		this.music.start();
	}
	spawnPlayer(spawnClass,level,isSpecial=false,rainbowExplosions=false){
		if(!this.canControl){
			this.planes=[];
			this.specials=[];
			this.player=new spawnClass(Vec(0,-250),-0.5,level).init();
			this.planes.push(this.player);
			if(isSpecial){
				this.specials.push(this.player);
			}
			
			this.rainbowExplosions=rainbowExplosions;

			this.spawnClass=spawnClass;
			this.spawnLevel=level;
			this.spawnSpecial=isSpecial;
			this.spawnRainbowExplosions=rainbowExplosions;
		}
	}
	pay(amount){
		playerProgress.coins.data+=Math.ceil(amount/this.difficultyScale);
	}
	pause(){
		if(this.canControl&&!this.pausedControl){
			paused.data=true;
			this.paused=true;
			this.sounds.pause();
		}
	}
	resume(){
		paused.data=false;
		this.paused=false;
		this.sounds.resume();
	}
	start(){
		if(!this.canControl){
			this.pausedControl=false;
			this.canControl=true;
			this.director.nextWave();
			showPlaneSelector.data=false;
			
			//randomize cloud seed every time
			this.cloudSeedOffset=Math.random()*100000;
			this.player.start();
		}
	}
	gameOver(){
		if(this.canControl){
			this.canControl=false;
			this.director.gameOver();
			showWin.data=false;
			showGameOver.data=true;

			saveProgress();
		}
	}
	gameWin(){
		if(this.canControl&&!showGameOver.data){
			this.pausedControl=true;
			showWin.data=true;

			saveProgress();
		}
	}
	endless(){
		this.pausedControl=false;
		this.director.nextWave();
		showWin.data=false;
	}
	end(){
		this.pausedControl=false;
		this.canControl=false;
		this.director.end();
		showPlaneSelector.data=true;
		showGameOver.data=false;
		showWin.data=false;

		this.player.die(false);

		this.planes=[];
		this.aliens=[];
		this.pBullets=[];
		this.aBullets=[];
		this.specials=[];
		this.resetZoom();
		this.spawnPlayer(this.spawnClass,this.spawnLevel,this.spawnSpecial,this.spawnRainbowExplosions);
		
		saveProgress();
	}
	run(disp,ctrl,timeStep,runSpeed){
		this.runSpeed=runSpeed;

		let escPress=ctrl.pressedKeys["27"]&&!this.escDown;
		this.escDown=ctrl.pressedKeys["27"];
		let spacePress=ctrl.isKeyDown(" ")&&!this.spaceDown;
		this.spaceDown=ctrl.isKeyDown(" ");

		if(escPress||spacePress){
			if(showSettings.data){
				if(escPress){
					showSettings.data=false;
				}
			}else if(this.paused){
				this.resume();
				return;
			}
		}
		if(showGameOver.data&&spacePress){
			this.end();
		}
		if(this.paused){
			return;
		}
		this.time+=timeStep;

		this.map.prime();

		this.director.run(timeStep);

		if(this.player.isAlive()){
			if(this.canControl){
				if(!this.pausedControl){
					this.player.face(ctrl.getMouse(disp.cam),timeStep);
					if(ctrl.mouseDown){
						this.player.shoot(this.pBullets,timeStep);
						this.player.boost(timeStep);
					}
					if(escPress||spacePress){
						this.pause();
					}
				}
			}else{
				this.player.forcePos(Vec(0,-250));
			}
		}else{
			this.gameOver();
		}
		playerHealth.data=this.player.health;
		playerMaxHealth.data=this.player.maxHealth;

		this.sounds.prime();
		runAndFilter(this.planes,a=>{
			a.prime();
			a.run(timeStep);
			a.mark(this.map,"planes");
			return a.alive;
		});
		runAndFilter(this.aliens,a=>{
			a.prime();
			a.run(timeStep);
			a.mark(this.map,"aliens");
			return a.alive;
		});
		runAndFilter(this.pBullets,a=>{
			a.prime();
			a.run(timeStep);
			a.trace(this.map,"aliens",timeStep);
			a.move(timeStep);
			a.mark(this.map,"pBullets");
			return a.alive;
		});
		runAndFilter(this.aBullets,a=>{
			a.prime();
			a.run(timeStep);
			a.trace(this.map,"planes",timeStep);
			a.move(timeStep);
			a.mark(this.map,"aBullets");
			return a.alive;
		});
		runAndFilter(this.particles,a=>{
			a.run(timeStep);
			return a.alive;
		});
		runAndFilter(this.specials,a=>{
			a.prime();
			a.mark(this.map,"specials");
			return a.alive;
		});

		this.map.collide();
		
		this.waterLine.run(timeStep);
		
		this.queuedActions.forEach(a=>a(this));
		this.queuedActions=[];
	}
	//used to run logic after the run step, this is useful if an item in array needs to add to it's own array
	//for example a plane spawning new planes
	queueAction(func){
		this.queuedActions.push(func);
	}
	bombExplode(x,y,strength,damage){
		let soundStrength=clamp(strength,1,10);
		gameRunner.sounds.bang.play(Vec(x,y),0,1/soundStrength*random(1,1.2),soundStrength/3);

		let radius=strength*50;
		let duration=10+strength*2;
		let hasTrail=radius<200;
		this.particles.push(new ExplodeParticle(
			Vec(x,y),
			Vec(0,0),
			radius,
			duration,
			hasTrail
		));
		let n=1+strength+10;
		for(let i=0;i<n;i++){
			this.particles.push(new ExplodeParticle(
				Vec(x,y).add(VecA(Math.random()*radius,Math.random()*TAU)),
				Vec(0,0),
				radius*Math.random(),
				duration+duration*Math.random(),
				hasTrail
			));
		}
		this.pBullets.push(new DamageField(Vec(x,y),damage,radius));
	}

	//#region getters
	getMapSize(){
		return this.size.cln();
	}
	getPlayer(){
		return this.player;
	}
	getTime(){
		return this.time;
	}
	offScreen(x,y,width=0){
		if(width==0){
			return x<this.screenStart.x||x>this.screenEnd.x
				||y<this.screenStart.y||y>this.screenEnd.y;
		}
		return x+width<this.screenStart.x||x-width>this.screenEnd.x
			||y<this.screenStart.y||y>this.screenEnd.y;
	}
	//#endregion
	
	//#region wrapped methods

	//#region water
	getWaterline(x){
		return this.waterLine.getLine(x);
	}
	isUnderwater(x,y){
		return this.waterLine.isUnderwater(x,y);
	}
	wave(x,y,width,strength){
		return this.waterLine.wave(x,y,width,strength);
	}
	randomWaves(timeStep){
		let strength=Math.sin(this.time/20)*50;
		this.waterLine.forceWave(this.player.pos.x-2000,0,20,strength);
		this.waterLine.forceWave(this.player.pos.x+2000,0,20,-strength);
	}
	//#endregion

	//#region effects
	splash(x,y,vX,vY,strength){
		return this.effects.splash(x,y,vX,vY,strength);
	}
	bubbles(x,y,vX,vY,strength){
		return this.effects.bubbles(x,y,vX,vY,strength);
	}
	spark(x,y,vX,vY,strength){
		return this.effects.spark(x,y,vX,vY,strength);
	}
	explode(x,y,vX,vY,strength){
		return this.effects.explode(x,y,vX,vY,strength);

	}
	wreck(x,y,vX,vY,strength){
		return this.effects.wreck(x,y,vX,vY,strength);
	}
	thrust(x,y,vX,vY,strength){
		return this.effects.thrust(x,y,vX,vY,strength);
	}
	//#endregion
	
	//#region shadow
	resetShadow(){
		return this.shadowLine.resetShadow();
	}
	shadow(x,y,width){
		return this.shadowLine.shadow(x,y,width);
	}
	//#endregion

	//#region clouds
	cloud(x,y,r,g,b,a){
		this.cloudMap.cloud(x,y,r,g,b,a);
	}
	getClouds(){
		return this.cloudMap.getClouds(this.screenStart);
	}
	//#endregion

	//#endregion

	display(disp,ctrl,renderer,background,timeStep){
		this.adjustCamera(disp,ctrl,timeStep);

		renderer.prime();
		bulletRenderer.prime();
		particleRenderer.prime();
		this.resetShadow();

		// disp.reset();
		disp.clear();
		// disp.background("#ff00ff");
		
		// this.displayGridDensity(disp,ctrl);
		// this.displayGrid(disp,ctrl);
		// this.displayCloudGrid(disp,ctrl);
		// this.displaySize(disp,ctrl);
		this.displayHitboxes(disp,ctrl,timeStep);
		// this.displayVeloHitboxes(disp,ctrl,timeStep);
		// this.displayDistanceClosest(disp,ctrl);
		// this.displayDistanceFields(disp,ctrl);
		// this.displayDistanceZeros(disp,ctrl);

		if(this.canControl&&!this.pausedControl&&!this.paused){
			this.displayUI(disp,ctrl);
			this.director.display(disp,ctrl);
		}
		
		this.planes.forEach(w=>w.display(disp,renderer));
		this.aliens.forEach(w=>w.display(disp,renderer));
		this.pBullets.forEach(w=>w.display(disp,renderer));
		this.aBullets.forEach(w=>w.display(disp,renderer));
		this.particles.forEach(w=>w.display(disp));
		// this.waterLine.waterline.forEach((w,i)=>disp.circle2(i*this.waterLine.waterSize,w,10,10));

		if(sharedTextures.isLoaded()){
			// let clouds=this.getClouds();
			if(!this.started){
				this.cloudSave=this.getClouds();
			}
			let clouds=this.cloudSave;
			this.started=this.started??true;

			sharedTextures.run(disp.cam,this.waterLine.line,this.shadowLine.line,clouds);
			// cloudPaint.run(disp.cam,clouds,this.time,this.screenStart);
			background.run(disp.cam,this.cloudSeedOffset,this.time,this.screenStart);
			// bulletRenderer.run(disp.cam,this.screenStart);
			// renderer.run(disp.cam,this.screenStart);
			// particleRenderer.run(disp.cam);
		}
	}
	adjustCamera(disp,ctrl,timeStep){
		let margin=400;
		let screenSize=disp.getSize();
		let width=screenSize.x;
		let height=screenSize.y;
		let width2=width+margin;
		let height2=height+margin;

		let minSize=1000;
		let maxSize=8000;

		if(this.canControl&&!this.pausedControl&&!this.paused){
			if(this.player.zoomType=="velo"){
				let avgVelo=this.player.velo.mag();
				this.averageZoom(clamp((avgVelo-10)/(40-10),0.2,1),timeStep);
			}else{
				this.averageZoom(clamp(ctrl.mousePosReal.cln().mag(screenSize.cln().scl(1/2))*2/mix(width,height,.5),0.2,1),timeStep);
			}
		}
		let tz=this.avgZoom;
		disp.cam.zoom=Math.max(width2,height2)/mix(minSize,maxSize,tz);
		
		disp.cam.pos=this.player.pos.cln();
		disp.cam.pos.x-=width/2/disp.cam.zoom;
		disp.cam.pos.y-=height/2/disp.cam.zoom;
		
		this.screenStart=disp.cam.pos.cln();
		this.screenEnd=screenSize.cln().div(disp.cam.zoom).add(this.screenStart);
		this.screenStart.sub(margin);
		this.screenEnd.add(margin);
	}
	resetZoom(){
		this.avgZoom=0.2;
	}
	averageZoom(val,timeStep){
		this.avgZoom=mix(this.avgZoom,val,(1/50)*timeStep);
	}

	message(text,time=2,callback=null){
		this.messageText=text;
		this.messageTime=this.time+time*60;
		this.messageCallback=callback;
	}
	displayUI(disp,ctrl){
		let screenSize=disp.getSize();
		// let hpBar=this.player.health/this.player.maxHealth;
		// disp.noStroke();
		// disp.setFill("#000");
		// disp.rect0(0,0,screenSize.x*hpBar,20);
		if(this.messageTime>this.time){
			let fontSize=30;
			disp.ctx.font=fontSize+"px 'Nunito'";
			disp.ctx.textAlign="center";
			disp.ctx.textBaseline="middle";

			let alpha=clamp((this.messageTime-this.time)/60,0,1);
			let back=rgb("#AAFF00");
			back.w=alpha*.25;
			disp.setFill(back);

			let textScale=Math.min(screenSize.x/disp.ctx.measureText(this.messageText).width,1);
			fontSize=Math.floor(textScale*fontSize);
			disp.ctx.font=fontSize+"px 'Nunito'";
			disp.ctx.fillText(this.messageText,screenSize.x/2,screenSize.y*1/4+2);
			disp.ctx.fillText(this.messageText,screenSize.x/2,screenSize.y*1/4-2);
			disp.ctx.fillText(this.messageText,screenSize.x/2-2,screenSize.y*1/4);
			disp.ctx.fillText(this.messageText,screenSize.x/2+2,screenSize.y*1/4);
			disp.setFill(rgb(0,alpha));
			disp.ctx.fillText(this.messageText,screenSize.x/2,screenSize.y*1/4);
		}else if(this.messageCallback!=null){
			this.messageCallback();
			this.messageCallback=null;
		}

		
		let mid=screenSize.cln().scl(.5);
		let mPos=ctrl.mousePosReal.cln();
		let mDir=mPos.cln().sub(mid);
		mDir.nrm(250*disp.cam.zoom);
		let ang=mDir.ang();
		
		disp.setStroke("#00000050");
		disp.noFill();
		disp.setWeight(1);

		disp.start();
		disp.arcPath0(mid.x,mid.y,250*disp.cam.zoom,ang-PI/12,ang+PI/12);
		disp.mt0(mid.x+mDir.x,mid.y+mDir.y);
		disp.lt0(ctrl.mousePosReal.x,ctrl.mousePosReal.y);
		disp.pathOpen();
		
		disp.setWeight(2);
		disp.setStroke("#000000");

		disp.start();
		disp.arcPath0(mid.x,mid.y,250*disp.cam.zoom,ang-PI/12,ang+PI/12);
		disp.pathOpen();
		disp.line0(ctrl.mousePosReal.x+5,ctrl.mousePosReal.y,ctrl.mousePosReal.x+15,ctrl.mousePosReal.y);
		disp.line0(ctrl.mousePosReal.x-5,ctrl.mousePosReal.y,ctrl.mousePosReal.x-15,ctrl.mousePosReal.y);
		disp.line0(ctrl.mousePosReal.x,ctrl.mousePosReal.y+5,ctrl.mousePosReal.x,ctrl.mousePosReal.y+20);
		disp.line0(ctrl.mousePosReal.x,ctrl.mousePosReal.y-5,ctrl.mousePosReal.x,ctrl.mousePosReal.y-20);
		disp.start();
		disp.arcPath0(ctrl.mousePosReal.x,ctrl.mousePosReal.y,10,-PI/4+PI/2,PI/4+PI/2);
		disp.pathOpen();
		disp.start();
		disp.arcPath0(ctrl.mousePosReal.x,ctrl.mousePosReal.y,10,-PI/4-PI/2,PI/4-PI/2);
		disp.pathOpen();

		disp.noStroke();
		disp.setFill("#ffffff50");

		disp.circle0(ctrl.mousePosReal.x,ctrl.mousePosReal.y,10);
	}
	displayGrid(disp,ctrl){
		disp.setStroke(rgb(0,0,0,0.1));
		let screenSize=disp.getSize();
		let screenX=screenSize.x/disp.cam.zoom;
		let screenY=screenSize.y/disp.cam.zoom;
		disp.start();
		for(let x=0;x<screenX;x+=this.map.scale){
			let offX=mod(disp.cam.pos.x,this.map.scale);
			disp.mt(x-offX+this.map.scale,0);
			disp.lt(x-offX+this.map.scale,screenY);
		}
		disp.pathOpen();
		disp.start();
		for(let y=0;y<screenY;y+=this.map.scale){
			let offY=mod(disp.cam.pos.y,this.map.scale);
			disp.mt(0,y-offY+this.map.scale);
			disp.lt(screenX,y-offY+this.map.scale);
		}
		disp.pathOpen();
	}
	displayCloudGrid(disp,ctrl){
		disp.setStroke(rgb(0,0,0,0.4));
		let screenSize=disp.getSize();
		let screenX=screenSize.x/disp.cam.zoom;
		let screenY=screenSize.y/disp.cam.zoom;
		disp.start();
		for(let x=0;x<screenX;x+=this.cloudMap.cloudSize){
			let offX=mod(disp.cam.pos.x,this.cloudMap.cloudSize);
			disp.mt(x-offX+this.cloudMap.cloudSize,0);
			disp.lt(x-offX+this.cloudMap.cloudSize,screenY);
		}
		disp.pathOpen();
		disp.start();
		for(let y=0;y<screenY;y+=this.cloudMap.cloudSize){
			let offY=mod(disp.cam.pos.y,this.cloudMap.cloudSize);
			disp.mt(0,y-offY+this.cloudMap.cloudSize);
			disp.lt(screenX,y-offY+this.cloudMap.cloudSize);
		}
		disp.pathOpen();
	}
	displaySize(disp,ctrl){
		disp.setStroke(rgb(0,0,0,1.));
		disp.noFill()
		disp.rect2(10,-10,this.size.x,-this.size.y);
	}
	displayGridDensity(disp,ctrl){
		let screenSize=disp.getSize();
		let screenX=screenSize.x/disp.cam.zoom;
		let screenY=screenSize.y/disp.cam.zoom;
		disp.start();
		for(let x=-this.map.scale;x<screenX;x+=this.map.scale){
			let offX=mod(disp.cam.pos.x,this.map.scale);
			for(let y=-this.map.scale;y<screenY;y+=this.map.scale){
				let offY=mod(disp.cam.pos.y,this.map.scale);
				let rX=x+this.map.scale+disp.cam.pos.x;
				let rY=y+this.map.scale+disp.cam.pos.y;
				let tile=this.map.getTile(
					rX,
					rY
				);
				let density=tile.getArr("planes").length+
					tile.getArr("aliens").length+
					tile.getArr("pBullets").length+
					tile.getArr("aBullets").length;
				density=density/10;
				disp.setFill(rgb(0.5,0.8,0,density));
				disp.noStroke();
				disp.rect2(rX-offX,rY-offY,this.map.scale,this.map.scale);
			}
		}
	}
	displayDistanceClosest(disp,ctrl){
		function loopColor(input,width){
			return Math.min(Math.max(
				Math.abs(input%width-width/2)*2/width
			,0),1);
		}
		let zoom=2;
		let size=200;
		let scale=2;
		let ms=ctrl.getMouse(disp.cam).sub(size/2);
		for(let x=0;x<size;x+=zoom){
			for(let y=0;y<size;y+=zoom){
				let x2=x+ms.x;
				let y2=y+ms.y;
				let arr=[];
				arr.push(...this.map.getTile(x2,y2).getArr("aliens"));
				arr.push(...this.map.getTile(x2,y2).getArr("planes"));
				arr.push(...this.map.getTile(x2,y2).getArr("aBullets"));
				arr.push(...this.map.getTile(x2,y2).getArr("pBullets"));
				let dist=Infinity;
				arr.forEach(a=>{
					dist=Math.min(a.getClosest(Vec(x2,y2)).mag([x2,y2]),dist);
				});
				if(dist==Infinity){
					continue;
				}
				dist*=scale;
				// dist=Math.abs(dist);
				disp.noStroke();
				disp.setFill(rgb(
					loopColor(dist,20),
					loopColor(dist,100),
					loopColor(dist,200),
					0.5
				));
				disp.rect2(x2-zoom/2,y2-zoom/2,zoom,zoom);
			}
		}
	}
	displayDistanceFields(disp,ctrl){
		function loopColor(input,width){
			return Math.min(Math.max(
				Math.abs(input%width-width/2)*2/width
			,0),1);
		}
		let zoom=2;
		let size=200;
		let scale=2;
		let ms=ctrl.getMouse(disp.cam).sub(size/2);
		for(let x=0;x<size;x+=zoom){
			for(let y=0;y<size;y+=zoom){
				let x2=x+ms.x;
				let y2=y+ms.y;
				let arr=[];
				arr.push(...this.map.getTile(x2,y2).getArr("aliens"));
				arr.push(...this.map.getTile(x2,y2).getArr("planes"));
				arr.push(...this.map.getTile(x2,y2).getArr("aBullets"));
				arr.push(...this.map.getTile(x2,y2).getArr("pBullets"));
				let dist=Infinity;
				arr.forEach(a=>{
					dist=Math.min(a.getDist(Vec(x2,y2)),dist);
				});
				if(dist==Infinity){
					continue;
				}
				dist*=scale;
				// dist=Math.abs(dist);
				disp.noStroke();
				disp.setFill(rgb(
					loopColor(dist,20),
					loopColor(dist,100),
					loopColor(dist,200),
					0.5
				));
				disp.rect2(x2-zoom/2,y2-zoom/2,zoom,zoom);
			}
		}
	}
	displayDistanceZeros(disp,ctrl){
		let zoom=2;
		let size=200;
		let scale=1;
		let ms=ctrl.getMouse(disp.cam).sub(size/2);
		for(let x=0;x<size;x+=zoom){
			for(let y=0;y<size;y+=zoom){
				let x2=x+ms.x;
				let y2=y+ms.y;
				let arr=[];
				arr.push(...this.map.getTile(x2,y2).getArr("aliens"));
				arr.push(...this.map.getTile(x2,y2).getArr("planes"));
				arr.push(...this.map.getTile(x2,y2).getArr("aBullets"));
				arr.push(...this.map.getTile(x2,y2).getArr("pBullets"));
				let dist=Infinity;
				arr.forEach(a=>{
					dist=Math.min(a.getDist(Vec(x2,y2)),dist);
				});
				if(dist==Infinity){
					// dist=0;
					continue;
				}
				if(Math.abs(dist)*scale<2){
					disp.setFill(rgb(1,0,0));
					disp.noStroke();
					disp.rect2(x2-zoom/2,y2-zoom/2,zoom,zoom);
				}
				// dist*=scale;
				// // dist=Math.abs(dist);
				// disp.noStroke();
				// disp.setFill(rgb(
				// 	loopColor(dist,20),
				// 	loopColor(dist,100),
				// 	loopColor(dist,200),
				// 	0.5
				// ));
				// disp.rect2(x2-zoom/2,y2-zoom/2,zoom,zoom);
			}
		}
	}
	displayHitboxes(disp,ctrl,timeStep){
		this.planes.forEach(w=>w.displayHitbox(disp));
		this.aliens.forEach(w=>w.displayHitbox(disp));
		this.pBullets.forEach(w=>w.displayHitbox(disp,timeStep));
		this.aBullets.forEach(w=>w.displayHitbox(disp,timeStep));
	}
	displayVeloHitboxes(disp,ctrl,timeStep){
		this.pBullets.forEach(w=>w.displayVeloHitbox(disp,timeStep));
		this.aBullets.forEach(w=>w.displayVeloHitbox(disp,timeStep));
	}
}