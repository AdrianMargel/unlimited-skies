//#region order
/*
	█▀█ █▀█ █▀▄ █▀▀ █▀█
	█▄█ █▀▄ █▄▀ ██▄ █▀▄
*/
class Order{
	constructor(type,action,weight=1,priority=1){
		this.type=type;
		this.action=action;
		this.weight=weight;
		this.priority=priority;
	}
	run(pos,ang,body,timeStep){
		return this.action(pos,ang,body,timeStep);
	}
}
let ORDER_TYPE={
	MOVE:"move",
	FACE:"face",
	FUNC:"func"
};
let ORDER_VARS=function(){
	let pos=this.getPos();
	let ang=this.getAng();
	let velo=this.body.velo.cln();
	let dir=VecA(1,ang);
	let speed=this.body.speed??1;
	let player=gameRunner.getPlayer();
	let playerPos=player.getPos(pos);
	let playerAng=player.angle;
	let playerVelo=player.velo.cln();
	return{
		pos,
		ang,
		dir,
		speed,
		velo,
		playerPos,
		playerAng,
		playerVelo
	}

}
let ORDER_FUNCS={
	move(toMove,weight=1){
		if(typeof toMove=="function"){
			return new Order(ORDER_TYPE.MOVE,toMove,weight);
		}else{
			return new Order(ORDER_TYPE.MOVE,(orderPos,orderAng,body,timeStep)=>{
				return toMove;
			},weight);
		}
	},
	moveDir(toMove,weight=1){
		if(typeof toMove=="function"){
			return new Order(ORDER_TYPE.MOVE,(orderPos,orderAng,body,timeStep)=>{
				return toMove(orderPos,orderAng,body).cln().add(body.getPos());
			},weight);
		}else{
			return new Order(ORDER_TYPE.MOVE,(orderPos,orderAng,body,timeStep)=>{
				return toMove.cln().add(body.getPos());
			},weight);
		}
	},
	face(toFace,weight=1){
		if(typeof toMove=="function"){
			return new Order(ORDER_TYPE.FACE,(orderPos,orderAng,body,timeStep)=>{
				return body.getPos().ang(toFace(orderPos,orderAng,body));
			},weight);
		}else{
			return new Order(ORDER_TYPE.FACE,(orderPos,orderAng,body,timeStep)=>{
				return body.getPos().ang(toFace);
			},weight);
		}
	},
	faceAng(toFace,weight=1){
		if(typeof toMove=="function"){
			return new Order(ORDER_TYPE.FACE,toFace,weight);
		}else{
			return new Order(ORDER_TYPE.FACE,(orderPos,orderAng,body,timeStep)=>{
				return toFace;
			},weight);
		}
	},
	shoot(dryFire=false){
		let bArr=gameRunner.aBullets;
		if(typeof dryFire=="function"){
			return new Order(ORDER_TYPE.FUNC,(orderPos,orderAng,body,timeStep)=>{
				if(dryFire(orderPos,orderAng,body)){
					body.dryFire();
				}else{
					body.shoot(bArr,timeStep);
				}
			});
		}else{
			return new Order(ORDER_TYPE.FUNC,(orderPos,orderAng,body,timeStep)=>{
				if(dryFire){
					body.dryFire();
				}else{
					body.shoot(bArr,timeStep);
				}
			});
		}
	},
	boost(){
		return new Order(ORDER_TYPE.FUNC,(orderPos,orderAng,body,timeStep)=>{
			body.boost(timeStep);
		});
	},
	special(func){
		return new Order(ORDER_TYPE.FUNC,func);
	},

	heightLimit(minY,maxY){
		return (orderPos,orderAng,body)=>{
			let p=orderPos.cln();
			p.y=clamp(p.y,minY,maxY);
			return p;
		};
	},

	circle(center,radius){
		return {
			getClosest:(vec)=>vec.cln().sub(center).nrm(radius).add(center),
			getDist:(vec)=>vec.mag(center)-radius
		};
	},

	inside(shape,vec){
		if(shape.getDist(vec)<=0){
			return vec;
		}
		return shape.getClosest(vec);
	},
	outside(shape,vec){
		if(shape.getDist(vec)>=0){
			return vec;
		}
		return shape.getClosest(vec);
	},
	on(shape,vec){
		return shape.getClosest(vec);
	}
};
//#endregion

