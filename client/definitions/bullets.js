class Bullet extends Entity{
	constructor(p,v,d,s,r){
		super(p,v);
		//General
		this.damage=d;
		this.size=s;
		this.range=r;
		this.age=0;

		//Water
		this.resistanceWater=0.96;
		this.buoyancy=Vec(0,0.2);
		this.waveSize=0.5;
		this.splashSize=1;
		this.bubbleMax=0;

		//Other
		this.hasTrail=true;
	}

	//#region hit detection
	/*
		█ █ █ ▀█▀   █▀▄ █▀▀ ▀█▀ █▀▀ █▀▀ ▀█▀ █ █▀█ █▄ █
		█▀█ █  █    █▄▀ ██▄  █  ██▄ █▄▄  █  █ █▄█ █ ▀█
	*/
	trace(map,arrKey,timeStep){
		let entities=new Set();
		let hb=this.getVeloHitbox(timeStep);
		let hb2=[
			hb[0].cln().div(map.scale).flr(),
			hb[1].cln().div(map.scale).ceil()
		];
		for(let x=hb2[0].x;x<hb2[1].x;x++){
			for(let y=hb2[0].y;y<hb2[1].y;y++){
				map.getTile2(x,y).getSet(arrKey).forEach(e=>{
					entities.add(e);
				});
			}
		}
		let targets=[...entities];

		let start=this.pos.cln();
		let step=0;
		let minStep=this.size/2;
		let speed=this.velo.mag()*timeStep;
		traceLoop:
		for(let d=0;d<=speed;d+=step){
			let stepV=this.velo.cln().nrm(d);
			this.pos=start.cln().add(stepV);

			// let smallest=null;
			let sDist=Infinity;
			for(let i=0;i<targets.length;i++){
				let dist=this.getDist(targets[i].getClosest(this.pos));
				if(dist<sDist){
					// smallest=targets[i];
					sDist=dist;
					if(dist<=0){
						this.hit(targets[i]);
						break traceLoop;
					}
				}
			}
			step=Math.max(sDist,minStep);
		}
		this.pos=start;
	}
	//#endregion

	//#region run
	/*
		█▀█ █ █ █▄ █
		█▀▄ █▄█ █ ▀█
	*/
	runBase(timeStep){
		super.runBase(timeStep);
		this.age+=timeStep;
		if(this.age>this.range){
			this.alive=false;
		}
	}
	runCustom(timeStep){
		if(!this.submerged&&this.hasTrail){
			let m=this.velo.mag()*timeStep;
			for(let v=0;v<m;v+=20){
				let p=this.velo.cln().nrm(v).add(this.pos);
				gameRunner.cloud(p.x,p.y,255,255,255,10);
				// this.time=(this.time??0)+1;
				// let col=hsv((this.time%100)/100,1,1).toRgb().scl(255);
				// gameRunner.cloud(p.x,p.y,col.x,col.y,col.z,255);
			}
		}
	}
	//#endregion

	//#region actions/events
	/*
		▄▀█ █▀▀ ▀█▀ █ █▀█ █▄ █ █▀  ▄▀ █▀▀ █ █ █▀▀ █▄ █ ▀█▀ █▀
		█▀█ █▄▄  █  █ █▄█ █ ▀█ ▄█ ▄▀  ██▄ ▀▄▀ ██▄ █ ▀█  █  ▄█
	*/
	hit(target){
		gameRunner.explode(this.pos.x,this.pos.y,this.velo.x,this.velo.y,this.damage/4.);
		target.hurt(this.damage,this);
		this.alive=false;
	}
	//#endregion

	//#region display
	/*
		█▀▄ █ █▀ █▀█ █   ▄▀█ █▄█
		█▄▀ █ ▄█ █▀▀ █▄▄ █▀█  █ 
	*/
	display(){
		bulletRenderer.line(this.pos.x,this.pos.y,this.size,this.velo.x,this.velo.y,this.age,
			.9,.5,.2
		);
	}
	displayHitbox(disp,timeStep){
		this.displayVeloHitbox(disp,timeStep);
	}
	displayVeloHitbox(disp,timeStep){
		let hb=this.getVeloHitbox(timeStep);
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
	getVeloHitbox(timeStep){
		let start=this.pos.cln();
		let end=this.pos.cln().add(this.velo.cln().scl(timeStep));
		let min=start.cln().min(end);
		let max=start.cln().max(end);
		min.sub(this.size);
		max.add(this.size);
		return [min,max];
	}
	//#endregion
}
//apply mixin
Object.assign(Bullet.prototype,shapeMixin.circ);

class DamageField extends Bullet{
	constructor(p,d,s,displayDamage=false,range=0){
		super(p,Vec(0,0),d,s,range);
		this.hasTrail=false;
		this.displayDamage=displayDamage;
		this.buoyancy=Vec(0,0);
	}
	trace(map,arrKey,timeStep){
		let entities=new Set();
		let hb=this.getVeloHitbox(timeStep);
		let hb2=[
			hb[0].cln().div(map.scale).flr(),
			hb[1].cln().div(map.scale).ceil()
		];
		for(let x=hb2[0].x;x<hb2[1].x;x++){
			for(let y=hb2[0].y;y<hb2[1].y;y++){
				map.getTile2(x,y).getSet(arrKey).forEach(e=>{
					entities.add(e);
				});
			}
		}
		let targets=[...entities];
		for(let i=0;i<targets.length;i++){
			let dist=this.getDist(targets[i].getClosest(this.pos));
				if(dist<=0){
					this.hit(targets[i]);
				}
		}
	}
	hit(target){
		target.hurt(this.damage,this);
		if(this.displayDamage){
			gameRunner.spark(this.pos.x,this.pos.y,0,0,0);
			// gameRunner.explode(this.pos.x,this.pos.y,this.velo.x,this.velo.y,this.damage/10.);
		}
	}
	display(){
	}
}
class Rainbow extends DamageField{
	constructor(p,d,s,range,angle,spawnTime){
		super(p,d,s,false,range);
		this.angle=angle;
		this.spawnTime=spawnTime;
	}
	displaySpecial(disp,offsetDist){
		let p=VecA(offsetDist,this.angle).add(this.pos);
		disp.lt2(p.x,p.y);
	}
}
class Bomb extends Bullet{
	constructor(p,v,d,s,r){
		super(p,v,d,s,r);
		this.gravity=Vec(0,1);
		this.resistanceWater=0.93;
		this.buoyancy=Vec(0,-0.2);

		this.waveSize=0.25;
		this.splashSize=0.5;

		this.texSize=Vec(13,7);
		this.texPos=Vec(18,168);
		this.displaySize=Vec(1,this.texSize.y/this.texSize.x).scl(s).scl(2);
		this.hasTrail=false;
	}
	runCustom(timeStep){
		this.velo.add(this.gravity.cln().scl(timeStep));
	}
	hit(target){
		gameRunner.bombExplode(this.pos.x,this.pos.y,1,this.damage);
		target.hurt(this.damage,this);
		this.alive=false;
	}
	display(disp){
		renderer.img(
			this.pos.x,this.pos.y,
			this.displaySize.x,this.displaySize.y,
			this.velo.ang(),
			this.texPos.x,
			this.texPos.y,
			this.texSize.x,
			this.texSize.y,
			false);
	}
}
class FlowerPot extends Bomb{
	constructor(p,v,d,s,r){
		super(p,v,d,s,r);
		this.gravity=Vec(0,0.5);
		this.resistanceWater=0.93;
		this.buoyancy=Vec(0,-0.3);
		
		this.waveSize=0.5;
		this.splashSize=1;

		this.flowerSize=Vec(7,8).scl(2);
		let flowerIdx=Math.floor(Math.random()*6);
		switch(flowerIdx){
			case 0:
				this.flowerTexSize=Vec(7,8);
				this.flowerTexPos=Vec(42,171);
				break;
			case 1:
				this.flowerTexSize=Vec(7,8);
				this.flowerTexPos=Vec(50,171);
				break;
			case 2:
				this.flowerTexSize=Vec(5,8);
				this.flowerTexPos=Vec(58,171);
				break;
			case 3:
				this.flowerTexSize=Vec(9,8);
				this.flowerTexPos=Vec(64,171);
				break;
			case 4:
				this.flowerTexSize=Vec(12,8);
				this.flowerTexPos=Vec(74,171);
				break;
			case 5:
				this.flowerTexSize=Vec(2,8);
				this.flowerTexPos=Vec(87,171);
				break;
		}

		this.texSize=Vec(9,8);
		this.texPos=Vec(32,167);
		
		let scale=s/this.texSize.x;

		this.flowerSize=this.flowerTexSize.cln().scl(scale).scl(2);
		this.displaySize=Vec(9,8).scl(scale).scl(2);
	}
	hit(target){
		target.hurt(this.damage,this);
		this.alive=false;
	}
	display(disp){
		renderer.img(
			this.pos.x,this.pos.y,
			this.displaySize.x,this.displaySize.y,
			this.velo.ang()-PI/2,
			this.texPos.x,
			this.texPos.y,
			this.texSize.x,
			this.texSize.y,
			false);
		renderer.img(
			this.pos.x,this.pos.y,
			this.flowerSize.x,this.flowerSize.y,
			this.velo.ang()-PI/2,
			this.flowerTexPos.x,
			this.flowerTexPos.y,
			this.flowerTexSize.x,
			this.flowerTexSize.y,
			false,
			0,-this.flowerSize.y);
	}
}
class BigBomb extends Bomb{
	constructor(p,v,d,s,r){
		super(p,v,d,s,r);
		this.gravity=Vec(0,1);
		this.resistanceWater=0.93;
		this.buoyancy=Vec(0,-0.1);
		
		this.waveSize=0.5;
		this.splashSize=1;

		this.texSize=Vec(20,9);
		this.texPos=Vec(23,147);
		this.displaySize=Vec(1,this.texSize.y/this.texSize.x).scl(s).scl(2);
	}
	hit(target){
		gameRunner.bombExplode(this.pos.x,this.pos.y,3,this.damage);
		target.hurt(this.damage,this);
		this.alive=false;
	}
}
class HugeBomb extends Bomb{
	constructor(p,v,d,s,r){
		super(p,v,d,s,r);
		this.gravity=Vec(0,1);
		this.resistanceWater=0.93;
		this.buoyancy=Vec(0,0);

		this.waveSize=1;
		this.splashSize=1.25;

		this.texSize=Vec(45,11);
		this.texPos=Vec(44,147);
		this.displaySize=Vec(1,this.texSize.y/this.texSize.x).scl(s).scl(2);
	}
	hit(target){
		gameRunner.bombExplode(this.pos.x,this.pos.y,5,this.damage);
		target.hurt(this.damage,this);
		this.alive=false;
	}
}
class Nuke extends Bomb{
	constructor(p,v,d,s,r){
		super(p,v,d,s,r);
		this.gravity=Vec(0,1);
		this.resistanceWater=0.93;
		this.buoyancy=Vec(0,0);

		this.waveSize=2;
		this.splashSize=1.5;

		this.texSize=Vec(76,39);
		this.texPos=Vec(193,293);
		this.displaySize=Vec(1,this.texSize.y/this.texSize.x).scl(s).scl(2);
	}
	hit(target){
		gameRunner.bombExplode(this.pos.x,this.pos.y,20,this.damage);
		target.hurt(this.damage,this);
		this.alive=false;
	}
}
class BulletNuke extends Bullet{
	constructor(p,v,d,s,r){
		super(p,v,d,s,r);
	}
	hit(target){
		gameRunner.bombExplode(this.pos.x,this.pos.y,20,this.damage);
		target.hurt(this.damage,this);
		this.alive=false;
	}
}
class BulletLite extends Bullet{
	constructor(p,v,d,s,r){
		super(p,v,d,s,r);
		this.waveSize=0.2;
		this.splashSize=1;
	}
}
class BulletExtraLite extends Bullet{
	constructor(p,v,d,s,r){
		super(p,v,d,s,r);
		this.waveSize=0.01;
		this.splashSize=0;
	}
}
class AlienBullet extends Bullet{
	constructor(p,v,d,s,r){
		super(p,v,d,s,r);
		this.waveSize=0.1;
		this.splashSize=1;
		this.hasTrail=false;
	}
	display(){
		bulletRenderer.line(this.pos.x,this.pos.y,this.size,this.velo.x,this.velo.y,this.age,
			.3,.6,.1
		);
	}
}
class AlienBulletHeavy extends Bullet{
	constructor(p,v,d,s,r){
		super(p,v,d,s,r);
		this.waveSize=1;
		this.splashSize=2;
		this.hasTrail=false;
	}
	display(){
		bulletRenderer.line(this.pos.x,this.pos.y,this.size,this.velo.x,this.velo.y,this.age,
			.3,.6,.1
		);
	}
}