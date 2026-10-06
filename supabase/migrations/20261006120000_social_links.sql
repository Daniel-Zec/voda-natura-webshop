-- Social profile links, edited in Admin → Podešavanja → Društvene mreže.
-- Public, so the shop build (scripts/fetch-catalog.mjs) can read them for the footer and JSON-LD sameAs.
-- Empty string = icon shows dimmed ("uskoro") in the footer.
insert into public.settings (key, value, is_public, description) values
  ('social_instagram_url', '""', true, 'Instagram profile URL shown in the shop footer. Empty = not set yet.'),
  ('social_facebook_url', '""', true, 'Facebook page URL shown in the shop footer. Empty = not set yet.')
on conflict (key) do nothing;
