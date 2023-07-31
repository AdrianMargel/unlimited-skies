const staticAppFiles = "unlimited-skies-v1";

self.addEventListener("install", (event) => {
	self.skipWaiting();
	console.log("installed");
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