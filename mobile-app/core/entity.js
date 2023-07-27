class EntityBase{
	constructor(p,v){
		this.pos=p.cln();
		this.velo=v?.cln()??Vec(0,0);
		this.alive=true;
	}
	isAlive(){
		return this.alive;
	}
}
class Entity extends EntityBase{
	constructor(p,v){
		super(p,v);
		//General
		this.angle=0;
		this.health=1;
		
		//Hit Detection
		this.hits=null;
		this.prime();
		this.hitbox=null;
		
		//Water
		this.submerged=true;//start by assuming it is underwater, otherwise it will splash if it spawns underwater
		this.bubbling=false;//TODO: double check time limit works
		this.resistanceWater=0.96;
		this.buoyancy=Vec(0,0.2);
		this.waveSize=0.5;
		this.splashSize=1;
		this.hasBubbles=true;
		this.bubbleTime=0;
		this.bubbleMax=40;
		
		//Display
		this.texPos=Vec(568,1);
		this.texSize=Vec(78,86);
		this.displaySize=Vec(78,86).scl(2);
		this.displayOffset=Vec(25,0);
	}
	init(){
		this.calcHitbox();
		return this;
	}

	//#region hit detection
	/*
		█ █ █ ▀█▀   █▀▄ █▀▀ ▀█▀ █▀▀ █▀▀ ▀█▀ █ █▀█ █▄ █
		█▀█ █  █    █▄▀ ██▄  █  ██▄ █▄▄  █  █ █▄█ █ ▀█
	*/
	prime(){
		this.hits=new Set([this]);
	}
	mark(map,arrKey){
		let hb=this.getHitbox();
		let hb2=[
			hb[0].cln().div(map.scale).flr(),
			hb[1].cln().div(map.scale).ceil()
		];
		for(let x=hb2[0].x;x<hb2[1].x;x++){
			for(let y=hb2[0].y;y<hb2[1].y;y++){
				map.mark(x,y,this,arrKey);
			}
		}
	}
	tryHit(target,symmetrical,special){
		if(!this.alive)
			return;
		if(!this.hits.has(target)){
			this.hits.add(target);
			if(aabb(target.getHitbox(this.pos),this.getHitbox())){
				if(this.getDist(target.getClosest(this.pos))<0
					||target.getDist(this.getClosest(target.pos))<0){
					this.hit(target,special);
					if(symmetrical){
						target.assertHit(this,special);
					}
				}
			}
		}
	}
	assertHit(target,special){
		this.hits.add(target);
		this.hit(target,special);
	}
	//#endregion

	//#region shape description
	/*
		█▀ █ █ ▄▀█ █▀█ █▀▀   █▀▄ █▀▀ █▀ █▀▀ █▀█ █ █▀█ ▀█▀ █ █▀█ █▄ █
		▄█ █▀█ █▀█ █▀▀ ██▄   █▄▀ ██▄ ▄█ █▄▄ █▀▄ █ █▀▀  █  █ █▄█ █ ▀█
	*/
	getClosest(vec,loop=true){
		throw new Error('getClosest() has no implementation');
	}
	getDist(vec,loop=true){
		return this.getClosest(vec,loop).mag(vec);
	}
	calcHitbox(){
		let far=1000000;
		let px=this.getClosest(Vec(far,0).add(this.pos),false);
		let nx=this.getClosest(Vec(-far,0).add(this.pos),false);
		let py=this.getClosest(Vec(0,far).add(this.pos),false);
		let ny=this.getClosest(Vec(0,-far).add(this.pos),false);
		let min=Vec(nx.x,ny.y);
		let max=Vec(px.x,py.y);
		this.hitbox=[min,max];
	}
	//#endregion

