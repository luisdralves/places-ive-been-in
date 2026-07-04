import {
  Camera,
  Color,
  CylinderGeometry,
  Group,
  Material,
  Matrix4,
  Mesh,
  SRGBColorSpace,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
  Vector4,
  WebGLRenderer
} from 'three';
import {
  CustomLayerInterface,
  type MapMouseEvent,
  type Map as MapboxMap,
  MercatorCoordinate,
  type ProjectionSpecification
} from 'mapbox-gl';
import { Point } from 'types/point';
import { colors } from 'src/core/config/colors';
import { getColor } from 'src/core/utils/dates';
import { useEffect, useRef } from 'react';

type Props = {
  map: MapboxMap | null;
  onSelect: (point: Point) => void;
  points: Point[];
};

const LAYER_ID = 'places-pins-3d';

const STEM_HEIGHT = 60;
const STEM_TOP_RADIUS = 1.2;
const STEM_BOTTOM_RADIUS = 0.6;
const HEAD_RADIUS = 5.5;
// Head centre sits just above the cylinder top so the two geometries don't intersect. Overlap
// causes the cylinder cap to z-fight through the sphere.
const HEAD_CENTER_Z = STEM_HEIGHT + HEAD_RADIUS * 1.005;
const PIN_SCREEN_HEIGHT_PX = 90;
const MAPBOX_TILE_PX = 512;
const MAPBOX_EXTENT = 8192;
const GLOBE_RADIUS = MAPBOX_EXTENT / (2 * Math.PI);
const HIT_RADIUS_PX = 22;
const DEG = Math.PI / 180;

const lngLatToEcef = (lon: number, lat: number) => {
  const cosLat = Math.cos(lat * DEG);
  const sinLat = Math.sin(lat * DEG);
  const lngRad = lon * DEG;

  return new Vector3(
    cosLat * Math.sin(lngRad) * GLOBE_RADIUS,
    -sinLat * GLOBE_RADIUS,
    cosLat * Math.cos(lngRad) * GLOBE_RADIUS
  );
};

const headHexFor = (point: Point) => {
  const idx = point.color ?? colors.findIndex(c => c === getColor(point.dates));
  const raw = colors[idx] ?? '#ffffff';

  return raw.length >= 7 ? raw.slice(0, 7) : raw;
};

// Custom shaders that light each pin in its own local frame instead of scene-world space.
// Three.js's built-in materials read normals in camera-relative space, but we set
// `camera.projectionMatrix` directly with mapbox's transform, so `camera.matrixWorld` stays
// identity and three.js's idea of "view space" is wrong. Lighting against the geometry's local
// frame gives identical shading for every pin in both globe and mercator modes.
const VERTEX_SHADER = `
  varying vec3 vNormal;
  varying vec3 vWorld;
  void main() {
    vNormal = normalize(normal);
    // camera.matrixWorld stays identity, so modelViewMatrix is just the model matrix and this
    // is the position in the map frame (ECEF in globe mode, mercator on the flat map).
    vec4 world = modelViewMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * world;
  }
`;

