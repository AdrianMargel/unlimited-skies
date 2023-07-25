//#region spawner
class Spawner extends Entity{
	constructor(trigger,p,s,time){
		super(p);

		this.trigger=trigger;
		this.spawnMax=time;
		this.spawnTime=this.spawnMax;

		this.scale=s;
		this.arrowSize=Vec(19,32).scl(s*2);
		this.arrowTexPos=Vec(504,131);
		this.arrowTexSize=Vec(19,32);

		this.barSize=Vec(12,10).scl(s*2);
		this.barTexPos=Vec(524,131);
		this.barTexSize=Vec(12,10);

		this.size=Vec(1,1);
		this.offset=Vec(0,0);
	}
	getClosest(vec){
		//make this unhittable by returning a far away point
		return Vec(0,1000000);
	}
	calcHitbox(){
		let min=this.pos.cln();
		let max=this.pos.cln();
		min.sub(this.size);
		max.add(this.size);
		this.hitbox=[min,max];
	}
	runBase(timeStep){
		this.spawnTime-=timeStep;
		if(this.spawnTime<=0){
			this.alive=false;
			this.die();
		}
	}
	die(){
		this.trigger(this.pos);
	}
	display(){
		let baseDist=40;
		let bars=Math.ceil(this.spawnMax/100);
		let barDist=baseDist*bars*this.scale;
		let barGap=baseDist*this.scale;
		let arrowOff1=this.spawnTime/this.spawnMax*barDist;
		let arrowOff2=this.spawnTime/this.spawnMax*baseDist;

		if(bars>1){
			for(let i=0;i<bars;i++){
				let barOff=(this.spawnTime+i*barGap)%barDist;
				barOff=clamp(barOff,barGap,barDist-barGap);
				renderer.img(
					this.pos.x,this.pos.y,
					this.barSize.x,this.barSize.y,
					PI/2,
					this.barTexPos.x,
					this.barTexPos.y,
					this.barTexSize.x,
					this.barTexSize.y,
					false,
					-this.barSize.x/2-barOff,-this.barSize.y/2-4);
				
				renderer.img(
					this.pos.x,this.pos.y,
					this.barSize.x,this.barSize.y,
					PI/2,
					this.barTexPos.x,
					this.barTexPos.y,
					this.barTexSize.x,
					this.barTexSize.y,
					true,
					-this.barSize.x/2-barOff,-this.barSize.y/2-4);

					renderer.img(
						this.pos.x,this.pos.y,
						this.barSize.x,this.barSize.y,
						-PI/2,
						this.barTexPos.x,
						this.barTexPos.y,
						this.barTexSize.x,
						this.barTexSize.y,
						false,
						-this.barSize.x/2-barOff,-this.barSize.y/2-4);
					
					renderer.img(
						this.pos.x,this.pos.y,
						this.barSize.x,this.barSize.y,
						-PI/2,
						this.barTexPos.x,
						this.barTexPos.y,
						this.barTexSize.x,
						this.barTexSize.y,
						true,
						-this.barSize.x/2-barOff,-this.barSize.y/2-4);
			}
		}
		
		renderer.img(
			this.pos.x,this.pos.y,
			this.arrowSize.x,this.arrowSize.y,
			PI/2,
			this.arrowTexPos.x,
			this.arrowTexPos.y,
			this.arrowTexSize.x,
			this.arrowTexSize.y,
			false,
			-this.arrowSize.x/2-arrowOff1,0);
		
		renderer.img(
			this.pos.x,this.pos.y,
			this.arrowSize.x,this.arrowSize.y,
			-PI/2,
			this.arrowTexPos.x,
			this.arrowTexPos.y,
			this.arrowTexSize.x,
			this.arrowTexSize.y,
			false,
			-this.arrowSize.x/2-arrowOff1,0);
			
		renderer.img(
			this.pos.x,this.pos.y,
			this.arrowSize.x,this.arrowSize.y,
			0,
			this.arrowTexPos.x,
			this.arrowTexPos.y,
			this.arrowTexSize.x,
			this.arrowTexSize.y,
			false,
			-this.arrowSize.x/2-arrowOff2,0);
		
		renderer.img(
			this.pos.x,this.pos.y,
			this.arrowSize.x,this.arrowSize.y,
			PI,
			this.arrowTexPos.x,
			this.arrowTexPos.y,
			this.arrowTexSize.x,
			this.arrowTexSize.y,
			false,
			-this.arrowSize.x/2-arrowOff2,0);
	}
}

//#endregion

class Alien extends Entity{
	constructor(p,a){
		super(p);

		//General
		this.angle=a;
		this.pushSpeed=1;

		//Movement
		//Thrust
		this.speed=1;
		//Agility
		this.agility=0.1;
		//Flight
		this.resistance=0.95;
		//Water
		this.resistanceWater=0.9;
		this.buoyancy=Vec(0,0);
		this.splashSize=2;
		this.waveSize=1;

		//Firing
		this.cooldownMax=100;
		this.cooldown=0;
		this.bulletSpeed=30;
		this.bulletSize=8;
		this.bulletDamage=1;
		this.bulletRange=50;
		this.accuracy=0.05;

		//Display
		this.texPos=Vec(324,1);
		this.texSize=Vec(56,102);
		this.size=null;
		this.displaySize=null;
		this.offset=Vec(0,0);
		this.displayOffset=this.offset.cln();

		this.hasBubbles=false;
		this.scaleHealth=true;

		this.head=null;
	}
	init(){
		if(this.scaleHealth){
			this.maxHealth*=gameRunner.alienHealthScale;
			this.health*=gameRunner.alienHealthScale;
		}
		this.randomizeCooldown();
		return super.init();
	}
	start(){
		
	}
	kill(){
		this.health=0;
	}
	randomizeCooldown(){
		this.cooldown=Math.floor(Math.random()*this.cooldownMax);
	}
	setHead(head){
		this.head=head;
	}
	hit(target){
		let diff=this.pos.cln().sub(target.getPos(this.pos));
		let mag=diff.mag()/this.getSize().add(target.getSize()).mag();
		let push=Math.max(1-mag,0);
		this.velo.add(
			diff.nrm(push).scl(this.pushSpeed)
		);
		if(this.head!=null){
			this.head.hit(target);
		}
	}
	die(){
		gameRunner.wreck(this.pos.x,this.pos.y,this.velo.x,this.velo.y,5);
		gameRunner.sounds.bang.play(this.pos,0,5/5*random(1,1.2));
		if(this.head!=null){
			this.head.die();
		}
	}
	runCustom(timeStep){
		super.runCustom(timeStep);
		this.velo.scl(this.resistance**timeStep);

		if(this.cooldown>0){
			this.cooldown-=timeStep;
		}

		this.move(timeStep);
	}
	dryFire(){
		//used to prevent cooldown sync for large swarms
		if(this.cooldown<=0){
			this.cooldown=this.cooldownMax;
		}
	}
	shoot(bulletsArr,timeStep){
		if(this.cooldown<=0){
			let ra=(Math.random()-0.5)*2*this.accuracy;
			let s=this.bulletSpeed;
			let pVelo=VecA(s,this.angle+ra);
			pVelo.add(this.velo);
			let pPos=VecA(this.getSize().x/2.,this.angle);
			pPos.add(this.pos);
			bulletsArr.push(new AlienBullet(pPos,pVelo,this.bulletDamage,this.bulletSize,this.bulletRange));
			this.cooldown=this.cooldownMax;
			gameRunner.sounds.laser.play(this.pos,0,1*random(1,1.2));
		}
	}

	moveTo(target,timeStep,keepVelo=false){
		if(keepVelo){
			this.velo.add(target.cln().sub(this.pos).lim(this.speed).scl(timeStep));
		}else{
			this.velo.add(target.cln().sub(this.velo).sub(this.pos).lim(this.speed).scl(timeStep));
		}
	}
	face(target,timeStep){
		let ang=this.pos.ang(target);
		this.faceAng(ang,timeStep);
	}
	faceAng(ang,timeStep){
		this.angle+=clamp(
			nrmAngPI(ang-this.angle),-this.agility*timeStep,this.agility*timeStep);
	}
	boost(timeStep){
		this.velo.add(VecA(this.speed*timeStep,this.angle));
		this.boostEffect(this.speed,timeStep);
	}
	boostEffect(strength,timeStep){
	}
}
//apply mixin
Object.assign(Alien.prototype,shapeMixin.rect);

