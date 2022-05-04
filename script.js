// Yifei Chen - University of Tokyo

const clock = new THREE.Clock();

let camera, controls, scene, renderer, gui;
let mixer, mixerFBX, skeletonHelper, boneContainer, fname, bvhName;
let currentVrm = undefined;
let mixer_action;
let line;
const loader = new THREE.BVHLoader();
let cube = undefined;
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
        boneContainer.scale.set(0.06, 0.06, 0.06);
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

function delay(time) {
  return new Promise(resolve => setTimeout(resolve, time));
}


function reset_skeletonHistory() {
  skeletonHistory.root = [];
  skeletonHistory.root_line = null;
  skeletonHistory.root_total_frame = 0;
  skeletonHistory.leftLeg = [];
}

function compare_vector(a, b) {
  if (a.distanceTo(b) > 0.05)
    return true;
  else
    return false;
}

function int(a) {
  return Math.floor(a);
}

function debugJoint() {

  var pos = new THREE.Vector3();
  skeletonHelper.skeleton.bones[0].getWorldPosition(pos);
  // console.log(int(skeletonHistory.root_total_frame / 2))
  // console.log(skeletonHistory.root.length);
  // console.log(skeletonHistory.root_total_frame);
  if (mixer_action.paused == false) {
    if (skeletonHistory.root.length < int(skeletonHistory.root_total_frame / 2) - 1) {
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
    boneContainer.scale.set(0.06, 0.06, 0.06);
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


init();
animate();

function init() {
  camera = new THREE.PerspectiveCamera(
    30,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 1.0, 5.0);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xeeeeee);

  scene.add(new THREE.GridHelper(10, 10));
  scene.add(new THREE.AxesHelper(5));

  //gui
  gui = new dat.GUI({ width: 400 });
  gui.domElement.id = "gui";
  var bvhLoadUI = gui.add(params, "loadFile").name("Load BVH file 📁");
  bvhName = gui.add(settings, "message").name("File Name");
  gui.add(settings, 'pause').name("Pause").onChange(() => { mixer_action.paused = mixer_action.paused == true ? false : true });
  gui.add(settings, 'show_root_path').name("Show Root Bone Path");
  bvhName.domElement.style.pointerEvents = "none";

  // light
  const light = new THREE.DirectionalLight(0xffffff, 1.3);
  light.position.set(0.0, 1.0, 4.0).normalize();
  scene.add(light);

  const lightback = new THREE.DirectionalLight(0xffffff, .8);
  lightback.position.set(0.0, 0.5, -4.0).normalize();
  scene.add(lightback);

  const lightbot = new THREE.DirectionalLight(0xcf411f, .6);
  lightbot.position.set(0.0, -1.0, 0.2).normalize();
  scene.add(lightbot);
  // // gltf and vrm
  // const loader_vrm = new THREE.GLTFLoader();
  // loader_vrm.crossOrigin = 'anonymous';
  // loader_vrm.load(

  //   // URL of the VRM you want to load
  //   './models/three-vrm-girl.vrm',

  //   // called when the resource is loaded
  //   (gltf) => {

  //     // calling these functions greatly improves the performance
  //     THREE.VRMUtils.removeUnnecessaryVertices(gltf.scene);
  //     THREE.VRMUtils.removeUnnecessaryJoints(gltf.scene);

  //     // generate VRM instance from gltf
  //     THREE.VRM.from(gltf).then((vrm) => {

  //       console.log(vrm);
  //       scene.add(vrm.scene);
  //       currentVrm = vrm;
  //       vrm.humanoid.getBoneNode(THREE.VRMSchema.HumanoidBoneName.Hips).rotation.y = Math.PI;
  //       vrm.springBoneManager.reset();

  //     });

  //   },
  //   // called while loading is progressing
  //   (progress) => console.log('Loading model...', 100.0 * (progress.loaded / progress.total), '%'),

  //   // called when loading has errors
  //   (error) => console.error(error)

  // );

  // FBX loader
  const loaderFBX = new THREE.FBXLoader();
  loaderFBX.load('data/animation/Walking60.fbx', function (object) {

    mixerFBX = new THREE.AnimationMixer(object);

    const action = mixerFBX.clipAction(object.animations[0]);
    action.play();

    object.traverse(function (child) {

      if (child.isMesh) {

        child.castShadow = true;
        child.receiveShadow = true;

      }

    });
    object.scale.set(3.0, 3.0, 3.0);
    scene.add(object);

  });
  // FBX loader


  // renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });

  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);

  container = document.getElementById("maincanvas");
  document.body.appendChild(container);
  container.appendChild(renderer.domElement);

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.screenSpacePanning = true;
  controls.target.set(0.0, 1.0, 0.0);
  controls.minDistance = 5;
  controls.maxDistance = 700;
  controls.update();

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
  if (mixerFBX) mixerFBX.update(delta);
  renderer.render(scene, camera);
  if (skeletonHelper) debugJoint();
}





// function animeRetarget() {

//   // var rootPos = new THREE.Vector3();
//   // skeletonHelper.skeleton.bones[0].getWorldPosition(rootPos);
//   // // var rootPos = skeletonHelper.skeleton.bones[0].position;
//   // var rootRot = new THREE.Quaternion();
//   // skeletonHelper.skeleton.bones[0].getWorldQuaternion(rootRot);
//   // // var rootRot = skeletonHelper.skeleton.bones[0].rotation;
//   // // var vrmHip = currentVrm.humanoid.getBoneNode(THREE.VRMSchema.HumanoidBoneName.Hips);
//   // // console.log(rootPos);
//   // // console.log(rootRot);
//   // currentVrm.humanoid.getBoneNode(THREE.VRMSchema.HumanoidBoneName.Hips).position.set(rootPos.x, rootPos.y, rootPos.z);
//   // currentVrm.humanoid.getBoneNode(THREE.VRMSchema.HumanoidBoneName.Hips).setRotationFromQuaternion(rootRot);
//   // currentVrm.humanoid.getBoneNode(THREE.VRMSchema.HumanoidBoneName.Hips).rotateY(Math.PI);

//   // var LeftUpperLegRot = new THREE.Quaternion();
//   // skeletonHelper.skeleton.bones[2].getWorldQuaternion(LeftUpperLegRot);
//   // // var LeftUpperLegPos = new THREE.Vector3();
//   // // skeletonHelper.skeleton.bones[2].getWorldPosition(LeftUpperLegPos);
//   // // currentVrm.humanoid.getBoneNode(THREE.VRMSchema.HumanoidBoneName.LeftUpperLeg).position.set(LeftUpperLegPos.x, LeftUpperLegPos.y, LeftUpperLegPos.z);
//   // currentVrm.humanoid.getBoneNode(THREE.VRMSchema.HumanoidBoneName.LeftUpperLeg).setRotationFromQuaternion(LeftUpperLegRot);

//   // var LeftLowerLegRot = new THREE.Quaternion();
//   // skeletonHelper.skeleton.bones[3].getWorldQuaternion(LeftLowerLegRot);
//   // // var LeftLowerLegPos = new THREE.Vector3();
//   // // skeletonHelper.skeleton.bones[3].getWorldPosition(LeftLowerLegPos);
//   // // currentVrm.humanoid.getBoneNode(THREE.VRMSchema.HumanoidBoneName.LeftLowerLeg).position.set(LeftLowerLegPos.x, LeftLowerLegPos.y, LeftLowerLegPos.z);
//   // currentVrm.humanoid.getBoneNode(THREE.VRMSchema.HumanoidBoneName.LeftLowerLeg).setRotationFromQuaternion(LeftLowerLegRot);

//   // var RightUpperLegRot = new THREE.Quaternion();
//   // skeletonHelper.skeleton.bones[8].getWorldQuaternion(RightUpperLegRot);
//   // // RightUpperLegRot = skeletonHelper.skeleton.bones[8].rotation;
//   // // currentVrm.humanoid.getBoneNode(THREE.VRMSchema.HumanoidBoneName.LeftUpperLeg).position.set(rootPos.x, rootPos.y, rootPos.z);
//   // currentVrm.humanoid.getBoneNode(THREE.VRMSchema.HumanoidBoneName.RightUpperLeg).setRotationFromQuaternion(RightUpperLegRot);

//   // var RightLowerLegRot = new THREE.Quaternion();
//   // skeletonHelper.skeleton.bones[9].getWorldQuaternion(RightLowerLegRot);
//   // currentVrm.humanoid.getBoneNode(THREE.VRMSchema.HumanoidBoneName.RightLowerLeg).setRotationFromQuaternion(RightLowerLegRot);

//   // let indexb = 30;
//   // if (cube) {
//   //   scene.remove(cube);
//   //   var rootPosn = new THREE.Vector3();
//   //   skeletonHelper.skeleton.bones[indexb].getWorldPosition(rootPosn);
//   //   const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
//   //   const material = new THREE.MeshBasicMaterial({ color: 0x2b629f });
//   //   cube = new THREE.Mesh(geometry, material);
//   //   cube.position.set(rootPosn.x, rootPosn.y, rootPosn.z);
//   //   scene.add(cube);
//   // }
//   // else {
//   //   var rootPosn = new THREE.Vector3();
//   //   skeletonHelper.skeleton.bones[indexb].getWorldPosition(rootPosn);
//   //   const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
//   //   const material = new THREE.MeshBasicMaterial({ color: 0x2b629f });
//   //   cube = new THREE.Mesh(geometry, material);
//   //   cube.position.set(rootPosn.x, rootPosn.y, rootPosn.z);
//   //   scene.add(cube);
//   // }
// }