import { Bot, Hand, Radar, Truck, Workflow } from 'lucide-react';
import type { RobotId } from '../data';
export function SystemIcon({id,size=21}:{id:RobotId;size?:number}){const Icon={humanoid:Bot,arm:Workflow,rover:Truck,hand:Hand,sensors:Radar}[id];return <Icon size={size} strokeWidth={1.45}/>;}
export function Mark(){return <svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><path d="m24 3 18 10v22L24 45 6 35V13Z" stroke="currentColor" strokeWidth="1.4"/><path d="M14 31V17l20 14V17M14 13l20 22" stroke="currentColor" strokeWidth="2.2"/><path d="m24 3 5 3m13 7v7M6 28v7l6 3" stroke="#F5F9FF" strokeWidth="2.5"/></svg>;}
