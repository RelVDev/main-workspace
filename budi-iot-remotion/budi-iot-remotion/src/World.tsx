import React from 'react';
import {Budi} from './Budi';
import {Timeline} from './timeline';
import {cameraAt} from './camera';
import {budiAt, SC} from './choreo';
import {Campus, Ground, Sky, Tree, GROUND_Y} from './Scenery';
import {
  AirConditioner,
  Bed,
  Blanket,
  Checks,
  Clock,
  CoolAir,
  CoolTint,
  Desk,
  HoloCard,
  Hook,
  HouseBack,
  HouseFront,
  Iron,
  KlikText,
  Lamp,
  ModuleChips,
  RouterPackets,
  Router,
  SIRA,
  SensorLabels,
  SiraSignal,
  SmartPlug,
  Sparkles,
  SunBeam,
  WindowFrame,
} from './Room';
import {
  BenefitBadges,
  Burst,
  CloudNet,
  ExclMark,
  IotLabels,
  NetLinks,
  PhonePanel,
  PhoneTitle,
  PhoneWifi,
  Puff,
  ThoughtBubble,
} from './Net';
import {blanketFrontAt} from './state';
import {bump, prog} from './util';

export const World: React.FC<{t: number; T: Timeline}> = ({t, T}) => {
  const cam = cameraAt(t, T);
  const shake = bump(t, T.s(4), T.at(4, 0.6)) * Math.sin(t * 55) * 5;
  const b = budiAt(t, T);
  const tr = `translate(540 ${960 + shake}) scale(${cam.z}) translate(${-cam.x} ${-cam.y})`;
  const front = blanketFrontAt(t, T);
  const budi = (
    <Budi
      x={b.x}
      y={b.y}
      scale={SC}
      flip={b.flip}
      rot={b.rot}
      pose={b.pose}
      expr={b.expr}
      look={b.look}
      kemeja={b.kemeja}
      tas={b.tas}
      phone={b.phone}
      pale={b.pale}
      sweat={b.sweat}
      t={t}
    />
  );
  const s4 = T.s(4);
  const burstK = prog(t, s4, s4 + 0.15) * (1 - prog(t, T.e(4) - 0.15, T.e(4)));
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{display: 'block'}}>
      <g transform={tr}>
        <Sky t={t} />
        <Campus t={t} />
        <Ground t={t} />
        <Tree x={40} s={0.95} t={t} />
        <Tree x={1450} s={0.9} t={t} />
        <Tree x={2130} s={1.05} t={t} />
        <HouseBack t={t} T={T} />
        <SunBeam />
        <WindowFrame t={t} T={T} />
        <Bed t={t} T={T} />
        <Clock t={t} T={T} />
        <Hook t={t} T={T} />
        <Desk t={t} T={T} />
        <Iron t={t} T={T} />
        <SmartPlug t={t} T={T} />
        <Router t={t} T={T} />
        <Lamp t={t} T={T} />
        <SIRA t={t} T={T} />
        <AirConditioner t={t} T={T} />
        <ModuleChips t={t} T={T} />
        <CoolAir t={t} T={T} />
        <CoolTint t={t} T={T} />
        <HouseFront t={t} T={T} />
        {!front ? <Blanket /> : null}
        <Burst x={445} y={960} k={burstK} rot={t * 20} r={190} />
        {b.shadow > 0.01 ? <ellipse cx={b.x} cy={GROUND_Y + 2} rx={58} ry={9} fill="#000" opacity={0.22 * b.shadow} /> : null}
        {budi}
        {front ? <Blanket /> : null}
        <ExclMark x={540} y={880} k={prog(t, T.at(1, 0.3), T.at(1, 0.45)) * (1 - prog(t, T.s(2), T.at(2, 0.2)))} />
        <Puff x={640} y={1010} k={prog(t, T.at(13, 0.12), T.at(13, 0.12) + 0.5)} r={110} />
        <Puff x={1790} y={GROUND_Y - 12} k={prog(t, T.at(15, 0.5), T.at(15, 0.5) + 0.7)} r={80} />
        <SensorLabels t={t} T={T} />
        <HoloCard t={t} T={T} />
        <SiraSignal t={t} T={T} />
        <RouterPackets t={t} T={T} />
        <ThoughtBubble t={t} T={T} />
        <CloudNet t={t} T={T} />
        <PhoneTitle k={prog(t, T.at(21, 0.3), T.at(21, 0.4))} />
        <NetLinks t={t} T={T} />
        <PhonePanel t={t} T={T} />
        <PhoneWifi t={t} T={T} />
        <KlikText t={t} T={T} />
        <Checks t={t} T={T} />
        <IotLabels t={t} T={T} />
        <BenefitBadges t={t} T={T} anchorX={Math.max(1900, b.x + 40)} />
        {t > T.at(12, 0.2) && t < T.at(13, 0.1) ? <Sparkles cx={b.x} cy={1000} t={t} /> : null}
        {t > T.at(28, 0.1) ? <Sparkles cx={b.x} cy={980} t={t} n={7} r={150} /> : null}
      </g>
    </svg>
  );
};
