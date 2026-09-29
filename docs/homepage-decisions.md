# Homepage: differences from the mock-up

Built from the Claude Design canvas "VodaNatura Landing Page" (Normal – desktop 1440, Normal – telefon 390). Everything not listed here follows the mock-up. 29 Sep 2026.

## Text changed because of the 29 Sep decisions (Jira VODANATURA-75)

| Where | Mock-up | Built | Why |
| --- | --- | --- | --- |
| FAQ "Koliko košta dostava?" | "u korpi vidite procenu… [BESPLATNA DOSTAVA OD]" | Shipping depends on weight and size, paid to the courier on delivery | No shipping price on the site, no free shipping (q. 8) |
| Step 3 "Stiže BEX kurirom" | "Šaljemo vam broj pošiljke za praćenje" | "Za oko 4 radna dana. Dostavu plaćate kuriru…" | Tracking is still open with DA (q. 7); delivery ~4 working days (q. 8) |
| Installation card | "ugradnju radi naš serviser – [CENA UGRADNJE]" | Booked by phone with the partner's technician | Installation is booked by calling DA (q. 10) |
| FAQ | 5 questions incl. "Šta ako proizvod nije na stanju?" | Added "Koliko se čeka na isporuku?" (covers delivery time and made-to-order) | Delivery time answered |
| Footer contact | `[E-MAIL]@vodanatura.com` | info@vodanatura.com | Public address from the Email System doc |
| RO 6 WFU maintenance | "[potvrditi ulošce po stepenu]" | "Membrana na 3 godine, oko 2.170 RSD godišnje" | Known part only; cartridge codes per stage still open (VODANATURA-33) |

## SEO fixes (from the 28 Sep SEO review of the mock-ups)

- **H1 carries the keyword:** the overline "Filteri za vodu za stanove i kuće u Srbiji" is inside the H1, visually unchanged.
- **Cards link to product pages:** product and cartridge names link to `/proizvod/{slug}/`; categories to their SEO URLs.
- **Phone shows the same content as desktop:** the phone mock-up left out the cartridge reorder band, the shower filter, the 4th FAQ, nav and footer links. They are all on the phone page now, in the phone layout style.
- **FAQ stays in the HTML when closed** (`<details>`), plus FAQPage JSON-LD.
- **Footer** has Vodiči, O nama, Kontakt, and "Reverzna osmoza" as its own category link.
- **Fonts self-hosted** (no Google Fonts request).

Still open: the main menu follows the mock-up (Voda za piće, Cela kuća, Omekšivači, Tuš i aparati, Ulošci, Saveti o vodi). The SEO guide gives "Reverzna osmoza" its own category; decide whether it joins the top menu.

## Placeholders still on the page

`[TELEFON]`, `[RADNO VREME]`, `[TELEFON DECOR AMBIENT]`, `[CENA UGRADNJE]` — all in `src/config/site.ts`, one line each.

## Not built yet (links lead to pages that come next)

Category, product, search, cart, checkout, compare, product finder quiz, guides and the information pages.
