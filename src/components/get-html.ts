"use server";

import { JSDOM } from "jsdom";
import axios from "axios";

export type attributes = {
  [key: string]: string;
};

export type TElement = {
  tag: string;
  attributes?: attributes;
  children: TElement[] | TElement | string;
};

function getAttributes(attributes: NamedNodeMap) {
  const result: attributes = {};
  for (let i = 0; i < attributes.length; i++) {
    const attribute = attributes[i];
    result[attribute.name] = attribute.value;
  }
  return result;
}

export async function hasAnyTag(html: string) {
  const reg = /<[^>]*>/;
  const match = html.match(reg);
  if (match) {
    return true;
  }
  return false;
}

export async function getElements(html: string): Promise<TElement[]> {
  const dom = new JSDOM(html);
  const parentElements = dom.window.document.body.children;
  const result: TElement[] = [];
  for (let i = 0; i < parentElements.length; i++) {
    const element = parentElements[i];
    const tag = element.tagName.toLowerCase();
    const children = element.children;
    const attributes = element.attributes;
    if (children.length > 0) {
      const childElements = await getElements(element.innerHTML);
      result.push({
        tag,
        attributes: getAttributes(attributes),
        children: childElements,
      });
    } else {
      result.push({
        tag,
        attributes: getAttributes(attributes),
        children: element.innerHTML,
      });
    }
  }
  return new Promise((resolve) => {
    resolve(result);
  });
}

export async function isYoutubeLink(link: string) {
  // https://www.youtube.com/watch?v=3s3v3s3
  // https://youtu.be/3s3v3s3
  // https://www.youtube.com/shorts/E-hV85YbLQM
  const reg = /https?:\/\/(www\.)?youtube\.com\/watch\?v=([^\s]+)/;
  const reg2 = /https?:\/\/youtu\.be\/([^\s]+)/;
  const reg3 = /https?:\/\/www\.youtube\.com\/shorts\/([^\s]+)/;
  const match = link.match(reg);
  const match2 = link.match(reg2);
  const match3 = link.match(reg3);
  if (match || match2 || match3) {
    return true;
  }
  return false;
}

export async function isInstagramLink(link: string) {
  const reg = /https?:\/\/www\.instagram\.com\/p\/([^\s]+)/;
  const match = link.match(reg);
  if (match) {
    return true;
  }
  return false;
}

export async function getInstagramEmbed(link: string) {
  const reg = /https?:\/\/www\.instagram\.com\/p\/([^\/\?]+)/;
  const match = link.match(reg);
  if (match) {
    return `<iframe src="https://www.instagram.com/p/${match[1]}/embed/" allowtransparency="true" allowfullscreen="true" frameborder="0" height="436" data-instgrm-payload-id="instagram-media-payload-0" scrolling="no" style="background-color: white; border-radius: 3px; border: 1px solid rgb(219, 219, 219); box-shadow: none; display: block; margin: 0px 0px 12px; min-width: 326px; width: 100%; height: 800px; padding: 0px;"></iframe>`;
  }
  return "";
}

export async function isTwitterLink(link: string) {
  // https://x.com/yeww0912/status/1768911130330874166?s=20
  // https://twitter.com/heunghacnayo/status/1768814222262391129?t=z7BVA5C7tRMPKn5a-vBf-Q&s=19
  // https://twitter.com/catchefff/status/1768871023494209743?t=xxo5woCAobTUHy5tb4NBNA&s=19
  // https://twitter.com/Reza_Zadeh/status/1344009123004747778?ref_src=twsrc%5Etfw%7Ctwcamp%5Etweetembed%7Ctwterm%5E1344009123004747778%7Ctwgr%5E78743380d27d5fe2908813f1f73795b06761b765%7Ctwcon%5Es1_&ref_url=https%3A%2F%2Fiframely.net%2FCFRzKmU%3Fapp%3D1demo%3D1

  const reg = /https?:\/\/twitter\.com\/[^\s]+\/status\/([^\s]+)/;
  // x is new name of twitter
  const reg2 = /https?:\/\/x\.com\/[^\s]+\/status\/([^\s]+)/;
  const reg3 = /https?:\/\/twitter\.com\/[^\s]+\/status\/([^\s]+)\?t=[^\s]+/;
  const match = link.match(reg);
  const match2 = link.match(reg2);
  const match3 = link.match(reg3);
  if (match || match2 || match3) {
    return true;
  }
  return false;
}

export async function getTwitterEmbed(link: string) {
  try {
    const response = await axios.get(
      "https://publish.twitter.com/oembed?url=" + link
    );
    return response.data.html;
  } catch (e) {
    console.log("error", e);
    return "";
  }
}

export async function getYoutubeVideoId(link: string) {
  const reg = /https?:\/\/(www\.)?youtube\.com\/watch\?v=([^\s]+)/;
  const reg2 = /https?:\/\/youtu\.be\/([^\s]+)/;
  const reg3 = /https?:\/\/www\.youtube\.com\/shorts\/([^\s]+)/;
  const match = link.match(reg);
  const match2 = link.match(reg2);
  const match3 = link.match(reg3);
  if (match) {
    return match[2];
  }
  if (match2) {
    return match2[1];
  }
  if (match3) {
    return match3[1];
  }
  return "";
}

export async function isLegacyImage(link: string) {
  const match = link.includes("https://dongsaroma.com/data");
  if (match) {
    return true;
  }
  return false;
}

export async function changeLegacyImageToNew(link: string) {
  const newLink = link.replace(
    "https://dongsaroma.com/data",
    "http://210.180.118.214/data"
  );
  return newLink;
}

export async function getYoutubeEmbed(link: string) {
  const videoId = await getYoutubeVideoId(link);
  return `<iframe width="100%" height="315" src="https://www.youtube.com/embed/${videoId}" width="100%" height="550px" style="height:550px;" allowfullscreen="true" allowscriptaccess="always" scrolling="no" frameborder="0"></iframe>`;
}

export async function renderElements(
  elements: TElement | TElement[] | string
): Promise<string> {
  if (typeof elements === "string") {
    // return <span dangerouslySetInnerHTML={{ __html: elements }} />;
    return new Promise((resolve) => {
      resolve(`<span>${elements}</span>`);
    });
  }
  if (Array.isArray(elements)) {
    let html = "";
    for (let i = 0; i < elements.length; i++) {
      html += await renderElements(elements[i]);
    }
    return html;
  }

  let { tag, attributes, children } = elements;
  let embedItem = "";
  if (tag === "a" && attributes?.href !== undefined) {
    attributes = {
      ...attributes,
      target: "_blank",
      style:
        "color: blue; text-decoration: underline; cursor: pointer; text-wrap: wrap; word-break: break-all;",
    };
    const link = attributes.href;
    if (await isYoutubeLink(link)) {
      embedItem = await getYoutubeEmbed(link);
    }
    if (await isInstagramLink(link)) {
      embedItem = await getInstagramEmbed(link);
    }
    if (await isTwitterLink(link)) {
      embedItem = await getTwitterEmbed(link);
    }
  }
  if (tag === "img" && attributes?.src !== undefined) {
    const link = attributes.src;
    if (await isLegacyImage(link)) {
      attributes.src = await changeLegacyImageToNew(link);
    }
  }
  let html = "";
  html += `<${tag}`;
  for (const key in attributes) {
    html += ` ${key}="${attributes[key]}"`;
  }
  html += ">";
  if (typeof children === "string") {
    html += children;
  } else {
    html += await renderElements(children);
  }
  html += `</${tag}>`;
  html += embedItem;
  return html;
}