//#region aliens
class Shield extends Alien{
	constructor(p,a){
		super(p,a);

		this.maxHealth=2;
		this.health=this.maxHealth;

		this.size=Vec(56,102).scl(2);
		this.displaySize=this.size.cln();
		this.texPos=Vec(377,1);
		this.texSize=Vec(56,102);

		this.speed=0.8;
		this.agility=0.03;
		this.shieldTime=0;
		this.shieldTimeMax=10;

		this.pushSpeed=1;

		this.color=new Color("AAFF0000");
	}
	runCustom(timeStep){
		super.runCustom(timeStep);
		if(this.shieldTime>0){
			this.shieldTime-=timeStep;
			this.color.w=this.shieldTime/this.shieldTimeMax;
		}
	}
	hurt(damage,damager){
		if(Math.abs(nrmAngPI(damager.getPos(this.pos).ang(this.pos)-this.angle))>PI/2){
			this.shieldTime=this.shieldTimeMax;
		}else{
			this.health-=damage;
		}
	}
	shoot(){
	}
	display(disp,renderer){
		let flip=nrmAngPI(this.angle+PI/2)<0;
		renderer.img(
			this.pos.x,this.pos.y,
			this.size.x,this.size.y,
			this.angle,
			this.texPos.x,
			this.texPos.y,
			this.texSize.x,
			this.texSize.y,
			flip);

		if(this.shieldTime>0){
			let p=VecA(-this.size.x+5,this.angle).add(this.getPos(gameRunner.getPlayer().getPos()));
			let a=0.85;
			disp.noStroke();
			disp.setFill(this.color);
			disp.start();
			disp.arc2(p.x,p.y,
				this.size.x*1.5,this.angle-a,this.angle+a);
			disp.shape();
		}
		gameRunner.shadow(this.pos.x,this.pos.y,(this.hitbox[1].x-this.hitbox[0].x)/2);
	}
}
class Swarmer extends Alien{
	constructor(p,a){
		super(p,a);

		this.maxHealth=2;
		this.health=this.maxHealth;

		this.size=Vec(30,17).scl(2);
		this.displaySize=this.size.cln();
		this.texPos=Vec(336,1);
		this.texSize=Vec(30,17);

		this.speed=10;
		this.pushSpeed=3;
		this.agility=0.1;
		this.resistance=0.8;
		this.resistanceWater=0.8;

		this.splashSize=.5;
		this.waveSize=0.1;

		this.cooldownMax=10;
		this.cooldown=0;
		this.damage=1;
	}
	runSpecial(arrays){
		let a2=arrays["planes"];
		for(let j=0;j<a2.length;j++){
			this.tryHit(a2[j],false,true);
		}
	}
	hit(target,special){
		if(special){
			if(this.cooldown<=0){
				gameRunner.spark(this.pos.x,this.pos.y,this.velo.x/3,this.velo.y/3,0);
				target.hurt(this.damage,this);
				this.cooldown=this.cooldownMax;
			}
		}else{
			super.hit(target);
		}
	}
	die(){
		gameRunner.wreck(this.pos.x,this.pos.y,this.velo.x,this.velo.y,2);
		gameRunner.sounds.bang.play(this.pos,0,5/2*random(1,1.2));
		if(this.head!=null){
			this.head.die();
		}
	}
	shoot(){
	}
}
class Dart extends Alien{
	constructor(p,a){
		super(p,a);

		this.maxHealth=3;
		this.health=this.maxHealth;

		this.size=Vec(40,35).scl(2);
		this.displaySize=this.size.cln();
		this.texPos=Vec(336,37);
		this.texSize=Vec(40,35);
		
		this.cooldownMax=50;

		this.speed=0.5;
		this.resistance=0.99;
		this.agility=0.1;
		this.pushSpeed=2;

		this.splashSize=2;
		this.waveSize=1;
	}
}
class Arrow extends Alien{
	constructor(p,a){
		super(p,a);

		this.maxHealth=5;
		this.health=this.maxHealth;

		this.size=Vec(73,63).scl(2);
		this.displaySize=this.size.cln();
		this.texPos=Vec(434,1);
		this.texSize=Vec(73,63);

		this.speed=0.8;
		this.resistance=0.99;
		this.agility=0.05;
		this.pushSpeed=2;

		this.cooldownMax=75;
		this.bulletSpeed=40;

		this.splashSize=2;
		this.waveSize=1;
	}
	shoot(bulletsArr){
		if(this.cooldown<=0){
			let ra=(Math.random()-0.5)*2*this.accuracy;
			let s=this.bulletSpeed;
			{
				let pVelo=VecA(s,this.angle+ra);
				pVelo.add(this.velo);
				let pPos=Vec(this.size.x/2-20,14);
				if(Math.cos(this.angle)<0)
					pPos.y*=-1;
				pPos.rot(this.angle);
				pPos.add(this.pos);
				bulletsArr.push(new AlienBullet(pPos,pVelo,this.bulletDamage,this.bulletSize,this.bulletRange));
			}
			{
				let pVelo=VecA(s,this.angle+ra);
				pVelo.add(this.velo);
				let pPos=Vec(this.size.x/2-20,-14);
				if(Math.cos(this.angle)<0)
					pPos.y*=-1;
				pPos.rot(this.angle);
				pPos.add(this.pos);
				bulletsArr.push(new AlienBullet(pPos,pVelo,this.bulletDamage,this.bulletSize,this.bulletRange));
			}
			this.cooldown=this.cooldownMax;
			gameRunner.sounds.laser.play(this.pos,0,.6*random(1,1.2));
		}
	}
}
class Shell extends Alien{
	constructor(p,a){
		super(p,a);

		this.maxHealth=8;
		this.health=this.maxHealth;

		this.size=Vec(59,64).scl(2);
		this.displaySize=Vec(59,64).scl(2);
		this.texPos=Vec(508,1);
		this.texSize=Vec(59,64);

		this.speed=0.3;
		this.resistance=0.99;
		this.agility=0.05;
		this.pushSpeed=2;
		this.cooldownMax=100;

		this.splashSize=2;
		this.waveSize=1;
	}
}
class Sniper extends Alien{
	constructor(p,a){
		super(p,a);

		this.maxHealth=5;
		this.health=this.maxHealth;

		this.size=Vec(53,86).scl(2);
		this.displaySize=Vec(78,86).scl(2);
		this.texPos=Vec(568,1);
		this.texSize=Vec(78,86);
		this.displayOffset=Vec(25,0);

		this.speed=0.5;
		this.pushSpeed=0.5;
		
		this.cooldownMax=150;
		this.bulletSpeed=50;
		this.bulletSize=12;
		this.bulletDamage=5;
		this.bulletRange=75;
		this.accuracy=0.05;
	}
}
class StarGunner extends Alien{
	constructor(p,a){
		super(p,a);

		this.maxHealth=3;
		this.health=this.maxHealth;

		this.texPos=Vec(434,129);
		this.texSize=Vec(69,50);
		this.size=Vec(69,50).scl(2);
		this.displaySize=this.size.cln();
		this.offset=Vec(0,0);
		this.displayOffset=Vec(0,0);

		this.speed=0.5;
		this.pushSpeed=0.5;
		this.agility=0.2;

		this.cooldownMax1=200;
		this.bulletSpeed1=100;
		this.bulletSize1=8;
		this.bulletDamage1=1;
		this.bulletRange1=50;
		this.accuracy1=0.05;

		this.cooldownMax2=5;
		this.bulletSpeed2=50;
		this.bulletSize2=16;
		this.bulletDamage2=2;
		this.bulletRange2=30;
		this.accuracy2=0.2;
		this.kickBack=10;

		this.setMode(true);
	}
	setMode(isForward){
		if(this.isForward==isForward){
			return;
		}
		this.isForward=isForward;
		if(this.isForward){
			this.cooldownMax=this.cooldownMax1;
			this.cooldown=Math.floor(Math.random()*this.cooldownMax);
			this.bulletSpeed=this.bulletSpeed1;
			this.bulletSize=this.bulletSize1;
			this.bulletDamage=this.bulletDamage1;
			this.bulletRange=this.bulletRange1;
			this.accuracy=this.accuracy1;
		}else{
			this.cooldownMax=this.cooldownMax2;
			this.cooldown=Math.floor(Math.random()*this.cooldownMax);
			this.bulletSpeed=this.bulletSpeed2;
			this.bulletSize=this.bulletSize2;
			this.bulletDamage=this.bulletDamage2;
			this.bulletRange=this.bulletRange2;
			this.accuracy=this.accuracy2;
		}
	}
	shoot(bulletsArr){
		if(this.cooldown<=0){
			let ra=(Math.random()-0.5)*2*this.accuracy;
			let s=this.bulletSpeed;
			let pVelo;
			if(this.isForward){
				pVelo=VecA(s,this.angle+ra);
				gameRunner.sounds.laser.play(this.pos,0,1.5*random(1,1.2));
			}else{
				pVelo=VecA(s,this.angle+ra+PI);
				this.shove(pVelo.cln().nrm(-this.kickBack));
				gameRunner.sounds.laser.play(this.pos,0,1*random(1,1.2));
			}
			pVelo.add(this.velo);
			let pPos=VecA(0,0);
			pPos.add(this.pos);
			bulletsArr.push(new AlienBullet(pPos,pVelo,this.bulletDamage,this.bulletSize,this.bulletRange));

			this.cooldown=this.cooldownMax;
		}
	}
	faceAng(ang,timeStep){
		if(this.isForward){
			this.angle+=clamp(
				nrmAngPI(ang-this.angle),-this.agility*timeStep,this.agility*timeStep);
		}else{
			this.angle+=clamp(
				nrmAngPI(ang-this.angle-PI),-this.agility*timeStep,this.agility*timeStep);
		}
	}
}
class Wrecker extends Alien{
	constructor(p,a){
		super(p,a);

		this.maxHealth=8;
		this.health=this.maxHealth;

		this.size=62;
		this.displaySize=Vec(62,62).scl(2);
		this.texPos=Vec(647,1);
		this.texSize=Vec(62,62);
		
		this.blade1Size=Vec(16,54).scl(2);
		this.blade1TexPos=Vec(710,1);
		this.blade1TexSize=Vec(16,54);
		this.blade1Offset=Vec(0,-42).scl(2);
		this.blade1Angle=PI/2;

		this.blade2Size=Vec(16,39).scl(2);
		this.blade2TexPos=Vec(727,1);
		this.blade2TexSize=Vec(16,39);
		this.blade2Offset=Vec(0,34).scl(2);
		this.blade2Angle=PI/2;

		this.faceSize=Vec(14,14).scl(2);
		this.faceTexPos=Vec(728,81);
		this.faceTexSize=Vec(14,14);
		this.facePos=Vec(0,0);

		this.speed=0.5;
		this.resistance=0.99;
		this.pushSpeed=0.5;
		this.agility=0.02;
		
		this.cooldownMax=0;
		this.cooldown=0;

		this.damage=1;
		this.spin=0;
	}
	shoot(){
	}
	runSpecial(arrays){
		let a2=arrays["planes"];
		for(let j=0;j<a2.length;j++){
			this.tryHit(a2[j],false,true);
		}
	}
	hit(target,special){
		if(special){
			if(this.cooldown<=0){
				let sparkP=target.getPos(this.pos).sub(this.pos).nrm(this.size/2).add(this.pos);
				gameRunner.spark(sparkP.x,sparkP.y,0,0,0);
				target.hurt(this.damage,this);
				this.cooldown=this.cooldownMax;
			}
		}else{
			super.hit(target);
		}
		let shoveDir=target.getPos(this.pos).sub(this.pos).nrm(this.spin*5);
		target.shove(shoveDir);
	}
	faceAng(ang,timeStep){
		let look=VecA(15,ang);
		this.facePos=look.sub(this.facePos).lim(1*timeStep).add(this.facePos);
		super.faceAng(ang,timeStep);
	}
	runCustom(timeStep){
		super.runCustom(timeStep);
		this.spin=this.velo.mag()/50+1;
		this.blade1Angle+=this.spin/TAU*timeStep;
		this.blade2Angle-=this.spin*0.75/TAU*timeStep;
	}
	die(){
		gameRunner.wreck(this.pos.x,this.pos.y,this.velo.x,this.velo.y,8);
		gameRunner.sounds.bang.play(this.pos,0,5/8*random(1,1.2));
		if(this.head!=null){
			this.head.die();
		}
	}
	display(disp,renderer){
		renderer.img(
			this.pos.x,this.pos.y,
			this.displaySize.x,this.displaySize.y,
			this.angle,
			this.texPos.x,
			this.texPos.y,
			this.texSize.x,
			this.texSize.y,
			false);
		
		renderer.img(
			this.pos.x,this.pos.y,
			this.blade1Size.x,this.blade1Size.y,
			this.angle+this.blade1Angle,
			this.blade1TexPos.x,
			this.blade1TexPos.y,
			this.blade1TexSize.x,
			this.blade1TexSize.y,
			false,
			this.blade1Offset.x,
			this.blade1Offset.y);
		renderer.img(
			this.pos.x,this.pos.y,
			this.blade1Size.x,this.blade1Size.y,
			this.angle+this.blade1Angle+PI,
			this.blade1TexPos.x,
			this.blade1TexPos.y,
			this.blade1TexSize.x,
			this.blade1TexSize.y,
			false,
			this.blade1Offset.x,
			this.blade1Offset.y);
			
		renderer.img(
			this.pos.x,this.pos.y,
			this.blade2Size.x,this.blade2Size.y,
			this.angle+this.blade2Angle+PI,
			this.blade2TexPos.x,
			this.blade2TexPos.y,
			this.blade2TexSize.x,
			this.blade2TexSize.y,
			true,
			this.blade2Offset.x,
			this.blade2Offset.y);
		renderer.img(
			this.pos.x,this.pos.y,
			this.blade2Size.x,this.blade2Size.y,
			this.angle+this.blade2Angle,
			this.blade2TexPos.x,
			this.blade2TexPos.y,
			this.blade2TexSize.x,
			this.blade2TexSize.y,
			true,
			this.blade2Offset.x,
			this.blade2Offset.y);
		
		renderer.img(
			this.pos.x+this.facePos.x,this.pos.y+this.facePos.y,
			this.faceSize.x,this.faceSize.y,
			0,
			this.faceTexPos.x,
			this.faceTexPos.y,
			this.faceTexSize.x,
			this.faceTexSize.y,
			false);

		gameRunner.shadow(this.pos.x,this.pos.y,(this.hitbox[1].x-this.hitbox[0].x)/2);
	}
}
//apply mixin
Object.assign(Wrecker.prototype,shapeMixin.circ);

