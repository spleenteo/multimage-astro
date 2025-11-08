import { type Client, buildClient } from '@datocms/cma-client';
import type { APIRoute } from 'astro';
import { SECRET_API_TOKEN } from 'astro:env/server';
import { PUBLIC_SITE_URL } from 'astro:env/client';
import { handleUnexpectedError, successfulResponse, withCORS } from '../utils';

export const prerender = false;

/*
 * This endpoint is called only once, immediately after the initial deployment of
 * this project, to set up some DatoCMS settings. Feel free to remove it!
 */

export const OPTIONS: APIRoute = () => {
  return new Response('OK', withCORS());
};

/**
 * Install and configure the "Web Previews" plugin
 *
 * https://www.datocms.com/marketplace/plugins/i/datocms-plugin-web-previews
 */
const WEB_PREVIEWS_PACKAGE = 'datocms-plugin-web-previews';
const SEO_PLUGIN_PACKAGE = 'datocms-plugin-seo-readability-analysis';

async function findPluginByPackage(client: Client, packageName: string) {
  const response = await client.plugins.rawList();
  return response.data.find((plugin) => plugin.attributes.package_name === packageName) ?? null;
}

async function ensurePlugin(client: Client, packageName: string) {
  const existing = await findPluginByPackage(client, packageName);
  if (existing) {
    return existing;
  }
  return client.plugins.create({
    package_name: packageName,
  });
}

function normalizeOrigin(candidate: string | null | undefined) {
  if (!candidate) {
    return null;
  }

  try {
    const url = new URL(candidate);
    return url.origin;
  } catch (error) {
    console.warn('[post-deploy] Invalid URL provided for plugin setup:', candidate, error);
    return null;
  }
}

function previewWebhook(baseUrl: string) {
  return new URL(`/api/preview-links?token=${SECRET_API_TOKEN}`, baseUrl).toString();
}

async function installWebPreviewsPlugin(client: Client, deploymentUrl: string) {
  const plugin = await ensurePlugin(client, WEB_PREVIEWS_PACKAGE);
  const productionOrigin = normalizeOrigin(PUBLIC_SITE_URL);
  const deploymentOrigin = normalizeOrigin(deploymentUrl);

  const frontends = [] as Array<{ name: string; previewWebhook: string }>;

  if (productionOrigin) {
    frontends.push({ name: 'Production', previewWebhook: previewWebhook(productionOrigin) });
  }

  if (deploymentOrigin && deploymentOrigin !== productionOrigin) {
    frontends.push({ name: 'Preview', previewWebhook: previewWebhook(deploymentOrigin) });
  }

  // Fallback: ensure at least one frontend exists using the deployment URL
  if (frontends.length === 0 && deploymentOrigin) {
    frontends.push({ name: 'Preview', previewWebhook: previewWebhook(deploymentOrigin) });
  }

  await client.plugins.update(plugin.id, {
    parameters: {
      frontends,
      startOpen: true,
    },
  });
}

/**
 * Install and configure the "SEO/Readability Analysis" plugin
 *
 * https://www.datocms.com/marketplace/plugins/i/datocms-plugin-seo-readability-analysis
 */
async function installSEOAnalysisPlugin(client: Client, baseUrl: string) {
  const seoPlugin = await ensurePlugin(client, SEO_PLUGIN_PACKAGE);

  await client.plugins.update(seoPlugin.id, {
    parameters: {
      htmlGeneratorUrl: new URL(`/api/seo-analysis?token=${SECRET_API_TOKEN}`, baseUrl).toString(),
      autoApplyToFieldsWithApiKey: 'seo_analysis',
      setSeoReadabilityAnalysisFieldExtensionId: true,
    },
  });
}

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();

  const client = buildClient({ apiToken: body.datocmsApiToken });
  const baseUrl = body.frontendUrl as string;

  try {
    await Promise.all([
      installWebPreviewsPlugin(client, baseUrl),
      installSEOAnalysisPlugin(client, baseUrl),
    ]);

    return successfulResponse();
  } catch (error) {
    return handleUnexpectedError(error);
  }
};
