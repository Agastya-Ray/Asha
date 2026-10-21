import * as THREE from "three";

/**
 * Asha's fairy in 3D, built from simple shapes so there is nothing to download.
 *
 * Character sheet ("Pari"):
 * - a tiny, smiling, kid-like girl, about 3 heads tall (chibi), warm brown skin, rosy cheeks
 * - very big glossy eyes (dark brown iris, two white sparkles) that turn toward whatever is tapped
 * - dark hair in a round bun with a green leaf clip, soft bangs
 * - a leaf-petal dress in fresh green, little slippers with pom-poms
 * - four see-through glowing wings that flutter; a soft golden glow and drifting sparkles around her
 *
 * Moods: idle, happy, thinking, asking, sad, talk, yawn, sleep (curled up on the floor of the screen).
 */

export type Fairy3DMood = "idle" | "happy" | "thinking" | "asking" | "sad" | "talk" | "yawn" | "sleep";

const SKIN = 0xd99a74;
const SKIN_SHADE = 0xc9845f;
const HAIR = 0x2b1a12;
const DRESS = 0x3fae6e;
const DRESS_DARK = 0x2a8a52;
const LEAF = 0x7cc96b;
const IRIS = 0x4a2a17;
const CHEEK = 0xff8f8f;
const WING = 0xbfeee0;
const GOLD = 0xffe08a;

function mat(color: number, opts: Partial<THREE.MeshStandardMaterialParameters> = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0, ...opts });
}

function wingShape(w: number, h: number) {
  // a rounded teardrop, like a petal
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(w * 0.25, h * 0.55, w * 0.9, h * 1.05, w, h * 0.7);
  s.bezierCurveTo(w * 1.08, h * 0.35, w * 0.6, h * 0.05, 0, 0);
  return new THREE.ShapeGeometry(s, 16);
}

function glowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(255,246,200,1)");
  grad.addColorStop(0.35, "rgba(255,236,160,0.55)");
  grad.addColorStop(1, "rgba(255,236,160,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function zTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  g.fillStyle = "#6d6a8f";
  g.font = "bold 46px Georgia, serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText("z", 32, 34);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

type Eye = { root: THREE.Group; iris: THREE.Group; lid: THREE.Mesh; happyArc: THREE.Mesh; side: number };

export class FairyRig {
  readonly root = new THREE.Group();
  private body = new THREE.Group();
  // dress, arms and legs, scaled together so she is chibi but not a floating head
  private trunk = new THREE.Group();
  private head = new THREE.Group();
  private eyes: Eye[] = [];
  private brows: THREE.Mesh[] = [];
  private smile: THREE.Mesh;
  private frown: THREE.Mesh;
  private mouthOpen: THREE.Mesh;
  private grin: THREE.Mesh;
  private tear: THREE.Mesh;
  private armL = new THREE.Group();
  private armR = new THREE.Group();
  private legL = new THREE.Group();
  private legR = new THREE.Group();
  private wings: THREE.Group[] = [];
  private halo: THREE.Sprite;
  private sparkles: THREE.Points;
  private zs: THREE.Sprite[] = [];
  private t = 0;
  private blinkAt = 2;
  private blink = 0;
  private look = new THREE.Vector2();
  private lookTarget = new THREE.Vector2();
  private lookUntil = 0;
  // 0 = standing/flying, 1 = curled asleep on the floor
  private sleepAmt = 0;
  mood: Fairy3DMood = "idle";

  /** 0 awake … 1 curled up asleep */
  get sleepiness() {
    return this.sleepAmt;
  }

  constructor() {
    const skin = mat(SKIN, { roughness: 0.6 });
    const hair = mat(HAIR, { roughness: 0.45 });
    const dress = mat(DRESS, { roughness: 0.5 });
    const dressDark = mat(DRESS_DARK, { roughness: 0.5 });

    // ---- head ----
    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 32), skin);
    headMesh.scale.set(1, 0.94, 0.92);
    this.head.add(headMesh);
    // ears
    for (const side of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 12), mat(SKIN_SHADE));
      ear.position.set(side * 0.95, -0.05, 0);
      ear.scale.set(0.6, 1, 0.8);
      this.head.add(ear);
    }
    // hair: back shell, bangs, bun with a leaf clip
    // smooth hair cap over the top and back, leaving the forehead and face open
    const cap = new THREE.Mesh(new THREE.SphereGeometry(1.05, 40, 32, 0, Math.PI * 2, 0, Math.PI * 0.42), hair);
    cap.rotation.x = -0.55;
    cap.position.set(0, 0.03, -0.02);
    this.head.add(cap);
    const back = new THREE.Mesh(new THREE.SphereGeometry(1.04, 40, 32), hair);
    back.scale.set(1, 0.98, 0.9);
    back.position.set(0, 0.0, -0.14);
    this.head.add(back);
    // two soft swoops of fringe and side locks framing the cheeks
    for (const [x, y, z, rz, sx] of [
      [-0.32, 0.7, 0.7, 0.5, 0.42],
      [0.18, 0.74, 0.72, -0.35, 0.36],
    ] as const) {
      const bang = new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 16), hair);
      bang.position.set(x, y, z);
      bang.scale.set(sx / 0.3, 0.42, 0.45);
      bang.rotation.z = rz;
      this.head.add(bang);
    }
    for (const side of [-1, 1]) {
      const lock = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.55, 6, 12), hair);
      lock.position.set(side * 0.86, -0.1, 0.25);
      lock.rotation.z = side * 0.12;
      this.head.add(lock);
    }
    const bun = new THREE.Mesh(new THREE.SphereGeometry(0.42, 28, 20), hair);
    bun.position.set(0.05, 1.05, -0.18);
    this.head.add(bun);
    const leafGeo = new THREE.SphereGeometry(0.22, 16, 10);
    for (const [rz, x] of [
      [0.7, 0.32],
      [-0.5, 0.48],
    ] as const) {
      const leaf = new THREE.Mesh(leafGeo, mat(LEAF, { roughness: 0.4 }));
      leaf.scale.set(1.5, 0.45, 0.25);
      leaf.position.set(x, 1.2, 0.05);
      leaf.rotation.z = rz;
      this.head.add(leaf);
    }

    // ---- face ----
    const white = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25 });
    const irisMat = new THREE.MeshStandardMaterial({ color: IRIS, roughness: 0.2 });
    const ringMat = new THREE.MeshStandardMaterial({ color: 0x8a5a33, roughness: 0.3 });
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x120a06 });
    const shine = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const lidMat = mat(SKIN, { roughness: 0.6, side: THREE.DoubleSide });
    for (const side of [-1, 1]) {
      const root = new THREE.Group();
      root.position.set(side * 0.37, -0.1, 0.79);
      root.rotation.y = side * 0.34;
      const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.3, 28, 20), white);
      sclera.scale.set(0.85, 1.05, 0.45);
      root.add(sclera);
      const iris = new THREE.Group();
      const ring = new THREE.Mesh(new THREE.CircleGeometry(0.22, 28), ringMat);
      ring.scale.set(0.9, 1.1, 1);
      const core = new THREE.Mesh(new THREE.CircleGeometry(0.175, 28), irisMat);
      core.scale.set(0.9, 1.1, 1);
      core.position.z = 0.002;
      const pupil = new THREE.Mesh(new THREE.CircleGeometry(0.075, 20), pupilMat);
      pupil.scale.set(0.9, 1.15, 1);
      pupil.position.z = 0.004;
      const s1 = new THREE.Mesh(new THREE.CircleGeometry(0.055, 16), shine);
      s1.position.set(0.06, 0.08, 0.006);
      const s2 = new THREE.Mesh(new THREE.CircleGeometry(0.025, 12), shine);
      s2.position.set(-0.06, -0.07, 0.006);
      iris.add(ring, core, pupil, s1, s2);
      iris.position.z = 0.135;
      root.add(iris);
      (root as THREE.Group & { sclera?: THREE.Mesh }).sclera = sclera;
      // upper lid: a skin cap that slides down to close the eye
      const lid = new THREE.Mesh(new THREE.SphereGeometry(0.315, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), lidMat);
      lid.scale.set(0.88, 1.08, 0.5);
      lid.rotation.x = -1.5;
      root.add(lid);
      // closed-happy eye "^" (and the sleeping line), shown instead of the open eye
      const arc = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.03, 8, 20, Math.PI), new THREE.MeshBasicMaterial({ color: 0x2a160c }));
      arc.position.set(0, -0.02, 0.14);
      arc.visible = false;
      root.add(arc);
      this.head.add(root);
      this.eyes.push({ root, iris, lid, happyArc: arc, side });
      // eyelash flick
      const lash = new THREE.Mesh(new THREE.CapsuleGeometry(0.018, 0.1, 4, 8), new THREE.MeshBasicMaterial({ color: 0x2a160c }));
      lash.position.set(side * 0.25, 0.2, 0.06);
      lash.rotation.z = side * -0.9;
      root.add(lash);
      // brow
      const brow = new THREE.Mesh(new THREE.CapsuleGeometry(0.03, 0.18, 4, 8), mat(HAIR));
      brow.position.set(side * 0.37, 0.3, 0.88);
      brow.rotation.z = Math.PI / 2;
      this.head.add(brow);
      this.brows.push(brow);
      // cheek
      const cheek = new THREE.Mesh(new THREE.CircleGeometry(0.15, 20), new THREE.MeshBasicMaterial({ color: CHEEK, transparent: true, opacity: 0.45 }));
      cheek.position.set(side * 0.58, -0.36, 0.77);
      cheek.rotation.y = side * 0.55;
      cheek.scale.set(1.2, 0.8, 1);
      this.head.add(cheek);
    }
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 10), mat(SKIN_SHADE));
    nose.position.set(0, -0.28, 0.93);
    this.head.add(nose);
    const lipMat = new THREE.MeshBasicMaterial({ color: 0x8a2f2a });
    this.smile = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.028, 8, 20, Math.PI), lipMat);
    this.smile.rotation.z = Math.PI;
    this.smile.position.set(0, -0.42, 0.9);
    this.frown = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.026, 8, 20, Math.PI), lipMat);
    this.frown.position.set(0, -0.53, 0.88);
    this.mouthOpen = new THREE.Mesh(new THREE.SphereGeometry(0.11, 20, 14), new THREE.MeshBasicMaterial({ color: 0x6b1f1d }));
    this.mouthOpen.scale.set(1, 0.7, 0.3);
    this.mouthOpen.position.set(0, -0.48, 0.88);
    const tongue = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8), new THREE.MeshBasicMaterial({ color: 0xe86f73 }));
    tongue.position.set(0, -0.35, 0.3);
    this.mouthOpen.add(tongue);
    // a big open smile: a "D" lying on its back, with a little tongue
    this.grin = new THREE.Mesh(new THREE.CircleGeometry(0.17, 24, Math.PI, Math.PI), new THREE.MeshBasicMaterial({ color: 0x6b1f1d }));
    this.grin.position.set(0, -0.4, 0.915);
    this.grin.scale.set(1.5, 1.35, 1);
    const grinTongue = new THREE.Mesh(new THREE.CircleGeometry(0.07, 16, Math.PI, Math.PI), new THREE.MeshBasicMaterial({ color: 0xe86f73 }));
    grinTongue.position.set(0, -0.09, 0.002);
    grinTongue.scale.set(1.2, -0.7, 1);
    this.grin.add(grinTongue);
    this.head.add(this.grin);
    this.tear = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 10), new THREE.MeshStandardMaterial({ color: 0x9fd8ff, roughness: 0.05, transparent: true, opacity: 0.85 }));
    this.tear.scale.set(0.8, 1.2, 0.8);
    this.head.add(this.smile, this.frown, this.mouthOpen, this.tear);
    this.head.position.y = 1.78;

    // ---- body: leaf-petal dress ----
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 0.28, 8, 16), dress);
    torso.position.y = 0.72;
    this.trunk.add(torso);
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.2, 12), skin);
    neck.position.y = 1.0;
    this.trunk.add(neck);
    const petal = new THREE.SphereGeometry(0.3, 16, 12);
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      const p = new THREE.Mesh(petal, i % 2 ? dressDark : dress);
      p.scale.set(0.75, 1.25, 0.32);
      p.position.set(Math.sin(a) * 0.28, 0.32, Math.cos(a) * 0.28);
      p.rotation.set(Math.cos(a) * 0.55, a, -Math.sin(a) * 0.55);
      this.trunk.add(p);
    }
    // arms
    for (const [arm, side] of [
      [this.armL, -1],
      [this.armR, 1],
    ] as const) {
      const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.38, 6, 10), skin);
      upper.position.y = -0.22;
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 10), skin);
      hand.position.y = -0.46;
      arm.add(upper, hand);
      arm.position.set(side * 0.33, 0.92, 0);
      arm.rotation.z = side * 0.35;
      this.trunk.add(arm);
    }
    // legs with slippers
    for (const [leg, side] of [
      [this.legL, -1],
      [this.legR, 1],
    ] as const) {
      const shin = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.32, 6, 10), skin);
      shin.position.y = -0.2;
      const shoe = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 10), mat(0x2f7a4c));
      shoe.scale.set(0.9, 0.65, 1.4);
      shoe.position.set(0, -0.42, 0.05);
      const pom = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), mat(0xfff3d6));
      pom.position.set(0, -0.36, 0.2);
      leg.add(shin, shoe, pom);
      leg.position.set(side * 0.13, 0.22, 0);
      this.trunk.add(leg);
    }

    // ---- wings ----
    const wingMat = new THREE.MeshStandardMaterial({
      color: WING,
      emissive: 0x7fe0c4,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.72,
      side: THREE.DoubleSide,
      roughness: 0.15,
      depthWrite: false,
    });
    for (const side of [-1, 1]) {
      const g = new THREE.Group();
      const upper = new THREE.Mesh(wingShape(1.15, 1.25), wingMat);
      upper.rotation.z = 0.2;
      const lower = new THREE.Mesh(wingShape(0.75, 0.7), wingMat);
      lower.rotation.z = -1.0;
      lower.position.y = -0.05;
      g.add(upper, lower);
      g.scale.set(side * 1.35, 1.35, 1.35);
      g.position.set(side * 0.1, 1.05, -0.45);
      this.body.add(g);
      this.wings.push(g);
    }

    // ---- glow, sparkles, sleepy z's ----
    const glow = glowTexture();
    this.halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, transparent: true, depthWrite: false, opacity: 0.55 }));
    this.halo.scale.set(4.2, 4.2, 1);
    this.halo.position.set(0, 1.25, -0.8);
    this.root.add(this.halo);
    const n = 18;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 3;
      pos[i * 3 + 1] = Math.random() * 3;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 1.2;
    }
    const pg = new THREE.BufferGeometry();
    pg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    this.sparkles = new THREE.Points(pg, new THREE.PointsMaterial({ color: GOLD, size: 0.12, map: glow, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    this.root.add(this.sparkles);
    const zt = zTexture();
    for (let i = 0; i < 3; i++) {
      const z = new THREE.Sprite(new THREE.SpriteMaterial({ map: zt, transparent: true, depthWrite: false, opacity: 0 }));
      this.zs.push(z);
      this.root.add(z);
    }

    this.trunk.scale.setScalar(1.3);
    this.trunk.position.y = -0.05;
    this.body.add(this.trunk);
    this.body.add(this.head);
    this.root.add(this.body);
  }

  /** Look toward a point in the fairy's own view: x, y from -1 to 1. */
  lookAt(x: number, y: number, holdSeconds = 2.5) {
    this.lookTarget.set(Math.max(-1, Math.min(1, x)), Math.max(-1, Math.min(1, y)));
    this.lookUntil = this.t + holdSeconds;
  }

  update(dt: number) {
    this.t += dt;
    const t = this.t;
    const m = this.mood;
    const asleep = m === "sleep";
    this.sleepAmt += ((asleep ? 1 : 0) - this.sleepAmt) * Math.min(1, dt * 1.6);
    const s = this.sleepAmt;
    const awake = 1 - s;

    // where she looks: the last tap, or now and then a little glance around
    if (t > this.lookUntil) {
      if (m === "thinking") this.lookTarget.set(0.55, 0.75);
      else if (m === "sad") this.lookTarget.set(0, -0.7);
      else if (Math.floor(t / 4) % 3 === 2) this.lookTarget.set(Math.sin(t * 0.7) * 0.4, 0.05);
      else this.lookTarget.set(0, 0);
    }
    this.look.lerp(this.lookTarget, Math.min(1, dt * 8));

    // ---- whole body: hover and bob when awake; lie curled on the floor when asleep ----
    const bobAmp = m === "happy" ? 0.16 : m === "sad" ? 0.03 : 0.08;
    const bobSpeed = m === "happy" ? 5 : 2.2;
    const hover = Math.sin(t * bobSpeed) * bobAmp;
    // asleep she lies on the floor of the screen: head on the left, resting on her hands
    this.body.position.y = awake * (0.25 + hover) + s * 0.3;
    this.body.position.x = s * 1.25;
    // curl up: lie on her side, facing the viewer
    this.body.rotation.z = s * (Math.PI / 2) * 0.92 + awake * (m === "asking" ? 0.06 : m === "thinking" ? -0.05 : Math.sin(t * 1.1) * 0.03);
    this.body.rotation.x = 0;
    this.body.rotation.y = awake * this.look.x * 0.12;
    const breathe = 1 + Math.sin(t * (asleep ? 1.4 : 2.6)) * (asleep ? 0.025 : 0.012);
    this.body.scale.set(1, breathe, 1);

    // ---- head ----
    this.head.rotation.y = awake * this.look.x * 0.28;
    this.head.rotation.x = awake * (-this.look.y * 0.3 + (m === "sad" ? 0.25 : 0)) + s * 0.1;
    this.head.rotation.z = awake * (m === "asking" ? 0.28 : m === "thinking" ? -0.18 : m === "sad" ? 0.08 : Math.sin(t * 0.9) * 0.05) + s * 0.12;

    // ---- eyes ----
    this.blinkAt -= dt;
    if (this.blinkAt <= 0) {
      this.blink = 0.16;
      this.blinkAt = 2.5 + Math.random() * 3;
    }
    this.blink = Math.max(0, this.blink - dt);
    const blinkClose = this.blink > 0 ? Math.sin((this.blink / 0.16) * Math.PI) : 0;
    const happyEyes = m === "happy";
    const shut = asleep || m === "yawn";
    const closed = asleep || m === "yawn" ? 1 : m === "sad" ? 0.3 : 0;
    for (const e of this.eyes) {
      e.iris.position.x = this.look.x * 0.075;
      e.iris.position.y = this.look.y * 0.065;
      const sc = (e.root as THREE.Group & { sclera?: THREE.Mesh }).sclera;
      if (sc) sc.visible = !happyEyes && !shut;
      const c = Math.max(closed, blinkClose);
      // lid rotates down from the top of the eye
      e.lid.rotation.x = -1.5 + c * 1.45;
      e.lid.visible = !happyEyes && !shut;
      e.happyArc.visible = happyEyes || shut;
      // "^" for happy, a soft downward curve for sleepy
      e.happyArc.rotation.z = shut ? Math.PI : 0;
      e.happyArc.position.y = shut ? 0.02 : -0.02;
      e.iris.visible = !happyEyes && !shut;
      e.root.scale.y = m === "asking" ? 1.08 : 1;
    }
    this.brows.forEach((b, i) => {
      b.visible = !asleep;
      const side = i === 0 ? -1 : 1;
      const tilt = m === "sad" ? side * -0.35 : m === "asking" ? side * 0.2 : m === "thinking" ? (side > 0 ? 0.25 : -0.05) : 0;
      b.rotation.z = Math.PI / 2 + tilt;
      b.position.y = 0.33 + (m === "asking" ? 0.08 : m === "sad" ? 0.02 : 0);
    });

    // ---- mouth ----
    const talking = m === "talk";
    const open = talking ? 0.35 + Math.abs(Math.sin(t * 11)) * 0.65 : m === "yawn" ? 0.6 + Math.sin(Math.min(t % 3, 1.5) * 2) * 0.6 : m === "asking" ? 0.45 : 0;
    this.grin.visible = m === "happy";
    this.mouthOpen.visible = open > 0.05 && !asleep;
    this.mouthOpen.scale.set(m === "yawn" ? 0.8 : 1, 0.25 + open * 0.75, 0.3);
    this.smile.visible = !this.mouthOpen.visible && m !== "sad" && m !== "happy";
    this.frown.visible = m === "sad";
    this.smile.scale.setScalar(asleep ? 0.6 : 1);

    // tear for sad
    this.tear.visible = m === "sad";
    if (m === "sad") {
      const k = (t * 0.6) % 1;
      this.tear.position.set(-0.42, -0.25 - k * 0.5, 0.86);
      (this.tear.material as THREE.MeshStandardMaterial).opacity = 0.9 * (1 - k);
    }

    // ---- arms and legs ----
    const wave = m === "happy" ? Math.sin(t * 8) * 0.5 : 0;
    this.armR.rotation.z = awake * (m === "thinking" ? 2.5 : m === "asking" ? 1.2 : m === "happy" ? 2.6 + wave : 0.35 + Math.sin(t * 2.2) * 0.06) + s * 2.3;
    this.armR.rotation.x = awake * (m === "thinking" ? -0.9 : 0);
    this.armL.rotation.z = awake * (m === "happy" ? -2.6 - wave : m === "sad" ? -0.15 : -0.35 - Math.sin(t * 2.2) * 0.06) + s * -2.1;
    this.armL.rotation.x = s * -0.6;
    // knees up when curled
    this.legL.rotation.x = s * -1.6 + awake * Math.sin(t * 2.2) * 0.12;
    this.legR.rotation.x = s * -1.4 + awake * Math.sin(t * 2.2 + 1) * 0.12;

    // ---- wings: flutter fast when happy, slow when sad, folded and still asleep ----
    const speed = m === "happy" ? 26 : m === "sad" ? 6 : 16;
    const flap = Math.sin(t * speed) * (m === "sad" ? 0.15 : 0.32);
    this.wings.forEach((w, i) => {
      const side = i === 0 ? -1 : 1;
      w.rotation.y = side * (awake * (0.35 + flap) + s * 1.2);
      w.visible = true;
    });

    // ---- glow and sparkles ----
    (this.halo.material as THREE.SpriteMaterial).opacity = (m === "happy" ? 0.8 : m === "sad" ? 0.25 : 0.5) * (0.4 + awake * 0.6);
    this.halo.position.y = 1.25 * awake + 0.2 * s;
    const p = this.sparkles.geometry.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      let y = p.getY(i) + dt * (m === "happy" ? 0.9 : 0.35);
      if (y > 3.2) y = 0;
      p.setY(i, y);
    }
    p.needsUpdate = true;
    (this.sparkles.material as THREE.PointsMaterial).opacity = awake * (m === "sad" ? 0.2 : 0.9);

    // ---- z z z ----
    this.zs.forEach((z, i) => {
      const k = (t * 0.35 + i / 3) % 1;
      z.position.set(0.9 + k * 0.6, 0.6 + k * 1.4, 0.3);
      z.scale.setScalar(0.25 + k * 0.35);
      (z.material as THREE.SpriteMaterial).opacity = s * Math.sin(k * Math.PI) * 0.9;
    });
  }
}

