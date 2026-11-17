"""A4 landscape marker sheet for the Oulanka AR table (300 dpi). The whole sheet is the image target; the QR opens the viewer."""
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageOps
import qrcode
W, H = 3508, 2480                      # A4 landscape at 300 dpi
URL = 'https://siamakab.github.io/diwa-spatial-hub/ar-table/'
F = lambda w, s: ImageFont.truetype(f'/usr/share/fonts/opentype/inter/Inter-{w}.otf', s)
im = Image.new('RGB', (W, H), (8, 26, 52)); d = ImageDraw.Draw(im)
# fine blueprint grid
for x in range(0, W, 59): d.line([(x, 0), (x, H)], fill=(14, 40, 74), width=2)
for y in range(0, H, 59): d.line([(0, y), (W, y)], fill=(14, 40, 74), width=2)
# the station area from the orthophoto, in a large circle (feature-rich: gives the tracker plenty to hold on to)
o = Image.open('/home/claude/oulanka/ortho_tex.png').convert('RGB')
D = 2060; ph = o.resize((D, D), Image.LANCZOS); ph = ImageOps.autocontrast(ph, cutoff=1)
mask = Image.new('L', (D, D), 0); ImageDraw.Draw(mask).ellipse((0, 0, D - 1, D - 1), fill=255)
cx, cy = 210 + D // 2, (H - D) // 2 + D // 2 + 40
im.paste(ph, (cx - D // 2, cy - D // 2), mask)
for r, w, c in [(D // 2 + 18, 10, (95, 215, 255)), (D // 2 + 52, 4, (60, 150, 220)), (D // 2 + 84, 3, (40, 110, 180))]:
    d.ellipse((cx - r, cy - r, cx + r, cy + r), outline=c, width=w)
for k in range(72):                    # tick ring
    import math; a = k / 72 * math.tau; r0, r1 = D // 2 + 96, D // 2 + (140 if k % 6 == 0 else 116)
    d.line([(cx + math.cos(a) * r0, cy + math.sin(a) * r0), (cx + math.cos(a) * r1, cy + math.sin(a) * r1)], fill=(95, 215, 255), width=6 if k % 6 == 0 else 3)
# right column
X = 2520
logo = Image.open('/home/claude/hub/assets/diwa-logo-white.png').convert('RGBA'); lh = 190; logo = logo.resize((int(logo.width * lh / logo.height), lh), Image.LANCZOS)
im.paste(logo, (X, 170), logo)
d.text((X, 450), 'OULANKA', font=F('Bold', 150), fill=(255, 255, 255))
d.text((X, 620), 'AR TABLE', font=F('Bold', 150), fill=(95, 215, 255))
d.text((X + 4, 815), 'DIWA Spatial Hub', font=F('Medium', 64), fill=(200, 225, 245))
q = qrcode.QRCode(border=2, box_size=1, error_correction=qrcode.constants.ERROR_CORRECT_M); q.add_data(URL); q.make()
qi = q.make_image(fill_color='black', back_color='white').convert('RGB').resize((760, 760), Image.NEAREST)
d.rounded_rectangle((X - 20, 980, X + 780, 1780), 40, fill=(255, 255, 255)); im.paste(qi, (X + 0, 1000))
steps = ['1  Scan the code to open the viewer', '2  Tap Start and point the camera here', '3  Step back: the table is 1 m wide']
for i, t in enumerate(steps): d.text((X - 10, 1880 + i * 92), t, font=F('Medium', 52), fill=(225, 240, 252))
d.text((W - 90, H - 128), 'Siamak Bazzaz · MetaParametric.com', font=F('Medium', 32), fill=(130, 175, 215), anchor='rs')
d.text((W - 90, H - 82), 'Map data © National Land Survey of Finland', font=F('Regular', 26), fill=(100, 140, 185), anchor='rs')
d.rounded_rectangle((28, 28, W - 29, H - 29), 70, outline=(255, 214, 90), width=10)
im.save('oulanka-ar-marker.png', dpi=(300, 300))
im.save('oulanka-ar-marker.pdf', 'PDF', resolution=300)
im.resize((1500, int(1500 * H / W)), Image.LANCZOS).save('target.png')
print('ok')
