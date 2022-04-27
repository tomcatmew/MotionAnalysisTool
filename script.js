// Yifei Chen - University of Tokyo

const clock = new THREE.Clock();

let camera, controls, scene, renderer, gui;
let mixer, skeletonHelper, boneContainer, fname, bvhName;
const loader = new THREE.BVHLoader();

fname = "data/LocomotionFlat01_000.bvh";
var settings = {
  message: fname,
};

var params = {
  loadFile: function () {
    var input = document.getElementById("bvhInput");
    input.addEventListener("change", function () {
      var file = input.files[0];
      fname = "data/" + file.name;
      // update all controllers
      loader.load(fname, function (result) {
        bvhName.setValue(fname);
        scene.remove(skeletonHelper);
        scene.remove(boneContainer);

        skeletonHelper = new THREE.SkeletonHelper(result.skeleton.bones[0]);
        skeletonHelper.skeleton = result.skeleton; // allow animation mixer to bind to THREE.SkeletonHelper directly

        boneContainer = new THREE.Group();
        boneContainer.add(result.skeleton.bones[0]);
        for (var i = 0; i < boneContainer.children.length; i++) {
          boneContainer.scale.set(5, 5, 5);
        }
        scene.add(skeletonHelper);
        scene.add(boneContainer);

        // play animation
        mixer = new THREE.AnimationMixer(skeletonHelper);
        mixer.clipAction(result.clip).setEffectiveWeight(1.0).play();
      });
    });
    input.click();
  },
};

init();
animate();

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

  // play animation
  mixer = new THREE.AnimationMixer(skeletonHelper);
  mixer.clipAction(result.clip).setEffectiveWeight(1.0).play();
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

  renderer.render(scene, camera);
}
