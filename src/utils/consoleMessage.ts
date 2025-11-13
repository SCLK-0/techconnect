// Console Easter Egg - Fun message for developers who inspect the site
export const displayConsoleMessage = () => {
  // Check if console is available
  if (typeof console === 'undefined') return;

  // ASCII Art Banner
  const banner = `
  ████████╗███████╗ ██████╗██╗  ██╗     ██████╗ ██████╗ ███╗   ███╗███╗   ██╗███████╗ ██████╗████████╗
  ╚══██╔══╝██╔════╝██╔════╝██║  ██║    ██╔════╝██╔═══██╗████╗ ████║████╗  ██║██╔════╝██╔════╝╚══██╔══╝
     ██║   █████╗  ██║     ███████║    ██║     ██║   ██║██╔████╔██║██╔██╗ ██║█████╗  ██║        ██║   
     ██║   ██╔══╝  ██║     ██╔══██║    ██║     ██║   ██║██║╚██╔╝██║██║╚██╗██║██╔══╝  ██║        ██║   
     ██║   ███████╗╚██████╗██║  ██║    ╚██████╗╚██████╔╝██║ ╚═╝ ██║██║ ╚████║███████╗╚██████╗   ██║   
     ╚═╝   ╚══════╝ ╚═════╝╚═╝  ╚═╝     ╚═════╝ ╚═════╝ ╚═╝     ╚═╝╚═╝  ╚═══╝╚══════╝ ╚═════╝   ╚═╝   
  `;

  // Styled messages
  const styles = {
    banner: 'color: #10b981; font-weight: bold; font-family: monospace;',
    message: 'color: #6366f1; font-size: 14px;',
    warning: 'color: #ef4444; font-size: 14px; font-weight: bold;',
  };

  // Display the messages
  console.log('%c' + banner, styles.banner);
  console.log('%cWe catch bugs and intruders.', styles.message);
  console.log('%c', '');
  console.log('%cBuilt with React + TypeScript + Vite + Supabase', styles.message);
  console.log('%c', '');
  console.log('%cWARNING: Do not paste code from unknown sources here.', styles.warning);
  console.log('%cIt can compromise your account security.', 'color: #f59e0b; font-size: 12px;');
};