//#region connection
/*
	█▀▀ █▀█ █▄ █ █▄ █ █▀▀ █▀▀ ▀█▀ █ █▀█ █▄ █
	█▄▄ █▄█ █ ▀█ █ ▀█ ██▄ █▄▄  █  █ █▄█ █ ▀█
*/
class Connection{
	constructor(parent,id,count){
		this.parent=parent;
		this.id=id;
		this.count=count;
		this.locked=false;
		this.connections=new Set();
	}
	isOpen(){
		return !this.locked
			&&this.connections.size<this.count
	}
	canConnect(connection){
		return this.isOpen()
			&&connection!=null
			&&connection?.parent!=this.parent
			&&!this.connections.has(connection);
	}
	connect(connection){
		this.connections.add(connection);
	}
	disconnect(connection=null){
		if(connection==null){
			this.connections.forEach(x=>x.disconnect(this));
			this.connections=new Set();
		}else{
			this.connections.delete(connection);
		}
	}
	lock(){
		this.locked=true;
	}
	unlock(){
		this.locked=false;
	}
	getFirst(){
		return this.connections.values().next().value;
	}
}
//#endregion

/*
	Priorities:
	<10 normal
	10-20 override
	20-30 boss override
	>30 mothership
*/

class BasicAI{
	constructor(body){
		this.body=body;
		this.body.head=this;
		this.orders=[];
		this.connections={};
		this.keepVelo=false;
	}

	//Connections
	getUnit(connectionId){
		return this.connections[connectionId].getFirst()?.parent;
	}
	getUnits(connectionId){
		return [...this.connections[connectionId].connections].map(x=>x.parent);
	}
	tryConnect(connectionId,types,targetId,range=Infinity,connectFunc=null){
		let connection=this.connections[connectionId];
		if(connection==null||!connection.isOpen()){
			return false;
		}

		let unit=gameRunner.director.getRandomUnit(types);
		if(unit==this||unit==null){
			return false;
		}
		if(range<Infinity){
			let p=this.getPos();
			if(unit.getPos(p).mag(p)>range){
				return false;
			}
		}
		
		let con=unit.connections[targetId];
		if(connection.canConnect(con)&&con.canConnect(connection)){
			if(connectFunc!=null){
				if(!connectFunc(connection,con)){
					return false;
				}
			}
			connection.connect(con);
			con.connect(connection);
			return true;
		}
		return false;
	}
	disputeConnection(connectionId,disputeFunc){
		let connection=this.connections[connectionId];
		[...connection.connections].forEach(con=>{
			if(disputeFunc(con.parent)){
				connection.disconnect(con);
				con.disconnect(connection);
			}
		});
	}
	disconnect(connectionId=null){
		if(connectionId==null){
			let conKeys=Object.keys(this.connections);
			conKeys.forEach(key=>this.connections[key].disconnect());
		}else{
			let connection=this.connections[connectionId];
			connection.disconnect();
		}
	}
	lock(connectionId){
		let connection=this.connections[connectionId];
		connection?.lock();
	}
	unlock(connectionId){
		let connection=this.connections[connectionId];
		connection?.unlock();
	}

