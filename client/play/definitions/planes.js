class Plane extends Entity{
	constructor(p,a,l=1){
		super(p);

		//Level
		this.level=l;
		
		//General
		this.angle=a;
		this.maxHealth=500;
		this.health=this.maxHealth;

		//Movement
		//Thrust
		this.thrustSound=null;
		this.thrustSoundSpeed=1;
		this.thrustSoundVolume=1;
		this.thrustActive=false;

		this.thrustLimit=1;
		this.thrustRecover=0.25;
		this.thrustPotential=15;
		this.thrustPotLim=15;
		this.thrust=0;
		//Agility
		this.agilityMin=0.04;
		this.agilityMax=0.08;
		this.agilityFall=0.08;
		this.agility=0;
		//Flight
		this.resistanceMin=0.9995;
		this.resistanceMax=0.995;
		this.fallResistance=0.9995;
		this.transfer=0.15;
		this.minSpeed=5;//min speed for lift
		this.maxSpeed=40;//speed for max efficiency
		this.ceilingStart=2000;
		this.ceilingEnd=6000;
		this.gravity=Vec(0,0.2);
		//Water
		this.resistanceWater=0.97;
		this.buoyancy=Vec(0,-0.5);
		this.waveSize=5;
		this.splashSize=7;
		this.buoyancyAdd=Vec(0,-.1);
		this.buoyancyAddDepth=1000;

		//Firing
		this.cooldown=0;
		this.cooldownMax=10;
		this.bulletSpeed=50;
		this.bulletSize=6;
		this.bulletDamage=1;
		this.bulletRange=100;
		this.accuracy=0.05;
		this.bulletOffset=Vec(0,0);
		
		//Display
		this.texPos=Vec(1,1);
		this.texSize=Vec(88,31);
		this.displaySize=Vec(88,31).scl(2);
		this.displayOffset=Vec(0,0);

		//Water
		this.submerged=false;
		this.bubbling=false;
		this.bubbleTime=0;
		this.bubbleMax=40;

		//Other
		this.zoomType="velo";
	}
	init(){
		this.maxHealth*=gameRunner.playerHealthScale;
		this.health*=gameRunner.playerHealthScale;
		return super.init();
	}
	start(){
		
	}
	kill(){
		this.health=0;
	}

	//#region run
	/*
		█▀█ █ █ █▄ █
		█▀▄ █▄█ █ ▀█
	*/
	runCustom(timeStep){
		this.velo.add(VecA(this.thrust,this.angle));
		if(this.alive){
			if(this.thrustActive){
				if(this.thrustSound!=null){
					this.thrustSound.play(this.pos,timeStep/gameRunner.runSpeed,this.thrustSoundSpeed,this.thrustSoundVolume*this.heightEfficiency());
				}
			}else{
				if(this.thrustSound!=null){
					this.thrustSound.play(this.pos,timeStep/gameRunner.runSpeed,this.thrustSoundSpeed,0);
				}
			}
		}
		let boostAmount=this.thrust;
		this.thrustActive=false;
		this.thrust=0;
		if(this.thrustPotential<this.thrustPotLim){
			this.thrustPotential+=this.thrustRecover*timeStep;
		}
		
		let speedEff=this.getEfficiency();
		
		this.velo.add(this.gravity.cln().scl(timeStep));
		let airResist=this.resistanceMin+(this.resistanceMax-this.resistanceMin)*speedEff;
		this.velo.scl(airResist**timeStep);
		
		let vSpeed=this.velo.mag();
		let vAngle=this.velo.ang();
		let dotP=Math.cos(this.angle-vAngle);
		
		if(dotP>=0){
			let eff=dotP*this.transfer*speedEff;
			this.velo.sub(VecA(vSpeed*eff*timeStep,vAngle));
			this.velo.add(VecA(vSpeed*eff*timeStep,this.angle));
			this.agility=this.agilityMin+(this.agilityMax-this.agilityMin)*speedEff;
		}else{
			this.velo.scl(this.fallResistance**timeStep);
			this.agility=this.agilityFall;
		}
		
		if(this.cooldown>0){
			this.cooldown-=timeStep;
		}

		gameRunner.wave(this.pos.x,this.pos.y,100,this.velo.mag()/20*timeStep);
		
		this.move(timeStep);
		if(boostAmount>0){
			this.boostEffect(boostAmount,timeStep);
		}
	}
	runWater(timeStep){
		super.runWater(timeStep);
		this.velo.add(this.buoyancyAdd.cln().scl(Math.max((this.pos.y-this.buoyancyAddDepth)/this.buoyancyAddDepth,0)));
	}
	//#endregion

	//#region actions/events
	/*
		▄▀█ █▀▀ ▀█▀ █ █▀█ █▄ █ █▀  ▄▀ █▀▀ █ █ █▀▀ █▄ █ ▀█▀ █▀
		█▀█ █▄▄  █  █ █▄█ █ ▀█ ▄█ ▄▀  ██▄ ▀▄▀ ██▄ █ ▀█  █  ▄█
	*/
	face(target,timeStep){
		let ang=this.pos.ang(target);
		this.faceAng(ang,timeStep);
	}
	faceAng(ang,timeStep){
		this.angle+=clamp(
			nrmAngPI(ang-this.angle),-this.agility*timeStep,this.agility*timeStep);
	}
	boost(timeStep){
		this.thrustActive=true;
		let bPower=Math.min(this.thrustLimit*timeStep,this.thrustPotential);
		bPower*=this.heightEfficiency();
		this.thrust+=bPower;
		this.thrustPotential-=bPower;
	}
	boostEffect(strength,timeStep){
	}
	shoot(bulletsArr,timeStep){
		if(this.cooldown<=0){
			let flip=nrmAngPI(this.angle+PI/2)<0;

			let ra=(Math.random()-0.5)*2*this.accuracy;
			let s=this.bulletSpeed;
			let pVelo=VecA(s,this.angle+ra);
			pVelo.add(this.velo);
			let pPos=Vec(this.displaySize.x/2.,0).add(this.displayOffset).add(this.bulletOffset);
			if(flip){
				pPos.y*=-1;
			}
			pPos.rot(this.angle);
			pPos.add(this.pos);
			let bullet=new Bullet(pPos,pVelo,this.bulletDamage,this.bulletSize,this.bulletRange);
			bulletsArr.push(bullet.init());

			this.cooldown=this.cooldownMax;
			gameRunner.sounds.gunshot.play(this.pos,0,1*random(1,1.2));
		}
	}
	die(explode=true){
		if(explode){
			gameRunner.wreck(this.pos.x,this.pos.y,this.velo.x,this.velo.y,40);
			gameRunner.wreck(this.pos.x,this.pos.y,this.velo.x,this.velo.y,20);
			gameRunner.wreck(this.pos.x,this.pos.y,this.velo.x,this.velo.y,10);
			gameRunner.wreck(this.pos.x,this.pos.y,this.velo.x,this.velo.y,5);
			gameRunner.sounds.bang.play(this.pos,0,10/40*random(1,1.2));
		}
		if(this.thrustSound!=null){
			this.thrustSound.play(this.pos,0.1,this.thrustSoundSpeed,0);
		}
	}
	//#endregion

	//#region getters
	/*
		█▀▀ █▀▀ ▀█▀ ▀█▀ █▀▀ █▀█ █▀
		█▄█ ██▄  █   █  ██▄ █▀▄ ▄█
	*/
	getAgility(){
		return this.agilityMin+(this.agilityMax-this.agilityMin)*this.getEfficiency();
	}
	getEfficiency(){
		let vSpeed=this.velo.mag();
		return Math.max(Math.min((vSpeed-this.minSpeed)/(this.maxSpeed-this.minSpeed),1),0);
	}
	heightEfficiency(){
		let alt=-this.pos.y;
		if(alt>this.ceilingEnd){
			return 0;
		}
		if(alt<this.ceilingStart){
			return 1;
		}
		return (this.ceilingEnd-alt)/(this.ceilingEnd-this.ceilingStart);
	}
	//#endregion
}
//apply mixin
Object.assign(Plane.prototype,shapeMixin.poly);

//#region Jet
class Jet extends Plane{
	constructor(p,a,l){
		super(p,a,l);

		this.thrustSound=gameRunner.sounds.rocket;
		this.thrustSoundSpeed=2.5;

		this.maxHealth=500+(this.level-1)*100;
		this.health=this.maxHealth;

		this.bulletSize=6+3*(this.level-1);
		this.bulletDamage=1+(this.level-1);
		this.hitBoxPoly=[Vec(40,-10),Vec(84,0),Vec(-30,30),Vec(-80,10),Vec(-80,-10)];
	}
	boostEffect(strength,timeStep){
		let hE=this.heightEfficiency();
		let offset=VecA(-this.displaySize.x/2,this.angle);
		offset.add(this.pos);

		gameRunner.thrust(offset.x,offset.y,this.velo.x,this.velo.y,
			strength/timeStep,timeStep
		);
		let m=this.velo.mag()*timeStep;
		for(let v=0;v<m;v+=20){
			let p=this.velo.cln().nrm(-v).add(offset);
			gameRunner.cloud(p.x,p.y,255,255,255,30*hE);
		}
	}
}

class WrightFlyer extends Plane{
	constructor(p,a,l){
		super(p,a,l);

		this.thrustSound=gameRunner.sounds.prop;
		this.thrustSoundSpeed=0.5;
		
		this.thrustLimit=0.2;
		this.thrustRecover=0.2;
		this.thrustPotential=0.2;
		this.thrustPotLim=0.2;
		this.transfer=0.1;

		this.agilityMin=0.04;
		this.agilityMax=0.06;
		this.agilityFall=0.06;
		
		this.cooldown=0;
		this.cooldownMax=25;
		this.bulletSpeed=15;

		this.minSpeed=5;//min speed for lift
		this.maxSpeed=20;//speed for max efficiency
		
		this.ceilingStart=2000;
		this.ceilingEnd=4000;

		this.size=Vec(82,29).scl(2);
		this.displaySize=this.size.cln();
		this.offset=Vec(0,0);
		this.displayOffset=this.offset.cln();
		this.texPos=Vec(389,523);
		this.texSize=Vec(82,29);
		
		this.propPos=Vec(-39,-4);
		this.propSize=Vec(3,27).scl(2);
		this.propTexPos=Vec(472,523);
		this.propTexSize=Vec(3,27);
		this.propOffset=Vec(0,0);

		this.propTime=0;
		this.propSpeed=0;
	}
	runCustom(timeStep){
		super.runCustom(timeStep);
		this.propSpeed*=0.95;
		this.propTime+=this.propSpeed;
	}
	boostEffect(strength,timeStep){
		this.propSpeed+=0.003*timeStep;
	}
	display(){
		super.display();

		let flip=nrmAngPI(this.angle+PI/2)<0;

		let propP=this.propPos.cln();
		if(flip){
			propP.y*=-1;
		}
		propP.rot(this.angle).add(this.pos);
		let propHeight=Math.abs(VecA(1,this.propTime*TAU).x);
		renderer.img(
			propP.x,propP.y,
			this.propSize.x,this.propSize.y*propHeight,
			this.angle,
			this.propTexPos.x,
			this.propTexPos.y,
			this.propTexSize.x,
			this.propTexSize.y,
			flip,
			this.displayOffset.x,
			this.displayOffset.y);

	}
}
//apply mixin
Object.assign(WrightFlyer.prototype,shapeMixin.rect);

class Raptor extends Plane{
	constructor(p,a,l){
		super(p,a,l);

		this.thrustSound=gameRunner.sounds.rocket;
		this.thrustSoundSpeed=2;

		this.thrustLimit=1;
		this.thrustRecover=0.4;
		this.thrustPotential=15;
		this.thrustPotLim=15;
		this.transfer=0.2;

		this.agilityMin=0.06;
		this.agilityMax=0.08;
		this.agilityFall=0.08;

		this.maxHealth=1000;
		this.health=this.maxHealth;
		
		this.cooldown=0;
		this.cooldownMax=5;
		this.bulletSpeed=75+10*(this.level-1);
		this.bulletRange=100;
		this.bulletSize=6*this.level;
		this.bulletDamage=3+(this.level-1);
		this.accuracy=0.02;

		this.buoyancy=Vec(0,-0.7);

		this.displaySize=Vec(103,36).scl(2);
		this.texPos=Vec(272,109);
		this.texSize=Vec(103,36);
		this.displayOffset=Vec(0,0);
		this.bulletOffset=Vec(0,10);
		this.hitBoxPoly=[Vec(-30,-20),Vec(100,4),Vec(-30,34),Vec(-100,18),Vec(-90,-18)];
	}
	boostEffect(strength,timeStep){
		let hE=this.heightEfficiency();
		let offset=VecA(-this.displaySize.x/2,this.angle);
		offset.add(this.pos);

		gameRunner.thrust(offset.x,offset.y,this.velo.x,this.velo.y,
			strength/timeStep,timeStep
		);
		let m=this.velo.mag()*timeStep;
		for(let v=0;v<m;v+=20){
			let p=this.velo.cln().nrm(-v).add(offset);
			gameRunner.cloud(p.x,p.y,255,255,255,30*hE);
		}
	}
}
//#endregion

//#region Biplane
class Biplane extends Plane{
	constructor(p,a,l){
		super(p,a,l);

		this.thrustSound=gameRunner.sounds.prop;
		this.thrustSoundSpeed=.8;

		this.wingNum=this.level+1;
		if(this.level==0){
			this.wingNum=0;
		}
		let wingModifier=10;
		let wingBaseline=Math.max(0,this.wingNum-2);
		let wingScale=wingModifier/(wingBaseline+wingModifier);

		this.thrustLimit=0.4;
		this.thrustRecover=0.4;
		this.thrustPotential=0.4;
		this.thrustPotLim=0.4;
		
		this.agilityMin=0.06*wingScale;
		this.agilityMax=0.08*wingScale;
		this.agilityFall=0.08*wingScale;
		
		this.cooldown=0;
		this.cooldownMax=15;
		this.bulletSpeed=30;
		this.bulletRange=30;
		this.bulletSize=6;
		
		this.resistanceMin=0.999;
		this.resistanceMax=0.98;
		this.fallResistance=0.999;
		this.transfer=1-(1-0.15)*wingScale;

		this.gravity=Vec(0,0.15);
		if(this.wingNum==0){
			this.transfer=0;
			this.gravity=Vec(0,0.2);
		}
		this.buoyancy=Vec(0,-0.75);
		
		this.minSpeed=5;//min speed for lift
		this.maxSpeed=30;//speed for max efficiency
		
		this.health=500+this.wingNum*250;
		this.maxHealth=this.health;
		
		this.displaySize=Vec(72,32).scl(2);
		this.texPos=Vec(1,65);
		this.texSize=Vec(72,32);
		this.displayOffset=Vec(-20,4);
		
		this.propSize=Vec(3,30).scl(2);
		this.propPos=Vec(74,-6);
		this.propTime=0;
		this.propSpeed=0;
		this.propIdxs=[0,1,2,1];
		this.propTexPos=[Vec(74,65),Vec(78,65),Vec(82,65)];
		this.propTexSize=Vec(3,30);
		
		this.wingSize=Vec(24,4).scl(2);
		this.wingPos=Vec(42,-13);
		this.wingGap=Vec(0,-21).scl(2);
		this.wingTexPos=Vec(86,117);
		this.wingTexSize=Vec(24,4);
		if(this.wingNum%2==1){
			this.wingPos.y=-4;
		}

		this.supportSize=Vec(1,1).scl(2);
		this.supportPos1=Vec(-13,0);
		this.supportPos2=Vec(15,0);
		this.supportTexPos=Vec(111,117);
		this.supportTexSize=Vec(1,1);

		this.hitBoxPoly=[Vec(50,-20),Vec(50,16),Vec(-86,10),Vec(-86,-10)];
	}
	shoot(bulletsArr){
		if(this.cooldown<=0){
			let ra=(Math.random()-0.5)*2*this.accuracy;
			let s=this.bulletSpeed;
			
			let wingHeight=(this.wingNum-1)*this.wingGap.y;
			let maxShotSounds=5;
			for(let i=0;i<this.wingNum;i++){
				let w=i/Math.max((this.wingNum-1),1);
				let wingP=this.wingPos.cln();
				wingP.x+=this.wingSize.x/2;
				wingP.y+=wingHeight*w-wingHeight/2;
				wingP.add(this.displayOffset);
				if(Math.cos(this.angle)<0){
					wingP.y*=-1;
				}
				wingP.rot(this.angle).add(this.pos);

				let pVelo=VecA(s,this.angle+ra);
				pVelo.add(this.velo);
				bulletsArr.push(new Bullet(wingP,pVelo,this.bulletDamage,this.bulletSize,this.bulletRange).init());
				if(i<maxShotSounds){
					gameRunner.sounds.gunshot.play(this.pos,i/Math.min(maxShotSounds,this.wingNum)*.1,1.5*random(1,1.2));
				}
			}
			if(this.wingNum==0){
				let wingP=this.wingPos.cln();
				wingP.x+=this.wingSize.x/2;
				wingP.add(this.displayOffset);
				if(Math.cos(this.angle)<0){
					wingP.y*=-1;
				}
				wingP.rot(this.angle).add(this.pos);

				let pVelo=VecA(s,this.angle+ra);
				pVelo.add(this.velo);
				bulletsArr.push(new Bullet(wingP,pVelo,this.bulletDamage,this.bulletSize,this.bulletRange).init());
				gameRunner.sounds.gunshot.play(this.pos,0,1.5*random(1,1.2));
			}
			this.cooldown=this.cooldownMax;
		}
	}
	runCustom(timeStep){
		super.runCustom(timeStep);
		this.propSpeed*=.9**timeStep;
		this.propTime=(this.propTime+this.propSpeed*timeStep)%(this.propIdxs.length);
	}
	boostEffect(strength,timeStep){
		this.propSpeed+=0.1*timeStep;
	}
	display(disp,renderer){
		let flip=nrmAngPI(this.angle+PI/2)<0;
		let propP=this.propPos.cln();
		if(flip){
			propP.y*=-1;
		}
		propP.rot(this.angle).add(this.pos);
		let propI=this.propIdxs[Math.floor(this.propTime)];
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
		renderer.img(
			propP.x,propP.y,
			this.propSize.x,this.propSize.y,
			this.angle,
			this.propTexPos[propI].x,
			this.propTexPos[propI].y,
			this.propTexSize.x,
			this.propTexSize.y,
			flip,
			this.displayOffset.x,
			this.displayOffset.y);

		let wingHeight=(this.wingNum-1)*this.wingGap.y;
		if(this.wingNum>=2){
			{
				let supportP=this.wingPos.cln().add(this.supportPos1);
				if(flip){
					supportP.y*=-1;
				}
				supportP.rot(this.angle).add(this.pos);
				renderer.img(
					supportP.x,supportP.y,
					this.supportSize.x,this.supportSize.y+wingHeight,
					this.angle,
					this.supportTexPos.x,
					this.supportTexPos.y,
					this.supportTexSize.x,
					this.supportTexSize.y,
					flip,
					this.displayOffset.x,
					this.displayOffset.y);
			}
			{
				let supportP=this.wingPos.cln().add(this.supportPos2);
				if(flip){
					supportP.y*=-1;
				}
				supportP.rot(this.angle).add(this.pos);
				renderer.img(
					supportP.x,supportP.y,
					this.supportSize.x,this.supportSize.y+wingHeight,
					this.angle,
					this.supportTexPos.x,
					this.supportTexPos.y,
					this.supportTexSize.x,
					this.supportTexSize.y,
					flip,
					this.displayOffset.x,
					this.displayOffset.y);
			}
		}
		for(let i=0;i<this.wingNum;i++){
			let w=i/Math.max((this.wingNum-1),1);
			let wingP=this.wingPos.cln();
			wingP.y+=wingHeight*w-wingHeight/2;
			if(flip){
				wingP.y*=-1;
			}
			wingP.rot(this.angle).add(this.pos);
			renderer.img(
				wingP.x,wingP.y,
				this.wingSize.x,this.wingSize.y,
				this.angle,
				this.wingTexPos.x,
				this.wingTexPos.y,
				this.wingTexSize.x,
				this.wingTexSize.y,
				flip,
				this.displayOffset.x,
				this.displayOffset.y);
		}
		gameRunner.shadow(this.pos.x,this.pos.y,(this.hitbox[1].x-this.hitbox[0].x)/2);
	}
}
//#endregion

