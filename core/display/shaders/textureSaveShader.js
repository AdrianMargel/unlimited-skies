class TextureSaveShader{
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
			uniform vec2 position;
			uniform float zoom;
			uniform vec2 screenStart;
			uniform float random;
			uniform uint time;

			out vec4 outColor;

			${gammaFuncs()}
			//  1 out, 1 in...
			float hash11(float p){
				p = fract(p * .1031);
				p *= p + 33.33;
				p *= p + p;
				return fract(p);
			}
			// 1 out, 3 in...
			float hash13(vec3 p3){
				p3  = fract(p3 * .1031);
				p3 += dot(p3, p3.zyx + 31.32);
				return fract((p3.x + p3.y) * p3.z);
			}
			//  3 out, 2 in...
			vec3 hash32(vec2 p){
				vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973));
				p3 += dot(p3, p3.yxz+33.33);
				return fract((p3.xxy+p3.yzz)*p3.zyx);
			}
			//  2 out, 2 in...
			vec2 hash22(vec2 p){
				vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973));
				p3 += dot(p3, p3.yzx+33.33);
				return fract((p3.xx+p3.yz)*p3.zy);
			}

			float noise1D(float x,float s){
				float tileP=floor(x/s);
				float tileMix=mod(x,s)/s;
				float randP=hash11(tileP+1.);
				float randN=hash11(tileP);
				float val=mix(randN,randP,tileMix);
				return val;
			}
			float noise2D(in vec2 x, float u, float v){
				vec2 p = floor(x);
				vec2 f = fract(x);

				float k = 1.0 + 63.0*pow(1.0-v,4.0);
				float va = 0.0;
				float wt = 0.0;
				for( int j=-2; j<=2; j++ )
					for( int i=-2; i<=2; i++ ){
						vec2  g = vec2( float(i), float(j) );
						vec3  o = hash32(mod(p + g,20.) )*vec3(u,u,1.0);//this mod() makes it tileable
						vec2  r = g - f + o.xy;
						float d = dot(r,r);
						float w = pow( 1.0-smoothstep(0.0,1.414,sqrt(d)), k );
						va += w*o.z;
						wt += w;
					}

				return va/wt;
			}
			float worley2D(in vec2 x){
				// return 1.;
				ivec2 p = ivec2(floor( x ));
				vec2  f = fract( x );
			
				ivec2 mb;
				vec2 mr;
			
				float res = 8.0;
				for( int j=-1; j<=1; j++ )
				for( int i=-1; i<=1; i++ )
				{
					ivec2 b = ivec2(i, j);
					vec2  r = vec2(b) + hash22(mod(vec2(p+b),20.))-f;//this mod() makes it tileable
					float d = dot(r,r);
			
					if( d < res)
					{
						res = d;
						mr = r;
						mb = b;
					}
				}
			
				return 1.-res;
			}
			float getCloud(vec2 p){
				// return cloudPaint.xyz;
				float scale=.5;

				vec2 p2=p;
				vec2 p3=p;
				p3*=vec2(1.,2.)*1.;
				// return worley2D(p2/100.*scale);
				return noise2D(p2/100.*scale,1.,1.);
				// float water=noise2D(p3/200.,1.,1.)*noise2D(p3/400.,1.,1.)*noise2D(p3/1000.,1.,1.);
				// float cloudTexture=worley2D(p2/100.*scale)*2.+noise2D(p2/20.*scale,1.,1.);
				// return cloudTexture/3.;
			}
			vec3 getSky(float height){
				float alt=min(max(1.+height/10000.,0.),1.);
				float alt1=pow(alt,1.5);
				float alt2=pow(alt,2.5);
				float alt3=pow(alt,5.5);
				float haze=min(max(1.+height/5000.,0.),1.);
				float haze1=pow(haze,2.5);
				float haze2=pow(haze,1.5);
				float haze3=pow(haze,5.5);
				vec3 ambient=vec3(.01,.015,.02);
				vec3 sky=vec3(0.1*alt3,0.9*alt2,1.2*alt1)*1.;
				vec3 fog=vec3(0.5*haze3,0.1*haze2,0.2*haze1)*.5;
				vec3 back=min(sky+fog+ambient,1.);
				return back;
			}
			vec3 getWater(float depth){
				float depth1=pow(depth,20.);
				float depth2=pow(depth,5.);
				float depth3=pow(depth,4.);
				vec3 water=vec3(0.1*depth1,.9*depth2,0.8*depth3);
				return water;
			}

			void main(){
				vec2 coord=gl_FragCoord.xy;
				vec2 uv=gl_FragCoord.xy/resolution;

				// outColor=vec4(gammaCorrect(getWater(uv.y)),1.);
				// outColor=vec4(gammaCorrect(getSky(-uv.y*12000.)),1.);
				float c=getCloud(uv*4000.);
				outColor=vec4(c,c,c,1.);
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
			resolution: [gl.canvas.width,gl.canvas.height],

			waterResolution: [textures.waterBox.width,textures.waterBox.height],
			water: textures.waterTex,
			shadowResolution: [textures.shadowBox.width,textures.shadowBox.height],
			shadow: textures.shadowTex,
			cloudsResolution: [textures.cloudsBox.width,textures.cloudsBox.height],
			clouds: textures.cloudsTex,
			cloudTimes: textures.cloudTimesTex,
			cloudPaintResolution: [textures.cloudPaintBox.width,textures.cloudPaintBox.height],
			cloudPaint: textures.cloudPaintTex,

			cloudMetaSize: [cloudsObj.metaWidth,cloudsObj.metaHeight],
			screenStart:[screenStart.x,screenStart.y],
			// camPos:[cam.pos.x,cam.pos.y],
			// camZoom:cam.zoom*cam.pixelScale,
			position:cam.pos,
			zoom:cam.zoom*cam.pixelScale,
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