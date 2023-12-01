track("landing page",null);

var last;
var totalElapsed=0;
let dispT=new Date().getTime();
async function animation(timestamp) {
	if(last===undefined){
		last=timestamp;
	}
	let elapsed=timestamp-last;
	last=timestamp;
	let runSpeed=1000/60;
	let animAmount=Math.min(elapsed/runSpeed,3);
	totalElapsed+=animAmount;

	spinImages(animAmount);

	dispT=new Date().getTime();
	window.requestAnimationFrame(animation);
}
window.requestAnimationFrame(animation);

let images=document.querySelector(".images");
let scrollX=0;
let imgWidth=(400+40);
function spinImages(t){
	scrollX-=t;
	if(scrollX>imgWidth){
		scrollX-=imgWidth;
		images.appendChild(images.children[0]);
	}
	if(scrollX<0){
		scrollX+=imgWidth;
		images.insertBefore(images.children[images.children.length-1],images.firstChild);
	}
	images.scroll(scrollX,0,{
		// behavior: "smooth"
	});
}

let imgDown=false;
let mX;
images.onmousedown=e=>{
	imgDown=true;
	mX=e.clientX;
};
document.body.onmouseup=e=>{
	imgDown=false;
};
images.onmousemove=e=>{
	if(imgDown){
		let mX2=e.clientX;
		spinImages(mX2-mX);
		mX=mX2;
	}
};

images.ontouchstart=e=>{
	imgDown=true;
	mX=e.changedTouches[0].clientX;
};
document.body.ontouchend=(e)=>{
	imgDown=false;
};
images.ontouchmove=(e)=>{
	if(imgDown){
		let mX2=e.changedTouches[0].clientX;
		spinImages(mX2-mX);
		mX=mX2;
	}
};