//#region Bomber
class Bomber extends Plane{
	constructor(p,a,l){
		super(p,a,l);
		
		this.thrustSound=gameRunner.sounds.rocket;
		this.thrustSoundSpeed=2;

		this.thrustLimit=0.4;
		this.thrustRecover=0.3;
		this.thrustPotential=1;
		this.thrustPotLim=1;
		
		this.agilityMin=0.03;
		this.agilityMax=0.05;
		this.agilityFall=0.05;

		this.buoyancy=Vec(0,-0.6);
		
		this.ceilingStart=4000;
		this.ceilingEnd=10000;

		this.cooldownMax=6;
		this.bulletDamage=1;
		this.bulletSpeed=12;
		this.bulletSize=13;
		this.bulletRange=200;
		switch(this.level){
			case 0:
				this.bulletSize=12;
				this.cooldownMax=10;
				this.bulletDamage=1;
				break;
			case 2:
				this.bulletSize=23;
				this.cooldownMax=10;
				this.bulletDamage=2;
				break;
			case 3:
				this.bulletSize=45;
				this.cooldownMax=20;
				this.bulletDamage=3;
				break;
			case 4:
				this.bulletSize=45;
				this.cooldownMax=10;
				this.bulletDamage=3;
				break;
			default:
				this.bulletSize=13;
		}

		this.minSpeed=10;
		this.maxSpeed=80;
		
		this.resistanceMin=0.999;
		this.resistanceMax=0.95;
		this.fallResistance=0.999;
		this.transfer=0.2;
		
		this.maxHealth=400;
		this.health=this.maxHealth;

		this.displaySize=Vec(70,57).scl(2);
		this.texPos=Vec(90,1);
		this.texSize=Vec(70,57);
		this.displayOffset=Vec(0,0);
		this.hitBoxPoly=[Vec(-40,-54),Vec(-66,-40),Vec(-66,40),Vec(-40,50),Vec(70,0)];
	}
	shoot(bulletsArr){
		if(this.cooldown<=0){
			let ra=(Math.random()-0.5);
			let s=this.bulletSpeed;
			let pVelo=VecA(s,-PI/2+ra);
			pVelo.add(this.velo);
			let pPos=Vec(0,0);
			pPos.add(this.pos);
			switch(this.level){
				case 0:
					bulletsArr.push(new FlowerPot(pPos,pVelo,this.bulletDamage,this.bulletSize,this.bulletRange).init());
					break;
				case 2:
					bulletsArr.push(new BigBomb(pPos,pVelo,this.bulletDamage,this.bulletSize,this.bulletRange).init());
					break;
				case 3:
					bulletsArr.push(new HugeBomb(pPos,pVelo,this.bulletDamage,this.bulletSize,this.bulletRange).init());
					break;
				case 4:
					bulletsArr.push(new HugeBomb(pPos,pVelo,this.bulletDamage,this.bulletSize,this.bulletRange).init());
					break;
				default:
					bulletsArr.push(new Bomb(pPos,pVelo,this.bulletDamage,this.bulletSize,this.bulletRange).init());
					break;
			}
			this.cooldown=this.cooldownMax;
		}
	}
}

class BlackBird extends Plane{
	constructor(p,a,l){
		super(p,a,l);

		this.thrustSound=gameRunner.sounds.rocket;
		this.thrustSoundSpeed=2;

		this.thrustLimit=0.4;
		this.thrustRecover=0.3;
		this.thrustPotential=1;
		this.thrustPotLim=1;
		
		this.agilityMin=0.02;
		this.agilityMax=0.04;
		this.agilityFall=0.04;

		this.buoyancy=Vec(0,-0.6);
		
		this.ceilingStart=4000;
		this.ceilingEnd=10000;

		this.cooldownMax=Math.ceil(100/this.level);
		this.cooldown=this.cooldownMax;
		this.bulletDamage=10;
		this.bulletSpeed=20;
		this.bulletRange=250;
		this.bulletSize=76;

		this.minSpeed=10;
		this.maxSpeed=80;

		this.maxHealth=800;
		this.health=this.maxHealth;
		
		this.resistanceMin=0.999;
		this.resistanceMax=0.98;
		this.fallResistance=0.999;
		this.transfer=0.2;
		
		this.displaySize=Vec(203,68).scl(2);
		this.texPos=Vec(149,385);
		this.texSize=Vec(203,68);
		this.displayOffset=Vec(60,0);
		this.thrusterPos1=Vec(-100,-21).scl(2);
		this.thrusterPos2=Vec(-100,14).scl(2);

		this.waveSize=8;
		this.hitBoxPoly=[Vec(-10,-50),Vec(-120,-50),Vec(-120,60),Vec(50,6),Vec(160,6),Vec(260,-12),Vec(190,-24),Vec(30,-24)];
	}
	boostEffect(strength,timeStep){
		let hE=this.heightEfficiency();

		let offset1=VecA(this.thrusterPos1).add(this.displayOffset);
		let offset2=VecA(this.thrusterPos2).add(this.displayOffset);
		let flip=nrmAngPI(this.angle+PI/2)<0;
		if(flip){
			offset1.y*=-1;
			offset2.y*=-1;
		}
		offset1.rot(this.angle);
		offset2.rot(this.angle);
		offset1.add(this.pos);
		offset2.add(this.pos);
		gameRunner.thrust(offset1.x,offset1.y,this.velo.x,this.velo.y,
			strength/timeStep,timeStep
		);
		gameRunner.thrust(offset2.x,offset2.y,this.velo.x,this.velo.y,
			strength/timeStep,timeStep
		);
		let m=this.velo.mag()*timeStep;
		for(let v=0;v<m;v+=20){
			let p1=this.velo.cln().nrm(-v).add(offset1);
			let p2=this.velo.cln().nrm(-v).add(offset2);
			gameRunner.cloud(p1.x,p1.y,255,255,255,30*hE);
			gameRunner.cloud(p2.x,p2.y,255,255,255,30*hE);
		}
	}
	shoot(bulletsArr){
		if(this.cooldown<=0){
			let ra=(Math.random()-0.5);
			let s=this.bulletSpeed;
			let pVelo=VecA(s,-PI/2+ra);
			pVelo.add(this.velo);
			let pPos=Vec(0,0);
			pPos.add(this.pos);
			bulletsArr.push(new Nuke(pPos,pVelo,this.bulletDamage,this.bulletSize,this.bulletRange).init());
			this.cooldown=this.cooldownMax;
		}
	}
}
//#endregion

//#region WarPlane
class BuzzBomb extends Plane{
	constructor(p,a,l){
		super(p,a,l);

		this.thrustSound=gameRunner.sounds.rocket;
		this.thrustSoundSpeed=2.5;
		this.thrustSoundVolume=.25;

		this.thrustLimit=0.4;
		this.thrustRecover=0.4;
		this.thrustPotential=0.4;
		this.thrustPotLim=0.4;
		
		this.agilityMin=0.06;
		this.agilityMax=0.06;
		this.agilityFall=0.06;

		this.buoyancy=Vec(0,-0.8);
		
		this.ceilingStart=4000;
		this.ceilingEnd=10000;

		this.minSpeed=10;
		this.maxSpeed=20;
		
		this.maxHealth=100;
		this.health=this.maxHealth;

		this.size=Vec(60,25).scl(2);
		this.displaySize=this.size.cln();
		this.texPos=Vec(299,183);
		this.texSize=Vec(60,25);
		this.offset=Vec(0,0);
		this.displayOffset=Vec(0,0);

		this.waveSize=2;
		this.splashSize=5;
		this.damage=1000;
	}
	runSpecial(arrays){
		let a2=arrays["aliens"];
		for(let j=0;j<a2.length;j++){
			this.tryHit(a2[j],false,true);
		}
	}
	hit(target,special){
		if(special){
			gameRunner.bombExplode(this.pos.x,this.pos.y,20,this.damage);
			this.health=0;
		}else{
			super.hit(target);
		}
	}
	shoot(){
	}
	boostEffect(strength,timeStep){
		let hE=this.heightEfficiency();
		
		let flip=nrmAngPI(this.angle+PI/2)<0;
		let offset=Vec(-this.displaySize.x/2,-20);
		if(flip){
			offset.y*=-1;
		}
		offset.rot(this.angle);
		offset.add(this.pos);

		gameRunner.thrust(offset.x,offset.y,this.velo.x,this.velo.y,
			strength*0.3/timeStep,timeStep
		);
		let m=this.velo.mag()*timeStep;
		for(let v=0;v<m;v+=20){
			let p=this.velo.cln().nrm(-v).add(offset);
			gameRunner.cloud(p.x,p.y,255,255,255,15*hE);
		}
	}
}
//apply mixin
Object.assign(BuzzBomb.prototype,shapeMixin.rect);

class WarPlane extends Plane{
	constructor(p,a,l){
		super(p,a,l);

		this.thrustSound=gameRunner.sounds.prop;
		this.thrustSoundSpeed=0.6;

		this.thrustLimit=1;
		this.thrustRecover=0.3;
		this.thrustPotential=10;
		this.thrustPotLim=10;
		
		this.agilityMin=0.04;
		this.agilityMax=0.05;
		this.agilityFall=0.05;
		
		this.buoyancy=Vec(0,-0.6);
		
		this.cooldown=0;
		this.cooldownMax=6;
		this.bulletSpeed=50;
		this.bulletRange=100;
		this.bulletSize=6;

		this.canBomb=this.level>1;
		this.bombCooldown=0;
		this.bombCooldownMax=20;
		switch(this.level){
			case 2:
				this.bombCooldownMax=20;
				break;
			case 3:
				this.bombCooldownMax=10;
				break;
			case 4:
				this.bombCooldownMax=5;
				break;
		}
		this.bombSpeed=12;
		this.bombRange=200;
		this.bombSize=13;
		this.bombDamage=1;
		
		this.resistanceMin=0.999;
		this.resistanceMax=0.98;
		this.fallResistance=0.999;
		this.transfer=0.3;
		
		this.minSpeed=10;//min speed for lift
		this.maxSpeed=40;//speed for max efficiency
		
		this.maxHealth=1000+this.level*100;
		this.health=this.maxHealth;
		
		this.displaySize=Vec(75,32).scl(2);
		this.texPos=Vec(161,1);
		this.texSize=Vec(75,32);
		
		this.propSize=Vec(6,27).scl(2);
		this.propPos=Vec(80.9,-9);
		this.propTime=0;
		this.propSpeed=0;
		this.propIdxs=[0,1,2,1];
		this.propTexPos=[Vec(237,1),Vec(244,1),Vec(251,1)];
		this.propTexSize=Vec(6,27);
		this.displayOffset=Vec(-20,8);
		this.hitBoxPoly=[Vec(-20,-14),Vec(50,-14),Vec(50,14),Vec(-90,5),Vec(-90,-5)];
	}
	runCustom(timeStep){
		super.runCustom(timeStep);
		if(this.bombCooldown>0){
			this.bombCooldown-=timeStep;
		}
		this.propSpeed*=0.9**timeStep;
		this.propTime=(this.propTime+this.propSpeed*timeStep)%(this.propIdxs.length);
	}
	boostEffect(strength,timeStep){
		this.propSpeed+=0.1*timeStep;
	}
	display(disp,renderer){
		// disp.circle2(this.pos.x,this.pos.y,10,10);
		let flip=nrmAngPI(this.angle+PI/2)<0;
		let propP=this.propPos.cln();
		if(flip){
			propP.y*=-1;
		}
		propP.rot(this.angle).add(this.pos);
		let propI=this.propIdxs[Math.floor(this.propTime)];
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
		renderer.img(
			propP.x,propP.y,
			this.propSize.x,this.propSize.y,
			this.angle,
			this.propTexPos[propI].x,
			this.propTexPos[propI].y,
			this.propTexSize.x,
			this.propTexSize.y,
			flip,
			this.displayOffset.x,
			this.displayOffset.y);
		gameRunner.shadow(this.pos.x,this.pos.y,(this.hitbox[1].x-this.hitbox[0].x)/2);
	}
	shoot(bulletsArr,timeStep){
		if(this.canBomb&&this.bombCooldown<=0){
			let ra=(Math.random()-0.5);
			let s=this.bombSpeed;
			let pVelo=VecA(s,-PI/2+ra);
			pVelo.add(this.velo);
			let pPos=Vec(0,0);
			pPos.add(this.pos);
			bulletsArr.push(new Bomb(pPos,pVelo,this.bombDamage,this.bombSize,this.bombRange).init());
			this.bombCooldown=this.bombCooldownMax;
		}
		super.shoot(bulletsArr,timeStep);
	}
}

