import fs from "fs";
import path from "path";
import marked from "marked";
import hljs from "highlight.js/lib/core";
// import and register javascript highlighting
// if more langauges are needed they have to be added here
import javascript from "highlight.js/lib/languages/javascript";
hljs.registerLanguage("javascript", javascript);

require("svelte/register");

import { HeroHeader, SubHeader, Paragraph, Link, Listing } from "component-lib";

export function get_post(slug) {
  return getMarkdownContent(slug);
}

export function get_posts() {
  // read dir with the posts
  return (
    fs
      .readdirSync("static/posts")
      .map((file) => {
        // map them to markdown and metadata
        if (path.extname(file) !== ".md") return;
        const slug = path.parse(file).name;
        return getMarkdownContent(slug);
      })
      // sort them by pubdate
      .sort((a, b) =>
        new Date(a.metadata.pubdate) < new Date(b.metadata.pubdate) ? 1 : -1
      )
  );
}

function getMarkdownContent(slug) {
  // open the the file
  const markdown = fs.readFileSync(`static/posts/${slug}.md`, "utf-8");
  // extract the metadata
  const { content, metadata } = extract_frontmatter(markdown);
  metadata.slug = slug;
  // create marked renderer
  const renderer = new marked.Renderer();
  // customize renderer
  renderer.code = (code, language) => {
    // highlight code before giving it to the component
    code = hljs.highlight(language, code).value;
    const { html } = Listing.render({ code, language });
    return html;
  };
  renderer.link = (href, _title, text) => {
    const { html } = Link.render({ href, text });
    return html;
  };
  renderer.paragraph = (text) => {
    const { html } = Paragraph.render({ content: text });
    return html;
  };
  renderer.heading = (text, level) => {
    switch (level) {
      case 1: {
        const { html } = HeroHeader.render({ header: text });
        return html;
      }
      case 2: {
        const { html } = SubHeader.render({ header: text });
        return html;
      }
      default:
        throw new Error("unhandeled heading level");
    }
  };
  // remove tabs and add custom renderer
  const html = marked(
    content.replace(/^\t+/gm, (match) => match.split("\t").join("  ")),
    { renderer }
  );

  return {
    html,
    metadata,
  };
}

function extract_frontmatter(markdown) {
  const match = /---\r?\n([\s\S]+?)\r?\n---/.exec(markdown);
  const frontMatter = match[1];
  const content = markdown.slice(match[0].length);

  const metadata = {};
  frontMatter.split("\n").forEach((pair) => {
    const colonIndex = pair.indexOf(":");
    metadata[pair.slice(0, colonIndex).trim()] = pair
      .slice(colonIndex + 1)
      .trim();
  });

  return { metadata, content };
}
