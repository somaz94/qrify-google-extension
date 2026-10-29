// A classic script in <head>, so the stored theme is painted before the popup modules load; src/lib/theme.js
// is the tested copy of this logic and takes over once they do.
{
  const saved = localStorage.getItem('theme');
  const dark = saved === 'dark' || (saved !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
}
