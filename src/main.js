import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import './style.css';


// 1. CREATE THE SCENE

// A scene holds every 3D object, light, and helper.
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111827);

// The camera determines what the user sees.
// Arguments: field of view, aspect ratio, near plane, far plane.
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

camera.position.set(8, 6, 10);

// The renderer draws the 3D scene onto the screen
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

// 2. CAMERA CONTROLS

// OrbitControls lets us rotate, pan, and zoom.
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;


 
 // OBJECT SELECTION SETUP
 

 // A raycaster helps us detect which 3D object the user clicks on.
 // Imagine shooting an invisible line from the camera through the mouse position.
 // If that line hits a sphere, we can select it.
 const raycaster = new THREE.Raycaster();

 // Store the mouse position in normalized coordinates.
 // THREE.Vector2 has two components: x and y.
 // The mouse coordinates will range from -1 to +1.
 const mouse = new THREE.Vector2();

 // Remember which sphere is currently selected.
 // null means no sphere is selected.
 let selectedObject = null;


// 3. LIGHTING


// Ambient light illuminates everything softly...
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// Directional light creates stronger illumination!!!
const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
directionalLight.position.set(5, 10, 7);
scene.add(directionalLight);


// 4. GROUND AND GRID


// The ground is a flat plane.
const groundGeometry = new THREE.PlaneGeometry(30, 30);
const groundMaterial = new THREE.MeshStandardMaterial({
  color: 0x263244,
  side: THREE.DoubleSide
});

const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.05;
scene.add(ground);

// The grid helps visualize positions in 3D space.
const grid = new THREE.GridHelper(30, 30);
scene.add(grid);


// 5. SIMULATION OBJECT CLASS


// A class lets us create many objects that share
// the same properties and behavior.
class SimulationObject {
  constructor(position, color = 0x38bdf8) {
    // Each object is represented by a sphere.
    this.geometry = new THREE.SphereGeometry(0.5, 24, 24);

    this.material = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.4
    });
    
 // Save the sphere's original color.
 // We will use this when the sphere is deselected.
 this.originalColor = this.material.color.clone();


    this.mesh = new THREE.Mesh(this.geometry, this.material);

    // Copy the starting position into the mesh.
    this.mesh.position.copy(position);

    // Each object gets its own velocity vector.
    // Velocity controls the direction and speed of movement.
    this.velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 4,
      0,
      (Math.random() - 0.5) * 4
    );

    this.radius = 0.5;

    scene.add(this.mesh);
  }

  // Updates the object's position using velocity.
  update(deltaTime) {
    // Formula: new position = old position + velocity * time
    this.mesh.position.addScaledVector(this.velocity, deltaTime);

    // Bounce when touching the simulation boundaries.
    const boundary = 10;

    if (this.mesh.position.x > boundary - this.radius) {
      this.mesh.position.x = boundary - this.radius;
      this.velocity.x *= -1;
    }

    if (this.mesh.position.x < -boundary + this.radius) {
      this.mesh.position.x = -boundary + this.radius;
      this.velocity.x *= -1;
    }

    if (this.mesh.position.z > boundary - this.radius) {
      this.mesh.position.z = boundary - this.radius;
      this.velocity.z *= -1;
    }

    if (this.mesh.position.z < -boundary + this.radius) {
      this.mesh.position.z = -boundary + this.radius;
      this.velocity.z *= -1;
    }
  }

  // Remove the object and release its graphics resources.
  destroy() {
    scene.remove(this.mesh);
    this.geometry.dispose();
    this.material.dispose();
  }
}


// 6. MANAGE SIMULATION OBJECTS


// This array stores all active objects.
const objects = [];

function addObject() {
  const position = new THREE.Vector3(
    (Math.random() - 0.5) * 12,
    0.5,
    (Math.random() - 0.5) * 12
  );

  const color = new THREE.Color().setHSL(
    Math.random(),
    0.75,
    0.55
  );

  const object = new SimulationObject(position, color);
  objects.push(object);
}

// Add five objects when the simulation starts.
for (let i = 0; i < 5; i++) {
  addObject();
}


// 7. COLLISION DETECTION


