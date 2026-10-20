// Moteur de rendu Chroma Key (Détourage Fond Vert en temps réel) avec WebGL & fallback 2D
// Réalisé pour détacher l'explosion green-screen avec suppression des reflets verts (despill)

export function playChromaKeyVideo({
  videoSrc = '/lenaik/videoplayback.mp4',
  canvas,
  onPeak, // Déclenché au pic de l'explosion
  onEnded // Déclenché à la fin de la vidéo
}) {
  if (!canvas) return () => {};

  const video = document.createElement('video');
  video.src = videoSrc;
  video.muted = true;
  video.volume = 0;
  video.playsInline = true;
  video.crossOrigin = 'anonymous';
  video.preload = 'auto';

  let animationId;
  let isCancelled = false;
  let peakTriggered = false;

  // Initialisation WebGL pour un détourage à 60/120 FPS ultra-fluide sur GPU
  let gl = canvas.getContext('webgl', { premultipliedAlpha: false, alpha: true });
  let useWebGL = !!gl;

  // Vertex Shader
  const vsSource = `
    attribute vec2 a_position;
    attribute vec2 a_texCoord;
    varying vec2 v_texCoord;
    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
      v_texCoord = a_texCoord;
    }
  `;

  // Fragment Shader avec Chroma Keying & Despill (Suppression de la bavure verte)
  const fsSource = `
    precision mediump float;
    uniform sampler2D u_image;
    varying vec2 v_texCoord;

    void main() {
      vec4 col = texture2D(u_image, v_texCoord);
      
      // Calcul du différentiel vert par rapport au rouge et au bleu
      float maxRB = max(col.r, col.b);
      float diff = col.g - maxRB;

      // Seuil de détection du vert pur avec adoucissement des contours
      float threshold = 0.07;
      float softness = 0.12;
      float alpha = 1.0 - smoothstep(threshold, threshold + softness, diff);

      // Despill : Élimination du reflet vert sur la fumée et le feu
      if (col.g > maxRB) {
        col.g = maxRB * 0.95 + col.r * 0.05;
      }

      // Rehaussement de l'éclat lumineux des flammes
      col.rgb *= 1.15;

      gl_FragColor = vec4(col.rgb, col.a * alpha);
    }
  `;

  let program, positionBuffer, texCoordBuffer, texture;

  if (useWebGL) {
    try {
      const compileShader = (type, source) => {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          console.warn('Shader compile error:', gl.getShaderInfoLog(shader));
          return null;
        }
        return shader;
      };

      const vs = compileShader(gl.VERTEX_SHADER, vsSource);
      const fs = compileShader(gl.FRAGMENT_SHADER, fsSource);

      program = gl.createProgram();
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.warn('Program link error:', gl.getProgramInfoLog(program));
        useWebGL = false;
      } else {
        gl.useProgram(program);

        // Quad plein écran
        positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
          -1, -1,
           1, -1,
          -1,  1,
          -1,  1,
           1, -1,
           1,  1
        ]), gl.STATIC_DRAW);

        const posLoc = gl.getAttribLocation(program, 'a_position');
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

        // Coordonnées de texture inversées Y
        texCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
          0, 1,
          1, 1,
          0, 0,
          0, 0,
          1, 1,
          1, 0
        ]), gl.STATIC_DRAW);

        const texLoc = gl.getAttribLocation(program, 'a_texCoord');
        gl.enableVertexAttribArray(texLoc);
        gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, 0, 0);

        texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      }
    } catch (e) {
      console.warn('WebGL init failed, falling back to 2D:', e);
      useWebGL = false;
    }
  }

  // Fallback 2D Canvas si WebGL n'est pas disponible
  const ctx2d = !useWebGL ? canvas.getContext('2d') : null;

  // Lancement de la vidéo
  video.play().catch(e => console.log('Video play catch:', e));

  // Boucle de rendu frame par frame
  function render() {
    if (isCancelled) return;

    if (video.readyState >= 2) {
      const vWidth = video.videoWidth || 1280;
      const vHeight = video.videoHeight || 720;

      if (canvas.width !== vWidth || canvas.height !== vHeight) {
        canvas.width = vWidth;
        canvas.height = vHeight;
        if (useWebGL) {
          gl.viewport(0, 0, vWidth, vHeight);
        }
      }

      if (useWebGL) {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      } else if (ctx2d) {
        ctx2d.drawImage(video, 0, 0, vWidth, vHeight);
        const imgData = ctx2d.getImageData(0, 0, vWidth, vHeight);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const maxRB = Math.max(r, b);
          if (g > maxRB && g > 60) {
            const diff = g - maxRB;
            if (diff > 25) {
              data[i + 3] = 0;
            } else {
              data[i + 3] = Math.round(data[i + 3] * (1 - diff / 25));
              data[i + 1] = maxRB;
            }
          }
        }
        ctx2d.putImageData(imgData, 0, 0);
      }

      // Pic de l'explosion déclenché après 1.2 seconde de détonation
      if (!peakTriggered && video.currentTime >= 1.2) {
        peakTriggered = true;
        if (onPeak) onPeak();
      }
    }

    if (!video.ended) {
      animationId = requestAnimationFrame(render);
    } else {
      if (onEnded) onEnded();
    }
  }

  animationId = requestAnimationFrame(render);

  return () => {
    isCancelled = true;
    cancelAnimationFrame(animationId);
    try {
      video.pause();
      video.src = '';
      video.load();
    } catch (e) {
      // Ignorer
    }
  };
}
