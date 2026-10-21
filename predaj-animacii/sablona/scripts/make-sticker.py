# Produkt ako nálepka s bielym obrysom (vyrezaná nálepka) z obrázka s priehľadným pozadím.
# Použitie: python3 scripts/make-sticker.py brands/<slug>/hero.png brands/<slug>/sticker.png
import sys
from PIL import Image, ImageFilter, ImageDraw
src, dst = sys.argv[1], sys.argv[2]
im = Image.open(src).convert("RGBA"); pad = 80; W, H = im.size
c = Image.new("RGBA", (W + 2 * pad, H + 2 * pad), (0, 0, 0, 0)); c.paste(im, (pad, pad), im)
a = c.getchannel("A").point(lambda v: 255 if v > 40 else 0)
s = a.filter(ImageFilter.GaussianBlur(34)).point(lambda v: 255 if v > 35 else 0)   # spojí omrvinky do jedného tvaru
b = s.filter(ImageFilter.MaxFilter(25))                                               # hrúbka bieleho okraja
inv = b.point(lambda v: 0 if v else 255); ImageDraw.floodfill(inv, (0, 0), 128)        # vyplniť diery (napr. stred donutu)
b = inv.point(lambda v: 0 if v == 128 else 255)
b = b.filter(ImageFilter.GaussianBlur(6)).point(lambda v: 255 if v > 128 else 0).filter(ImageFilter.GaussianBlur(1.2))
out = Image.new("RGBA", c.size, (255, 255, 255, 0)); out.putalpha(b); out.alpha_composite(c)
out.crop(out.getbbox()).save(dst)
