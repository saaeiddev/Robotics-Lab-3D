import { Vector3, Quaternion, Group } from 'three';
export const rad=(v:number)=>v*Math.PI/180;
export const deg=(v:number)=>v*180/Math.PI;
export const clamp=(v:number,min:number,max:number)=>Math.min(max,Math.max(min,v));
export type Joint = {id:string;name:string;node:Group;axis:Vector3;min:number;max:number;value:number;home:number};
export function applyJoint(j:Joint,value:number){j.value=clamp(value,j.min,j.max);j.node.quaternion.setFromAxisAngle(j.axis,rad(j.value));}
/** Position-only cyclic coordinate descent with signed axis projection and joint limits. */
export function solveIK(joints:Joint[],tip:Group,target:Vector3,iterations=18):number {
 const p=new Vector3(),end=new Vector3(),a=new Vector3(),b=new Vector3(),axis=new Vector3(),q=new Quaternion();
 for(let k=0;k<iterations;k++){
  for(let i=joints.length-1;i>=0;i--){
   const j=joints[i]; j.node.updateWorldMatrix(true,true); j.node.getWorldPosition(p); tip.getWorldPosition(end);
   j.node.parent!.getWorldQuaternion(q); axis.copy(j.axis).applyQuaternion(q).normalize();
   a.subVectors(end,p).addScaledVector(axis,-end.clone().sub(p).dot(axis));
   b.subVectors(target,p).addScaledVector(axis,-target.clone().sub(p).dot(axis));
   if(a.lengthSq()<1e-10||b.lengthSq()<1e-10)continue;
   a.normalize();b.normalize();const angle=Math.atan2(axis.dot(a.clone().cross(b)),clamp(a.dot(b),-1,1));
   applyJoint(j,j.value+clamp(deg(angle),-12,12));
  }
  tip.updateWorldMatrix(true,false); if(tip.getWorldPosition(end).distanceTo(target)<0.012)break;
 }
 return tip.getWorldPosition(end).distanceTo(target);
}
export type Cell=[number,number];
export const GRID_SIZE=17, GRID_STEP=.5, GRID_ORIGIN=-4;
export const toCell=(x:number,z:number):Cell=>[clamp(Math.round((x-GRID_ORIGIN)/GRID_STEP),0,16),clamp(Math.round((z-GRID_ORIGIN)/GRID_STEP),0,16)];
export const toWorld=([x,z]:Cell):Cell=>[x*GRID_STEP+GRID_ORIGIN,z*GRID_STEP+GRID_ORIGIN];
export const obstacles=(extra=false)=>[ {x:0,z:0,w:1.25,d:1.8,h:.9}, {x:-2,z:-1.6,w:1,d:1,h:.6}, {x:2,z:1.5,w:1,d:1,h:1.3}, ...(extra?[{x:1.25,z:-2,w:1,d:1.5,h:.8}]:[]) ];
export function blocked(x:number,z:number,extra=false,clearance=.78){return Math.abs(x)>3.8||Math.abs(z)>3.8||obstacles(extra).some(o=>Math.abs(x-o.x)<o.w/2+clearance&&Math.abs(z-o.z)<o.d/2+clearance);}
/** 8-neighbor A*, with footprint inflation and no diagonal corner cutting. */
export function planPath(start:Cell,goal:Cell,extra=false):Cell[]{
 const key=([x,z]:Cell)=>x+z*GRID_SIZE;const open:Cell[]=[start],cost=new Map([[key(start),0]]),parent=new Map<number,Cell>();
 const closed=new Set<number>();const free=(c:Cell)=>c[0]>=0&&c[0]<17&&c[1]>=0&&c[1]<17&&!blocked(...toWorld(c),extra,.92);
 if(!free(goal))return[];
 while(open.length){
  open.sort((a,b)=>(cost.get(key(a))!+Math.hypot(a[0]-goal[0],a[1]-goal[1]))-(cost.get(key(b))!+Math.hypot(b[0]-goal[0],b[1]-goal[1])));
  const c=open.shift()!; if(key(c)===key(goal)){const path=[c];let n=c;while(parent.has(key(n))){n=parent.get(key(n))!;path.unshift(n);}return path.map(toWorld);}
  if(closed.has(key(c)))continue;closed.add(key(c));
  for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
   const n:Cell=[c[0]+dx,c[1]+dz];if(!free(n)||closed.has(key(n)))continue;
   if(dx&&dz&&(!free([c[0]+dx,c[1]])||!free([c[0],c[1]+dz])))continue;
   const g=cost.get(key(c))!+Math.hypot(dx,dz);if(g<(cost.get(key(n))??Infinity)){cost.set(key(n),g);parent.set(key(n),c);open.push(n);}
  }
 } return[];
}
export function stepRover(pose:{x:number;z:number;yaw:number},throttle:number,steer:number,dt:number,extra:boolean){
 const yaw=pose.yaw+steer*dt*1.8;
 const x=pose.x+Math.sin(yaw)*throttle*dt*1.1,z=pose.z+Math.cos(yaw)*throttle*dt*1.1;
 return blocked(x,z,extra)?{...pose,yaw,collision:true}:{x,z,yaw,collision:false};
}
/** Horizontal range ray against the same axis-aligned rectangles rendered in the lab. */
export function rangeRay(x:number,z:number,angle:number,extra=false,maxRange=5):number{
 const dx=Math.sin(angle),dz=Math.cos(angle);let best=maxRange;
 for(const o of obstacles(extra)){
  let near=-Infinity,far=Infinity;
  for(const [origin,dir,min,max] of [[x,dx,o.x-o.w/2,o.x+o.w/2],[z,dz,o.z-o.d/2,o.z+o.d/2]]){
   if(Math.abs(dir)<1e-9){if(origin<min||origin>max){far=-Infinity;break;}}
   else {const a=(min-origin)/dir,b=(max-origin)/dir;near=Math.max(near,Math.min(a,b));far=Math.min(far,Math.max(a,b));}
  }
  if(far>=Math.max(near,0))best=Math.min(best,near>=0?near:far);
 }return best;
}
