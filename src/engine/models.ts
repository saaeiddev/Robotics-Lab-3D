import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { RobotId } from '../data';
import { applyJoint, type Joint } from './math';
export type Part={id:string;name:string;group:T.Group;home:T.Vector3;explode:T.Vector3;description:string;material:string};
export type Model={root:T.Group;parts:Part[];joints:Joint[];tip:T.Group;wheels:T.Group[];grips:T.Group[];sensor:T.Group;payload:T.Group;dimensions:[number,number,number];dispose:()=>void};
const COLORS={silver:'#bccbd6',white:'#e4edf2',dark:'#111b25',black:'#070d14',cyan:'#00e5ff',orange:'#ff9a2f',violet:'#8b5cf6',rubber:'#18202a'};
type Color=keyof typeof COLORS;
export function buildRobot(id:RobotId):Model{
 const root=new T.Group(),parts:Part[]=[],joints:Joint[]=[],wheels:T.Group[]=[],grips:T.Group[]=[];
 const geometries=new Map<string,T.BufferGeometry>();const materials:T.Material[]=[];
 const textureData=new Uint8Array(64*64*4);for(let y=0;y<64;y++)for(let x=0;x<64;x++){const i=(y*64+x)*4;const v=174+((y*17+x*3)%23);textureData.set([v,v,v,255],i);}
 const brushed=new T.DataTexture(textureData,64,64);brushed.needsUpdate=true;brushed.wrapS=brushed.wrapT=T.RepeatWrapping;brushed.repeat.set(4,4);
 const geo=(key:string,fn:()=>T.BufferGeometry)=>{if(!geometries.has(key))geometries.set(key,fn());return geometries.get(key)!;};
 const mats=new Map<string,T.MeshStandardMaterial>();
 const mat=(color:Color,glow=false)=>{const k=color+glow;if(!mats.has(k)){const m=new T.MeshStandardMaterial({color:COLORS[color],metalness:color==='rubber'?.15:.65,roughness:glow?.28:color==='dark'?.5:.33,emissive:glow?COLORS[color]:'#000',emissiveIntensity:glow?2.1:0,roughnessMap:['silver','white'].includes(color)?brushed:null});mats.set(k,m);materials.push(m);}return mats.get(k)!;};
 function mesh(parent:T.Object3D,g:T.BufferGeometry,color:Color,pos:[number,number,number]=[0,0,0],glow=false){const m=new T.Mesh(g,mat(color,glow));m.position.set(...pos);m.castShadow=!glow;m.receiveShadow=true;parent.add(m);return m;}
 function box(parent:T.Object3D,size:[number,number,number],pos:[number,number,number],color:Color='silver',glow=false){return mesh(parent,geo('b'+size.join(','),()=>new RoundedBoxGeometry(...size,2,Math.min(...size)*.12)),color,pos,glow);}
 function cyl(parent:T.Object3D,r:number,h:number,pos:[number,number,number],color:Color='dark',axis:'x'|'y'|'z'='y',glow=false){const m=mesh(parent,geo('c'+r+','+h,()=>new T.CylinderGeometry(r,r,h,24)),color,pos,glow);if(axis==='x')m.rotation.z=Math.PI/2;if(axis==='z')m.rotation.x=Math.PI/2;return m;}
 function ring(parent:T.Object3D,r:number,tube:number,pos:[number,number,number],color:Color='cyan',axis:'x'|'y'|'z'='z',glow=false){const m=mesh(parent,geo('t'+r+','+tube,()=>new T.TorusGeometry(r,tube,6,32)),color,pos,glow);if(axis==='x')m.rotation.y=Math.PI/2;if(axis==='y')m.rotation.x=Math.PI/2;return m;}
 function rod(parent:T.Object3D,a:T.Vector3,b:T.Vector3,r=.025,color:Color='silver'){const d=b.clone().sub(a),m=cyl(parent,r,d.length(),a.clone().add(b).multiplyScalar(.5).toArray() as [number,number,number],color);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return m;}
 function bolts(parent:T.Object3D,x:number,y:number,z:number,w:number,h:number){for(const sx of [-1,1])for(const sy of [-1,1]){cyl(parent,.022,.015,[x+sx*w/2,y+sy*h/2,z],'dark','z');}}
 function cable(parent:T.Object3D,points:number[][],color:Color='black',radius=.022){const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));const geometry=new T.TubeGeometry(curve,18,radius,5,false);geometries.set('cable'+geometries.size,geometry);mesh(parent,geometry,color);}
 function part(id:string,name:string,parent:T.Object3D,pos:[number,number,number],exp:[number,number,number],description:string,material='Aluminum housing · steel bearings'){
  const group=new T.Group();group.position.set(...pos);parent.add(group);group.userData.component=id;
  parts.push({id,name,group,home:group.position.clone(),explode:new T.Vector3(...exp),description,material});return group;
 }
 function joint(id:string,name:string,parent:T.Object3D,pos:[number,number,number],axis:[number,number,number],min:number,max:number,home=0){const node=new T.Group();node.position.set(...pos);parent.add(node);const j={id,name,node,axis:new T.Vector3(...axis),min,max,value:home,home};joints.push(j);applyJoint(j,home);return node;}
 function servo(parent:T.Object3D,r:number,axis:'x'|'y'|'z'='x',color:Color='cyan'){
  cyl(parent,r,.16,[0,0,0],'dark',axis);cyl(parent,r*.82,.19,[0,0,0],'silver',axis);cyl(parent,r*.55,.205,[0,0,0],'dark',axis);ring(parent,r*.62,.016,[0,0,0],color,axis,true);
  const pos:[number,number,number]=axis==='x'?[.11,0,0]:axis==='z'?[0,0,.11]:[0,.11,0];cyl(parent,r*.2,.025,pos,'silver',axis);
 }
 function limb(parent:T.Object3D,length:number,width:number,color:Color='white'){
  box(parent,[width,length,width*.85],[0,-length/2,0],color);
  box(parent,[width*.5,length*.66,.035],[0,-length/2,width*.44],'dark');
  box(parent,[.028,length*.45,.018],[width*.29,-length/2,width*.47],'cyan',true);
  for(const side of [-1,1])rod(parent,new T.Vector3(side*width*.42,-.08,-width*.3),new T.Vector3(side*width*.42,-length+.08,-width*.3),.025);
  bolts(parent,0,-length/2,width*.45,width*.72,length*.72);
 }
 let tip=new T.Group(),sensor=new T.Group(),payload=new T.Group();let dimensions:[number,number,number]=[4,4,4];
 if(id==='humanoid'){
  const pelvis=part('pelvis','Pelvic chassis',root,[0,1.8,0],[0,.1,0],'The pelvic frame carries leg actuators and transfers loads between the trunk and the lower limbs.');
  box(pelvis,[.7,.35,.43],[0,0,0],'dark');box(pelvis,[.55,.22,.07],[0,.025,.25],'silver');bolts(pelvis,0,.025,.29,.42,.12);
  for(let k=0;k<4;k++)box(pelvis,[.075,.08,.018],[(k-1.5)*.105,.025,.3],k===0?'orange':'dark',k===0);
  const torso=part('torso','Thoracic frame & power core',root,[0,2.4,0],[0,.42,-.08],'The structural torso houses power electronics, computing and the spinal support frame. Panels expose a conceptual internal layout.');
  box(torso,[.65,.68,.36],[0,0,0],'dark');const chest=box(torso,[.99,.47,.49],[0,.15,.02],'white');chest.rotation.z=0;
  box(torso,[.65,.2,.075],[0,.15,.3],'dark');box(torso,[.46,.025,.025],[0,.17,.35],'cyan',true);
  for(const s of [-1,1]){const b=box(torso,[.18,.24,.09],[s*.31,.03,.3],'silver');b.rotation.z=s*-.2;for(let v=0;v<4;v++)box(torso,[.1,.014,.012],[s*.32,.095-v*.035,.36],'black');cable(torso,[[s*.35,-.25,-.15],[s*.48,0,-.23],[s*.36,.35,-.2]],'black');}
  for(let i=0;i<4;i++){box(torso,[.43-i*.025,.075,.38],[0,-.16-i*.095,0],'silver');box(torso,[.22,.03,.02],[0,-.16-i*.095,.2],'dark');}
  bolts(torso,0,.16,.27,.85,.32);
  const neck=joint('neck','Neck yaw',root,[0,2.98,0],[0,1,0],-70,70);const neckPart=part('neck-unit','Cervical yaw actuator',neck,[0,0,0],[0,.18,0],'A revolute yaw joint rotates the head. This model limits yaw to ±70° to illustrate mechanical travel.');servo(neckPart,.12,'y');
  const head=part('head','Optical head assembly',neck,[0,.3,0],[0,.28,0],'A stereo-style optical assembly and protective faceplate mounted on the cervical actuator. The illuminated visor is a conceptual sensor aperture.','Ceramic-coated aluminum · optical glass');
  box(head,[.48,.47,.42],[0,0,0],'white');box(head,[.425,.2,.07],[0,.025,.225],'black');box(head,[.31,.035,.025],[0,.04,.27],'cyan',true);
  for(const s of [-1,1]){cyl(head,.085,.08,[s*.26,.015,-.015],'dark','x');ring(head,.06,.009,[s*.303,.015,-.015],'cyan','x',true);cyl(head,.031,.016,[s*.1,.03,.273],'cyan','z',true);}
  box(head,[.19,.035,.025],[0,-.12,.24],'dark');box(head,[.08,.06,.02],[0,.17,.22],'silver');
  for(const s of [-1,1]){
   const side=s<0?'right':'left';
   const shoulderRoll=joint(side+'ShoulderRoll',side+' shoulder abduction',root,[s*.62,2.72,0],[0,0,1],-80,80);
   const shoulder=joint(side+'Shoulder',side+' shoulder pitch',shoulderRoll,[0,0,0],[1,0,0],-145,70,s<0?-12:8);
   const sh=part(side+'-shoulder',side+' shoulder actuator',shoulder,[0,0,0],[s*.25,.1,0],'A rotary drive about the shoulder pitch axis. The child arm follows this pivot through the full permitted range.');servo(sh,.2,'x');box(sh,[.32,.26,.4],[0,.03,0],'white');
   const upper=part(side+'-upper-arm',side+' upper arm',shoulder,[0,-.13,0],[s*.25,0,0],'Paired structural rails carry loads to the elbow actuator. Cable routing follows the back of the link.');limb(upper,.57,.26);cable(upper,[[0,0,-.16],[.12,-.28,-.21],[0,-.58,-.15]]);
   const elbow=joint(side+'Elbow',side+' elbow flexion',shoulder,[0,-.76,0],[1,0,0],-135,0,-12);const el=part(side+'-elbow',side+' elbow servo',elbow,[0,0,0],[s*.2,-.1,0],'An elbow hinge flexes toward the front of the torso. Range: 0–135° flexion.');servo(el,.14);
   const forearm=part(side+'-forearm',side+' forearm',elbow,[0,-.12,0],[s*.3,-.1,0],'The forearm protects the wrist transmission and distal cables.');limb(forearm,.49,.25);
   const wrist=joint(side+'Wrist',side+' wrist pitch',elbow,[0,-.75,.02],[1,0,0],-45,45);
   const palm=part(side+'-hand',side+' end-effector hand',wrist,[0,0,0],[s*.3,-.2,.08],'A compact multi-finger end effector. Explore the separate DEXTER system for individually controlled coupled fingers.');box(palm,[.2,.22,.095],[0,0,0],'silver');
   for(let f=0;f<4;f++){for(let k=0;k<3;k++){box(palm,[.035,.055,.045],[(f-1.5)*.048,-.15-k*.065,.01],'white');cyl(palm,.022,.04,[(f-1.5)*.048,-.12-k*.065,.01],'dark','x');}}box(palm,[.06,.15,.06],[s*.12,-.02,.045],'dark');
   const hipYaw=joint(side+'HipYaw',side+' hip yaw',root,[s*.24,1.68,0],[0,1,0],-35,35);
   const hip=joint(side+'Hip',side+' hip pitch',hipYaw,[0,0,0],[1,0,0],-45,60);const hi=part(side+'-hip',side+' hip actuator',hip,[0,0,0],[s*.2,0,0],'A powered hip pivot connects the pelvic frame to the upper leg. Walking here is a kinematic cycle, not a balance simulation.');servo(hi,.16);
   const thigh=part(side+'-thigh',side+' femoral link',hip,[0,-.12,0],[s*.15,-.1,0],'The upper leg carries bending and torsional loads between hip and knee.');limb(thigh,.63,.31);
   const knee=joint(side+'Knee',side+' knee flexion',hip,[0,-.83,0],[1,0,0],0,110);const kn=part(side+'-knee',side+' knee actuator',knee,[0,0,0],[s*.15,-.15,0],'A hinge knee permits 0–110° flexion. Joint limits prevent reverse hyperextension.');servo(kn,.14);box(kn,[.2,.19,.1],[0,0,.13],'white');
   const shin=part(side+'-shin',side+' tibial link',knee,[0,-.1,0],[s*.2,-.15,0],'The shin provides a rigid path to the ankle. Parallel rods suggest a compact actuator and damping package.');limb(shin,.55,.25);
   const ankle=joint(side+'Ankle',side+' ankle pitch',knee,[0,-.68,0],[1,0,0],-30,30);const foot=part(side+'-foot',side+' ankle & foot',ankle,[0,0,.1],[s*.15,-.2,.2],'An ankle pivot positions a broad contact foot. Ground reactions and active stabilization are not simulated.','Aluminum skeleton · rubber sole');servo(foot,.095);box(foot,[.3,.14,.5],[0,-.07,.07],'white');box(foot,[.31,.04,.51],[0,-.145,.07],'rubber');box(foot,[.15,.015,.08],[0,.006,.24],'cyan',true);
  }
  tip=head;dimensions=[3.8,4,3.8];
 }
 if(id==='arm'){
  const base=part('base','Anchored base',root,[0,.22,0],[0,-.05,0],'The fixed base defines the robot coordinate system and supports the first rotary joint.');cyl(base,.6,.32,[0,0,0],'dark');cyl(base,.49,.08,[0,.2,0],'silver');ring(base,.51,.018,[0,.24,0],'orange','y',true);for(let k=0;k<8;k++){const a=k*Math.PI/4;cyl(base,.04,.025,[Math.cos(a)*.5,.18,Math.sin(a)*.5],'silver');}
  const specs:[string,string,number[],number[],number,number,number,number][]=[['j1','Base yaw',[0,.52,0],[0,1,0],-170,170,20,.48],['j2','Shoulder pitch',[0,.48,0],[0,0,1],-100,100,-35,1.35],['j3','Elbow pitch',[0,1.35,0],[0,0,1],-140,140,80,1.1],['j4','Wrist roll',[0,1.1,0],[0,1,0],-180,180,0,.32],['j5','Wrist pitch',[0,.32,0],[0,0,1],-110,110,35,.28],['j6','Tool roll',[0,.28,0],[0,1,0],-180,180,0,.24]];
  let parent:T.Object3D=root;
  for(let i=0;i<6;i++){
   const [jid,name,pos,axis,min,max,home,len]=specs[i];const j=joint(jid,name,parent,pos as [number,number,number],axis as [number,number,number],min,max,home);const p=part('link'+i,`J${i+1} · ${name}`,j,[0,0,0],[(i%2?-1:1)*.3,.16*i,0],`Revolute joint ${i+1}: ${name.toLowerCase()}. Mechanical travel ${min}° to ${max}°. Child links inherit this transformation.`);
   servo(p,i<3?.23:.14,axis[1]?'y':'z','orange');
   if(i<4){box(p,[i<2?.34:.25,len-.12,i<2?.38:.28],[0,len/2+.03,0],i<3?'orange':'silver');box(p,[.17,len*.65,.025],[0,len/2,.205],'dark');for(const s of [-1,1])rod(p,new T.Vector3(s*.19,.1,-.15),new T.Vector3(s*.19,len-.05,-.15),.033);bolts(p,0,len/2,.22,.25,len*.66);cable(p,[[.15,.04,-.22],[.27,len*.5,-.23],[.12,len,-.2]],'black',.035);}
   else cyl(p,.105,len,[0,len/2,0],'silver');parent=j;
  }
  const tool=part('tool','Parallel jaw gripper',parent,[0,.26,0],[.2,.25,0],'Two opposed jaws grasp a payload. The pick cycle attaches the payload only after a near-target grasp; no contact dynamics are solved.','Steel fingers · aluminum gearbox');box(tool,[.5,.15,.24],[0,0,0],'dark');
  for(const s of [-1,1]){const grip=new T.Group();grip.position.x=s*.17;grip.userData.side=s;tool.add(grip);box(grip,[.075,.28,.16],[0,.14,0],'silver');box(grip,[.045,.09,.18],[-s*.035,.26,0],'rubber');grips.push(grip);}
  tip=new T.Group();tip.position.set(0,.25,0);tool.add(tip);
  payload=part('payload','Transfer payload',root,[1.3,.3,1.1],[0,0,0],'A lightweight demonstration payload. Attachment is kinematic and depends on the gripper reaching the pickup point.','Anodized aluminum');box(payload,[.3,.3,.3],[0,0,0],'cyan');for(let i=0;i<3;i++)box(payload,[.31,.015,.31],[0,(i-1)*.07,0],'dark');dimensions=[5,4.5,5];
 }
 if(id==='rover'){
  const chassis=part('chassis','Exploration chassis',root,[0,.58,0],[0,.35,0],'A compact differential-drive rover with four driven wheels. Motion is integrated on a flat ground plane; wheel slip and suspension dynamics are omitted.');box(chassis,[.92,.3,1.28],[0,0,0],'silver');box(chassis,[.83,.07,1.05],[0,.18,0],'dark');box(chassis,[.45,.025,.65],[0,.225,-.12],'black');for(let v=0;v<5;v++)box(chassis,[.4,.008,.012],[0,.245,-.35+v*.11],'cyan');
  const front=part('bumper','Front bumper & proximity array',root,[0,.56,.69],[0,0,.35],'A protective bumper carries virtual proximity sensors. Collision checking uses an inflated two-dimensional footprint.');box(front,[.87,.2,.1],[0,0,0],'dark');for(const s of [-1,1]){cyl(front,.05,.03,[s*.28,.02,.06],'cyan','z',true);box(front,[.14,.035,.02],[s*.32,-.04,.07],'white',true);}
  for(const sx of [-1,1])for(const sz of [-1,1]){
   const wh=part(`wheel-${sx}-${sz}`,'Driven wheel & suspension',root,[sx*.57,.3,sz*.44],[sx*.3,-.1,sz*.15],'A drive wheel rotates with travel distance. Left/right speed differences produce yaw. The rubber tread is modeled as individual mechanical ribs.','Rubber tire · aluminum hub');wheels.push(wh);cyl(wh,.28,.18,[0,0,0],'rubber','x');cyl(wh,.185,.195,[0,0,0],'silver','x');cyl(wh,.09,.21,[0,0,0],'dark','x');ring(wh,.19,.012,[sx*.105,0,0],'orange','x',true);
   for(let n=0;n<16;n++){const a=n*Math.PI/8;const b=box(wh,[.19,.065,.07],[0,Math.cos(a)*.265,Math.sin(a)*.265],'rubber');b.rotation.x=a;}
   rod(root,new T.Vector3(sx*.2,.55,sz*.44),new T.Vector3(sx*.57,.3,sz*.44),.045);
  }
  const mast=part('mast','Sensor mast',root,[0,.97,.2],[0,.55,0],'The mast raises the camera and rangefinder above the body to reduce self-occlusion.');cyl(mast,.065,.47,[0,0,0],'silver');box(mast,[.37,.15,.18],[0,.24,0],'dark');for(const s of [-1,1])cyl(mast,.045,.025,[s*.1,.24,.11],'cyan','z',true);
  sensor=part('rover-lidar','Rotating LiDAR',root,[0,1.34,.1],[0,.65,0],'A rotating rangefinder projects rays into the virtual obstacle field. Returns are simulated distances, not hardware telemetry.');cyl(sensor,.15,.16,[0,0,0],'dark');ring(sensor,.151,.018,[0,.02,0],'cyan','y',true);cyl(sensor,.12,.025,[0,.1,0],'silver');tip=mast;dimensions=[9,2,9];
 }
 if(id==='hand'){
  const base=part('hand-base','Wrist drive module',root,[0,.32,0],[0,-.15,0],'Five conceptual tendon drives are mounted in the wrist. Each user control couples three flexion joints.');cyl(base,.43,.42,[0,0,0],'dark');ring(base,.42,.02,[0,.14,0],'cyan','y',true);for(let n=0;n<5;n++)cyl(base,.05,.22,[(n-2)*.12,.28,.07],'silver');
  const palm=part('palm','Metacarpal frame',root,[0,1.05,0],[0,.2,-.25],'The palm supports the finger pivots. Parallel internal rails and tendon guides carry loads to the wrist.','Aluminum frame · steel tendon guides');box(palm,[1.03,.96,.26],[0,0,0],'silver');box(palm,[.81,.72,.04],[0,.03,.16],'dark');for(let n=0;n<4;n++){box(palm,[.12,.61,.05],[(n-1.5)*.21,.05,.205],'white');rod(palm,new T.Vector3((n-1.5)*.21,-.4,-.17),new T.Vector3((n-1.5)*.21,.45,-.17),.017,'orange');}bolts(palm,0,.03,.19,.89,.82);
  const names=['little','ring','middle','index','thumb'];
  for(let f=0;f<5;f++){
   const thumb=f===4;const mount=new T.Group();mount.position.set(thumb?.61:(f-1.5)*.24,thumb?.97:1.58,0);if(thumb)mount.rotation.z=-.85;root.add(mount);
   let parent:T.Object3D=mount;const lengths=thumb?[.34,.29,.21]:[f===0?.37:.48,.34,.25];
   for(let k=0;k<3;k++){
    const j=joint(names[f]+k,`${names[f]} ${['MCP','PIP','DIP'][k]}`,parent,[0,k?lengths[k-1]:0,0],[1,0,0],0,k===0?85:100);
    const p=part(names[f]+'-'+k,`${names[f]} · ${['proximal','middle','distal'][k]} phalanx`,j,[0,0,0],[(f-1.5)*.12,.12*(k+1),.14],`Finger segment driven about its ${['metacarpophalangeal','proximal interphalangeal','distal interphalangeal'][k]} pivot. The illustrative coupling ratio is 1 : 0.85 : 0.65.`,'Aluminum phalanx · steel pin · polymer pad');
    servo(p,.09,'x');box(p,[.165,lengths[k]-.08,.16],[0,lengths[k]/2,0],'white');box(p,[.11,lengths[k]-.13,.035],[0,lengths[k]/2,.095],'rubber');rod(p,new T.Vector3(-.065,.05,-.1),new T.Vector3(-.065,lengths[k]-.02,-.1),.012,'orange');rod(p,new T.Vector3(.065,.05,-.1),new T.Vector3(.065,lengths[k]-.02,-.1),.012,'silver');parent=j;
   }
  }
  tip=palm;dimensions=[4,3.6,4];
 }
 if(id==='sensors'){
  const base=part('sensor-base','Perception test bench',root,[0,.22,0],[0,-.1,0],'A modular bench presents six complementary sensing modalities. Every measurement is generated by this virtual scene.');cyl(base,.78,.24,[0,0,0],'dark');ring(base,.7,.018,[0,.13,0],'violet','y',true);
  const mast=part('sensor-mast','Instrument mast',root,[0,.92,0],[0,.3,0],'The mast positions optical and inertial instruments within a shared test frame.');box(mast,[.23,1.25,.25],[0,0,0],'silver');box(mast,[.12,.8,.025],[0,0,.14],'dark');bolts(mast,0,0,.16,.15,1.1);for(let n=0;n<6;n++)box(mast,[.14,.02,.02],[0,-.35+n*.14,.165],'dark');cable(mast,[[.1,-.5,-.15],[.25,0,-.25],[.1,.6,-.15]],'black');
  sensor=part('lidar','LiDAR scanner',root,[0,1.78,0],[0,.8,0],'Rotating virtual laser: rays intersect the first surface in the obstacle field.');cyl(sensor,.35,.25,[0,0,0],'dark');cyl(sensor,.28,.07,[0,.18,0],'silver');ring(sensor,.355,.025,[0,.03,0],'cyan','y',true);box(sensor,[.15,.07,.035],[0,.02,.36],'black');
  const rgb=part('rgb','Stereo-style RGB camera',root,[0,1.36,.3],[0,.3,.55],'A paired camera enclosure illustrates how optical measurements originate from a calibrated viewpoint. Geometry-derived labels are not learned recognition.','Aluminum housing · optical glass');box(rgb,[.74,.24,.3],[0,0,0],'dark');for(const s of [-1,1]){cyl(rgb,.085,.05,[s*.22,0,.17],'silver','z');cyl(rgb,.064,.06,[s*.22,0,.19],'cyan','z');ring(rgb,.063,.009,[s*.22,0,.225],'cyan','z',true);}
  const depth=part('depth','Depth projector & receiver',root,[-.4,.92,.05],[-.55,.1,.25],'A stylized depth grid casts sample rays across a field of view and maps returned distances to color.');box(depth,[.35,.24,.25],[0,0,0],'white');cyl(depth,.065,.03,[0,0,.14],'violet','z',true);
  const ultra=part('ultrasonic','Ultrasonic transducer pair',root,[.42,.85,.12],[.6,.1,.25],'Two transducers illustrate directional echo ranging. A straight ray approximates the acoustic beam.');box(ultra,[.4,.2,.18],[0,0,0],'dark');for(const s of [-1,1]){cyl(ultra,.068,.055,[s*.1,0,.12],'silver','z');ring(ultra,.045,.008,[s*.1,0,.152],'dark');}
  const imu=part('imu','Inertial measurement unit',root,[-.36,.45,.28],[-.5,-.05,.4],'Orientation demonstration: roll and pitch are known simulation values rather than estimates from noisy inertial measurements.','PCB substrate · MEMS package');box(imu,[.28,.07,.23],[0,0,0],'dark');box(imu,[.1,.04,.1],[0,.06,0],'violet');for(const x of [-.09,.09])for(let z=0;z<4;z++)box(imu,[.035,.025,.022],[x,.055,(z-1.5)*.04],'silver');
  const force=part('force','Six-axis force / torque interface',root,[.4,.42,-.2],[.55,-.02,-.35],'The live force visualization uses a linear spring model F = kx with a fixed moment arm. It does not compute full rigid-body contact.');cyl(force,.17,.16,[0,0,0],'silver');ring(force,.14,.015,[0,.09,0],'orange','y',true);tip=rgb;dimensions=[8,3,8];
 }
 root.updateMatrixWorld(true);
 for(const p of parts)p.group.traverse(o=>{if(o instanceof T.Mesh&&!o.userData.component)o.userData.component=p.id;});
 return {root,parts,joints,tip,wheels,grips,sensor,payload,dimensions,dispose:()=>{geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());brushed.dispose();}};
}