	//Orders
	order(order,priority=null){
		if(priority!=null){
			order.priority=priority;
		}
		let orderIdx=binarySearch(this.orders,order,(a,b)=>a.priority>b.priority);
		if(orderIdx<0){
			orderIdx=-orderIdx-1;
		}
		this.orders.splice(orderIdx,0,order);
	}
	move(timeStep){
		let priority=-Infinity;

		let currPos=this.getPos();
		let currAng=this.getAng();

		let nextPos=Vec(0,0);
		let nextAngVec=Vec(0,0);

		let nextCountPos=0;
		let nextCountAng=0;

		let calcNext=()=>{
			if(nextCountPos>0){
				nextPos.scl(1/nextCountPos);
				currPos=nextPos;

				nextPos=Vec(0,0);
				nextCountPos=0;
			}
			if(nextCountAng>0){
				currAng=nextAngVec.ang();
				
				nextAngVec=Vec(0,0);
				nextCountAng=0;
			}
		}

		this.orders.forEach(o=>{
			if(o.priority>priority){
				priority=o.priority;

				calcNext();
			}
			if(o.type==ORDER_TYPE.MOVE){
				nextPos.add(o.run(currPos,currAng,this.body,timeStep).scl(o.weight));
				nextCountPos+=o.weight;
			}else if(o.type==ORDER_TYPE.FACE){
				nextAngVec.add(VecA(o.weight,o.run(currPos,currAng,this.body,timeStep)));
				nextCountAng+=o.weight;
			}else{
				o.run(currPos,currAng,this.body,timeStep);
			}
		});
		calcNext();
		
		this.body.moveTo(currPos,timeStep,this.keepVelo);
		this.body.faceAng(currAng,timeStep);
		
		this.orders=[];
	}
	
	//Run
	run(){

	}
	kill(){
		this.body.health=0;
	}
	//Events
	hit(target){
	}
	die(){
		this.disconnect();
	}