//#endregion

//#region bosses
class BossSpike extends Alien{
	constructor(p,a){
		super(p,a);

		this.maxHealth=50;
		this.health=this.maxHealth;

		this.size=110;
		this.displaySize=Vec(this.size,this.size).scl(2);
		this.texPos=Vec(744,1);
		this.texSize=Vec(110,110);
		
		this.spike1Size=Vec(57,46).scl(2);
		this.spike1TexPos=Vec(855,1);
		this.spike1TexSize=Vec(57,46);
		this.spike1Offset=Vec(-40,0).scl(2);
		this.spike1Angle=0;

		this.spike2Size=Vec(38,46).scl(2);
		this.spike2TexPos=Vec(913,1);
		this.spike2TexSize=Vec(38,46);
		this.spike2Offset=Vec(-60,0).scl(2);
		this.spike2Angle=0;
		this.spike3Angle=0;

		this.speed=1;
		this.resistance=0.8;
		this.pushSpeed=0.25;
		
		this.cooldownMax=10;

		this.damage=20;
		this.spin=0.025;
		this.spinBase=0.025;
		this.spinResist=.99;
		this.spinSpeed=.005;

		this.scaleHealth=false;
	}
	shoot(bulletA,timeStep){
		this.spin+=this.spinSpeed*timeStep;
	}
	runSpecial(arrays){
		let a2=arrays["planes"];
		for(let j=0;j<a2.length;j++){
			this.tryHit(a2[j],false,true);
		}
	}
	hit(target,special){
		let shoveDir=target.getPos(this.pos).sub(this.pos).nrm(this.spin*100);
		target.shove(shoveDir);
		if(special){
			if(this.cooldown<=0){
				let sparkP=target.getPos(this.pos).sub(this.pos).nrm(this.size/2).add(this.pos);
				gameRunner.spark(sparkP.x,sparkP.y,0,0,3);
				target.hurt(this.damage,this);
				this.cooldown=this.cooldownMax;
			}
		}else{
			super.hit(target);
		}
	}
	die(){
		gameRunner.wreck(this.pos.x,this.pos.y,this.velo.x,this.velo.y,20);
		gameRunner.wreck(this.pos.x,this.pos.y,this.velo.x,this.velo.y,10);
		gameRunner.wreck(this.pos.x,this.pos.y,this.velo.x,this.velo.y,5);
		gameRunner.sounds.bang.play(this.pos,0,5/20*random(1,1.2),2);
		if(this.head!=null){
			this.head.die();
		}
	}
	runCustom(timeStep){
		super.runCustom(timeStep);
		this.spin=Math.max(this.spin*this.spinResist**timeStep,this.spinBase);
		this.spike1Angle+=this.spin*timeStep;
		this.spike2Angle-=this.spin*timeStep;
		this.spike3Angle+=this.spin/2*timeStep;
	}
	display(disp,renderer){
		renderer.img(
			this.pos.x,this.pos.y,
			this.displaySize.x,this.displaySize.y,
			0,
			this.texPos.x,
			this.texPos.y,
			this.texSize.x,
			this.texSize.y,
			false);
		
		for(let n=0;n<6;n++){
			renderer.img(
				this.pos.x,this.pos.y,
				this.spike2Size.x,this.spike2Size.y,
				n/6*TAU+this.spike2Angle,
				this.spike2TexPos.x,
				this.spike2TexPos.y,
				this.spike2TexSize.x,
				this.spike2TexSize.y,
				false,
				this.spike2Offset.x,
				this.spike2Offset.y);
		}
		for(let n=0;n<6;n++){
			renderer.img(
				this.pos.x,this.pos.y,
				this.spike2Size.x,this.spike2Size.y,
				n/6*TAU+this.spike3Angle,
				this.spike2TexPos.x,
				this.spike2TexPos.y,
				this.spike2TexSize.x,
				this.spike2TexSize.y,
				false,
				this.spike2Offset.x,
				this.spike2Offset.y);
		}
		for(let n=0;n<3;n++){
			renderer.img(
				this.pos.x,this.pos.y,
				this.spike1Size.x,this.spike1Size.y,
				n/3*TAU+this.spike1Angle,
				this.spike1TexPos.x,
				this.spike1TexPos.y,
				this.spike1TexSize.x,
				this.spike1TexSize.y,
				false,
				this.spike1Offset.x,
				this.spike1Offset.y);
		}

		gameRunner.shadow(this.pos.x,this.pos.y,(this.hitbox[1].x-this.hitbox[0].x)/2);
	}
}
//apply mixin
Object.assign(BossSpike.prototype,shapeMixin.circ);

