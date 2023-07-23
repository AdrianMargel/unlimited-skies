class TextureManager{
	constructor(){
		this.reuse={};
		this.textures={};
		this.loadCount=0;
	}
	init(cloudMap){
		let cloudRenderSize=cloudMap.cloudRenderDistance.cln().scl(cloudMap.cloudRez);
		this.textures.cloudPaintTex=toTexture({
			width: cloudRenderSize.x,
			height: cloudRenderSize.y,
			minMag: gl.LINEAR,
			internalFormat: gl.RGBA8,
		});
		this.textures.cloudPaintBox={
			width:cloudRenderSize.x,
			height:cloudRenderSize.y
		}

		this.loadImageTexture("spriteSheet",{
			src: "img/sprites.png",
			minMag: gl.NEAREST,
			wrap: gl.CLAMP_TO_EDGE
		});
		this.loadImageTexture("noise",{
			src: "img/noise2D.png",
			minMag: gl.LINEAR,
			wrap: gl.REPEAT
		});
		this.loadImageTexture("worley",{
			src: "img/worley2D.png",
			minMag: gl.LINEAR,
			wrap: gl.REPEAT
		});
		this.loadImageTexture("backgrounds",{
			src: "img/backgrounds.png",
			minMag: gl.LINEAR,
			wrap: gl.CLAMP_TO_EDGE
		});
	}
	run(cam,waterArr,shadowArr,cloudsObj){
		twgl.resizeCanvasToDisplaySize(gl.canvas,cam.pixelScale);
		gl.viewport(0,0,gl.canvas.width,gl.canvas.height);

		this.updateArrayTexture(
			"water",
			boxArray(waterArr,1),
			gl.R16F,
			Float32Array
		);
		this.updateArrayTexture(
			"shadow",
			boxArray(shadowArr,1),
			gl.R16F,
			Float32Array
		);
		this.updateArrayTexture(
			"clouds",
			boxTypedArray(cloudsObj.arr,4,cloudsObj.width),
			gl.RGBA8
		);
		this.updateArrayTexture(
			"cloudTimes",
			boxTypedArray(cloudsObj.timeArr,1,cloudsObj.width),
			gl.R32UI
		);
	}
	loadImageTexture(name,settings){
		this.loadCount++;
		this.textures[name+"Tex"]=toTexture(settings,(_,__,img)=>{
			this.textures[name+"Box"]={
				width:img.width,
				height:img.height
			};
			this.loadCount--;
		});
	}
	updateArrayTexture(name,boxedArr,internalFormat,reuseArrayType=null){
		let box;
		let tex;
		if(this.textures[name+"Tex"]!=null){
			box=boxedArr;
			tex=this.textures[name+"Tex"];

			let arr;
			if(reuseArrayType==null){
				arr=boxedArr.arr;
			}else{
				arr=this.reuse[name+"Arr"];
				arr.set(box.arr);
			}

			updateTexture(tex,arr,{
				width: box.width,
				height: box.height,
				minMag: gl.NEAREST,
				internalFormat,
			});

			this.textures[name+"Box"]=box;
		}else{
			box=boxedArr;

			let arr=reuseArrayType==null?boxedArr.arr:(this.reuse[name+"Arr"]=new reuseArrayType(box.arr));

			tex=toTexture({
				src: arr,
				width: box.width,
				height: box.height,
				minMag: gl.NEAREST,
				internalFormat,
			});

			this.textures[name+"Box"]=box;
			this.textures[name+"Tex"]=tex;
		}
	}
	isLoaded(){
		return this.loadCount==0;
	}
}