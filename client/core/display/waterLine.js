class WaterLine{
	constructor(game){
		this.game=game;
		this.waterSize=100;
		this.line=Array(100).fill(0);//TODO: make it so this will work with non-square numbers
		this.lineVelo=Array(100).fill(0);
	}
	run(timeStep){
		if(timeStep>1){
			let steps=Math.ceil(timeStep);
			let subTimeStep=timeStep/steps;
			for(let i=0;i<steps;i++){
				this.run(subTimeStep);
			}
			return;
		}
		this.line=this.line.map((w,i)=>{
			let prev=this.line[mod(i-1,this.line.length)];
			let next=this.line[mod(i+1,this.line.length)];
			let avg=(prev+next)/2;
			this.lineVelo[i]+=((avg-w)*.2)*timeStep;
			this.lineVelo[i]-=(w*.02)*timeStep;
			this.lineVelo[i]*=0.99**timeStep;
			return Math.max(w+this.lineVelo[i]*timeStep,-500);
		});
		this.lineVelo=this.lineVelo.map((w,i)=>{
			let prev=this.lineVelo[mod(i-1,this.lineVelo.length)];
			let next=this.lineVelo[mod(i+1,this.lineVelo.length)];
			let avg=(prev+next+w)/3;
			return mix(w,avg,0.1*timeStep);
		});
	}
	wave(x,y,width,strength){
		let vec=loopVec(Vec(x,y),gameRunner.getPlayer().getPos());
		x=vec.x;
		y=vec.y;
		
		if(this.game.offScreen(x,y,width)){
			return;
		}
		if(Math.abs(y)>500)
			return;
		x=mod(x,this.waterSize*this.line.length);
		let idx=Math.floor(x/this.waterSize);
		let off=Math.floor(width/this.waterSize);
		for(let i=idx-off;i<=idx+off;i++){
			let i2=mod(i,this.line.length);
			let scale=width/Math.max(Vec(x,y).mag(Vec(i*this.waterSize,this.line[i2])),width);
			this.lineVelo[i2]+=strength*scale;
		}
	}
	forceWave(x,y,width,strength){
		let vec=loopVec(Vec(x,y),gameRunner.getPlayer().getPos());
		x=vec.x;
		y=vec.y;
		
		if(Math.abs(y)>500)
			return;
		x=mod(x,this.waterSize*this.line.length);
		let idx=Math.floor(x/this.waterSize);
		let off=Math.floor(width/this.waterSize);
		for(let i=idx-off;i<=idx+off;i++){
			let i2=mod(i,this.line.length);
			let scale=width/Math.max(Vec(x,y).mag(Vec(i*this.waterSize,this.line[i2])),width);
			this.lineVelo[i2]+=strength*scale;
		}
	}
	getLine(x){
		let between=mod(x,this.waterSize)/this.waterSize;

		let idx=mod(Math.floor(x/this.waterSize),this.waterSize);

		let idx1=idx;
		let idx2=mod(idx+1.,this.line.length);

		let y1=this.line[idx1];
		let y2=this.line[idx2];

		return mix(y1,y2,between);
	}
	isUnderwater(x,y){
		if(y<-500)
			return false;
		return this.getLine(x)<y;
	}
}