---
agent_edit: false
scope: Fastro uses DatoCMS and uses content modelling and naming conventions for models and fields
---

# CMS Content Modelling

## Naming strategy

DatoCMS is a headless CMS, so the content models should be as much UI agnostic as possible. In general naming content models after their data properties is a good practice, because it separates concerns, promotes reusability within the CMS and by the applications connection to the CMS, and content models don't need to change everytime a UI changes.

In Head Start content is named in this order of preference:

1. Naming based on data type (for example `slug`, `image`, `color`).
2. Naming based on function (for example `title`, `autoplay`).
3. Naming based on appearance (for example `layout`, `style`).

Specific cases:

- In case of a boolean field it should be named after its function, as a boolean means nothing without context. For example a `Video Block` could have `autoplay`, `loop` and `muted` boolean fields.
- In case a model has multiple fields of the same data type, the primary field should be named after its data type (for example `image`) and secondary fields should be named after their function (for example `background_image`).
- In case a field is named after its function, the validations you configure for the field are typically a good indicator towards a fitting name. For example if you set a single line string field to only accept a URL as a pattern, `url` is probably a good name for the field.
- In case a field is only added to control the appearance of a model in the user interface, Head Start proposes to solve this with a generic `layout` and `style` field. See [Modelling Appearance](#modelling-appearance).

## Model name conventions

The [DatoCMS Schema builder](https://www.datocms.com/docs/content-modelling) distinguishes regular models and reusable blocks that can be used in modular content and structured text fields.

Head Start uses these standardised model names:

- **`... Page`**  
  - Type: regular model.  
  - Notes: all pages end with `Page` (`Home Page`, `Product Page`, generic `Page`) and power the routes in `src/pages/`.
- **`... Block`**  
  - Type: reusable [block](https://www.datocms.com/docs/content-modelling/blocks).  
  - Notes: every reusable block name ends with `Block` (`Text Block`, `Image Block`, etc.) and is consumed by templates and fragments in `src/blocks/`. See [Blocks and Components](./blocks-and-components.md).

Since a project has multiple pages and multiple blocks, the name should describe the models function. For example a `Newsletter Signup Block`.

## Field name conventions

While there can always be exceptions, Head Start aims to cover the majority of field names with a list of standardised field names:

- **`title`**  
  - Type: single line string field.  
  - Notes: do **not** use `heading` or `name` (except for people records).
- **`subtitle`**  
  - Type: single line string field.  
  - Notes: avoid `tagline` or `excerpt`.
- **`slug`**  
  - Type: [slug field](https://www.datocms.com/docs/content-modelling/slug-permalinks).  
  - Notes: not `permalink`, `path`, or `url`; use `title` as the reference field.
- **`blocks`**  
  - Type: [modular content field](https://www.datocms.com/docs/content-modelling/modular-content).  
  - Notes: plural naming signals the list, not `body` or `content`.
- **`items`**  
  - Type: [modular content field](https://www.datocms.com/docs/content-modelling/modular-content).  
  - Notes: use when the field repeats the same item structure (e.g., “Unique Selling Point Block” entries composed of `title` + `image`).
- **`text`**  
  - Type: [structured text field](https://www.datocms.com/docs/content-modelling/structured-text).  
  - Notes: avoid `body`, `content`, `description`; structured text is preferred over multi-paragraph text areas.
- **`image` / `images`**  
  - Type: [single asset or asset gallery field](https://www.datocms.com/docs/general-concepts/media-area).  
  - Notes: not `picture`, `photo`, or `avatar`. Use plural when the UI renders grids/galleries; restrict validation to image extensions only.
- **`video`**  
  - Type: [asset field](https://www.datocms.com/docs/general-concepts/videos) or [external video field](https://www.datocms.com/docs/content-modelling/external-video-field).  
  - Notes: choose the field type based on whether the video is uploaded to Dato or hosted externally.
- **`page` / `pages`**  
  - Type: [link field](https://www.datocms.com/docs/content-modelling/links).  
  - Notes: reference the `InternalLink` model so all `... Page` routes resolve consistently across the codebase.

## Modelling Appearance

In cases where the appearance of a content model needs to be controlled from the CMS, Head Start aims to handle this using two standardised fields:

- **`layout`**  
  - Type: single line string field.  
  - Notes: defines position, size, direction. Configure [accept only specified values](https://www.datocms.com/docs/content-modelling/validations#single-line-text) (e.g., `full-width`, `centered`, `fixed-header`).
- **`style`**  
  - Type: single line string field or [link field](https://www.datocms.com/docs/content-modelling/links).  
  - Notes: governs visual treatments. Use predefined values or create a Style model referenced via link fields when styles are shared (`highlight`, `branded`, `primary`, etc.).

A few example situations:

- A design has a block with two text columns. Avoid creating fields like `text_column_left` and `text_column_right`. Instead create an `items` field (see [Field name conventions](#field-name-conventions)) where each item has a `text` field, and use validations to set a minimum and maximum number of items. Then add a `layout` field to the block with values like `one-column`, `two-columns`, `multi-column`.
- A design has two variations of a block. One with an image on the left and text on the right. The second with the content the other way around. Avoid making multiple blocks or adding an `is_inversed` or `is_image_left` field. Instead create a `layout` field and only allow specific values describing the options, like `image-text` and `text-image`. You can use the presentation of the field to display the options as radio buttons or a dropdown if desired (this doesn't impact the data model). This setup is open to future extension. And if the website later adds right-to-left support the content model doesn't need to change.
- A design has different blocks all showing multiple images. Here conbining an `images` field with a `layout` field with options like `grid` and `gallery` would allow you to model a single content block for both design options. Note: f this feels confusing to editors or if the blocks differ in more ways you may still want to create multiple content blocks in the CMS.
- A design has two variations of a blocks background. Avoid fields like `is_gray` as this makes it difficult to add variations later on, or change an existing variation. Instead use a `style` field with values like `default`, `dimmed` or `highlighted`.
- A design consistently uses multiple style variations across the website. In this case, create a new Style model and create records for each variation. Add `style` link fields to blocks and models referencing the Style model. You can restrict modifying the Style records to admins under [Content Permissions in the CMS](https://www.datocms.com/docs/content-delivery-api/docs/general-concepts/roles-and-permission-system#content-level-permissions).
