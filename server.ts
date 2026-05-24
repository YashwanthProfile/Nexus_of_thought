import express from "express";
import path from "path";
import fs from "fs/promises";
import matter from "gray-matter";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // In-memory cache for posts and content
  let postsCache: any[] | null = null;
  let postDetailsCache: Record<string, any> = {};
  const contentDir = path.join(process.cwd(), "content");

  const getPosts = async () => {
    if (postsCache) return postsCache;
    
    try {
      const files = await fs.readdir(contentDir);
      const posts = await Promise.all(
        files
          .filter((file) => file.endsWith(".md"))
          .map(async (file) => {
            const slug = file.replace(".md", "");
            const filePath = path.join(contentDir, file);
            const content = await fs.readFile(filePath, "utf-8");
            const { data, content: markdown } = matter(content);
            
            // Populate details cache while we are at it
            postDetailsCache[slug] = {
              slug,
              metadata: data,
              content: markdown,
              raw: content
            };

            return {
              slug,
              ...(data as any),
            };
          })
      );
      posts.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
      postsCache = posts;
      return posts;
    } catch (error) {
      console.error("Error loading posts:", error);
      return [];
    }
  };

  // API to list all blog posts
  app.get(["/api/posts", "/api/posts.json"], async (req, res) => {
    const posts = await getPosts();
    res.json(posts);
  });

  // API to get a single post
  app.get(["/api/posts/:slug", "/api/posts/:slug.json"], async (req, res) => {
    try {
      let { slug } = req.params;
      if (slug.endsWith(".json")) {
        slug = slug.slice(0, -5);
      }
      await getPosts(); // Ensure cache is warm

      const post = postDetailsCache[slug];
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }

      // Find backlinks from cache
      const backlinks = Object.values(postDetailsCache)
        .filter((p) => p.slug !== slug)
        .filter((p) => p.raw.includes(`/${slug}`) || p.raw.includes(`./${slug}`))
        .map((p) => ({
          slug: p.slug,
          title: p.metadata.title,
          summary: p.metadata.summary
        }));

      res.json({
        slug,
        metadata: post.metadata,
        content: post.content,
        backlinks: backlinks,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to load post" });
    }
  });

  // Graph endpoint for Obsidian-like graph view
  app.get(["/api/graph", "/api/graph.json"], async (req, res) => {
    try {
      await getPosts(); // Ensure cache is warm
      
      const nodes = Object.values(postDetailsCache).map(post => ({
        id: post.slug,
        title: post.metadata.title,
        tags: post.metadata.tags || [],
        group: 1
      }));

      const links: any[] = [];
      const slugs = nodes.map(n => n.id);

      Object.values(postDetailsCache).forEach(post => {
        slugs.forEach(targetSlug => {
          if (targetSlug === post.slug) return;
          
          // Check for links in content
          if (post.raw.includes(`/${targetSlug}`) || post.raw.includes(`./${targetSlug}`)) {
            links.push({
              source: post.slug,
              target: targetSlug,
              value: 1
            });
          }
        });
      });

      res.json({ nodes, links });
    } catch (error) {
      res.status(500).json({ error: "Failed to generate graph data" });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });

    app.get("/post/:slug", async (req, res, next) => {
      try {
        const { slug } = req.params;
        await getPosts();
        const post = postDetailsCache[slug];
        if (!post) return next();

        const indexRaw = await fs.readFile(path.join(process.cwd(), "index.html"), "utf-8");
        const html = await vite.transformIndexHtml(req.originalUrl, indexRaw);

        const title = post.metadata.title || "Nexus of Thought";
        const description = post.metadata.summary || "Research & Deep Dives";
        const heroImage = post.metadata.heroImage || "";

        const ogMeta = `
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    ${heroImage ? `<meta property="og:image" content="${heroImage}" />` : ''}
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${req.protocol}://${req.get('host')}${req.originalUrl}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    ${heroImage ? `<meta name="twitter:image" content="${heroImage}" />` : ''}
`;
        let modifiedHtml = html;
        if (html.includes("<title>Nexus of Thought</title>")) {
          modifiedHtml = html.replace("<title>Nexus of Thought</title>", ogMeta);
        } else {
          modifiedHtml = html.replace("<head>", `<head>${ogMeta}`);
        }
        res.status(200).set({ "Content-Type": "text/html" }).end(modifiedHtml);
      } catch (err) {
        console.error("Error serving dev post meta:", err);
        next();
      }
    });

    app.use(vite.middlewares);
  } else {
    app.get("/post/:slug", async (req, res, next) => {
      try {
        const { slug } = req.params;
        await getPosts();
        const post = postDetailsCache[slug];
        if (!post) return next();

        const html = await fs.readFile(path.join(process.cwd(), "dist", "index.html"), "utf-8");

        const title = post.metadata.title || "Nexus of Thought";
        const description = post.metadata.summary || "Research & Deep Dives";
        const heroImage = post.metadata.heroImage || "";

        const ogMeta = `
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    ${heroImage ? `<meta property="og:image" content="${heroImage}" />` : ''}
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${req.protocol}://${req.get('host')}${req.originalUrl}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    ${heroImage ? `<meta name="twitter:image" content="${heroImage}" />` : ''}
`;
        let modifiedHtml = html;
        if (html.includes("<title>Nexus of Thought</title>")) {
          modifiedHtml = html.replace("<title>Nexus of Thought</title>", ogMeta);
        } else {
          modifiedHtml = html.replace("<head>", `<head>${ogMeta}`);
        }
        res.status(200).set({ "Content-Type": "text/html" }).end(modifiedHtml);
      } catch (err) {
        console.error("Error serving prod post meta:", err);
        next();
      }
    });

    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
