class Input extends CustomElm{
	constructor(text){
		super();
		text=bind(text);
		this.define(html`
			<input
				value=${attr(text)(text)}
				oninput=${attr(act((event)=>{
					text.data=event.target.value;
				}))()}
			/>
		`);
	}
}
defineElm(Input);