class Corsair extends Plane{
	constructor(p,a,l){
		super(p,a,l);

		this.thrustSound=gameRunner.sounds.prop;
		this.thrustSoundSpeed=0.3;

		this.thrustLimit=1;
		this.thrustRecover=0.4;
		this.thrustPotential=10;
		this.thrustPotLim=10;
		
		this.agilityMin=0.04;
		this.agilityMax=0.05;
		this.agilityFall=0.05;
		
		this.buoyancy=Vec(0,-0.7);
		
		this.cooldown=0;
		this.cooldownMax=4-(this.level-1);
		this.bulletSpeed=50;
		this.bulletRange=80;
		this.bulletSize=6;
		this.bulletDamage=3;
		this.accuracy=0.05*this.level;
		
		this.resistanceMin=0.999;
		this.resistanceMax=0.98;
		this.fallResistance=0.999;
		this.transfer=0.15;
		
		this.minSpeed=10;//min speed for lift
		this.maxSpeed=40;//speed for max efficiency
		
		this.maxHealth=2000;
		this.health=this.maxHealth;
		
		this.displaySize=Vec(106,53).scl(2);
		this.texPos=Vec(353,415);
		this.texSize=Vec(106,53);
		this.displayOffset=Vec(-20,8);
		this.bulletOffset=Vec(-10,-2);
		
		this.propSize=Vec(3,44).scl(2);
		this.propPos=Vec(110.9,-11);
		this.propTime=0;
		this.propSpeed=0;
		this.propTexPos=Vec(461,415);
		this.propTexSize=Vec(3,44);

		this.noseSize=Vec(7,6).scl(2);
		this.nosePos=Vec(112.9,-11);
		this.noseTexPos=Vec(465,415);
		this.noseTexSize=Vec(7,6);
		this.hitBoxPoly=[Vec(-20,-20),Vec(80,-20),Vec(80,14),Vec(-120,14),Vec(-120,-5)];
	}
	runCustom(timeStep){
		super.runCustom(timeStep);
		this.propSpeed*=0.95**timeStep;
		this.propTime+=this.propSpeed*timeStep;
	}
	boostEffect(strength,timeStep){
		this.propSpeed+=0.005*timeStep;
	}
	shoot(bulletsArr){
		if(this.cooldown<=0){
			let shots=Math.max(-this.cooldownMax-1,1);
			let maxShotSounds=5;
			for(let i=0;i<shots;i++){
				let flip=nrmAngPI(this.angle+PI/2)<0;
				let ra=(Math.random()-0.5)*2*this.accuracy;
				let s=this.bulletSpeed;
				let pVelo=VecA(s,this.angle+ra);
				pVelo.add(this.velo);
				let pPos=Vec(this.displaySize.x/2,0).add(this.bulletOffset);
				if(flip){
					pPos.y*=-1;
				}
				pPos.rot(this.angle);
				pPos.add(this.pos);
				if(shots>5){
					bulletsArr.push(new BulletLite(pPos,pVelo,this.bulletDamage,this.bulletSize,this.bulletRange).init());
					// bulletsArr.push(new BulletExtraLite(pPos,pVelo,this.bulletDamage,this.bulletSize,this.bulletRange).init());
				}else if(shots>1){
					bulletsArr.push(new BulletLite(pPos,pVelo,this.bulletDamage,this.bulletSize,this.bulletRange).init());
				}else{
					bulletsArr.push(new Bullet(pPos,pVelo,this.bulletDamage,this.bulletSize,this.bulletRange).init());
				}
				this.cooldown=Math.max(this.cooldownMax,0);
				if(i<maxShotSounds){
					gameRunner.sounds.gunshot.play(this.pos,i/Math.min(maxShotSounds,shots)*.1,random(1,1.2));
				}
			}
		}
	}
	display(disp,renderer){
		// disp.circle2(this.pos.x,this.pos.y,10,10);
		let flip=nrmAngPI(this.angle+PI/2)<0;
		let propP=this.propPos.cln();
		let noseP=this.nosePos.cln();
		if(flip){
			propP.y*=-1;
			noseP.y*=-1;
		}
		propP.rot(this.angle).add(this.pos);
		noseP.rot(this.angle).add(this.pos);
		let propHeight=Math.abs(VecA(1,this.propTime*TAU).x);
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
		renderer.img(
			noseP.x,noseP.y,
			this.noseSize.x,this.noseSize.y,
			this.angle,
			this.noseTexPos.x,
			this.noseTexPos.y,
			this.noseTexSize.x,
			this.noseTexSize.y,
			flip,
			this.displayOffset.x,
			this.displayOffset.y);
		renderer.img(
			propP.x,propP.y,
			this.propSize.x,this.propSize.y*propHeight,
			this.angle,
			this.propTexPos.x,
			this.propTexPos.y,
			this.propTexSize.x,
			this.propTexSize.y,
			flip,
			this.displayOffset.x,
			this.displayOffset.y);
		gameRunner.shadow(this.pos.x,this.pos.y,(this.hitbox[1].x-this.hitbox[0].x)/2);
	}
}
//#endregion

//#region Triebflugel
class MadBall extends Plane{
	constructor(p,a,l){
		super(p,a,l);
		
		this.thrustLimit=0.5;
		this.thrustRecover=0.5;
		this.thrustPotential=0.5;
		this.thrustPotLim=0.5;
		
		this.agilityMin=0.04;
		this.agilityMax=0.05;
		this.agilityFall=0.05;
		
		this.buoyancy=Vec(0,-0.9);
		
		this.resistanceMin=0.999;
		this.resistanceMax=0.98;
		this.fallResistance=0.999;
		this.transfer=0.15;

		this.minSpeed=10;
		this.maxSpeed=80;

		this.maxHealth=2000;
		this.health=this.maxHealth;

		this.sizeBase=42;
		this.size=this.sizeBase;
		this.texPos=Vec(272,23);
		this.texSize=Vec(42,42);
		this.displayOffset=Vec(0,0);

		this.damage=1;
		this.grow=1;
		
		this.propNum=3;
		this.propSize=Vec(6,35).scl(2);
		this.propMidSize=Vec(0,20).scl(2);
		this.propPos=Vec(0,0);
		this.propTime=0;
		this.propSpeed=0;
		this.propTexPos=Vec(315,1);
		this.propTexSize=Vec(6,35);

		this.bodyAngle=0;
		this.bodySize=Vec(52,10).scl(2);
		this.bodyPos=Vec(0,0);
		this.bodyTexPos=Vec(262,1);
		this.bodyTexSize=Vec(52,10);
	}
	runSpecial(arrays){
		let a2=arrays["aliens"];
		for(let j=0;j<a2.length;j++){
			this.tryHit(a2[j],false,true);
		}
	}
	hit(target,special){
		if(special){
			if(this.propSpeed>0.05){
				let sparkP=target.getPos(this.pos).sub(this.pos).nrm(this.size).add(this.pos);
				gameRunner.spark(sparkP.x,sparkP.y,0,0,0);
				target.hurt(this.damage,this);
				this.grow+=0.005;
			}
		}else{
			super.hit(target);
		}
		let shoveDir=target.getPos(this.pos).sub(this.pos).nrm(this.propSpeed*200);
		target.shove(shoveDir);
	}
	shoot(){
	}
	runCustom(timeStep){
		super.runCustom(timeStep);
		this.size=this.sizeBase*this.grow;
		// this.bodyAngle+=clamp(nrmAngPI(this.angle-this.bodyAngle),-0.03,0.03);
		this.bodyAngle+=nrmAngPI(this.angle-this.bodyAngle)/10*timeStep;
		this.propSpeed*=0.95**timeStep;
		this.propTime+=this.propSpeed*timeStep;
	}
	boostEffect(strength,timeStep){
		this.propSpeed+=0.005*timeStep;
	}
	display(){
		let flip=nrmAngPI(this.angle+PI/2)<0;
		
		for(let i=0;i<this.propNum;i++){
			let propR=VecA(1,(this.propTime+i/this.propNum)*TAU);
			let propHeight=propR.x;
			if(propR.y<0){
				continue;
			}
			let propP=this.propPos.cln()
				.add(this.propMidSize.cln().scl(propHeight*this.grow))
				.add(this.propSize.cln().scl(Vec(0,propHeight/2*this.grow)));
			if(flip){
				propP.y*=-1;
			}
			propP.rot(this.angle-PI/2).add(this.pos);
			renderer.img(
				propP.x,propP.y,
				this.propSize.x*this.grow,this.propSize.y*propHeight*this.grow,
				this.angle-PI/2,
				this.propTexPos.x,
				this.propTexPos.y,
				this.propTexSize.x,
				this.propTexSize.y,
				flip,
				this.displayOffset.x,
				this.displayOffset.y);
		}
		renderer.img(
			this.pos.x,this.pos.y,
			this.size*2,this.size*2,
			this.bodyAngle,
			this.texPos.x,
			this.texPos.y,
			this.texSize.x,
			this.texSize.y,
			false,
			this.displayOffset.x,
			this.displayOffset.y);
		
		renderer.img(
			this.pos.x,this.pos.y,
			this.bodySize.x*this.grow,this.bodySize.y*this.grow,
			this.angle,
			this.bodyTexPos.x,
			this.bodyTexPos.y,
			this.bodyTexSize.x,
			this.bodyTexSize.y,
			flip,
			this.displayOffset.x,
			this.displayOffset.y);
		
		for(let i=0;i<this.propNum;i++){
			let propR=VecA(1,(this.propTime+i/this.propNum)*TAU);
			let propHeight=propR.x;
			if(propR.y>0){
				continue;
			}
			let propP=this.propPos.cln()
				.add(this.propMidSize.cln().scl(propHeight*this.grow))
				.add(this.propSize.cln().scl(Vec(0,propHeight/2*this.grow)));
			if(flip){
				propP.y*=-1;
			}
			propP.rot(this.angle-PI/2).add(this.pos);
			renderer.img(
				propP.x,propP.y,
				this.propSize.x*this.grow,this.propSize.y*propHeight*this.grow,
				this.angle-PI/2,
				this.propTexPos.x,
				this.propTexPos.y,
				this.propTexSize.x,
				this.propTexSize.y,
				flip,
				this.displayOffset.x,
				this.displayOffset.y);
		}
		
		gameRunner.shadow(this.pos.x,this.pos.y,(this.hitbox[1].x-this.hitbox[0].x)/2);
	}
}
//apply mixin
Object.assign(MadBall.prototype,shapeMixin.circ);

class Triebflugel extends Plane{
	constructor(p,a,l){
		super(p,a,l);

		this.thrustSound=gameRunner.sounds.rocket;
		this.thrustSoundSpeed=2.5;

		this.propNum=3;

		this.thrustLimit=2;
		this.thrustRecover=0.2*(1+(this.level-1)/4);
		this.thrustPotential=8;
		this.thrustPotLim=8;
		
		this.agilityMin=0.04;
		this.agilityMax=0.06;
		this.agilityFall=0.03;
		
		this.buoyancy=Vec(0,-0.6);
		
		this.cooldown=0;
		this.cooldownMax=100;
		this.bulletSpeed=50;
		this.bulletRange=100;
		this.bulletSize=6;
		this.bulletDamage=2;
		
		this.resistanceMin=0.9999;
		this.resistanceMax=0.998;
		this.fallResistance=0.9999;
		this.transfer=0.2;
		
		this.minSpeed=10;//min speed for lift
		this.maxSpeed=80;//speed for max efficiency
		
		this.maxHealth=400;
		this.health=this.maxHealth;
		
		this.displaySize=Vec(87,47).scl(2);
		this.texPos=Vec(211,197);
		this.texSize=Vec(87,47);
		this.displayOffset=Vec(-19,0);
		
		this.propSize=Vec(9,30).scl(2);
		this.propMidSize=Vec(0,15/2).scl(2);
		this.propPos=Vec(19,0);
		this.propTime=0;
		this.propSpeed=0;
		this.propTexPos=Vec(193,255);
		this.propTexSize=Vec(9,1);

		this.engineSize=Vec(15,9).scl(2).scl(this.level);
		this.engineTexPos=Vec(193,259);
		this.engineTexSize=Vec(15,9);
		this.hitBoxPoly=[Vec(-80,-14),Vec(50,-14),Vec(70,0),Vec(50,14),Vec(-80,14)];
	}
	runCustom(timeStep){
		super.runCustom(timeStep);
		this.propSpeed*=0.95**timeStep;
		this.propTime+=this.velo.mag()/1000*timeStep;
		this.cooldown-=this.velo.mag()/4*timeStep;
	}
	shoot(bulletsArr){
		if(this.cooldown<=0){
			let ra=(Math.random()-0.5)*2*this.accuracy;
			let s=this.bulletSpeed;
			let pVelo=VecA(s,this.angle+ra);
			pVelo.add(this.velo);

			let flip=nrmAngPI(this.angle+PI/2)<0;
			for(let i=0;i<this.propNum;i++){
				let propR=VecA(1,(this.propTime+i/this.propNum)*TAU);
				let propHeight=propR.x;
				let propP=this.propPos.cln()
					.add(this.propMidSize.cln().scl(propHeight))
					.add(this.propSize.cln().scl(Vec(0,propHeight/2)));
				let engineP=propP.cln();
				engineP.y+=(this.propSize.y*propHeight/2);
				engineP.add(this.displayOffset);
				if(flip){
					propP.y*=-1;
					engineP.y*=-1;
				}
				engineP.rot(this.angle).add(this.pos);
				
				bulletsArr.push(new BulletLite(engineP,pVelo,this.bulletDamage,this.bulletSize,this.bulletRange).init());
				gameRunner.sounds.gunshot.play(this.pos,0,random(1,1.2));
			}

			this.cooldown=this.cooldownMax;
		}
	}
	boostEffect(strength,timeStep){
		let hE=this.heightEfficiency();

		let flip=nrmAngPI(this.angle+PI/2)<0;
		for(let i=0;i<this.propNum;i++){
			let propR=VecA(1,(this.propTime+i/this.propNum)*TAU);
			let propHeight=propR.x;
			let propP=this.propPos.cln()
				.add(this.propMidSize.cln().scl(propHeight))
				.add(this.propSize.cln().scl(Vec(0,propHeight/2)));
			let engineP=propP.cln();
			engineP.y+=(this.propSize.y*propHeight/2);
			engineP.add(this.displayOffset);
			if(flip){
				propP.y*=-1;
				engineP.y*=-1;
			}
			let engineEnd=engineP.cln().add(Vec(-this.engineSize.x/2,0)).rot(this.angle).add(this.pos);

			gameRunner.thrust(engineEnd.x,engineEnd.y,this.velo.x,this.velo.y,
				strength/timeStep,timeStep
			);
		}
		let m=this.velo.mag()*timeStep;
		for(let v=0;v<m;v+=20){
			let t=this.propTime+v/m*this.propSpeed;
			for(let i=0;i<this.propNum;i++){
				let propR=VecA(1,(t+i/this.propNum)*TAU);
				let propHeight=propR.x;
				let propP=this.propPos.cln()
					.add(this.propMidSize.cln().scl(propHeight))
					.add(this.propSize.cln().scl(Vec(0,propHeight/2)));
				let engineP=propP.cln();
				engineP.y+=(this.propSize.y*propHeight/2);
				engineP.add(this.displayOffset);
				if(flip){
					propP.y*=-1;
					engineP.y*=-1;
				}
				let engineEnd=engineP.cln().add(Vec(-this.engineSize.x/2,0)).rot(this.angle).add(this.pos).add(this.velo);

				let p=this.velo.cln().nrm(-v).add(engineEnd);
				gameRunner.cloud(p.x,p.y,255,255,255,30*hE);
			}
		}
	}
	display(disp,renderer){
		// disp.circle2(this.pos.x,this.pos.y,10,10);
		let flip=nrmAngPI(this.angle+PI/2)<0;
		
		for(let i=0;i<this.propNum;i++){
			let propR=VecA(1,(this.propTime+i/this.propNum)*TAU);
			let propHeight=propR.x;
			if(propR.y<0){
				continue;
			}
			let propP=this.propPos.cln()
				.add(this.propMidSize.cln().scl(propHeight))
				.add(this.propSize.cln().scl(Vec(0,propHeight/2)));
			let engineP=propP.cln();
			engineP.y+=(this.propSize.y*propHeight/2);
			engineP.add(this.displayOffset);
			let engineAng=PI/12;
			if(flip){
				propP.y*=-1;
				engineP.y*=-1;
				engineAng*=-1;
			}
			propP.rot(this.angle).add(this.pos);
			engineP.rot(this.angle).add(this.pos);
			renderer.img(
				propP.x,propP.y,
				this.propSize.x,this.propSize.y*propHeight,
				this.angle,
				this.propTexPos.x,
				this.propTexPos.y,
				this.propTexSize.x,
				this.propTexSize.y,
				flip,
				this.displayOffset.x,
				this.displayOffset.y);
			renderer.img(
				engineP.x,engineP.y,
				this.engineSize.x,this.engineSize.y,
				this.angle+engineAng,
				this.engineTexPos.x,
				this.engineTexPos.y,
				this.engineTexSize.x,
				this.engineTexSize.y,
				flip);
		}
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
		
		for(let i=0;i<this.propNum;i++){
			let propR=VecA(1,(this.propTime+i/this.propNum)*TAU);
			let propHeight=propR.x;
			if(propR.y>0){
				continue;
			}
			let propP=this.propPos.cln()
				.add(this.propMidSize.cln().scl(propHeight))
				.add(this.propSize.cln().scl(Vec(0,propHeight/2)));
			let engineP=propP.cln();
			engineP.y+=(this.propSize.y*propHeight/2);
			engineP.add(this.displayOffset);
			let engineAng=PI/12;
			if(flip){
				propP.y*=-1;
				engineP.y*=-1;
				engineAng*=-1;
			}
			propP.rot(this.angle).add(this.pos);
			engineP.rot(this.angle).add(this.pos);
			renderer.img(
				propP.x,propP.y,
				this.propSize.x,this.propSize.y*propHeight,
				this.angle,
				this.propTexPos.x,
				this.propTexPos.y,
				this.propTexSize.x,
				this.propTexSize.y,
				flip,
				this.displayOffset.x,
				this.displayOffset.y);
			renderer.img(
				engineP.x,engineP.y,
				this.engineSize.x,this.engineSize.y,
				this.angle+engineAng,
				this.engineTexPos.x,
				this.engineTexPos.y,
				this.engineTexSize.x,
				this.engineTexSize.y,
				flip);
		}
		gameRunner.shadow(this.pos.x,this.pos.y,(this.hitbox[1].x-this.hitbox[0].x)/2);
	}
}

