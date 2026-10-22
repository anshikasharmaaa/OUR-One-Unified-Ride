// Resolves with the most accurate position seen within maxWaitMs (stops early once accuracy <= goodEnough metres).
export function getBestPosition({ goodEnough = 50, maxWaitMs = 10000 } = {}) {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject({ code: 0 });
      return;
    }
    let best = null;
    let done = false;
    let watchId = null;
    let timer = null;
    const finish = (fn, value) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      if (watchId != null) navigator.geolocation.clearWatch(watchId);
      fn(value);
    };
    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        if (!best || pos.coords.accuracy < best.coords.accuracy) best = pos;
        if (pos.coords.accuracy <= goodEnough) finish(resolve, best);
      },
      (err) => (best ? finish(resolve, best) : finish(reject, err)),
      { enableHighAccuracy: true, maximumAge: 0, timeout: maxWaitMs },
    );
    timer = setTimeout(
      () => (best ? finish(resolve, best) : finish(reject, { code: 3 })),
      maxWaitMs,
    );
  });
}
