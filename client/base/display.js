
// window.onresize=()=>{resizeCanvas();};
// function resizeCanvas(){
// 	let canvasContainer=document.getElementById("canvasContainer");
// 	let canvas=document.getElementById("mainCanvas");
// 	let w=canvasContainer.offsetWidth;
// 	let h=canvasContainer.offsetHeight;

// 	canvas.setAttribute("width",w);
// 	canvas.setAttribute("height",h);
// }

class Camera{
	constructor(){
		this.pos=new Vector(0,0);
		this.zoom=1;
		this.pixelScale=1;
	}
}

class Display{
	constructor(){
		this.cam=new Camera();
		this.canvas=document.getElementById("canvas");
		this.ctx = this.canvas.getContext("2d");
		// this.ctx = this.canvas.getContext("2d",
		// 	{
		// 		colorSpace: useP3ColorSpace?"display-p3":"srgb"
		// 	}
		// );
		this.canvasContainer=document.getElementById("canvasContainer");

		this.canvasSize=new Vector(1200,1200);
		this.updateSize();
		this.state=null;
	}
	getSize(){
		return Vec(this.canvasContainer.offsetWidth,this.canvasContainer.offsetHeight);
	}
	connect(){
		window.onresize=()=>{this.updateSize();}
	}
	updateSize(){
		let w=this.canvasContainer.offsetWidth;
		let h=this.canvasContainer.offsetHeight;
		this.canvasSize=new Vector(w,h);
		this.canvas.setAttribute("width",w);
		this.canvas.setAttribute("height",h);
	}
	
	mt0(x,y){
		this.ctx.moveTo(x,y);
	}
	lt0(x,y){
		this.ctx.lineTo(x,y);
	}
	mt(x,y){
		this.ctx.moveTo(x*this.cam.zoom,y*this.cam.zoom);
	}
	lt(x,y){
		this.ctx.lineTo(x*this.cam.zoom,y*this.cam.zoom);
	}
	mt2(x,y){
		this.ctx.moveTo((x-this.cam.pos.x)*this.cam.zoom,(y-this.cam.pos.y)*this.cam.zoom);
	}
	lt2(x,y){
		this.ctx.lineTo((x-this.cam.pos.x)*this.cam.zoom,(y-this.cam.pos.y)*this.cam.zoom);
	}
	start(){
		this.ctx.beginPath();
	}
	shape(){
		this.ctx.closePath();
		this.ctx.fill();
		this.ctx.stroke();
	}
	shapeOpen(){
		this.ctx.fill();
		this.ctx.stroke();
	}
	path(){
		this.ctx.closePath();
		this.ctx.stroke();
	}
	pathOpen(){
		this.ctx.stroke();
	}
	line0(x1,y1,x2,y2){
		this.start();
		this.mt0(x1,y1);
		this.lt0(x2,y2);
		this.pathOpen();
	}
	line(x1,y1,x2,y2){
		this.start();
		this.mt(x1,y1);
		this.lt(x2,y2);
		this.pathOpen();
	}
	line2(x1,y1,x2,y2){
		this.start();
		this.mt2(x1,y1);
		this.lt2(x2,y2);
		this.pathOpen();
	}
	point(x,y){
		this.ctx.fillRect((x-this.cam.pos.x)*this.cam.zoom,(y-this.cam.pos.y)*this.cam.zoom,
			1,1);
	}
	rect0(x,y,w,h){
		this.ctx.fillRect(x,y,w,h);
		this.ctx.strokeRect(x,y,w,h);
	}
	rect(x,y,w,h){
		this.ctx.fillRect(x*this.cam.zoom,y*this.cam.zoom,w*this.cam.zoom,h*this.cam.zoom);
		this.ctx.strokeRect(x*this.cam.zoom,y*this.cam.zoom,w*this.cam.zoom,h*this.cam.zoom);
	}
	rect2(x,y,w,h){
		this.ctx.fillRect((x-this.cam.pos.x)*this.cam.zoom,(y-this.cam.pos.y)*this.cam.zoom,w*this.cam.zoom,h*this.cam.zoom);
		this.ctx.strokeRect((x-this.cam.pos.x)*this.cam.zoom,(y-this.cam.pos.y)*this.cam.zoom,w*this.cam.zoom,h*this.cam.zoom);
	}
	rectMid(x,w,h){
		this.ctx.fillRect(x*this.cam.zoom,-h/2*this.cam.zoom,w*this.cam.zoom,h*this.cam.zoom);
		this.ctx.strokeRect(x*this.cam.zoom,-h/2*this.cam.zoom,w*this.cam.zoom,h*this.cam.zoom);
	}
	arcPath0(x,y,r,start,end){
		this.ctx.arc(x, y, r, start, end);
	}
	arc0(x,y,r,start,end){
		this.start();
		this.ctx.arc(x, y, r, start, end);
		this.shape();
	}
	arc(x,y,r,start,end){
		this.start();
		this.ctx.arc(x*this.cam.zoom, y*this.cam.zoom, r*this.cam.zoom, start, end);
		this.shape();
	}
	arc2(x,y,r,start,end){
		this.start();
		this.ctx.arc((x-this.cam.pos.x)*this.cam.zoom, (y-this.cam.pos.y)*this.cam.zoom, r*this.cam.zoom, start, end);
		this.shape();
	}
	circle0(x,y,r){
		this.start();
		this.ctx.arc(x, y, r, 0, 2 * Math.PI);
		this.shape();
	}
	circle(x,y,r){
		this.start();
		this.ctx.arc(x*this.cam.zoom, y*this.cam.zoom, r*this.cam.zoom, 0, 2 * Math.PI);
		this.shape();
	}
	circle2(x,y,r){
		this.start();
		this.ctx.arc((x-this.cam.pos.x)*this.cam.zoom, (y-this.cam.pos.y)*this.cam.zoom, r*this.cam.zoom, 0, 2 * Math.PI);
		this.shape();
	}

	setStroke(col){
		this.ctx.strokeStyle=col;
	}
	setFill(col){
		this.ctx.fillStyle=col;
	}
	setWeight(val){
		this.ctx.lineWidth=val;
	}
	noStroke(){
		this.ctx.strokeStyle="#FFFFFF00";
	}
	noFill(){
		this.ctx.fillStyle="#FFFFFF00";
	}
	rotate(a){
		this.ctx.rotate(a);
	}
	translate(x,y){
		this.ctx.translate(x*this.cam.zoom, y*this.cam.zoom);
	}
	translate2(x,y){
		this.ctx.translate((x-this.cam.pos.x)*this.cam.zoom, (y-this.cam.pos.y)*this.cam.zoom);
	}
	reset(){
		this.ctx.resetTransform();
	}
	clear(){
		this.ctx.clearRect(0, 0, this.canvasSize.x, this.canvasSize.y);
	}
	background(col){
		this.setFill(col);
		this.noStroke();
		this.ctx.fillRect(0, 0, this.canvasSize.x, this.canvasSize.y);
	}
	fade(amount){
		this.ctx.fillStyle="rgba(0,0,0,"+amount+")";
		this.ctx.fillRect(0, 0, this.canvasSize.x, this.canvasSize.y);
	}
}