class Rocket extends Plane{
	constructor(p,a,l){
		super(p,a,l);

		this.thrustSound=gameRunner.sounds.rocket;
		this.thrustSoundSpeed=1;
		this.thrustSoundVolume=2;

		this.thrustLimit=this.level;
		this.thrustRecover=this.level;
		this.thrustPotential=this.level;
		this.thrustPotLim=this.level;
		
		this.agilityMin=0.03;
		this.agilityMax=0.03;
		this.agilityFall=0.03;

		this.ceilingStart=8000;
		this.ceilingEnd=12000;
		
		this.buoyancy=Vec(0,-1.4);
		
		this.resistanceMin=0.999;
		this.resistanceMax=0.98;
		this.fallResistance=0.999;
		this.transfer=0.1;
		
		this.minSpeed=10;//min speed for lift
		this.maxSpeed=200;//speed for max efficiency
		
		this.health=1500;
		this.maxHealth=this.health;
		
		this.displaySize=Vec(361,53).scl(2);
		this.texPos=Vec(132,681);
		this.texSize=Vec(361,53);
		this.displayOffset=Vec(-19,0);

		this.boosting=false;
		this.floodTimeMax=50;
		this.floodTime=this.floodTimeMax;
		
		this.damage=10;
		this.waveSize=5;
		this.splashSize=5;
		this.hitBoxPoly=[Vec(-370,-30),Vec(100,-30),Vec(340,0),Vec(100,30),Vec(-370,30)];
	}
	shoot(){
	}
	runCustom(timeStep){
		super.runCustom(timeStep);

		let backP=VecA(-this.displaySize.x/2-50,this.angle).add(this.pos);
		if(gameRunner.isUnderwater(backP.x,backP.y)){
			if(this.boosting){
				this.floodTime-=timeStep;
				if(this.floodTime<0){
					this.boosting=false;
				}
			}
		}else{
			this.floodTime=this.floodTimeMax;
		}

		if(this.boosting){
			this.thrustActive=true;
			let bPower=Math.min(this.thrustLimit*timeStep,this.thrustPotential);
			this.thrust+=bPower;
			this.thrustPotential-=bPower;

			gameRunner.thrust(backP.x,backP.y,this.velo.x,this.velo.y,5,timeStep);

			let m=this.velo.mag()*timeStep;
			for(let v=0;v<m;v+=20){
				for(let i=0;i<2;i++){
					let p1=this.velo.cln().nrm(-v).add(backP).add(VecA(i/2*50,this.velo.ang()+PI/2));
					gameRunner.cloud(p1.x,p1.y,255,255,255,255);
					let p2=this.velo.cln().nrm(-v).add(backP).add(VecA(-i/2*50,this.velo.ang()+PI/2));
					gameRunner.cloud(p2.x,p2.y,255,255,255,255);
				}
			}
			gameRunner.pBullets.push(new DamageField(backP,this.damage,100));
		}
	}
	boost(){
		this.boosting=true;
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
			this.displayOffset.x,
			this.displayOffset.y);
		gameRunner.shadow(this.pos.x,this.pos.y,(this.hitbox[1].x-this.hitbox[0].x)/2);
	}
}
//#endregion

//#region Helicopter
class Helicopter extends Plane{
	constructor(p,a,l){
		super(p,a,l);

		this.thrustSound=gameRunner.sounds.prop;
		this.thrustSoundSpeed=0.3;
		this.thrustSoundVolume=2;

		this.thrustLimit=2;
		this.thrustRecover=0.7;
		this.thrustPotential=10;
		this.thrustPotLim=10;
		
		this.agilityMin=0.06;
		this.agilityMax=0.06;
		this.agilityFall=0.06;
		
		this.buoyancy=Vec(0,-0.8);
		
		this.cooldown=0;
		this.cooldownMax=6;
		this.bulletSpeed=50;
		this.bulletRange=50;
		this.bulletSize=6+3*Math.max(0,this.level-1);
		this.bulletDamage=1+Math.max(0,this.level-1);
		this.accuracy=0.1;
		
		this.resistanceMin=0.999;
		this.resistanceMax=0.98;
		this.fallResistance=0.999;
		this.transfer=0;
		this.gravity=Vec(0,0.5);
		
		this.health=1000+this.level*100;
		this.maxHealth=this.health;
		
		this.displaySize=Vec(110,37).scl(2);
		this.texPos=Vec(161,67);
		this.texSize=Vec(110,37);
		this.displayOffset=Vec(-44,0);
		this.bulletOffset=Vec(0,15);
		
		this.propSize=Vec(102,3).scl(2);
		this.propPos=Vec(44,-32);
		this.propTime=0;
		this.propSpeed=0;
		this.propTexPos=Vec(161,143);
		this.propTexSize=Vec(102,3);

		this.tailSize=Vec(5,15).scl(2);
		this.tailPos=Vec(-95,-10);
		this.tailTime=0;
		this.tailTexPos=Vec(265,143);
		this.tailTexSize=Vec(5,15);
		this.hitBoxPolyBase=[Vec(-30,-14),Vec(40,-14),Vec(66,12),Vec(40,24),Vec(-150,0)];
		this.hitBoxPoly=this.hitBoxPolyBase.map(x=>x.cln());
		
		this.zoomType="mouse";
	}
	runCustom(timeStep){
		let flip=nrmAngPI(this.angle+PI/2)<0;
		if(flip){
			this.velo.add(VecA(this.thrust,this.angle+PI/2));
		}else{
			this.velo.add(VecA(this.thrust,this.angle-PI/2));
		}
		let boostAmount=this.thrust;
		this.thrust=0;
		super.runCustom(timeStep);
		if(boostAmount>0){
			this.boostEffect(boostAmount,timeStep);
		}

		this.propSpeed*=0.95**timeStep;
		this.propTime+=this.propSpeed*timeStep;
		this.tailTime+=0.4*timeStep;

		let propHeight=VecA(1,this.propTime*TAU).x;
		if(this.level==0){
			this.hitBoxPoly=this.hitBoxPolyBase.map(x=>{
				let p=x.cln();
				p.x*=propHeight;
				return p;
			});
		}
	}
	boostEffect(strength,timeStep){
		this.propSpeed+=0.005*timeStep;
	}
	shoot(bulletsArr){
		if(this.cooldown<=0){
			if(this.level==0){
				let propHeight=VecA(1,this.propTime*TAU).x;
				
				let ra=(Math.random()-0.5)*2*this.accuracy;
				let s=this.bulletSpeed;
				let pVelo=VecA(s*propHeight,this.angle+ra);
				pVelo.add(this.velo);
				let pPos=VecA(0,this.angle);
				pPos.add(this.pos);
				bulletsArr.push(new Bullet(pPos,pVelo,this.bulletDamage,this.bulletSize,this.bulletRange).init());
			}else{
				let flip=nrmAngPI(this.angle+PI/2)<0;
	
				let ra=(Math.random()-0.5)*2*this.accuracy;
				let s=this.bulletSpeed;
				let pVelo=VecA(s,this.angle+ra);
				pVelo.add(this.velo);
				let pPos=Vec(this.displaySize.x/2.,0).add(this.displayOffset).add(this.bulletOffset);
				if(flip){
					pPos.y*=-1;
				}
				pPos.rot(this.angle);
				pPos.add(this.pos);
				bulletsArr.push(new Bullet(pPos,pVelo,this.bulletDamage,this.bulletSize,this.bulletRange).init());
				this.cooldown=this.cooldownMax;
			}
			this.cooldown=this.cooldownMax;
			gameRunner.sounds.gunshot.play(this.pos,0,random(1,1.2));
		}
	}
	display(disp,renderer){
		// disp.circle2(this.pos.x,this.pos.y,10,10);
		let flip=nrmAngPI(this.angle+PI/2)<0;
		let propP=this.propPos.cln();
		let tailP=this.tailPos.cln().add(this.displayOffset);
		if(flip){
			propP.y*=-1;
			tailP.y*=-1;
		}
		propP.rot(this.angle).add(this.pos);
		tailP.rot(this.angle).add(this.pos);
		if(this.level==0){
			let propHeight=VecA(1,this.propTime*TAU).x;
			let propFlip=propHeight<0;
			let p=Vec(-this.propPos.x*propHeight,0);
			p.rot(this.angle).add(this.pos);
			let a=this.angle;
			propHeight=Math.abs(propHeight);
			if(propFlip){
				a+=PI;
			}
			renderer.img(
				p.x,p.y,
				this.displaySize.x*propHeight,this.displaySize.y,
				a,
				this.texPos.x,
				this.texPos.y,
				this.texSize.x,
				this.texSize.y,
				flip!=propFlip,
				this.displayOffset.x+this.propPos.x,
				this.displayOffset.y);
			renderer.img(
				propP.x,propP.y,
				this.propSize.x,this.propSize.y,
				this.angle,
				this.propTexPos.x,
				this.propTexPos.y,
				this.propTexSize.x,
				this.propTexSize.y,
				flip,
				this.displayOffset.x,
				this.displayOffset.y);
		}else{
			let propHeight=Math.abs(VecA(1,this.propTime*TAU).x);
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
			renderer.img(
				propP.x,propP.y,
				this.propSize.x*propHeight,this.propSize.y,
				this.angle,
				this.propTexPos.x,
				this.propTexPos.y,
				this.propTexSize.x,
				this.propTexSize.y,
				flip,
				this.displayOffset.x,
				this.displayOffset.y);
			renderer.img(
				tailP.x,tailP.y,
				this.tailSize.x,this.tailSize.y,
				this.angle+this.tailTime,
				this.tailTexPos.x,
				this.tailTexPos.y,
				this.tailTexSize.x,
				this.tailTexSize.y,
				flip);
		}
		gameRunner.shadow(this.pos.x,this.pos.y,(this.hitbox[1].x-this.hitbox[0].x)/2);
	}
}
class Chopper extends Helicopter{
	constructor(p,a,l){
		super(p,a,l);

		this.thrustLimit=2;
		this.thrustRecover=1.2;
		this.thrustPotential=10;
		this.thrustPotLim=10;
		
		this.agilityMin=0.08;
		this.agilityMax=0.08;
		this.agilityFall=0.08;
		
		this.buoyancy=Vec(0,-1);
		
		this.cooldown=0;
		this.cooldownMax=3;
		this.bulletSpeed=80;
		this.bulletRange=50;
		this.bulletSize=6*this.level;
		this.bulletDamage=3+(this.level-1);
		this.accuracy=0.01;
		
		this.resistanceMin=0.999;
		this.resistanceMax=0.98;
		this.fallResistance=0.999;
		this.transfer=0;
		this.gravity=Vec(0,0.8);
		
		this.health=1500;
		this.maxHealth=this.health;
		
		this.displaySize=Vec(130,36).scl(2);
		this.texPos=Vec(1,677);
		this.texSize=Vec(130,36);
		this.displayOffset=Vec(-41,0);
		
		this.propSize=Vec(105,3).scl(2);
		this.propPos=Vec(41,-36);
		this.propTime=0;
		this.propSpeed=0;
		this.propTexPos=Vec(1,751);
		this.propTexSize=Vec(105,3);

		this.tailSize=Vec(19,5).scl(2);
		this.tailPos=Vec(-110,-5);
		this.tailTime=0;
		this.tailTexPos=Vec(1,759);
		this.tailTexSize=Vec(19,5);

		this.bulletOffset=Vec(0,20);

		this.hitBoxPolyBase=[Vec(-60,0),Vec(-14,-30),Vec(68,-10),Vec(86,4),Vec(80,24),Vec(-160,8),Vec(-160,0)];
		this.hitBoxPoly=this.hitBoxPolyBase.map(x=>x.cln());
	}
}
//#endregion

//#region FlyingFortress
class AirLiner extends Plane{
	constructor(p,a,l){
		super(p,a,l);

		this.thrustSound=gameRunner.sounds.rocket;
		this.thrustSoundSpeed=2.5;
		this.thrustSoundVolume=.5;

		this.thrustLimit=1;
		this.thrustRecover=0.15;
		this.thrustPotential=10;
		this.thrustPotLim=10;
		
		this.agilityMin=0.03;
		this.agilityMax=0.04;
		this.agilityFall=0.04;
		
		this.cooldown=0;
		this.cooldownMax=50;
		this.bulletSize=6;
		this.bulletDamage=1;
		
		this.minSpeed=10;//min speed for lift
		this.maxSpeed=40;//speed for max efficiency
		
		this.health=1000;
		this.maxHealth=this.health;
		
		this.displaySize=Vec(191,78).scl(2);
		this.texPos=Vec(197,523);
		this.texSize=Vec(191,78);
		this.displayOffset=Vec(0,0);

		this.logoSize=Vec(13,16).scl(2);
		this.logoTexPos=Vec(389,583);
		this.logoTexSize=Vec(13,16);
		this.logoOffset=Vec(-150,-36);

		this.engineOffset=Vec(40,50);

		this.bulletOffset=Vec(0,10);
		this.hitBoxPoly=[Vec(-170,-12),Vec(150,-12),Vec(190,8),Vec(150,22),Vec(-90,22),Vec(-170,0)];
	}
	boostEffect(strength,timeStep){
		let hE=this.heightEfficiency();
		let flip=nrmAngPI(this.angle+PI/2)<0;
		
		let offset=this.engineOffset.cln();
		if(flip){
			offset.y*=-1;
		}
		offset.rot(this.angle).add(this.pos).add(this.velo);

		let m=this.velo.mag()*timeStep;
		for(let v=0;v<m;v+=20){
			let p=this.velo.cln().nrm(-v).add(offset);
			gameRunner.cloud(p.x,p.y,255,255,255,40*hE);
		}
	}
	display(disp,renderer){
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
		
		let lOff=this.logoOffset.cln();
		let lMod=1;
		if(flip){
			lOff.y*=-1;
			lMod=-1;
		}
		renderer.img(
			this.pos.x,this.pos.y,
			this.logoSize.x*lMod,this.logoSize.y*lMod,
			this.angle,
			this.logoTexPos.x,
			this.logoTexPos.y,
			this.logoTexSize.x,
			this.logoTexSize.y,
			false,
			lOff.x,
			lOff.y);
		gameRunner.shadow(this.pos.x,this.pos.y,(this.hitbox[1].x-this.hitbox[0].x)/2);
	}
}