class BossDrill extends Alien{
	constructor(p,a){
		super(p,a);

		this.maxHealth=50;
		this.health=this.maxHealth;

		this.displaySize=Vec(142,150).scl(2);
		this.texPos=Vec(952,1);
		this.texSize=Vec(142,150);
		this.offset=Vec(30,0).scl(2);

		this.triSize=Vec(38,30).scl(2);
		this.triTexPos=Vec(1095,25);
		this.triTexSize=Vec(38,30);
		this.triOffset=Vec(7,0).scl(2).add(this.offset);

		this.eye1Size=Vec(5,11).scl(2);
		this.eye1TexPos=Vec(1105,1);
		this.eye1TexSize=Vec(5,11);

		this.eye2Size=Vec(3,9).scl(2);
		this.eye2TexPos=Vec(1101,1);
		this.eye2TexSize=Vec(3,9);

		this.eye3Size=Vec(2,3).scl(2);
		this.eye3TexPos=Vec(1098,1);
		this.eye3TexSize=Vec(2,3);

		this.eye4Size=Vec(2,1).scl(2);
		this.eye4TexPos=Vec(1095,1);
		this.eye4TexSize=Vec(2,1);

		this.gunSize=Vec(14,8).scl(2);
		this.gunTexPos=Vec(1111,1);
		this.gunTexSize=Vec(14,8);
		this.gunAngle1=0.0;
		this.gunAngle2=0.0;
		this.gunAngle3=0.0;

		this.speed=1;
		this.resistance=0.98;
		this.resistanceWater=0.97;
		this.pushSpeed=0.25;
		this.agilityNormal=0.02;
		this.agilityBoost=0.05;
		this.agility=this.agilityNormal;
		
		this.gunCooldownMax=30;
		this.gunCooldown=0;
		this.gunSpeed=0;
		this.gunAccel=0.005;
		this.gunResistance=0.95;
		this.damage=1;
		
		this.splashSize=5;
		this.waveSize=5;

		this.bulletSpeed=50;
		this.bulletRange=50;

		this.eyeSpin1=PI/2+0.5;
		this.eyeSpin2=PI/2+0.1;
		this.hitBoxPoly=[Vec(-60,-150),Vec(-60,150),Vec(200,0)];

		this.scaleHealth=false;
	}
	runSpecial(arrays){
		let a2=arrays["planes"];
		for(let j=0;j<a2.length;j++){
			this.tryHit(a2[j],false,true);
		}
	}
	hit(target,special){
		let shoveDir=target.getPos(this.pos).sub(this.pos).nrm(this.gunSpeed*30);
		target.shove(shoveDir);
		super.hit(target);
	}
	die(){
		gameRunner.wreck(this.pos.x,this.pos.y,this.velo.x,this.velo.y,20);
		gameRunner.wreck(this.pos.x,this.pos.y,this.velo.x,this.velo.y,10);
		gameRunner.wreck(this.pos.x,this.pos.y,this.velo.x,this.velo.y,5);
		gameRunner.sounds.bang.play(this.pos,0,5/20*random(1,1.2),2);
		if(this.head!=null){
			this.head.die();
		}
	}
	runCustom(timeStep){
		super.runCustom(timeStep);
		this.gunSpeed*=this.gunResistance**timeStep;
		let drillSpeed=this.gunSpeed+0.03;
		this.gunAngle1+=drillSpeed*timeStep;
		this.gunAngle2+=drillSpeed*2*timeStep;
		this.gunAngle3+=drillSpeed*3*timeStep;
		this.agility=this.boosting?this.agilityBoost:this.agilityNormal;
		this.boosting=false;
	}
	face(target,timeStep){
		super.face(target,timeStep);
		let p=target.cln().sub(this.getPos(target)).lim(30);
		p.z=40;
		p.nrm(40);
		this.eyeSpin2=Vec(p.yz).ang();
		this.eyeSpin1=Vec(p.xz).ang();
	}
	faceAng(ang,timeStep){
		super.faceAng(ang,timeStep);
		let p=VecA(30,ang);
		p.z=40;
		p.nrm(40);
		this.eyeSpin2=Vec(p.yz).ang();
		this.eyeSpin1=Vec(p.xz).ang();
		this.eyeSpin1=Vec(p.xz).ang();
	}
	shoot(bulletsArr,timeStep){
		this.gunSpeed+=this.gunAccel*timeStep;
		let gunCount=8;
		let fireIdx=this.gunCooldown;
		for(let i=0;i<gunCount;i++){
			fireIdx++;
			if(fireIdx%this.gunCooldownMax>1){
				continue;
			}
			let p=VecA(75,i/gunCount*TAU+this.gunAngle1);
			if(p.x>0){
				continue;
			}
			p.x=40*2;
			
			let ra=(Math.random()-0.5)*2*this.accuracy;
			let s=this.bulletSpeed;
			let pVelo=VecA(s,this.angle+ra);
			pVelo.add(this.velo);
			let pPos=p.cln().rot(this.angle);
			pPos.add(this.pos);
			bulletsArr.push(new AlienBullet(pPos,pVelo,this.bulletDamage,this.bulletSize,this.bulletRange));
			gameRunner.sounds.laser.play(this.pos,0,1*random(.8,1.2));
		}
		gunCount=6;
		for(let i=0;i<gunCount;i++){
			fireIdx++;
			if(fireIdx%this.gunCooldownMax>1){
				continue;
			}
			let p=VecA(46,i/gunCount*TAU+this.gunAngle2);
			if(p.x>0){
				continue;
			}
			p.x=60*2;
			
			let ra=(Math.random()-0.5)*2*this.accuracy;
			let s=this.bulletSpeed;
			let pVelo=VecA(s,this.angle+ra);
			pVelo.add(this.velo);
			let pPos=p.cln().rot(this.angle);
			pPos.add(this.pos);
			bulletsArr.push(new AlienBullet(pPos,pVelo,this.bulletDamage,this.bulletSize,this.bulletRange));
			gameRunner.sounds.laser.play(this.pos,0,1*random(1,1.2));
		}
		gunCount=3;
		for(let i=0;i<gunCount;i++){
			fireIdx++;
			if(fireIdx%this.gunCooldownMax>1){
				continue;
			}
			let p=VecA(20,i/gunCount*TAU+this.gunAngle3);
			if(p.x>0){
				continue;
			}
			p.x=80*2;

			let ra=(Math.random()-0.5)*2*this.accuracy;
			let s=this.bulletSpeed;
			let pVelo=VecA(s,this.angle+ra);
			pVelo.add(this.velo);
			let pPos=p.cln().rot(this.angle);
			pPos.add(this.pos);
			bulletsArr.push(new AlienBullet(pPos,pVelo,this.bulletDamage,this.bulletSize,this.bulletRange));
			gameRunner.sounds.laser.play(this.pos,0,1*random(1.2,1.2));
		}
		fireIdx+=Math.floor(Math.random()*2);
		this.gunCooldown=fireIdx%this.gunCooldownMax;
	}
	boost(timeStep){
		this.boosting=true;
		super.boost(timeStep);
	}
	boostEffect(strength,timeStep){
		let offset=VecA(-this.displaySize.x/2+this.offset.x,this.angle);
		offset.add(this.pos).add(this.velo);
		let offset2=VecA(20*2,this.angle+PI/2);

		gameRunner.thrust(offset.x,offset.y,this.velo.x,this.velo.y,
			(Math.random()+0.5)*timeStep
		);
		gameRunner.thrust(offset.x+offset2.x,offset.y+offset2.y,this.velo.x,this.velo.y,
			(Math.random()+0.5)*timeStep
		);
		gameRunner.thrust(offset.x-offset2.x,offset.y-offset2.y,this.velo.x,this.velo.y,
			(Math.random()+0.5)*timeStep
		);
		let m=this.velo.mag()*timeStep;
		let cloudCol=RGB(255,255,255,50).scl(255);
		for(let v=0;v<m;v+=20){
			let p=this.velo.cln().nrm(-v).add(offset).add(VecA(Math.random()*20,Math.random()*TAU));
			gameRunner.cloud(p.x,p.y,cloudCol.x,cloudCol.y,cloudCol.z,cloudCol.w);
			gameRunner.cloud(p.x+offset2.x,p.y+offset2.y,cloudCol.x,cloudCol.y,cloudCol.z,cloudCol.w);
			gameRunner.cloud(p.x-offset2.x,p.y-offset2.y,cloudCol.x,cloudCol.y,cloudCol.z,cloudCol.w);
		}
	}
	display(disp,renderer){
		renderer.img(
			this.pos.x,this.pos.y,
			this.displaySize.x,this.displaySize.y,
			this.angle,
			this.texPos.x,
			this.texPos.y,
			this.texSize.x,
			this.texSize.y,
			false,
			this.offset.x,
			this.offset.y);
		
		// let eyeCenter=VecA(40,this.eyeSpin1,0,this.eyeSpin2);
		let eyeDotCount=20;
		for(let i=0;i<eyeDotCount;i++){
			let p=VecA(40,i/eyeDotCount*TAU);
			p.xy=Vec(p.xy).rot(this.eyeSpin1);
			p.yz=Vec(p.yz).rot(this.eyeSpin2);
			if(p.z<5){
				continue;
			}
			let p2=VecA(40,(i+0.01)/eyeDotCount*TAU);
			p2.xy=Vec(p2.xy).rot(this.eyeSpin1);
			p2.yz=Vec(p2.yz).rot(this.eyeSpin2);
			let ang=p.ang(p2);
			if(i==0){
				renderer.img(
					this.pos.x+p.x,this.pos.y+p.y,
					this.eye1Size.x,this.eye1Size.y,
					0,
					this.eye1TexPos.x,
					this.eye1TexPos.y,
					this.eye1TexSize.x,
					this.eye1TexSize.y,
					false);
			}else if(i==1||i==eyeDotCount-1){
				renderer.img(
					this.pos.x+p.x,this.pos.y+p.y,
					this.eye2Size.x,this.eye2Size.y,
					0,
					this.eye2TexPos.x,
					this.eye2TexPos.y,
					this.eye2TexSize.x,
					this.eye2TexSize.y,
					false);
			}else if(i==2){
				renderer.img(
					this.pos.x+p.x,this.pos.y+p.y,
					this.eye3Size.x,this.eye3Size.y,
					ang+PI,
					this.eye3TexPos.x,
					this.eye3TexPos.y,
					this.eye3TexSize.x,
					this.eye3TexSize.y,
					false);
			}else if(i==eyeDotCount-2){
				renderer.img(
					this.pos.x+p.x,this.pos.y+p.y,
					this.eye3Size.x,this.eye3Size.y,
					ang,
					this.eye3TexPos.x,
					this.eye3TexPos.y,
					this.eye3TexSize.x,
					this.eye3TexSize.y,
					false);
			}else{
				renderer.img(
					this.pos.x+p.x,this.pos.y+p.y,
					this.eye4Size.x,this.eye4Size.y,
					ang,
					this.eye4TexPos.x,
					this.eye4TexPos.y,
					this.eye4TexSize.x,
					this.eye4TexSize.y,
					false);
			}
		}
		
		let eyeDotCount2=20;
		for(let i=0;i<eyeDotCount2;i++){
			let p=VecA(40,i/eyeDotCount2*TAU);
			p.yz=Vec(p.yz).rot(PI/2);
			p.xy=Vec(p.xy).rot(this.eyeSpin1);
			p.yz=Vec(p.yz).rot(this.eyeSpin2);
			if(p.z<5){
				continue;
			}
			let p2=VecA(40,(i+0.01)/eyeDotCount2*TAU);
			p2.yz=Vec(p2.yz).rot(PI/2);
			p2.xy=Vec(p2.xy).rot(this.eyeSpin1);
			p2.yz=Vec(p2.yz).rot(this.eyeSpin2);
			let ang=p.ang(p2);
			if(i==0||i==1||i==eyeDotCount2-1){
				//do nothing
			}else if(i==2){
				renderer.img(
					this.pos.x+p.x,this.pos.y+p.y,
					this.eye3Size.x,this.eye3Size.y,
					ang+PI,
					this.eye3TexPos.x,
					this.eye3TexPos.y,
					this.eye3TexSize.x,
					this.eye3TexSize.y,
					false);
			}else if(i==eyeDotCount2-2){
				renderer.img(
					this.pos.x+p.x,this.pos.y+p.y,
					this.eye3Size.x,this.eye3Size.y,
					ang,
					this.eye3TexPos.x,
					this.eye3TexPos.y,
					this.eye3TexSize.x,
					this.eye3TexSize.y,
					false);
			}else{
				renderer.img(
					this.pos.x+p.x,this.pos.y+p.y,
					this.eye4Size.x,this.eye4Size.y,
					ang,
					this.eye4TexPos.x,
					this.eye4TexPos.y,
					this.eye4TexSize.x,
					this.eye4TexSize.y,
					false);
			}
		}

		let gunCount=8;
		for(let i=0;i<gunCount;i++){
			let p=VecA(75,i/gunCount*TAU+this.gunAngle1);
			if(p.x>0){
				continue;
			}
			p.x=40*2;

			renderer.img(
				this.pos.x,this.pos.y,
				this.gunSize.x,this.gunSize.y,
				this.angle,
				this.gunTexPos.x,
				this.gunTexPos.y,
				this.gunTexSize.x,
				this.gunTexSize.y,
				false,
				p.x,
				p.y);
		}
		gunCount=6;
		for(let i=0;i<gunCount;i++){
			let p=VecA(46,i/gunCount*TAU+this.gunAngle2);
			if(p.x>0){
				continue;
			}
			p.x=60*2;

			renderer.img(
				this.pos.x,this.pos.y,
				this.gunSize.x,this.gunSize.y,
				this.angle,
				this.gunTexPos.x,
				this.gunTexPos.y,
				this.gunTexSize.x,
				this.gunTexSize.y,
				false,
				p.x,
				p.y);
		}
		gunCount=3;
		for(let i=0;i<gunCount;i++){
			let p=VecA(20,i/gunCount*TAU+this.gunAngle3);
			if(p.x>0){
				continue;
			}
			p.x=80*2;

			renderer.img(
				this.pos.x,this.pos.y,
				this.gunSize.x,this.gunSize.y,
				this.angle,
				this.gunTexPos.x,
				this.gunTexPos.y,
				this.gunTexSize.x,
				this.gunTexSize.y,
				false,
				p.x,
				p.y);
		}

		renderer.img(
			this.pos.x,this.pos.y,
			this.triSize.x,this.triSize.y,
			this.angle,
			this.triTexPos.x,
			this.triTexPos.y,
			this.triTexSize.x,
			this.triTexSize.y,
			false,
			this.triOffset.x,
			this.triOffset.y);

		gameRunner.shadow(this.pos.x,this.pos.y,(this.hitbox[1].x-this.hitbox[0].x)/2);
	}
}
//apply mixin
Object.assign(BossDrill.prototype,shapeMixin.poly);

