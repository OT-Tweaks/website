// ─── OT Tweaks website settings ──────────────────────────────────────────────
// Edit these values, then redeploy (firebase deploy --only hosting).
window.OT_CONFIG = {
  // Stripe Payment Link for the $50 purchase (Stripe dashboard > Payment Links).
  // Looks like: https://buy.stripe.com/abc123XYZ
  stripePaymentLink: 'https://buy.stripe.com/8x2fZh90w9ZOc8J52HeIw00',

  price: 50,

  discordUrl: 'https://discord.gg/aAbXUvwhPy',

  // Where the installer comes from. Set this to your GitHub releases repo and the Download
  // button always serves the NEWEST version (the same one the app auto-updates to).
  // Example: 'yourname/ot-tweaks-releases'
  githubRepo: 'OT-Tweaks/ot-tweaks-releases',

  // Fallback if githubRepo is empty or GitHub can't be reached: a file in public/download/.
  downloadUrl: '/download/OT_Tweaks_Setup_2_0_0.exe',
  downloadVersion: '2.0.0',

  // Contact email shown on the legal pages. Leave '' to point people to Discord.
  supportEmail: '',
};