class FlyingFortress extends Plane{
	constructor(p,a,l){
		super(p,a,l);

		this.thrustSound=gameRunner.sounds.prop;
		this.thrustSoundSpeed=0.5;
		this.thrustSoundVolume=2;

		this.thrustLimit=1;
		this.thrustRecover=0.25;
		this.thrustPotential=10;
		this.thrustPotLim=10;
		
		this.agilityMin=0.02;
		this.agilityMax=0.03;
		this.agilityFall=0.03;
		
		this.cooldown=0;
		this.cooldownMax=20;
		this.bulletSize=6;
		this.bulletDamage=1;

		this.resistanceMin=0.995;
		this.resistanceMax=0.99;
		this.fallResistance=0.995;
		
		this.buoyancy=Vec(0,-0.6);
		
		this.minSpeed=10;//min speed for lift
		this.maxSpeed=30;//speed for max efficiency
		
		this.health=2500;
		this.maxHealth=this.health;
		
		this.displaySize=Vec(191,93).scl(2);
		this.texPos=Vec(1,197);
		this.texSize=Vec(191,93);
		this.displayOffset=Vec(0,0);
		
		this.propSize=Vec(5,17).scl(2);
		this.propTime=0;
		this.propSpeed=0;
		this.propIdxs=[0,1,2,1];
		this.propTexPos=[Vec(193,219),Vec(199,219),Vec(205,219)];
		this.propTexSize=Vec(5,17);
		this.props=[Vec(135.9,12),Vec(109.9,28)];

		this.gunPos1=Vec(191,0);
		this.gunPos2=Vec(-170,-20);

		this.turretSize=Vec(13,7).scl(2);
		this.turretTexPos=Vec(193,197);
		this.turretTexSize=Vec(13,7);
		this.gunSize=Vec(7,2).scl(2);
		this.gunTexPos=Vec(193,213);
		this.gunTexSize=Vec(7,2);
		this.gunOffset=Vec(10,0);
		this.turretAngleList=Array(this.level).fill().map(x=>0);
		this.turretSpinList=Array(this.level).fill().map(x=>0);
		this.turretCooldownList=Array(this.level).fill().map(x=>0);
		this.turretPosList=[
			Vec(90,-40),Vec(60,-40),Vec(30,-35),
			Vec(45,-8)
		];
		this.turretBulletSpeed=30;
		this.turretBulletSize=4;
		this.turretBulletDamage=1;
		this.turretBulletRange=50;
		this.turretCooldownMax=Math.floor(15/this.level);
		this.hitBoxPoly=[Vec(-160,-30),Vec(130,-40),Vec(190,-20),Vec(184,0),Vec(100,18),Vec(-160,-10)];
	}
	runCustom(timeStep){
		super.runCustom(timeStep);
		this.propSpeed*=0.9**timeStep;
		this.propTime=(this.propTime+this.propSpeed*timeStep)%(this.propIdxs.length);
		for(let i=0;i<this.turretAngleList.length;i++){
			this.turretAngleList[i]+=this.turretSpinList[i]*timeStep;
			this.turretSpinList[i]=clamp(this.turretSpinList[i]+(Math.random()*2-1)*0.01*timeStep,-0.1,0.1);
		}
	}
	boostEffect(strength,timeStep){
		this.propSpeed+=0.1*timeStep;
	}
	shoot(bulletsArr,timeStep){
		if(this.cooldown<=0){
			let flip=nrmAngPI(this.angle+PI/2)<0;
			let ra=(Math.random()-0.5)*2*this.accuracy;
			let s=this.bulletSpeed;

			let pVelo1=VecA(s,this.angle+ra);
			pVelo1.add(this.velo);
			let pPos1=this.gunPos1.cln();
			let pVelo2=VecA(-s,this.angle+ra);
			pVelo2.add(this.velo);
			let pPos2=this.gunPos2.cln();
			if(flip){
				pPos1.y*=-1;
				pPos2.y*=-1;
			}
			pPos1.rot(this.angle).add(this.pos);
			pPos2.rot(this.angle).add(this.pos);

			bulletsArr.push(new Bullet(pPos1,pVelo1,this.bulletDamage,this.bulletSize,this.bulletRange).init());
			bulletsArr.push(new Bullet(pPos2,pVelo2,this.bulletDamage,this.bulletSize,this.bulletRange).init());

			this.cooldown=this.cooldownMax;
			gameRunner.sounds.gunshot.play(this.pos,0,random(1,1.2));
		}
		let flip=nrmAngPI(this.angle+PI/2)<0;
		for(let i=0;i<this.turretAngleList.length;i++){
			if(this.turretCooldownList[i]<=0){
				let p=this.turretPosList[i%this.turretPosList.length].cln();
				let ang=this.turretAngleList[i];
				if(flip){
					p.y*=-1;
				}
				p.rot(this.angle).add(this.pos);

				let ra=(Math.random()-0.5)*2*this.accuracy;
				let s=this.turretBulletSpeed;
				let pVelo=VecA(s,ang+ra);
				pVelo.add(this.velo);

				bulletsArr.push(new Bullet(p,pVelo,this.turretBulletDamage,this.turretBulletSize,this.turretBulletRange).init());
				this.turretCooldownList[i]=Math.floor((Math.random()+1)*this.turretCooldownMax);
				gameRunner.sounds.gunshot.play(this.pos,0,1.5*random(1,1.2));
			}else{
				this.turretCooldownList[i]-=timeStep;
			}
		}
	}
	display(){
		let flip=nrmAngPI(this.angle+PI/2)<0;
		let propI=this.propIdxs[Math.floor(this.propTime)];
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
		for(let i=0;i<this.props.length;i++){
			let p=this.props[i].cln();
			if(flip){
				p.y*=-1;
			}
			p.rot(this.angle).add(this.pos);
			renderer.img(
				p.x,p.y,
				this.propSize.x,this.propSize.y,
				this.angle,
				this.propTexPos[propI].x,
				this.propTexPos[propI].y,
				this.propTexSize.x,
				this.propTexSize.y,
				false);
		}
		for(let i=0;i<this.turretAngleList.length;i++){
			let p=this.turretPosList[i%this.turretPosList.length].cln();
			let ang=this.turretAngleList[i];
			if(flip){
				p.y*=-1;
			}
			p.rot(this.angle).add(this.pos);
			renderer.img(
				p.x,p.y,
				this.turretSize.x,this.turretSize.y,
				this.angle,
				this.turretTexPos.x,
				this.turretTexPos.y,
				this.turretTexSize.x,
				this.turretTexSize.y,
				flip);
			
			renderer.img(
				p.x,p.y,
				this.gunSize.x,this.gunSize.y,
				ang,
				this.gunTexPos.x,
				this.gunTexPos.y,
				this.gunTexSize.x,
				this.gunTexSize.y,
				false,
				this.gunOffset.x,
				this.gunOffset.y);
		}
		gameRunner.shadow(this.pos.x,this.pos.y,(this.hitbox[1].x-this.hitbox[0].x)/2);
	}
}

class FlyingCastle extends Plane{
	constructor(p,a,l){
		super(p,a,l);

		this.thrustLimit=0.5;
		this.thrustRecover=0.5;
		this.thrustPotential=0.5;
		this.thrustPotLim=0.5;
		
		this.agilityMin=0.1;
		this.agilityMax=0.1;
		this.agilityFall=0.1;
		this.gravity=Vec(0,0.1);
		this.buoyancy=Vec(0,-0.7);
		
		this.cooldown=0;
		this.cooldownMax=Math.ceil(100/this.level);
		this.bulletSize=40;
		this.bulletSpeed=200;
		this.bulletDamage=10;
		this.bulletRange=20;
		this.bulletOffset=Vec(0,250);

		this.resistanceMin=0.95;
		this.resistanceMax=0.95;
		this.fallResistance=0.95;
		
		this.ceilingStart=12000;
		this.ceilingEnd=20000;
		
		this.minSpeed=10;//min speed for lift
		this.maxSpeed=30;//speed for max efficiency
		
		this.health=6000+(this.level-1)*500;
		this.maxHealth=this.health;
		
		this.size=Vec(253,228).scl(2);
		this.texPos=Vec(494,342);
		this.texSize=Vec(253,228);
		this.offset=Vec(0,-84);

		this.gunAng=0;
		this.hbOff1=Vec(0,0);
		this.hbRadius1=this.size.x*0.5;
		this.hbOff2=Vec(0,0);
		this.hbRadius2=this.size.x*0.3-10;
		
		this.zoomType="mouse";
	}
	getClosest(vec){
		let pos=loopVec(this.pos,vec);
		let b1=pos.cln().add(this.hbOff1).mag(vec)-this.hbRadius1;
		let l1=vec.y-pos.cln().add(this.hbOff1).y;
		let b2=pos.cln().add(this.hbOff2).mag(vec)-this.hbRadius2;
		if(b2<Math.max(b1,l1)){
			return vec.cln().sub(pos).sub(this.hbOff2).lim(this.hbRadius2).add(pos);
		}else{
			if(b1<l1){
				return Vec(vec.x,pos.cln().add(this.hbOff1).y);
			}else{
				return vec.cln().sub(pos).sub(this.hbOff1).lim(this.hbRadius1).add(pos);
			}
		}
	}
	getDist(vec){
		let pos=loopVec(this.pos,vec);
		let b1=pos.cln().add(this.hbOff1).mag(vec)-this.hbRadius1;
		let l1=vec.y-pos.cln().add(this.hbOff1).y;
		let b2=pos.cln().add(this.hbOff2).mag(vec)-this.hbRadius2;
		return Math.min(Math.max(l1,b1),b2);
	}
	calcHitbox(){
		let min=this.pos.cln().add(this.hbOff1).cln();
		let max=this.pos.cln().add(this.hbOff1).cln();
		min.sub(this.hbRadius1);
		max.add(this.hbRadius1);
		max.y=this.pos.y-this.hbOff2.y+this.hbRadius2;
		this.hitbox=[min,max];
	}
	face(target,timeStep){
		let gunPos=this.pos.cln().add(this.offset).add(this.bulletOffset);
		this.gunAng=gunPos.ang(target);
		super.face(target,timeStep);
	}
	shoot(bulletsArr){
		if(this.cooldown<=0){
			let ra=(Math.random()-0.5)*2*this.accuracy;
			let s=this.bulletSpeed;
			let pVelo=VecA(s,this.gunAng+ra);
			pVelo.add(this.velo);
			let pPos=this.pos.cln().add(this.offset).add(this.bulletOffset);
			
			bulletsArr.push(new BulletNuke(pPos,pVelo,this.bulletDamage,this.bulletSize,this.bulletRange).init());
			this.cooldown=this.cooldownMax;
			gameRunner.sounds.laser.play(this.pos,0,.3*random(1,1.2));
		}
	}
	display(disp,renderer){
		let gunPos=this.pos.cln().add(this.offset).add(this.bulletOffset);
		let ringSize=100*Math.max(this.cooldown,0)/this.cooldownMax;
		disp.setWeight(10*disp.cam.zoom);
		disp.setStroke(RGB(255,188,85));
		disp.noFill();
		disp.circle2(gunPos.x,gunPos.y,ringSize);

		renderer.img(
			this.pos.x,this.pos.y,
			this.size.x,this.size.y,
			0,
			this.texPos.x,
			this.texPos.y,
			this.texSize.x,
			this.texSize.y,
			false,
			this.offset.x,
			this.offset.y);
		gameRunner.shadow(this.pos.x,this.pos.y,(this.hitbox[1].x-this.hitbox[0].x)/2);
	}
}
//#endregion

//#region HotAirBalloon
class HotAirBalloon extends Plane{
	constructor(p,a,l){
		super(p,a,l);

		this.thrustLimit=0;
		this.thrustRecover=0;
		this.thrustPotential=0;
		this.thrustPotLim=0;
		
		this.agilityMin=0.08;
		this.agilityMax=0.08;
		this.agilityFall=0.08;
		
		this.cooldown=0;
		this.cooldownMax=5;
		this.bulletSpeed=100;
		this.bulletRange=100;
		this.bulletSize=6;
		this.bulletDamage=1;
		this.accuracy=0.01;
		this.kickback=2+((this.level-1)/2);
		
		this.fallResistance=0.9;
		this.transfer=0;
		
		this.health=100+this.level*50;
		this.maxHealth=this.health;
		
		this.size=Vec(18,27).scl(2);
		this.texPos=Vec(130,385);
		this.texSize=Vec(18,27);
		this.offset=Vec(0,-10);

		this.basketAngle=0;
		this.balloonAngle=0;

		this.balloonPos=Vec(0,0);
		this.balloonSize=Vec(128,145).scl(2+(this.level-1)/2);
		this.balloonTexPos=Vec(1,385);
		this.balloonTexSize=Vec(128,145);
		
		this.posList=[this.pos.cln(),this.pos.cln(),this.pos.cln()];
		this.veloList=[Vec(0,0),Vec(0,0),Vec(0,0)];
		this.distList=[20,this.balloonSize.y/4];
		this.balloonPos=this.posList[this.posList.length-1].cln();
		this.hbBalloonOff=Vec(0,-20);

		this.gunSize=Vec(15,5).scl(2);
		this.gunTexPos=Vec(130,441);
		this.gunTexSize=Vec(15,5);
		this.gunOffset=Vec(15,0);

		this.lift=Vec(0,-.6);
		this.gravity=Vec(0,.5);
		this.buoyancy=Vec(0,-0.8);
		this.damp=0.9;
		this.localResistance=0.95;

		this.zoomType="mouse";
	}
	init(){
		super.init();
		this.distList.forEach((d,i)=>{
			this.posList[i+1]=this.posList[i].cln().add(Vec(0,-d*2));
		});
		return this;
	}
	getClosest(vec){
		let basket=null;
		let pos=loopVec(this.pos,vec);
		let balloonPos=loopVec(this.balloonPos,vec);
		{
			let v=vec.cln().sub(pos).rot(-this.basketAngle).sub(this.offset);
			let s=v.cln().sign();
			let sz=this.size.cln().scl(.5);
			v.abs();
			if(v.x<sz.x&&v.y<sz.y){
				basket=vec.cln();
			}else{
				v.min(sz);
			}
			basket=v.scl(s).add(this.offset).rot(this.basketAngle).add(pos);
		}

		let bOff=this.hbBalloonOff.cln().rot(this.balloonAngle);
		let balloon=vec.cln().sub(bOff).sub(balloonPos).lim(this.balloonSize.x/2);
		balloon.add(balloonPos).add(bOff);
		if(balloon.mag(vec)<basket.mag(vec)){
			return balloon;
		}else{
			return basket;
		}
	}
	getDist(vec){
		let basket=0;
		let pos=loopVec(this.pos,vec);
		let balloonPos=loopVec(this.balloonPos,vec);
		{
			let v=vec.cln().sub(pos).rot(-this.basketAngle);
			let off=this.offset.cln();
			v.sub(off);
			let sz=this.size.cln().scl(.5);
			v.abs();
			if(v.x<sz.x&&v.y<sz.y){
				basket=Math.max(v.x-sz.x,v.y-sz.y);
			}else{
				let v2=v.cln();
				v.min(sz);
				basket=v2.mag(v);
			}
		}

		let bOff=this.hbBalloonOff.cln().rot(this.balloonAngle);
		let balloon=vec.cln().sub(bOff).mag(balloonPos)-this.balloonSize.x/2;
		return Math.min(balloon,basket);
	}
	calcHitbox(){
		let c1=this.size.cln().scl(.5).rot(this.basketAngle);
		let c2=this.size.cln().scl(Vec(-.5,.5)).rot(this.basketAngle);
		let c3=this.size.cln().scl(Vec(-.5,-.5)).rot(this.basketAngle);
		let c4=this.size.cln().scl(Vec(.5,-.5)).rot(this.basketAngle);
		let min=c1.cln().min(c2).min(c3).min(c4);
		let max=c1.cln().max(c2).max(c3).max(c4);

		let off=this.offset.cln();
		off.rot(this.basketAngle).add(this.pos);
		min.add(off);
		max.add(off);

		let bOff=this.hbBalloonOff.cln().rot(this.balloonAngle);
		let r=this.balloonSize.x/2;
		min.min(this.balloonPos.cln().sub(r).add(bOff));
		max.max(this.balloonPos.cln().add(r).add(bOff));

		this.hitbox=[min,max];
	}
	runWater(timeStep){
		if(gameRunner.isUnderwater(this.pos.x,this.pos.y)){

			let waterScale=clamp((this.pos.y-gameRunner.getWaterline(this.pos.x))/100,0,1);

			let slowed=this.velo.cln();
			this.velo.scl(this.resistanceWater**timeStep);
			slowed.sub(this.velo);
			let strength=slowed.mag();
			gameRunner.wave(this.pos.x,this.pos.y,100,strength*this.waveSize);
			if(!this.submerged){
				let splash=strength*this.splashSize;
				gameRunner.splash(this.pos.x,this.pos.y,slowed.x,slowed.y,splash);
			}
			this.submerged=true;
			this.veloList[0].add(this.buoyancy.cln().scl(waterScale*timeStep));
		
			//TODO: improve this to account for speed
			if(this.bubbling&&strength>0.3&&this.bubbleTime<this.bubbleMax){
				this.bubbleTime++;
				gameRunner.bubbles(this.pos.x,this.pos.y,0,0,
					(strength-0.5)*10*(1-this.bubbleTime/this.bubbleMax)
				);
			}else{
				this.bubbleTime=0;
				this.bubbling=false;
			}
		}else{
			this.bubbling=true;
			this.submerged=false;
		}
	}
	runCustom(timeStep,updateHb=true){
		if(this.cooldown>0){
			this.cooldown-=timeStep;
		}

		this.agility=this.agilityFall;

		this.veloList[0].add(this.gravity.cln().scl(timeStep));
		this.veloList[this.veloList.length-1].add(this.lift.cln().scl(this.heightEfficiency()*timeStep));

		for(let i=0;i<this.posList.length-1;i++){
			let curr=this.posList[i];
			let next=this.posList[i+1];
			let cDist=this.distList[i];

			let mid=curr.cln().mix(next,0.5);
			let dir=curr.cln().sub(next);
			let start=dir.cln().nrm(cDist).add(mid);
			let end=dir.cln().nrm(-cDist).add(mid);

			let elastic=0.1*timeStep;

			if(i==0||i==this.posList.length-1){
				this.veloList[i].add(start.cln().sub(curr).scl(elastic));
			}else{
				this.veloList[i].add(start.cln().sub(curr).scl(elastic/2));
			}
			if(i+1==0||i+1==this.posList.length-1){
				this.veloList[i+1].add(end.cln().sub(next).scl(elastic));
			}else{
				this.veloList[i+1].add(end.cln().sub(next).scl(elastic/2));
			}
		};
		
		for(let i=0;i<this.posList.length;i++){
			this.veloList[i].scl(this.localResistance**timeStep);
			this.posList[i].add(this.veloList[i].cln().scl(timeStep));
			this.posList[i].add(this.velo.cln().scl(timeStep));
		};
		for(let i=0;i<this.posList.length-1;i++){
			let curr=this.posList[i];
			let next=this.posList[i+1];
			let ang=curr.ang(next);
			let cVelo=this.veloList[i];
			let nVelo=this.veloList[i+1];


			let damp1=cVelo.cln().sub(nVelo).rot(-ang);
			damp1.x*=this.damp**timeStep;
			damp1.rot(ang).add(nVelo);
			this.veloList[i]=damp1;

			let damp2=nVelo.cln().sub(cVelo).rot(-ang);
			damp2.x*=this.damp**timeStep;
			damp2.rot(ang).add(cVelo);
			this.veloList[i+1]=damp2;
		};

		let avg=Vec(0,0)
		for(let i=0;i<this.posList.length;i++){
			avg.add(this.veloList[i]);
		}
		avg.div(this.posList.length);
		this.velo.add(avg.cln().scl(timeStep));
		this.velo.scl(this.fallResistance**timeStep);
		
		this.pos=this.posList[0].cln();
		this.balloonPos=this.posList[this.posList.length-1].cln();
		this.basketAngle=this.posList[0].ang(this.posList[1])+PI/2;
		this.balloonPos=this.posList[this.posList.length-1].cln();
		this.balloonAngle=this.posList[this.posList.length-1].ang(this.posList[this.posList.length-2])-PI/2;

		if(updateHb){
			this.calcHitbox();
		}
		
		if(this.alive){
			this.alive=this.health>0;
			if(!this.alive){
				this.die();
			}
		}
	}
	forcePos(p){
		super.forcePos(p);
		this.veloList[0]=Vec(0,0);
		this.posList[0]=p.cln();
	}
	hurt(damage,damager){
		let vec=damager.getClosest(this.balloonPos);
		let bOff=this.hbBalloonOff.cln().rot(this.balloonAngle);
		let balloon=vec.cln().sub(bOff).mag(this.balloonPos)-this.balloonSize.x/2;
		let margin=50;
		if(balloon<margin){
			this.veloList[this.veloList.length-1].add(this.balloonPos.cln().sub(vec).nrm(damage*2));
		}else{
			this.health-=damage;
		}
	}
	shoot(bulletsArr){
		if(this.cooldown<=0){
			let ra=(Math.random()-0.5)*2*this.accuracy;
			let s=this.bulletSpeed;
			let pVelo=VecA(s,this.angle+ra);
			pVelo.add(this.velo);
			let pPos=VecA(this.size.x/2.,this.angle);
			pPos.add(this.pos);
			bulletsArr.push(new Bullet(pPos,pVelo,this.bulletDamage,this.bulletSize,this.bulletRange).init());

			this.veloList[0].add(pVelo.cln().nrm(-this.kickback));

			this.cooldown=this.cooldownMax;
			gameRunner.sounds.gunshot.play(this.pos,0,1*random(1,1.2));
		}
	}
	display(disp,renderer){
		// this.posList.forEach(p=>disp.circle2(p.x,p.y,10));
		renderer.img(
			this.pos.x,this.pos.y,
			this.gunSize.x,this.gunSize.y,
			this.angle,
			this.gunTexPos.x,
			this.gunTexPos.y,
			this.gunTexSize.x,
			this.gunTexSize.y,
			false,
			this.gunOffset.x,
			this.gunOffset.y);
		renderer.img(
			this.pos.x,this.pos.y,
			this.size.x,this.size.y,
			this.basketAngle,
			this.texPos.x,
			this.texPos.y,
			this.texSize.x,
			this.texSize.y,
			false,
			this.offset.x,
			this.offset.y);
		
		renderer.img(
			this.balloonPos.x,this.balloonPos.y,
			this.balloonSize.x,this.balloonSize.y,
			this.balloonAngle,
			this.balloonTexPos.x,
			this.balloonTexPos.y,
			this.balloonTexSize.x,
			this.balloonTexSize.y,
			false);
		gameRunner.shadow(this.pos.x,this.pos.y,(this.hitbox[1].x-this.hitbox[0].x)/2);
	}
}