class BossAxe extends Alien{
	constructor(p,a){
		super(p,a);

		this.maxHealth=50;
		this.health=this.maxHealth;

		this.size=118;
		this.displaySize=Vec(202,118).scl(2);
		this.texPos=Vec(1134,1);
		this.texSize=Vec(202,118);
		this.offset=Vec(100,0);
		
		this.coverSize=Vec(16,28).scl(2);
		this.coverTexPos=Vec(1337,1);
		this.coverTexSize=Vec(16,28);
		this.coverOffset=Vec(0,-142);
		this.coverOffset2=Vec(0,40);
		this.coverOpen=1;
		this.coverSpeed=0.1;
		this.coverOpenLength=38;

		this.speed=1;
		this.resistance=0.8;
		this.pushSpeed=0.25;
		this.agilityNormal=0.025;
		this.agilityFire=0.01;
		this.agility=this.agilityNormal;

		this.cooldownMax=500;
		this.bulletSpeed=80;
		this.bulletSize=30;
		this.bulletDamage=20;
		this.bulletRange=150;
		this.accuracy=0;
		this.fireChainMax=100;
		this.fireChain=0;
		this.fireChainCooldownMax=10;
		this.fireChainCooldown=0;

		this.damage=20;
		this.spin=0.025;

		this.scaleHealth=false;
	}
	runCustom(timeStep){
		super.runCustom(timeStep);

		if(this.fireChainCooldown>0){
			this.fireChainCooldown-=timeStep;
		}
		if(this.fireChain>0){
			this.fireChain-=timeStep;
		}

		if(this.cooldown<20){
			this.coverOpen=clamp(this.coverOpen+this.coverSpeed*timeStep,0,1);
		}else if(this.fireChain<=0){
			this.coverOpen=clamp(this.coverOpen-this.coverSpeed*timeStep,0,1);
		}
		
		this.agility=(this.cooldown<=0||this.fireChain>0)?this.agilityFire:this.agilityNormal;
	}
	die(){
		gameRunner.wreck(this.pos.x,this.pos.y,this.velo.x,this.velo.y,20);
		gameRunner.wreck(this.pos.x,this.pos.y,this.velo.x,this.velo.y,10);
		gameRunner.wreck(this.pos.x,this.pos.y,this.velo.x,this.velo.y,5);
		gameRunner.sounds.bang.play(this.pos,0,5/20*random(1,1.2),2);
		if(this.head!=null){
			this.head.die();
		}
	}
	shoot(bulletsArr,timeStep){
		if(this.cooldown<=0){
			this.fireChain=this.fireChainMax;
			this.cooldown=this.cooldownMax;
		}
		if(this.fireChain>0){
			if(this.fireChainCooldown<=0){
				let ra=(Math.random()-0.5)*2*this.accuracy;
				let s=this.bulletSpeed;
				let pVelo=VecA(s,this.angle+ra);
				pVelo.add(this.velo);
				let pPos=VecA(0,this.angle);
				pPos.add(this.pos);
				bulletsArr.push(new AlienBulletHeavy(pPos,pVelo,this.bulletDamage,this.bulletSize,this.bulletRange));
				this.fireChainCooldown=this.fireChainCooldownMax;
				gameRunner.sounds.laser.play(this.pos,0,.4*random(1,1.2));
			}
		}
	}
	display(disp,renderer){
		renderer.img(
			this.pos.x,this.pos.y,
			this.displaySize.x,this.displaySize.y,
			this.angle,
			this.texPos.x,
			this.texPos.y,
			this.texSize.x,
			this.texSize.y,
			false,
			this.offset.x,
			this.offset.y);
		
		let coverCount=5;
		let a=PI*2/3-0.8;
		let coverPos1=this.coverOffset2.cln().rot(this.angle).add(this.pos);
		let coverPos2=this.coverOffset2.cln();
		coverPos2.y*=-1;
		coverPos2.rot(this.angle).add(this.pos);
		for(let n=0;n<=coverCount;n++){
			renderer.img(
				coverPos1.x,coverPos1.y,
				this.coverSize.x,this.coverSize.y,
				this.angle+n/coverCount*a-a/2,
				this.coverTexPos.x,
				this.coverTexPos.y,
				this.coverTexSize.x,
				this.coverTexSize.y,
				false,
				this.coverOffset.x,
				this.coverOffset.y-this.coverOpen*this.coverOpenLength);
			renderer.img(
				coverPos2.x,coverPos2.y,
				this.coverSize.x,this.coverSize.y,
				this.angle+n/coverCount*a-a/2+PI,
				this.coverTexPos.x,
				this.coverTexPos.y,
				this.coverTexSize.x,
				this.coverTexSize.y,
				false,
				this.coverOffset.x,
				this.coverOffset.y-this.coverOpen*this.coverOpenLength);
		}

		let chargeP=VecA(-100,this.angle).add(this.pos);

		bulletRenderer.line(
			chargeP.x,
			chargeP.y,
			(1-this.cooldown/this.cooldownMax)*60,
			0,
			0,
			10,
			.3,.6,.1
		);

		gameRunner.shadow(this.pos.x,this.pos.y,(this.hitbox[1].x-this.hitbox[0].x)/2);
	}
}
//apply mixin
Object.assign(BossAxe.prototype,shapeMixin.circ);

