import type { Client } from 'datocms/lib/cma-client-node';

// Adds "Libro del momento" to the home singleton: an optional link to one book, shown as the
// home hero. Empty means the page falls back to the first "libro in evidenza" block, then the
// latest book. Additive only: no records or existing fields change.
export default async function (client: Client): Promise<void> {
  const home = await client.itemTypes.find('home');
  const book = await client.itemTypes.find('book');

  const fieldsets = await client.fieldsets.list(home.id);
  const heroFieldset = fieldsets.find((fieldset: { title: string }) => fieldset.title === 'Hero');

  await client.fields.create(home.id, {
    label: 'Libro del momento',
    api_key: 'featured_book',
    field_type: 'link',
    hint: 'Il libro mostrato nel primo schermo della home. Se vuoto, si usa il primo blocco "libro in evidenza", poi l\'ultima uscita.',
    validators: {
      item_item_type: {
        item_types: [book.id],
        on_publish_with_unpublished_references_strategy: 'fail',
        on_reference_unpublish_strategy: 'delete_references',
        on_reference_delete_strategy: 'delete_references',
      },
    },
    appearance: { editor: 'link_select', parameters: {}, addons: [] },
    ...(heroFieldset ? { fieldset: { type: 'fieldset', id: heroFieldset.id } } : {}),
  });
}