class FlyingHouse extends HotAirBalloon{
	constructor(p,a,l){
		super(p,a,l);

		this.kickback=1;

		this.size=Vec(66,75).scl(2);
		this.texPos=Vec(130,523);
		this.texSize=Vec(66,75);
		this.offset=Vec(0,-20);

		this.distList=[40,60];
		
		this.health=500;
		this.maxHealth=this.health;

		this.balloonSize=Vec(15,21).scl(2);
		this.balloonTexPos=Vec(130,453);
		this.balloonTexSize=Vec(15,21);
		
		this.gravity=Vec(0,1);
		this.buoyancy=Vec(0,-.8);
		this.resistanceWater=0.94;

		this.waveSize=2.5;
		this.splashSize=4;

		this.balloonNum=50;

		this.balloonPosList=Array(this.balloonNum).fill().map(b=>VecA(100,Math.random()*TAU).add(this.pos));
		this.balloonVeloList=Array(this.balloonNum).fill().map(b=>Vec(0,0));
		this.resistanceBalloon=0.9;
		this.balloonLift=Vec(0,-5);
		this.balloonPushRadius=40;
		this.balloonPushStrength=5;
		this.balloonContribution=Vec(0,-0.015);
		this.liftBase=Vec(0,-.5);
		
		this.zoomType="mouse";
	}
	getClosest(vec){
		let basket=null;
		let pos=loopVec(this.pos,vec);
		{
			let v=vec.cln().sub(pos).rot(-this.basketAngle).sub(this.offset);
			let s=v.cln().sign();
			let sz=this.size.cln().scl(.5);
			v.abs();
			if(v.x<sz.x&&v.y<sz.y){
				basket=vec.cln();
			}else{
				v.min(sz);
			}
			basket=v.scl(s).add(this.offset).rot(this.basketAngle).add(pos);
		}

		let balloonMin=Infinity;
		let balloonMinPos=basket.cln();
		for(let i=0;i<this.balloonPosList.length;i++){
			let bPos=loopVec(this.balloonPosList[i],vec);
			let balloon=vec.cln().mag(bPos)-this.balloonSize.x/2;
			if(balloonMin>balloon){
				balloonMin=balloon;
				balloonMinPos=vec.cln().sub(bPos).lim(this.balloonSize.x/2).add(bPos);
			}
		}
		if(balloonMin<basket.mag(vec)){
			return balloonMinPos;
		}else{
			return basket;
		}
	}
	getDist(vec){
		let basket=0;
		let pos=loopVec(this.pos,vec);
		{
			let v=vec.cln().sub(pos).rot(-this.basketAngle);
			let off=this.offset.cln();
			v.sub(off);
			let sz=this.size.cln().scl(.5);
			v.abs();
			if(v.x<sz.x&&v.y<sz.y){
				basket=Math.max(v.x-sz.x,v.y-sz.y);
			}else{
				let v2=v.cln();
				v.min(sz);
				basket=v2.mag(v);
			}
		}

		let balloonMin=Infinity;
		for(let i=0;i<this.balloonPosList.length;i++){
			let bPos=loopVec(this.balloonPosList[i],vec);
			let balloon=vec.cln().mag(bPos)-this.balloonSize.x/2;
			balloonMin=Math.min(balloonMin,balloon);
		}
		return Math.min(balloonMin,basket);
	}
	calcHitbox(){
		let c1=this.size.cln().scl(.5).rot(this.basketAngle);
		let c2=this.size.cln().scl(Vec(-.5,.5)).rot(this.basketAngle);
		let c3=this.size.cln().scl(Vec(-.5,-.5)).rot(this.basketAngle);
		let c4=this.size.cln().scl(Vec(.5,-.5)).rot(this.basketAngle);
		let min=c1.cln().min(c2).min(c3).min(c4);
		let max=c1.cln().max(c2).max(c3).max(c4);

		let off=this.offset.cln();
		off.rot(this.basketAngle).add(this.pos);
		min.add(off);
		max.add(off);

		for(let i=0;i<this.balloonPosList.length;i++){
			let r=this.balloonSize.x/2;
			min.min(this.balloonPosList[i].cln().sub(r));
			max.max(this.balloonPosList[i].cln().add(r));
		}

		this.hitbox=[min,max];
	}
	runCustom(timeStep){
		super.runCustom(timeStep,false);
		for(let i=0;i<this.balloonPosList.length;i++){
			for(let j=i+1;j<this.balloonPosList.length;j++){
				if(this.balloonPosList[i].within(this.balloonPosList[j],this.balloonPushRadius)){
					let diff=this.balloonPosList[i].cln().sub(this.balloonPosList[j]);
					let bumpStrength=clamp((this.balloonPushRadius-diff.mag())/this.balloonPushRadius,0,1)*this.balloonPushStrength;
					let bump=diff.cln().nrm(bumpStrength);
					//technically the bump should get scaled but that leads to instability
					// bump.scl(timeStep);
					this.balloonVeloList[i].add(bump);
					this.balloonVeloList[j].sub(bump);
				}
			}
		}
		for(let i=0;i<this.balloonPosList.length;i++){
			this.balloonVeloList[i].add(this.balloonLift.cln().scl(timeStep));
			this.balloonVeloList[i].add(this.balloonPosList[i].cln().sub(this.pos).scl(-0.015*timeStep));
			this.balloonPosList[i].add(this.balloonVeloList[i].cln().scl(timeStep));
			this.balloonVeloList[i].scl(this.resistanceBalloon**timeStep);
		}
		this.lift=this.balloonContribution.cln().scl(this.balloonPosList.length).add(this.liftBase);
		this.calcHitbox();
	}
	hurt(damage,damager){
		let vec=damager.getPos(this.pos);
		let hitVec=damager.getClosest(this.pos);
		if(hitVec.mag(this.pos)<this.size.mag()/2||this.balloonPosList.length==0){
			this.health-=damage;
		}else{
			let balloonMin=Infinity;
			let balloonMinI;
			for(let i=0;i<this.balloonPosList.length;i++){
				let balloon=vec.cln().mag(this.balloonPosList[i])-this.balloonSize.x/2;
				if(balloonMin>balloon){
					balloonMin=balloon;
					balloonMinI=i;
				}
			}
			if(balloonMin<Infinity){
				this.balloonVeloList.splice(balloonMinI,1);
				this.balloonPosList.splice(balloonMinI,1);
			}
		}
	}
	display(disp,renderer){
		// this.posList.forEach(p=>disp.circle2(p.x,p.y,10));
		renderer.img(
			this.pos.x,this.pos.y,
			this.size.x,this.size.y,
			this.basketAngle,
			this.texPos.x,
			this.texPos.y,
			this.texSize.x,
			this.texSize.y,
			false,
			this.offset.x,
			this.offset.y);
		
		this.balloonPosList.forEach(b=>{
			renderer.img(
				b.x,b.y,
				this.balloonSize.x,this.balloonSize.y,
				b.ang(this.pos)-PI/2,
				this.balloonTexPos.x,
				this.balloonTexPos.y,
				this.balloonTexSize.x,
				this.balloonTexSize.y,
				false);
		});
		gameRunner.shadow(this.pos.x,this.pos.y,(this.hitbox[1].x-this.hitbox[0].x)/2);
	}
}

class Zeppelin extends Plane{
	constructor(p,a,l){
		super(p,a,l);

		this.thrustSound=gameRunner.sounds.prop;
		this.thrustSoundSpeed=.7;

		this.propNum=3+this.level;

		let thrust=0.25*this.propNum;
		this.thrustLimit=thrust;
		this.thrustRecover=thrust;
		this.thrustPotential=thrust;
		this.thrustPotLim=thrust;
		
		this.agilityMin=0.02;
		this.agilityMax=0.02;
		this.agilityFall=0.02;
		
		this.resistanceMin=0.95;
		this.resistanceMax=0.95;
		this.fallResistance=0.95;
		this.transfer=0.15;

		this.gravity=Vec(0,1.5);
		this.lift=Vec(0,-1.5);
		this.buoyancy=Vec(0,-2);
		
		this.cooldown=0;
		this.cooldownMax=2;
		this.bulletSpeed=100;
		this.bulletRange=100;
		this.bulletSize=6;
		this.bulletDamage=3;
		this.accuracy=0.01;
		this.kickback=0;

		this.health=4000;
		this.maxHealth=this.health;

		this.lookAngle=this.angle;
		this.lookAgility=0.1;
		this.bulletOffset=Vec(180,50);

		this.size=Vec(326,57).scl(2);
		this.texPos=Vec(748,684);
		this.texSize=Vec(326,57);
		this.offset=Vec(0,4);

		this.propSize=Vec(14,4).scl(2);
		this.propTime=0;
		this.propSpeed=0;
		this.propIdxs=[0,1,2,1];
		this.propTexPos=[Vec(1075,770),Vec(1075,780),Vec(1075,790)];
		this.propTexSize=Vec(14,4);
		this.propOffset=Vec(0,-16);

		this.engineSize=Vec(10,13).scl(2);
		this.engineTexPos=Vec(1090,772);
		this.engineTexSize=Vec(10,13);
		
		this.zoomType="mouse";
	}
	hurt(damage,target){
		let bounce=this.pos.cln().sub(target.getPos(this.pos)).nrm(damage*2);
		this.shove(bounce);
		super.hurt(damage,target);
	}
	runCustom(timeStep){
		this.velo.add(VecA(this.thrust,this.lookAngle));
		
		let boostAmount=this.thrust;
		this.thrust=0;
		super.runCustom(timeStep);
		if(boostAmount>0){
			this.boostEffect(boostAmount,timeStep);
		}

		this.velo.add(this.lift.cln().scl(this.heightEfficiency()*timeStep));
		this.propSpeed*=0.9**timeStep;
		this.propTime=(this.propTime+this.propSpeed*timeStep)%(this.propIdxs.length);
	}
	boostEffect(strength,timeStep){
		this.propSpeed+=0.1*timeStep;
	}
	face(target,timeStep){
		let flip=nrmAngPI(this.angle+PI/2)<0;
		let gunPos=this.bulletOffset.cln().add(this.offset);
		if(flip){
			gunPos.y*=-1;
		}
		gunPos.rot(this.angle).add(this.pos);
		let gAng=gunPos.ang(target);
		this.lookAngle+=clamp(
			nrmAngPI(gAng-this.lookAngle),-this.lookAgility,this.lookAgility);
		super.face(target,timeStep);
	}
	shoot(bulletsArr){
		if(this.cooldown<=0){
			let flip=nrmAngPI(this.angle+PI/2)<0;
			let gunPos=this.bulletOffset.cln().add(this.offset);
			if(flip){
				gunPos.y*=-1;
			}
			gunPos.rot(this.angle).add(this.pos);

			let ra=(Math.random()-0.5)*2*this.accuracy;
			let s=this.bulletSpeed;
			let pVelo=VecA(s,this.lookAngle+ra);
			pVelo.add(this.velo);
			let pPos=gunPos;
			bulletsArr.push(new Bullet(pPos,pVelo,this.bulletDamage,this.bulletSize,this.bulletRange).init());

			this.velo.add(pVelo.cln().nrm(-this.kickback));

			this.cooldown=this.cooldownMax;
			gameRunner.sounds.gunshot.play(this.pos,0,1*random(1,1.2));
		}
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
			flip,
			this.offset.x,
			this.offset.y);

