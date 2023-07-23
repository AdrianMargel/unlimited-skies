import { Application, send } from "https://deno.land/x/oak/mod.ts";

const ROOT_DIR=Deno.cwd()+"/client"

const app=new Application();
app.use(async (ctx, next)=>{
	const filePath=ctx.request.url.pathname;
	try{
		await send(ctx,filePath,{
			root: ROOT_DIR,
			index: "index.html",
		});
	}catch{
		next();
	}
});

await app.listen({ port: 8000 });