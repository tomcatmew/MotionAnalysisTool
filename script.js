// Yifei Chen - University of Tokyo

const clock = new THREE.Clock();

let camera, controls, scene, renderer, gui;
let mixer, mixerFBX, FBXHelper, skeletonHelper, boneContainer, fname, bvhName;
let currentVrm = undefined;
let mixer_action;
let fbx_action;
let line;
let rootVelo, leftUpperLeg_velo, leftLowerLeg_velo, leftFoot_velo, rightUpperLeg_velo,
  rightLowerLeg_velo, rightFoot_velo, leftUpperArm_velo, leftLowerArm_velo, leftHand_velo,
  rightUpperArm_velo, rightLowerArm_velo, rightHand_velo;
const loader = new THREE.BVHLoader();
const loaderFBX = new THREE.FBXLoader();
let cube = undefined;

var skeletonHistory = {
  choose_bone_index: [0, 2, 3, 4, 8, 9, 10, 21, 22, 23, 30, 31, 32],
  arrow_scale: 5,

  root: [],
  root_line: null,
  root_2_points: [],
  root_total_frame: 0,

  leftUpperLeg: [],
  leftUpperLeg_line: null,
  leftUpperLeg_2_points: [],
  leftLowerLeg: [],
  leftLowerLeg_line: null,
  leftLowerLeg_2_points: [],
  leftFoot: [],
  leftFoot_line: null,
  leftFoot_2_points: [],

  rightUpperLeg: [],
  rightUpperLeg_line: null,
  rightUpperLeg_2_points: [],
  rightLowerLeg: [],
  rightLowerLeg_line: null,
  rightLowerLeg_2_points: [],
  rightFoot: [],
  rightFoot_line: null,
  rightFoot_2_points: [],

  leftUpperArm: [],
  leftUpperArm_line: null,
  leftUpperArm_2_points: [],
  leftLowerArm: [],
  leftLowerArm_line: null,
  leftLowerArm_2_points: [],
  leftHand: [],
  leftHand_line: null,
  leftHand_2_points: [],

  rightUpperArm: [],
  rightUpperArm_line: null,
  rightUpperArm_2_points: [],
  rightLowerArm: [],
  rightLowerArm_line: null,
  rightLowerArm_2_points: [],
  rightHand: [],
  rightHand_line: null,
  rightHand_2_points: [],
}

