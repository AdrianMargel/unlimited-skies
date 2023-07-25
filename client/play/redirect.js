{
	let path=window.location.pathname;
	let host=window.location.host;
	let changed=false;
	if(!path.endsWith("/")){
		path+="/";
		changed=true;
	}
	if(host.startsWith("www.")){
		host=host.slice(4);
		changed=true;
	}
	if(changed){
		window.location.replace("https://"+host+path);
	}
}