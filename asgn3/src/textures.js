(function initTextures(globalScope) {
  function isPowerOfTwo(value) {
    return (value & (value - 1)) === 0;
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Failed to load texture: ${src}`));
      image.src = src;
    });
  }

  async function loadTextureSet(gl, textureDefinitions) {
    const textureEntries = await Promise.all(
      textureDefinitions.map(async (definition, index) => {
        const image = await loadImage(definition.src);
        const texture = gl.createTexture();

        if (!texture) {
          throw new Error(`Failed to create texture for ${definition.name}.`);
        }

        gl.activeTexture(gl.TEXTURE0 + index);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

        if (isPowerOfTwo(image.width) && isPowerOfTwo(image.height)) {
          gl.generateMipmap(gl.TEXTURE_2D);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        } else {
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        }

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        return {
          ...definition,
          texture,
          unit: index,
        };
      }),
    );

    return Object.freeze(textureEntries);
  }

  const api = Object.freeze({
    loadTextureSet,
  });

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  Object.assign(globalScope, api);
}(typeof globalThis !== "undefined" ? globalThis : this));
