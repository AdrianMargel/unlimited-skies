class ButtonClickable extends CustomElm{
	constructor(text,event,noTab=false){
		super();
		text=bind(text);
		event=bind(event);
		this.define(html`
			<button
				${noTab?`tabindex="-1"`:""}
				onclick=${attr(act(event.data))(event)}
			>
				<div class="surface">
					${html`${text}`(text)}
				</div>
			</button>
		`);
	}
}
defineElm(ButtonClickable,scss`&{
	display:block;
	>button{
		position: relative;
		padding: 0;
		border: none;
		border-radius: 100px;
		${theme.boxShadowStep(-2)}
		.surface{
			font-family: 'Nunito', sans-serif;
			font-weight: 700;
			font-size: 20px;
			color: white;
			border: none;
			padding: 10px 30px;
			border-radius: 100px;
			position: relative;
			bottom: 10px;
			transition: bottom 0.1s;
			${theme.center};
		}
		&:active .surface{
			bottom: 4px;
		}
		&:active .selector{
			bottom: -12px;
		}
	}
}`);