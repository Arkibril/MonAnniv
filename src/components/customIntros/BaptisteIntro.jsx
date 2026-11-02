import React, { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import {
  sfxWoaf,
  sfxFlashCharge,
  sfxShutter,
  sfxHitmarker,
  sfxAirhorn,
  sfxWow,
  hitmarkerBurst,
  setMuted,
  isMuted
} from '../../themes/heist/sound';
import './BaptisteIntro.css';

// =============================================================================
// Intro de Baptiste : le chien du logo de son asso se retourne, fait "WOAF",
// prend une photo (FLASH)… et tout part en vidéo "MLG / YouTube 2015" :
// hitmarkers, klaxons, lunettes pixel, triangle à œil, textes arc-en-ciel,
// viseur de caméscope REC. Tout est dessiné ici, sauf le logo (public/baptiste).
// =============================================================================

const LOGO = '/baptiste/logo-chien.png';
// Fichiers que Jibril dépose lui-même dans public/baptiste/ (optionnels) :
// le son MLG (le drop tombe pile sur le flash) et la vidéo fond vert
// dont on retire le vert en direct pour l'incruster pendant le chaos.
const SONG = '/baptiste/son.mp3';
const GREEN = '/baptiste/greenscreen.mp4';
const WOUF = '/baptiste/wouf.mp3';
const DROP = 17.4; // seconde du drop dans le son
const FLASH_AT = 4.4; // seconde du flash après le clic
const BEAT = 0.69; // tempo du drop

// Retire le fond vert d'une image de la vidéo (incrustation)
function keyGreen(data) {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const m = r > b ? r : b;
    const diff = g - m;
    if (g > 90 && diff > 40) {
      data[i + 3] = 0;
    } else if (diff > 10) {
      data[i + 3] = 255 - ((diff - 10) * 255) / 30;
      data[i + 1] = m; // enlève le reflet vert
    }
  }
}

const WORDS = [
  'WOAF', 'WOW', 'SUCH PHOTO', 'VERY FLASH', 'MUCH 4K', '360 NO SCOPE', 'GET REKT',
  'BAPTISTE.EXE', '+1000 XP', 'OH BABY A TRIPLE', 'MLG PRO', '#REKT', '1V1 ME BRO',
  'HEADSHOT 📸', 'FAOW', 'WO-WO-WOAF', 'CHEESE', 'FOCUS AUTO', 'ISO 9000', 'NO FILTER',
  'TRIPOD GANG', 'SHUTTER SPEED 1/∞', 'DOGGO DIRECTOR', 'EPIC', 'ULTRA HD', 'FPS: 420'
];
const EMOJIS = ['🔥', '💯', '😂', '👌', '📸', '🎥', '🌭', '🎬', '💥', '😎', '🐶', '🥤'];
const COLORS = ['#ff0040', '#00e5ff', '#ffe600', '#00ff5e', '#ff00e6', '#ffffff', '#ff8a00'];

