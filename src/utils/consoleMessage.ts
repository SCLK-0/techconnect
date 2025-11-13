// Console Easter Egg - Fun message for developers who inspect the site
export const displayConsoleMessage = () => {
  // Check if console is available
  if (typeof console === 'undefined') return;

  // Clear console first (optional)
  // console.clear();

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
    title: 'color: #3b82f6; font-size: 24px; font-weight: bold;',
    subtitle: 'color: #6366f1; font-size: 16px;',
    message: 'color: #8b5cf6; font-size: 14px;',
    warning: 'color: #ef4444; font-size: 16px; font-weight: bold;',
    link: 'color: #10b981; font-size: 14px; text-decoration: underline;',
  };

  // Display the messages
  console.log('%c' + banner, styles.banner);
  console.log('%c👋 Hey there, curious developer!', styles.title);
  console.log('%c🔍 Nice try! But there are no secrets here... 😉', styles.subtitle);
  console.log('%c', ''); // Empty line
  console.log('%c💡 Interested in how we built this?', styles.message);
  console.log('%cWe\'re using React + TypeScript + Vite + Supabase', styles.message);
  console.log('%c', ''); // Empty line
  console.log('%c🚀 Want to join our team?', styles.message);
  console.log('%cWe\'re always looking for talented developers!', styles.message);
  console.log('%cCheck out: https://github.com/SCLK-0/techconnect', styles.link);
  console.log('%c', ''); // Empty line
  console.log('%c⚠️  WARNING: Do not paste any code here!', styles.warning);
  console.log('%cPasting code from unknown sources can compromise your account.', 'color: #f59e0b; font-size: 12px;');
  console.log('%c', ''); // Empty line
  console.log('%cHappy coding! 💻✨', 'color: #ec4899; font-size: 14px; font-weight: bold;');
};
