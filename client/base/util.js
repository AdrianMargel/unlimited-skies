class WeakRefSet{
	constructor(){
		//TODO: consider using a weakSet internally along side an array to speed up lookups
		this.array=[];
	}
	
	has(toFind){
		for(let item of this){
			if(item===toFind){
				return true;
			}
		}
		return false;
	}
	add(toAdd){
		if(!this.has(toAdd)){
			this.array.push(new WeakRef(toAdd));
			return true;
		}
		return false;
	}
	delete(toDelete){
		let idx=this.#findIdx(toDelete);
		if(idx!=-1){
			this.array.splice(idx,1);
			return true;
		}
		return false;
	}
	clear(){
		this.array=[];
	}

	forEach(func){
		for(let item of this) {
			func(item);
		}
	}

	#findIdx(toFind){
		let idx=0;
		//the list may shorten while iterating but the idx will always be correct since purged items are not returned by the iterator
		for(let item of this) {
			if(item===toFind){
				return idx;
			}
			idx++;
		}
		return -1;
	}
	*[Symbol.iterator](){
		for(let i=0;i<this.array.length;i++){
			let item=this.array[i].deref();
			if(item===undefined){
				this.array.splice(i,1);
				i--;
			}else{
				yield item;
			}
		}
	}
}
function loopVec(vec,ref){
	let modP=vec.cln();
	let mapWidth=gameRunner.getMapSize().x;
	let offsetEdge=ref.x-mapWidth/2;
	modP.x=mod(modP.x-offsetEdge,mapWidth)+offsetEdge;
	return modP;
}
function runAndFilter(arr,func){
	for(let i=arr.length-1;i>=0;i--){
		if(!func(arr[i])){
			arr.splice(i,1);
		}
	}
}
function binarySearch(arr, el, compare_fn) {
    let m = 0;
    let n = arr.length - 1;
    while (m <= n) {
        let k = (n + m) >> 1;
        let cmp = compare_fn(el, arr[k]);
        if (cmp > 0) {
            m = k + 1;
        } else if(cmp < 0) {
            n = k - 1;
        } else {
            return k;
        }
    }
    return ~m;
}
function bezierPoint(t, p0, p1, p2, p3){
	let cX = 3 * (p1.x - p0.x),
		bX = 3 * (p2.x - p1.x) - cX,
		aX = p3.x - p0.x - cX - bX;

	let cY = 3 * (p1.y - p0.y),
		bY = 3 * (p2.y - p1.y) - cY,
		aY = p3.y - p0.y - cY - bY;

	let x = (aX * Math.pow(t, 3)) + (bX * Math.pow(t, 2)) + (cX * t) + p0.x;
	let y = (aY * Math.pow(t, 3)) + (bY * Math.pow(t, 2)) + (cY * t) + p0.y;

	return new Vector(x,y);
}