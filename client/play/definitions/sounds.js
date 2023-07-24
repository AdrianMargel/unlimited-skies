class Sound{
	constructor(manager,url,volume=1,maxSounds=4){
		this.url=url;
		this.manager=manager;
		this.volume=volume;
		this.buffer=null;
		this.ceilingStart=8000;
		this.ceilingEnd=12000;

		this.startedCount=0;
		this.maxSounds=maxSounds;//This is new sounds per frame, not concurrently playing sounds
	}
	init(){
		this.load(this.url);
		return this;
	}
	async load(url){
		const response=await fetch(url);
		this.manager.ctx.decodeAudioData(await response.arrayBuffer()).then((decodedData)=>{
			this.buffer=decodedData;
		});
	}
	prime(){
		this.startedCount=0;
	}
	getChance(){
		let space=this.maxSounds-this.startedCount;
		if(space>this.maxSounds/2){
			return 1;
		}else{
			return space/(this.maxSounds/2);
		}
	}
	play(p=null,timeOffset=0,speed=1,volume=1,force=false){
		if(this.buffer==null||((this.manager.paused||this.manager.muted)&&!force)){
			return;
		}
		if(!force&&this.getChance()<Math.random()){
			return;
		}
		let playerP=gameRunner.getPlayer().getPos(p);
		p=p??playerP;
		let dist=p.mag(playerP);
		let distVol=clamp(1-dist/8000,0,1);
		if(distVol==0){
			return;
		}
		let alt=-p.y;
		let spaceVol=clamp((this.ceilingEnd-alt)/(this.ceilingEnd-this.ceilingStart),0,1);

		let context=this.manager.ctx;

		let source=context.createBufferSource();
		source.buffer=this.buffer;
		source.connect(context.destination);

		source.playbackRate.value=speed;

		let gainNode = context.createGain();
		if(force){
			gainNode.gain.value=(volume)-1;
		}else{
			gainNode.gain.value=(this.manager.volume*this.volume*volume*distVol*spaceVol)-1;
		}

		gainNode.connect(context.destination);
		source.connect(gainNode);

		let timeGap=.01;//without this chrome makes odd clicking sounds occasionally
		source.start(context.currentTime+timeOffset+timeGap);
		this.startedCount++;
	}
}
//Note that looping sounds are always running, but they can be silenced
class SoundLooping extends Sound{
	constructor(manager,url,volume=1,speed=1){
		super(manager,url,volume);
		this.speed=speed;
		this.source=null;
		this.gainNode=null;
		this.isPlaying=false;

		this.t1=0;
		this.t2=0;
		this.vol1=-1;
		this.vol2=-1;
	}
	async load(url){
		const response=await fetch(url);
		this.manager.ctx.decodeAudioData(await response.arrayBuffer()).then((decodedData)=>{
			this.buffer=decodedData;
			this.source=this.manager.ctx.createBufferSource();
			this.source.buffer=this.buffer;
			this.source.connect(this.manager.ctx.destination);

			this.source.loop=true;
			this.source.playbackRate.value=this.speed;

			this.gainNode=this.manager.ctx.createGain();
			this.source.connect(this.gainNode);
			this.gainNode.connect(this.manager.ctx.destination);
			this.gainNode.gain.setValueAtTime(-1,0);
			this.gainNode.gain.value=-1;
		});
	}
	play(p,timeOffset=0,speed=1,volume=1){
		if(this.source==null||this.manager.paused||this.manager.muted){
			return;
		}
		if(!this.isPlaying){
			this.isPlaying=true;
			this.source.start(this.manager.ctx.currentTime);
		}
		if(speed!=-1){
			this.source.playbackRate.value=this.speed=speed;
		}
		this.pushVolume(timeOffset,volume*this.volume*this.manager.volume-1);
		this.gainNode.gain.setValueAtTime(this.vol1,this.t1);
		this.gainNode.gain.linearRampToValueAtTime(this.vol2,this.t2);
	}
	pushVolume(timeOffset,volume){
		this.vol1=this.getVolume(this.manager.ctx.currentTime);
		this.vol2=volume;

		this.t1=this.manager.ctx.currentTime;
		this.t2=this.manager.ctx.currentTime+timeOffset;
	}
	getVolume(time){
		if(this.t2<=this.t1){
			return this.vol1;
		}
		let mixT=clamp((time-this.t1)/(this.t2-this.t1),0,1);
		return mix(this.vol1,this.vol2,mixT);
	}
	// Do not stop, stopped sounds cannot be restarted
	// stop(){
	// 	if(this.isPlaying){
	// 		this.isPlaying=false;
	// 		this.source.stop();
	// 	}
	// }
}
class SoundManager{
	constructor(){
		this.volumeBase=0;
		this.volume=0;
		this.muted=true;
		this.paused=false;
		this.ctx=new AudioContext();

		this.sounds=[
			this.gunshot=new Sound(this,'sound/gunshot.mp3',1).init(),
			this.hit=new Sound(this,'sound/hit.mp3',5).init(),
			this.bang=new Sound(this,'sound/bang.mp3',1).init(),
			this.laser=new Sound(this,'sound/laser.mp3',.75).init(),
			this.splash=new Sound(this,'sound/splash-2.mp3',5).init(),
		];
		this.rocket=new SoundLooping(this,'sound/rocket.mp3',.75).init();
		this.prop=new SoundLooping(this,'sound/prop.mp3',1).init();
	}
	prime(){
		this.sounds.forEach(s=>s.prime());
	}
	pause(){
		this.rocket.play(null,.5,-1,0);
		this.prop.play(null,.5,-1,0);
		this.paused=true;
	}
	resume(){
		this.paused=false;
	}
	setVolume(vol){
		this.volumeBase=vol;
		if(!this.muted){
			this.volume=vol;
		}
	}
	mute(){
		this.rocket.play(null,.5,-1,0);
		this.prop.play(null,.5,-1,0);
		this.muted=true;
		this.volume=0;
	}
	unmute(){
		this.muted=false;
		this.volume=this.volumeBase;
	}
}
class MusicManager{
	constructor(){
		this.volumeBase=0;
		this.volume=0;
		this.muted=true;

		this.audioPlayer=document.createElement("audio");
		this.audioPlayer.addEventListener("ended",()=>this.nextSong());

		this.songs=[
			"Geometrical Dominator.mp3",
			"Rocket Race.mp3",
			"Clutterfunk, Pt. 2.mp3",
			"Beatfever.mp3",
			"Fireburst.mp3",
			"Give Me a Break.mp3",
			"Snow in the Air.mp3",
			"Run.mp3",
			"Striker.mp3",
			"Combo Breaker.mp3",
			"Supra Zone.mp3",
			"Backbonebreaks.mp3",
		];
		this.songsBackup=this.songs;
	}
	forcePlaylist(urls){
		this.songs=urls;
		this.nextSong();
		if(this.muted){
			this.audioPlayer.pause();
		}
	}
	restorePlaylist(){
		this.songs=this.songsBackup;
		this.nextSong();
		if(this.muted){
			this.audioPlayer.pause();
		}
	}
	
	start(){
		this.nextSong();
		this.mute();
	}
	nextSong(){
		let song=this.songs[0];
		this.audioPlayer.setAttribute("src","music/"+song);
		this.audioPlayer.currentTime=0;
		this.audioPlayer.volume=this.volume;
		this.audioPlayer.play();

		//remove the song and insert it randomly into the second half of the list
		let first=this.songs.splice(0,1)[0];
		let insertI=Math.floor(random(this.songs.length/2,this.songs.length));
		this.songs.splice(insertI,0,first);
	}
	setVolume(vol){
		this.volumeBase=vol;
		if(!this.muted){
			this.volume=vol;
			this.audioPlayer.volume=vol;
		}
	}
	mute(){
		this.muted=true;
		this.audioPlayer.pause();

		this.volume=0;
		this.audioPlayer.volume=this.volume;
	}
	unmute(){
		this.muted=false;
		this.audioPlayer.play();

		this.volume=this.volumeBase;
		this.audioPlayer.volume=this.volume;
	}
}