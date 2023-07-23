class Theme{
	constructor(){
		/* GENERAL */
		this.center=`
			display: flex;
			justify-content: center;
			align-items: center;
		`;
		this.centerX=`
			display: flex;
			justify-content: center;
		`;
		this.centerY=`
			display: flex;
			align-items: center;
		`;
		this.centerText=`text-align: center;`,
		this.elementReset=`
			display: block;
		`;

		/* OTHER */
		this.mobile="@media only screen and (max-width: 600px)";
		this.boxShadowStep=(a)=>"box-shadow: 0 0 "+this.#genericStep(a,0,80,30)+"px #00000080;";
	}
	#genericStep(a,min,max,mid){
		let smallDist=mid-min;
		let bigDist=max-mid;
		let totalDist=smallDist+bigDist;
	
		let smallScale=smallDist/totalDist;
		let bigScale=bigDist/totalDist;
		if(a>0){
			a*=smallScale;
			let blend=(sigmoid(a)-0.5)*2;
			return mix(mid,max,blend);
		}else{
			a*=bigScale;
			let blend=(sigmoid(a)-0.5)*2;
			return mix(mid,min,-blend);
		}
	}
}
function easeInOutExpo(x) {
	return x === 0
		? 0
		: x === 1
		? 1
		: x < 0.5 ? Math.pow(2, 20 * x - 10) / 2
		: (2 - Math.pow(2, -20 * x + 10)) / 2;
}
function easeInOutQuad(x) {
	return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
}

let theme=new Theme();