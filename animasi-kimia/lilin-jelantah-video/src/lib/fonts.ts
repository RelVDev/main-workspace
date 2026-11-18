import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

let loaded = false;

export const ensurePixelFonts = () => {
  if (loaded) return;
  loaded = true;
  void loadFont({
    family: 'Press Start 2P',
    url: staticFile('fonts/PressStart2P-latin.woff2'),
    weight: '400',
    display: 'block',
    unicodeRange: 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
  });
  void loadFont({
    family: 'Press Start 2P',
    url: staticFile('fonts/PressStart2P-latin-ext.woff2'),
    weight: '400',
    display: 'block',
    unicodeRange: 'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF',
  });
  void loadFont({
    family: 'Pixelify Sans',
    url: staticFile('fonts/PixelifySans-latin.woff2'),
    weight: '400 700',
    display: 'block',
    unicodeRange: 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
  });
  void loadFont({
    family: 'Pixelify Sans',
    url: staticFile('fonts/PixelifySans-latin-ext.woff2'),
    weight: '400 700',
    display: 'block',
    unicodeRange: 'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF',
  });
};

export const FONT_TITLE = '"Press Start 2P", monospace';
export const FONT_BODY = '"Pixelify Sans", sans-serif';