const FRAGMENT_SHADER = `
  #define GLOBE_RADIUS ${GLOBE_RADIUS.toFixed(6)}
  uniform vec3 baseColor;
  uniform float metallic;
  uniform vec3 cameraEcef;
  uniform float occlusionEnabled;
  varying vec3 vNormal;
  varying vec3 vWorld;
  void main() {
    // Globe-mode horizon occlusion. The depth buffer is cleared before the pins draw, so the
    // sphere can't hide them through depth testing. Discard fragments whose sight line enters
    // the globe before reaching them, and pins sink below the horizon instead of popping out.
    if (occlusionEnabled > 0.5) {
      vec3 toFragment = vWorld - cameraEcef;
      float a = dot(toFragment, toFragment);
      float b = 2.0 * dot(cameraEcef, toFragment);
      float c = dot(cameraEcef, cameraEcef) - GLOBE_RADIUS * GLOBE_RADIUS;
      float disc = b * b - 4.0 * a * c;
      if (disc > 0.0) {
        float t = (-b - sqrt(disc)) / (2.0 * a);
        // The 0.99 slack keeps fragments that sit on the surface (t == 1, the pin base) from
        // discarding themselves.
        if (t > 0.0 && t < 0.99) {
          discard;
        }
      }
    }
    vec3 n = normalize(vNormal);
    // View direction in local frame: approximated as +Z (the pin points roughly toward the
    // camera at view center; off-center pins pick up a tiny approximation error but stay
    // consistent across modes).
    vec3 viewDir = vec3(0.0, 0.0, 1.0);
    // Light well off the view axis so the day/night terminator lands on the visible surface.
    // With a near-view light everything faces it and no shadow is ever on screen.
    vec3 lightDir = normalize(vec3(0.6, 0.5, 0.55));
    // The lambert term is odd in the normal while reflect() is even, and the effective normal
    // orientation puts the raw dot(n, light) bright side opposite the specular lobe. Shade
    // diffuse and rim with the flipped normal so the lit side wraps the highlight.
    vec3 ns = -n;
    float diff = max(0.0, dot(ns, lightDir));
    // Rim gated by diff so the silhouette brightens only on the lit side. An unconditional rim
    // would re-illuminate the shadowed limb.
    float rim = pow(1.0 - max(0.0, dot(ns, viewDir)), 3.0);
    float specBase;
    if (metallic > 0.5) {
      // The stem's walls meet the view at grazing incidence, so a mirror reflection toward the
      // camera never fires there. Evaluate the lobe against the radial profile instead: the
      // highlight becomes a line running down the lit side of the cylinder.
      float len = length(ns.xy);
      specBase = len > 1e-4 ? max(0.0, dot(ns.xy / len, normalize(lightDir.xy))) : 0.0;
    } else {
      vec3 r = reflect(-lightDir, n);
      specBase = max(0.0, dot(viewDir, r));
    }
    // Two-lobe specular: a hot, tight highlight for the "lit" pop and a broader low-intensity
    // sheen for gloss.
    float spec = pow(specBase, 32.0);
    float sheen = pow(specBase, 6.0);
    // Low ambient is what makes the shadow read; keep the lit peak near 1.2 so saturated colors
    // don't clamp the gradient away.
    vec3 col = baseColor * (0.35 + 0.85 * diff + 0.3 * rim * diff) + vec3(0.9) * spec + vec3(0.2) * sheen;
    gl_FragColor = vec4(col, 1.0);
  }
`;

// One instance is shared by every pin material so render() can update the camera position and
// occlusion toggle in a single place per frame.
type SharedUniforms = {
  cameraEcef: { value: Vector3 };
  occlusionEnabled: { value: number };
};

const buildPinMaterial = (color: number | string, metallic: boolean, shared: SharedUniforms) =>
  new ShaderMaterial({
    fragmentShader: FRAGMENT_SHADER,
    uniforms: {
      baseColor: { value: new Color(color) },
      cameraEcef: shared.cameraEcef,
      metallic: { value: metallic ? 1 : 0 },
      occlusionEnabled: shared.occlusionEnabled
    },
    vertexShader: VERTEX_SHADER
  });

const buildStemGeometry = () => {
  const geom = new CylinderGeometry(STEM_TOP_RADIUS, STEM_BOTTOM_RADIUS, STEM_HEIGHT, 10);
  geom.translate(0, STEM_HEIGHT / 2, 0);
  geom.rotateX(Math.PI / 2);

  return geom;
};

const buildHeadGeometry = () => {
  const geom = new SphereGeometry(HEAD_RADIUS, 24, 18);

  geom.translate(0, 0, HEAD_CENTER_Z);

  return geom;
};

// 1 mercator unit projects to worldSize pixels, so this scale makes the stem span
// PIN_SCREEN_HEIGHT_PX on screen. The globe-endpoint scale is derived from it in render():
// × MAPBOX_EXTENT converts mercator units to ECEF units, × pixelsPerMeterRatio (cos(centerLat)
// on the globe, 1 in mercator) compensates for the globe camera sitting closer than the
// mercator camera would at the same zoom.
const computeMercatorScale = (zoom: number) =>
  PIN_SCREEN_HEIGHT_PX / (MAPBOX_TILE_PX * Math.pow(2, zoom) * STEM_HEIGHT);

// Shortest signed distance between two mercator x coordinates (world wraps at x = 1), mirroring
// the wrap() in mapbox's shader prelude.
const wrapHalf = (n: number) => (((n % 1) + 1.5) % 1) - 0.5;

