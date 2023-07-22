class ButtonLink extends CustomElm{
	constructor(text,event){
		super();
		text=bind(text);
		event=bind(event);
		this.define(html`
			<button
				onclick=${attr(act(event.data))(event)}
			>
				${html`${text}`(text)}
			</button>
		`);
	}
}
defineElm(ButtonLink,scss`&{
	>button{
		margin: 0;
		padding: 0;
		display: inline;
		cursor: pointer;
		background-color: transparent;
		color: #7AC16C;
		&:hover{
			text-decoration: underline;
		}
	}
}`);