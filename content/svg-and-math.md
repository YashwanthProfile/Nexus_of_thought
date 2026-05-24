---
title: "The Art of SVG and Mathematical Figures"
date: "2024-05-10"
summary: "How to use SVGs and LaTeX to create beautiful, vector-based mathematical illustrations for your technical blog."
tags: ["Design", "LaTeX", "SVG"]
authorId: "c_shannon"
contributors: ["l_euler", "jd_doe"]
---

# The Art of SVG and Mathematical Figures

In technical writing, a picture is worth a thousand words—especially if that picture is a vector graphic that doesn't pixelate.

## Embedding SVGs

You can embed SVGs directly or use images. Here is a simple circle SVG rendered via Markdown:

<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="40" stroke="black" stroke-width="3" fill="red" />
</svg>

## Complex Equations

When dealing with complex geometry, LaTeX is your best friend:

The volume of a sphere is given by:

$$ E = mc^2 $$

Wait, that's not volume. The volume is:

$$ V = \frac{4}{3}\pi r^3 $$

## References and Citations

According to [Weng (2020)](https://lilianweng.github.io/posts/2020-01-29-curriculum-learning/), curriculum learning is quite effective.

We can also cite our own deep dives. See our previous post on [Attention](./understanding-attention) or our notes on [Kalman Filters](./kalman-filter).

### Footnotes

This is a claim that needs a footnote.[^1]

[^1]: This is the footnote content.
