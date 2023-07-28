function track(type,info){
	let url=window.location.pathname;
	fetch("/tracks",{
		body:JSON.stringify({
			url,
			type,
			info,
		}),
		method: "POST",
	});
}