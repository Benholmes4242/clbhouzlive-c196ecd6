export const __DEV__ = import.meta.env.MODE !== 'production';

export const devlog = (...args: any[]) => {
  if (__DEV__) console.log(...args);
};

export const devwarn = (...args: any[]) => {
  if (__DEV__) console.warn(...args);
};

export const devtable = (data: any) => {
  if (__DEV__) console.table(data);
};