const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Le chien vu de face, dans le même style que le logo (dessin original)
function FrontDog() {
  return (
    <svg className="bp-front" viewBox="0 0 300 380" aria-hidden="true">
      <g stroke="#000" strokeWidth="9" strokeLinejoin="round" strokeLinecap="round">
        {/* queue qui remue */}
        <path className="bp-front__tail" d="M200,290 Q262,284 268,236" fill="none" />
        {/* pattes arrière */}
        <rect x="104" y="300" width="38" height="58" rx="17" fill="#fff" />
        <rect x="158" y="300" width="38" height="58" rx="17" fill="#fff" />
        {/* corps */}
        <rect x="92" y="160" width="116" height="178" rx="54" fill="#fff" />
        {/* tête */}
        <g className="bp-front__head">
          <rect x="68" y="34" width="164" height="140" rx="64" fill="#fff" />
          <rect x="42" y="66" width="46" height="112" rx="22" fill="#fff" className="bp-front__ear bp-front__ear--l" />
          <rect x="212" y="66" width="46" height="112" rx="22" fill="#fff" className="bp-front__ear bp-front__ear--r" />
          <circle cx="124" cy="98" r="9" fill="#000" stroke="none" />
          <circle cx="176" cy="98" r="9" fill="#000" stroke="none" />
          <circle cx="127" cy="95" r="2.6" fill="#fff" stroke="none" />
          <circle cx="179" cy="95" r="2.6" fill="#fff" stroke="none" />
          <ellipse cx="150" cy="126" rx="17" ry="11" fill="#000" stroke="none" />
          <path className="bp-front__mouth-closed" d="M132,146 Q141,155 150,145 Q159,155 168,146" fill="none" strokeWidth="6" />
          <ellipse className="bp-front__mouth-open" cx="150" cy="155" rx="15" ry="14" fill="#7a0f1d" strokeWidth="6" />
          {/* lunettes pixel (cachées au début) */}
          <g className="bp-shades" stroke="none">
            <rect x="92" y="84" width="116" height="10" fill="#000" />
            <rect x="96" y="94" width="44" height="12" fill="#000" />
            <rect x="160" y="94" width="44" height="12" fill="#000" />
            <rect x="102" y="106" width="32" height="8" fill="#000" />
            <rect x="166" y="106" width="32" height="8" fill="#000" />
            <rect x="102" y="94" width="8" height="6" fill="#fff" />
            <rect x="110" y="100" width="8" height="6" fill="#fff" />
            <rect x="166" y="94" width="8" height="6" fill="#fff" />
            <rect x="174" y="100" width="8" height="6" fill="#fff" />
          </g>
        </g>
        {/* appareil photo tenu face à nous */}
        <g className="bp-cam">
          <rect x="84" y="200" width="30" height="36" rx="14" fill="#fff" />
          <rect x="186" y="200" width="30" height="36" rx="14" fill="#fff" />
          <rect x="116" y="176" width="36" height="22" rx="6" fill="#fff" />
          <rect className="bp-cam__bulb" x="123" y="181" width="22" height="11" rx="3" fill="#ffe36b" strokeWidth="0" />
          <rect x="100" y="192" width="100" height="66" rx="13" fill="#fff" />
          <circle cx="158" cy="225" r="24" fill="#fff" />
          <circle cx="158" cy="225" r="11" fill="#000" stroke="none" />
          <circle cx="162" cy="221" r="3.5" fill="#fff" stroke="none" />
        </g>
      </g>
    </svg>
  );
}

function Illuminati() {
  return (
    <svg className="bp-illu" viewBox="0 0 120 104" aria-hidden="true">
      <path d="M60,4 L116,100 L4,100 Z" fill="#00e85a" stroke="#000" strokeWidth="5" strokeLinejoin="round" />
      <path d="M32,68 Q60,42 88,68 Q60,92 32,68 Z" fill="#fff" stroke="#000" strokeWidth="4" />
      <circle cx="60" cy="68" r="9" fill="#000" />
    </svg>
  );
}

