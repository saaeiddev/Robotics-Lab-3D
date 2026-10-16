import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Html, Line } from '@react-three/drei';
import * as T from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import type { OrbitControls as OrbitControlType } from 'three-stdlib';
import { useLab } from './store';
import type { Model } from './engine/models';
import { Simulation } from './engine/simulation';
import { obstacles, rangeRay } from './engine/math';

function Lighting(){
 const {gl,scene}=useThree();
 useEffect(()=>{const pmrem=new T.PMREMGenerator(gl),room=new RoomEnvironment(),env=pmrem.fromScene(room,.04);scene.environment=env.texture;scene.environmentIntensity=.75;room.dispose();pmrem.dispose();return()=>{scene.environment=null;env.dispose();};},[gl,scene]);
 return <><ambientLight intensity={.7}/><hemisphereLight args={['#fffbed','#707c63',1.4]}/><spotLight position={[3,7,4]} intensity={95} color="#fff8df" angle={.55} penumbra={1} castShadow shadow-mapSize={[1024,1024]} shadow-bias={-.001}/><directionalLight position={[-4,4,5]} intensity={2.4} color="#eef5e7"/><directionalLight position={[1,3,-4]} intensity={2} color="#e9e7ca"/></>;
}
function Room(){
 const robot=useLab(s=>s.robot);const r=robot==='rover'||robot==='sensors'?4.8:2.1;
 return <group><mesh rotation={[-Math.PI/2,0,0]} position={[0,-.18,0]} receiveShadow><planeGeometry args={[80,80]}/><meshStandardMaterial color="#e0e1d4" metalness={.05} roughness={.92}/></mesh>
 <gridHelper args={[30,40,'#a5af9a','#c3c9b8']} position={[0,-.17,0]}/>
 <mesh position={[0,-.14,0]} receiveShadow><cylinderGeometry args={[r,r+.04,.2,8]}/><meshStandardMaterial color="#234c3a" roughness={.6} metalness={.3}/></mesh>
 <mesh position={[0,-.035,0]} receiveShadow><cylinderGeometry args={[r-.025,r-.025,.016,8]}/><meshStandardMaterial color="#d0d4bf" roughness={.68} metalness={.18}/></mesh>
 <mesh position={[0,-.022,0]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[r*.77,r*.775,96]}/><meshBasicMaterial color="#7e9077"/></mesh>
 {Array.from({length:48},(_,i)=>{const a=i/48*Math.PI*2;return <mesh key={i} position={[Math.sin(a)*(r*.83),-.018,Math.cos(a)*(r*.83)]} rotation={[-Math.PI/2,0,-a]}><planeGeometry args={[.012,i%4===0?.12:.055]}/><meshBasicMaterial color={i%4===0?'#315c40':'#89987b'}/></mesh>;})}
 {[-1,1].map(x=><group key={x} position={[x*(r*.78),-.015,0]}><mesh rotation={[-Math.PI/2,0,0]}><planeGeometry args={[.13,.45]}/><meshBasicMaterial color="#c9dc6f"/></mesh></group>)}
 </group>;
}
function Course(){
 const robot=useLab(s=>s.robot),extra=useLab(s=>s.obstacle);const interactive=robot==='rover';
 return <group>
 {obstacles(extra).map((o,i)=><group key={i} position={[o.x,0,o.z]}><mesh position={[0,o.h/2,0]} castShadow receiveShadow><boxGeometry args={[o.w,o.h,o.d]}/><meshStandardMaterial color={i===3?'#a16c43':'#71816a'} metalness={.55} roughness={.4}/></mesh><mesh position={[0,o.h+.01,0]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[o.w*.85,o.d*.85]}/><meshStandardMaterial color="#c6cfb8"/></mesh><mesh position={[0,o.h+.02,o.d*.32]}><boxGeometry args={[o.w*.8,.02,.035]}/><meshBasicMaterial color={i===3?'#bd6b3b':'#ccd963'}/></mesh></group>)}
 {interactive&&<mesh rotation={[-Math.PI/2,0,0]} position={[0,-.005,0]} onDoubleClick={e=>{e.stopPropagation();useLab.setState({goal:[e.point.x,e.point.z],notice:'Waypoint updated. A* route recalculated.'});}}><planeGeometry args={[8,8]}/><meshBasicMaterial transparent opacity={0} depthWrite={false}/></mesh>}
 </group>;
}
function CameraRig({model,sim}:{model:Model;sim:Simulation}){
 const ref=useRef<OrbitControlType>(null);const {camera}=useThree();const version=useLab(s=>s.cameraVersion),robot=useLab(s=>s.robot);const desired=useRef<{p:T.Vector3;t:T.Vector3}|null>(null);
 const rotating=useLab(s=>s.autoRotate&&!s.stopped&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches);
 useEffect(()=>{
  const s=useLab.getState();const broad=robot==='rover'||robot==='sensors';const target=new T.Vector3(0,broad?.5:1.65,0);let distance=broad?12:7.1;
  if(s.camera==='focus'&&s.selected){const p=model.parts.find(p=>p.id===s.selected);if(p){p.group.getWorldPosition(target);distance=2.5;}}
  if(s.camera==='fit'){const bounds=new T.Box3().setFromObject(model.root);bounds.getCenter(target);distance=Math.max(bounds.getSize(new T.Vector3()).length()*1.15,4.5);}
  const offsets:Record<string,number[]>={front:[0,.13,1],back:[0,.13,-1],side:[1,.13,0],top:[.001,1,.001],perspective:[.72,.36,1],focus:[.55,.25,1],fit:[.65,.35,1]};
  const offset=new T.Vector3(...(offsets[s.camera]??offsets.perspective)).normalize().multiplyScalar(distance);desired.current={p:target.clone().add(offset),t:target};
 },[version,robot,model]);
 useFrame((_,dt)=>{
  if(!ref.current)return;
  if(desired.current){const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;const a=reduced?1:1-Math.exp(-dt*5);camera.position.lerp(desired.current.p,a);ref.current.target.lerp(desired.current.t,a);ref.current.update();if(camera.position.distanceTo(desired.current.p)<.02)desired.current=null;}
  else if(useLab.getState().follow&&robot==='rover'){const target=new T.Vector3(sim.pose.x,.5,sim.pose.z);const diff=target.clone().sub(ref.current.target).multiplyScalar(Math.min(dt*3,1));ref.current.target.add(diff);camera.position.add(diff);ref.current.update();}
 });
 return <OrbitControls ref={ref} makeDefault enableDamping dampingFactor={.08} minDistance={1.3} maxDistance={22} maxPolarAngle={Math.PI*.49} autoRotate={rotating} autoRotateSpeed={.6} onStart={()=>{desired.current=null;}}/>;
}
function SensorVisual({sim}:{sim:Simulation}){
 const line=useRef<T.LineSegments>(null),points=useRef<T.Points>(null);const robot=useLab(s=>s.robot),visible=useLab(s=>s.sensorsVisible);const sensor=useLab(s=>s.sensor);
 const positions=useMemo(()=>new Float32Array(96*6),[]),dots=useMemo(()=>new Float32Array(96*3),[]);
 useFrame(()=>{
  const s=useLab.getState();if(!line.current||!points.current)return;
  const x=robot==='rover'?sim.pose.x:-1.7,z=robot==='rover'?sim.pose.z:1.4,y=.48;
  for(let i=0;i<96;i++){
   const angle=sensor==='ultrasonic'?sim.clock*.65+(i/96-.5)*.3:sensor==='rgb'||sensor==='depth'?(i/96-.5)*1.5+sim.clock*.2:i/96*Math.PI*2+sim.clock*.65;
   const d=rangeRay(x,z,angle,s.obstacle);const end=[x+Math.sin(angle)*d,y,z+Math.cos(angle)*d];positions.set([x,y,z,...end],i*6);dots.set(end,i*3);
  }
  line.current.geometry.attributes.position.needsUpdate=true;points.current.geometry.attributes.position.needsUpdate=true;
 });
 if(!visible)return null;
 return <group><lineSegments ref={line} frustumCulled={false}><bufferGeometry><bufferAttribute attach="attributes-position" args={[positions,3]}/></bufferGeometry><lineBasicMaterial color={sensor==='depth'?'#758f43':'#406c35'} transparent opacity={.16} depthWrite={false}/></lineSegments><points ref={points} frustumCulled={false}><bufferGeometry><bufferAttribute attach="attributes-position" args={[dots,3]}/></bufferGeometry><pointsMaterial color="#406c35" size={.045} sizeAttenuation/></points></group>;
}
function SensorSpecial({sim}:{sim:Simulation}){
 const sensor=useLab(s=>s.sensor),visible=useLab(s=>s.sensorsVisible);const orientation=useRef<T.Group>(null),probe=useRef<T.Group>(null);
 useFrame(()=>{if(orientation.current)orientation.current.rotation.set(sim.roll*Math.PI/180,0,sim.pitch*Math.PI/180);if(probe.current)probe.current.position.y=1.4-Math.abs(Math.sin(sim.clock))*.35;});
 if(!visible)return null;
 if(sensor==='imu')return <group position={[1.5,1.4,-1.8]}><group ref={orientation}><axesHelper args={[1]}/><mesh><boxGeometry args={[.6,.12,.45]}/><meshStandardMaterial color="#758f43" metalness={.5} roughness={.35}/></mesh></group><Html position={[0,1.1,0]} center><span className="target-label">IMU / ORIENTATION</span></Html></group>;
 if(sensor==='force')return <group position={[-3,0,-2]}><mesh position={[0,.55,0]}><cylinderGeometry args={[.3,.3,.7,24]}/><meshStandardMaterial color="#526951"/></mesh><group ref={probe}><mesh><cylinderGeometry args={[.07,.07,1,16]}/><meshStandardMaterial color="#c2c9b8" metalness={.8} roughness={.2}/></mesh><mesh position={[0,.6,0]} rotation={[Math.PI,0,0]}><coneGeometry args={[.16,.3,12]}/><meshBasicMaterial color="#bd6b3b"/></mesh></group><Html position={[0,2.2,0]} center><span className="target-label">CONTACT / F = kx</span></Html></group>;
 return null;
}
function RenderPass({sim}:{sim:Simulation}){
 const {gl,scene,camera,size}=useThree();const sensorCam=useMemo(()=>new T.PerspectiveCamera(65,16/9,.1,12),[]);const depth=useMemo(()=>new T.MeshDepthMaterial(),[]);
 useEffect(()=>()=>depth.dispose(),[depth]);
 useFrame(()=>{
  gl.setScissorTest(false);gl.setViewport(0,0,size.width,size.height);gl.autoClear=true;gl.render(scene,camera);
  const s=useLab.getState();if(s.robot!=='sensors'||!['rgb','depth'].includes(s.sensor))return;
  const w=Math.min(230,size.width*.43),h=w*9/16;
  sensorCam.position.set(1.3,1.35,3.5);sensorCam.lookAt(Math.sin(sim.clock*.25)*1.2,.6,-1.5);
  gl.setScissorTest(true);gl.setScissor(16,110,w,h);gl.setViewport(16,110,w,h);gl.clearDepth();
  const original=scene.overrideMaterial;if(s.sensor==='depth')scene.overrideMaterial=depth;
  gl.render(scene,sensorCam);scene.overrideMaterial=original;gl.setScissorTest(false);gl.setViewport(0,0,size.width,size.height);
 },1);
 return null;
}
function Target(){
 const target=useLab(s=>s.target),active=useLab(s=>s.ik),stopped=useLab(s=>s.stopped);const {controls}=useThree();const dragging=useRef(false);
 if(!active)return null;
 const release=(e:ThreeEvent<PointerEvent>)=>{dragging.current=false;(e.target as unknown as Element).releasePointerCapture?.(e.pointerId);if(controls)(controls as unknown as {enabled:boolean}).enabled=true;};
 return <group position={target}><mesh onPointerDown={e=>{if(stopped)return;e.stopPropagation();dragging.current=true;(e.target as unknown as Element).setPointerCapture?.(e.pointerId);if(controls)(controls as unknown as {enabled:boolean}).enabled=false;}} onPointerUp={release} onPointerMove={e=>{if(!dragging.current)return;e.stopPropagation();const p=new T.Vector3();if(e.ray.intersectPlane(new T.Plane(new T.Vector3(0,1,0),-target[1]),p))useLab.setState({target:[p.x,target[1],p.z]});}}><sphereGeometry args={[.12,16,16]}/><meshBasicMaterial color="#406c35" wireframe/></mesh><Html position={[.15,.15,0]}><span className="target-label">IK TARGET</span></Html><mesh rotation={[-Math.PI/2,0,0]}><torusGeometry args={[.22,.01,6,24]}/><meshBasicMaterial color="#406c35"/></mesh></group>;
}
function Robot({model,sim}:{model:Model;sim:Simulation}){
 const selected=useLab(s=>s.selected),hovered=useLab(s=>s.hovered),xray=useLab(s=>s.xray),labels=useLab(s=>s.labels),robot=useLab(s=>s.robot),envelope=useLab(s=>s.envelope);
 const timer=useRef(0);const [route,setRoute]=useState<[number,number,number][]>([]);const lastRoute=useRef('');
 useEffect(()=>{
  const originals=new Map<T.Mesh,T.Material|T.Material[]>();const clones:T.Material[]=[];
  model.root.traverse(o=>{if(o instanceof T.Mesh){const material=o.material as T.MeshStandardMaterial;originals.set(o,material);const m=material.clone();const sel=o.userData.component===selected,hov=o.userData.component===hovered;
   if(sel||hov){m.emissive.set(sel?'#758b22':'#405e35');m.emissiveIntensity=sel?.85:.5;}
   if(xray){m.transparent=true;m.opacity=.28;m.depthWrite=false;}
   o.material=m;clones.push(m);
  }});return()=>{originals.forEach((m,o)=>{o.material=m;});clones.forEach(m=>m.dispose());};
 },[model,selected,hovered,xray]);
 useFrame((_,dt)=>{
  sim.step(useLab.getState(),dt);timer.current+=dt;
  if(timer.current>.12){useLab.setState({telemetry:sim.telemetry(Math.round(1/dt))});timer.current=0;const key=JSON.stringify(sim.path);if(lastRoute.current!==key){setRoute(sim.path.map(p=>[p[0],.04,p[1]]));lastRoute.current=key;}}
 });
 const selectedPart=model.parts.find(p=>p.id===selected);const labelPos=selectedPart?.group.getWorldPosition(new T.Vector3());
 return <><primitive object={model.root} onClick={(e:ThreeEvent<MouseEvent>)=>{e.stopPropagation();if(e.object.userData.component)useLab.setState({selected:e.object.userData.component,notice:'Component selected. Inspector updated.'});}} onPointerOver={(e:ThreeEvent<PointerEvent>)=>{e.stopPropagation();useLab.setState({hovered:e.object.userData.component??null});document.body.style.cursor='pointer';}} onPointerOut={()=>{useLab.setState({hovered:null});document.body.style.cursor='auto';}}/>
 {labels&&selectedPart&&labelPos&&<Html position={labelPos.toArray()} center distanceFactor={7} style={{pointerEvents:'none'}}><div className="component-label">{selectedPart.name}<span>COMPONENT SELECTED</span></div></Html>}
 {robot==='arm'&&<><Target/>{envelope&&<mesh position={[0,1,0]}><sphereGeometry args={[2.7,24,12,0,Math.PI*2,0,Math.PI/2]}/><meshBasicMaterial color="#406c35" wireframe transparent opacity={.08} depthWrite={false}/></mesh>}{[-1,1].map(s=><mesh key={s} position={[s*1.3,.08,1.1]}><boxGeometry args={[.65,.13,.65]}/><meshStandardMaterial color="#86977a"/></mesh>)}</>}
 {robot==='rover'&&route.length>1&&<Line points={route} color="#406c35" lineWidth={2}/>}
 {(robot==='rover'||robot==='sensors')&&<SensorVisual sim={sim}/>}
 </>;
}
function Quality(){const {setDpr}=useThree();const quality=useLab(s=>s.quality);const total=useRef([0,0]);useEffect(()=>setDpr(quality==='low'?1:Math.min(devicePixelRatio,quality==='high'?2:1.5)),[quality,setDpr]);useFrame((_,dt)=>{if(quality!=='auto')return;total.current[0]+=dt;total.current[1]++;if(total.current[1]===180){if(total.current[0]>6)setDpr(1);total.current=[0,0];}});return null;}
export default function Scene({model}:{model:Model}){
 const robot=useLab(s=>s.robot);const sim=useMemo(()=>new Simulation(model,robot),[model,robot]);const [error,setError]=useState(false);
 useEffect(()=>{const handle=()=>setError(true);window.addEventListener('webglcontextlost',handle);return()=>window.removeEventListener('webglcontextlost',handle);},[]);
 if(error)return <div className="fallback"><h2>Graphics session interrupted</h2><p>Your device lost its WebGL context. Reload to reopen the lab.</p><button onClick={()=>location.reload()}>Reload laboratory</button></div>;
 return <Canvas shadows dpr={[1,1.5]} camera={{position:[4.2,3.5,6.5],fov:36,near:.05,far:80}} gl={{antialias:true,alpha:true,powerPreference:'high-performance'}} onCreated={({gl})=>{gl.setClearColor('#000000',0);gl.domElement.addEventListener('webglcontextlost',()=>setError(true));}} fallback={<div className="fallback">WebGL is unavailable. Enable hardware acceleration or try a supported browser. The academy remains available.</div>} onPointerMissed={()=>useLab.setState({selected:null})}>
 <fog attach="fog" args={['#e7e8dc',14,32]}/><Suspense fallback={null}><Lighting/><Room/>{(robot==='rover'||robot==='sensors')&&<Course/>}<Robot model={model} sim={sim}/>{robot==='sensors'&&<SensorSpecial sim={sim}/>}<RenderPass sim={sim}/><CameraRig model={model} sim={sim}/><Quality/></Suspense>
 </Canvas>;
}
