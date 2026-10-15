import { afterEach, describe, expect, it } from 'vitest';
import { Box3, Mesh, Vector3 } from 'three';
import { buildRobot, type Model } from '../src/engine/models';
import { applyJoint, blocked, planPath, rangeRay, solveIK, stepRover, toCell } from '../src/engine/math';
import { Simulation } from '../src/engine/simulation';
import { useLab } from '../src/store';
import { ROBOTS } from '../src/data';
const allocated:Model[]=[];
function setup(id:typeof ROBOTS[number]['id']){useLab.getState().choose(id);const model=buildRobot(id);allocated.push(model);const sim=new Simulation(model,id);sim.step(useLab.getState(),0);return {model,sim};}
function advance(sim:Simulation,seconds:number){for(let i=0;i<seconds*60;i++)sim.step(useLab.getState(),1/60);}
afterEach(()=>{allocated.splice(0).forEach(m=>m.dispose());useLab.getState().reset();});
describe('Procedural mechanical models',()=>{
 for(const r of ROBOTS)it(r.id+' constructs finite selectable geometry',()=>{const {model}=setup(r.id);const ids=model.parts.map(p=>p.id);expect(new Set(ids).size).toBe(ids.length);expect(ids.length).toBeGreaterThan(5);let count=0;model.root.traverse(o=>{if(o instanceof Mesh){count++;const a=o.geometry.getAttribute('position');expect(Array.from(a.array).every(Number.isFinite)).toBe(true);}});expect(count).toBeGreaterThan(40);const size=new Box3().setFromObject(model.root).getSize(new Vector3());expect(size.length()).toBeGreaterThan(1);expect(Number.isFinite(size.length())).toBe(true);});
 it('humanoid exposes 17 controllable axes',()=>{const {model}=setup('humanoid');expect(model.joints).toHaveLength(17);});
 it('arm has six actual parent-child joint transforms',()=>{const {model}=setup('arm');expect(model.joints).toHaveLength(6);for(let i=1;i<6;i++)expect(model.joints[i].node.parent).toBe(model.joints[i-1].node);const before=model.tip.getWorldPosition(new Vector3());applyJoint(model.joints[0],80);model.root.updateMatrixWorld(true);expect(model.tip.getWorldPosition(new Vector3()).distanceTo(before)).toBeGreaterThan(.5);});
 it('joint commands clamp to mechanical limits',()=>{const {model}=setup('arm');for(const j of model.joints){applyJoint(j,999);expect(j.value).toBe(j.max);applyJoint(j,-999);expect(j.value).toBe(j.min);}});
 it('exploded parts smoothly return to their original transform',()=>{const {model,sim}=setup('humanoid');useLab.setState({exploded:true});advance(sim,3);expect(model.parts.find(p=>p.id==='head')!.group.position.distanceTo(model.parts.find(p=>p.id==='head')!.home)).toBeGreaterThan(.2);useLab.setState({exploded:false});advance(sim,3);for(const p of model.parts)expect(p.group.position.distanceTo(p.home)).toBeLessThan(.0001);});
 it('hide and isolate affect actual components',()=>{const {model,sim}=setup('hand');useLab.setState({hidden:['palm']});sim.step(useLab.getState(),.016);expect(model.parts.find(p=>p.id==='palm')!.group.visible).toBe(false);useLab.setState({hidden:[],isolate:'palm'});sim.step(useLab.getState(),.016);expect(model.parts.filter(p=>p.group.visible).map(p=>p.id)).toEqual(['palm']);});
});
describe('Inverse kinematics and pick / place',()=>{
 for(const target of [[1.3,.7,1.1],[1.3,.3,1.1],[-1.3,.3,1.1],[.8,2,.6]])it('reaches position '+target.join(','),()=>{const {model}=setup('arm');let error=Infinity;for(let i=0;i<20;i++)error=solveIK(model.joints,model.tip,new Vector3(...target));expect(error).toBeLessThan(.06);for(const j of model.joints){expect(j.value).toBeGreaterThanOrEqual(j.min);expect(j.value).toBeLessThanOrEqual(j.max);}});
 it('reports unreachable target without invalid coordinates',()=>{const {model}=setup('arm');const error=solveIK(model.joints,model.tip,new Vector3(50,50,50),80);expect(error).toBeGreaterThan(60);expect(Number.isFinite(error)).toBe(true);});
 it('pick sequence grasps and transfers a payload',()=>{const {model,sim}=setup('arm');useLab.getState().play('pick');let attached=false,placed=false;for(let i=0;i<1800;i++){sim.step(useLab.getState(),1/60);attached ||=sim.attached;placed ||=model.payload.position.x<-.9&&model.payload.position.y<.4;}expect(attached).toBe(true);expect(placed).toBe(true);});
});
describe('Navigation and sensing',()=>{
 for(const extra of [false,true])it('A* produces collision-free path, extra obstacle='+extra,()=>{const path=planPath(toCell(-3,3),toCell(3,-3),extra);expect(path.length).toBeGreaterThan(4);for(let i=1;i<path.length;i++)for(let k=0;k<=10;k++){const t=k/10,x=path[i-1][0]*(1-t)+path[i][0]*t,z=path[i-1][1]*(1-t)+path[i][1]*t;expect(blocked(x,z,extra)).toBe(false);}});
 it('rejects an obstructed destination',()=>expect(planPath(toCell(-3,3),toCell(0,0))).toEqual([]));
 it('manual steering rotates wheels and advances chassis',()=>{const {model,sim}=setup('rover');useLab.setState({drive:[1,.1]});advance(sim,.8);expect(sim.pose.z).toBeLessThan(3);expect(model.wheels[0].rotation.x).not.toBe(0);});
 it('collision guard stops the footprint before obstacle contact',()=>{let p={x:0,z:2,yaw:Math.PI};for(let i=0;i<100;i++)p=stepRover(p,1,0,.02,false);expect(blocked(p.x,p.z)).toBe(false);expect(p.z).toBeGreaterThan(1.3);});
 it('rover reaches an A* goal and replans on obstacle changes',()=>{const {sim}=setup('rover');useLab.getState().play('navigate');advance(sim,70);expect(Math.hypot(sim.pose.x-3,sim.pose.z+3)).toBeLessThan(.25);useLab.setState({obstacle:true,goal:[-3,3]});advance(sim,90);expect(Math.hypot(sim.pose.x+3,sim.pose.z-3)).toBeLessThan(.25);});
 it('LiDAR intersects rendered rectangle boundaries',()=>{expect(rangeRay(0,3,Math.PI,false)).toBeCloseTo(2.1,5);expect(rangeRay(-3,3,-Math.PI/2,false)).toBe(5);});
 it('sensor stream produces changing orientation and range',()=>{const {sim}=setup('sensors');useLab.getState().play('scan');advance(sim,.5);const before=sim.telemetry();advance(sim,1);expect(sim.telemetry().roll).not.toBe(before.roll);expect(Number.isFinite(sim.distance)).toBe(true);});
});
describe('Motion and safety controls',()=>{
 for(const demo of ['wave','handshake','walk'])it('humanoid '+demo+' changes joint pose',()=>{const {model,sim}=setup('humanoid');const before=model.joints.map(j=>j.value);useLab.getState().play(demo);advance(sim,.7);expect(model.joints.map(j=>j.value)).not.toEqual(before);});
 it('hand flexes all five coupled fingers',()=>{const {model,sim}=setup('hand');useLab.getState().play('grasp');advance(sim,1);expect(model.joints.every(j=>j.value>0)).toBe(true);});
 for(const r of ROBOTS)it(r.id+' E-stop freezes motion and reset re-arms',()=>{const {model,sim}=setup(r.id);useLab.getState().play();advance(sim,1);useLab.getState().emergency();const before=JSON.stringify([model.joints.map(j=>j.value),sim.pose,model.sensor.rotation.y,sim.clock,sim.phase,sim.explosion]);useLab.getState().play();useLab.getState().setJoint('j1',80);advance(sim,2);expect(JSON.stringify([model.joints.map(j=>j.value),sim.pose,model.sensor.rotation.y,sim.clock,sim.phase,sim.explosion])).toBe(before);expect(useLab.getState().running).toBe(false);useLab.getState().reset();sim.step(useLab.getState(),.01);expect(useLab.getState().stopped).toBe(false);expect(sim.clock).toBe(0);});
 it('pause freezes the motion clock and joint pose',()=>{const {model,sim}=setup('humanoid');useLab.getState().play('wave');advance(sim,1);useLab.getState().pause();const before=model.joints.map(j=>j.value);advance(sim,2);expect(model.joints.map(j=>j.value)).toEqual(before);});
});
