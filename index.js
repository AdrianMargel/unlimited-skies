import { Application, send } from "https://deno.land/x/oak/mod.ts";

const ROOT_DIR=Deno.cwd()+"/client";
const APP_ROOT_DIR=Deno.cwd()+"/mobile-app-pwa";

const app=new Application();
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
	}catch{
		next();
	}
});

await app.listen({ port: 8000 });