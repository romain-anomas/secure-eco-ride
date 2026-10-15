export const DEFAULT_PHONE_COUNTRY = '250';

// Common calling codes, with Rwanda first because it is the default market.
export const PHONE_COUNTRIES = [
  ['Rwanda', '250'], ['Burundi', '257'], ['Democratic Republic of the Congo', '243'], ['Kenya', '254'], ['Tanzania', '255'], ['Uganda', '256'],
  ['Algeria', '213'], ['Argentina', '54'], ['Australia', '61'], ['Austria', '43'], ['Bangladesh', '880'], ['Belgium', '32'],
  ['Benin', '229'], ['Botswana', '267'], ['Brazil', '55'], ['Cameroon', '237'], ['Canada / United States', '1'], ['Chile', '56'], ['China', '86'],
  ['Colombia', '57'], ['Côte d’Ivoire', '225'], ['Czechia', '420'], ['Denmark', '45'], ['Egypt', '20'], ['Ethiopia', '251'],
  ['Finland', '358'], ['France', '33'], ['Germany', '49'], ['Ghana', '233'], ['Greece', '30'], ['Hong Kong', '852'],
  ['India', '91'], ['Indonesia', '62'], ['Ireland', '353'], ['Israel', '972'], ['Italy', '39'], ['Japan', '81'],
  ['Jordan', '962'], ['Kuwait', '965'], ['Malaysia', '60'], ['Mexico', '52'], ['Morocco', '212'], ['Mozambique', '258'],
  ['Netherlands', '31'], ['New Zealand', '64'], ['Nigeria', '234'], ['Norway', '47'], ['Oman', '968'], ['Pakistan', '92'],
  ['Philippines', '63'], ['Poland', '48'], ['Portugal', '351'], ['Qatar', '974'], ['Saudi Arabia', '966'], ['Senegal', '221'],
  ['Singapore', '65'], ['Somalia', '252'], ['South Africa', '27'], ['South Korea', '82'], ['South Sudan', '211'], ['Spain', '34'],
  ['Sweden', '46'], ['Switzerland', '41'], ['Thailand', '66'], ['Tunisia', '216'], ['Turkey', '90'], ['United Arab Emirates', '971'],
  ['United Kingdom', '44'], ['Zambia', '260'], ['Zimbabwe', '263'],
].map(([name, code]) => ({ name, code }));

export function splitStoredPhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  // Local numbers are commonly stored without a calling code in existing driver records.
  if (digits.startsWith('0') || digits.length <= 10) return { countryCode: DEFAULT_PHONE_COUNTRY, nationalNumber: digits.replace(/^0/, '') };
  const matches = PHONE_COUNTRIES.filter(({ code }) => digits.startsWith(code)).sort((a, b) => b.code.length - a.code.length);
  if (!matches.length) return { countryCode: DEFAULT_PHONE_COUNTRY, nationalNumber: digits.replace(/^0/, '') };
  return { countryCode: matches[0].code, nationalNumber: digits.slice(matches[0].code.length) };
}
