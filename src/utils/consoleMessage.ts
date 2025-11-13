// Console Easter Egg - Fun message for developers who inspect the site
export const displayConsoleMessage = () => {
  // Check if console is available
  if (typeof console === 'undefined') return;

  // ASCII Art Banner - Hello! :)
  const banner = `
 ██╗  ██╗███████╗██╗     ██╗      ██████╗     ██╗
 ██║  ██║██╔════╝██║     ██║     ██╔═══██╗    ██║
 ███████║█████╗  ██║     ██║     ██║   ██║    ██║
 ██╔══██║██╔══╝  ██║     ██║     ██║   ██║    ╚═╝
 ██║  ██║███████╗███████╗███████╗╚██████╔╝    ██╗
 ╚═╝  ╚═╝╚══════╝╚══════╝╚══════╝ ╚═════╝     ╚═╝
  `;

  // Styled messages
  const styles = {
    banner: 'color: #10b981; font-weight: bold; font-family: monospace; font-size: 11px;',
    title: 'color: #3b82f6; font-size: 20px; font-weight: bold;',
    mainMessage: 'color: #6366f1; font-size: 18px; font-weight: bold;',
    message: 'color: #8b5cf6; font-size: 13px;',
    warning: 'color: #ef4444; font-size: 14px; font-weight: bold;',
  };

  // Display the messages
  console.log('%c' + banner, styles.banner);
  console.log('%cTECH CONNECT', styles.title);
  console.log('%c', '');
  console.log('%cWe catch bugs and intruders.', styles.mainMessage);
  console.log('%c', '');
  console.log('%cBuilt with React + TypeScript + Vite + Supabase', styles.message);
  console.log('%c', '');
  console.log('%cWARNING: Do not paste code from unknown sources here.', styles.warning);
  console.log('%cIt can compromise your account security.', 'color: #f59e0b; font-size: 12px;');
};
