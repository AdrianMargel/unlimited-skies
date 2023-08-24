import { Application, Router, Status, send } from "https://deno.land/x/oak/mod.ts";

// SERVER
const ROOT_DIR=Deno.cwd()+"/client";
const APP_ROOT_DIR=Deno.cwd()+"/mobile-app-pwa";

const app=new Application();
const router = new Router();

app.use(router.allowedMethods());
app.use(router.routes());

app.use(async (ctx, next)=>{
	const filePath=ctx.request.url.pathname;
	let root;
	if(ctx.request.url.hostname.split(".")[0].toLocaleLowerCase()=="app"){
		root=APP_ROOT_DIR;
	}else{
		root=ROOT_DIR;
	}
	try{
		await send(ctx,filePath,{
			root,
			index: "index.html",
		});
	}catch{}
});

await app.listen({ port: 8000 });