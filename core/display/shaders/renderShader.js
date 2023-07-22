class RenderShader{
	constructor(){
		this.init();
		this.prime();
	}
	prime(){
		this.position=[];
		this.rotation=[];
		this.texturePos=[];
		this.textureSize=[];
		this.objectPos=[];
		this.objectSize=[];
		this.objectAngle=[];
		this.offset=[];
		this.indices=[];
		this.count=0;
	}
	img(x,y,sizeX,sizeY,angle,imgX,imgY,imgSizeX,imgSizeY,flip,offsetX=0,offsetY=0){
		let rotX=Math.cos(angle);
		let rotY=Math.sin(angle);
		this.position.push(
			1, 1,
			1, -1,
			-1, 1,
			-1, -1
		);
		this.rotation.push(
			rotX,rotY,
			rotX,rotY,
			rotX,rotY,
			rotX,rotY,
		);
		if(flip){
			this.texturePos.push(
				imgX+imgSizeX, imgY,
				imgX+imgSizeX, imgY+imgSizeY,
				imgX, imgY,
				imgX, imgY+imgSizeY,
			);
			this.offset.push(
				offsetX,-offsetY,
				offsetX,-offsetY,
				offsetX,-offsetY,
				offsetX,-offsetY,
			);
		}else{
			this.texturePos.push(
				imgX+imgSizeX, imgY+imgSizeY,
				imgX+imgSizeX, imgY,
				imgX, imgY+imgSizeY,
				imgX, imgY,
			);
			this.offset.push(
				offsetX,offsetY,
				offsetX,offsetY,
				offsetX,offsetY,
				offsetX,offsetY,
			);
		}
		this.textureSize.push(
			imgSizeX, imgSizeY,
			imgSizeX, imgSizeY,
			imgSizeX, imgSizeY,
			imgSizeX, imgSizeY,
		);
		this.objectPos.push(
			x,y,
			x,y,
			x,y,
			x,y,
		);
		this.objectSize.push(
			sizeX,sizeY,
			sizeX,sizeY,
			sizeX,sizeY,
			sizeX,sizeY,
		);
		if(flip){
			angle=-angle;
			angle-=0.4636476090008061+PI/2;//angle is used for lighting and the sun is at an angle of (1,2)
		}else{
			angle+=0.4636476090008061+PI/2;//angle is used for lighting and the sun is at an angle of (1,2)
		}
		this.objectAngle.push(
			angle,angle,angle,angle
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

			in vec2 rotation;
			in vec2 texturePos;
			in vec2 textureSize;
			in vec2 objectPos;
			in vec2 objectSize;
			in vec2 offset;
			in float objectAngle;
			uniform vec2 resolution;

			uniform vec2 camPos;
			uniform float camZoom;
			uniform vec2 screenStart;

			out vec2 texCoord;
			out vec2 texSize;
			out vec2 real;
			out vec2 size;
			out vec2 rot;
			out float angle;

			vec2 loopVec(vec2 vec,vec2 ref){
				vec2 modP=vec;
				float mapWidth=${(20000).toFixed(1)};
				float offsetEdge=ref.x-mapWidth/2.;
				modP.x=mod(modP.x-offsetEdge,mapWidth)+offsetEdge;
				return modP;
			}

			void main(){
				vec2 oPos=loopVec(objectPos,screenStart);
				vec4 pos=position;
				pos.xy*=objectSize/2.;
				pos.xy+=offset;

				pos.xy=vec2(
					pos.x*rotation.x - pos.y*rotation.y,
					pos.x*rotation.y + pos.y*rotation.x);
				vec2 realPos=pos.xy+oPos;
				pos.xy+=oPos-camPos;
				pos.xy*=camZoom/resolution;

				pos.xy=pos.xy*2.-1.;
				pos.y*=-1.;

				gl_Position=pos;
  				texCoord=texturePos;
				texSize=textureSize;
  				real=realPos;
				size=objectSize;
				rot=rotation;
				angle=objectAngle;
			}
		`;

		let fs=glsl`#version 300 es
			#define PI 3.1415926535897932384626433832795
			precision highp float;
			uniform vec2 resolution;
			in vec2 texCoord;
			in vec2 texSize;
			in vec2 real;
			in vec2 size;
			in vec2 rot;
			in float angle;

			out vec4 outColor;

			${samplerVar("spriteSheet")}
			${samplerVar("backgrounds")}

			${samplerVar("water")}
			${idxFunc("water")}

			${gammaFuncs()}
			${overlayFuncs()}
			${waterFuncs()}
			
			vec3 getWater(float depth){
				return texture(backgrounds,vec2(1.,1.-depth)).rgb;
			}

			void main(){
				vec4 col=texture(spriteSheet,texCoord/spriteSheetResolution);
				if(col.w==0.){
					discard;
					return;
				}
				vec2 metaTexCoord=texCoord;//TODO: firefox color spaces are slightly off
				metaTexCoord.y+=texSize.y+1.;

				float ang=-angle;

				vec3 lightDir=normalize(vec3(cos(ang),sin(ang),1.));
				vec4 metaCol=texture(spriteSheet,(metaTexCoord)/spriteSheetResolution);
				if(metaCol.w>0.&&metaCol.xy!=vec2(0.)){
					metaCol=(metaCol-.5)*2.;
					vec2 nrm=metaCol.xy;
					float light=dot(
							lightDir,
							normalize(vec3(nrm,.25))
						);
					float lightShade=0.5;

					light+=metaCol.z;
					if(light>0.98){
						lightShade=.8;
					}else if(light>0.8){
						lightShade=.6;
					}else if(light<0.1){
						lightShade=.3;
					}

					col.xyz=overlay(vec3(lightShade),col.xyz);
				}else{
					// col.x=1.;
				}

				float waterline=getWaterline(real.x,real.y);
				if(real.y<waterline){
					outColor=vec4(col);
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
					// shade.x=pow(shade.x,1.);
					// shade.y=pow(shade.y,1.);
					// shade.z=pow(shade.z,1.);
					outColor=vec4(gammaCorrect(shade)*col.xyz,col.w);
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

			spriteSheetResolution:[textures.spriteSheetBox.width,textures.spriteSheetBox.height],
			spriteSheet:textures.spriteSheetTex,

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
			rotation:{
				numComponents:2,
				data:this.rotation
			},
			texturePos:{
				numComponents:2,
				data:this.texturePos
			},
			textureSize:{
				numComponents:2,
				data:this.textureSize
			},
			objectPos:{
				numComponents:2,
				data:this.objectPos
			},
			objectSize:{
				numComponents:2,
				data:this.objectSize
			},
			offset:{
				numComponents:2,
				data:this.offset
			},
			objectAngle:{
				numComponents:1,
				data:this.objectAngle
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