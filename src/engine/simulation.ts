import { Vector3 } from 'three';
import type { RobotId } from '../data';
import type { Model } from './models';
import { applyJoint, clamp, planPath, rangeRay, solveIK, stepRover, toCell, type Cell } from './math';
import type { useLab } from '../store';
type State=ReturnType<typeof useLab.getState>;
export class Simulation{
 clock=0;time=0;phase=0;grip=.7;attached=false;path:Cell[]=[];pathIndex=0;pose={x:-3,z:3,yaw:Math.PI};status='Ready';error=0;distance=0;roll=0;pitch=0;
 lastGripper=NaN;lastJoints:State['joints']|null=null;lastDemo='';lastPlan='';resetVersion=-1;explosion=0;
 constructor(public model:Model,public id:RobotId){}
 reset(){this.clock=0;this.time=0;this.phase=0;this.attached=false;this.lastGripper=NaN;this.path=[];this.pathIndex=0;this.pose={x:-3,z:3,yaw:Math.PI};this.status='Ready';this.lastDemo='';this.lastPlan='';this.lastJoints=null;this.explosion=0;this.model.joints.forEach(j=>applyJoint(j,j.home));this.model.root.position.set(0,0,0);this.model.root.rotation.set(0,0,0);this.model.payload.position.set(1.3,.3,1.1);}
 set(id:string,v:number){const j=this.model.joints.find(j=>j.id===id);if(j)applyJoint(j,v);}
 step(s:State,delta:number){
  if(s.resetVersion!==this.resetVersion){this.reset();this.resetVersion=s.resetVersion;}
  const dt=s.stopped?0:Math.min(delta,.05)*s.speed;
  const moving=s.running&&!s.stopped;
  if(s.demo!==this.lastDemo){this.time=0;this.lastDemo=s.demo;this.phase=0;this.attached=false;}
  if(!s.stopped&&s.joints!==this.lastJoints){Object.entries(s.joints).forEach(([id,v])=>this.set(id,v));this.lastJoints=s.joints;}
  if(moving){this.clock+=dt;this.time+=dt;}
  if(this.id==='humanoid'&&moving){
   const t=this.time;
   if(s.demo==='wave'){this.set('rightShoulder',-125);this.set('rightShoulderRoll',-25);this.set('rightElbow',-45-22*Math.sin(t*3));this.set('neck',12*Math.sin(t*.7));}
   if(s.demo==='handshake'){this.set('rightShoulder',-55+5*Math.sin(t*4));this.set('rightShoulderRoll',-8);this.set('rightElbow',-45+10*Math.sin(t*4));}
   if(s.demo==='walk')for(const [side,offset] of [['left',0],['right',Math.PI]] as const){const p=t*2.5+offset;this.set(side+'Hip',28*Math.sin(p));this.set(side+'Knee',Math.max(0,52*Math.sin(p+1)));this.set(side+'Ankle',-10*Math.sin(p));this.set(side+'Shoulder',-22*Math.sin(p));this.set(side+'Elbow',-12);this.set(side+'ShoulderRoll',0);}
   this.status=s.demo==='walk'?'Kinematic gait · no balance solver':'Commanded gesture demonstration';
  }
  if(this.id==='arm'){
   if(!s.stopped&&s.ik&&!s.exploded){this.error=solveIK(this.model.joints,this.model.tip,new Vector3(...s.target));this.status=this.error<.06?'Target reached':'Target outside pose / joint limits';}
   if(moving&&s.demo==='pick'&&!s.ik&&!s.exploded){
    const goals=[[1.3,.7,1.1],[1.3,.3,1.1],[1.3,.3,1.1],[1.3,1.5,1.1],[-1.3,1.5,1.1],[-1.3,.3,1.1],[-1.3,.3,1.1],[-1.3,1.5,1.1]];
    const p=this.phase;this.error=solveIK(this.model.joints,this.model.tip,new Vector3(...goals[p]),10);
    this.grip=p>=2&&p<=5?.08:.85;
    if(this.error<.06&&this.time>1.0){
     if(p===2){this.attached=true;this.status='Payload attached';}
     if(p===6){this.attached=false;this.model.payload.position.set(-1.3,.3,1.1);}
     this.phase=(p+1)%8;this.time=0;
     if(this.phase===0)this.model.payload.position.set(1.3,.3,1.1);
    }
    this.status=`Pick & place · step ${this.phase+1}/8${this.error>.1?' · approaching':''}`;
   } else if(!s.stopped&&!s.running&&this.lastGripper!==s.gripper){this.grip=s.gripper;this.lastGripper=s.gripper;}
   this.model.grips.forEach(g=>{g.position.x=g.userData.side*(.07+this.grip*.14);});
   if(this.attached&&moving){const p=this.model.tip.getWorldPosition(new Vector3());this.model.root.worldToLocal(p);this.model.payload.position.copy(p);}
  }
  if(this.id==='hand'&&moving){const flex=(1-Math.cos(this.time*1.5))*.5*78;for(const finger of ['thumb','index','middle','ring','little'])for(let k=0;k<3;k++)this.set(finger+k,flex*[1,.85,.65][k]);this.status='Coupled tendon grasp demonstration';}
  if(this.id==='rover'){
   const planKey=JSON.stringify([s.goal,s.obstacle]);
   if(planKey!==this.lastPlan){this.path=planPath(toCell(this.pose.x,this.pose.z),toCell(...s.goal),s.obstacle);this.pathIndex=1;this.lastPlan=planKey;this.status=this.path.length?'Route planned':'Goal blocked · choose a clear cell';}
   let [throttle,steer]=s.drive;
   if(moving&&s.demo==='navigate'){
    const goal=this.path[this.pathIndex];
    if(goal){const dx=goal[0]-this.pose.x,dz=goal[1]-this.pose.z;const diff=Math.atan2(Math.sin(Math.atan2(dx,dz)-this.pose.yaw),Math.cos(Math.atan2(dx,dz)-this.pose.yaw));steer=clamp(diff*2,-1,1);throttle=Math.abs(diff)<.16?Math.min(.8,Math.hypot(dx,dz)*2):0;if(Math.hypot(dx,dz)<.06)this.pathIndex++;this.status='Following A* path';}
    else{throttle=steer=0;this.status=this.path.length?'Destination reached':'No collision-free path';}
   }
   if(!s.stopped&&(throttle||steer)){
    const old=this.pose;const next=stepRover(old,throttle,steer,dt,s.obstacle);this.pose=next;
    const travel=Math.hypot(next.x-old.x,next.z-old.z)*Math.sign(throttle);
    this.model.wheels.forEach((w,i)=>{w.rotation.x+=travel/.28+(i<2?-1:1)*steer*dt*.8;});if(next.collision)this.status='Obstacle guard · motion blocked';
   }
   this.model.root.position.set(this.pose.x,0,this.pose.z);this.model.root.rotation.y=this.pose.yaw;
   this.distance=rangeRay(this.pose.x,this.pose.z,this.pose.yaw,s.obstacle);
  }
  if(this.id==='sensors'){
   this.model.root.position.set(-1.7,0,1.4);this.distance=rangeRay(-1.7,1.4,this.clock*.65,s.obstacle);
   if(moving){this.model.sensor.rotation.y=this.clock*.65;this.roll=Math.sin(this.clock*.8)*22;this.pitch=Math.cos(this.clock*.55)*15;}
   this.status=moving?'Simulated sensor stream':'Sensor stream paused';
  }
  if(s.stopped)this.status='Emergency stop latched';
  const target=s.exploded?1:0;this.explosion+=(target-this.explosion)*Math.min(1,dt*5);
  for(const p of this.model.parts){if(p.id==='payload')continue;p.group.position.copy(p.home).addScaledVector(p.explode,this.explosion);p.group.visible=!s.hidden.includes(p.id)&&(!s.isolate||s.isolate===p.id);}
  this.model.root.updateMatrixWorld(true);
 }
 telemetry(fps=60){const pos=this.id==='rover'?new Vector3(this.pose.x,0,this.pose.z):this.model.tip.getWorldPosition(new Vector3());return {position:pos.toArray() as [number,number,number],angles:Object.fromEntries(this.model.joints.map(j=>[j.id,j.value])),sensor:this.distance,fps,path:this.path.length,status:this.status,roll:this.roll,pitch:this.pitch,scanAngle:this.clock*.65,route:this.path,force:Math.abs(Math.sin(this.clock))*24,torque:Math.abs(Math.sin(this.clock))*2.4};}
}
