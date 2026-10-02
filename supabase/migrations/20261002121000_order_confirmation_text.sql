-- Customer confirmation email: say who ships and issues the invoice, and that Decor Ambient calls
-- if something is unavailable or made to order (Daniel, 2 Oct 2026). {made_to_order_note} is empty
-- when every product is in stock. Only updates the template if it still has the original text.
update public.email_templates
set body = 'Poštovani/a {first_name},

hvala na porudžbini! Primili smo je i prosledili na pakovanje.

Broj porudžbine: {order_number}

{items}

Ukupno za proizvode: {total}
Plaćanje: pouzećem, kada paket stigne.
Troškove dostave plaćate kuriru prilikom preuzimanja.
Dostava: {delivery_estimate}.

{made_to_order_note}

Adresa dostave:
{address}

Porudžbinu pakuje i šalje naš partner Decor Ambient d.o.o. iz Subotice, koji izdaje i račun. Ako neki proizvod u međuvremenu nije dostupan, Decor Ambient će vas pozvati.

Ako imate pitanje, samo odgovorite na ovaj email.

VodaNatura – Filteri vode za vaš dom'
where key = 'order_confirmation'
  and position('{made_to_order_note}' in body) = 0
  and position('hvala na porudžbini! Primili smo je i prosledili na pakovanje.' in body) > 0;
