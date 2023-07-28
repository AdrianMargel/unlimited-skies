class CloudPaintShader{
	constructor(){
		this.init();
	}
	init(){
		let vs=glsl`#version 300 es
			in vec4 position;

			void main(){
				gl_Position=position;
			}
		`;

		let fs=glsl`#version 300 es
			precision highp float;
			
			uniform vec2 resolution;
			uniform vec2 camPos;
			uniform float camZoom;
			uniform vec2 screenStart;
			uniform uint time;
			uniform vec2 cloudMetaSize;

			${samplerVar("clouds")}
			uniform highp usampler2D cloudTimes;

			out vec4 outColor;

			${idxFuncVec4("clouds")}
			${idxFuncUInt("cloudTimes","clouds")}

			${gammaFuncs()}
			
			vec4 blur(vec4 i0,vec4 i1,vec4 i2,vec4 i3,vec4 i4,vec4 i5,vec4 i6,vec4 i7,vec4 i8){
				float totalA=i0.w*.0625 + i1.w*.125 + i2.w*.0625
					+ i3.w*.125 + i4.w*.25 + i5.w*.125
					+ i6.w*.0625 + i7.w*.125 + i8.w*.0625;
				i0.xyz*=i0.w;
				i1.xyz*=i1.w;
				i2.xyz*=i2.w;
				i3.xyz*=i3.w;
				i4.xyz*=i4.w;
				i5.xyz*=i5.w;
				i6.xyz*=i6.w;
				i7.xyz*=i7.w;
				i8.xyz*=i8.w;
				if(totalA==0.){
					return vec4(1.,1.,1.,0.);
				}
				return vec4((i0*.0625 + i1*.125 + i2*.0625
					+ i3*.125 + i4*.25 + i5*.125
					+ i6*.0625 + i7*.125 + i8*.0625).xyz/totalA,totalA);
			}
			vec4 getCloud(vec2 p){
				vec2 metaP=mod(floor(p/40.),cloudMetaSize);
				uint metaIdx=uint(metaP.x+metaP.y*cloudMetaSize.x);

				vec2 tileP=floor(mod(p,40.));
				uint tileIdx=uint(tileP.x+tileP.y*40.);
				uint idx=tileIdx+metaIdx*uint(${(40**2).toFixed(1)});
				vec4 c=cloudsAtIdx(idx);
				float tDelta=1.-clamp(float(time-cloudTimesAtIdx(idx))/1000.,0.,1.);

				float spaceStart=${(4000/(1000/40)).toFixed(1)};
				float spaceEnd=${(8000/(1000/40)).toFixed(1)};
				if(-p.y>spaceStart){
					c.w*=max((p.y+spaceEnd)/(spaceEnd-spaceStart),0.);
				}
				c.w*=tDelta;
				if(c.w==0.){
					return vec4(1.,1.,1.,0.);
				}else{
					return vec4(gammaShift(c.xyz),c.w);
				}
			}

			void main(){
				vec2 coord=gl_FragCoord.xy;
				vec2 uv=gl_FragCoord.xy/resolution;

				vec2 cloudPos=vec2(coord.x,resolution.y-coord.y)+screenStart/(${(1000/40).toFixed(1)});
				vec4 i0=getCloud(cloudPos+vec2(-1,-1));
				vec4 i1=getCloud(cloudPos+vec2(0,-1));
				vec4 i2=getCloud(cloudPos+vec2(1,-1));

				vec4 i3=getCloud(cloudPos+vec2(-1,0));
				vec4 i4=getCloud(cloudPos+vec2(0,0));
				vec4 i5=getCloud(cloudPos+vec2(1,0));

				vec4 i6=getCloud(cloudPos+vec2(-1,1));
				vec4 i7=getCloud(cloudPos+vec2(0,1));
				vec4 i8=getCloud(cloudPos+vec2(1,1));
				vec4 cloud=blur(
					getCloud(cloudPos+vec2(-1,-1)),
					getCloud(cloudPos+vec2(0,-1)),
					getCloud(cloudPos+vec2(1,-1)),
					
					getCloud(cloudPos+vec2(-1,0)),
					getCloud(cloudPos+vec2(0,0)),
					getCloud(cloudPos+vec2(1,0)),
					
					getCloud(cloudPos+vec2(-1,1)),
					getCloud(cloudPos+vec2(0,1)),
					getCloud(cloudPos+vec2(1,1))
				);

				// outColor=vec4(i4.xyz*i4.w,i4.w);
				// outColor=vec4((mod(floor(cloudPos),10.)/10.).xy,1.,1.);
				// outColor=vec4((mod(floor(coord),10.)/10.).xy,1.,1.);

				outColor=vec4(gammaCorrect(cloud.xyz),cloud.w);
				// outColor=cloud;
			}
		`;

		let programInfo=twgl.createProgramInfo(gl,[vs,fs]);
		let arrays={
			position:{
				numComponents:2,
				data:[
					-1, 1,
					1, -1,
					1, 1,
					-1, 1,
					1, -1,
					-1, -1,
				]
			}
		};

		let bufferInfo=twgl.createBufferInfoFromArrays(gl,arrays);

		this.programInfo=programInfo;
		this.bufferInfo=bufferInfo;
	}
	run(cam,cloudsObj,time,screenStart){
		let textures=sharedTextures.textures;

		let uniforms={
			resolution: [textures.cloudPaintBox.width,textures.cloudPaintBox.height],

			cloudsResolution: [textures.cloudsBox.width,textures.cloudsBox.height],
			clouds: textures.cloudsTex,
			cloudTimes: textures.cloudTimesTex,

			cloudMetaSize: [cloudsObj.metaWidth,cloudsObj.metaHeight],

			screenStart:[screenStart.x,screenStart.y],
			camPos:[cam.pos.x,cam.pos.y],
			camZoom:cam.zoom*cam.pixelScale,
			time
		};
	
		const attachments = [
			{ attachment: textures.cloudPaintTex },
		];

		gl.useProgram(this.programInfo.program);
		const frameBuffer=twgl.createFramebufferInfo(gl,attachments,textures.cloudPaintBox.width,textures.cloudPaintBox.height);
		twgl.bindFramebufferInfo(gl,frameBuffer);

		twgl.setBuffersAndAttributes(gl,this.programInfo,this.bufferInfo);
		twgl.setUniforms(this.programInfo,uniforms);
		twgl.drawBufferInfo(gl,this.bufferInfo);

		twgl.bindFramebufferInfo(gl,null);

		// gl.useProgram(this.programInfo.program);
		// gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		// twgl.setBuffersAndAttributes(gl, this.programInfo, this.bufferInfo);
		// twgl.setUniforms(this.programInfo, uniforms);
		// twgl.drawBufferInfo(gl, this.bufferInfo);
	}
}