	//Getters
	getPos(refPos){
		return this.body.getPos(refPos);
	}
	getAng(){
		return this.body.getAng();
	}
	getDir(){
		return VecA(1,this.body.getAng());
	}
	isAlive(){
		return this.body.isAlive();
	}
}
class SwarmerAI extends BasicAI{
	constructor(body){
		super(body);
		this.connections={
			"head":new Connection(this,"head",1),
			"tail":new Connection(this,"tail",1),
		};
		this.chain={count:1};
	}
	run(){
		//Setup
		let {
			pos,ang,dir,speed,
			playerPos,playerAng,
		}=ORDER_VARS.call(this);
		let {
			move,moveDir,face,faceAng,shoot,boost,special,
			heightLimit,
			circle,
			inside,outside,on,
		}=ORDER_FUNCS;

		//Connections
		this.tryConnect("head","swarmer","tail",2000,(conSelf,conTarget)=>{
			let head=conTarget.parent;
			let conChain=head.chain;
			if(conChain==this.chain){
				return false;
			}
			let nextTail=this;
			while(nextTail!=null&&nextTail!=head){
				conChain.count++;
				nextTail.chain=conChain;
				nextTail=nextTail.getUnit("tail");
			}
			return true;
		});
		
		//Get Units
		let head=this.getUnit("head");
		let tail=this.getUnit("tail");

		//Orders
		if(head==null){
			this.order(face(playerPos),2);
			this.order(faceAng(ang,20),2);
			let headSpeed=40;
			this.order(moveDir(dir.cln().scl(headSpeed)),2);
		}else{
			let gap=80;
			let p1=head.getPos(pos);
			let p2=pos;
			let p=p2.cln().sub(p1).nrm(gap).add(p1);

			this.order(face(p1));
			this.order(move(p),2);
		}
	}
	disconnect(connectionId=null){
		if(connectionId==null){
			this.fuseChain();
		}
		super.disconnect(connectionId);
	}
	fuseChain(){
		this.chain.count--;
		let headTargetCon=this.connections.head.getFirst();
		let tailTargetCon=this.connections.tail.getFirst();
		this.connections.tail.disconnect();
		this.connections.head.disconnect();

		if(headTargetCon!=null&&tailTargetCon!=null){
			headTargetCon.connect(tailTargetCon);
			tailTargetCon.connect(headTargetCon);
		}
		this.chain={count:1};
	}
}
class ShieldAI extends BasicAI{
	constructor(body){
		super(body);
		this.connections={
			"head":new Connection(this,"shieldStart",1),
			"tail":new Connection(this,"shieldEnd",1),
			"unit":new Connection(this,"unit",1),
			"boss":new Connection(this,"boss",1),
		};
		this.chain={count:1,tailDir:Vec(0,0),headDir:Vec(0,0)};
	}
	run(){
		//Setup
		let {
			pos,ang,dir,speed,
			playerPos,playerAng,
		}=ORDER_VARS.call(this);
		let {
			move,moveDir,face,faceAng,shoot,boost,special,
			heightLimit,
			circle,
			inside,outside,on,
		}=ORDER_FUNCS;

		//Connections
		this.tryConnect("head","shield","tail",1000,(conSelf,conTarget)=>{
			let head=conTarget.parent;
			let conChain=head.chain;
			if(conChain==this.chain||this.chain.count+conChain.count>12){
				return false;
			}
			let nextTail=this;
			while(nextTail!=null&&nextTail!=head){
				conChain.count++;
				nextTail.chain=conChain;
				nextTail=nextTail.getUnit("tail");
			}
			return true;
		});
		this.tryConnect("unit","sniper","shield",1000);
		
		//Get Units
		let head=this.getUnit("head");
		let tail=this.getUnit("tail");
		let unit=this.getUnit("unit");

		//Orders
		if(head!=null&&tail!=null){
			let headPos=head.getPos(pos);
			let tailPos=tail.getPos(pos);
			let lineDir=headPos.cln().sub(tailPos).nrm(1);

			let pAng=pos.ang(playerPos);
			let lAng=lineDir.ang();
			if(nrmAngPI(pAng-lAng)>0){
				this.order(faceAng(lineDir.ang()+PI/2));
			}else{
				this.order(faceAng(lineDir.ang()-PI/2));
			}

			unit?.order(move((orderPos,orderAng,body)=>inside(circle(this.getPos(body.getPos()).sub(dir.cln().scl(200)),100),orderPos)),10);
		}else if(tail!=null){
			let fA=pos.ang(tail.getPos(pos))+PI;
			this.chain.headDir=VecA(1,fA);
			let realA=this.chain.headDir.cln().sub(this.chain.tailDir).ang();
			
			this.order(faceAng(realA));
			this.order(moveDir(VecA(100,ang)));
		}else if(head!=null){
			let fA=pos.ang(head.getPos(pos))+PI;
			this.chain.tailDir=VecA(1,fA);
			let realA=this.chain.tailDir.cln().sub(this.chain.headDir).ang();

			this.order(faceAng(realA));
			this.order(moveDir(VecA(100,ang)));
		}else{
			this.order(face(playerPos));
			this.order(moveDir(VecA(100,ang)));

			unit?.order(move((orderPos,orderAng,body)=>inside(circle(this.getPos(body.getPos()).sub(dir.cln().scl(200)),100),orderPos)),10);
		}

		head?.order(move((orderPos,orderAng,body)=>on(circle(this.getPos(body.getPos()),150),orderPos)));
		tail?.order(move((orderPos,orderAng,body)=>on(circle(this.getPos(body.getPos()),150),orderPos)));
		this.order(move(heightLimit(-4000,0)),5);
	}
	disconnect(connectionId=null){
		if(connectionId==null){
			this.fuseChain();
		}
		super.disconnect(connectionId);
	}
	fuseChain(){
		this.chain.count--;
		let headTargetCon=this.connections.head.getFirst();
		let tailTargetCon=this.connections.tail.getFirst();
		this.connections.tail.disconnect();
		this.connections.head.disconnect();

		if(headTargetCon!=null&&tailTargetCon!=null){
			headTargetCon.connect(tailTargetCon);
			tailTargetCon.connect(headTargetCon);
		}
		this.chain={count:1,tailDir:Vec(0,0),headDir:Vec(0,0)};
	}
}
class ChaseAI extends BasicAI{
	run(){
		//Setup
		let {
			pos,ang,dir,speed,
			playerPos,playerAng,
		}=ORDER_VARS.call(this);
		let {
			move,moveDir,face,faceAng,shoot,boost,special,
			heightLimit,
			circle,
			inside,outside,on,
		}=ORDER_FUNCS;

		//Orders
		this.order(face(playerPos));
		this.order(move((orderPos,orderAng)=>orderPos.cln().add(dir.cln().scl(100))));
		this.order(shoot());
	}
}
class GunnerAI extends BasicAI{
	constructor(body){
		super(body);
		this.range=1000;
		this.fireRange=2000;
	}
	run(){
		//Setup
		let {
			pos,ang,dir,speed,
			playerPos,playerAng,
		}=ORDER_VARS.call(this);
		let {
			move,moveDir,face,faceAng,shoot,boost,special,
			heightLimit,
			circle,
			inside,outside,on,
		}=ORDER_FUNCS;

		//Orders
		this.order(face(playerPos));
		this.order(move((orderPos,orderAng)=>on(circle(playerPos,this.range),orderPos)));
		this.order(shoot(playerPos.mag(pos)>this.fireRange));
	}
}
class SniperAI extends GunnerAI{
	constructor(body){
		super(body);
		this.connections={
			"shield":new Connection(this,"shield",1),
			"boss":new Connection(this,"boss",1),
		};
		this.range=1000;
		this.fireRange=2000;
		this.keepVelo=true;
	}
}
class StarGunnerAI extends BasicAI{
	constructor(body){
		super(body);
		this.connections={
			"shield":new Connection(this,"shield",1),
			"boss":new Connection(this,"boss",1),
		};
		this.range=1500;
		this.scareRange=500;
		this.fireRange=3000;
		this.keepVelo=true;
	}
	run(){
		//Setup
		let {
			pos,ang,dir,speed,
			playerPos,playerAng,
		}=ORDER_VARS.call(this);
		let {
			move,moveDir,face,faceAng,shoot,boost,special,
			heightLimit,
			circle,
			inside,outside,on,
		}=ORDER_FUNCS;

		//Orders
		this.order(face(playerPos));
		this.order(move((orderPos,orderAng)=>on(circle(playerPos,this.range),orderPos)));
		this.order(shoot(playerPos.mag(pos)>this.fireRange));
		this.order(special((orderPos,orderAng,body)=>{
			if(pos.mag(playerPos)>this.scareRange){
				body.setMode(true);
			}else{
				body.setMode(false);
				this.connections.shield?.disconnect();
			}
		}));
	}
}
class FlockAI extends BasicAI{
	constructor(body){
		super(body);
		this.connections={
			"flock":new Connection(this,"flock",8),
		};
		this.range=200;
		this.connectRange=this.range*2;
	}
	run(){
		//Setup
		let {
			pos,ang,dir,speed,
			playerPos,playerAng,
		}=ORDER_VARS.call(this);
		let {
			move,moveDir,face,faceAng,shoot,boost,special,
			heightLimit,
			circle,
			inside,outside,on,
		}=ORDER_FUNCS;

		//Connections
		this.tryConnect("flock","flock","flock",this.connectRange);
		this.disputeConnection("flock",x=>
			x.getPos(pos).mag(pos)>this.connectRange
		);
		
		//Get Units
		let flock=this.getUnits("flock");

		//Orders
		flock.forEach(f=>f.order(move((orderPos)=>on(circle(pos,this.range),orderPos))));
		let avgVelo=flock.reduce((curr,f)=>curr.add(f.body.velo),Vec(0,0)).scl(flock.length);
		this.order(move((orderPos)=>orderPos.cln().add(dir.cln().scl(100)).add(avgVelo)),2);
		this.order(face(playerPos));
		this.order(shoot(playerPos.mag(pos)>1000));
	}
}
class BossAxeAI extends BasicAI{
	constructor(body){
		super(body);
		this.connections={
			"sniperRight":new Connection(this,"sniperRight",5),
			"sniperLeft":new Connection(this,"sniperLeft",5),
			"mother":new Connection(this,"mother",1),
		};
		this.range=4000;
		this.rot=0;
	}
	run(timeStep){
		this.rot-=timeStep*.005;
		//Setup
		let {
			pos,ang,dir,speed,
			playerPos,playerAng,
		}=ORDER_VARS.call(this);
		let {
			move,moveDir,face,faceAng,shoot,boost,special,
			heightLimit,
			circle,
			inside,outside,on,
		}=ORDER_FUNCS;

		//Connections
		this.tryConnect("sniperRight","sniper","boss",10000,(conSelf,conTarget)=>{
			let target=conTarget.parent;
			target.disconnect();
			target.lock("shield");
			return true;
		});
		//Connections
		this.tryConnect("sniperLeft","sniper","boss",10000,(conSelf,conTarget)=>{
			let target=conTarget.parent;
			target.disconnect();
			target.lock("shield");
			return true;
		});

		//Orders
		let right=this.getUnits("sniperRight");
		for(let i=0;i<right.length;i++){
			let p=VecA(i*150+300,this.rot+0).add(this.getPos(right[i].getPos()));
			right[i].order(move(p),20);
		}
		let left=this.getUnits("sniperLeft");
		for(let i=0;i<left.length;i++){
			let p=VecA(i*150+300,this.rot+PI).add(this.getPos(left[i].getPos()));
			left[i].order(move(p),20);
		}

		this.order(face(playerPos));
		this.order(move((orderPos,orderAng)=>on(circle(playerPos,this.range),orderPos)));
		this.order(shoot());
		this.order(move(heightLimit(-4000,-500)),5);
	}
	disconnect(connectionId=null){
		if(connectionId==null){
			let right=this.getUnits("sniperRight");
			right.forEach(s=>{
				s.unlock("shield");
				s.disconnect();
			});
			let left=this.getUnits("sniperLeft");
			left.forEach(s=>{
				s.unlock("shield");
				s.disconnect();
			})
		}
		super.disconnect(connectionId);
	}
}
class BossDrillAI extends BasicAI{
	constructor(body){
		super(body);
		this.keepVelo=true;
	}
	run(){
		//Setup
		let {
			pos,ang,dir,speed,velo,
			playerPos,playerAng,
		}=ORDER_VARS.call(this);
		let {
			move,moveDir,face,faceAng,shoot,boost,special,
			heightLimit,
			circle,
			inside,outside,on,
		}=ORDER_FUNCS;

		//Orders
		this.order(face(playerPos));
		if(Math.abs(nrmAngPI(pos.ang(playerPos)-ang))<PI/12){
			this.order(shoot());
			this.order(boost());
		}
	}
}
class BossSpikeAI extends BasicAI{
	constructor(body){
		super(body);
		this.connections={
			"shield":new Connection(this,"shield",20),
			"mother":new Connection(this,"mother",1),
			"spike":new Connection(this,"spike",100),
		};
		this.keepVelo=true;
		this.rot=0;
	}
	run(timeStep){
		this.rot-=timeStep*.005;
		//Setup
		let {
			pos,ang,dir,speed,velo,
			playerPos,playerAng,
		}=ORDER_VARS.call(this);
		let {
			move,moveDir,face,faceAng,shoot,boost,special,
			heightLimit,
			circle,
			inside,outside,on,
		}=ORDER_FUNCS;

		//Connections
		this.tryConnect("shield","shield","boss",10000,(conSelf,conTarget)=>{
			let target=conTarget.parent;
			target.fuseChain();
			target.lock("tail");
			target.lock("head");
			return true;
		});
		this.tryConnect("spike","boss","spike",2000);
		this.disputeConnection("spike",x=>
			x.getPos(pos).mag(pos)>3000
		);

		//Orders
		let shields=this.getUnits("shield");
		for(let i=0;i<shields.length;i++){
			let a=TAU*i/shields.length+this.rot;
			let m=Math.max(shields.length*300/TAU,500);
			let p=VecA(m,a).add(this.getPos(shields[i].getPos()));
			shields[i].order(move(p),20);
			shields[i].order(faceAng(a),20);
		}

		this.order(face(playerPos));
		this.order(move(playerPos));
		this.order(shoot(playerPos.mag(pos)>1000));

		let spikes=this.getUnits("spike");
		spikes.forEach(c=>{
			let sp=c.getPos();
			let p=this.getPos(c.getPos());
			if(sp.mag(p)<2000){
				c.order(move(on(circle(p,2000),sp)),20);
			}
		});
	}
	disconnect(connectionId=null){
		if(connectionId==null){
			let shields=this.getUnits("shield");
			shields.forEach(s=>{
				s.unlock("tail");
				s.unlock("head");
				s.disconnect();
			})
		}
		super.disconnect(connectionId);
	}
}
class BossYarnAI extends BasicAI{
	constructor(body){
		super(body);
		this.randPos=null;
	}
	run(){
		//Setup
		let {
			pos,ang,dir,speed,velo,
			playerPos,playerAng,
		}=ORDER_VARS.call(this);
		let {
			move,moveDir,face,faceAng,shoot,boost,special,
			heightLimit,
			circle,
			inside,outside,on,
		}=ORDER_FUNCS;

		//Orders
		if(this.randPos==null){
			this.randPos=VecA(1000,Math.random()*TAU).add(pos);
			this.randPos.y=clamp(this.randPos.y,-4000,-500);
		}
		this.order(move(this.randPos));
		if(this.randPos.mag(pos)<100){
			this.randPos=null;
		}
		this.order(shoot(playerPos.mag(pos)>1500));
	}
}