// fname = "data/LocomotionFlat01_000.bvh";
fname = "data/08_04.bvh";
var settings = {
  message: fname,
  t_scale: 1,
  show_root_path: false,
  showBVH: true,
  pause: false,
  scaleBVH: 0.06,
  speedBVH: 1.0,

  skinned_animation_name: "Walking60",
  pauseFBX: false,
  speedFBX: 1.0,
  showFBX: true,
  scaleFBX: 3.0,

  all_vis: false,
  rootVelo_vis: false,
  leftUpperLeg_velo_vis: false,
  leftLowerLeg_velo_vis: false,
  leftFoot_velo_vis: false,
  rightUpperLeg_velo_vis: false,
  rightLowerLeg_velo_vis: false,
  rightFoot_velo_vis: false,
  leftUpperArm_velo_vis: false,
  leftLowerArm_velo_vis: false,
  leftHand_vis: false,
  rightUpperArm_velo_vis: false,
  rightLowerArm_velo_vis: false,
  rightHand_vis: false,

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
        // console.log(result.skeleton.bones.length);
        // console.log(boneContainer.children.length);
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
  skeletonHistory.root_2_points = [];
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

function update_Velo() {
  var all_bone_pos = [];
  skeletonHistory.choose_bone_index.forEach((x, i) => {
    var posRoot = new THREE.Vector3();
    skeletonHelper.skeleton.bones[x].getWorldPosition(posRoot);
    all_bone_pos.push(posRoot);
  });

  all_bone_pos.forEach((newpos, i) => {
    if (i == 0) {
      skeletonHistory.root_2_points.push(newpos);
      if (skeletonHistory.root_2_points.length > 2) {
        skeletonHistory.root_2_points.shift();
        var currFramePos = skeletonHistory.root_2_points[1];
        var lastFramePos = skeletonHistory.root_2_points[0];
        var dir = new THREE.Vector3().subVectors(currFramePos, lastFramePos);
        rootVelo.position.set(currFramePos.x, currFramePos.y, currFramePos.z);
        rootVelo.setDirection(dir);
        rootVelo.setLength(dir.length() * skeletonHistory.arrow_scale);
      }
    }
    if (i == 1) {
      skeletonHistory.leftUpperLeg_2_points.push(newpos);
      if (skeletonHistory.leftUpperLeg_2_points.length > 2) {
        skeletonHistory.leftUpperLeg_2_points.shift();
        var currFramePos = skeletonHistory.leftUpperLeg_2_points[1];
        var lastFramePos = skeletonHistory.leftUpperLeg_2_points[0];
        var dir = new THREE.Vector3().subVectors(currFramePos, lastFramePos);
        leftUpperLeg_velo.position.set(currFramePos.x, currFramePos.y, currFramePos.z);
        leftUpperLeg_velo.setDirection(dir);
        leftUpperLeg_velo.setLength(dir.length() * skeletonHistory.arrow_scale);
      }
    }
    if (i == 2) {
      skeletonHistory.leftLowerLeg_2_points.push(newpos);
      if (skeletonHistory.leftLowerLeg_2_points.length > 2) {
        skeletonHistory.leftLowerLeg_2_points.shift();
        var currFramePos = skeletonHistory.leftLowerLeg_2_points[1];
        var lastFramePos = skeletonHistory.leftLowerLeg_2_points[0];
        var dir = new THREE.Vector3().subVectors(currFramePos, lastFramePos);
        leftLowerLeg_velo.position.set(currFramePos.x, currFramePos.y, currFramePos.z);
        leftLowerLeg_velo.setDirection(dir);
        leftLowerLeg_velo.setLength(dir.length() * skeletonHistory.arrow_scale);
      }
    }
    if (i == 3) {
      skeletonHistory.leftFoot_2_points.push(newpos);
      if (skeletonHistory.leftFoot_2_points.length > 2) {
        skeletonHistory.leftFoot_2_points.shift();
        var currFramePos = skeletonHistory.leftFoot_2_points[1];
        var lastFramePos = skeletonHistory.leftFoot_2_points[0];
        var dir = new THREE.Vector3().subVectors(currFramePos, lastFramePos);
        leftFoot_velo.position.set(currFramePos.x, currFramePos.y, currFramePos.z);
        leftFoot_velo.setDirection(dir);
        leftFoot_velo.setLength(dir.length() * skeletonHistory.arrow_scale);
      }
    }
    if (i == 4) {
      skeletonHistory.rightUpperLeg_2_points.push(newpos);
      if (skeletonHistory.rightUpperLeg_2_points.length > 2) {
        skeletonHistory.rightUpperLeg_2_points.shift();
        var currFramePos = skeletonHistory.rightUpperLeg_2_points[1];
        var lastFramePos = skeletonHistory.rightUpperLeg_2_points[0];
        var dir = new THREE.Vector3().subVectors(currFramePos, lastFramePos);
        rightUpperLeg_velo.position.set(currFramePos.x, currFramePos.y, currFramePos.z);
        rightUpperLeg_velo.setDirection(dir);
        rightUpperLeg_velo.setLength(dir.length() * skeletonHistory.arrow_scale);
      }
    }
    if (i == 5) {
      skeletonHistory.rightLowerLeg_2_points.push(newpos);
      if (skeletonHistory.rightLowerLeg_2_points.length > 2) {
        skeletonHistory.rightLowerLeg_2_points.shift();
        var currFramePos = skeletonHistory.rightLowerLeg_2_points[1];
        var lastFramePos = skeletonHistory.rightLowerLeg_2_points[0];
        var dir = new THREE.Vector3().subVectors(currFramePos, lastFramePos);
        rightLowerLeg_velo.position.set(currFramePos.x, currFramePos.y, currFramePos.z);
        rightLowerLeg_velo.setDirection(dir);
        rightLowerLeg_velo.setLength(dir.length() * skeletonHistory.arrow_scale);
      }
    }
    if (i == 6) {
      skeletonHistory.rightFoot_2_points.push(newpos);
      if (skeletonHistory.rightFoot_2_points.length > 2) {
        skeletonHistory.rightFoot_2_points.shift();
        var currFramePos = skeletonHistory.rightFoot_2_points[1];
        var lastFramePos = skeletonHistory.rightFoot_2_points[0];
        var dir = new THREE.Vector3().subVectors(currFramePos, lastFramePos);
        rightFoot_velo.position.set(currFramePos.x, currFramePos.y, currFramePos.z);
        rightFoot_velo.setDirection(dir);
        rightFoot_velo.setLength(dir.length() * skeletonHistory.arrow_scale);
      }
    }
    if (i == 7) {
      skeletonHistory.leftUpperArm_2_points.push(newpos);
      if (skeletonHistory.leftUpperArm_2_points.length > 2) {
        skeletonHistory.leftUpperArm_2_points.shift();
        var currFramePos = skeletonHistory.leftUpperArm_2_points[1];
        var lastFramePos = skeletonHistory.leftUpperArm_2_points[0];
        var dir = new THREE.Vector3().subVectors(currFramePos, lastFramePos);
        leftUpperArm_velo.position.set(currFramePos.x, currFramePos.y, currFramePos.z);
        leftUpperArm_velo.setDirection(dir);
        leftUpperArm_velo.setLength(dir.length() * skeletonHistory.arrow_scale);
      }
    }
    if (i == 8) {
      skeletonHistory.leftLowerArm_2_points.push(newpos);
      if (skeletonHistory.leftLowerArm_2_points.length > 2) {
        skeletonHistory.leftLowerArm_2_points.shift();
        var currFramePos = skeletonHistory.leftLowerArm_2_points[1];
        var lastFramePos = skeletonHistory.leftLowerArm_2_points[0];
        var dir = new THREE.Vector3().subVectors(currFramePos, lastFramePos);
        leftLowerArm_velo.position.set(currFramePos.x, currFramePos.y, currFramePos.z);
        leftLowerArm_velo.setDirection(dir);
        leftLowerArm_velo.setLength(dir.length() * skeletonHistory.arrow_scale);
      }
    }
    if (i == 9) {
      skeletonHistory.leftHand_2_points.push(newpos);
      if (skeletonHistory.leftHand_2_points.length > 2) {
        skeletonHistory.leftHand_2_points.shift();
        var currFramePos = skeletonHistory.leftHand_2_points[1];
        var lastFramePos = skeletonHistory.leftHand_2_points[0];
        var dir = new THREE.Vector3().subVectors(currFramePos, lastFramePos);
        leftHand_velo.position.set(currFramePos.x, currFramePos.y, currFramePos.z);
        leftHand_velo.setDirection(dir);
        leftHand_velo.setLength(dir.length() * skeletonHistory.arrow_scale);
      }
    }
    if (i == 10) {
      skeletonHistory.rightUpperArm_2_points.push(newpos);
      if (skeletonHistory.rightUpperArm_2_points.length > 2) {
        skeletonHistory.rightUpperArm_2_points.shift();
        var currFramePos = skeletonHistory.rightUpperArm_2_points[1];
        var lastFramePos = skeletonHistory.rightUpperArm_2_points[0];
        var dir = new THREE.Vector3().subVectors(currFramePos, lastFramePos);
        rightUpperArm_velo.position.set(currFramePos.x, currFramePos.y, currFramePos.z);
        rightUpperArm_velo.setDirection(dir);
        rightUpperArm_velo.setLength(dir.length() * skeletonHistory.arrow_scale);
      }
    }
    if (i == 11) {
      skeletonHistory.rightLowerArm_2_points.push(newpos);
      if (skeletonHistory.rightLowerArm_2_points.length > 2) {
        skeletonHistory.rightLowerArm_2_points.shift();
        var currFramePos = skeletonHistory.rightLowerArm_2_points[1];
        var lastFramePos = skeletonHistory.rightLowerArm_2_points[0];
        var dir = new THREE.Vector3().subVectors(currFramePos, lastFramePos);
        rightLowerArm_velo.position.set(currFramePos.x, currFramePos.y, currFramePos.z);
        rightLowerArm_velo.setDirection(dir);
        rightLowerArm_velo.setLength(dir.length() * skeletonHistory.arrow_scale);
      }
    }
    if (i == 12) {
      skeletonHistory.rightHand_2_points.push(newpos);
      if (skeletonHistory.rightHand_2_points.length > 2) {
        skeletonHistory.rightHand_2_points.shift();
        var currFramePos = skeletonHistory.rightHand_2_points[1];
        var lastFramePos = skeletonHistory.rightHand_2_points[0];
        var dir = new THREE.Vector3().subVectors(currFramePos, lastFramePos);
        rightHand_velo.position.set(currFramePos.x, currFramePos.y, currFramePos.z);
        rightHand_velo.setDirection(dir);
        rightHand_velo.setLength(dir.length() * skeletonHistory.arrow_scale);
      }
    }
  });
}

function show_velo() {
  rootVelo.visible = settings.rootVelo_vis;
  leftUpperLeg_velo.visible = settings.leftUpperLeg_velo_vis;
  leftLowerLeg_velo.visible = settings.leftLowerLeg_velo_vis;
  leftFoot_velo.visible = settings.leftFoot_velo_vis;
  rightUpperLeg_velo.visible = settings.rightUpperLeg_velo_vis;
  rightLowerLeg_velo.visible = settings.rightLowerLeg_velo_vis;
  rightFoot_velo.visible = settings.rightFoot_velo_vis;
  leftUpperArm_velo.visible = settings.leftUpperArm_velo_vis;
  leftLowerArm_velo.visible = settings.leftLowerArm_velo_vis;
  leftHand_velo.visible = settings.leftHand_vis;
  rightUpperArm_velo.visible = settings.rightUpperArm_velo_vis;
  rightLowerArm_velo.visible = settings.rightLowerArm_velo_vis;
  rightHand_velo.visible = settings.rightHand_vis;
}

function skinned_anime_loader(fname) {
  scene.remove(FBXHelper);
  loaderFBX.load('data/animation/' + fname + '.fbx', function (object) {
    FBXHelper = object;

    mixerFBX = new THREE.AnimationMixer(FBXHelper);

    fbx_action = mixerFBX.clipAction(FBXHelper.animations[0]);
    fbx_action.play();

    FBXHelper.traverse(function (child) {

      if (child.isMesh) {

        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    FBXHelper.scale.set(3.0, 3.0, 3.0);
    scene.add(FBXHelper);

  });
}

function debugJoint() {
  show_velo();
  var pos = new THREE.Vector3();
  skeletonHelper.skeleton.bones[0].getWorldPosition(pos);

  if (mixer_action.paused == false) {
    update_Velo();
  }


  if (mixer_action.paused == false) {
    if (skeletonHistory.root.length < int(skeletonHistory.root_total_frame / 2) - 1) {
      skeletonHistory.root.push(pos);
    }
  }
  if (settings.show_root_path) {
    if (skeletonHistory.line) scene.remove(skeletonHistory.line);
    const geometry = new THREE.BufferGeometry().setFromPoints(skeletonHistory.root);
    const material = new THREE.LineBasicMaterial({ color: 0xeeeeee });
    skeletonHistory.line = new THREE.Line(geometry, material);
    scene.add(skeletonHistory.line);
  }
  else {
    if (skeletonHistory.line) skeletonHistory.line.visible = false;
  }

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

loaderFBX.load('data/animation/Walking60.fbx', function (object) {
  FBXHelper = object;

  mixerFBX = new THREE.AnimationMixer(FBXHelper);

  fbx_action = mixerFBX.clipAction(FBXHelper.animations[0]);
  fbx_action.play();

  FBXHelper.traverse(function (child) {

    if (child.isMesh) {

      child.castShadow = true;
      child.receiveShadow = true;

    }

  });
  FBXHelper.scale.set(3.0, 3.0, 3.0);
  scene.add(FBXHelper);

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
  camera.position.set(0, 1.0, 8.0);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x303030);

  scene.add(new THREE.GridHelper(10, 10));
  scene.add(new THREE.AxesHelper(5));

  //gui
  gui = new dat.GUI({ width: 400 });
  gui.domElement.id = "gui";
  const mainFolder = gui.addFolder("Main Control");
  var bvhLoadUI = mainFolder.add(params, "loadFile").name("Load BVH file 📁");
  bvhName = mainFolder.add(settings, "message").name("BVH File Name");
  mainFolder.open()
  const bvhFolder = gui.addFolder("BVH Control");
  bvhFolder.add(settings, 'showBVH').name("Show/Hide").onChange(() => { skeletonHelper.visible = skeletonHelper.visible == true ? false : true });
  bvhFolder.add(settings, 'pause').name("Pause").onChange(() => { mixer_action.paused = mixer_action.paused == true ? false : true });
  bvhFolder.add(settings, 'speedBVH', 0, 2, 0.1).name("Speed").onChange(newValue => { mixer_action.timeScale = newValue });
  bvhFolder.add(settings, 'scaleBVH', 0.01, 0.1, 0.005).name("Scale").onChange(() => { boneContainer.scale.set(settings.scaleBVH, settings.scaleBVH, settings.scaleBVH); });
  bvhFolder.add(settings, 'show_root_path').name("Show Root Bone Path");
  bvhName.domElement.style.pointerEvents = "none";
  bvhFolder.open();

  const veloFolder = gui.addFolder("Velocity Visual");
  veloFolder.add(settings, 'rootVelo_vis').name("Root");
  veloFolder.add(settings, 'leftUpperLeg_velo_vis').name("Left Upper Leg");
  veloFolder.add(settings, 'leftLowerLeg_velo_vis').name("Left Lower Leg");
  veloFolder.add(settings, 'leftFoot_velo_vis').name("Left Foot");
  veloFolder.add(settings, 'rightUpperLeg_velo_vis').name("Right Upper Leg");
  veloFolder.add(settings, 'rightLowerLeg_velo_vis').name("Right Lower Leg");
  veloFolder.add(settings, 'rightFoot_velo_vis').name("Right Foot");
  veloFolder.add(settings, 'leftUpperArm_velo_vis').name("Left Upper Arm");
  veloFolder.add(settings, 'leftLowerArm_velo_vis').name("Left Lower Arm");
  veloFolder.add(settings, 'leftHand_vis').name("Left Hand");
  veloFolder.add(settings, 'rightUpperArm_velo_vis').name("Right Upper Arm");
  veloFolder.add(settings, 'rightLowerArm_velo_vis').name("Right Lower Arm");
  veloFolder.add(settings, 'rightHand_vis').name("Right Hand");
  veloFolder.open();

  const fbxFolder = gui.addFolder("Skinned Animation Control");
  fbxFolder.add(settings, 'skinned_animation_name', ["Walking60", "Walking_2_60", "Jump60", "Jumping Jacks60"]).name("Select Animation").onChange(newValue => { skinned_anime_loader(newValue) });
  fbxFolder.add(settings, 'showFBX').name("Show/Hide").onChange(() => { FBXHelper.visible = FBXHelper.visible == true ? false : true });
  fbxFolder.add(settings, 'pauseFBX').name("Pause").onChange(() => { fbx_action.paused = fbx_action.paused == true ? false : true });
  fbxFolder.add(settings, 'speedFBX', 0, 2, 0.1).name("Speed").onChange(newValue => { fbx_action.timeScale = newValue });
  fbxFolder.add(settings, 'scaleFBX', 1, 10, 0.5).name("Scale").onChange(() => { FBXHelper.scale.set(settings.scaleFBX, settings.scaleFBX, settings.scaleFBX); });
  fbxFolder.open();
  // light
  const point_light = new THREE.PointLight(0xfff5e7, 1.0, 100);
  point_light.position.set(1, 4, 8);
  point_light.castShadow = true; // default false
  scene.add(point_light);
  point_light.shadow.mapSize.width = 2048; // default
  point_light.shadow.mapSize.height = 2048;

  const light = new THREE.DirectionalLight(0xffffff, 0.9);
  light.position.set(0.0, 1.0, 4.0).normalize();
  scene.add(light);

  const lightback = new THREE.DirectionalLight(0xffffff, .8);
  lightback.position.set(0.0, 0.5, -4.0).normalize();
  scene.add(lightback);

  const lightbot = new THREE.DirectionalLight(0xcf411f, .6);
  lightbot.position.set(0.0, -1.0, 0.2).normalize();
  scene.add(lightbot);

  const geometryp = new THREE.PlaneGeometry(10, 10);
  const materialp = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const plane = new THREE.Mesh(geometryp, materialp);
  plane.receiveShadow = true;
  plane.position.set(0, -0.02, 0);
  plane.lookAt(0, 1.0, 0);
  scene.add(plane);
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

  // ArrorHelper
  rootVelo = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0), 1, 0xffff00);
  leftUpperLeg_velo = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0), 1, 0xffff00);
  leftLowerLeg_velo = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0), 1, 0xffff00);
  leftFoot_velo = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0), 1, 0xffff00);
  rightUpperLeg_velo = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0), 1, 0xffff00);
  rightLowerLeg_velo = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0), 1, 0xffff00);
  rightFoot_velo = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0), 1, 0xffff00);
  leftUpperArm_velo = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0), 1, 0xffff00);
  leftLowerArm_velo = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0), 1, 0xffff00);
  leftHand_velo = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0), 1, 0xffff00);
  rightUpperArm_velo = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0), 1, 0xffff00);
  rightLowerArm_velo = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0), 1, 0xffff00);
  rightHand_velo = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0), 1, 0xffff00);

  scene.add(rootVelo);
  scene.add(leftUpperLeg_velo);
  scene.add(leftLowerLeg_velo);
  scene.add(leftFoot_velo);
  scene.add(rightUpperLeg_velo);
  scene.add(rightLowerLeg_velo);
  scene.add(rightFoot_velo);
  scene.add(leftUpperArm_velo);
  scene.add(leftLowerArm_velo);
  scene.add(leftHand_velo);
  scene.add(rightUpperArm_velo);
  scene.add(rightLowerArm_velo);
  scene.add(rightHand_velo);

  // renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap

  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);

  container = document.getElementById("maincanvas");
  document.body.appendChild(container);
  container.appendChild(renderer.domElement);

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.screenSpacePanning = true;
  controls.target.set(0.0, 1.0, 0.0);
  controls.minDistance = 1;
  controls.maxDistance = 800;
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
  if (skeletonHelper) debugJoint();
  renderer.render(scene, camera);
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