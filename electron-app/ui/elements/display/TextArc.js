class TextArc extends CustomElm{
	constructor(text,radius,startAng,endAng,tilt=0,invert=false,includeEnd=true,renderAsSvg=false){
		super();
		text=bind(text);
		radius=bind(radius);
		startAng=bind(startAng);
		endAng=bind(endAng);
		tilt=bind(tilt);
		invert=bind(invert);
		includeEnd=bind(includeEnd);
		renderAsSvg=bind(renderAsSvg);
		let angDiff=startAng.data-endAng.data;

		// this.define(html`
		// 	${()=>{
		// 		let letters=text.data.split("");
		// 		let maxLength=includeEnd.data?letters.length-1:letters.length;
		// 		return letters.map((l,i)=>{
		// 			return html`
		// 			<span style=${
		// 				attr(()=>`
		// 					transform:
		// 						rotate(${startAng.data-(i/(maxLength))*angDiff*(invert.data?-1:1)}rad)
		// 						translateX(${radius.data}px)
		// 						rotate(${PI/2+tilt.data+(invert.data?PI:0)}rad);
		// 					`)(radius,startAng,endAng,tilt,invert)}
		// 			}>${l}</span>`
		// 		})
		// 	}}
		// `(text));
		this.define(html`
			${()=>{
				let letters=text.data.split("");
				let maxLength=includeEnd.data?letters.length-1:letters.length;
				return letters.map((l,i)=>{
					return html`
					<span style=${
						attr(()=>`
							transform:
								rotate(${startAng.data-(i/(maxLength))*angDiff*(invert.data?-1:1)}rad)
								translateX(${radius.data}px)
								rotate(${PI/2+tilt.data+(invert.data?PI:0)}rad);
							`)(radius,startAng,endAng,tilt,invert)}
					}>
						${()=>renderAsSvg.data?`
							<svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
								<text x="25" y="25">${l}</text>
							</svg>`:l
						}
					</span>`
				})
			}}
		`(text));
	}
}
defineElm(TextArc,scss`
&{
	${theme.elementReset}
	${theme.center}
	width: 0;
	height: 0;
}
>span{
	position: absolute;
	display: inline-block;
	>svg{
		width:50px;
	}
}
`);
class TextArcMid extends CustomElm{
	constructor(text,radius,midAng,letterAng,tilt=0,invert=false,renderAsSvg=false){
		super();
		text=bind(text);
		radius=bind(radius);
		midAng=bind(midAng);
		letterAng=bind(letterAng);
		tilt=bind(tilt);
		invert=bind(invert);
		renderAsSvg=bind(renderAsSvg);

		this.define(html`
			${()=>{
				let letters=text.data.split("");
				let startAng=midAng.data-letters.length/2*letterAng.data;
				let endAng=midAng.data+letters.length/2*letterAng.data;
				let angDiff=startAng-endAng;
				return letters.map((l,i)=>{
					return html`
					<span style=${
						attr(()=>`
							transform:
								rotate(${(invert.data?endAng:startAng)-(i/(letters.length-1))*angDiff*(invert.data?-1:1)}rad)
								translateX(${radius.data}px)
								rotate(${PI/2+tilt.data+(invert.data?PI:0)}rad);
						`)(radius,midAng,letterAng,tilt,invert)}
					}>
						${()=>renderAsSvg.data?`
							<svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
								<text x="25" y="25">${l}</text>
							</svg>`:l
						}
					</span>`
				})
			}}
		`(text));
	}
}
defineElm(TextArcMid,scss`
&{
	${theme.elementReset}
	${theme.center}
	width: 0;
	height: 0;
}
>span{
	position: absolute;
	display: inline-block;
}
`);