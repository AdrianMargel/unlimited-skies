class CloudMap{
	constructor(s){
		//the size of the cloud map
		this.size=s.cln();
		//the size of each cloud tile
		this.cloudSize=1000;
		//the resolution of each tile
		this.cloudRez=40;
		//the scale of the cloud size
		this.cloudScale=this.cloudSize/this.cloudRez;
		//the length of array within each tile
		this.cloudLength=(this.cloudRez**2)*4;
		this.cloudTimeLength=(this.cloudRez**2);
		//the size of the 2d array of tiles
		this.cloudDims=this.size.cln().div(this.cloudSize).ceil();

		this.clouds=Array(this.cloudDims.x).fill().map(()=>
			Array(this.cloudDims.y).fill(null)
		);
		this.cloudTimes=Array(this.cloudDims.x).fill().map(()=>
			Array(this.cloudDims.y).fill(null)
		);

		this.emptyCloud=new Uint8Array(this.cloudLength);
		this.emptyCloudTime=new Uint32Array(this.cloudTimeLength);

		this.cloudRenderDistance=Vec(8,8);
		this.visibleClouds=new Uint8Array(this.cloudLength*this.cloudRenderDistance.x*this.cloudRenderDistance.y);
		this.visibleCloudTimes=new Uint32Array(this.cloudTimeLength*this.cloudRenderDistance.x*this.cloudRenderDistance.y);

		//where the clouds stop
		this.topY=this.cloudDims.y*this.cloudSize;
	}
	cloud(x,y,r,g,b,a){
		if(y>0||y<-this.topY){
			return;
		}
		x=x/this.cloudScale;
		y=y/this.cloudScale;
		let metaPX=mod(Math.floor(x/this.cloudRez),this.cloudDims.x);
		let metaPY=mod(Math.floor(y/this.cloudRez),this.cloudDims.y);

		this.clouds[metaPX][metaPY]=this.clouds[metaPX][metaPY]??new Uint8Array(this.cloudLength);
		this.cloudTimes[metaPX][metaPY]=this.cloudTimes[metaPX][metaPY]??new Uint32Array(this.cloudTimeLength);

		let tilePX=Math.floor(mod(x,this.cloudRez));
		let tilePY=Math.floor(mod(y,this.cloudRez));
		let tileIdx=tilePX+tilePY*this.cloudRez;
		let idx=tileIdx*4;

		let tDelta=1.-clamp((this.getTime()-this.cloudTimes[metaPX][metaPY][tileIdx])/1000,0,1);

		this.cloudTimes[metaPX][metaPY][tileIdx]=this.getTime();

		let r1=this.clouds[metaPX][metaPY][idx];
		let g1=this.clouds[metaPX][metaPY][idx+1];
		let b1=this.clouds[metaPX][metaPY][idx+2];
		let a1=this.clouds[metaPX][metaPY][idx+3]*tDelta;

		let a2=(1-(1-a1/255)*(1-a/255))*255;
		let m=a/a2;

		this.clouds[metaPX][metaPY][idx]=mix(r1,r,m);
		this.clouds[metaPX][metaPY][idx+1]=mix(g1,g,m);
		this.clouds[metaPX][metaPY][idx+2]=mix(b1,b,m);
		this.clouds[metaPX][metaPY][idx+3]=a2;
	}
	getClouds(screenStart){
		let offsetX=Math.floor(screenStart.x/this.cloudSize);
		let offsetY=Math.floor(screenStart.y/this.cloudSize);
		for(let y=0;y<this.cloudRenderDistance.y;y++){
			for(let x=0;x<this.cloudRenderDistance.x;x++){
				let x1=x+offsetX;
				let y1=y+offsetY;
				let x3=mod(x1,this.cloudRenderDistance.x);
				let y3=mod(y1,this.cloudRenderDistance.y);

				let idx=this.cloudLength*x3 + this.cloudLength*y3*this.cloudRenderDistance.x;
				let idxT=this.cloudTimeLength*x3 + this.cloudTimeLength*y3*this.cloudRenderDistance.x;
				if(y1>=0||y1<-this.clouds[0].length){
					this.visibleClouds.set(this.emptyCloud,idx);
					this.visibleCloudTimes.set(this.emptyCloudTime,idxT);
				}else{
					let x2=mod(x1,this.clouds.length);
					let y2=mod(y1,this.clouds[0].length);
					this.visibleClouds.set(
						this.clouds[x2][y2]??this.emptyCloud,
						idx
					);
					this.visibleCloudTimes.set(
						this.cloudTimes[x2][y2]??this.emptyCloudTime,
						idxT
					);
				}
			}
		}
		return {
			arr:this.visibleClouds,
			timeArr:this.visibleCloudTimes,
			width:this.cloudRenderDistance.x*this.cloudRez,
			metaWidth:this.cloudRenderDistance.x,
			metaHeight:this.cloudRenderDistance.y
		};
	}
	getTime(){
		return gameRunner.getTime();
	}
}