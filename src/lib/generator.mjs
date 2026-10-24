export const characterSets = {
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lower: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '`~!@#$%^&*(){}[]-=_+\\|;:\'",./<>?',
};

// Rejection sampling avoids bias when the alphabet size does not divide 2^32.
function randomInt(max, cryptoProvider) {
  const limit = Math.floor(0x100000000 / max) * max;
  const buffer = new Uint32Array(1);
  do {
    cryptoProvider.getRandomValues(buffer);
  } while (buffer[0] >= limit);
  return buffer[0] % max;
}

export function generateStrings(
  { groups, firstGroups, mode, length, min, max, amount },
  cryptoProvider = globalThis.crypto,
) {
  const charset = groups.map((key) => characterSets[key] ?? '').join('');
  const firstCharset = firstGroups
    .filter((key) => groups.includes(key))
    .map((key) => characterSets[key] ?? '')
    .join('');
  if (!charset) throw new Error('请为密码选择至少一个字符集！');
  if (!firstCharset) throw new Error('请为密码首字符选择至少一个字符集！');
  if (!['fixed', 'random'].includes(mode)) throw new Error('请选择生成方式。');
  const validLength = (value) => Number.isInteger(value) && value >= 1 && value <= 30;
  if (mode === 'fixed' && !validLength(length)) throw new Error('长度请输入 1–30 之间的整数。');
  if (mode === 'random' && (!validLength(min) || !validLength(max) || min > max))
    throw new Error('随机长度请输入 1–30 之间的整数，且最大长度应大于等于最小长度。');
  if (!Number.isInteger(amount) || amount < 1 || amount > 50)
    throw new Error('一次生成数量请输入 1–50 之间的整数。');
  if (!cryptoProvider?.getRandomValues)
    throw new Error('当前浏览器不支持随机生成，请换用较新的浏览器。');
  return Array.from({ length: amount }, () => {
    const size = mode === 'fixed' ? length : min + randomInt(max - min + 1, cryptoProvider);
    let result = firstCharset[randomInt(firstCharset.length, cryptoProvider)];
    for (let index = 1; index < size; index++)
      result += charset[randomInt(charset.length, cryptoProvider)];
    return result;
  });
}