		let propI=this.propIdxs[Math.floor(this.propTime)];
		for(let i=0;i<this.propNum;i++){
			let p=Vec(300/Math.max(this.propNum-1,1)*i+200-this.size.x/2,30);
			if(flip){
				p.y*=-1;
			}
			p.rot(this.angle).add(this.pos);

			renderer.img(
				p.x,p.y,
				this.engineSize.x,this.engineSize.y,
				this.lookAngle+PI/2,
				this.engineTexPos.x,
				this.engineTexPos.y,
				this.engineTexSize.x,
				this.engineTexSize.y,
				false);
			renderer.img(
				p.x,p.y,
				this.propSize.x,this.propSize.y,
				this.lookAngle+PI/2,
				this.propTexPos[propI].x,
				this.propTexPos[propI].y,
				this.propTexSize.x,
				this.propTexSize.y,
				false,
				this.propOffset.x,
				this.propOffset.y);
		}
		gameRunner.shadow(this.pos.x,this.pos.y,(this.hitbox[1].x-this.hitbox[0].x)/2);
	}
	die(explode=true){
		if(explode){
			gameRunner.wreck(this.pos.x,this.pos.y,this.velo.x,this.velo.y,320);
			gameRunner.wreck(this.pos.x,this.pos.y,this.velo.x,this.velo.y,160);
			gameRunner.wreck(this.pos.x,this.pos.y,this.velo.x,this.velo.y,80);
			gameRunner.wreck(this.pos.x,this.pos.y,this.velo.x,this.velo.y,40);
			gameRunner.wreck(this.pos.x,this.pos.y,this.velo.x,this.velo.y,20);
			gameRunner.wreck(this.pos.x,this.pos.y,this.velo.x,this.velo.y,10);
			gameRunner.wreck(this.pos.x,this.pos.y,this.velo.x,this.velo.y,5);
			gameRunner.sounds.bang.play(this.pos,0,10/80*random(1,1.2));
		}
		if(this.thrustSound!=null){
			this.thrustSound.play(this.pos,0,this.thrustSoundSpeed,0);
		}
	}
}
//apply mixin
Object.assign(Zeppelin.prototype,shapeMixin.rect);
//#endregion

//#region NyanCat
class NyanCat extends Plane{
	constructor(p,a,l){
		super(p,a,l);
		
		this.thrustLimit=0.75;
		this.thrustRecover=0.75;
		this.thrustPotential=0.75;
		this.thrustPotLim=0.75;
		
		this.agilityMin=0.08;
		this.agilityMax=0.08;
		this.agilityFall=0.08;
		
		this.resistanceMin=0.9995;
		this.resistanceMax=0.99;
		this.fallResistance=0.9995;
		this.transfer=0;
		
		this.ceilingStart=12000;
		this.ceilingEnd=20000;

		this.health=2000;
		this.maxHealth=this.health;

		this.gravity=Vec(0,0.1);
		this.buoyancy=Vec(0,-0.8);

		this.scale=(4+this.level*2-1)/4;
		this.size=Vec(21,18).scl(4+this.level*2-1);
		this.displaySize=this.size.cln();
		this.texPos=Vec(1,130);
		this.texSize=Vec(21,18);
		this.offset=Vec(0,0);

		this.cooldown=0;
		this.cooldownMax=0;
		this.bulletSize=this.size.y*.8/2;
		this.bulletDamage=1;
		this.bulletRange=Math.min(20+(this.level-1)*10,100);

		this.walkTime=0;

		this.tailSize=Vec(7,7).scl(4);
		this.tailPos=Vec(-55.9,12).add(Vec(21,0)).scl(this.scale).sub(Vec(21,0));
		this.tailIdxs=[0,1,2,3,4];
		this.tailTexPos=[Vec(23,131),Vec(31,131),Vec(39,131),Vec(47,131),Vec(55,131)];
		this.tailOffset=[Vec(0,-4),Vec(0,0),Vec(0,0),Vec(0,4),Vec(0,4)];
		this.tailTexSize=Vec(7,7);

		this.pawSize=Vec(4,4).scl(4);
		this.pawTexPos=Vec(18,184);
		this.pawTexSize=Vec(4,4);

		this.headSize=Vec(16,13).scl(4);
		this.headPos=Vec(32,8);
		this.headTexPos=Vec(1,168);
		this.headTexSize=Vec(16,13);

		this.rainbow=[];
		this.rainbowTime=0;
	}
	start(){
		gameRunner.music.forcePlaylist(["special/nyan.mp3"]);
	}
	die(explode=true){
		if(!explode){
			gameRunner.music.restorePlaylist();
		}
		super.die(explode);
	}
	// boostEffect(strength,timeStep){
	// 	let hE=this.heightEfficiency();
	// 	let offset=VecA(-this.displaySize.x/2,this.angle);
	// 	offset.add(this.pos).add(this.velo);
	// 	let offset2=VecA(20,this.angle+PI/2);

	// 	let m=this.velo.mag()*timeStep;
	// 	for(let v=0;v<m;v+=20){
	// 		let p=this.velo.cln().nrm(-v).add(offset);
	// 		let col=hsv(this.walkTime%1,.9,1).toRgb().scl(255);
	// 		gameRunner.cloud(p.x,p.y,col.x,col.y,col.z,col.w*hE);
	// 		gameRunner.cloud(p.x+offset2.x,p.y+offset2.y,col.x,col.y,col.z,col.w*hE);
	// 		gameRunner.cloud(p.x-offset2.x,p.y-offset2.y,col.x,col.y,col.z,col.w*hE);
	// 	}
	// }
	shoot(bulletsArr,timeStep){
		if(this.cooldown<=0){
			let bPos=Vec(-this.displaySize.x/2,0).rot(this.angle).add(this.pos).add(this.velo);
			let next=new Rainbow(bPos,this.bulletDamage,this.bulletSize,this.bulletRange,this.angle+PI/2,this.rainbowTime).init();
			this.rainbow.push(next);
			bulletsArr.push(next);
			this.cooldown=this.cooldownMax;
		}
	}
	runCustom(timeStep){
		this.rainbowTime++;
		this.rainbow=this.rainbow.filter(x=>x.isAlive());
		super.runCustom(timeStep);
		this.walkTime+=(this.velo.mag()*0.001*this.heightEfficiency()+0.01)*timeStep;
	}
	display(disp,renderer){
		let flip=nrmAngPI(this.angle+PI/2)<0;
		let drawPaw=(pawPos)=>{
			let p=VecA(6,this.walkTime*TAU);
			p.y=0;
			p.add(pawPos);
			renderer.img(
				this.pos.x,this.pos.y,
				this.pawSize.x,this.pawSize.y,
				this.angle,
				this.pawTexPos.x,
				this.pawTexPos.y,
				this.pawTexSize.x,
				this.pawTexSize.y,
				flip,
				p.x,
				p.y);
		}
		drawPaw(Vec(40-4,36*this.scale));
		drawPaw(Vec(20-4,36*this.scale));
		drawPaw(Vec(-32,36*this.scale));
		drawPaw(Vec(-12,36*this.scale));
		
		let tailI=this.tailIdxs[Math.floor((this.walkTime*this.tailIdxs.length+2)%(this.tailIdxs.length))];
		renderer.img(
			this.pos.x,this.pos.y,
			this.tailSize.x,this.tailSize.y,
			this.angle,
			this.tailTexPos[tailI].x,
			this.tailTexPos[tailI].y,
			this.tailTexSize.x,
			this.tailTexSize.y,
			flip,
			this.tailPos.x+this.tailOffset[tailI].x,
			this.tailPos.y+this.tailOffset[tailI].y);
		
		renderer.img(
			this.pos.x,this.pos.y,
			this.size.x,this.size.y,
			this.angle,
			this.texPos.x,
			this.texPos.y,
			this.texSize.x,
			this.texSize.y,
			flip,
			this.offset.x,
			this.offset.y);

		let headPos=VecA(6,this.walkTime*TAU).add(this.headPos);
		renderer.img(
			this.pos.x,this.pos.y,
			this.headSize.x,this.headSize.y,
			this.angle,
			this.headTexPos.x,
			this.headTexPos.y,
			this.headTexSize.x,
			this.headTexSize.y,
			flip,
			headPos.x,
			headPos.y);
		gameRunner.shadow(this.pos.x,this.pos.y,(this.hitbox[1].x-this.hitbox[0].x)/2);

		let cols=["#FD0000","#FE9800","#FDFD00","#33FD00","#0098FD","#6633FD"];
		for(let c=0;c<6;c++){
			let col=cols[c];
			disp.setStroke(col);
			disp.setWeight((this.bulletSize*2/6+1)*disp.cam.zoom);

			disp.start();
			let prev=0;
			this.rainbow.forEach(x=>{
				if(x.spawnTime-prev>1){
					disp.pathOpen();
					disp.start();
				}
				x.displaySpecial(disp,this.bulletSize*2*((c+.5)/6-.5));
				prev=x.spawnTime;
			});
			disp.pathOpen();
		}
	}
}
//apply mixin
Object.assign(NyanCat.prototype,shapeMixin.rect);

class FlappyBird extends Plane{
	constructor(p,a,l){
		super(p,a,l);

		this.jump=20;
		this.jumpForward=10;
		this.jumping=false;
		this.canJump=true;
		
		this.agilityMin=TAU;
		this.agilityMax=TAU;
		this.agilityFall=TAU;
		
		this.resistanceMin=0.995;
		this.resistanceMax=0.995;
		this.fallResistance=0.995;
		this.transfer=0;

		this.gravity=Vec(0,0.5);
		this.buoyancy=Vec(0,-0.8);
		
		this.bulletDamage=1;
		this.bulletSpeed=12;
		this.bulletSize=13*2;
		this.bulletRange=200;
		
		this.health=500;
		this.maxHealth=this.health;

		this.size=Vec(15,12).scl(4);
		this.texPos=Vec(403,583);
		this.texSize=Vec(15,12);
		this.offset=Vec(0,0);

		this.wingSize=Vec(7,8).scl(4);
		this.wingPos=Vec(-24,4);
		this.wingTime=0;
		this.wingSpeed=0.2;
		this.wingIdxs=[0,1,2,1];
		this.wingTexPos=[Vec(419,583),Vec(427,583),Vec(435,583)];
		this.wingTexSize=Vec(7,8);
	}
	runCustom(timeStep){
		this.thrust=0;
		super.runCustom(timeStep);
		this.wingTime+=this.wingSpeed*timeStep;
		if(!this.jumping){
			this.canJump=true;
		}
		this.jumping=false;
	}
	shoot(bulletsArr){
		if(!this.jumping&&this.canJump){
			let ra=(Math.random()-0.5);
			let s=this.bulletSpeed;
			let pVelo=VecA(s,-PI/2+ra);
			pVelo.add(this.velo);
			let pPos=Vec(0,0);
			pPos.add(this.pos);
			bulletsArr.push(new Bomb(pPos,pVelo,this.bulletDamage,this.bulletSize,this.bulletRange).init());

			let hE=this.heightEfficiency();
			this.velo.y=-this.jump*hE;
			this.velo.add(VecA(this.jumpForward*hE,this.angle));
			this.canJump=false;
			gameRunner.sounds.gunshot.play(this.pos,0,.4*random(1,1.2),2);
		}
		this.jumping=true;
	}
	display(disp,renderer){
		let flip=nrmAngPI(this.angle+PI/2)<0;
		let wingI=this.wingIdxs[Math.floor(this.wingTime)%this.wingTexPos.length];
		renderer.img(
			this.pos.x,this.pos.y,
			this.size.x,this.size.y,
			this.angle,
			this.texPos.x,
			this.texPos.y,
			this.texSize.x,
			this.texSize.y,
			flip,
			this.offset.x,
			this.offset.y);
		renderer.img(
			this.pos.x,this.pos.y,
			this.wingSize.x,this.wingSize.y,
			this.angle,
			this.wingTexPos[wingI].x,
			this.wingTexPos[wingI].y,
			this.wingTexSize.x,
			this.wingTexSize.y,
			flip,
			this.wingPos.x,
			this.wingPos.y);
		gameRunner.shadow(this.pos.x,this.pos.y,(this.hitbox[1].x-this.hitbox[0].x)/2);
	}
}
//apply mixin
Object.assign(FlappyBird.prototype,shapeMixin.rect);

//#endregion

//#region PodRacer
class PodRacerRope{
	constructor(dist,count,pos){
		this.points=Array(count).fill().map(p=>pos.cln());
		this.pointsVelo=Array(count).fill().map(p=>Vec(0,0));
		this.dist=dist;
		this.segmentDist=dist/count;
		this.start=Vec(0,0);
		this.end=Vec(0,0);
		this.gravity=Vec(0,.1);
	}
	run(start,startVelo,end,endVelo,timeStep){
		this.start=start;
		this.end=end;
		let iterations=Math.round(Math.max(5*timeStep,1));
		for(let t=0;t<iterations;t++){
			for(let i=0;i<this.points.length;i++){
				let next=this.points[i+1]??end.cln().sub(endVelo.cln().scl((1-t/iterations)));
				let prev=this.points[i-1]??start.cln().sub(startVelo.cln().scl((1-t/iterations)));
				let curr=this.points[i];

				let nP=curr.cln().sub(next).lim(i==this.points.length-1?0:this.segmentDist).add(next);
				let pP=curr.cln().sub(prev).lim(i==0?0:this.segmentDist).add(prev);
				let mid=nP.cln().mix(pP,.5);
				this.pointsVelo[i].add(mid.cln().sub(this.points[i]).scl(1/iterations));

				this.pointsVelo[i].add(this.gravity.cln().scl(1/iterations));
			}
			for(let i=0;i<this.points.length;i++){
				this.points[i].add(this.pointsVelo[i]);
			}
			this.pointsVelo=this.pointsVelo.map((currV,i)=>{
				let nextV=this.pointsVelo[i+1]??endVelo.cln().scl(1/iterations);
				let prevV=this.pointsVelo[i-1]??startVelo.cln().scl(1/iterations);
				let avgV=nextV.cln().mix(prevV,.5);
				return currV.cln().sub(avgV).scl(0.8).add(avgV);
			})
		}
	}
	display(disp){
		disp.setStroke("#808080");
		disp.setWeight(4*disp.cam.zoom);
		disp.ctx.lineJoin="round";
		disp.start();
		disp.mt2(this.start.x,this.start.y);
		for(let i=0;i<this.points.length;i++){
			disp.lt2(this.points[i].x,this.points[i].y);
		}
		disp.lt2(this.end.x,this.end.y);
		disp.pathOpen();
		disp.ctx.lineJoin="miter";
	}
}
class PodRacer extends Plane{
	constructor(p,a,l){
		super(p,a,l);

		this.thrustSound=gameRunner.sounds.rocket;
		this.thrustSoundSpeed=2.5;
		
		let thrust=1;
		this.thrustLimit=thrust;
		this.thrustRecover=thrust;
		this.thrustPotential=thrust;
		this.thrustPotLim=thrust;
		
		this.agilityMin=0.08;
		this.agilityMax=0.08;
		this.agilityFall=0.08;

		this.cooldown=0;
		this.cooldownMax=10;
		this.bulletSize=10;
		this.bulletDamage=1;
		
		this.damageSize=30;
		
		this.resistanceMin=0.9995;
		this.resistanceMax=0.99;
		this.fallResistance=0.9995;
		this.transfer=0;

		this.health=100+this.level*50;
		this.maxHealth=this.health;

		this.gravity=Vec(0,0.1);
		this.buoyancy=Vec(0,-1);

		this.size=Vec(46,13).scl(2);
		this.displaySize=this.size.cln();
		this.texPos=Vec(114,127);
		this.texSize=Vec(46,13);
		this.offset=Vec(0,0);
		this.displayOffset=Vec(0,0);

		this.thrusterNum=this.level+1;
		if(this.level==0){
			this.thrusterNum=0;
		}
		this.thrusterRange=400;
		this.podResistance=0.99;
		this.thrusterPushRadius=200;
		this.thrusterPushStrength=1.5;
		this.thrusterSmooth=0.95;
		this.thrusterBounce=0.1;

		this.thrusterPosList=Array(this.thrusterNum).fill().map(x=>VecA(this.thrusterRange/2*Math.random(),Math.random()*TAU).add(this.pos));
		this.thrusterVeloList=Array(this.thrusterNum).fill().map(x=>Vec(0,0));
		this.thrusterThrustList=Array(this.thrusterNum).fill().map(x=>100);
		this.thrusterSubmergedList=Array(this.thrusterNum).fill().map(x=>false);

		this.thrusterRopeList=Array(this.thrusterNum).fill().map(x=>new PodRacerRope(200,20,this.pos));
		this.ropeOffset=Vec(26,6);

		this.engine1Size=Vec(84,20).scl(2);
		this.engine1TexPos=Vec(90,155);
		this.engine1TexSize=Vec(84,20);

		this.engine2Size=Vec(84,20).scl(2);
		this.engine2TexPos=Vec(175,155);
		this.engine2TexSize=Vec(84,20);

		this.waveSize=4/Math.max(this.level,1);
		this.splashSize=5;
		
		this.shooting=0;
	}
	shove(toShove){
		this.velo.add(toShove);
		this.thrusterVeloList.forEach(v=>v.add(toShove.cln().scl(0.5)));
	}
	shoot(bulletsArr,timeStep){
		if(this.level==0){
			super.shoot(bulletsArr,timeStep);
		}else{
			this.shooting=2;
			for(let i=1;i<this.thrusterPosList.length;i++){
				let nextI=(i+1)%this.thrusterPosList.length;
				let curr=this.thrusterPosList[i];
				let next=this.thrusterPosList[nextI];
				let dir=next.cln().sub(curr);
				let mag=dir.mag();
				for(let d=0;d<mag;d+=this.damageSize){
					let damagePos=dir.cln().nrm(d).add(curr);
					bulletsArr.push(new DamageField(damagePos,this.bulletDamage*timeStep,this.damageSize/2,false).init());
				}
			}
		}
	}
	boostEffect(strength,timeStep){
		let hE=this.heightEfficiency();
		for(let i=0;i<this.thrusterPosList.length;i++){
			let tv=this.thrusterVeloList[i];
			let tp=this.thrusterPosList[i].cln().add(VecA(-this.engine1Size.x/2,this.angle));
			gameRunner.thrust(tp.x,tp.y,this.velo.x,this.velo.y,
				strength*.15/timeStep,timeStep
			);
			let m=tv.mag()*timeStep;
			for(let v=0;v<m;v+=20){
				let p=tv.cln().nrm(-v).add(tp);
				gameRunner.cloud(p.x,p.y,255,255,255,40*hE);
			}
		}
	}
	runCustom(timeStep){
		this.shooting--;
		let speedEff=this.getEfficiency();
		
		for(let i=0;i<this.thrusterPosList.length;i++){
			for(let j=i+1;j<this.thrusterPosList.length;j++){
				if(this.thrusterPosList[i].within(this.thrusterPosList[j],this.thrusterPushRadius)){
					let diff=this.thrusterPosList[i].cln().sub(this.thrusterPosList[j]);
					let bumpStrength=clamp((this.thrusterPushRadius-diff.mag())/this.thrusterPushRadius,0,1)*this.thrusterPushStrength;
					let bump=diff.cln().nrm(bumpStrength).scl(timeStep);
					this.thrusterPosList[i].add(bump);
					this.thrusterPosList[j].sub(bump);
				}
			}
		}

		let resist=this.resistanceMin+(this.resistanceMax-this.resistanceMin)*speedEff;
		for(let i=0;i<this.thrusterPosList.length;i++){
			let v=this.thrusterVeloList[i];
			let p=this.thrusterPosList[i];
			v.add(VecA(this.thrust,this.angle));
			v.add(this.gravity.cln().scl(timeStep));
			v.scl(resist**timeStep);
			p.add(v.cln().scl(timeStep));

			let dist=p.mag(this.pos);
			if(dist>this.thrusterRange){
				//TODO: smooth this out
				let ang=this.pos.ang(p);
				let bounce=VecA(this.thrusterRange-dist,ang).scl(this.thrusterBounce/this.thrusterPosList.length).lim(100);
				v.sub(this.velo).rot(-ang);
				v.x*=this.thrusterSmooth**timeStep;
				v.rot(ang).add(this.velo);
				v.add(bounce);
				this.velo.sub(bounce);
			}
			if(gameRunner.isUnderwater(p.x,p.y)){//TODO
				let slowed=v.cln();
				v.scl(this.resistanceWater**timeStep);
	
				slowed.sub(v);
				let strength=slowed.mag();
				let waveSize=this.waveSize/2;
				let splashSize=this.splashSize;
				gameRunner.wave(p.x,p.y,100,Math.min(strength*waveSize,5));
				if(!this.thrusterSubmergedList[i]){
					let splash=Math.min(strength*splashSize,10);
					gameRunner.splash(p.x,p.y,slowed.x/timeStep,slowed.y/timeStep,splash/timeStep);
				}
				this.thrusterSubmergedList[i]=true;
				v.add(this.buoyancy.cln().scl(timeStep));
			}else{
				this.thrusterSubmergedList[i]=false;
			}
		}

		this.velo.scl(this.podResistance**timeStep);
		let boostAmount=this.thrust;
		this.thrust=0;
		super.runCustom(timeStep);
		if(boostAmount>0){
			this.boostEffect(boostAmount,timeStep);
		}

		let flip=nrmAngPI(this.angle+PI/2)<0;
		let ropePos=this.ropeOffset.cln();
		if(flip){
			ropePos.y*=-1;
		}
		ropePos.rot(this.angle).add(this.pos);
		this.thrusterRopeList.forEach((r,i)=>r.run(ropePos,this.velo,this.thrusterPosList[i],this.thrusterVeloList[i],timeStep));
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
			flip,
			this.offset.x,
			this.offset.y);

