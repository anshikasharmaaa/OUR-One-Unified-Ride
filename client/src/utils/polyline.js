// Decodes a precision-5 encoded polyline into [[lat, lng], ...].
export function decodePolyline(str) {
  const out = [];
  let i = 0,
    lat = 0,
    lng = 0;
  const next = () => {
    let b,
      shift = 0,
      result = 0;
    do {
      b = str.charCodeAt(i++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    return result & 1 ? ~(result >> 1) : result >> 1;
  };
  while (i < str.length) {
    lat += next();
    lng += next();
    out.push([lat / 1e5, lng / 1e5]);
  }
  return out;
}
