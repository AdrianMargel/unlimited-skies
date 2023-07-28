import { Application, Router, Status, send } from "https://deno.land/x/oak/mod.ts";
import {
	MongoClient,
	ObjectId,
} from "https://deno.land/x/atlas_sdk@v1.1.0/mod.ts";

// MONGO DB
const client = new MongoClient({
	endpoint: "https://us-west-2.aws.data.mongodb-api.com/app/data-bduil/endpoint/data/v1",
	dataSource: "Main-Cluster",
	auth: {
		apiKey: Deno.env.get("MONGO_API_KEY"),
	},
});

const db=client.database("game-tracking");
const tracks=db.collection("tracks");

// SERVER
const ROOT_DIR=Deno.cwd()+"/client";
const APP_ROOT_DIR=Deno.cwd()+"/mobile-app-pwa";

const app=new Application();
const router = new Router();
router.post('/tracks', async (ctx,next) =>{
	const ip=ctx.request.ip;
	const ua=ctx.request.headers.get("user-agent")??"Unknown";
	const time=new Date().getTime();

	let body=await ctx.request.body().value;
	if(body.length<200){
		try{
			let data=JSON.parse(body);
			if(typeof data=="object"&&!Array.isArray(data)){
				let url=data.url;
				let type=data.type;
				let info=data.info;
				
				tracks.insertOne({
					_id: new ObjectId(),
					game:"unlimited skies",

					ua,
					ip,
					time,

					url,
					type,
					info,
				});
				ctx.response.status=Status.OK;
				return;
			}
		}catch{}
	}
	ctx.response.status=Status.BAD_REQUEST;
});
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