class MothershipAI extends BasicAI{
	constructor(body){
		super(body);
		this.connections={
			"shield":new Connection(this,"shield",500),
			"child":new Connection(this,"child",10),
		};
		this.keepVelo=true;
		this.rot=0;
	}
	run(timeStep){
		//Setup
		let {
			pos,ang,dir,speed,velo,
			playerPos,playerAng,
		}=ORDER_VARS.call(this);
		let {
			move,moveDir,face,faceAng,shoot,boost,special,
			heightLimit,
			circle,
			inside,outside,on,
		}=ORDER_FUNCS;

		//Connections
		this.tryConnect("shield","shield","boss",10000,(conSelf,conTarget)=>{
			let target=conTarget.parent;
			target.fuseChain();
			target.lock("tail");
			target.lock("head");
			return true;
		});
		this.tryConnect("child","boss","mother",10000,(conSelf,conTarget)=>{
			let target=conTarget.parent;
			target.disconnect();
			target.lock("shield");
			target.lock("sniperRight");
			target.lock("sniperLeft");
			return true;
		});

		//Orders
		let shields=this.getUnits("shield");
		let ringSize=Math.max(shields.length*300/TAU,1000);
		for(let i=0;i<shields.length;i++){
			let a=TAU*i/shields.length+this.rot;
			let p=VecA(ringSize,a).add(this.getPos(shields[i].getPos()));
			shields[i].order(move(p),30);
			shields[i].order(faceAng(a),30);
		}
		this.rot-=timeStep*10/(ringSize*TAU);
		
		let children=this.getUnits("child");
		children.forEach(c=>c.order(move((orderPos)=>inside(circle(this.getPos(orderPos),ringSize-250),orderPos)),30));
		children.forEach(c=>{
			let cp=c.getPos();
			let p=this.getPos(cp);
			if(cp.mag(p)<450){
				c.order(move(on(circle(p,500),cp)),31);
			}
		});
	}
	disconnect(connectionId=null){
		if(connectionId==null){
			let shields=this.getUnits("shield");
			shields.forEach(s=>{
				s.unlock("tail");
				s.unlock("head");
				s.disconnect();
			});
			
			let children=this.getUnits("child");
			children.forEach(s=>{
				s.unlock("shield");
				s.unlock("sniperRight");
				s.unlock("sniperLeft");
				s.disconnect();
			});
		}
		super.disconnect(connectionId);
	}
}
class SpaghettiAI extends BasicAI{
	constructor(body){
		super(body);
		this.time=0;
		this.heightLimit=-30000;
		this.despawnLimit=-25000;
	}
	run(timeStep){
		//Setup
		let {
			pos,ang,dir,speed,
			playerPos,playerAng,playerVelo
		}=ORDER_VARS.call(this);
		let {
			move,moveDir,face,faceAng,shoot,boost,special,
			heightLimit,
			circle,
			inside,outside,on,
		}=ORDER_FUNCS;

		this.time+=timeStep;

		//Orders
		let p=playerPos.cln().add(Vec(0,-500));
		p.y=Math.min(p.y,this.heightLimit);
		if(playerPos.mag(pos)>10000){
			this.body.pos=pos.cln().sub(playerPos).lim(9000).add(playerPos);
		}
		this.order(move(p));
		if(this.time>200){
			if(playerPos.y>this.despawnLimit){
				this.body.kill();
			}
		}
		if(playerPos.y<this.heightLimit){
			let player=gameRunner.getPlayer();
			player.velo.lim(4);
			player.velo.add(Vec(0,(this.heightLimit-playerPos.y)*timeStep));
		}
	}
}
