/**
 * Minimal zero-dependency JPEG EXIF reader for GPS + capture metadata.
 * Runs 100% in the browser: the photo never leaves the user's machine.
 * (That fact is the privacy story — keep it true by never uploading files.)
 */

type ExifMeta = {
  fileName: string;
  hasGps: boolean;
  lat?: number;
  lon?: number;
  takenAt?: string;
  camera?: string;
};

function toDegrees(rationals: Array<[number, number]>): number | null {
  if (rationals.length < 3) return null;
  const [d, m, s] = rationals as Array<[number, number]>;
  const deg = d[0] / d[1];
  const min = m[0] / m[1];
  const sec = s[0] / s[1];
  return deg + min / 60 + sec / 3600;
}

export function readExifGps(file: File): Promise<ExifMeta> {
  return new Promise(async (resolve, reject) => {
    const meta: ExifMeta = { fileName: file.name, hasGps: false };
    try {
      const buf = await file.arrayBuffer();
      const dv = new DataView(buf);
      if (dv.getUint16(0) !== 0xffd8) {
        // Not a JPEG — no GPS parse (PNG/HEIC out of scope for v1).
        resolve(meta);
        return;
      }
      let offset = 2;
      let tiffStart = -1;
      while (offset < dv.byteLength - 1) {
        const marker = dv.getUint16(offset);
        const size = dv.getUint16(offset + 2);
        if (marker === 0xffe1) {
          // APP1 → check "Exif\0\0"
          const tag = dv.getUint32(offset + 4);
          if (tag === 0x45786966) {
            tiffStart = offset + 10;
            break;
          }
        }
        if (marker === 0xffda) break; // start of scan
        offset += 2 + size;
      }
      if (tiffStart < 0) {
        resolve(meta);
        return;
      }

      const little = dv.getUint16(tiffStart) === 0x4949;
      const u16 = (p: number) => dv.getUint16(tiffStart + p, little);
      const u32 = (p: number) => dv.getUint32(tiffStart + p, little);

      const ifd0 = u32(4);
      const readIfd = (
        start: number,
        onTag: (tag: number, type: number, count: number, valueOffset: number, inlineValue: number) => void,
      ) => {
        const count = u16(start);
        for (let i = 0; i < count; i++) {
          const entry = start + 2 + i * 12;
          const tag = u16(entry);
          const type = u16(entry + 2);
          const cnt = u32(entry + 4);
          const bytesPer =
            type === 5 ? 8 : type === 3 ? 2 : type === 2 ? 1 : type === 7 ? 1 : 4;
          const total = bytesPer * cnt;
          const valueOffset = total > 4 ? tiffStart + u32(entry + 8) : tiffStart + entry + 8;
          const inlineValue = total <= 4 ? u32(entry + 8) : 0;
          onTag(tag, type, cnt, valueOffset, inlineValue);
        }
      };

      // IFD0: look for GPS pointer (0x8825) + camera make/model (tags 271/272)
      let gpsIfd = -1;
      readIfd(ifd0, (tag, _type, _count, _valueOffset, _inlineValue) => {
        if (tag === 0x8825) gpsIfd = _type === 13 ? _inlineValue : u32(_valueOffset);
      });

      // Resolve make/model strings
      let camera = "";
      {
        const parts: string[] = [];
        // Simpler: rescan IFD0 for 271/272 properly
        const txtAt = (start: number) => {
          const cnt = u32(start + 4);
          const vo = cnt > 4 ? tiffStart + u32(start + 8) : tiffStart + start + 8;
          let s = "";
          for (let i = 0; i < cnt; i++) {
            const c = dv.getUint8(vo + i);
            if (c !== 0) s += String.fromCharCode(c);
          }
          return s.trim();
        };
        const ifd0c = u16(ifd0);
        for (let i = 0; i < ifd0c; i++) {
          const entry = ifd0 + 2 + i * 12;
          const tag = u16(entry);
          if (tag === 271) parts.push(txtAt(entry));
          if (tag === 272) parts.push(txtAt(entry));
        }
        camera = Array.from(new Set(parts)).join(" ");
      }
      if (camera) meta.camera = camera;

      // GPS IFD
      if (gpsIfd > 0) {
        let latRef = "";
        let lonRef = "";
        let latRats: Array<[number, number]> = [];
        let lonRats: Array<[number, number]> = [];
        readIfd(gpsIfd, (tag, type, count, valueOffset, inlineValue) => {
          const rat: [number, number] = [u32(valueOffset), u32(valueOffset + 4)];
          if (tag === 1) {
            // N/S as ascii
            const s = String.fromCharCode(dv.getUint8(valueOffset));
            latRef = s;
          } else if (tag === 2) {
            const rats: Array<[number, number]> = [];
            for (let i = 0; i < count; i++) {
              rats.push([u32(valueOffset + i * 8), u32(valueOffset + i * 8 + 4)]);
            }
            latRats = rats;
          } else if (tag === 3) {
            lonRef = String.fromCharCode(dv.getUint8(valueOffset));
          } else if (tag === 4) {
            const rats: Array<[number, number]> = [];
            for (let i = 0; i < count; i++) {
              rats.push([u32(valueOffset + i * 8), u32(valueOffset + i * 8 + 4)]);
            }
            lonRats = rats;
          } else if (tag === 5 && type === 1 && inlineValue === 0) {
            void count;
          }
        });
        const lat = toDegrees(latRats);
        const lon = toDegrees(lonRats);
        if (lat !== null && lon !== null) {
          meta.hasGps = true;
          meta.lat = (latRef.toUpperCase().startsWith("S") ? -lat : lat);
          meta.lon = (lonRef.toUpperCase().startsWith("W") ? -lon : lon);
        }
      }

      // ExifIFD DateTimeOriginal
      let exifIfd = -1;
      readIfd(ifd0, (tag, type, count, valueOffset, inlineValue) => {
        if (tag === 0x8769) exifIfd = u32(valueOffset);
        void type; void count; void inlineValue;
      });
      if (exifIfd > 0) {
        const ifd1c = u16(exifIfd);
        for (let i = 0; i < ifd1c; i++) {
          const entry = exifIfd + 2 + i * 12;
          const tag = u16(entry);
          if (tag === 0x9003) {
            const cnt = u32(entry + 4);
            const vo = cnt > 4 ? tiffStart + u32(entry + 8) : tiffStart + entry + 8;
            let s = "";
            for (let j = 0; j < cnt; j++) {
              const c = dv.getUint8(vo + j);
              if (c !== 0) s += String.fromCharCode(c);
            }
            meta.takenAt = s.trim();
          }
        }
      }

      resolve(meta);
    } catch (err) {
      reject(err);
    }
    void 0;
  });
}
