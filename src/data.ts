export type RobotId = 'humanoid' | 'arm' | 'rover' | 'hand' | 'sensors';
export const ROBOTS = [
 {id:'humanoid',name:'NEXUS H–01',type:'Humanoid robot',tag:'ARTICULATED SYSTEM',description:'Precision in every movement.',detail:'Explore an articulated humanoid, from its cervical gimbal to its ankle actuators.',color:'#355F48',dof:'17',icon:'humanoid'},
 {id:'arm',name:'AXIS R–06',type:'Industrial arm',tag:'MANIPULATION SYSTEM',description:'Six axes. Endless possibilities.',detail:'Operate a serial manipulator, solve position targets and transfer a payload.',color:'#C17443',dof:'6',icon:'arm'},
 {id:'rover',name:'TERRA X–04',type:'Autonomous rover',tag:'MOBILE ROBOTICS',description:'Find a way forward.',detail:'Navigate a changing obstacle field with A* planning and differential steering.',color:'#355F48',dof:'2',icon:'rover'},
 {id:'hand',name:'DEXTER H–05',type:'Robotic hand',tag:'DEXTEROUS MANIPULATION',description:'Engineering a human touch.',detail:'Explore coupled finger joints, tendon drives and a coordinated grasp.',color:'#D8D7CA',dof:'5',icon:'hand'},
 {id:'sensors',name:'SENSE P–06',type:'Sensors & perception',tag:'PERCEPTION SYSTEM',description:'A different way to see.',detail:'Explore six simulated sensors and the measurements that guide robot behavior.',color:'#8F9E51',dof:'6',icon:'sensors'},
] as const;
export const SENSORS = [
 {id:'lidar',name:'LiDAR',unit:'m',description:'A rotating laser samples the distance to the first surface along each ray. This simulator raycasts against the obstacle geometry; it does not model reflectivity or noise.'},
 {id:'rgb',name:'RGB camera',unit:'RGB',description:'A pinhole-style camera view conveys visible color and object boundaries. The projected boxes use known scene geometry; no recognition model is running.'},
 {id:'depth',name:'Depth sensor',unit:'m',description:'Depth encodes distance along viewing rays. Near returns appear yellow-green; farther returns shift toward deep green. These values come from virtual geometry.'},
 {id:'ultrasonic',name:'Ultrasonic',unit:'m',description:'A simplified directional range measurement estimates echo flight time using t = 2d / 343 at approximately 20°C. Beam spread and multipath are omitted.'},
 {id:'imu',name:'IMU',unit:'°',description:'An IMU combines angular-rate and acceleration measurements. Here the displayed roll and pitch are derived from a simulated orientation, without drift or sensor fusion.'},
 {id:'force',name:'Force / torque',unit:'N',description:'A virtual compliant probe produces a Hooke-law force, F = kx. Torque is the force multiplied by its perpendicular lever arm. This is an illustrative contact model.'},
] as const;
export const PIPELINE = [
 ['Sensors','Measure the world','Cameras, rangefinders and encoders turn physical conditions into observations.','lidar'],
 ['Perception','Interpret observations','Estimate obstacles, pose and object identity. Our demo uses geometric truth, not a trained vision model.','rgb'],
 ['Planning','Choose an action','A* searches a grid for a short collision-free path. Changing an obstacle triggers a new route.','rover'],
 ['Control','Track the plan','A steering controller reduces heading error and advances the rover toward the next waypoint.','arm'],
 ['Actuators','Create movement','Motors convert electrical energy into mechanical torque at a joint or wheel.','hand'],
 ['Feedback','Close the loop','Updated pose and obstacle information inform the next planning and control cycle.','imu'],
] as const;
export const INTELLIGENCE = [
 ['Computer vision','Inspect a virtual camera projection and depth returns. In real robots, vision estimates scene structure from image measurements.'],
 ['Object recognition','Toggle the obstacle to change the known-object boxes. Our labels come from scene metadata, not a neural classifier.'],
 ['Motion planning','Move the target and watch A* search a grid with obstacle clearance. Paths are replanned when the environment changes.'],
 ['Reinforcement learning','A one-step policy teaching example: compare candidate actions by progress reward minus collision penalty. No training or learned policy is claimed.'],
 ['Autonomous navigation','A geometric controller turns toward waypoints, advances, and stops at the goal. Change the obstacle while it runs.'],
 ['Human–robot interaction','People provide goals, monitor state and retain control. Wave and handshake routines illustrate commanded robot responses.'],
];
export const ACADEMY = [
 ['Robotics','A robot combines sensing, computation and actuation to interact with its environment. Robotics connects mechanics, electronics and software.','humanoid'],
 ['How robots work','Sense → estimate → plan → control → act. Feedback repeats this loop as the world changes. Open Intelligence to change an obstacle during navigation.','rover'],
 ['Actuators','An actuator converts energy into motion. Electric drives are common; pneumatic and hydraulic actuators trade precision, force and infrastructure differently.','arm'],
 ['Motors & servos','A servomechanism uses feedback to regulate position or speed. A motor, transmission, encoder and controller can form one servo axis.','arm'],
 ['Joints & degrees of freedom','Each independent joint coordinate contributes a degree of freedom. Revolute joints rotate; prismatic joints translate. AXIS has six revolute joints.','arm'],
 ['Forward kinematics','Forward kinematics composes transformations from the base to the tool. Moving a parent joint changes every descendant, including the end effector.','arm'],
 ['Inverse kinematics','Inverse kinematics searches joint angles for a desired tool pose. Our iterative solver targets position only; wrist orientation and obstacle avoidance are unconstrained.','arm'],
 ['Sensors & feedback','Measurements reduce uncertainty about the robot and its surroundings. Real sensors introduce latency, calibration error, noise and limited field of view.','sensors'],
 ['Control systems','Closed-loop control compares a measured state with a desired state. A controller turns the error into a command. Stability depends on system dynamics and tuning.','rover'],
 ['Robotics & machine learning','Learning can support perception, prediction and policies. Many robot behaviors also use classical geometry, search and feedback without machine learning.','sensors'],
 ['Industrial automation','Manipulators repeat tasks such as assembly, inspection and handling. Real cells require risk assessment, guarded workspaces and certified protective systems.','arm'],
 ['Medical robotics','Robots can assist surgery, rehabilitation and diagnostics. Clinical systems require validation and professional oversight; this lab is educational.','hand'],
 ['Autonomous vehicles','Navigation combines localization, mapping, prediction, planning and control. Our rover assumes a known map and exact pose on a flat surface.','rover'],
 ['Space robotics','Rovers and manipulators extend exploration. Delays, limited energy, terrain uncertainty and harsh environments demand robust autonomy.','rover'],
 ['Humanoid robotics','Human-like morphology offers reach and mobility in human spaces. Balance, contact forces and whole-body control are difficult; the motions here are kinematic demonstrations.','humanoid'],
] as const;