class BossYarn extends Alien{
	constructor(p,a){
		super(p,a);

		this.maxHealth=50;
		this.health=this.maxHealth;

		this.size=122;
		this.displaySize=Vec(this.size,this.size).scl(2);
		this.texPos=Vec(1477,1);
		this.texSize=Vec(122,122);
		this.offset=Vec(0,0);

		this.isOpen=false;
		this.arrowOpen=0;
		this.openSpeed=0.05;
		this.displayAngle=0;

		this.arrowSize=Vec(38,53).scl(2);
		this.arrowTexPos=Vec(1354,1);
		this.arrowTexSize=Vec(38,53);
		this.arrowOffset=Vec(0,-53+2);

		this.arrow2Size=Vec(36,27).scl(2);
		this.arrow2TexPos=Vec(1354,171);
		this.arrow2TexSize=Vec(36,27);
		this.arrow2Offset=Vec(0,-118);
		this.arrow2Spin=0;
		
		this.blockSize=Vec(30,30).scl(2);
		this.blockTexPos=Vec(1354,109);
		this.blockTexSize=Vec(30,30);
		this.blockOffset=Vec(0,-93);

		this.ringSize=Vec(82,82).scl(2);
		this.ringTexPos=Vec(1394,1);
		this.ringTexSize=Vec(82,82);

		this.letterSize=Vec(5,7).scl(2);
		this.letterTexPos=Vec(1391,167);
		this.letterTexSize=Vec(5,7);
		this.letterOffset=Vec(0,-110);
		this.letterCount=9;
		this.letters=Array(50).fill().map(x=>Math.floor(Math.random()*(this.letterCount+2)));

		this.speedBase=5;
		this.speed=this.speedBase;
		this.resistance=0.8;
		this.pushSpeed=0.25;

		this.cooldownMax=5;
		this.bulletDamage=5;
		this.bulletSize=12;

		this.scaleHealth=false;
	}
	runCustom(timeStep){
		super.runCustom(timeStep);
		this.arrow2Spin+=0.02*timeStep;
		this.displayAngle-=0.005*timeStep;
		if(this.isOpen){
			this.arrowOpen=Math.max(this.arrowOpen-this.openSpeed*timeStep,0);
		}else{
			this.arrowOpen=Math.min(this.arrowOpen+this.openSpeed*timeStep,1);
		}
		this.speed=this.arrowOpen==0?0:this.speedBase;
		this.isOpen=false;
	}
	die(){
		gameRunner.wreck(this.pos.x,this.pos.y,this.velo.x,this.velo.y,20);
		gameRunner.wreck(this.pos.x,this.pos.y,this.velo.x,this.velo.y,10);
		gameRunner.wreck(this.pos.x,this.pos.y,this.velo.x,this.velo.y,5);
		gameRunner.sounds.bang.play(this.pos,0,5/20*random(1,1.2),2);
		if(this.head!=null){
			this.head.die();
		}
	}
	shoot(bulletsArr){
		let arrowCount=6;
		this.isOpen=true;
		if(this.cooldown<=0&&this.arrowOpen==0){
			for(let i=0;i<6;i++){
				let ra=(Math.random()-0.5)*2*this.accuracy;
				let s=this.bulletSpeed;
				let a=this.displayAngle+this.arrow2Spin+TAU*i/arrowCount;
				let pVelo=VecA(s,a+ra);
				pVelo.add(this.velo);
				let pPos=VecA(this.getSize().x,a);
				pPos.add(this.pos);
				bulletsArr.push(new AlienBullet(pPos,pVelo,this.bulletDamage,this.bulletSize,this.bulletRange));
				gameRunner.sounds.laser.play(this.pos,0,.8*random(1,1.2));
			}
			this.cooldown=this.cooldownMax;
		}
	}
	display(disp,renderer){
		let arrowCount=6;
		
		for(let n=0;n<arrowCount;n++){
			renderer.img(
				this.pos.x,this.pos.y,
				this.arrow2Size.x,this.arrow2Size.y,
				this.displayAngle+(n+0.5)/arrowCount*TAU+this.arrow2Spin,
				this.arrow2TexPos.x,
				this.arrow2TexPos.y,
				this.arrow2TexSize.x,
				this.arrow2TexSize.y,
				false,
				this.arrow2Offset.x,
				this.arrow2Offset.y+this.arrowOpen*60);
		}
		renderer.img(
			this.pos.x,this.pos.y,
			this.displaySize.x,this.displaySize.y,
			this.displayAngle,
			this.texPos.x,
			this.texPos.y,
			this.texSize.x,
			this.texSize.y,
			false,
			this.offset.x,
			this.offset.y);
		for(let n=0;n<this.letters.length;n++){
			let l=this.letters[n];
			if(l>=this.letterCount){
				continue;
			}
			renderer.img(
				this.pos.x,this.pos.y,
				this.letterSize.x,this.letterSize.y,
				this.displayAngle+(n)/this.letters.length*TAU,
				this.letterTexPos.x+l*this.letterTexSize.x,
				this.letterTexPos.y,
				this.letterTexSize.x,
				this.letterTexSize.y,
				false,
				this.letterOffset.x,
				this.letterOffset.y);
		}
		
		for(let n=0;n<arrowCount;n++){
			renderer.img(
				this.pos.x,this.pos.y,
				this.arrowSize.x,this.arrowSize.y,
				this.displayAngle+n/arrowCount*TAU,
				this.arrowTexPos.x,
				this.arrowTexPos.y,
				this.arrowTexSize.x,
				this.arrowTexSize.y,
				false,
				this.arrowOffset.x,
				this.arrowOffset.y-this.arrowOpen*60);
		}
		for(let n=0;n<arrowCount;n++){
			renderer.img(
				this.pos.x,this.pos.y,
				this.blockSize.x,this.blockSize.y,
				this.displayAngle+(n+0.5)/arrowCount*TAU,
				this.blockTexPos.x,
				this.blockTexPos.y,
				this.blockTexSize.x,
				this.blockTexSize.y,
				false,
				this.blockOffset.x,
				this.blockOffset.y);
		}
		
		renderer.img(
			this.pos.x,this.pos.y,
			this.ringSize.x,this.ringSize.y,
			this.displayAngle,
			this.ringTexPos.x,
			this.ringTexPos.y,
			this.ringTexSize.x,
			this.ringTexSize.y,
			false);

		gameRunner.shadow(this.pos.x,this.pos.y,(this.hitbox[1].x-this.hitbox[0].x)/2);
	}
}
//apply mixin
Object.assign(BossYarn.prototype,shapeMixin.circ);

