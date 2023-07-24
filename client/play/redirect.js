{
	let path=window.location.pathname;
	let hostname=window.location.hostname;
	let changed=false;
	if(!path.endsWith("/")){
		path+="/";
		changed=true;
	}
	if(hostname.startsWith("www.")){
		hostname=hostname.slice(4);
		changed=true;
	}
	if(changed){
		window.location.replace("https://"+hostname+path);
	}
}