		this.thrusterRopeList.forEach(t=>t.display(disp));

		disp.setStroke("#ff80ff");
		disp.setWeight(5*disp.cam.zoom);
		disp.start();
		for(let i=0;i<this.thrusterPosList.length;i++){
			let prevP=this.thrusterPosList[mod(i-1,this.thrusterPosList.length)];
			let p=this.thrusterPosList[i];
			
			if(i!=1&&this.shooting>0){
				let dir=p.cln().sub(prevP);
				let mag=dir.mag();
				dir.nrm();
				let count=Math.ceil(mag/20);
				let scale=mag/count;
				disp.mt2(prevP.x,prevP.y);
				for(let d=0;d<count;d++){
					let dp=dir.cln().scl(d*scale).add(prevP);
					if(d!=0&&d!=count-1){
						dp.add(VecA(Math.random()*10,Math.random()*TAU));
					}
					disp.lt2(dp.x,dp.y);
				}
			}
			if(i%2==0){
				renderer.img(
					p.x,p.y,
					this.engine1Size.x,this.engine1Size.y,
					this.angle,
					this.engine1TexPos.x,
					this.engine1TexPos.y,
					this.engine1TexSize.x,
					this.engine1TexSize.y,
					flip,
					this.offset.x,
					this.offset.y);
			}else{
				renderer.img(
					p.x,p.y,
					this.engine2Size.x,this.engine2Size.y,
					this.angle,
					this.engine2TexPos.x,
					this.engine2TexPos.y,
					this.engine2TexSize.x,
					this.engine2TexSize.y,
					flip,
					this.offset.x,
					this.offset.y);
			}

			gameRunner.shadow(p.x,p.y,this.engine1Size.x/4);
		}
		disp.pathOpen();
		
		// renderer.img(
		// 	this.pos.x,this.pos.y,
		// 	this.engine2Size.x,this.engine2Size.y,
		// 	this.angle,
		// 	this.engine2TexPos.x,
		// 	this.engine2TexPos.y,
		// 	this.engine2TexSize.x,
		// 	this.engine2TexSize.y,
		// 	flip,
		// 	this.offset.x,
		// 	this.offset.y);

		gameRunner.shadow(this.pos.x,this.pos.y,(this.hitbox[1].x-this.hitbox[0].x)/2);
	}
}
//apply mixin
Object.assign(PodRacer.prototype,shapeMixin.rect);

//#endregion

//#region dragon

class DragonSegment extends Entity{
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
		if(this.idx%3==0){
			let hb=this.getHitbox();
			gameRunner.shadow(this.pos.x,this.pos.y,(hb[1].x-hb[0].x)/2);
		}
	}
}
//apply mixin
Object.assign(DragonSegment.prototype,shapeMixin.circ);

class Dragon extends Plane{
	constructor(p,a,l){
		super(p,a,l);

		this.thrustLimit=1;
		this.thrustRecover=1;
		this.thrustPotential=1;
		this.thrustPotLim=1;
		
		this.agilityMin=0.1;
		this.agilityMax=0.1;
		this.agilityFall=0.1;
		
		this.ceilingStart=4000;
		this.ceilingEnd=10000;

		//Flight
		this.resistanceMin=0.99;
		this.resistanceMax=0.99;
		this.fallResistance=0.99;
		this.transfer=0.2;
		this.minSpeed=1;//min speed for lift
		this.maxSpeed=20;//speed for max efficiency

		this.cooldownMax=15;
		this.bulletDamage=10;
		this.bulletSpeed=100;
		this.bulletSize=20;
		this.bulletRange=50;
		this.bulletOffset=Vec(0,25);

		this.minSpeed=0;
		this.maxSpeed=20;
		
		this.maxHealth=10000;
		this.health=this.maxHealth;

		this.scaleSize=Vec(25,14).scl(2);
		this.scaleTexPos=[Vec(748,552),Vec(774,552),Vec(800,552)];
		this.scaleTexSize=Vec(25,14);
		this.ballTexPos=Vec(841,576);
		this.ballTexSize=Vec(30,30);
		this.feather1TexPos=Vec(883,608);
		this.feather1TexSize=Vec(6,14);
		this.feather1Size=Vec(6,14).scl(2);
		this.feather2TexPos=Vec(872,590);
		this.feather2TexSize=Vec(10,23);
		this.feather2Size=Vec(10,23).scl(2);
		this.jawTexPos=Vec(841,638);
		this.jawTexSize=Vec(60,22);
		this.jawSize=Vec(60,22).scl(2);
		this.jawOffset=Vec(35,10).scl(2);
		this.hornTexPos=Vec(902,614);
		this.hornTexSize=Vec(76,34);
		this.hornSize=Vec(76,34).scl(2);
		this.hornOffset=Vec(-38,-26).scl(2);
		this.hornAng=-.1;
		this.displaySize=Vec(92,50).scl(2);
		this.texPos=Vec(748,582);
		this.texSize=Vec(92,50);
		this.displayOffset=Vec(54,0);

		this.size=50;
		
		this.growth=0;
		this.growthMax=500;
		this.segments=[];

		this.biteTime=0;
		this.biting=false;
		this.biteSpeed=1/this.cooldownMax;
		this.jawAng=0;
	}
	init(){
		this.grow(100);
		let trail=this.pos.cln();
		let ang=this.angle+PI;
		let spinBase=.2;
		let spin=spinBase;
		for(let i=this.segments.length-1;i>=0;i--){
			trail.add(VecA(25,ang));
			// ang-=Math.cos(i*PI*.1)*.2;
			ang+=spin;
			let diffAng=nrmAngTAU(ang-trail.ang(this.pos));
			if(diffAng>TAU*3/4){
				spin=spinBase/2;
			}
			this.segments[i].pos=trail.cln();
		}
		return super.init();
	}
	grow(amount){
		let diff=Math.floor(this.growth);
		this.growth=Math.min(this.growth+amount,this.growthMax);
		diff=Math.floor(this.growth)-diff;
		for(let i=0;i<diff;i++){
			this.addSegment();
		}
	}
	addSegment(){
		let idx=this.segments.length;
		let s=new DragonSegment(this.pos.cln(),Vec(0,0),Math.min(idx*.5+20,45),this,idx).init();
		this.segments.push(s);

		if(idx%3==0){
			gameRunner.queueAction((game)=>{
				game.planes.push(s);
				game.specials.push(s);
			});
		}
	}
	shoot(bulletsArr){
		this.biting=true;
		// bulletsArr.push(new DamageField(this.pos,this.damage,80));
		// let bt=(this.biteTime*this.biteSpeed)%2;
		// if(bt>.5&&bt<1.5){
		// 	super.shoot(bulletsArr);
		// }
	}
	runCustom(timeStep){
		super.runCustom(timeStep);

		if(this.biting||this.jawAng<0){
			this.biteTime+=timeStep;
			this.biting=false;
		}
		this.jawAng=Math.min(Math.cos(this.biteTime*this.biteSpeed*PI)-.8,0)*PI/8;

		for(let i=this.segments.length-1;i>=0;i--){
			this.segments[i].pos.add(this.segments[i].velo.cln().scl(timeStep));
			this.segments[i].calcHitbox();

			let next=this.segments[i+1]?.pos??this.pos.cln();
			let curr=this.segments[i].pos;

			let backup=curr.cln();

			curr.sub(next).lim(25).add(next);

			this.segments[i].velo.add(curr.cln().sub(backup).scl(.03));
			this.segments[i].velo.scl(.9**timeStep);
			// if(!gameRunner.isUnderwater(curr.x,curr.y)){
			// 	this.segmentsVelo[i].add(this.segmentGravity.cln().scl(timeStep));
			// }
		}
	}
	display(){
		let scaleRepeat=this.scaleSize.cln().scl([.25,1]);
		let skewDensity=3;
		let segAng=this.angle;
		renderer.img(
			this.pos.x,this.pos.y,
			85,85,
			segAng,
			this.ballTexPos.x,
			this.ballTexPos.y,
			this.ballTexSize.x,
			this.ballTexSize.y,
			false,
			0,
			0);
		for(let x=0;x<this.segments.length;x++){
			if(x<this.segments.length-1){
				segAng=this.segments[x].pos.ang(this.segments[x+1].pos);
			}
			let width=Math.max(Math.min(x*.5+20,45)*2-15,1);
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
		for(let x=0;x<this.segments.length;x++){
			if(x<this.segments.length-1){
				segAng=this.segments[x].pos.ang(this.segments[x+1].pos);
			}
			let width=Math.min(x*.5+20,45);
			let scaleNum=Math.ceil(width/scaleRepeat.y*.75);
			let scaleWidth=width/scaleNum;
			if(x%2==0){
				for(let y=0;y<scaleNum;y++){
					let skew=skewDensity/(Math.abs(y)+skewDensity);
					let scaleIdx=clamp(Math.round(Math.abs(y*2)),0,2);
					this.displayScale(this.segments[x].pos.x,this.segments[x].pos.y,segAng,0,y*scaleWidth,scaleWidth*skew,scaleIdx);
				}
			}else{
				for(let y=0.5;y<=scaleNum-0.5;y++){
					let skew=skewDensity/(Math.abs(y)+skewDensity);
					let scaleIdx=clamp(Math.round(Math.abs(y*2)),0,2);
					if(scaleNum==1){
						scaleIdx=2;
					}
					this.displayScale(this.segments[x].pos.x,this.segments[x].pos.y,segAng,0,y*scaleWidth,scaleWidth*skew,scaleIdx);
				}
			}
		}
		renderer.img(
			this.pos.x,this.pos.y,
			85,85,
			segAng,
			this.ballTexPos.x,
			this.ballTexPos.y,
			this.ballTexSize.x,
			this.ballTexSize.y,
			false,
			0,
			0);
		
		let flip=nrmAngPI(this.angle+PI/2)<0;
		[PI/2-.5,PI/2-.1,PI/2+.6].forEach(ang=>
			renderer.img(
				this.pos.x,this.pos.y,
				this.feather2Size.x,this.feather2Size.y,
				this.angle-ang*(flip?-1:1),
				this.feather2TexPos.x,
				this.feather2TexPos.y,
				this.feather2TexSize.x,
				this.feather2TexSize.y,
				flip,
				0,
				-40)
		);
		renderer.img(
			this.pos.x,this.pos.y,
			this.jawSize.x,this.jawSize.y,
			this.angle-this.jawAng*(flip?-1:1),
			this.jawTexPos.x,
			this.jawTexPos.y,
			this.jawTexSize.x,
			this.jawTexSize.y,
			flip,
			this.jawOffset.x,
			this.jawOffset.y);
		renderer.img(
			this.pos.x,this.pos.y,
			this.displaySize.x,this.displaySize.y,
			this.angle+this.jawAng/2*(flip?-1:1),
			this.texPos.x,
			this.texPos.y,
			this.texSize.x,
			this.texSize.y,
			flip,
			this.displayOffset.x,
			this.displayOffset.y);
		
		renderer.img(
			this.pos.x,this.pos.y,
			this.feather1Size.x,this.feather1Size.y,
			this.angle+.2*(flip?-1:1),
			this.feather1TexPos.x,
			this.feather1TexPos.y,
			this.feather1TexSize.x,
			this.feather1TexSize.y,
			flip,
			20,
			40);
		renderer.img(
			this.pos.x,this.pos.y,
			this.feather1Size.x,this.feather1Size.y,
			this.angle+.6*(flip?-1:1),
			this.feather1TexPos.x,
			this.feather1TexPos.y,
			this.feather1TexSize.x,
			this.feather1TexSize.y,
			flip,
			20,
			40);
		
		renderer.img(
			this.pos.x,this.pos.y,
			this.hornSize.x,this.hornSize.y,
			this.angle+this.hornAng*(flip?-1:1)+this.jawAng/2*(flip?-1:1),
			this.hornTexPos.x,
			this.hornTexPos.y,
			this.hornTexSize.x,
			this.hornTexSize.y,
			flip,
			this.hornOffset.x,
			this.hornOffset.y);
		
		let hb=this.getHitbox();
		gameRunner.shadow(this.pos.x,this.pos.y,(hb[1].x-hb[0].x)/2);
	}
	displayScale(x,y,ang,offX,offY,width,idx){
		renderer.img(
			x,y,
			this.scaleSize.x,width,
			ang,
			this.scaleTexPos[idx].x,
			this.scaleTexPos[idx].y,
			this.scaleTexSize.x,
			this.scaleTexSize.y,
			false,
			offX,
			-offY);
		renderer.img(
			x,y,
			this.scaleSize.x,width,
			ang,
			this.scaleTexPos[idx].x,
			this.scaleTexPos[idx].y,
			this.scaleTexSize.x,
			this.scaleTexSize.y,
			true,
			offX,
			-offY);
	}
}
//apply mixin
Object.assign(Dragon.prototype,shapeMixin.circ);

//#endregion