/** One fairy drawn into a canvas. Pauses itself when not on screen. */
export class FairyStage {
  readonly rig = new FairyRig();
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  private clock = new THREE.Clock();
  private raf = 0;
  private visible = true;
  private io?: IntersectionObserver;
  private ro?: ResizeObserver;

  constructor(private canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "low-power" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.camera.position.set(0, 1.4, 9);
    this.camera.lookAt(0, 1.3, 0);
    this.scene.add(new THREE.HemisphereLight(0xfff4e6, 0x6b8a7a, 1.6));
    const key = new THREE.DirectionalLight(0xffffff, 1.5);
    key.position.set(2, 4, 5);
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0xbff5e6, 1.2);
    rim.position.set(-3, 2, -4);
    this.scene.add(rim);
    this.scene.add(this.rig.root);
    this.resize();
    this.io = new IntersectionObserver((es) => {
      this.visible = es.some((e) => e.isIntersecting);
      if (this.visible) this.start();
    });
    this.io.observe(canvas);
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(canvas);
    this.start();
  }

  resize() {
    const w = this.canvas.clientWidth || 120;
    const h = this.canvas.clientHeight || 140;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  /** Tap anywhere on the page: she looks at that point. */
  lookAtClient(cx: number, cy: number) {
    const r = this.canvas.getBoundingClientRect();
    const dx = (cx - (r.left + r.width / 2)) / Math.max(r.width, 1);
    const dy = -(cy - (r.top + r.height * 0.3)) / Math.max(r.height, 1);
    const d = Math.hypot(dx, dy) || 1;
    // far taps saturate; close ones are gentle
    const k = Math.min(1, d / 1.5);
    this.rig.lookAt((dx / d) * k * 1.2, (dy / d) * k * 1.2);
  }

  /** Asleep, the camera comes down to the floor so she lies along the bottom of a wide, short box. */
  private aim() {
    const s = this.rig.sleepiness;
    const wide = this.camera.aspect > 1.2 ? 1 : 0;
    const k = s * wide;
    this.camera.position.set(0.3 * k, 1.4 - 0.95 * k, 9 - 4.2 * k);
    this.camera.lookAt(0.3 * k, 1.3 - 0.98 * k, 0);
  }

  private frame = () => {
    this.raf = 0;
    if (!this.visible || document.hidden) return;
    const dt = Math.min(this.clock.getDelta(), 0.05);
    this.rig.update(dt);
    this.aim();
    this.renderer.render(this.scene, this.camera);
    this.raf = requestAnimationFrame(this.frame);
  };

  start() {
    if (this.raf) return;
    this.clock.getDelta();
    this.raf = requestAnimationFrame(this.frame);
  }

  /** Draw one frame now (for tests and still pictures). */
  renderNow(advance = 0) {
    this.rig.update(advance);
    this.aim();
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    this.io?.disconnect();
    this.ro?.disconnect();
    this.renderer.dispose();
  }
}

export function webglOk() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}
