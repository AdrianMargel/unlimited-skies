class Tile{
	constructor(){
		this.arrays={
			"planes":new WeakRefSet(),
			"pBullets":new WeakRefSet(),
			"aliens":new WeakRefSet(),
			"aBullets":new WeakRefSet(),
			"specials":new WeakRefSet()
		};
		this.time=0;
	}
	reset(){
		this.arrays["planes"].clear();
		this.arrays["pBullets"].clear();
		this.arrays["aliens"].clear();
		this.arrays["aBullets"].clear();
		this.arrays["specials"].clear();
	}
	mark(target,arrKey){
		if(this.time!=this.getTime()){
			this.time=this.getTime();
			this.reset();
		}
		this.arrays[arrKey].add(target);
	}
	getArr(arrKey){
		if(this.time!=this.getTime()){
			return [];
		}
		return [...this.arrays[arrKey]];
	}
	getSet(arrKey){
		if(this.time!=this.getTime()){
			return new Set();
		}
		return this.arrays[arrKey];
	}
	getArrays(){
		return {
			"planes":this.getArr("planes"),
			"pBullets":this.getArr("pBullets"),
			"aliens":this.getArr("aliens"),
			"aBullets":this.getArr("aBullets"),
			"specials":this.getArr("specials"),
		};
	}
	collide(){
		let a1,a2;
		a1=[...this.arrays["planes"]];
		a2=a1;
		for(let i=0;i<a1.length;i++){
			for(let j=i+1;j<a2.length;j++){
				a1[i].tryHit(a2[j],true);
			}
		}
		a1=[...this.arrays["aliens"]];
		a2=a1;
		for(let i=0;i<a1.length;i++){
			for(let j=i+1;j<a2.length;j++){
				a1[i].tryHit(a2[j],true);
			}
		}

		a1=[...this.arrays["specials"]];
		for(let i=0;i<a1.length;i++){
			a1[i].runSpecial(this.getArrays());
		}
	}
	getTime(){
		return gameRunner.getTime();
	}
}
class HitMap{
	constructor(s){
		this.scale=200;
		this.size=s.cln().div(this.scale).ceil();

		this.tiles=Array(this.size.x).fill().map(()=>
			Array(this.size.y).fill(null)
		);
		this.activeTiles=new Set();
	}
	prime(){
		this.activeTiles=new Set();
	}
	mark(x,y,target,arrKey){
		let t=this.getTile2(x,y);
		t.mark(target,arrKey);
		this.activeTiles.add(t);
	}
	collide(){
		this.activeTiles.forEach(t=>{
			t.collide();
		});
	}
	getTile(x,y){
		return this.getTile2(Math.floor(x/this.scale),Math.floor(y/this.scale));
	}
	getTile2(tx,ty){
		tx=mod(tx,this.size.x);
		ty=mod(ty,this.size.y);
		let t=this.tiles[tx][ty];
		if(t==null){
			t=new Tile();
			this.tiles[tx][ty]=t;
		}
		return t;
	}
}