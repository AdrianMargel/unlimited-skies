class ParticleShader{
	constructor(){
		let maxParticles=1000;//This should match with the EffectManager
		this.position=new DynamicTypedArray(Float32Array,8,maxParticles);
		this.objectPos=new DynamicTypedArray(Float32Array,8,maxParticles);
		this.objectVelo=new DynamicTypedArray(Float32Array,8,maxParticles);
		this.objectSize=new DynamicTypedArray(Float32Array,4,maxParticles);
		this.objectColor=new DynamicTypedArray(Float32Array,12,maxParticles);
		this.objectAirOnly=new DynamicTypedArray(Float32Array,4,maxParticles);
		this.indices=new DynamicTypedArray(Uint16Array,6);
		this.bufferInfo=null;
		this.init();
		this.prime();
	}
	prime(){
		this.position.reset();
		this.objectPos.reset();
		this.objectVelo.reset();
		this.objectSize.reset();
		this.objectColor.reset();
		this.objectAirOnly.reset();
		this.indices.reset();
		this.count=0;
	}
	spot(x,y,size,veloX,veloY,colorR,colorG,colorB,airOnly){
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
		this.objectAirOnly.push(
			airOnly,airOnly,airOnly,airOnly
		)
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
			in float objectAirOnly;
			uniform vec2 resolution;

			uniform vec2 camPos;
			uniform float camZoom;

			out vec2 real;
			out vec2 center;
			out float size;
			out vec2 velo;
			out vec3 color;
			out float airOnly;
			
			void main(){
				float leng=4.;
				vec4 pos=position;
				float mag=length(objectVelo*leng);
				bool moving=objectVelo.x!=0.||objectVelo.y!=0.;
				vec2 rotation=moving?
					normalize(objectVelo):
					vec2(1.,0.);

				vec2 oS=vec2(objectSize);
				if(position.x==-1.&&moving){
					oS.x+=mag;
				}
				pos.xy*=oS;

				pos.xy=vec2(
					pos.x*rotation.x - pos.y*rotation.y,
					pos.x*rotation.y + pos.y*rotation.x);
				vec2 realPos=pos.xy+objectPos;
				pos.xy+=objectPos-camPos;
				pos.xy*=camZoom/resolution;

				pos.xy=pos.xy*2.-1.;
				pos.y*=-1.;

				gl_Position=pos;
  				real=realPos;
				center=objectPos;
				size=objectSize;
				color=objectColor;
				velo=objectVelo*4.;
				airOnly=objectAirOnly;
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
			in float airOnly;

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
				float centerDist1=max(1.-length(real-center)/size,0.);
				float centerDist2=max(1.-length(real+velo-center)/size,0.);
				if(dot(center-real,velo)>0.){
					centerDist1=1.;
				}
				if(dot(center-real-velo,velo)<0.){
					centerDist2=1.;
				}
				float dist=min(centerDist2,centerDist1);
				if(dist<=0.){
					discard;
					return;
				}

				float waterline=getWaterline(real.x,real.y);
				if(real.y<waterline){
					if(airOnly==-1.){
						discard;
						return;
					}
					outColor=vec4(color,1.);
				}else{
					if(airOnly==1.){
						discard;
						return;
					}
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
					outColor=vec4(gammaCorrect(shade)*color,1.);
				}
			}
		`;

		let programInfo=twgl.createProgramInfo(gl,[vs,fs]);

		this.programInfo=programInfo;
	}
	run(cam){
		let textures=sharedTextures.textures;

		if(this.count<=0)
			return;

		let uniforms={
			resolution: [gl.canvas.width,gl.canvas.height],

			waterResolution: [textures.waterBox.width,textures.waterBox.height],
			water: textures.waterTex,
			backgroundsResolution: [textures.backgroundsBox.width,textures.backgroundsBox.height],
			backgrounds: textures.backgroundsTex,

			camPos:[cam.pos.x,cam.pos.y],
			camZoom:cam.zoom*cam.pixelScale,
			random:Math.random(),
		};
		let arrays={
			position:{
				numComponents:2,
				data:this.position.getTypedArray()
			},
			objectPos:{
				numComponents:2,
				data:this.objectPos.getTypedArray()
			},
			objectVelo:{
				numComponents:2,
				data:this.objectVelo.getTypedArray()
			},
			objectSize:{
				numComponents:1,
				data:this.objectSize.getTypedArray()
			},
			objectColor:{
				numComponents:3,
				data:this.objectColor.getTypedArray()
			},
			objectAirOnly:{
				numComponents:1,
				data:this.objectAirOnly.getTypedArray()
			},
			indices:{
				numComponents:3,
				data:this.indices.getTypedArray()
			}
		};

		if(this.bufferInfo==null){
			this.bufferInfo=twgl.createBufferInfoFromArrays(gl,arrays);
		}else{
			let arrKeys=Object.keys(arrays);
			arrKeys.forEach(k=>{
				if(k=="indices"){
					setIndicesBufferFromTypedArray(gl,this.bufferInfo.indices,arrays[k].data);
					this.bufferInfo.numElements=arrays[k].data.length;
				}else{
					twgl.setAttribInfoBufferFromArray(gl,this.bufferInfo.attribs[k],arrays[k].data);
				}
			});
		}

		gl.useProgram(this.programInfo.program);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		twgl.setBuffersAndAttributes(gl, this.programInfo, this.bufferInfo);
		twgl.setUniforms(this.programInfo, uniforms);
		twgl.drawBufferInfo(gl, this.bufferInfo);
	}
}