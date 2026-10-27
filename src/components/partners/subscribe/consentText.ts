/**
 * The consent boxes' wording, as clp-api shared/subscriptions.mjs records it (version 2026-10-26): change both together.
 * Counsel should review it, the text box above all, before launch.
 */
export const consentText = {
  age: (who: 'self' | 'child', child: string) =>
    who === 'child'
      ? `I’m 18 or older and the parent or legal guardian of ${child || 'my child'}, who is under 18. I’m signing up on their behalf, and updates come to me, never to them.`
      : 'I’m 18 or older and signing up for myself.',
  email: (partnerName: string) => `Yes, email me updates from ${partnerName} and Compete Like Pros about the topics I picked. I can unsubscribe anytime.`,
  sms: (partnerName: string) =>
    `Yes, text me recurring automated marketing messages from Compete Like Pros on behalf of ${partnerName} at the number above. Consent is not a condition of purchase. Message frequency varies. Message and data rates may apply. Reply STOP to cancel or HELP for help.`,
  clp: (short: string, channels: Channel[]) =>
    `Also send me news, events and offers from Compete Like Pros and other CLP partners by ${channelWords(channels)}. This is separate from ${short}, and I can turn it off anytime.` +
    (channels.includes('sms') ? ' Texts are recurring automated marketing messages from Compete Like Pros. Consent is not a condition of purchase. Message and data rates may apply. Reply STOP to cancel.' : ''),
};

export type Channel = 'email' | 'sms';
/** "email", "text", "email and text". */
export const channelWords = (channels: Channel[]) => channels.map((c) => (c === 'sms' ? 'text' : 'email')).join(' and ');
