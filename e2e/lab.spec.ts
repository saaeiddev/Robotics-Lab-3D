import {test,expect} from '@playwright/test';
const errors:string[]=[];
test.beforeEach(async({page})=>{errors.length=0;page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});await page.goto('./');await expect(page.locator('canvas')).toBeVisible();await expect(page.getByText('INITIALIZING ROBOTICS ENGINE…')).not.toBeVisible();});
test.afterEach(()=>expect(errors).toEqual([]));
test('five robot systems render with a valid WebGL context',async({page})=>{
 for(const [id,name,title] of [['humanoid','Humanoid robot','NEXUS H–01'],['arm','Industrial arm','AXIS R–06'],['rover','Autonomous rover','TERRA X–04'],['hand','Robotic hand','DEXTER H–05'],['sensors','Sensors & perception','SENSE P–06']]){
  await page.getByRole('button',{name:new RegExp(name)}).click();await expect(page.getByRole('heading',{level:2,name:new RegExp(title)})).toBeVisible();
  await expect(page.locator('canvas')).toBeVisible();await expect(page.locator('.fallback')).toHaveCount(0);
  await expect.poll(()=>page.locator('canvas').evaluate(c=>Boolean((c as HTMLCanvasElement).getContext('webgl2')))).toBe(true);
  await page.screenshot({path:`test-results/${id}-desktop.png`});
 }
});
test('humanoid motion, E-stop and reset',async({page})=>{
 await page.getByRole('button',{name:'Wave',exact:true}).click();const joint=page.getByRole('slider',{name:'right elbow flexion',exact:true});
 // The initial condensed joint list contains neck, shoulder roll, shoulder and elbow.
 await expect.poll(()=>joint.inputValue()).not.toBe('-12');
 await page.getByRole('button',{name:/EMERGENCY STOP/}).click();await expect(page.getByLabel('Start simulation')).toBeDisabled();
 const pose=await page.locator('.joint-controls input').evaluateAll(inputs=>inputs.map(i=>(i as HTMLInputElement).value));
 await page.getByRole('button',{name:'Camera',exact:true}).click();await page.getByRole('button',{name:'side view'}).click();
 expect(await page.locator('.joint-controls input').evaluateAll(inputs=>inputs.map(i=>(i as HTMLInputElement).value))).toEqual(pose);
 await page.getByLabel('Reset robot',{exact:true}).click();await expect(page.getByLabel('Start simulation')).toBeEnabled();
});
test('arm slider, IK and component inspection',async({page})=>{
 await page.getByRole('button',{name:/Industrial arm/}).click();const joint=page.getByRole('slider',{name:'J1 · Base yaw',exact:true});await joint.fill('50');await expect(joint).toHaveValue('50');
 await page.getByRole('button',{name:'Inverse kinematics'}).click();await page.getByRole('slider',{name:'Target Y',exact:true}).fill('2.5');
 await expect(page.getByRole('slider',{name:'Target Y',exact:true})).toHaveValue('2.5');
 await page.getByLabel('Select component',{exact:true}).selectOption('link2');await expect(page.getByRole('heading',{name:'J3 · Elbow pitch',exact:true})).toBeVisible();
 await page.getByLabel('Hide component',{exact:true}).click();await expect(page.getByLabel('Show component',{exact:true})).toBeVisible();
 await page.getByLabel('Restore assembly visibility',{exact:true}).click();
 await page.getByRole('button',{name:'Exploded view',exact:true}).click();await expect(page.getByLabel('Start simulation')).toBeDisabled();await page.screenshot({path:'test-results/arm-exploded.png'});
});
test('rover routes, hand grasp and six sensors',async({page})=>{
 await page.getByRole('button',{name:/Autonomous rover/}).click();await page.getByRole('button',{name:'Navigate to waypoint'}).click();await expect(page.locator('.telemetry-status')).toHaveText('Following A* path');
 await page.getByRole('button',{name:'Extra obstacle'}).click();await page.getByRole('button',{name:/Robotic hand/}).click();await page.getByRole('button',{name:'Close hand',exact:true}).click();await expect(page.getByRole('slider',{name:'Finger flexion',exact:true})).toHaveValue('78');
 await page.getByRole('button',{name:'Open hand',exact:true}).click();await expect(page.getByRole('slider',{name:'Finger flexion',exact:true})).toHaveValue('0');
 await page.getByRole('button',{name:/Sensors & perception/}).click();await page.getByRole('button',{name:'Start sensor stream'}).click();
 for(const name of ['LiDAR','RGB camera','Depth sensor','Ultrasonic','IMU','Force / torque']){await page.locator('.sensor-options').getByRole('button',{name:new RegExp(name+'$')}).click();await expect(page.locator('.sensor-readout')).toBeVisible();await expect(page.locator('.fallback')).toHaveCount(0);}
 await page.screenshot({path:'test-results/sensor-stream.png'});
});
test('navigation, lessons, intelligence and camera controls',async({page})=>{
 await page.getByRole('button',{name:'Robotics Academy',exact:true}).click();await page.getByRole('button',{name:/Forward kinematics/}).click();await expect(page.getByRole('heading',{name:'Forward kinematics',exact:true})).toBeVisible();await page.getByRole('button',{name:'Try it in the laboratory'}).click();
 await page.getByRole('button',{name:'Intelligence',exact:true}).click();await page.getByRole('button',{name:'Run robot'}).click();await page.getByRole('button',{name:'Add obstacle'}).click();await expect(page.getByRole('button',{name:'Remove obstacle'})).toBeVisible();await page.screenshot({path:'test-results/intelligence.png'});
 await page.getByLabel('Close panel',{exact:true}).click();await page.getByRole('button',{name:'Camera',exact:true}).click();await page.getByRole('button',{name:'top view'}).click();await page.getByLabel('Fit robot to screen',{exact:true}).click();
 const canvas=page.locator('canvas'),box=await canvas.boundingBox();if(box){await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width/2+70,box.y+box.height/2+30,{steps:8});await page.mouse.up();await page.mouse.wheel(0,-100);}await expect(page.locator('.fallback')).toHaveCount(0);
});
test.describe('Mobile viewport',()=>{
 test.use({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 test('drawers, robot selection and emergency control remain usable',async({page})=>{
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true);
  await page.screenshot({path:'test-results/humanoid-mobile.png',fullPage:true});
  await page.getByRole('button',{name:'Controls',exact:true}).click();await page.getByRole('button',{name:/Robotic hand/}).click();await expect(page.locator('.left-panel')).not.toBeVisible();
  await page.getByRole('button',{name:'Inspector',exact:true}).click();await page.getByLabel('Select component',{exact:true}).selectOption('palm');await expect(page.getByRole('heading',{name:'Metacarpal frame'})).toBeVisible();await page.getByLabel('Close inspector',{exact:true}).click();
  await page.getByRole('button',{name:'E-Stop',exact:true}).click();await expect(page.getByLabel('Start simulation')).toBeDisabled();await page.getByLabel('Reset robot',{exact:true}).click();await page.screenshot({path:'test-results/hand-mobile.png',fullPage:true});
 });
});
