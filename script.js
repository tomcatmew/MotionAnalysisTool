// Yifei Chen - University of Tokyo

const clock = new THREE.Clock();

let camera, controls, scene, renderer, gui;
let mixer, skeletonHelper, boneContainer, fname, bvhName;
let mixer_action;
let line;
const loader = new THREE.BVHLoader();
var skeletonHistory = {
  root: [],
  root_line: null,
  root_total_frame: 0,
  leftLeg: [],
}

// fname = "data/LocomotionFlat01_000.bvh";
fname = "data/08_04.bvh";
var settings = {
  message: fname,
  t_scale: 1,
  show_root_path: false,
  pause: false,
};

var params = {
  loadFile: function () {
    var input = document.getElementById("bvhInput");
    input.addEventListener("change", function () {
      var file = input.files[0];
      fname = file.name;
      f_src = URL.createObjectURL(file)
      // update all controllers
      loader.load(f_src, function (result) {
        bvhName.setValue(fname);
        scene.remove(skeletonHelper);
        scene.remove(boneContainer);

        skeletonHelper = new THREE.SkeletonHelper(result.skeleton.bones[0]);
        skeletonHelper.skeleton = result.skeleton; // allow animation mixer to bind to THREE.SkeletonHelper directly

        boneContainer = new THREE.Group();

        boneContainer.add(result.skeleton.bones[0]);
        console.log(result.skeleton.bones.length);
        console.log(boneContainer.children.length);
        // for (var i = 0; i < boneContainer.children.length; i++) {
        boneContainer.scale.set(5, 5, 5);
        // }
        scene.add(skeletonHelper);
        scene.add(boneContainer);
        reset_skeletonHistory();
        // play animation
        mixer = new THREE.AnimationMixer(skeletonHelper);
        mixer_action = mixer.clipAction(result.clip);
        mixer_action.setEffectiveWeight(1.0).play();
        skeletonHistory.root_total_frame = mixer_action.getClip().tracks[0].times.length;
      });
    });
    input.click();
  },
};

function reset_skeletonHistory() {
  skeletonHistory.root = [];
  skeletonHistory.root_line = null;
  skeletonHistory.root_total_frame = 0;
  skeletonHistory.leftLeg = [];
}

function compare_vector(a, b) {
  if (a.x == b.x && a.y == b.y && a.z == b.z) return true;
}

function int(a) {
  return Math.floor(a);
}

function debugJoint() {

  var pos = new THREE.Vector3();
  skeletonHelper.skeleton.bones[0].getWorldPosition(pos);
  // console.log(int(skeletonHistory.root_total_frame / 2))
  if (mixer_action.paused == false) {
    if (skeletonHistory.root.length < int(skeletonHistory.root_total_frame / 2) - 2) {
      skeletonHistory.root.push(pos);
    }
  }
  if (settings.show_root_path) {
    if (skeletonHistory.line) scene.remove(skeletonHistory.line);
    const geometry = new THREE.BufferGeometry().setFromPoints(skeletonHistory.root);
    const material = new THREE.LineBasicMaterial({ color: 0x000000 });
    skeletonHistory.line = new THREE.Line(geometry, material);
    scene.add(skeletonHistory.line);
  }
  else {
    if (skeletonHistory.line) scene.remove(skeletonHistory.line);
  }

  // let j = []
  // let pos = new THREE.Vector3();
  // root = mixer.getRoot();
  // root.getWorldPosition(pos);
  // j.push(pos);
  // console.log(j[0].x);
  // console.log(j[0].y);
  // console.log(j[0].z);
}




loader.load(fname, function (result) {
  skeletonHelper = new THREE.SkeletonHelper(result.skeleton.bones[0]);
  skeletonHelper.skeleton = result.skeleton; // allow animation mixer to bind to THREE.SkeletonHelper directly

  boneContainer = new THREE.Group();
  boneContainer.add(result.skeleton.bones[0]);
  for (var i = 0; i < boneContainer.children.length; i++) {
    boneContainer.scale.set(5, 5, 5);
  }
  scene.add(skeletonHelper);
  scene.add(boneContainer);

  let j = []
  let pos = new THREE.Vector3();
  skeletonHelper.skeleton.bones[0].getWorldPosition(pos);
  j.push(pos);
  console.log(j[0].x);
  console.log(j[0].y);
  console.log(j[0].z);

  // play animation
  mixer = new THREE.AnimationMixer(skeletonHelper);
  // mixer.clipAction(result.clip).setEffectiveWeight(1.0).play();
  mixer_action = mixer.clipAction(result.clip);
  mixer_action.setEffectiveWeight(1.0).play();
  skeletonHistory.root_total_frame = mixer_action.getClip().tracks[0].times.length;
});

function init() {
  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    1,
    1000
  );
  camera.position.set(0, 200, 300);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xeeeeee);

  scene.add(new THREE.GridHelper(400, 10));

  //gui
  gui = new dat.GUI({ width: 400 });
  gui.domElement.id = "gui";
  var bvhLoadUI = gui.add(params, "loadFile").name("Load BVH file 📁");
  bvhName = gui.add(settings, "message").name("File Name");
  gui.add(settings, 'pause').name("Pause").onChange(() => { mixer_action.paused = mixer_action.paused == true ? false : true });
  gui.add(settings, 'show_root_path').name("Show Root Bone Path");
  bvhName.domElement.style.pointerEvents = "none";

  // renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });

  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);

  container = document.getElementById("maincanvas");
  document.body.appendChild(container);
  container.appendChild(renderer.domElement);

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.minDistance = 300;
  controls.maxDistance = 700;

  window.addEventListener("resize", onWindowResize);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}


function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  if (mixer) mixer.update(delta);
  if (skeletonHelper) debugJoint();
  renderer.render(scene, camera);
}


init();
animate();