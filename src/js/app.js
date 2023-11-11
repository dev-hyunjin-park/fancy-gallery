import * as THREE from "three";
import vertexShader from "../shaders/vertex.glsl?raw";
import fragmentShader from "../shaders/fragment.glsl?raw";
import postVertexShader from "../shaders/postprocessing/vertex.glsl?raw";
import postFragmentShader from "../shaders/postprocessing/fragment.glsl?raw";
import ASScroll from "@ashthornton/asscroll";
import gsap from "gsap";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";

const asscroll = new ASScroll({
  disableRaf: true,
});
asscroll.enable();

export default function () {
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
  });

  // 이펙트를 관리하는 컴포저 객체
  const composer = new EffectComposer(renderer);

  const container = document.querySelector("#container");
  container.appendChild(renderer.domElement);

  const canvasSize = {
    width: window.innerWidth,
    height: window.innerHeight,
  };

  const raycaster = new THREE.Raycaster();
  const clock = new THREE.Clock();
  const textureLoader = new THREE.TextureLoader();

  const scene = new THREE.Scene();
  // 원근감을 표현할 수 있는 카메라
  const camera = new THREE.PerspectiveCamera(
    75, // 시야각(field of view)
    canvasSize.width / canvasSize.height, // 카메라 종횡비
    0.1, // near
    100 // far
  );
  camera.position.set(0, 0, 50);
  camera.fov = Math.atan(canvasSize.height / 2 / 50) * (180 / Math.PI) * 2; // 시야각 계산

  const imageRepository = [];

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
      const material = new THREE.ShaderMaterial({
        uniforms: {
          uTexture: {
            value: null, // 텍스처가 로드되기를 기다리지 않고 임시 할당
          },
          uTime: {
            value: 0,
          },
          uHover: {
            value: 0,
          },
          uHoverX: {
            value: 0.5,
          },
          uHoverY: {
            value: 0.5,
          },
        },
        vertexShader,
        fragmentShader,
        side: THREE.DoubleSide,
      });

      const clonedMatarial = material.clone();
      clonedMatarial.uniforms.uTexture.value = textureLoader.load(image.src);
      const { width, height } = image.getBoundingClientRect();

      const geometry = new THREE.PlaneGeometry(width, height, 16, 16);
      const mesh = new THREE.Mesh(geometry, clonedMatarial);

      imageRepository.push({ img: image, mesh });
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
    camera.fov = Math.atan(canvasSize.height / 2 / 50) * (180 / Math.PI) * 2;
    camera.updateProjectionMatrix();

    composer.setSize(canvasSize.width, canvasSize.height);
    renderer.setSize(canvasSize.width, canvasSize.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  };

  const retransform = () => {
    imageRepository.forEach(({ img, mesh }) => {
      const { width, height, top, left } = img.getBoundingClientRect();
      const { width: originWidth } = mesh.geometry.parameters;
      const scale = width / originWidth; // 얼마나 scale 되었는지를 구한다
      mesh.scale.x = scale;
      mesh.scale.y = scale;

      // three.js와 html의 좌표체계가 다름. position 바꿔주기
      mesh.position.x = -canvasSize.width / 2 + width / 2 + left;
      mesh.position.y = canvasSize.height / 2 - height / 2 - top;
    });
  };

  const addPostEffects = () => {
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const customShader = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: {
          value: null,
        },
        uTime: {
          value: 0,
        },
        uScrolling: {
          value: 0,
        },
      },
      vertexShader: postVertexShader,
      fragmentShader: postFragmentShader,
    });

    const customPass = new ShaderPass(customShader);
    composer.addPass(customPass);

    return {
      customShader,
    };
  };

  const addEvent = (effects) => {
    const { customShader } = effects;

    asscroll.on("update", ({ currentPos, targetPos }) => {
      const speed = Math.abs(targetPos - currentPos); // Math.abs: 위로 스크롤 할 때엔 음수를 띄기때문에 절대값을 넘겨준다.
      if (speed > 5) {
        gsap.to(customShader.uniforms.uScrolling, {
          value: 1,
          duration: 0.5,
        });
      } else {
        gsap.to(customShader.uniforms.uScrolling, {
          value: 0,
          duration: 0.5,
        });
      }
    });

    window.addEventListener("mousemove", (e) => {
      // pointer는 마우스 위치 좌표를 -1과 1 사이의 값
      const pointer = {
        x: (e.clientX / canvasSize.width) * 2 - 1,
        y: -(e.clientY / canvasSize.height) * 2 + 1,
      };
      raycaster.setFromCamera(pointer, camera);

      const intersects = raycaster.intersectObjects(scene.children);

      if (intersects.length > 0) {
        let mesh = intersects[0].object;
        mesh.material.uniforms.uHoverX.value = intersects[0].uv.x - 0.5;
        mesh.material.uniforms.uHoverY.value = intersects[0].uv.y - 0.5;
      }
    });

    window.addEventListener("resize", resize);
    imageRepository.forEach(({ img, mesh }) => {
      img.addEventListener("mouseenter", () => {
        gsap.to(mesh.material.uniforms.uHover, {
          value: 1,
          duration: 0.4,
          ease: "power1.inOut",
        });
      });
      img.addEventListener("mouseout", () => {
        gsap.to(mesh.material.uniforms.uHover, {
          value: 0,
          duration: 0.4,
          ease: "power1.inOut",
        });
      });
    });
  };

  const draw = (effects) => {
    const { customShader } = effects;
    composer.render();
    // renderer.render(scene, camera);
    retransform();

    asscroll.update();
    customShader.uniforms.uTime.value = clock.getElapsedTime();

    imageRepository.forEach(({ img, mesh }) => {
      mesh.material.uniforms.uTime.value = clock.getElapsedTime();
    });

    requestAnimationFrame(() => {
      draw(effects);
    });
  };

  const initialize = async () => {
    await create();
    const effects = addPostEffects();
    addEvent(effects);
    resize();
    draw(effects);
  };

  initialize().then();
}