	//#region run
	/*
		█▀█ █ █ █▄ █
		█▀▄ █▄█ █ ▀█
	*/
	run(timeStep){
		this.runBase(timeStep);
		this.runWater(timeStep);
		this.runCustom(timeStep);
	}
	runBase(timeStep){
		if(this.alive){
			this.alive=this.health>0;
			if(!this.alive){
				this.die();
			}
		}
	}
	runWater(timeStep){
		if(gameRunner.isUnderwater(this.pos.x,this.pos.y)){
			let slowed=this.velo.cln();
			this.velo.scl(this.resistanceWater**timeStep);
			slowed.sub(this.velo);
			let strength=slowed.mag();
			gameRunner.wave(this.pos.x,this.pos.y,100,Math.min(strength*this.waveSize,5));
			if(!this.submerged){
				let splash=Math.min(strength*this.splashSize,10);
				gameRunner.splash(this.pos.x,this.pos.y,slowed.x/timeStep,slowed.y/timeStep,splash/timeStep);
			}
			this.submerged=true;
			this.velo.add(this.buoyancy.cln().scl(timeStep));
		
			if(this.hasBubbles){
				if(this.bubbling&&strength>0.3&&this.bubbleTime<this.bubbleMax){
					this.bubbleTime++;
					gameRunner.bubbles(this.pos.x,this.pos.y,0,0,
						(strength-0.5)*10*(1-this.bubbleTime/this.bubbleMax)
					);
				}else{
					this.bubbleTime=0;
					this.bubbling=false;
				}
			}
		}else{
			this.bubbling=true;
			this.submerged=false;
		}
	}
	runCustom(){
	}
	runSpecial(arrays){
	}
	move(timeStep){
		this.pos.add(this.velo.cln().scl(timeStep));
		this.calcHitbox();
	}
	//#endregion

	//#region actions/events
	/*
		▄▀█ █▀▀ ▀█▀ █ █▀█ █▄ █ █▀  ▄▀ █▀▀ █ █ █▀▀ █▄ █ ▀█▀ █▀
		█▀█ █▄▄  █  █ █▄█ █ ▀█ ▄█ ▄▀  ██▄ ▀▄▀ ██▄ █ ▀█  █  ▄█
	*/
	shove(toShove){
		this.velo.add(toShove);
	}
	hit(target,special){
	}
	hurt(damage,damager){
		this.health-=damage;
	}
	die(){
	}
	forcePos(p){
		this.pos=p.cln();
		this.velo=Vec(0,0);
	}
	//#endregion

	//#region display
	/*
		█▀▄ █ █▀ █▀█ █   ▄▀█ █▄█
		█▄▀ █ ▄█ █▀▀ █▄▄ █▀█  █ 
	*/
	display(){
		let flip=nrmAngPI(this.angle+PI/2)<0;
		renderer.img(
			this.pos.x,this.pos.y,
			this.displaySize.x,this.displaySize.y,
			this.angle,
			this.texPos.x,
			this.texPos.y,
			this.texSize.x,
			this.texSize.y,
			flip,
			this.displayOffset.x,
			this.displayOffset.y);
		let hb=this.getHitbox();
		gameRunner.shadow(this.pos.x,this.pos.y,(hb[1].x-hb[0].x)/2);
	}
	displayHitbox(disp){
		let hb=this.getHitbox();
		disp.setStroke("#101010");
		disp.noFill();
		disp.rect2(hb[0].x,hb[0].y,hb[1].x-hb[0].x,hb[1].y-hb[0].y);
	}
	//#endregion

	//#region getters
	/*
		█▀▀ █▀▀ ▀█▀ ▀█▀ █▀▀ █▀█ █▀
		█▄█ ██▄  █   █  ██▄ █▀▄ ▄█
	*/
	getPos(refPos){
		if(refPos==null)
			return this.pos.cln();
		return loopVec(this.pos,refPos);
	}
	getHitbox(refPos){
		if(refPos==null)
			return this.hitbox;
		let loopOffset=loopVec(this.pos,refPos).sub(this.pos);
		return this.hitbox.map(a=>a.cln().add(loopOffset));
	}
	getVelo(){
		return this.velo.cln();
	}
	getAng(){
		return this.angle;
	}
	getSize(){
		//this isn't the cleanest but it will suffice
		if(this.size==null){
			return Vec(0,0);
		}else if(this.size instanceof Vector){
			return this.size.cln();
		}else{
			return Vec(this.size,0);
		}
	}
	//#endregion
}