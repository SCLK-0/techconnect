// Console Easter Egg - Fun message for developers who inspect the site
export const displayConsoleMessage = () => {
  // Check if console is available
  if (typeof console === 'undefined') return;

  // Styled messages
  const styles = {
    title: 'color: #10b981; font-size: 20px; font-weight: bold;',
    message: 'color: #6366f1; font-size: 14px;',
    warning: 'color: #ef4444; font-size: 14px; font-weight: bold;',
    link: 'color: #8b5cf6; font-size: 13px;',
  };

  // Display the messages
  console.log('%cTechConnect', styles.title);
  console.log('%c', '');
  console.log('%cNice try. But we\'re nerds, we\'ll catch it.', styles.message);
  console.log('%c', '');
  console.log('%cBuilt with React + TypeScript + Vite + Supabase', styles.message);
  console.log('%chttps://github.com/SCLK-0/techconnect', styles.link);
  console.log('%c', '');
  console.log('%cWARNING: Do not paste code from unknown sources here.', styles.warning);
  console.log('%cIt can compromise your account security.', 'color: #f59e0b; font-size: 12px;');
};
