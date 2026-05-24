import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const contentDir = path.join(process.cwd(), 'content');
const distDir = path.join(process.cwd(), 'dist');
const indexHtmlPath = path.join(distDir, 'index.html');

async function run() {
  try {
    if (!fs.existsSync(indexHtmlPath)) {
      console.warn("dist/index.html not found. Skipping static pre-render.");
      return;
    }

    const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
    const files = fs.readdirSync(contentDir).filter(f => f.endsWith('.md'));

    console.log(`Pre-rendering ${files.length} pages and generating static APIs for Cloudflare deployments...`);

    const postsList = [];
    const postDetailsCache = {};

    // 1. Process all markdown files and build posts list data structure
    for (const file of files) {
      const slug = file.replace('.md', '');
      const rawContent = fs.readFileSync(path.join(contentDir, file), 'utf8');
      const { data, content: markdown } = matter(rawContent);

      postDetailsCache[slug] = {
        slug,
        metadata: data,
        content: markdown,
        raw: rawContent
      };

      postsList.push({
        slug,
        ...data
      });
    }

    // Sort posts list by date descending (matching server.ts logic)
    postsList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // 2. Clear & create api folders in dist directory
    const apiPostsDir = path.join(distDir, 'api', 'posts');
    fs.mkdirSync(apiPostsDir, { recursive: true });

    // Save list of all posts to fallback .json file
    fs.writeFileSync(path.join(distDir, 'api', 'posts.json'), JSON.stringify(postsList, null, 2), 'utf8');

    // 3. Generate detailed pages and individual api endpoints
    for (const file of files) {
      const slug = file.replace('.md', '');
      const post = postDetailsCache[slug];

      const title = post.metadata.title || "Nexus of Thought";
      const description = post.metadata.summary || "Research & Deep Dives";
      const heroImage = post.metadata.heroImage || "";

      // Compute backlinks
      const backlinks = Object.values(postDetailsCache)
        .filter((p) => p.slug !== slug)
        .filter((p) => p.raw.includes(`/${slug}`) || p.raw.includes(`./${slug}`))
        .map((p) => ({
          slug: p.slug,
          title: p.metadata.title,
          summary: p.metadata.summary
        }));

      const postJson = {
        slug,
        metadata: post.metadata,
        content: post.content,
        backlinks: backlinks
      };

      // Emit JSON API file (both as slug and as slug.json for safety)
      fs.writeFileSync(path.join(apiPostsDir, slug), JSON.stringify(postJson, null, 2), 'utf8');
      fs.writeFileSync(path.join(apiPostsDir, `${slug}.json`), JSON.stringify(postJson, null, 2), 'utf8');

      // Static pre-render: Replace Title & SEO Meta Tags in index.html for this post
      const ogMeta = `
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    ${heroImage ? `<meta property="og:image" content="${heroImage}" />` : ''}
    <meta property="og:type" content="article" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    ${heroImage ? `<meta name="twitter:image" content="${heroImage}" />` : ''}
`;

      let modifiedHtml = indexHtml;
      if (indexHtml.includes("<title>Nexus of Thought</title>")) {
        modifiedHtml = indexHtml.replace("<title>Nexus of Thought</title>", ogMeta);
      } else {
        modifiedHtml = indexHtml.replace("<head>", `<head>${ogMeta}`);
      }

      // Write to dist/post/[slug]/index.html
      const outPostHtmlDir = path.join(distDir, 'post', slug);
      fs.mkdirSync(outPostHtmlDir, { recursive: true });
      fs.writeFileSync(path.join(outPostHtmlDir, 'index.html'), modifiedHtml, 'utf8');
      console.log(`✓ Pre-rendered: /post/${slug}/index.html`);
    }

    // 4. Generate graph API endpoint
    const nodes = Object.values(postDetailsCache).map(post => ({
      id: post.slug,
      title: post.metadata.title,
      tags: post.metadata.tags || [],
      group: 1
    }));

    const links = [];
    const slugs = nodes.map(n => n.id);

    Object.values(postDetailsCache).forEach(post => {
      slugs.forEach(targetSlug => {
        if (targetSlug === post.slug) return;
        if (post.raw.includes(`/${targetSlug}`) || post.raw.includes(`./${targetSlug}`)) {
          links.push({
            source: post.slug,
            target: targetSlug,
            value: 1
          });
        }
      });
    });

    const graphJson = { nodes, links };
    fs.writeFileSync(path.join(distDir, 'api', 'graph'), JSON.stringify(graphJson, null, 2), 'utf8');
    fs.writeFileSync(path.join(distDir, 'api', 'graph.json'), JSON.stringify(graphJson, null, 2), 'utf8');

    console.log("Static API generation complete!");
  } catch (err) {
    console.error("Prerender/API generation error:", err);
  }
}

run();
