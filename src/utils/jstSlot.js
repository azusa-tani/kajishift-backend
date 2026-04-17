/**
 * ワーカー利用不可スロット用: JST 暦日 + 30分 index（0〜47）と絶対時刻の相互変換
 * 日本は夏時間なしのため固定オフセット UTC+9 で壁時計を解釈する。
 */

const YMD_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

const assertYmd = (ymd) => {
  if (!YMD_RE.test(ymd)) {
    const e = new Error('日付は YYYY-MM-DD 形式で指定してください');
    e.status = 400;
    e.code = 'INVALID_DATE';
    throw e;
  }
};

/**
 * JST 暦日の 30 分スロット [startMs, endMs)（end は排他的）
 * @param {string} localDateYmd - YYYY-MM-DD（JST の暦日）
 * @param {number} slotIndex - 0〜47
 */
const jstSlotToUtcRangeMs = (localDateYmd, slotIndex) => {
  assertYmd(localDateYmd);
  if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex > 47) {
    const e = new Error('slotIndex は 0 以上 47 以下の整数である必要があります');
    e.status = 400;
    e.code = 'INVALID_SLOT_INDEX';
    throw e;
  }
  const [, ys, ms, ds] = localDateYmd.match(YMD_RE);
  const y = Number(ys);
  const mo = Number(ms);
  const d = Number(ds);
  const startMin = slotIndex * 30;
  const h = Math.floor(startMin / 60);
  const m = startMin % 60;
  const startMs = Date.UTC(y, mo - 1, d, h - 9, m, 0, 0);
  const endMs = startMs + 30 * 60 * 1000;
  return { startMs, endMs };
};

const intervalsOverlap = (a0, a1, b0, b1) => a0 < b1 && a1 > b0;

/**
 * 予約の占有区間 [startMs, endMs)（end は排他的）
 * 契約: 開始は scheduledDate の絶対時刻、終了は開始から duration 時間後。
 * startTime は表示・互換用であり、オーバーラップ判定の主軸は scheduledDate の瞬間と duration。
 */
const bookingToUtcRangeMs = (booking) => {
  const startMs = new Date(booking.scheduledDate).getTime();
  const hours = Number(booking.duration);
  if (Number.isNaN(startMs) || !Number.isFinite(hours) || hours <= 0) {
    return null;
  }
  const endMs = startMs + hours * 60 * 60 * 1000;
  return { startMs, endMs };
};

const slotOverlapsBooking = (localDateYmd, slotIndex, booking) => {
  const slot = jstSlotToUtcRangeMs(localDateYmd, slotIndex);
  const bk = bookingToUtcRangeMs(booking);
  if (!bk) return false;
  return intervalsOverlap(slot.startMs, slot.endMs, bk.startMs, bk.endMs);
};

module.exports = {
  assertYmd,
  jstSlotToUtcRangeMs,
  bookingToUtcRangeMs,
  slotOverlapsBooking,
  intervalsOverlap,
  YMD_RE
};
