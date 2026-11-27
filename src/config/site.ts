// Facts about the association that the site repeats in many places: legal name, address, VAT
// number, emails, bank details, social links. Check and edit them HERE before a build; every page,
// component, client script and email reads them from this file.
//
// No imports and plain values only: client scripts bundle this file and plain `tsx` loads it.
//
// Before changing an email, read its note: some addresses receive mail sent by the site through
// Cloudflare Email Routing, and a new address must be verified there first or the mail is lost.

export const SITE = {
  association: {
    /** Full legal name, as in the footer and on the printed sheets. */
    legalName: 'Associazione Multimage APS',
    /** Short public name. */
    name: 'Multimage',
    /** VAT number (partita IVA). */
    vatNumber: '06987750012',
    address: {
      street: 'Via Mario Pagano 7',
      postalCode: '50133',
      city: 'Firenze',
    },
  },

  emails: {
    /** General contact: footer, membership requests (Email Routing destination: must be verified). */
    info: 'info@multimage.org',
    /** Book orders: order pages, mailto links, order email (Email Routing destination: must be verified). */
    orders: 'ordini@multimage.org',
    /** Sender of the emails the site sends (Email Routing subdomain). */
    siteSender: 'sito@ordini.multimage.org',
    /** Display name of that sender. */
    siteSenderName: 'Multimage',
  },

  payment: {
    /** Account holder as registered at the bank (not the full legal name). */
    accountHolder: 'Associazione Multimage',
    bank: 'Banca Etica',
    iban: 'IT50T0501802800000011361524',
    bic: 'ETICIT22XXX',
    swiftIntermediary: 'POSOIT22XXX',
    /** PayPal account that receives payments. */
    paypal: 'info@multimage.org',
  },

  links: {
    instagram: 'https://www.instagram.com/multimage_editrice/',
    facebook: 'https://www.facebook.com/multimage/',
    /** Public newsletter sign-up form (Brevo). */
    newsletterForm:
      'https://b8860c2e.sibforms.com/serve/MUIFAMaTBmjHTvEXUcaRHDgifktpyEIZ9LkXuyPpoK9V9EelMXKhfDuWS2UYh4s6rd5T40cvoRsPpn3UKTX7CsKObG95GUpqbntf4lI0r7vo2dOkx6eY-9Ty3mYFlnHS6ofqASx3o9UzoCt9cJ3HmnIzg_SOdVzBeudcKWQuERioBo-aeBrjNYe8oK_Ex0cEhlsAni7AyO0Vuhnatg==',
  },
} as const;

/** "Via Mario Pagano 7, 50133 Firenze" */
export const SITE_ADDRESS_LINE = `${SITE.association.address.street}, ${SITE.association.address.postalCode} ${SITE.association.address.city}`;
