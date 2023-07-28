class ShadowLine{
	constructor(game){
		this.game=game;
		this.shadowSize=1;
		this.line=Array(10000);
	}
	resetShadow(){
		this.line.fill(1000000);
	}
	shadow(x,y,width){
		let vec=loopVec(Vec(x,y),gameRunner.getPlayer().getPos());
		x=vec.x;
		y=vec.y;
		
		width=Math.max(width,50);
		let bottomX=x-(y-this.game.screenEnd.y)*0.5;
		let topX=x-(y-this.game.screenStart.y)*0.5;
		if(this.game.offScreen(bottomX,this.game.screenEnd.y,width)
			&&this.game.offScreen(topX,this.game.screenStart.y,width)){
			return;
		}
		x=x-y*.5;
		let idx=Math.floor(x/this.shadowSize);
		let off=Math.floor(width/this.shadowSize);
		
		for(let i=idx-off;i<=idx+off;i++){
			let i2=mod(i,this.line.length);
			this.line[i2]=Math.min(this.line[i2],y);
		}
	}
}