import React from "react";
import { AbsoluteFill, Composition, Sequence } from "remotion";
import { Brand, Props, useBrandFonts } from "./brand";
import { Title, Pops, Phone, Desktop, End, popsDuration } from "./scenes";
import { Showreel, showreelLen } from "./showreel";
import { LogoDraw, ProductSticker, PriceTag, NewBadge, ArrowBio, Scribble } from "./stickers";
import sample from "../brands-sample.json";

const FPS = 30;
const T = 90, PH = 180, DK = 150, EN = 75, PREV_PH = 150, X = 8; // dĺžky v snímkach, X = prekrytie

const Fonts: React.FC<{ brand: Brand; children: React.ReactNode }> = ({ brand, children }) => { useBrandFonts(brand); return <>{children}</>; };

const Preview: React.FC<Props> = ({ brand, bg }) => (
  <Fonts brand={brand}><AbsoluteFill>
    <Sequence durationInFrames={T}><Title brand={brand} mode={bg} dur={T} /></Sequence>
    <Sequence from={T - X} durationInFrames={PREV_PH}><Phone brand={brand} mode={bg} dur={PREV_PH} /></Sequence>
    <Sequence from={T + PREV_PH - 2 * X} durationInFrames={EN}><End brand={brand} mode={bg} dur={EN} /></Sequence>
  </AbsoluteFill></Fonts>
);
const previewLen = T + PREV_PH + EN - 2 * X;

const Launch: React.FC<Props> = ({ brand, bg }) => {
  const P = popsDuration(brand);
  let t = 0; const at = (len: number) => { const s = t; t += len - X; return s; };
  return (
    <Fonts brand={brand}><AbsoluteFill>
      <Sequence from={at(T)} durationInFrames={T}><Title brand={brand} mode={bg} dur={T} /></Sequence>
      <Sequence from={at(P)} durationInFrames={P}><Pops brand={brand} mode={bg} /></Sequence>
      <Sequence from={at(PH)} durationInFrames={PH}><Phone brand={brand} mode={bg} dur={PH} /></Sequence>
      <Sequence from={at(DK)} durationInFrames={DK}><Desktop brand={brand} mode={bg} dur={DK} /></Sequence>
      <Sequence from={at(EN)} durationInFrames={EN}><End brand={brand} mode={bg} dur={EN} /></Sequence>
    </AbsoluteFill></Fonts>
  );
};
const launchLen = (b: Brand) => T + popsDuration(b) + PH + DK + EN - 4 * X;

const one = (C: React.FC<{ brand: Brand; mode: Props["bg"]; dur: number }>, dur: number): React.FC<Props> =>
  ({ brand, bg }) => <Fonts brand={brand}><C brand={brand} mode={bg} dur={dur} /></Fonts>;

const st = (C: React.FC<{ brand: Brand }>): React.FC<Props> => ({ brand }) => <Fonts brand={brand}><C brand={brand} /></Fonts>;

const defaults: Props = { brand: sample as Brand, bg: "brand" };
const common = { width: 1080, height: 1920, fps: FPS, defaultProps: defaults };

export const Root: React.FC = () => (
  <>
    <Composition id="Preview" component={Preview} durationInFrames={previewLen} {...common} />
    <Composition id="Launch" component={Launch} durationInFrames={launchLen(defaults.brand)} {...common}
      calculateMetadata={({ props }) => ({ durationInFrames: launchLen(props.brand) })} />
    <Composition id="Showreel" component={(p: Props) => <Fonts brand={p.brand}><Showreel {...p} /></Fonts>}
      durationInFrames={showreelLen(defaults.brand)} {...common}
      calculateMetadata={({ props }) => ({ durationInFrames: showreelLen(props.brand, props.lang) })} />
    <Composition id="Reel" component={(p: Props) => <Fonts brand={p.brand}><Showreel {...p} client /></Fonts>}
      durationInFrames={showreelLen(defaults.brand, "sk", true)} {...common}
      calculateMetadata={({ props }) => ({ durationInFrames: showreelLen(props.brand, props.lang, true) })} />
    <Composition id="Title" component={one(Title, T)} durationInFrames={T} {...common} />
    <Composition id="Pops" component={({ brand, bg }: Props) => <Fonts brand={brand}><Pops brand={brand} mode={bg} /></Fonts>}
      durationInFrames={popsDuration(defaults.brand)} {...common} calculateMetadata={({ props }) => ({ durationInFrames: popsDuration(props.brand) })} />
    <Composition id="Phone" component={one(Phone, PH)} durationInFrames={PH} {...common} />
    <Composition id="Desktop" component={one(Desktop, DK)} durationInFrames={DK} {...common} />
    <Composition id="S-Logo" component={st(LogoDraw)} durationInFrames={90} {...common} />
    <Composition id="S-Produkt" component={st(ProductSticker)} durationInFrames={90} {...common} />
    <Composition id="S-Cena" component={st(PriceTag)} durationInFrames={90} {...common} />
    <Composition id="S-New" component={st(NewBadge)} durationInFrames={75} {...common} />
    <Composition id="S-Bio" component={st(ArrowBio)} durationInFrames={75} {...common} />
    <Composition id="S-Kruzok" component={st(Scribble)} durationInFrames={50} {...common} />
    <Composition id="End" component={one(End, EN)} durationInFrames={EN} {...common} />
  </>
);
