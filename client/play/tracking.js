function track(type,info){
	let host=window.location.hostname;
	if(host.toLowerCase()=="localhost"||host=="127.0.0.1"){
		// Don't bother tracking localhost
		return;
	}
	
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