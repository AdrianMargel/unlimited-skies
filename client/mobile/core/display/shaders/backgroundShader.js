class BackgroundShader{
	constructor(){
		this.init();
	}
	init(){
		//TODO: init with cloud settings
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
			uniform float cloudSeedOffset;
			uniform vec2 screenStart;
			uniform float random;
			uniform uint time;

			out vec4 outColor;

			${samplerVar("water")}
			${samplerVar("shadow")}
			${samplerVar("cloudPaint")}
			${samplerVar("noise")}
			${samplerVar("worley")}
			${samplerVar("backgrounds")}
			
			${idxFunc("water")}
			${idxFunc("shadow")}

			${gammaFuncs()}
			${waterFuncs()}
			${shadowFuncs()}
			//  1 out, 1 in...
			float hash11(float p){
				p = fract(p * .1031);
				p *= p + 33.33;
				p *= p + p;
				return fract(p);
			}
			//  1 out, 2 in...
			float hash12(vec2 p){
				vec3 p3  = fract(vec3(p.xyx) * .1031);
				p3 += dot(p3, p3.yzx + 33.33);
				return fract((p3.x + p3.y) * p3.z);
			}
			// 1 out, 3 in...
			float hash13(vec3 p3){
				p3  = fract(p3 * .1031);
				p3 += dot(p3, p3.zyx + 31.32);
				return fract((p3.x + p3.y) * p3.z);
			}

			float noise1D(float x,float s){
				float tileP=floor(x/s);
				float tileMix=mod(x,s)/s;
				float seedOffset=cloudSeedOffset;
				float randP=hash11(mod(tileP+1.,${(20000).toFixed(1)}/s)+seedOffset);
				float randN=hash11(mod(tileP,${(20000).toFixed(1)}/s)+seedOffset);
				float val=mix(randN,randP,tileMix);
				return val;
			}
			float noise2D(in vec2 x, float u, float v){
				return texture(noise, x/20.).r;
			}
			float worley2D(in vec2 x){
				return texture(worley, x/20.).r;
			}
			vec4 getCloud(vec2 p,vec4 cloudPaint,vec3 back){
				float scale=.5;
				float cloudSeed=pow(noise1D(p.x,2500.)+0.4,3.)-0.4;

				vec2 p2=p+vec2(1.,0.)*float(time);
				vec2 p3=p+vec2(-.5,0.)*float(time);
				p3*=vec2(1.,2.)*1.;
				float water=noise2D(p3/200.,1.,1.)*noise2D(p3/400.,1.,1.)*noise2D(p3/1000.,1.,1.);
				float cloudTexture=worley2D(p2/100.*scale)*2.+noise2D(p2/20.*scale,1.,1.);

				float ceiling=1500.;
				float bottomWidth=200.;
				float topWidth=2000.;
				float spaceStart=4000.;
				float spaceEnd=8000.;
				float a1=clamp(-(p.y+ceiling-bottomWidth)/bottomWidth,0.,1.);
				float a2=pow(clamp((p.y+ceiling+topWidth)/topWidth,0.,1.),2.);
				float a3=1000.;
				if(-p.y>spaceStart){
					a3=max((p.y+spaceEnd)/(spaceEnd-spaceStart),0.);
				}
				float a4=clamp((1.-a3)*3.,0.,1.);
				cloudSeed=max(a4,cloudSeed);
				float altitude=min(min(a1,a2)*10.+.5,a3);

				float waterPaint=cloudPaint.w*cloudTexture*2.;
				float waterNatural=water*altitude*cloudSeed*cloudTexture;
				float cloud=pow(waterPaint+waterNatural,2.);

				float cloudDensity=mix(.75*min(cloud,1.),.9,
					clamp(cloud-2.,0.,1.)
				);
				if(waterPaint>0.){
					float cloudN=pow(waterNatural,2.);
					float cMix=cloudN/cloud;
					vec3 cloudCol=mix(cloudPaint.xyz,vec3(1.),cMix);
					vec3 colP=(1.-(1.-cloudDensity)*(1.-back))*(1.-cloudDensity*(1.-cloudCol.xyz));
					return vec4(colP,1.);
				}else{
					return vec4((1.-(1.-cloudDensity)*(1.-back)),1.);
				}
			}
			vec3 getSky(float height){
				return texture(backgrounds,vec2(0.,height/12000.+1.)).rgb;
			}
			vec3 getWater(float depth){
				return texture(backgrounds,vec2(1.,1.-depth)).rgb;
			}

			void main(){
				vec2 coord=gl_FragCoord.xy;
				vec2 uv=gl_FragCoord.xy/resolution;
				// vec2 uv2=vec2(uv.x*2.-1.,uv.y*2.-1.);


				vec2 real=vec2(coord.x,resolution.y-coord.y)/camZoom+camPos;
				float waterline=getWaterline(real.x,real.y);

				float noise=(hash13(vec3(random,coord))*2.-1.)*0.01;
				if(real.y<waterline){
					vec3 back=getSky(real.y);
					
					vec2 cloudPos=(real-floor(screenStart/${(1000/40).toFixed(1)}+.5)*${(1000/40).toFixed(1)})/8000.;
					vec4 cloudPaint=texture(cloudPaint, vec2(cloudPos.x,1.-cloudPos.y));
					outColor=getCloud(real,cloudPaint,back);
					
					float spaceStart=7000.;
					float spaceEnd=12000.;
					if(-real.y>spaceStart){
						float stars=1.-max((real.y+spaceEnd)/(spaceEnd-spaceStart),0.);
						vec2 starPos=floor(real/50.)*50.;
						float starBright=hash12(starPos);
						if(starBright<.01){
							starBright*=100.;
							float bright=max(1.-distance(real,starPos+25.*starBright)/(25.*starBright),0.)*stars;
							outColor+=bright*bright;
						}
					}
				}else{
					float topX=real.x-real.y*0.5;
					float waterline1=getWaterline(topX-50.,real.y);
					float waterline2=getWaterline(topX+50.,real.y);

					float shadow=getShadow(real);

					float depthReal=real.y;
					float depthWater=real.y-waterline;
					float godrays=abs(waterline1-waterline2)*1.5;
					godrays+=shadow*-min(depthWater/1500.,1.)*200.;

					float scale=min(max(1.-depthReal/500.,0.),1.);
					float depthScaled=mix(depthReal,depthWater,scale)-godrays;
					float depth=min(max(1.-depthScaled/3000.,0.),1.);
					vec3 ambient=vec3(0.,0.02,.05);
					vec3 water=gammaShift(getWater(depth));

					if(depthWater<20.){
						water*=0.9;
					}
					outColor=vec4(gammaCorrect(water+ambient)+noise,1.);
				}
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
	run(cam,cloudSeedOffset,time,screenStart){
		let textures=sharedTextures.textures;

		let uniforms={
			resolution: [gl.canvas.width,gl.canvas.height],

			waterResolution: [textures.waterBox.width,textures.waterBox.height],
			water: textures.waterTex,
			shadowResolution: [textures.shadowBox.width,textures.shadowBox.height],
			shadow: textures.shadowTex,
			backgroundsResolution: [textures.backgroundsBox.width,textures.backgroundsBox.height],
			backgrounds: textures.backgroundsTex,
			noiseResolution: [textures.noiseBox.width,textures.noiseBox.height],
			noise: textures.noiseTex,
			worleyResolution: [textures.worleyBox.width,textures.worleyBox.height],
			worley: textures.worleyTex,
			cloudPaintResolution: [textures.cloudPaintBox.width,textures.cloudPaintBox.height],
			cloudPaint: textures.cloudPaintTex,
			cloudSeedOffset:cloudSeedOffset,

			screenStart:[screenStart.x,screenStart.y],
			camPos:[cam.pos.x,cam.pos.y],
			camZoom:cam.zoom*cam.pixelScale,
			random:Math.random(),
			time
		};

		gl.useProgram(this.programInfo.program);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		twgl.setBuffersAndAttributes(gl, this.programInfo, this.bufferInfo);
		twgl.setUniforms(this.programInfo, uniforms);
		twgl.drawBufferInfo(gl, this.bufferInfo);
	}
}