// Mapbox puts the globe far plane exactly at the horizon (see farthestPixelDistanceOnSphere in
// mapbox-gl-js), which would clip pin geometry poking past the horizon. Remap NDC z from
// [-1, 1 + FAR_EXTEND] to [-1, 1]: beyond the far plane z saturates at 1 + 2·near/(far - near),
// so 0.1 keeps everything out to infinity. The depth compression it costs is irrelevant: the
// depth buffer is cleared before the pins draw.
const FAR_EXTEND = 0.1;
// eslint-disable-next-line capitalized-comments
// prettier-ignore
const farExtendMatrix = new Matrix4().set(
  1, 0, 0, 0,
  0, 1, 0, 0,
  0, 0, 2 / (2 + FAR_EXTEND), -FAR_EXTEND / (2 + FAR_EXTEND),
  0, 0, 0, 1
);

type PinSlot = {
  ecefPosition: Vector3;
  group: Group;
  // Head centre in the frame the pins were last rendered in (ECEF in globe mode, mercator in
  // flat mode). Hit-testing projects it through the same camera matrix, so clicks land on the
  // head as drawn.
  headWorld: Vector3;
  mercatorPosition: Vector3;
  point: Point;
};

export const PinsLayer = ({ map, onSelect, points }: Props) => {
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    if (!map) {
      return;
    }

    let renderer: WebGLRenderer | null = null;
    const scene = new Scene();
    const camera = new Camera();
    const pinsRoot = new Group();
    scene.add(pinsRoot);

    const sharedUniforms: SharedUniforms = {
      cameraEcef: { value: new Vector3() },
      occlusionEnabled: { value: 0 }
    };

    const stemGeometry = buildStemGeometry();
    const headGeometry = buildHeadGeometry();
    const stemMaterial = buildPinMaterial(0xcfd2d6, true, sharedUniforms);

    const slots: PinSlot[] = [];

    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      const headMaterial = buildPinMaterial(headHexFor(point), false, sharedUniforms);
      // Heads skip depth testing, so they always paint over every stem and, in renderOrder, over
      // each other: the later-indexed head wins any overlap. Back-face culling keeps each sphere
      // self-consistent. This avoids a per-head depth-buffer clear (one glClear per pin per
      // frame).
      headMaterial.depthTest = false;
      headMaterial.depthWrite = false;
      const stem = new Mesh(stemGeometry, stemMaterial);
      const head = new Mesh(headGeometry, headMaterial);
      // All stems draw first (renderOrder 0..N-1), then all heads (renderOrder N..2N-1).
      // Three.js does not propagate renderOrder from parent groups, so it must be set on each
      // mesh individually.
      stem.renderOrder = i;
      head.renderOrder = points.length + i;
      const group = new Group();
      group.add(stem);
      group.add(head);
      const mc = MercatorCoordinate.fromLngLat([point.lon, point.lat]);
      pinsRoot.add(group);
      slots.push({
        ecefPosition: lngLatToEcef(point.lon, point.lat),
        group,
        headWorld: new Vector3(),
        mercatorPosition: new Vector3(mc.x, mc.y, mc.z),
        point
      });
    }

    const lookTarget = new Vector3();
    const globeToMercator = new Matrix4();
    const inverseProjection = new Matrix4();
    const eyeHomogeneous = new Vector4();
    const eyeDir = new Vector3();
    const upDir = new Vector3();
    const flatPosition = new Vector3();
    const pinPosition = new Vector3();
    const pinDirection = new Vector3();

    const customLayer: CustomLayerInterface = {
      id: LAYER_ID,
      onAdd(_map, gl) {
        renderer = new WebGLRenderer({
          alpha: true,
          antialias: true,
          canvas: map.getCanvas(),
          context: gl as unknown as WebGLRenderingContext
        });

        renderer.autoClear = false;
        renderer.outputColorSpace = SRGBColorSpace;
      },
      // Mapbox calls this when the layer is torn down, including on style reloads. Dispose here
      // so a re-add through style.load starts clean.
      onRemove() {
        renderer?.dispose();
        renderer = null;
      },
      // Mapbox's custom-layer render contract is positional, hence 7 params.
      // eslint-disable-next-line max-params
      render(
        _gl,
        matrix,
        _projection?: ProjectionSpecification,
        projectionToMercatorMatrix?: number[],
        projectionToMercatorTransition?: number,
        centerInMercator?: number[],
        pixelsPerMeterRatio?: number
      ) {
        if (!renderer) {
          return;
        }

        const zoom = map.getZoom();
        const isGlobe = !!projectionToMercatorMatrix;

        if (isGlobe) {
          // Mapbox's globe is a true sphere only up to zoom 5. From 5 to 6 every tile vertex
          // morphs by `projectionToMercatorTransition` (smoothstep(5, 6, zoom)) toward a plane
          // tangent to the sphere at the screen center, laid out in mercator offsets from that
          // center and scaled by pixelsPerMeterRatio (see mercator_tile_position and
          // createInversionMatrix in mapbox-gl-js). From zoom 6 the map is plain mercator and the
          // globe arguments stop being passed. Pins must morph toward the same plane or they lift
          // off the flattening ground.
          const phase = projectionToMercatorTransition ?? 0;
          const center = map.getCenter();
          const cLat = center.lat * DEG;
          const cLng = center.lng * DEG;
          const cosLat = Math.cos(cLat);
          const sinLat = Math.sin(cLat);
          const cosLng = Math.cos(cLng);
          const sinLng = Math.sin(cLng);
          const ratio = pixelsPerMeterRatio ?? cosLat;
          const scale = computeMercatorScale(zoom) * MAPBOX_EXTENT * ratio;
          const centerMercX = centerInMercator?.[0] ?? MercatorCoordinate.fromLngLat(center).x;
          const centerMercY = centerInMercator?.[1] ?? MercatorCoordinate.fromLngLat(center).y;
          // Unit radial at the screen center: the tangent plane's normal.
          upDir.set(cosLat * sinLng, -sinLat, cosLat * cosLng);

          // Pins live in ECEF, so append the ECEF → mercator transform to `matrix` (which
          // projects mercator to clip space), then push the far plane out past the horizon.
          globeToMercator.fromArray(projectionToMercatorMatrix);
          camera.projectionMatrix
            .fromArray(matrix)
            .multiply(globeToMercator)
            .premultiply(farExtendMatrix);

          // Camera position in ECEF: the eye is the point that projects to clip w = 0, so
          // eye ∝ M⁻¹ · (0, 0, 1, 0).
          inverseProjection.copy(camera.projectionMatrix).invert();
          eyeHomogeneous.set(0, 0, 1, 0).applyMatrix4(inverseProjection);

          // Cull only pins whose whole height is below the horizon:
          // angle(pin, eye) > acos(R / eyeDist) + acos(R / (R + tipHeight)). The fragment
          // shader's occlusion test hides the parts of closer pins that the curve already covers.
          let cullThreshold = 0;

          if (Math.abs(eyeHomogeneous.w) > 1e-12) {
            eyeDir
              .set(eyeHomogeneous.x, eyeHomogeneous.y, eyeHomogeneous.z)
              .divideScalar(eyeHomogeneous.w);

            sharedUniforms.cameraEcef.value.copy(eyeDir);
            // The morph pulls pins off the sphere, so the spherical occlusion test only applies
            // to the un-morphed globe.
            sharedUniforms.occlusionEnabled.value = phase === 0 ? 1 : 0;
            const eyeDistance = eyeDir.length();
            const cosHorizon = Math.min(1, GLOBE_RADIUS / eyeDistance);
            const sinHorizon = Math.sqrt(1 - cosHorizon * cosHorizon);
            const tipHeight = (HEAD_CENTER_Z + HEAD_RADIUS) * scale;
            const cosTip = GLOBE_RADIUS / (GLOBE_RADIUS + tipHeight);
            const sinTip = Math.sqrt(1 - cosTip * cosTip);
            cullThreshold = cosHorizon * cosTip - sinHorizon * sinTip - 0.01;
            eyeDir.divideScalar(eyeDistance);
          } else {
            sharedUniforms.occlusionEnabled.value = 0;
            eyeDir.copy(upDir);
          }

          for (const slot of slots) {
            slot.group.visible = slot.ecefPosition.dot(eyeDir) / GLOBE_RADIUS > cullThreshold;

            if (!slot.group.visible) {
              continue;
            }

            // Flat endpoint of the morph: the pin's mercator offset from the screen center laid
            // on the plane z = GLOBE_RADIUS, rotated into the ECEF frame by Ry(centerLng) ·
            // Rx(centerLat).
            const dx = wrapHalf(slot.mercatorPosition.x - centerMercX);
            const px = ratio * dx * MAPBOX_EXTENT;
            const py = ratio * (slot.mercatorPosition.y - centerMercY) * MAPBOX_EXTENT;
            const y1 = py * cosLat - GLOBE_RADIUS * sinLat;
            const z1 = py * sinLat + GLOBE_RADIUS * cosLat;
            flatPosition.set(px * cosLng + z1 * sinLng, y1, -px * sinLng + z1 * cosLng);
            pinPosition.copy(slot.ecefPosition).lerp(flatPosition, phase);
            // Same normal morph as globe_mercator_surface_vectors: sphere radial blending into
            // the plane normal.
            pinDirection.copy(slot.ecefPosition).normalize().lerp(upDir, phase).normalize();
            slot.group.position.copy(pinPosition);
            // Three.js Object3D.lookAt sends local +Z toward the target.
            lookTarget.copy(pinPosition).add(pinDirection);
            slot.group.lookAt(lookTarget);
            slot.group.scale.setScalar(scale);
            slot.headWorld.copy(pinPosition).addScaledVector(pinDirection, HEAD_CENTER_Z * scale);
          }
        } else {
          const scale = computeMercatorScale(zoom);

          camera.projectionMatrix.fromArray(matrix);
          sharedUniforms.occlusionEnabled.value = 0;

          for (const slot of slots) {
            slot.group.visible = true;
            slot.group.position.copy(slot.mercatorPosition);
            lookTarget.copy(slot.mercatorPosition).setZ(slot.mercatorPosition.z + 1);
            slot.group.lookAt(lookTarget);
            slot.group.scale.setScalar(scale);
            slot.headWorld
              .copy(slot.mercatorPosition)
              .setZ(slot.mercatorPosition.z + HEAD_CENTER_Z * scale);
          }
        }

        // Clear the depth buffer so the globe-tile depth values mapbox just wrote don't occlude
        // our stems. Heads draw with depth testing off, so they land on top of every stem and, in
        // renderOrder, over each other.
        renderer.resetState();
        renderer.clear(false, true, false);
        renderer.render(scene, camera);
      },
      renderingMode: '3d',
      type: 'custom'
    };

    const addLayer = () => {
      if (!map.getLayer(LAYER_ID)) {
        map.addLayer(customLayer);
      }
    };

    // Fires on every style (re)load, not just the first. Mapbox tears custom layers down with
    // the old style, so the layer must be re-added each time.
    map.on('style.load', addLayer);

    if (map.isStyleLoaded()) {
      addLayer();
    }

    const projectedHead = new Vector3();

    const findHit = (point: { x: number; y: number }) => {
      const canvas = map.getCanvas();
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      let nearest: Point | null = null;
      let nearestDist = HIT_RADIUS_PX;

      for (const slot of slots) {
        if (!slot.group.visible) {
          continue;
        }

        // Project the head centre through the same camera matrix the pins were rendered with, so
        // hits land on the head as drawn rather than on the GPS position on the ground.
        const m = camera.projectionMatrix.elements;
        const w =
          m[3] * slot.headWorld.x + m[7] * slot.headWorld.y + m[11] * slot.headWorld.z + m[15];

        // Behind the camera (possible on a pitched mercator map) the perspective divide flips
        // signs and can land back on screen as a phantom hit.
        if (w <= 0) {
          continue;
        }

        projectedHead.copy(slot.headWorld).applyMatrix4(camera.projectionMatrix);
        const x = (projectedHead.x + 1) * 0.5 * width;
        const y = (1 - projectedHead.y) * 0.5 * height;
        const d = Math.hypot(x - point.x, y - point.y);

        if (d < nearestDist) {
          nearestDist = d;
          nearest = slot.point;
        }
      }

      return nearest;
    };

    const handleClick = (event: MapMouseEvent) => {
      const hit = findHit(event.point);

      if (hit) {
        onSelectRef.current(hit);
      }
    };

    const handleMouseMove = (event: MapMouseEvent) => {
      map.getCanvas().style.cursor = findHit(event.point) ? 'pointer' : '';
    };

    map.on('click', handleClick);
    map.on('mousemove', handleMouseMove);

    return () => {
      map.off('click', handleClick);
      map.off('mousemove', handleMouseMove);
      map.off('style.load', addLayer);

      if (map.getLayer(LAYER_ID)) {
        map.removeLayer(LAYER_ID);
      }

      stemGeometry.dispose();
      headGeometry.dispose();
      stemMaterial.dispose();

      for (const slot of slots) {
        for (const child of slot.group.children) {
          const mesh = child as Mesh;

          if (mesh.isMesh && mesh.geometry === headGeometry) {
            (mesh.material as Material).dispose();
          }
        }
      }

      renderer?.dispose();
      renderer = null;
    };
  }, [map, points]);

  return null;
};