// Check every unique pair of objects.
function checkCollisions() {
  for (let i = 0; i < objects.length; i++) {
    for (let j = i + 1; j < objects.length; j++) {
      const a = objects[i];
      const b = objects[j];

      // Distance between sphere centers.
      const distance = a.mesh.position.distanceTo(
        b.mesh.position
      );

      // Spheres collide when their centers are closer
      // than the sum of their radii.
      if (distance < a.radius + b.radius) {
        // Simple collision response:
        // exchange velocities between the objects.
        // This is a visual approximation, not an
        // accurate elastic collision solver.
        const oldVelocity = a.velocity.clone();
        a.velocity.copy(b.velocity);
        b.velocity.copy(oldVelocity);
      }
    }
  }
}


 // CONTROL PANEL
 

 // This variable tells us if the simulation is paused.
 // false = running, true = paused.
 let isPaused = false;

 // This controls how fast the spheres move.
 // 1 means normal speed.
 let simulationSpeed = 1;

 // Create an HTML container for our control panel.
 const panel = document.createElement('div');

 // Give it a name so we can style it later in CSS.
 panel.className = 'control-panel';

 // Add the title, buttons, and slider inside the panel.
 panel.innerHTML = `
   <h2>Simulation Controls</h2>
   <p>3D Particle Sandbox</p>

   <button id="add-btn">+ Add Sphere</button>
   <button id="remove-btn">- Remove Sphere</button>

   <button id="pause-btn">Pause Simulation</button>

   <p>Simulation Speed: <span id="speed-value">1.0x</span></p>

   <input
     type="range"
     id="speed-slider"
     min="0.1"
     max="3"
     step="0.1"
     value="1"
   />

   <p>Active Spheres: <span id="object-count">5</span></p>
 `;

 // Put the panel onto our webpage.
 document.body.appendChild(panel);

 
 // OBJECT INSPECTOR


 // Create a new HTML container.
 // This will display information about
 // whichever sphere the user selects.
 const inspector = document.createElement('div');

 // Give it a class so we can style it in CSS.
 inspector.className = 'object-inspector';

 // Add the information we want to display.
 inspector.innerHTML = `
   <h2>Object Inspector</h2>

   <p id="selected-label">No sphere selected</p>

   <h3>Position (x, y, z)</h3>
   <p id="position-info">—</p>

   <h3>Velocity (x, y, z)</h3>
   <p id="velocity-info">—</p>
 `;

 // Add the inspector to the webpage.
 document.body.appendChild(inspector);


 

 // ADD SPHERE BUTTON
 

 // Find the Add Sphere button using its ID.
 const addButton = document.getElementById('add-btn');

 // Listen for a click on the button.
 addButton.addEventListener('click', () => {

   // Call our existing function to create a sphere.
   addObject();

   // Update the number of spheres displayed.
   document.getElementById('object-count').textContent = objects.length;

 });



 // REMOVE SPHERE BUTTON
 

 // Find the Remove Sphere button.
 const removeButton = document.getElementById('remove-btn');

 // Listen for a click on the Remove button.
 removeButton.addEventListener('click', () => {

   // Only remove a sphere if at least one exists.
   if (objects.length > 0) {

     // Remove the last sphere from our array.
     const object = objects.pop();

     
 // If the sphere being removed is also
 // the currently selected sphere...
 if (selectedObject === object) {

   // Clear the selection.
   selectedObject = null;

   // Reset the Object Inspector.
   document.getElementById('selected-label').textContent =
     'No sphere selected';

   document.getElementById('position-info').textContent = '—';

   document.getElementById('velocity-info').textContent = '—';
 }


     // Remove its 3D mesh from the scene
     // and free its graphics resources.
     object.destroy();

     // Update the displayed number of spheres.
     document.getElementById('object-count').textContent = objects.length;
   }

 });


 
 
 // PAUSE/RESUME BUTTON


 // Find the Pause Simulation button.
 const pauseButton = document.getElementById('pause-btn');

 // Listen for a click on the button.
 pauseButton.addEventListener('click', () => {

   // Switch between true and false.
   // If running, pause it.
   // If paused, resume it.
   isPaused = !isPaused;

   // Update the button's text.
   if (isPaused) {
     pauseButton.textContent = 'Resume Simulation';
   } else {
     pauseButton.textContent = 'Pause Simulation';
   }

 });

 
 
 // SIMULATION SPEED SLIDER
 

 // Find the speed slider in our control panel.
 const speedSlider = document.getElementById('speed-slider');

 // Find the text that displays the current speed.
 const speedValue = document.getElementById('speed-value');

 // Listen for changes when we move the slider.
 speedSlider.addEventListener('input', () => {

   // Read the slider's value and convert it to a number.
   simulationSpeed = Number(speedSlider.value);

   // Display the speed with one decimal place.
   // Example: 1.5x or 2.0x
   speedValue.textContent = simulationSpeed.toFixed(1) + 'x';

 });


 
 // SPHERE SELECTION
 

 // Listen for clicks on the 3D canvas.
 renderer.domElement.addEventListener('click', (event) => {

   // Get the canvas position and size.
   const rect = renderer.domElement.getBoundingClientRect();

   // Convert the mouse position to normalized coordinates.
   // Three.js uses values from -1 to +1.
   mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
   mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

   // Create an invisible ray from the camera
   // through the mouse position.
   raycaster.setFromCamera(mouse, camera);

   // Collect the meshes of all our spheres.
   const sphereMeshes = objects.map(object => object.mesh);

   // Find which spheres the ray intersects.
   // Results are ordered by distance from the camera.
   const intersects = raycaster.intersectObjects(sphereMeshes);

   
 // If another sphere was previously selected,
 // restore its original color before selecting a new one.
 if (selectedObject) {
   selectedObject.mesh.material.color.copy(
     selectedObject.originalColor
   );
 }

   // Check whether the user clicked a sphere.
   if (intersects.length > 0) {

     // The first intersection is the closest sphere.
     const clickedMesh = intersects[0].object;

     // Find the SimulationObject that owns this mesh.
     selectedObject = objects.find(
       object => object.mesh === clickedMesh
     );

     
 // Change the selected sphere to bright yellow.
 selectedObject.mesh.material.color.set(0xffff00);

 
 
 // DISPLAY SELECTED SPHERE INFORMATION
 

 // Update the inspector's label.
 document.getElementById('selected-label').textContent =
   'Sphere Selected';

 // Get the selected sphere's position.
 const position = selectedObject.mesh.position;

 // Get the selected sphere's velocity.
 const velocity = selectedObject.velocity;

 // Display the position as (x, y, z).
 document.getElementById('position-info').textContent =
   `X: ${position.x.toFixed(2)} | Y: ${position.y.toFixed(2)} | Z: ${position.z.toFixed(2)}`;

 // Display the velocity as (x, y, z).
 document.getElementById('velocity-info').textContent =
   `X: ${velocity.x.toFixed(2)} | Y: ${velocity.y.toFixed(2)} | Z: ${velocity.z.toFixed(2)}`;



     // Print the selected sphere's information.
     console.log('Selected sphere:', selectedObject);
     console.log('Position:', selectedObject.mesh.position);
     console.log('Velocity:', selectedObject.velocity);

   
} else {

  // If the user clicks empty space,
  // clear the selection.
  selectedObject = null;

  console.log('No sphere selected.');

  // Clear the inspector ONLY when
  // no sphere was clicked.
  document.getElementById('selected-label').textContent =
    'No sphere selected';

  document.getElementById('position-info').textContent = '—';

  document.getElementById('velocity-info').textContent = '—';
}


 });



