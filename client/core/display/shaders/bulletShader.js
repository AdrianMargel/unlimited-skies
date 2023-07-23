class BulletShader{
	constructor(){
		this.init();
		this.prime();
	}
	prime(){
		this.position=[];
		this.objectPos=[];
		this.objectVelo=[];
		this.objectSize=[];
		this.objectColor=[];
		this.objectAge=[];
		this.indices=[];
		this.count=0;
	}
	line(x,y,size,veloX,veloY,age,colorR,colorG,colorB){
		this.position.push(
			1, 1,
			1, -1,
			-1, 1,
			-1, -1
		);
		this.objectPos.push(
			x,y,
			x,y,
			x,y,
			x,y,
		);
		this.objectVelo.push(
			veloX,veloY,
			veloX,veloY,
			veloX,veloY,
			veloX,veloY,
		);
		this.objectSize.push(
			size,size,size,size
		);
		this.objectColor.push(
			colorR,colorG,colorB,
			colorR,colorG,colorB,
			colorR,colorG,colorB,
			colorR,colorG,colorB
		);
		this.objectAge.push(
			age,age,age,age
		);
		this.indices.push(
			this.count+0,this.count+1,this.count+2,
			this.count+1,this.count+2,this.count+3
		);
		this.count+=4;
	}
	init(){
		let vs=glsl`#version 300 es
			in vec4 position;

			in vec2 objectPos;
			in vec2 objectVelo;
			in float objectSize;
			in vec3 objectColor;
			in float objectAge;
			uniform vec2 resolution;

			uniform vec2 camPos;
			uniform float camZoom;
			uniform vec2 screenStart;

			out vec2 real;
			out vec2 center;
			out float size;
			out vec2 velo;
			out vec3 color;

			vec2 loopVec(vec2 vec,vec2 ref){
				vec2 modP=vec;
				float mapWidth=${(20000).toFixed(1)};
				float offsetEdge=ref.x-mapWidth/2.;
				modP.x=mod(modP.x-offsetEdge,mapWidth)+offsetEdge;
				return modP;
			}

			void main(){
				vec2 oPos=loopVec(objectPos,screenStart);
				float leng=min(objectAge,3.);
				vec4 pos=position;
				float mag=length(objectVelo*leng);
				bool moving=objectVelo.x!=0.||objectVelo.y!=0.;
				vec2 rotation=moving?
					normalize(objectVelo):
					vec2(1.,0.);

				vec2 oS=vec2(objectSize);
				if(position.x==-1.&&objectAge>0.&&moving){
					oS.x+=mag+objectSize;
				}
				pos.xy*=oS;

				pos.xy=vec2(
					pos.x*rotation.x - pos.y*rotation.y,
					pos.x*rotation.y + pos.y*rotation.x);
				vec2 realPos=pos.xy+oPos;
				pos.xy+=oPos-camPos;
				pos.xy*=camZoom/resolution;

				pos.xy=pos.xy*2.-1.;
				pos.y*=-1.;

				gl_Position=pos;
  				real=realPos;
				center=oPos;
				size=objectSize*2.;
				color=objectColor;
				velo=objectVelo*leng*2.;
			}
		`;

		let fs=glsl`#version 300 es
			precision highp float;
			uniform vec2 resolution;
			in vec2 real;
			in vec2 center;
			in float size;
			in vec2 velo;
			in vec3 color;

			out vec4 outColor;

			${samplerVar("backgrounds")}
			${samplerVar("water")}
			${idxFunc("water")}
			${gammaFuncs()}
			${waterFuncs()}

			vec3 getSky(float height){
				return texture(backgrounds,vec2(0.,height/12000.+1.)).rgb;
			}
			vec3 getWater(float depth){
				return texture(backgrounds,vec2(1.,1.-depth)).rgb;
			}

			void main(){
				float mag=length(velo);
				float centerDist=max(1.-length(real-center)/size,0.);
				float veloDist1=1.-abs(dot(
					center-real,
					normalize(vec2(velo.y,-velo.x))
				))/size;
				if(dot(center-real,velo)<0.){
					veloDist1=0.;
				}
				float dist=max(veloDist1,centerDist)*
					pow(min(1.-(length(real-center)-size)/mag,1.),1.);
				vec3 col=color*pow(.5+dist,2.);
				if(dist<=0.5){
					discard;
					return;
				}
				float waterline=getWaterline(real.x,real.y);
				if(real.y<waterline){
					outColor=vec4(col,1.);
				}else{
					float topX=real.x-real.y*0.5;
					float waterline1=getWaterline(topX-50.,real.y);
					float waterline2=getWaterline(topX+50.,real.y);

					float depthReal=real.y;
					float depthWater=real.y-waterline;
					float scale=min(max(1.-depthReal/500.,0.),1.);
					float depthScaled=mix(depthReal,depthWater,scale);
					float depth=min(max(1.-depthScaled/3000.,0.),1.);
					vec3 ambient=vec3(0.,0.02,.05);
					vec3 water=gammaShift(getWater(depth));

					if(depthWater<20.){
						water*=0.9;
					}
					vec3 shade=water+ambient;
					// shade.x=pow(shade.x,1.5);
					// shade.y=pow(shade.y,1.5);
					// shade.z=pow(shade.z,1.5);
					outColor=vec4(gammaCorrect(shade)*col,1.);
				}
			}
		`;

		let programInfo=twgl.createProgramInfo(gl,[vs,fs]);

		this.programInfo=programInfo;
	}
	run(cam,screenStart){
		let textures=sharedTextures.textures;

		if(this.count<=0)
			return;

		let uniforms={
			resolution: [gl.canvas.width,gl.canvas.height],

			waterResolution: [textures.waterBox.width,textures.waterBox.height],
			water: textures.waterTex,
			backgroundsResolution: [textures.backgroundsBox.width,textures.backgroundsBox.height],
			backgrounds: textures.backgroundsTex,

			screenStart:[screenStart.x,screenStart.y],
			camPos:[cam.pos.x,cam.pos.y],
			camZoom:cam.zoom*cam.pixelScale,
			random:Math.random(),
		};
		let arrays={
			position:{
				numComponents:2,
				data:this.position
			},
			objectPos:{
				numComponents:2,
				data:this.objectPos
			},
			objectVelo:{
				numComponents:2,
				data:this.objectVelo
			},
			objectSize:{
				numComponents:1,
				data:this.objectSize
			},
			objectColor:{
				numComponents:3,
				data:this.objectColor
			},
			objectAge:{
				numComponents:1,
				data:this.objectAge
			},
			indices:{
				numComponents:3,
				data:this.indices
			}
		};

		let bufferInfo=twgl.createBufferInfoFromArrays(gl,arrays);

		gl.useProgram(this.programInfo.program);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		twgl.setBuffersAndAttributes(gl, this.programInfo, bufferInfo);
		twgl.setUniforms(this.programInfo, uniforms);
		twgl.drawBufferInfo(gl, bufferInfo);
	}
}