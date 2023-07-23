class Director{
	constructor(game){
		this.game=game;
		this.AIs={
			swarmer:[],
			shield:[],
			flock:[],
			sniper:[],
			wrecker:[],
			boss:[],
			mother:[],
			other:[],
		};
		this.AIKeys=Object.keys(this.AIs);
		this.spawners=[];

		this.waveNum=1;

		this.dartCost=45;
		this.arrowCost=75;
		this.shellCost=75;
		this.shieldCost=80;
		this.sniperCost=80;
		this.starCost=60;
		this.swarmerCost=40;
		this.wreckerCost=300;
		this.bossCost=1000;
		this.motherCost=10000;

		this.excess=0;
		this.timer=0;
		this.waveQueued=false;
		this.motherCondition=false;
		this.bossCondition=false;
		this.unitCondition=false;
		this.runSpeed=1000/60;

		this.spaghettiHeight=-30000;
		this.spaghettiMonster=null;
	}
	run(timeStep){
		this.timer-=timeStep*this.runSpeed;
		let aiCount=0;

		let playerPos=this.game.getPlayer().getPos();
		if(playerPos.y<this.spaghettiHeight&&(this.spaghettiMonster==null||!this.spaghettiMonster.isAlive())){
			this.spawnSpaghettiMonster(playerPos.cln().add(Vec(0,-500)));
			this.game.message("When you gaze into the spagootz, the spagootz gazes also into you",15);
			unlockSpaghetti();
			console.log("Spagootz");
		}

		let toPay=0;
		this.AIKeys.forEach(key=>{
			runAndFilter(this.AIs[key],a=>{
				if(a.isAlive()){
					a.run(timeStep);
					return true;
				}else{
					let cost=this.getCost(a);
					this.excess+=cost;
					toPay+=cost;

					return false;
				}
			});
			aiCount+=this.AIs[key].length;
		});
		this.AIKeys.forEach(key=>
			this.AIs[key].forEach(a=>{
				a.move(timeStep);
			})
		);
		this.game.pay(toPay);
		
		runAndFilter(this.spawners,(a)=>a.isAlive());
		
		let motherCount=this.AIs.mother.length;
		let bossCount=this.AIs.boss.length;
		let spawnerCount=this.spawners.length;

		if(
			(this.waveQueued&&this.timer<=0)
			||(this.unitCondition&&spawnerCount==0&&aiCount==0)
			||(this.bossCondition&&spawnerCount==0&&bossCount==0)
			||(this.motherCondition&&spawnerCount==0&&motherCount==0)
		){
			this.nextWave();
		}
	}

	getCost(ai){
		let type=ai.body.constructor.name;
		switch(type){
			case "Dart":
				return this.dartCost;
			case "Arrow":
				return this.arrowCost;
			case "Shell":
				return this.shellCost;
			case "Shield":
				return this.shieldCost;
			case "Sniper":
				return this.sniperCost;
			case "StarGunner":
				return this.starCost;
			case "Swarmer":
				return this.swarmerCost;
			case "Wrecker":
				return this.wreckerCost;
			case "BossAxe":
			case "BossDrill":
			case "BossSpike":
			case "BossYarn":
				return this.bossCost;
			case "Mothership":
				return this.motherCost;
			default:
				return 0;
		}
	}
	resetExcess(){
		this.excess=0;
	}
	getRandomUnit(types){
		let unit;
		if(Array.isArray(types)){
			let pools=types.map(t=>this.AIs[t]);
			let totalLength=pools.reduce((total,p)=>total+p.length,0);
			let idx=Math.floor(Math.random()*totalLength);

			for(let i=0;i<pools.length;i++){
				if(idx<pools[i].length){
					unit=pools[i][idx];
					break;
				}else{
					idx-=pools[i].length;
				}
			}
		}else{
			let pool=this.AIs[types];
			unit=pool[Math.floor(Math.random()*pool.length)];
		}

		if(unit==null||!unit.isAlive()){
			return null;
		}
		return unit;
	}
	killAll(){
		this.AIKeys.forEach(key=>
			this.AIs[key].forEach(a=>{
				a.kill();
			})
		);
	}
	queueNextOnTime(time,nextWave=null){
		this.waveNum=nextWave??(this.waveNum+1);
		this.waveQueued=true;
		this.timer=time*1000;
	}
	queueNext(time,nextWave=null){
		this.waveNum=nextWave??(this.waveNum+1);
		this.waveQueued=true;
		this.timer=time*1000;
		this.unitCondition=true;
	}
	queueNextOnBossKill(nextWave=null){
		this.waveNum=nextWave??(this.waveNum+1);
		this.bossCondition=true;
	}
	queueNextOnMotherKill(nextWave=null){
		this.waveNum=nextWave??(this.waveNum+1);
		this.motherCondition=true;
	}
	nextWave(){
		this.waveQueued=false;
		this.bossCondition=false;
		this.unitCondition=false;
		this.motherCondition=false;
		
		if(!this.game.getPlayer().alive){
			return;
		}
		saveProgress();
		waveNum.data=Math.ceil(this.waveNum);

		let difficultyScale=this.game.difficultyScale;
		let usedExcess=true;

		console.log("wave "+this.waveNum);
		switch(this.waveNum){
			case 1:
				this.game.message("Wave "+this.waveNum);
				this.spawnRandomWave(600*difficultyScale+this.excess);
				this.queueNext(15);
				break;
			case 2:
				this.game.message("Wave "+this.waveNum);
				this.spawnRandomWave(700*difficultyScale+this.excess);
				this.queueNext(15);
				break;
			case 3:
				this.game.message("Wave "+this.waveNum);
				this.spawnRandomWave(800*difficultyScale+this.excess);
				this.queueNext(15);
				break;
			case 4:
				this.game.message("Wave "+this.waveNum);
				this.spawnRandomWave(900*difficultyScale+this.excess);
				this.queueNext(15);
				break;
			case 5:
				this.game.message("Wave "+this.waveNum);
				this.spawnRandomWave(1000*difficultyScale+this.excess);
				this.queueNext(15);
				break;
			case 6:
				this.game.message("Wave "+this.waveNum);
				this.spawnRandomWave(1100*difficultyScale+this.excess);
				this.queueNext(15);
				break;
			case 7:
				this.game.message("Wave "+this.waveNum);
				this.spawnRandomWave(1200*difficultyScale+this.excess);
				this.queueNext(15);
				break;
			case 8:
				this.game.message("Wave "+this.waveNum);
				this.spawnRandomWave(1300*difficultyScale+this.excess);
				this.queueNext(15);
				break;
			case 9:
				this.game.message("Wave "+this.waveNum);
				this.spawnRandomWave(1400*difficultyScale+this.excess);
				this.queueNext(15);
				break;
			case 10:
				this.game.message("Wave "+this.waveNum,2,()=>{
					this.game.message("Kill the boss to continue",15);
				});
				this.spawnRandomBoss();
				usedExcess=false;
				this.queueNextOnBossKill(10.5);
				break;
			
			case 10.5:
				this.game.message("The real game begins...",4);
				this.killAll();
				this.queueNextOnTime(5,11);
				break;

			case 11:
				this.resetExcess();
				this.game.message("Wave "+this.waveNum);
				this.spawnRandomWave(2200*difficultyScale+this.excess);
				this.queueNext(15);
				break;
			case 12:
				this.game.message("Wave "+this.waveNum);
				this.spawnRandomBoss();
				usedExcess=false;
				this.queueNext(30);
				break;
			case 13:
				this.game.message("Wave "+this.waveNum);
				this.spawnRandomWave(2600*difficultyScale+this.excess);
				this.queueNext(15);
				break;
			case 14:
				this.game.message("Wave "+this.waveNum);
				this.spawnRandomBoss();
				usedExcess=false;
				this.queueNext(30);
				break;
			case 15:
				this.game.message("Wave "+this.waveNum);
				this.spawnRandomWave(3000*difficultyScale+this.excess);
				this.queueNext(15);
				break;
			case 16:
				this.game.message("Wave "+this.waveNum);
				this.spawnRandomBoss();
				usedExcess=false;
				this.queueNext(30);
				break;
			case 17:
				this.game.message("Wave "+this.waveNum);
				this.spawnRandomWave(3400*difficultyScale+this.excess);
				this.queueNext(15);
				break;
			case 18:
				this.game.message("Wave "+this.waveNum);
				this.spawnRandomBoss();
				usedExcess=false;
				this.queueNext(30);
				break;
			case 19:
				this.game.message("Wave "+this.waveNum);
				this.spawnRandomWave(3800*difficultyScale+this.excess);
				this.queueNext(15);
				break;
			case 20:
				this.game.message("Final Wave");
				//shield wave
				this.spawnByChance(4000*difficultyScale,[0,0,0,3,1,1,0,0]);
				this.spawnByChance(this.excess,[1,1,1,1,1,1,1,0]);
				this.spawnMothership();
				this.spawnRandomBoss();
				this.spawnRandomBoss();
				this.spawnRandomBoss();
				this.queueNextOnMotherKill(20.5);
				break;

			case 20.5:
				this.killAll();
				this.game.gameWin();
				this.waveNum=21;
				break;
			
			case 21:
				this.resetExcess();
			default:
				this.game.message("Wave "+this.waveNum);
				this.spawnRandomWave((this.waveNum-20)*1000*difficultyScale+this.excess);
				this.spawnRandomBoss();
				this.queueNext(30);
		}
		if(usedExcess){
			this.resetExcess();
		}
	}
	gameOver(){
		this.waveQueued=false;
		this.bossCondition=false;
		this.unitCondition=false;
		this.motherCondition=false;
		this.resetExcess();
	}
	end(){
		this.waveQueued=false;
		this.bossCondition=false;
		this.unitCondition=false;
		this.motherCondition=false;
		this.spaghettiMonster=null;
		this.resetExcess();

		this.waveNum=1;
		waveNum.data=Math.ceil(this.waveNum);

		this.AIs={
			swarmer:[],
			shield:[],
			flock:[],
			sniper:[],
			wrecker:[],
			boss:[],
			mother:[],
			other:[],
		};
		this.spawners=[];
	}
	display(disp){
		if(this.bossCondition||this.motherCondition){
			let pPos=this.game.getPlayer().getPos();
			let screenSize=disp.getSize();
			let screenBoxSize=screenSize.cln().scl(.5).sub(50).scl(1/disp.cam.zoom);

			let toHighlight=this.motherCondition?this.AIs.mother:this.AIs.boss;
			//pointers
			toHighlight.forEach(b=>{
				let bPos=b.getPos(pPos);

				let i1=bPos.cln().sub(pPos);
				i1.scl(Math.abs(screenBoxSize.y/i1.y));
				let i2=bPos.cln().sub(pPos);
				i2.scl(Math.abs(screenBoxSize.x/i2.x));
				let intersect=Vec(0,0);
				if(Math.abs(i1.x)<screenBoxSize.x){
					intersect=i1.cln();
				}else if(Math.abs(i2.y)<screenBoxSize.y){
					intersect=i2.cln();
				}
				intersect.add(pPos);

				if(this.game.offScreen(bPos.x,bPos.y)){
					let ang=pPos.ang(intersect);
					let points=[Vec(66,0),Vec(-33,-50),Vec(-33,50)];

					disp.setStroke("#000000");
					disp.noFill();
					disp.setWeight(8);
					disp.start();
					points.forEach(p=>{
						let p2=p.cln().scl(.2/disp.cam.zoom).rot(ang).add(intersect);
						disp.lt2(p2.x,p2.y);
					});
					disp.shape();

					disp.setStroke("#AAFF00");
					disp.noFill();
					disp.setWeight(4);
					disp.start();
					points.forEach(p=>{
						let p2=p.cln().scl(.2/disp.cam.zoom).rot(ang).add(intersect);
						disp.lt2(p2.x,p2.y);
					});
					disp.shape();
				}
			});
		}
	}
	getRandomPos(dist=4000){
		let p=this.game.getPlayer().pos.cln();
		p.y=clamp(p.y,-8000,0);
		let p2=this.game.getPlayer().pos.cln()
			.add(VecA(
				(Math.random()*.8+0.2)*dist,
				Math.random()*TAU
			));
		p2.y=-Math.abs(p2.y);
		return p2;
	}
	calcCount(budget,chances){
		let counts=[0,0,0,0,0,0,0,0];
		let prices=[
			this.dartCost,
			this.arrowCost,
			this.shellCost,
			this.shieldCost,
			this.sniperCost,
			this.starCost,
			this.swarmerCost,
			this.wreckerCost
		];

		let chanceTotal=chances.reduce((t,a)=>t+a,0);
		if(chanceTotal==0){
			return counts;
		}
		let total=0;
		chances=chances.map(x=>{
			let val=x/chanceTotal;
			total+=val
			return total;
		});

		while(budget>0){
			let rand=Math.random();
			for(let i=0;i<chances.length;i++){
				if(chances[i]>rand){
					if(prices[i]<=budget){
						budget-=prices[i];
						counts[i]++;
						break;
					}else{
						return counts;
					}
				}
			}
		}
		return counts;
	}
	getWeightedRandom(chances){
		let chanceTotal=chances.reduce((t,a)=>t+a,0);
		if(chanceTotal==0){
			return 0;
		}
		let total=0;
		chances=chances.map(x=>{
			let val=x/chanceTotal;
			total+=val
			return total;
		});
		let rand=Math.random();
		for(let i=0;i<chances.length;i++){
			if(chances[i]>rand){
				return i;
			}
		}
	}
	spawnByChance(budget,chances){
		let counts=this.calcCount(budget,chances);
		this.spawnDart(counts[0]);
		this.spawnArrow(counts[1]);
		this.spawnShell(counts[2]);
		this.spawnShield(counts[3]);
		this.spawnSniper(counts[4]);
		this.spawnStar(counts[5]);
		this.spawnSwarmer(counts[6]);
		this.spawnWrecker(counts[7]);
	}
	spawnRandomWave(budget,type){
		let rand=type;
		if(type==null){
			rand=this.getWeightedRandom([
				1,
				.25,
				1,
				1,
				.25,
				1,
				.1
			]);
		}
		switch(rand){
			//generic wave
			case 0:
				this.spawnByChance(budget,[1,1,1,1,1,1,1,0]);
				break;
			//sniper wave
			case 1:
				this.spawnByChance(budget,[0,0,0,5,30,10,0,0]);
				break;
			//dart wave
			case 2:
				this.spawnByChance(budget,[100,20,20,0,0,0,0,0]);
				break;
			//swarmer wave
			case 3:
				this.spawnByChance(budget,[0,0,0,0,0,0,1,0]);
				break;
			//special wave
			case 4:
				this.spawnByChance(budget,[0,10,10,0,0,10,0,1]);
				break;
			//shield wave
			case 5:
				this.spawnByChance(budget,[0,0,0,3,1,1,0,0]);
				break;
			//wrecker wave
			case 6:
				this.spawnByChance(budget,[0,0,0,0,0,0,0,1]);
				break;
		}
	}
	spawnRandomBoss(){
		let rand=this.getWeightedRandom([1,1,1,1]);
		switch(rand){
			case 0:
				this.spawnBossAxe(1);
				break;
			case 1:
				this.spawnBossDrill(1);
				break;
			case 2:
				this.spawnBossSpike(1);
				break;
			case 3:
				this.spawnBossYarn(1);
				break;
		}
	}

	spawnSwarmer(count,time=100){
		for(let i=0;i<count;i++){
			let trigger=(p)=>{
				let toAdd=new Swarmer(p,Math.random()*TAU).init();
				let ai=new SwarmerAI(toAdd,this);
				this.AIs.swarmer.push(ai);
				this.game.aliens.push(toAdd);
				this.game.specials.push(toAdd);
			}
			let toAdd=new Spawner(
				trigger,
				this.getRandomPos(),
				0.8,
				time
			).init();
			this.game.aliens.push(toAdd);
			this.spawners.push(toAdd);
		}
	}
	spawnShield(count,time=100){
		for(let i=0;i<count;i++){
			let trigger=(p)=>{
				let toAdd=new Shield(p,Math.random()*TAU).init();
				let ai=new ShieldAI(toAdd,this);
				this.AIs.shield.push(ai);
				this.game.aliens.push(toAdd);
			}
			let toAdd=new Spawner(
				trigger,
				this.getRandomPos(),
				1.5,
				time
			).init();
			this.game.aliens.push(toAdd);
			this.spawners.push(toAdd);
		}
	}
	spawnDart(count,time=100){
		for(let i=0;i<count;i++){
			let trigger=(p)=>{
				let toAdd=new Dart(p,Math.random()*TAU).init();
				let ai=new FlockAI(toAdd,this);
				this.AIs.flock.push(ai);
				this.game.aliens.push(toAdd);
			}
			let toAdd=new Spawner(
				trigger,
				this.getRandomPos(),
				1,
				time
			).init();
			this.game.aliens.push(toAdd);
			this.spawners.push(toAdd);
		}
	}
	spawnShell(count,time=100){
		for(let i=0;i<count;i++){
			let trigger=(p)=>{
				let toAdd=new Shell(p,Math.random()*TAU).init();
				let ai=new FlockAI(toAdd,this);
				this.AIs.flock.push(ai);
				this.game.aliens.push(toAdd);
			}
			let toAdd=new Spawner(
				trigger,
				this.getRandomPos(),
				1.2,
				time
			).init();
			this.game.aliens.push(toAdd);
			this.spawners.push(toAdd);
		}
	}
	spawnArrow(count,time=100){
		for(let i=0;i<count;i++){
			let trigger=(p)=>{
				let toAdd=new Arrow(p,Math.random()*TAU).init();
				let ai=new FlockAI(toAdd,this);
				this.AIs.flock.push(ai);
				this.game.aliens.push(toAdd);
			}
			let toAdd=new Spawner(
				trigger,
				this.getRandomPos(),
				1.2,
				time
			).init();
			this.game.aliens.push(toAdd);
			this.spawners.push(toAdd);
		}
	}
	spawnSniper(count,time=100){
		for(let i=0;i<count;i++){
			let trigger=(p)=>{
				let toAdd=new Sniper(p,Math.random()*TAU).init();
				let ai=new SniperAI(toAdd,this);
				this.AIs.sniper.push(ai);
				this.game.aliens.push(toAdd);
			}
			let toAdd=new Spawner(
				trigger,
				this.getRandomPos(),
				1.5,
				time
			).init();
			this.game.aliens.push(toAdd);
			this.spawners.push(toAdd);
		}
	}
	spawnStar(count,time=100){
		for(let i=0;i<count;i++){
			let trigger=(p)=>{
				let toAdd=new StarGunner(p,Math.random()*TAU).init();
				let ai=new StarGunnerAI(toAdd,this);
				this.AIs.sniper.push(ai);
				this.game.aliens.push(toAdd);
			}
			let toAdd=new Spawner(
				trigger,
				this.getRandomPos(),
				1,
				time
			).init();
			this.game.aliens.push(toAdd);
			this.spawners.push(toAdd);
		}
	}
	spawnWrecker(count,time=100){
		for(let i=0;i<count;i++){
			let trigger=(p)=>{
				let toAdd=new Wrecker(p,Math.random()*TAU).init();
				let ai=new ChaseAI(toAdd,this);
				this.AIs.wrecker.push(ai);
				this.game.aliens.push(toAdd);
				this.game.specials.push(toAdd);
			}
			let toAdd=new Spawner(
				trigger,
				this.getRandomPos(),
				1.2,
				time
			).init();
			this.game.aliens.push(toAdd);
			this.spawners.push(toAdd);
		}
	}

	spawnBossAxe(count=1,time=300){
		for(let i=0;i<count;i++){
			let trigger=(p)=>{
				let toAdd=new BossAxe(p,Math.random()*TAU).init();
				let ai=new BossAxeAI(toAdd,this);
				this.AIs.boss.push(ai);
				this.game.aliens.push(toAdd);
			}
			let toAdd=new Spawner(
				trigger,
				this.getRandomPos(),
				2,
				time
			).init();
			this.game.aliens.push(toAdd);
			this.spawners.push(toAdd);
		}
	}
	spawnBossDrill(count=1,time=300){
		for(let i=0;i<count;i++){
			let trigger=(p)=>{
				let toAdd=new BossDrill(p,Math.random()*TAU).init();
				let ai=new BossDrillAI(toAdd,this);
				this.AIs.boss.push(ai);
				this.game.aliens.push(toAdd);
				this.game.specials.push(toAdd);
			}
			let toAdd=new Spawner(
				trigger,
				this.getRandomPos(),
				2,
				time
			).init();
			this.game.aliens.push(toAdd);
			this.spawners.push(toAdd);
		}
	}
	spawnBossSpike(count=1,time=300){
		for(let i=0;i<count;i++){
			let trigger=(p)=>{
				let toAdd=new BossSpike(p,Math.random()*TAU).init();
				let ai=new BossSpikeAI(toAdd,this);
				this.AIs.boss.push(ai);
				this.game.aliens.push(toAdd);
				this.game.specials.push(toAdd);
			}
			let toAdd=new Spawner(
				trigger,
				this.getRandomPos(),
				2,
				time
			).init();
			this.game.aliens.push(toAdd);
			this.spawners.push(toAdd);
		}
	}
	spawnBossYarn(count=1,time=300){
		for(let i=0;i<count;i++){
			let trigger=(p)=>{
				let toAdd=new BossYarn(p,Math.random()*TAU).init();
				let ai=new BossYarnAI(toAdd,this);
				this.AIs.boss.push(ai);
				this.game.aliens.push(toAdd);
			}
			let toAdd=new Spawner(
				trigger,
				this.getRandomPos(),
				2,
				time
			).init();
			this.game.aliens.push(toAdd);
			this.spawners.push(toAdd);
		}
	}
	spawnMothership(count=1,time=500){
		for(let i=0;i<count;i++){
			let trigger=(p)=>{
				let toAdd=new Mothership(p,Math.random()*TAU).init();
				let ai=new MothershipAI(toAdd,this);
				this.AIs.mother.push(ai);
				this.game.aliens.push(toAdd);
			}
			let toAdd=new Spawner(
				trigger,
				new Vec(0,-2000),
				3,
				time
			).init();
			this.game.aliens.push(toAdd);
			this.spawners.push(toAdd);
		}
	}

	spawnSpaghettiMonster(pos){
		let toAdd=new SpaghettiMonster(pos,Math.random()*TAU).init();
		let ai=new SpaghettiAI(toAdd,this);
		this.AIs.other.push(ai);
		this.game.aliens.push(toAdd);
		this.spaghettiMonster=toAdd;
	}
}