// 8. KEYBOARD CONTROLS
 

 window.addEventListener('keydown', (event) => {

   // Don't trigger shortcuts while typing in an input.
   // This prevents pressing A or R inside an input
   // from accidentally adding or removing a sphere.
   if (event.target.matches('input, textarea, select')) {
     return;
   }

   // Press A to add a sphere.
   if (event.key.toLowerCase() === 'a') {

     // Create a sphere.
     addObject();

     // Update the counter.
     document.getElementById('object-count').textContent =
       objects.length;
   }

   // Press R to remove the most recent sphere.
   if (event.key.toLowerCase() === 'r' && objects.length > 0) {

     // Remove the last sphere from the array.
     const object = objects.pop();

     // If we're removing the selected sphere,
     // clear the selection and inspector.
     if (selectedObject === object) {

       selectedObject = null;

       document.getElementById('selected-label').textContent =
         'No sphere selected';

       document.getElementById('position-info').textContent = '—';

       document.getElementById('velocity-info').textContent = '—';
     }

     // Remove the sphere from the scene
     // and release its graphics resources.
     object.destroy();

     // Update the counter.
     document.getElementById('object-count').textContent =
       objects.length;
   }

 });



// 9. ANIMATION LOOP


// THREE.Clock helps measure elapsed time between frames.
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  // Delta time makes movement less dependent on FPS.
  const deltaTime = Math.min(clock.getDelta(), 0.05);

  
// Only move spheres when the simulation is running.
if (!isPaused) {

  // Update each sphere's position.
  for (const object of objects) {
    object.update(deltaTime * simulationSpeed);
  }

  // Check for collisions between spheres.
  checkCollisions();

}

  // Smoothly update the camera.
  controls.update();

  
 
 // LIVE OBJECT INSPECTOR


 // Check whether a sphere is currently selected
 // and still exists in our simulation.
 if (selectedObject && objects.includes(selectedObject)) {

   // Get its current position and velocity.
   const position = selectedObject.mesh.position;
   const velocity = selectedObject.velocity;

   // Update the position displayed on screen.
   document.getElementById('position-info').textContent =
     `X: ${position.x.toFixed(2)} | Y: ${position.y.toFixed(2)} | Z: ${position.z.toFixed(2)}`;

   // Update the velocity displayed on screen.
   document.getElementById('velocity-info').textContent =
     `X: ${velocity.x.toFixed(2)} | Y: ${velocity.y.toFixed(2)} | Z: ${velocity.z.toFixed(2)}`;

 }


  // Draw the updated scene.
  renderer.render(scene, camera);
}

animate();


// 10. HANDLE WINDOW RESIZING


window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
});
