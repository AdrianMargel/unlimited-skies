const staticAppFiles = "unlimited-skies-v1";
const assets = [
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

// self.addEventListener("install", (event) => {
//	 self.skipWaiting();
//	 console.log("Installed");
// });

self.addEventListener("install", installEvent => {
	console.log("install started");
	installEvent.waitUntil(
		(async () => {
			cache = await caches.open(staticAppFiles);
			console.log('caching files');
			await cache.addAll(assets);
			console.log('caching complete');
			self.skipWaiting();
			console.log('install complete');
		})()
	);
});

self.addEventListener("fetch", (event) => {
	event.respondWith(
		caches.match(event.request,{ignoreVary: true}).then(function(response) {
			if (response) {
				// retrieve from cache
				return response;
			}

			// if not found in cache, return default offline content (only if this is a navigation request)
			if (event.request.mode === 'navigate') {
				return caches.match('/index.html');
			}

			// fetch as normal
			console.log("could not load resource from cache",event.request,response);
			return fetch(event.request);
		})
	);
});