//#endregion

//#region mothership
class Mothership extends Alien{
	constructor(p,a){
		super(p,a);

		this.maxHealth=250;
		this.health=this.maxHealth;

		this.size=Vec(287,194).scl(3);
		this.displaySize=this.size.cln();
		this.texPos=Vec(1312,247);
		this.texSize=Vec(287,194);
		this.offset=Vec(0,0);
		this.hitboxOffset=Vec(0,45).scl(3);
		this.hitboxBottom=25*3;
		this.tailSize=Vec(20,200).scl(3);
		
		this.scaleHealth=false;
		
		this.calcHitbox();
	}
	shove(){
	}
	hit(){
	}
	getClosest(vec){
		let pos=loopVec(this.pos,vec);
		let rP=vec.cln().sub(pos).sub(this.hitboxOffset).lim(this.size.x/2).add(pos).add(this.hitboxOffset);
		let r=rP.mag(vec);
		let lP=vec.cln().sub(pos);
		lP.y=Math.min(lP.y,this.hitboxBottom);
		lP.add(pos);
		let l=lP.mag(vec);

		let boxP;
		{
			let v=vec.cln().sub(pos);
			let s=v.cln().sign();
			let sz=this.tailSize.cln().scl(.5);
			v.abs();
			if(v.x<sz.x&&v.y<sz.y){
				boxP=vec.cln();
			}else{
				v.min(sz);
			}
			boxP=v.scl(s).add(pos);
		}
		let box=boxP.mag(vec);

		let arc;
		let arcP;
		if(l<r){
			arc=r;
			arcP=rP;
		}else{
			arc=l;
			arcP=lP;
		}
		if(arc<box){
			return arcP;
		}else{
			return boxP;
		}
	}
	getDist(vec){
		let pos=loopVec(this.pos,vec);
		let r=pos.mag(vec.cln().sub(this.hitboxOffset))-this.size.x/2;
		let l=vec.y-pos.cln().add(this.hitboxOffset).y+this.hitboxBottom;
		let box;
		{
			let v=vec.cln().sub(pos);
			let sz=this.tailSize.cln().scl(.5);
			v.abs();
			if(v.x<sz.x&&v.y<sz.y){
				box=Math.max(v.x-sz.x,v.y-sz.y);
			}else{
				let v2=v.cln();
				v.min(sz);
				box=v2.mag(v);
			}
		}
		return Math.min(Math.max(r,l),box);
	}
	calcHitbox(){
		let min=this.pos.cln();
		let max=this.pos.cln();
		min.sub(this.size.x/2).add(this.hitboxOffset);
		max.add(this.size.x/2).add(this.hitboxOffset);
		max.y=this.pos.y+this.tailSize.y/2;
		this.hitbox=[min,max];
	}
	die(){
		gameRunner.wreck(this.pos.x,this.pos.y,this.velo.x,this.velo.y,40);
		gameRunner.wreck(this.pos.x,this.pos.y,this.velo.x,this.velo.y,20);
		gameRunner.wreck(this.pos.x,this.pos.y,this.velo.x,this.velo.y,10);
		gameRunner.wreck(this.pos.x,this.pos.y,this.velo.x,this.velo.y,5);
		gameRunner.sounds.bang.play(this.pos,0,5/20*random(1,1.2),2);
		gameRunner.sounds.bang.play(this.pos,0,5/40*random(1,1.2),3);
		if(this.head!=null){
			this.head.die();
		}
	}
	shoot(){
	}
	display(){
		renderer.img(
			this.pos.x,this.pos.y,
			this.displaySize.x,this.displaySize.y,
			0,
			this.texPos.x,
			this.texPos.y,
			this.texSize.x,
			this.texSize.y,
			false,
			this.displayOffset.x,
			this.displayOffset.y);
		let hb=this.getHitbox();
		gameRunner.shadow(this.pos.x,this.pos.y,(hb[1].x-hb[0].x)/2);
	}
}
//#endregion

