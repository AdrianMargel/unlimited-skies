
const staticAppFiles = "unlimited-skies-v1";

if ("serviceWorker" in navigator) {
	window.addEventListener("load", function() {
		navigator.serviceWorker
			.register("/serviceWorker.js")
			.then(async (res)=>{
				console.log("service worker registered");
				const assets=[
					"/",
					"/index.html",
					"/manifest.json",
				
					"/img/backgrounds.png",
					"/img/compress-white.svg",
					"/img/compress.svg",
					"/img/expand-white.svg",
					"/img/expand.svg",
					"/img/gear-white.svg",
					"/img/gear.svg",
					"/img/logo.png",
					"/img/noise2D.png",
					"/img/sky.png",
					"/img/sprites.png",
					"/img/volume-high-white.svg",
					"/img/volume-high.svg",
					"/img/volume-xmark-white.svg",
					"/img/volume-xmark.svg",
					"/img/water.png",
					"/img/worley2D.png",
				
					"/img/icons/icon-72x72.png",
					"/img/icons/icon-96x96.png",
					"/img/icons/icon-128x128.png",
					"/img/icons/icon-144x144.png",
					"/img/icons/icon-152x152.png",
					"/img/icons/icon-192x192.png",
					"/img/icons/icon-384x384.png",
					"/img/icons/icon-512x512.png",
				
					"/fonts/k3kUo8kEI-tA1RRcTZGmTlHGCac.woff2",
					"/fonts/XRXV3I6Li01BKofINeaB.woff2",
					"/fonts/XRXV3I6Li01BKofIO-aBXso.woff2",
					"/fonts/XRXV3I6Li01BKofIOOaBXso.woff2",
				
					"/sound/bang.mp3",
					"/sound/gunshot.mp3",
					"/sound/hit.mp3",
					"/sound/laser.mp3",
					"/sound/prop.mp3",
					"/sound/rocket.mp3",
					"/sound/smallbang.mp3",
					"/sound/splash-2.mp3",
					"/sound/splash.mp3",
				
					"/icon.png",
					"/googlefonts.css",
					
					"/reset.css",
					"/main.css",
					
					"/twgl-full.min.js",
						
					"/init.js",
					"/base/math.js",
					"/base/vector.js",
					"/base/color.js",
					"/base/display.js",
					"/base/control.js",
					"/base/util.js",
					"/definitions/shapes.js",
					"/core/display/cloudMap.js",
					"/core/display/shadowLine.js",
					"/core/display/waterLine.js",
					"/core/entity.js",
					"/core/hitMap.js",
					"/core/game.js",
					"/core/display/shaders/shaderUtil.js",
					"/core/display/shaders/textureManager.js",
					"/core/display/shaders/cloudPaintShader.js",
					"/core/display/shaders/backgroundShader.js",
					"/core/display/shaders/bulletShader.js",
					"/core/display/shaders/particleShader.js",
					"/core/display/shaders/renderShader.js",
					"/definitions/sounds.js",
					"/definitions/aliens.js",
					"/definitions/bullets.js",
					"/definitions/effects.js",
					"/definitions/particles.js",
					"/definitions/planes.js",
					"/ai/ai.js",
					"/ai/director.js",
					"/ui/base.js",
					"/ui/theme.js",
					"/ui/elements/inputs/Input.js",
					"/ui/elements/inputs/ButtonLink.js",
					"/ui/elements/inputs/ButtonClickable.js",
					"/ui/page.js",
					"/main.js",
				];
				const musicAssets=[
					"/music/special/nyan.mp3",
					"/music/Backbonebreaks.mp3",
					"/music/Beatfever.mp3",
					"/music/Clutterfunk, Pt. 2.mp3",
					"/music/Combo Breaker.mp3",
					"/music/Fireburst.mp3",
					"/music/Geometrical Dominator.mp3",
					"/music/Give Me a Break.mp3",
					"/music/Rocket Race.mp3",
					"/music/Run.mp3",
					"/music/Snow in the Air.mp3",
					"/music/Striker.mp3",
					"/music/Supra Zone.mp3",
				];
				let cache=await caches.open(staticAppFiles);
				let cached=(await cache.keys()).map(x=>new URL(x.url).pathname);
				
				console.log("caching core files");
				for(let i=0;i<assets.length;i++){
					if(!cached.includes(encodeURI(assets[i]))){
						await cache.add(assets[i]);
					}
				}
				console.log('caching core files complete');

				console.log("caching music");
				for(let i=0;i<musicAssets.length;i++){
					if(!cached.includes(encodeURI(musicAssets[i]))){
						console.log('caching file '+musicAssets[i]);
						await cache.add(musicAssets[i]);
					}
				}
				console.log("caching music complete");
			})
			.catch(err => console.log("service worker not registered", err));
	});
}