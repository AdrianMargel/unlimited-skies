let shapeMixin={
	circ:{//TODO: add offset
		getClosest(vec){
			let pos=loopVec(this.pos,vec);
			return vec.cln().sub(pos).nrm(this.size).add(pos);
		},
		getDist(vec){
			let pos=loopVec(this.pos,vec);
			return pos.mag(vec)-this.size;
		},
		calcHitbox(){
			let min=this.pos.cln();
			let max=this.pos.cln();
			min.sub(this.size);
			max.add(this.size);
			this.hitbox=[min,max];
		}
	},
	rect:{
		getClosest(vec){
			let pos=loopVec(this.pos,vec);
			let v=vec.cln().sub(pos).rot(-this.angle);

			let flip=nrmAngPI(this.angle+PI/2)<0;
			let off=this.offset.cln();
			if(flip){
				off.y*=-1;
			}
			v.sub(off);
			
			let s=v.cln().sign();
			let sz=this.size.cln().scl(.5);
			v.abs();
			if(v.x<sz.x&&v.y<sz.y){
				return vec.cln();
			}else{
				v.min(sz);
			}
			return v.scl(s).add(off).rot(this.angle).add(pos);
		},
		getDist(vec){
			let pos=loopVec(this.pos,vec);
			let v=vec.cln().sub(pos).rot(-this.angle);
			let flip=nrmAngPI(this.angle+PI/2)<0;
			let off=this.offset.cln();
			if(flip){
				off.y*=-1;
			}
			v.sub(off);
			let sz=this.size.cln().scl(.5);
			v.abs();
			if(v.x<sz.x&&v.y<sz.y){
				return Math.max(v.x-sz.x,v.y-sz.y);
			}else{
				let v2=v.cln();
				v.min(sz);
				return v2.mag(v);
			}
		},
		calcHitbox(){
			let c1=this.size.cln().scl(.5).rot(this.angle);
			let c2=this.size.cln().scl(Vec(-.5,.5)).rot(this.angle);
			let c3=this.size.cln().scl(Vec(-.5,-.5)).rot(this.angle);
			let c4=this.size.cln().scl(Vec(.5,-.5)).rot(this.angle);
			let min=c1.cln().min(c2).min(c3).min(c4);
			let max=c1.cln().max(c2).max(c3).max(c4);
	
			let flip=nrmAngPI(this.angle+PI/2)<0;
			let off=this.offset.cln();
			if(flip){
				off.y*=-1;
			}
			off.rot(this.angle).add(this.pos);
			min.add(off);
			max.add(off);
			this.hitbox=[min,max];
		}
	},
	poly:{
		getClosest(vec){
			let pos=loopVec(this.pos,vec);
			let flip=nrmAngPI(this.angle+PI/2)<0;
			let inside=false;
			let p=vec.cln().sub(pos).rot(-this.angle);
			let closest=null;
			let closestDist=Infinity;
			for(let i=0;i<this.hitBoxPoly.length;i++){
				let nextI=(i+1)%this.hitBoxPoly.length;
				let curr=this.hitBoxPoly[i].cln();
				let next=this.hitBoxPoly[nextI].cln();
				if(flip){
					curr.y*=-1;
					next.y*=-1;
				}
				let ang=curr.ang(next);
				let mag=curr.mag(next);
	
				let p2=p.cln().sub(curr).rot(-ang);
				let close=Vec(clamp(p2.x,0,mag),0);
				let dist=close.mag(p2);
				close.rot(ang).add(curr);
	
				if(dist<closestDist){
					closestDist=dist;
					closest=close;
				}
	
				let minY=Math.min(curr.y,next.y);
				let maxY=Math.max(curr.y,next.y);
				if(p.y>minY&&p.y<maxY&&close.x<p.x){
					inside=!inside;
				}
			}
			if(inside){
				return vec.cln();
			}
			return closest.rot(this.angle).add(pos);
		},
		getDist(vec){
			let pos=loopVec(this.pos,vec);
			let flip=nrmAngPI(this.angle+PI/2)<0;
			let inside=false;
			let p=vec.cln().sub(pos).rot(-this.angle);
			let closestDist=Infinity;
			for(let i=0;i<this.hitBoxPoly.length;i++){
				let nextI=(i+1)%this.hitBoxPoly.length;
				let curr=this.hitBoxPoly[i].cln();
				let next=this.hitBoxPoly[nextI].cln();
				if(flip){
					curr.y*=-1;
					next.y*=-1;
				}
				let ang=curr.ang(next);
				let mag=curr.mag(next);
	
				let p2=p.cln().sub(curr).rot(-ang);
				let close=Vec(clamp(p2.x,0,mag),0);
				let dist=close.mag(p2);
				close.rot(ang).add(curr);
	
				if(dist<closestDist){
					closestDist=dist;
				}
	
				let minY=Math.min(curr.y,next.y);
				let maxY=Math.max(curr.y,next.y);
				if(p.y>minY&&p.y<maxY&&close.x<p.x){
					inside=!inside;
				}
			}
			if(inside){
				return -closestDist;
			}
			return closestDist;
		},
		calcHitbox(){
			let flip=nrmAngPI(this.angle+PI/2)<0;
			let min=Vec(Infinity,Infinity);
			let max=Vec(-Infinity,-Infinity);
			for(let i=0;i<this.hitBoxPoly.length;i++){
				let curr=this.hitBoxPoly[i].cln();
				if(flip){
					curr.y*=-1;
				}
				curr.rot(this.angle);
				min.min(curr);
				max.max(curr);
			}
			min.add(this.pos);
			max.add(this.pos);
			this.hitbox=[min,max];
		}
	},
	unset:{
		getDist(vec,loop=true){
			return this.getClosest(vec,loop).mag(vec);
		},
		calcHitbox(){
			let far=1000000;
			let px=this.getClosest(Vec(far,0).add(this.pos),false);
			let nx=this.getClosest(Vec(-far,0).add(this.pos),false);
			let py=this.getClosest(Vec(0,far).add(this.pos),false);
			let ny=this.getClosest(Vec(0,-far).add(this.pos),false);
			let min=Vec(nx.x,ny.y);
			let max=Vec(px.x,py.y);
			this.hitbox=[min,max];
		}
	}
};