//#region spaghetti 
class SpaghettiSegment extends Entity{
	constructor(p,v,s,parent,idx){
		super(p,v);
		this.size=s;
		this.parent=parent;
		this.idx=idx;
		this.damage=1;
	}
	run(){
		this.alive=this.isAlive();
	}
	isAlive(){
		return this.parent.isAlive();
	}
	runSpecial(arrays){
		let a2=arrays["aliens"];
		for(let j=0;j<a2.length;j++){
			this.tryHit(a2[j],false,true);
		}
	}
	hurt(damage,damager){
		this.parent.hurt(damage,damager);
	}
	hit(target,special){
		if(special){
			target.hurt(this.damage,this);
			this.parent.grow(.1);
		}else{
			super.hit(target);
		}
	}
	display(){
	}
}
//apply mixin
Object.assign(SpaghettiSegment.prototype,shapeMixin.circ);

class Spaghetti extends Entity{
	constructor(p,v,length,width,force,hasEye=false){
		super(p,v);
		this.ballTexPos=Vec(808,490);
		this.ballTexSize=Vec(30,30);
		this.width=width;
		this.hasEye=hasEye;

		this.eyeTexPos=Vec(808,428);
		this.eyeTexSize=Vec(30,30);
		this.eyeSize=Vec(30,30).scl(4);

		this.segments=[];
		for(let i=0;i<length;i++){
			this.addSegment();
		}
		this.time=0;
		this.force=force.cln();
	}
	attach(p){
		this.pos=p.cln();
	}
	run(timeStep){
		super.run(timeStep);
		this.time+=timeStep;
		
		for(let i=this.segments.length-1;i>=0;i--){
			this.segments[i].pos.add(this.segments[i].velo.cln().scl(timeStep));
			this.segments[i].calcHitbox();

			let next=this.segments[i+1]?.pos??this.pos.cln();
			let curr=this.segments[i].pos;

			let backup=curr.cln();

			curr.sub(next).lim(this.width*.25).add(next);

			this.segments[i].velo.add(curr.cln().sub(backup).scl(.03));
			let segAng=curr.ang(next)
			let wave=Math.sin((this.time/100+i/20)*PI);
			this.segments[i].velo.add(VecA(wave,segAng+PI/2));
			this.segments[i].velo.add(this.force);
			this.segments[i].velo.scl(.9**timeStep);
		}

	}
	addSegment(){
		let idx=this.segments.length;
		let s=new SpaghettiSegment(this.pos.cln(),Vec(0,0),Math.min(idx*.5+20,45),this,idx).init();
		this.segments.push(s);
	}
	display(disp){
		this.segments.forEach(s=>s.display(disp));
		let segAng=this.angle;
		for(let x=0;x<this.segments.length;x++){
			if(x<this.segments.length-1){
				segAng=this.segments[x].pos.ang(this.segments[x+1].pos);
			}
			let width=this.width;
			renderer.img(
				this.segments[x].pos.x,this.segments[x].pos.y,
				width,width,
				segAng,
				this.ballTexPos.x,
				this.ballTexPos.y,
				this.ballTexSize.x,
				this.ballTexSize.y,
				false,
				0,
				0);
		}
		if(this.hasEye){
			renderer.img(
				this.segments[0].pos.x,this.segments[0].pos.y,
				this.eyeSize.x,this.eyeSize.y,
				segAng,
				this.eyeTexPos.x,
				this.eyeTexPos.y,
				this.eyeTexSize.x,
				this.eyeTexSize.y,
				false,
				0,
				0);
		}
	}
}

class SpaghettiMonster extends Alien{
	constructor(p,a){
		super(p,a);

		this.maxHealth=1000;
		this.health=this.maxHealth;

		this.ballTexPos=Vec(748,432);
		this.ballTexSize=Vec(59,59);

		this.size=150;
		
		this.cooldownMax=50;

		this.speed=10;
		this.resistance=0.9;
		this.agility=0.1;
		this.pushSpeed=2;

		this.splashSize=4;
		this.waveSize=2;
		this.buoyancyAdd=Vec(0,-1);
		this.buoyancyAddDepth=1000;

		let armCount=12;
		this.arms=Array(armCount).fill().map((_,i)=>new Spaghetti(this.pos,Vec(0,0),150,50,VecA(.5,i/armCount*TAU)));
		this.longArm1=new Spaghetti(this.pos,Vec(0,0),120,60,VecA(1,PI/2-.5));
		this.longArm1Pos=Vec(200,0);
		this.longArm2=new Spaghetti(this.pos,Vec(0,0),120,60,VecA(1,PI/2+.5));
		this.longArm2Pos=Vec(-200,0);
		this.eye1=new Spaghetti(this.pos,Vec(0,0),60,30,VecA(1,-PI/2+.5),true);
		this.eye1Pos=Vec(100,0);
		this.eye2=new Spaghetti(this.pos,Vec(0,0),60,30,VecA(1,-PI/2-.5),true);
		this.eye2Pos=Vec(-100,0);

		this.meatBallAng=0;
		
		this.zoomType="mouse";
	}
	die(){
		gameRunner.splash(this.pos.x,this.pos.y,0,0,10);
		gameRunner.bubbles(this.pos.x,this.pos.y,0,0,20);
	}
	shoot(){
		
	}

	run(timeStep){
		super.run(timeStep);
		this.velo.add(this.buoyancyAdd.cln().scl(Math.max((this.pos.y-this.buoyancyAddDepth)/this.buoyancyAddDepth,0)));

		this.arms.forEach(a=>a.attach(this.pos));
		this.arms.forEach(a=>a.run(timeStep));
		this.longArm1.attach(this.pos.cln().add(this.longArm1Pos));
		this.longArm1.run(timeStep*.5);
		this.longArm2.attach(this.pos.cln().add(this.longArm2Pos));
		this.longArm2.run(timeStep*.5);
		this.meatBallAng+=timeStep*.01;

		this.eye1.attach(this.pos.cln().add(this.eye1Pos));
		this.eye1.run(timeStep*.5);
		this.eye2.attach(this.pos.cln().add(this.eye2Pos));
		this.eye2.run(timeStep*.5);
	}
	display(disp){
		renderer.img(
			this.pos.x,this.pos.y,
			this.size*2,this.size*2,
			this.meatBallAng/2,
			this.ballTexPos.x,
			this.ballTexPos.y,
			this.ballTexSize.x,
			this.ballTexSize.y,
			false,
			0,
			0);
		this.arms.forEach(a=>a.display(disp));
		this.longArm1.display(disp);
		this.longArm2.display(disp);
		this.eye1.display(disp);
		this.eye2.display(disp);
		
		let width=240;
		renderer.img(
			this.longArm1Pos.x+this.pos.x,this.longArm1Pos.y+this.pos.y,
			width,width,
			this.meatBallAng,
			this.ballTexPos.x,
			this.ballTexPos.y,
			this.ballTexSize.x,
			this.ballTexSize.y,
			false,
			0,
			0);
		
		renderer.img(
			this.longArm2Pos.x+this.pos.x,this.longArm2Pos.y+this.pos.y,
			width,width,
			-this.meatBallAng,
			this.ballTexPos.x,
			this.ballTexPos.y,
			this.ballTexSize.x,
			this.ballTexSize.y,
			false,
			0,
			0);
	}
}
//apply mixin
Object.assign(SpaghettiMonster.prototype,shapeMixin.circ);
//#endregion