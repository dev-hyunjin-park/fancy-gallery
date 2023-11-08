import * as THREE from "three";
import vertexShader from "../shaders/vertex.glsl?raw";
import fragmentShader from "../shaders/fragment.glsl?raw";

export default function () {
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
  });

  const container = document.querySelector("#container");
  container.appendChild(renderer.domElement);

  const canvasSize = {
    width: window.innerWidth,
    height: window.innerHeight,
  };

  const scene = new THREE.Scene();
  // 원근감을 표현할 수 있는 카메라
  const camera = new THREE.PerspectiveCamera(
    75, // 시야각(field of view)
    canvasSize.width / canvasSize.height, // 카메라 종횡비
    0.1, // near
    100 // far
  );
  camera.position.set(0, 0, 2);

  const loadImages = async () => {
    const images = [...document.querySelectorAll("main .content img")];
    // 모든 이미지가 로드된 후에만 이미지 객체를 사용한다
    const fetchImages = images.map(
      (image) =>
        new Promise((resolve, reject) => {
          image.onload = resolve(image);
          image.onerror = reject;
        })
    );
    const loadedImages = await Promise.all(fetchImages);
    return loadedImages;
  };

  const createImages = (images) => {
    // 이미지 태그의 크기만큼의 plane geometry를 만들고 material을 적용시킨다
    // mesh의 위치를 이미지의 위치로 이동시킨다

    const imageMeshes = images.map((image) => {
      const { width, height, top, left } = image.getBoundingClientRect();
      console.log(width, height, top, left);
      const material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        side: THREE.DoubleSide,
      });
      const geometry = new THREE.PlaneGeometry(width, height, 16, 16);
      const mesh = new THREE.Mesh(geometry, material);

      return mesh;
    });
    return imageMeshes;
  };

  const create = async () => {
    const loadedImages = await loadImages();
    const images = createImages([...loadedImages]);
    scene.add(...images);
  };

  const resize = () => {
    canvasSize.width = window.innerWidth;
    canvasSize.height = window.innerHeight;

    camera.aspect = canvasSize.width / canvasSize.height;
    camera.updateProjectionMatrix();

    renderer.setSize(canvasSize.width, canvasSize.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  };

  const addEvent = () => {
    window.addEventListener("resize", resize);
  };

  const draw = () => {
    renderer.render(scene, camera);
    requestAnimationFrame(() => {
      draw();
    });
  };

  const initialize = async () => {
    await create();
    addEvent();
    resize();
    draw();
  };

  initialize().then();
}
