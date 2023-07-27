let COLOR={
	RGB:"rgb",
	REAL:"real",
	HSV:"hsv",
	HSL:"hsl"
};

class Color extends Vector{
	constructor(r,g,b,a=1,space=COLOR.RGB){
		if(arguments.length==0){
				super(0,0,0,a);
				this.space=COLOR.RGB;
		}else if(arguments.length==1){
			if(typeof r=="number"){
				super(r,r,r,a);
				this.space=COLOR.RGB;
			}else if(typeof r=="string"){
				super(0,0,0,0);
				this.fromHex(r);
				this.space=COLOR.RGB;
			}else if(r instanceof Color){
				super(r.x,r.y,r.z,r.a);
				this.space=r.space;
			}else{
				super(...r);
				this.pad([0,0,0,a]);
				this.space=r.space??COLOR.RGB;
			}
		}else if(arguments.length==2){
			super(r,r,r,g);
			this.space=COLOR.RGB;
		}else if(arguments.length==3){
			super(r,g,b,a);
			this.space=COLOR.RGB;
		}else{
			super(r,g,b,a);
			this.space=space;
		}
	}
	toRgb(){
		switch(this.space){
			case COLOR.RGB:
				break;
			case COLOR.REAL:
				this.gammaCorrect();
				break;
			case COLOR.HSV:
			{
				let h=this.x;
				let s=this.y;
				let v=this.z;
				let r,g,b,
					i=Math.floor(h*6),
					c=v*s,
					n=c*(1-Math.abs((h*6)%2-1)),
					m=v-c;
				switch(i%6){
					case 0:
						r=c;
						g=n;
						b=0;
						break;
					case 1:
						r=n;
						g=c;
						b=0;
						break;
					case 2:
						r=0;
						g=c;
						b=n;
						break;
					case 3:
						r=0;
						g=n;
						b=c;
						break;
					case 4:
						r=n;
						g=0;
						b=c;
						break;
					case 5:
						r=c;
						g=0;
						b=n;
						break;
				}
				this.x=r+m;
				this.y=g+m;
				this.z=b+m;
				break;
			}
			case COLOR.HSL:
			{
				let h=this.x;
				let s=this.y;
				let l=this.z;
				let r,g,b,
					i=Math.floor(h*6),
					c=(1-Math.abs(2*l-1))*s,
					n=c*(1-Math.abs((h*6)%2-1)),
					m=l-c/2;
				switch(i%6){
					case 0:
						r=c;
						g=n;
						b=0;
						break;
					case 1:
						r=n;
						g=c;
						b=0;
						break;
					case 2:
						r=0;
						g=c;
						b=n;
						break;
					case 3:
						r=0;
						g=n;
						b=c;
						break;
					case 4:
						r=n;
						g=0;
						b=c;
						break;
					case 5:
						r=c;
						g=0;
						b=n;
						break;
				}
				this.x=r+m;
				this.y=g+m;
				this.z=b+m;
				break;
			}
		}
		this.space=COLOR.RGB;
		return this;
	}
	toSpace(colSpc){
		this.toRgb();
		let r=this.x,
			g=this.y,
			b=this.z;
		switch(colSpc){
			case COLOR.RGB:
				break;
			case COLOR.REAL:
				this.gammaShift();
				break;
			case COLOR.HSV:
			{
				var max=Math.max(r,g,b),
					min=Math.min(r,g,b),
					d=max-min,
					h,
					s=(max==0?0:d/max),
					v=max/255;

				switch(max){
					case min:
						h=0;
						break;
					case r:
						h=(g-b)+d*(g<b?6:0);
						h/=6*d;
						break;
					case g:
						h=(b-r)+d*2;
						h/=6*d;
						break;
					case b:
						h=(r-g)+d*4;
						h/=6*d;
						break;
				}
				this.x=h;
				this.y=s;
				this.z=v;
				break;
			}
			case COLOR.HSL:
			{
				var max=Math.max(r,g,b),
					min=Math.min(r,g,b),
					d=max-min,
					h,
					s=(max==0?0:d/max),
					l=(max+min)/2;

				switch(max){
					case min:
						h=0;
						break;
					case r:
						h=(g-b)+d*(g<b?6:0);
						h/=6*d;
						break;
					case g:
						h=(b-r)+d*2;
						h/=6*d;
						break;
					case b:
						h=(r-g)+d*4;
						h/=6*d;
						break;
				}
				this.x=h;
				this.y=s;
				this.z=l;
				break;
			}
		}
		this.space=colSpc;
		return this;
	}
	fromHex(hex){
		//TODO: handle short hexes
		this.space=COLOR.RGB;
		var result=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(hex);
		this.x=parseInt(result[1],16)/255;
		this.y=parseInt(result[2],16)/255;
		this.z=parseInt(result[3],16)/255;
		this.w=parseInt(result[4]??"FF",16)/255;
		return this;
	}
	toHex(){
		function limit(a){
			return Math.floor(Math.max(Math.min(a,255),0));
		}
		function component(a){
			return (256+limit(a*255)).toString(16).slice(1);
		}
		let col=this.cln();
		col.toRgb();
		return "#"
			+component(col.x)
			+component(col.y)
			+component(col.z)
			+component(col.w);
	}
	gammaCorrect(){
		let gammaExp=1/2.2;
		this.x=Math.pow(this.x,gammaExp);
		this.y=Math.pow(this.y,gammaExp);
		this.z=Math.pow(this.z,gammaExp);
		return this;
	}
	gammaShift(){
		let gammaExp=2.2;
		this.x=Math.pow(this.x,gammaExp);
		this.y=Math.pow(this.y,gammaExp);
		this.z=Math.pow(this.z,gammaExp);
		return this;
	}
	toString(){
		return this.toHex();
	}
	cln(){
		return new Color(this);
	}

	// z
	get r(){
		return this.array[0]??0;
	}
	get h(){
		return this.array[0]??0;
	}

	set r(val){
		return this.array[0]=val;
	}
	set h(val){
		return this.array[0]=val;
	}

	// y
	get g(){
		return this.array[1]??0;
	}
	get s(){
		return this.array[1]??0;
	}
	get c(){
		return this.array[1]??0;
	}

	set g(val){
		return this.array[1]=val;
	}
	set s(val){
		return this.array[1]=val;
	}
	set c(val){
		return this.array[1]=val;
	}

	// z
	get b(){
		return this.array[2]??0;
	}
	get v(){
		return this.array[2]??0;
	}
	get l(){
		return this.array[2]??0;
	}

	set b(val){
		return this.array[2]=val;
	}
	set v(val){
		return this.array[2]=val;
	}
	set l(val){
		return this.array[2]=val;
	}

	// w
	get a(){
		return this.array[3]??0;
	}
	set a(val){
		return this.array[3]=val;
	}
}

function Col(...data){
	return new Color(...data);
}
function rgb(...rgba){
	return new Color(...rgba);
}
function RGB(...rgba){
	return new Color(...rgba.map(x=>x/255));
}
function hsv(h,s,v,a){
	let col=new Color(h,s,v,a,COLOR.HSV);
	return col;
}
function hsl(h,s,l,a){
	let col=new Color(h,s,l,a,COLOR.HSL);
	return col;
}