export default function BaptisteIntro({ guest, onComplete, isReplay = false }) {
  const rootRef = useRef(null);
  const chaosRef = useRef(null);
  const timersRef = useRef([]);
  const doneRef = useRef(false);
  const [phase, setPhase] = useState('start'); // start | show | chaos | end
  const [muted, setMutedState] = useState(isMuted());
  const [loading, setLoading] = useState(false);
  const songRef = useRef(null);
  const woufOkRef = useRef(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const name = (guest?.first_name || 'Baptiste').trim();

  const later = (fn, ms) => timersRef.current.push(setTimeout(fn, ms));
  const every = (fn, ms) => timersRef.current.push(setInterval(fn, ms));
  const clearAll = () => {
    timersRef.current.forEach((t) => {
      clearTimeout(t);
      clearInterval(t);
    });
    timersRef.current = [];
  };
  const stopSong = () => {
    const el = songRef.current;
    songRef.current = null;
    if (!el) return;
    let v = el.volume;
    const fade = setInterval(() => {
      v -= 0.08;
      if (v <= 0) {
        clearInterval(fade);
        el.pause();
        el.removeAttribute('src');
        el.load();
      } else el.volume = v;
    }, 40);
  };
  useEffect(() => () => {
    clearAll();
    stopSong();
  }, []);

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    clearAll();
    stopSong();
    onComplete?.();
  }, [onComplete]);

  // ------------------------------------------------------------ éléments "dank"
  const spawnWord = () => {
    const box = chaosRef.current;
    if (!box) return;
    const el = document.createElement('span');
    const emoji = Math.random() < 0.3;
    el.className = emoji ? 'bp-float bp-float--emoji' : `bp-float bp-float--${pick(['impact', 'comic', 'outline'])}`;
    el.textContent = emoji ? pick(EMOJIS) : pick(WORDS);
    el.style.left = `${rand(4, 86)}%`;
    el.style.top = `${rand(8, 86)}%`;
    el.style.color = pick(COLORS);
    el.style.fontSize = `${emoji ? rand(40, 90) : rand(22, 54)}px`;
    box.appendChild(el);
    gsap.fromTo(
      el,
      { scale: 0, rotate: rand(-40, 40) },
      {
        scale: rand(0.9, 1.4),
        rotate: rand(-18, 18),
        duration: 0.22,
        ease: 'back.out(3)',
        onComplete: () =>
          gsap.to(el, { scale: 0, opacity: 0, rotate: rand(-90, 90), duration: 0.25, delay: rand(0.4, 0.9), onComplete: () => el.remove() })
      }
    );
  };

  const spawnHit = () => {
    const box = chaosRef.current;
    if (!box) return;
    const r = box.getBoundingClientRect();
    hitmarkerBurst(rand(r.width * 0.25, r.width * 0.75), rand(r.height * 0.25, r.height * 0.7), box);
    sfxHitmarker();
  };

  const shake = (amount = 14) => {
    const stage = rootRef.current?.querySelector('.bp-stage');
    if (!stage) return;
    gsap.fromTo(stage, { x: rand(-amount, amount), y: rand(-amount, amount) }, { x: 0, y: 0, duration: 0.3, ease: 'elastic.out(1, 0.3)' });
  };

  // ------------------------------------------------------------ séquence
  // Aboiement : le vrai son s'il est là, sinon l'aboiement synthétisé
  const bark = (rate = 1) => {
    if (!woufOkRef.current) {
      sfxWoaf(0, rate);
      return;
    }
    const a = new Audio(WOUF);
    a.playbackRate = rate;
    a.preservesPitch = false;
    a.volume = 0.9;
    a.muted = isMuted();
    a.play().catch(() => sfxWoaf(0, rate));
  };

  const start = async () => {
    if (loading) return;
    setLoading(true);
    const probe = new Audio(WOUF);
    probe.preload = 'auto';
    probe.addEventListener('canplaythrough', () => { woufOkRef.current = true; }, { once: true });
    probe.load();
    // Le son démarre juste avant son drop, pour que le drop tombe sur le flash
    const el = new Audio(`${SONG}#t=${(DROP - FLASH_AT).toFixed(2)}`);
    el.volume = 0.75;
    el.muted = isMuted();
    const ok = await Promise.race([
      el.play().then(() => true, () => false),
      new Promise((r) => setTimeout(() => r(false), 2500))
    ]);
    if (ok) {
      if (Math.abs(el.currentTime - (DROP - FLASH_AT)) > 0.5) el.currentTime = DROP - FLASH_AT;
      songRef.current = el;
      el.addEventListener('ended', () => {
        if (songRef.current === el) songRef.current = null;
      });
    } else {
      el.pause();
    }
    setLoading(false);
    setPhase('show');
  };

  useEffect(() => {
    if (phase !== 'show') return undefined;
    const root = rootRef.current;
    if (reduced) {
      bark(1);
      later(() => setPhase('end'), 900);
      return undefined;
    }
    const q = (s) => root.querySelector(s);
    const tl = gsap.timeline();
    // 1. le logo arrive en rebondissant
    tl.fromTo('.bp-logo', { scale: 0, rotate: -30 }, { scale: 1, rotate: 0, duration: 0.6, ease: 'back.out(2.2)' }, 0);
    tl.to('.bp-logo', { rotate: 4, duration: 0.12, yoyo: true, repeat: 3, ease: 'sine.inOut' }, 0.75);
    // 2. il se retourne vers nous
    tl.to('.bp-logo', { scaleX: 0, duration: 0.16, ease: 'power2.in' }, 1.35);
    tl.set('.bp-logo', { display: 'none' }, 1.51);
    tl.set('.bp-front', { display: 'block' }, 1.51);
    tl.fromTo('.bp-front', { scaleX: 0 }, { scaleX: 1, duration: 0.22, ease: 'back.out(2.5)' }, 1.51);
    // 3. WOAF
    tl.call(() => {
      root.classList.add('bp--bark');
      bark(1);
      shake(10);
    }, null, 2.0);
    tl.fromTo('.bp-bubble', { scale: 0, rotate: -12 }, { scale: 1, rotate: -4, duration: 0.3, ease: 'back.out(3)' }, 2.0);
    tl.fromTo('.bp-front__head', { rotate: 0, y: 0 }, { rotate: -6, y: -8, duration: 0.1, yoyo: true, repeat: 1 }, 2.0);
    tl.call(() => root.classList.remove('bp--bark'), null, 2.3);
    tl.call(() => {
      root.classList.add('bp--bark');
      bark(1.25);
      setTimeout(() => bark(1.45), 180);
    }, null, 2.55);
    tl.call(() => root.classList.remove('bp--bark'), null, 2.95);
    tl.to('.bp-bubble', { scale: 0, duration: 0.18, ease: 'power2.in' }, 3.15);
    // 4. il lève l'appareil, le flash se charge
    tl.fromTo('.bp-cam', { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: 'back.out(2)' }, 3.1);
    tl.call(sfxFlashCharge, null, 3.5);
    tl.to('.bp-cam__bulb', { fill: '#ffffff', duration: 0.1, yoyo: true, repeat: 7 }, 3.5);
    tl.to('.bp-front', { scale: 1.06, duration: 0.8, ease: 'power1.in' }, 3.5);
    // 5. FLASH
    tl.call(() => {
      sfxShutter();
      setPhase('chaos');
    }, null, 4.4);
    return () => tl.kill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, reduced]);

  useEffect(() => {
    if (phase !== 'chaos') return undefined;
    const root = rootRef.current;
    const tl = gsap.timeline({ onComplete: () => setPhase('end') });
    const song = Boolean(songRef.current);
    const len = song ? 10.2 : 7; // avec le son : jusqu'à la fin du morceau
    tl.fromTo('.bp-flash', { opacity: 1 }, { opacity: 0, duration: 1.1, ease: 'power2.in' }, 0);
    if (!song) tl.call(() => sfxAirhorn(0), null, 0.15);
    // lunettes pixel qui tombent
    tl.fromTo('.bp-shades', { y: -260, opacity: 1 }, { y: 0, duration: 0.7, ease: 'bounce.out' }, 0.5);
    tl.fromTo('.bp-deal', { scale: 0 }, { scale: 1, duration: 0.25, ease: 'back.out(3)' }, 1.2);
    // zooms brutaux façon YTP
    const punches = song
      ? [2, 4, 6, 8, 10, 12].map((k) => k * BEAT)
      : [1.6, 2.6, 3.6, 4.6];
    punches.forEach((t, i) => {
      tl.to('.bp-dog-wrap', { scale: 1.7, rotate: i % 2 ? 12 : -12, duration: 0.08, ease: 'power4.out' }, t);
      tl.to('.bp-dog-wrap', { scale: 1, rotate: 0, duration: 0.35, ease: 'expo.out' }, t + 0.32);
      tl.call(() => {
        bark(0.8 + (i % 4) * 0.2);
        shake(22);
      }, null, t);
    });
    const spinAt = song ? 9.2 : 5.2;
    tl.to('.bp-dog-wrap', { rotate: 360, duration: 0.7, ease: 'power3.inOut' }, spinAt);
    if (!song) tl.call(() => sfxWow(0), null, spinAt);
    tl.fromTo('.bp-illu', { scale: 0, rotate: -180 }, { scale: 1, rotate: 0, duration: 0.6, ease: 'back.out(2)' }, 2.2);
    tl.to('.bp-illu', { scale: 0, duration: 0.3 }, 4.2);
    if (song) {
      tl.fromTo('.bp-illu', { scale: 0, rotate: -180 }, { scale: 1.2, rotate: 0, duration: 0.6, ease: 'back.out(2)', immediateRender: false }, 6.2);
      tl.to('.bp-illu', { scale: 0, duration: 0.3 }, 8.2);
    } else {
      tl.call(() => sfxAirhorn(0), null, 6.1);
    }
    tl.to({}, { duration: 0.1 }, len - 0.1);

    // Vidéo fond vert incrustée par-dessus
    const video = videoRef.current;
    const canvas = canvasRef.current;
    let raf = 0;
    if (video && canvas) {
      const ctx2d = canvas.getContext('2d', { willReadFrequently: true });
      const draw = () => {
        if (video.readyState >= 2 && video.videoWidth) {
          if (canvas.width !== video.videoWidth) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
          }
          ctx2d.drawImage(video, 0, 0);
          const frame = ctx2d.getImageData(0, 0, canvas.width, canvas.height);
          keyGreen(frame.data);
          ctx2d.putImageData(frame, 0, 0);
          canvas.classList.add('bp-gs--on');
        }
        raf = requestAnimationFrame(draw);
      };
      video.currentTime = 0;
      video.play().then(() => { raf = requestAnimationFrame(draw); }, () => {});
    }

    every(spawnWord, 140);
    every(spawnHit, 420);
    later(() => clearAll(), len * 1000);
    void root;
    return () => {
      tl.kill();
      clearAll();
      cancelAnimationFrame(raf);
      video?.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => {
    if (phase !== 'end' || reduced) return undefined;
    const ctx = gsap.context(() => {
      gsap.fromTo('.bp-end [data-pop]', { scale: 0, rotate: () => rand(-20, 20) }, { scale: 1, rotate: 0, duration: 0.4, ease: 'back.out(2.5)', stagger: 0.08 });
    }, rootRef.current);
    // il reste quelques hitmarkers de temps en temps
    every(() => Math.random() < 0.5 && spawnWord(), 900);
    return () => {
      ctx.revert();
      clearAll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, reduced]);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
    if (songRef.current) songRef.current.muted = next;
  };

  return (
    <div className={`bp-intro bp-intro--${phase}`} ref={rootRef} role="dialog" aria-modal="true" aria-label={`Bienvenue ${name}`}>
      <div className="bp-stage">
        {(phase === 'chaos' || phase === 'end') && <div className="bp-rainbow" aria-hidden="true" />}

        {/* viseur de caméscope */}
        <div className="bp-viewfinder" aria-hidden="true">
          <span className="bp-vf bp-vf--tl" />
          <span className="bp-vf bp-vf--tr" />
          <span className="bp-vf bp-vf--bl" />
          <span className="bp-vf bp-vf--br" />
          <span className="bp-rec"><i /> REC</span>
          <span className="bp-tc">00:00:06:09</span>
          <span className="bp-res">4K · 60 FPS</span>
          <span className="bp-batt" />
        </div>

        {(phase === 'show' || phase === 'chaos') && (
          <>
            <video ref={videoRef} className="bp-gs-src" src={GREEN} muted loop playsInline preload="auto" aria-hidden="true" />
            <canvas ref={canvasRef} className="bp-gs" aria-hidden="true" />
          </>
        )}
        <div className="bp-chaos" ref={chaosRef} aria-hidden="true" />

        {phase === 'start' && (
          <div className="bp-start">
            <div className="bp-badge">
              <img src={LOGO} alt="" draggable="false" />
            </div>
            <p className="bp-start__hi">Salut {name} 📸</p>
            <button type="button" className="bp-btn" onClick={start} disabled={loading} autoFocus>
              {loading ? 'Chargement…' : isReplay ? 'Encore une photo' : 'Dis « cheese »'}
            </button>
            <p className="bp-start__hint">Monte le son. Vraiment.</p>
          </div>
        )}

        {(phase === 'show' || phase === 'chaos') && (
          <div className="bp-scene">
            <div className="bp-dog-wrap">
              <img className="bp-logo" src={LOGO} alt="" draggable="false" />
              <FrontDog />
              <div className="bp-bubble" aria-hidden="true">WOAF !</div>
              <div className="bp-deal" aria-hidden="true">DEAL WITH IT</div>
            </div>
            <Illuminati />
          </div>
        )}

        {phase === 'end' && (
          <div className="bp-end">
            <div className="bp-end__dog" data-pop>
              <FrontDog />
            </div>
            <h1 className="bp-end__title" data-pop>
              BAPTISTE
              <span>a été pris en photo</span>
            </h1>
            <p className="bp-end__sub" data-pop>Maintenant, le quiz de l'anniv de Jibril. 360 no scope.</p>
            <button type="button" className="bp-btn" data-pop onClick={finish} autoFocus>
              Lancer le quiz 🎯
            </button>
          </div>
        )}
      </div>

      <div className="bp-flash" aria-hidden="true" />

      <button type="button" className="bp-mute" onClick={toggleMute} aria-label={muted ? 'Activer le son' : 'Couper le son'}>
        {muted ? '🔇' : '🔊'}
      </button>
      {(phase === 'show' || phase === 'chaos') && (
        <button type="button" className="bp-skip" onClick={() => { clearAll(); setPhase('end'); }}>
          Passer
        </button>
      )}
    </div>
  );
}
