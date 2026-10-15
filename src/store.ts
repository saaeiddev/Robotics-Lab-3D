import { create } from 'zustand';
import type { RobotId } from './data';
export type V3 = [number,number,number];
export type Telemetry = {position:V3;angles:Record<string,number>;sensor:number;fps:number;path:number;status:string;roll:number;pitch:number;scanAngle:number;route:[number,number][];force:number;torque:number};
type LabState = {
 robot:RobotId; running:boolean; stopped:boolean; demo:string; mode:'manual'|'demo'|'inspect'; speed:number;
 joints:Record<string,number>; selected:string|null; hovered:string|null; hidden:string[]; isolate:string|null;
 exploded:boolean; xray:boolean; labels:boolean; envelope:boolean; sensorsVisible:boolean; autoRotate:boolean; follow:boolean;
 camera:string; cameraVersion:number; resetVersion:number; target:V3; goal:[number,number]; ik:boolean; gripper:number; finger:string;
 sensor:string; obstacle:boolean; drive:[number,number]; telemetry:Telemetry; quality:'auto'|'high'|'low'; notice:string;
 choose:(id:RobotId)=>void; setJoint:(id:string,value:number)=>void; play:(demo?:string)=>void; pause:()=>void; stop:()=>void; emergency:()=>void; reset:()=>void;
 setCamera:(preset:string)=>void; toggle:(key:'exploded'|'xray'|'labels'|'envelope'|'sensorsVisible'|'autoRotate'|'follow')=>void;
};
const initialTelemetry:Telemetry = {position:[0,0,0],angles:{},sensor:0,fps:60,path:0,status:'Ready',roll:0,pitch:0,scanAngle:0,route:[],force:0,torque:0};
const initial = {robot:'humanoid' as RobotId,running:false,stopped:false,demo:'',mode:'manual' as const,speed:1,joints:{},selected:null,hovered:null,hidden:[],isolate:null,exploded:false,xray:false,labels:true,envelope:false,sensorsVisible:true,autoRotate:false,follow:false,camera:'perspective',cameraVersion:0,resetVersion:0,target:[1.5,2,0.6] as V3,goal:[3,-3] as [number,number],ik:false,gripper:0.7,finger:'index',sensor:'lidar',obstacle:false,drive:[0,0] as [number,number],telemetry:initialTelemetry,quality:'auto' as const,notice:'Lab initialized. Select a component to inspect it.'};
export const useLab = create<LabState>((set,get)=>({...initial,
 choose:robot=>set(s=>({...initial,robot,stopped:s.stopped,quality:s.quality,resetVersion:s.resetVersion+1,cameraVersion:s.cameraVersion+1,notice:s.stopped?'Simulation E-stop remains latched. Reset robot to re-arm.':'System online. Drag to orbit · scroll to zoom.'})),
 setJoint:(id,value)=>{if(!get().stopped)set(s=>({joints:{...s.joints,[id]:value},demo:'',mode:'manual',running:false,ik:false}));},
 play:(demo)=>{if(!get().stopped)set(s=>({running:true,demo:demo??(s.demo||({humanoid:'wave',arm:'pick',rover:'navigate',hand:'grasp',sensors:'scan'}[s.robot])),mode:'demo',notice:'Educational motion demonstration running.'}));},
 pause:()=>set({running:false,drive:[0,0],notice:'Simulation paused.'}),
 stop:()=>set({running:false,demo:'',drive:[0,0],notice:'Motion stopped. Current pose retained.'}),
 emergency:()=>set({stopped:true,running:false,drive:[0,0],autoRotate:false,notice:'SIMULATION E-STOP ENGAGED. Reset robot to re-arm controls.'}),
 reset:()=>set(s=>({...initial,robot:s.robot,quality:s.quality,resetVersion:s.resetVersion+1,cameraVersion:s.cameraVersion+1,notice:'Robot reset. Simulation controls re-armed.'})),
 setCamera:camera=>set(s=>({camera,cameraVersion:s.cameraVersion+1})),
 toggle:key=>{if(get().stopped&&['exploded','autoRotate'].includes(key))return;set(s=>({[key]:!s[key]}));},
}));
